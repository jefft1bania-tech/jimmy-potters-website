import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Orders — Jimmy Potters' };

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmtCents = (c: number | null | undefined) => USD.format((c ?? 0) / 100);
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

type OrderItemRow = {
  product_id: string;
  name: string;
  unit_price_cents: number;
  quantity: number;
  image: string | null;
};

type ShipmentRow = {
  tracking_number: string | null;
  carrier: 'fedex' | 'usps' | 'ups' | 'local' | null;
  shipment_status:
    | 'queued'
    | 'in_production'
    | 'packed'
    | 'shipped'
    | 'in_transit'
    | 'delivered'
    | 'delayed';
};

type OrderRow = {
  id: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'refunded' | 'cancelled';
  total_cents: number;
  subtotal_cents: number;
  sales_tax_cents: number;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  shipping: { name?: string; line1?: string; city?: string; state?: string; postalCode?: string } | null;
  order_items: OrderItemRow[];
  shipments: ShipmentRow | ShipmentRow[] | null;
};

const STATUS_LABEL: Record<OrderRow['status'], string> = {
  pending: 'Awaiting payment',
  paid: 'Paid · in production',
  shipped: 'Shipped',
  delivered: 'Delivered',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

const STATUS_PILL: Record<OrderRow['status'], string> = {
  pending: 'bg-amber-100 text-amber-900',
  paid: 'bg-blue-100 text-blue-900',
  shipped: 'bg-indigo-100 text-indigo-900',
  delivered: 'bg-emerald-100 text-emerald-900',
  refunded: 'bg-stone-200 text-stone-700',
  cancelled: 'bg-stone-200 text-stone-700',
};

function trackingUrl(carrier: ShipmentRow['carrier'], tracking: string): string | null {
  if (!tracking) return null;
  if (carrier === 'fedex') return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(tracking)}`;
  if (carrier === 'usps') return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(tracking)}`;
  if (carrier === 'ups') return `https://www.ups.com/track?tracknum=${encodeURIComponent(tracking)}`;
  return null;
}

function pickShipment(s: OrderRow['shipments']): ShipmentRow | null {
  if (!s) return null;
  return Array.isArray(s) ? (s[0] ?? null) : s;
}

export default async function OrdersPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/account/orders');
  }

  // RLS scopes this to the current user (orders_self_select uses auth.uid()).
  const { data, error } = await supabase
    .from('orders')
    .select(
      `id, status, total_cents, subtotal_cents, sales_tax_cents,
       created_at, paid_at, shipped_at, delivered_at, shipping,
       order_items (product_id, name, unit_price_cents, quantity, image),
       shipments (tracking_number, carrier, shipment_status)`,
    )
    .order('created_at', { ascending: false });

  const orders = (data as unknown as OrderRow[] | null) ?? [];

  return (
    <div className="shop-section">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading font-black text-2xl md:text-3xl text-brand-text">
            My Orders
          </h1>
          <Link href="/account" className="text-sm font-body text-stone-600 hover:text-brand-text underline">
            ← Back to account
          </Link>
        </div>

        {error && (
          <div className="card-faire-detail p-6 mb-6 border border-red-200 bg-red-50">
            <p className="text-red-800 font-body text-sm">
              Could not load orders: {error.message}
            </p>
          </div>
        )}

        {!error && orders.length === 0 && (
          <div className="card-faire-detail p-12 text-center">
            <div className="text-4xl mb-4">🏺</div>
            <h2 className="font-heading font-bold text-lg text-brand-text mb-2">
              No orders yet
            </h2>
            <p className="text-black font-body mb-6">
              When you place an order, it will show up here with status, items, and tracking.
            </p>
            <Link href="/shop" className="btn-vibrant inline-block">
              Shop Pottery
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {orders.map((o) => {
            const ship = pickShipment(o.shipments);
            const trackUrl = ship?.tracking_number ? trackingUrl(ship.carrier, ship.tracking_number) : null;
            return (
              <div key={o.id} className="card-vibrant overflow-hidden">
                <div className="p-5 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="font-heading font-bold text-sm text-brand-text">
                        Order placed {fmtDate(o.created_at)}
                      </p>
                      <p className="font-mono text-xs text-stone-500 mt-1">
                        #{o.id.slice(0, 8)}
                      </p>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-heading font-bold ${STATUS_PILL[o.status]}`}
                    >
                      {STATUS_LABEL[o.status]}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-4">
                    {o.order_items.map((item) => (
                      <li key={`${o.id}-${item.product_id}`} className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-14 h-14 rounded-xl object-cover bg-gray-100"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-xl">
                            🏺
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-bold text-sm text-brand-text truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-black font-body">
                            Qty {item.quantity} · {fmtCents(item.unit_price_cents)} each
                          </p>
                        </div>
                        <p className="font-heading font-bold text-sm text-brand-text">
                          {fmtCents(item.unit_price_cents * item.quantity)}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-stone-200 pt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-body text-black">
                      <span className="text-stone-500">Total:</span>{' '}
                      <span className="font-heading font-bold text-brand-text">
                        {fmtCents(o.total_cents)}
                      </span>
                      {o.sales_tax_cents > 0 && (
                        <span className="text-stone-500 ml-2">
                          (incl. {fmtCents(o.sales_tax_cents)} tax)
                        </span>
                      )}
                    </div>
                    {trackUrl && (
                      <a
                        href={trackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-heading font-bold text-vibrant-purple hover:underline"
                      >
                        Track shipment →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  computeOrderPnl,
  type PnlOrder,
  type ProductCostTemplate,
  type OrderCostOverride,
} from '@/lib/pnl';
import {
  forecastOrderLabor,
  type LaborRole,
  type ProductLaborTime,
} from '@/lib/labor/forecast';
import MarkPaidButton from './MarkPaidButton';
import CostOverrideForm from './CostOverrideForm';
import BulkToggleCard from './BulkToggleCard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Order Detail — Admin — Jimmy Potters', robots: 'noindex, nofollow' };

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmtCents = (c: number | null | undefined) => USD.format((c ?? 0) / 100);

type OrderRow = {
  id: string;
  created_at: string;
  status: PnlOrder['status'];
  email: string;
  type: 'guest' | 'registered';
  shipping: {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  buyer_state: string;
  subtotal_cents: number;
  sales_tax_cents: number;
  shipping_cost_cents: number;
  internal_shipping_cost_cents: number;
  total_cents: number;
  payment_method: PnlOrder['payment_method'];
  stripe_fee_cents: number | null;
  stripe_payment_intent_id: string | null;
  is_bulk: boolean;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  refunded_at: string | null;
};

type ItemRow = {
  id: string;
  product_id: string;
  name: string;
  unit_price_cents: number;
  quantity: number;
  image: string | null;
};

type ShipmentRow = {
  order_id: string;
  required_ship_by: string | null;
  shipment_status: string | null;
  flag: string | null;
  carrier: string | null;
  tracking_number: string | null;
  notes: string | null;
};

type PaymentRow = {
  id: string;
  provider: string;
  amount_cents: number;
  received_on: string;
  notes: string | null;
  created_at: string;
};

async function loadOrder(id: string) {
  const supabase = createSupabaseAdminClient();

  const [orderRes, itemsRes] = await Promise.all([
    supabase.from('orders').select('*').eq('id', id).maybeSingle(),
    supabase.from('order_items').select('id, product_id, name, unit_price_cents, quantity, image').eq('order_id', id),
  ]);

  const order = orderRes.data as OrderRow | null;
  if (!order) return null;

  const items = (itemsRes.data ?? []) as ItemRow[];
  const productIds = Array.from(new Set(items.map((i) => i.product_id)));

  const [shipmentRes, paymentsRes, overrideRes, bulkRes, templatesRes, rolesRes, laborTimesRes] = await Promise.all([
    supabase.from('shipments').select('*').eq('order_id', id).maybeSingle(),
    supabase.from('payment_records').select('*').eq('order_id', id).order('received_on', { ascending: false }),
    supabase.from('order_cost_overrides').select('*').eq('order_id', id).maybeSingle(),
    supabase.from('bulk_order_pricing').select('*').eq('order_id', id).maybeSingle(),
    productIds.length > 0
      ? supabase.from('product_costs').select('*').in('product_id', productIds)
      : Promise.resolve({ data: [] as ProductCostTemplate[] }),
    supabase.from('labor_roles').select('id, role_key, display_name, default_hourly_rate_cents, tax_treatment'),
    productIds.length > 0
      ? supabase.from('product_labor_times').select('product_id, role_id, minutes_per_unit').in('product_id', productIds)
      : Promise.resolve({ data: [] as ProductLaborTime[] }),
  ]);

  return {
    order,
    items,
    shipment: (shipmentRes.data as ShipmentRow | null) ?? null,
    payments: (paymentsRes.data ?? []) as PaymentRow[],
    override: (overrideRes.data as OrderCostOverride | null) ?? null,
    bulk: (bulkRes.data as {
      customer_type: string;
      tier_discount_pct: number | null;
      volume_unit_cost_cents: number | null;
      notes: string | null;
    } | null) ?? null,
    templates: (templatesRes.data ?? []) as ProductCostTemplate[],
    roles: (rolesRes.data ?? []) as LaborRole[],
    laborTimes: (laborTimesRes.data ?? []) as ProductLaborTime[],
    productIds,
  };
}

function StatusBadge({ status }: { status: PnlOrder['status'] }) {
  const tone: Record<PnlOrder['status'], string> = {
    pending:   'bg-amber-500/10   border-amber-500/40   text-amber-200',
    paid:      'bg-emerald-500/10 border-emerald-500/40 text-emerald-200',
    shipped:   'bg-sky-500/10     border-sky-500/40     text-sky-200',
    delivered: 'bg-stone-500/10   border-stone-500/40   text-stone-200',
    refunded:  'bg-red-500/10     border-red-500/40     text-red-200',
    cancelled: 'bg-stone-700/20   border-stone-700/40   text-stone-400',
  };
  return (
    <span className={`inline-block rounded-full border text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 ${tone[status]}`}>
      {status}
    </span>
  );
}

function sumTemplateTotals(items: ItemRow[], templates: ProductCostTemplate[]) {
  const templateMap = new Map(templates.map((t) => [t.product_id, t]));
  let materials_cents = 0, labor_cents = 0, packaging_cents = 0, freight_cents = 0, other_cents = 0;
  for (const item of items) {
    const t = templateMap.get(item.product_id);
    if (!t) continue;
    materials_cents += t.materials_cents * item.quantity;
    labor_cents     += t.labor_cents     * item.quantity;
    packaging_cents += t.packaging_cents * item.quantity;
    freight_cents   += t.freight_cents   * item.quantity;
    other_cents     += t.other_cents     * item.quantity;
  }
  return { materials_cents, labor_cents, packaging_cents, freight_cents, other_cents };
}

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const data = await loadOrder(params.id);
  if (!data) notFound();

  const { order, items, shipment, payments, override, bulk, templates, roles, laborTimes, productIds } = data;

  const coveredIds = new Set(templates.map((t) => t.product_id));
  const uncovered = productIds.filter((id) => !coveredIds.has(id));
  const hasUncoveredSkus = uncovered.length > 0;

  const templateTotals = sumTemplateTotals(items, templates);

  const pnlOrder: PnlOrder = {
    id: order.id,
    created_at: order.created_at,
    status: order.status,
    subtotal_cents: order.subtotal_cents,
    sales_tax_cents: order.sales_tax_cents,
    total_cents: order.total_cents,
    internal_shipping_cost_cents: order.internal_shipping_cost_cents,
    stripe_fee_cents: order.stripe_fee_cents,
    buyer_state: order.buyer_state,
    payment_method: order.payment_method,
    items: items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price_cents: i.unit_price_cents,
    })),
  };
  const templateMap = new Map(templates.map((t) => [t.product_id, t]));
  const pnl = computeOrderPnl(pnlOrder, templateMap, override);

  const forecast = forecastOrderLabor(
    items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    roles,
    laborTimes,
  );

  const ship = order.shipping ?? {};
  const shortId = order.id.slice(0, 8);

  const netRevenue = order.total_cents - order.sales_tax_cents - (order.stripe_fee_cents ?? 0);
  const grossProfit = pnl.gross_profit;

  const plainEnglishForecast = (() => {
    if (forecast.per_role.length === 0) {
      return forecast.has_missing_times
        ? 'No labor data yet — fill product_labor_times to see forecast.'
        : 'No labor required.';
    }
    const top = forecast.per_role[0];
    const days = Math.max(1, Math.ceil(top.minutes / (8 * 60)));
    const noun = top.display_name.toLowerCase();
    return `≈ ${top.suggested_workers} ${noun} × ${days} day${days === 1 ? '' : 's'} to fulfill`;
  })();

  const canMarkPaid = (order.payment_method === 'venmo' || order.payment_method === 'paypal') && order.status === 'pending';

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        <header className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">Admin · Order</p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight font-mono">#{shortId}</h1>
            <p className="text-stone-400 text-sm font-body mt-2 flex items-center gap-2 flex-wrap">
              <StatusBadge status={order.status} />
              <span>{new Date(order.created_at).toLocaleString()}</span>
              <span className="text-stone-600">·</span>
              <span>{order.payment_method}</span>
              {order.is_bulk && (
                <span className="inline-block rounded-full bg-indigo-500/10 border border-indigo-500/40 text-indigo-200 text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5">bulk</span>
              )}
              {bulk && (
                <span className="text-stone-500 text-xs">({bulk.customer_type})</span>
              )}
            </p>
          </div>
          <Link href="/admin/orders" className="text-stone-400 text-xs font-body underline-offset-4 hover:underline">← Orders</Link>
        </header>

        <BulkToggleCard orderId={order.id} isBulk={order.is_bulk} bulk={bulk} />

        {/* Panel 1 — Overview */}
        <section className="card-faire-detail p-6 border border-stone-700/40 mb-6">
          <h2 className="font-heading font-black text-white text-lg mb-4">Overview</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500 mb-1">Buyer</p>
              <p className="text-stone-200 text-sm font-body">{ship.name ?? '—'}</p>
              <p className="text-stone-400 text-xs font-body">{order.email}</p>
              <p className="text-stone-500 text-[10px] font-body mt-1">{order.type} checkout</p>
            </div>
            <div>
              <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500 mb-1">Shipping address</p>
              <p className="text-stone-300 text-sm font-body">{ship.line1 ?? '—'}</p>
              {ship.line2 && <p className="text-stone-300 text-sm font-body">{ship.line2}</p>}
              <p className="text-stone-300 text-sm font-body">
                {[ship.city, ship.state, ship.postalCode].filter(Boolean).join(', ')}
              </p>
              <p className="text-stone-500 text-xs font-body">{ship.country ?? ''}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500 mb-2">Items</p>
            <ul className="divide-y divide-stone-800 border border-stone-800 rounded">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between items-center px-3 py-2 text-sm">
                  <span className="text-stone-200">
                    <span className="font-mono text-stone-500 text-xs mr-2">{i.product_id}</span>
                    {i.name} <span className="text-stone-500">× {i.quantity}</span>
                  </span>
                  <span className="text-stone-300 font-mono">{fmtCents(i.unit_price_cents * i.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500 mb-2">Totals</p>
              <dl className="text-sm font-body space-y-1">
                <div className="flex justify-between"><dt className="text-stone-400">Subtotal</dt><dd className="text-stone-200 font-mono">{fmtCents(order.subtotal_cents)}</dd></div>
                <div className="flex justify-between"><dt className="text-stone-400">Sales tax</dt><dd className="text-stone-200 font-mono">{fmtCents(order.sales_tax_cents)}</dd></div>
                <div className="flex justify-between"><dt className="text-stone-400">Shipping charged</dt><dd className="text-stone-200 font-mono">{fmtCents(order.shipping_cost_cents)}</dd></div>
                <div className="flex justify-between border-t border-stone-800 pt-1 mt-1">
                  <dt className="text-stone-300 font-heading font-bold">Total</dt>
                  <dd className="text-white font-mono">{fmtCents(order.total_cents)}</dd>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-800 mt-2">
                  <dt className="text-stone-500">Stripe fee</dt>
                  <dd className="text-stone-400 font-mono">{fmtCents(order.stripe_fee_cents ?? 0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Internal FedEx</dt>
                  <dd className="text-stone-400 font-mono">{fmtCents(order.internal_shipping_cost_cents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Net revenue (ex tax/fee)</dt>
                  <dd className="text-stone-300 font-mono">{fmtCents(netRevenue)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-400">Gross profit</dt>
                  <dd className={`font-mono ${grossProfit < 0 ? 'text-red-300' : 'text-emerald-300'}`}>{fmtCents(grossProfit)}</dd>
                </div>
              </dl>
            </div>
            <div>
              <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500 mb-2">Payment</p>
              <dl className="text-sm font-body space-y-1">
                <div className="flex justify-between"><dt className="text-stone-400">Method</dt><dd className="text-stone-200">{order.payment_method}</dd></div>
                <div className="flex justify-between"><dt className="text-stone-400">Status</dt><dd><StatusBadge status={order.status} /></dd></div>
                {order.stripe_payment_intent_id && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-stone-400 flex-shrink-0">Stripe PI</dt>
                    <dd className="text-stone-300 font-mono text-xs truncate">{order.stripe_payment_intent_id}</dd>
                  </div>
                )}
                {order.paid_at && (
                  <div className="flex justify-between"><dt className="text-stone-400">Paid at</dt><dd className="text-stone-300 text-xs">{new Date(order.paid_at).toLocaleString()}</dd></div>
                )}
              </dl>

              {payments.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500 mb-1">Payment records</p>
                  <ul className="text-xs font-body text-stone-300 space-y-1">
                    {payments.map((p) => (
                      <li key={p.id} className="flex justify-between gap-2">
                        <span>{p.received_on} · {p.provider} {p.notes ? `· ${p.notes}` : ''}</span>
                        <span className="font-mono">{fmtCents(p.amount_cents)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {canMarkPaid && (
                <div className="mt-4">
                  <MarkPaidButton
                    orderId={order.id}
                    provider={order.payment_method as 'venmo' | 'paypal'}
                    defaultAmountCents={order.total_cents}
                  />
                </div>
              )}
            </div>
          </div>

          {shipment && (
            <div className="mt-6">
              <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500 mb-1">Shipment</p>
              <p className="text-sm text-stone-300 font-body">
                {shipment.shipment_status ?? 'queued'}
                {shipment.required_ship_by && <span className="text-stone-500"> · ship by {shipment.required_ship_by}</span>}
                {shipment.flag && shipment.flag !== 'normal' && <span className="text-amber-300"> · {shipment.flag}</span>}
                {shipment.tracking_number && <span className="text-stone-400"> · {shipment.carrier ?? 'carrier'} {shipment.tracking_number}</span>}
              </p>
              {shipment.notes && <p className="text-stone-500 text-xs font-body mt-1">{shipment.notes}</p>}
            </div>
          )}
        </section>

        {/* Panel 2 — Labor Forecast */}
        <section className="card-faire-detail p-6 border border-stone-700/40 mb-6">
          <h2 className="font-heading font-black text-white text-lg mb-1">Labor Forecast</h2>
          <p className="text-stone-400 text-sm font-body mb-4">{plainEnglishForecast}</p>

          {forecast.has_missing_times && (
            <p className="mb-4 inline-block rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5">
              Missing minutes_per_unit for one or more SKU/role pairs
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="text-left px-2 py-1">Role</th>
                  <th className="text-right px-2 py-1">Minutes</th>
                  <th className="text-right px-2 py-1">Hours</th>
                  <th className="text-right px-2 py-1">Base cost</th>
                  <th className="text-right px-2 py-1">Burden</th>
                  <th className="text-right px-2 py-1">Total cost</th>
                  <th className="text-right px-2 py-1">Workers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {forecast.per_role.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-4 text-stone-500">—</td></tr>
                )}
                {forecast.per_role.map((r) => (
                  <tr key={r.role_id}>
                    <td className="px-2 py-1.5 text-stone-200">{r.display_name}</td>
                    <td className="px-2 py-1.5 text-right text-stone-300 font-mono">{r.minutes}</td>
                    <td className="px-2 py-1.5 text-right text-stone-300 font-mono">{r.hours}</td>
                    <td className="px-2 py-1.5 text-right text-stone-400 font-mono">{fmtCents(r.base_cost_cents)}</td>
                    <td className="px-2 py-1.5 text-right text-stone-500 font-mono">{fmtCents(r.employer_burden_cents)}</td>
                    <td className="px-2 py-1.5 text-right text-stone-200 font-mono">{fmtCents(r.total_cost_cents)}</td>
                    <td className="px-2 py-1.5 text-right text-stone-300">{r.suggested_workers}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-400">
                <tr className="border-t border-stone-700/60">
                  <td className="px-2 py-2">Totals</td>
                  <td className="px-2 py-2 text-right font-mono">{forecast.total_minutes}</td>
                  <td className="px-2 py-2 text-right font-mono">{forecast.total_hours}</td>
                  <td colSpan={2} />
                  <td className="px-2 py-2 text-right font-mono text-stone-200">{fmtCents(forecast.total_labor_cost_cents)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Panel 3 — Cost Override */}
        <section className="card-faire-detail p-6 border border-stone-700/40 mb-6">
          <h2 className="font-heading font-black text-white text-lg mb-1">Cost Override</h2>
          <p className="text-stone-400 text-sm font-body mb-4">
            Template sums populate the form. Override any field for this order. COGS used in P&L math = {fmtCents(pnl.cogs_total)}.
          </p>
          <CostOverrideForm
            orderId={order.id}
            templateTotals={templateTotals}
            existingOverride={override}
            internalShippingCostCents={order.internal_shipping_cost_cents}
            hasUncoveredSkus={hasUncoveredSkus}
          />
        </section>
      </div>
    </main>
  );
}

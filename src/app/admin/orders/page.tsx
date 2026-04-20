import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { EAST_COAST_STATES } from '@/lib/shipping';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Orders — Admin — Jimmy Potters', robots: 'noindex, nofollow' };

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmtCents = (c: number | null | undefined) => USD.format((c ?? 0) / 100);

const STATUS_VALUES = ['pending', 'paid', 'shipped', 'delivered', 'refunded', 'cancelled'] as const;
const PAYMENT_VALUES = ['stripe', 'venmo', 'paypal'] as const;
type StatusFilter = (typeof STATUS_VALUES)[number] | 'all';
type PaymentFilter = (typeof PAYMENT_VALUES)[number] | 'all';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoIso(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

type Raw = {
  searchParams: Record<string, string | string[] | undefined>;
};

type OrderListRow = {
  id: string;
  created_at: string;
  status: (typeof STATUS_VALUES)[number];
  email: string;
  buyer_state: string;
  total_cents: number | null;
  stripe_fee_cents: number | null;
  payment_method: (typeof PAYMENT_VALUES)[number];
  order_items?: Array<{ quantity: number }>;
};

type ShipmentRow = {
  order_id: string;
  flag: 'normal' | 'heads_up' | 'critical' | 'urgent' | null;
  required_ship_by: string | null;
  shipment_status: string | null;
  tracking_number: string | null;
};

function parseParams(searchParams: Raw['searchParams']) {
  const s = (k: string) => (Array.isArray(searchParams[k]) ? searchParams[k]?.[0] : searchParams[k]) as string | undefined;

  const statusRaw = (s('status') ?? 'all').toLowerCase();
  const status: StatusFilter = (STATUS_VALUES as readonly string[]).includes(statusRaw)
    ? (statusRaw as StatusFilter)
    : 'all';

  const paymentRaw = (s('payment') ?? 'all').toLowerCase();
  const payment: PaymentFilter = (PAYMENT_VALUES as readonly string[]).includes(paymentRaw)
    ? (paymentRaw as PaymentFilter)
    : 'all';

  const stateRaw = (s('state') ?? 'all').toUpperCase();
  const validStates = new Set(EAST_COAST_STATES.map((e) => e.abbreviation));
  const state = stateRaw !== 'ALL' && validStates.has(stateRaw) ? stateRaw : 'all';

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const fromRaw = s('from');
  const toRaw = s('to');
  const from = fromRaw && dateRe.test(fromRaw) ? fromRaw : daysAgoIso(30);
  const to = toRaw && dateRe.test(toRaw) ? toRaw : todayIso();

  return { status, payment, state, from, to };
}

async function loadOrders(filters: ReturnType<typeof parseParams>) {
  const supabase = createSupabaseAdminClient();
  const fromIso = `${filters.from}T00:00:00.000Z`;
  const toIso = new Date(new Date(`${filters.to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();

  let q = supabase
    .from('orders')
    .select('id, created_at, status, email, buyer_state, total_cents, stripe_fee_cents, payment_method, order_items(quantity)')
    .gte('created_at', fromIso)
    .lte('created_at', toIso)
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters.status !== 'all') q = q.eq('status', filters.status);
  if (filters.payment !== 'all') q = q.eq('payment_method', filters.payment);
  if (filters.state !== 'all') q = q.eq('buyer_state', filters.state);

  const { data: ordersData, error: ordersErr } = await q;
  if (ordersErr) throw new Error(`orders query failed: ${ordersErr.message}`);

  const orders = (ordersData ?? []) as OrderListRow[];
  const ids = orders.map((o) => o.id);

  let shipments: ShipmentRow[] = [];
  if (ids.length > 0) {
    const { data: shipData } = await supabase
      .from('shipments')
      .select('order_id, flag, required_ship_by, shipment_status, tracking_number')
      .in('order_id', ids);
    shipments = (shipData ?? []) as ShipmentRow[];
  }
  const shipByOrder = new Map(shipments.map((s) => [s.order_id, s]));

  return orders.map((o) => {
    const itemsTotal = (o.order_items ?? []).reduce((s, i) => s + (i.quantity ?? 0), 0);
    return {
      id: o.id,
      created_at: o.created_at,
      status: o.status,
      email: o.email,
      buyer_state: o.buyer_state,
      total_cents: o.total_cents,
      payment_method: o.payment_method,
      items_total: itemsTotal,
      shipment: shipByOrder.get(o.id) ?? null,
    };
  });
}

function StatusBadge({ status }: { status: OrderListRow['status'] }) {
  const tone: Record<OrderListRow['status'], string> = {
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

function FlagPill({ ship }: { ship: ShipmentRow | null }) {
  if (!ship) return <span className="text-stone-600 text-xs">—</span>;
  const today = todayIso();
  const overdue =
    ship.required_ship_by &&
    ship.required_ship_by < today &&
    ship.shipment_status !== 'shipped' &&
    ship.shipment_status !== 'delivered';

  if (overdue) {
    return (
      <span className="inline-block rounded-full bg-red-500/15 border border-red-500/50 text-red-200 text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5">
        overdue
      </span>
    );
  }

  const flag = ship.flag ?? 'normal';
  const tone: Record<NonNullable<ShipmentRow['flag']>, string> = {
    normal:   'bg-stone-700/20 border-stone-700/40 text-stone-400',
    heads_up: 'bg-amber-500/10 border-amber-500/40 text-amber-200',
    critical: 'bg-orange-500/10 border-orange-500/40 text-orange-200',
    urgent:   'bg-red-500/15 border-red-500/50 text-red-200',
  };
  return (
    <span className={`inline-block rounded-full border text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 ${tone[flag]}`}>
      {flag.replace('_', ' ')}
    </span>
  );
}

function FilterBar({ filters }: { filters: ReturnType<typeof parseParams> }) {
  return (
    <form method="get" className="card-faire-detail p-4 border border-stone-700/40 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <label className="block">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Status</span>
          <select name="status" defaultValue={filters.status} className="mt-1 w-full bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1.5">
            <option value="all">All</option>
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Payment</span>
          <select name="payment" defaultValue={filters.payment} className="mt-1 w-full bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1.5">
            <option value="all">All</option>
            {PAYMENT_VALUES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">State</span>
          <select name="state" defaultValue={filters.state} className="mt-1 w-full bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1.5">
            <option value="all">All</option>
            {EAST_COAST_STATES.map((s) => (
              <option key={s.abbreviation} value={s.abbreviation}>{s.abbreviation} — {s.state}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">From</span>
          <input type="date" name="from" defaultValue={filters.from} className="mt-1 w-full bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1.5" />
        </label>
        <label className="block">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">To</span>
          <input type="date" name="to" defaultValue={filters.to} className="mt-1 w-full bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1.5" />
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-faire !w-auto flex-shrink-0">Apply</button>
          <Link href="/admin/orders" className="text-stone-400 text-xs font-body underline-offset-4 hover:underline">Reset</Link>
        </div>
      </div>
    </form>
  );
}

export default async function AdminOrdersPage({ searchParams }: Raw) {
  const filters = parseParams(searchParams);
  const rows = await loadOrders(filters);

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">Admin · Orders</p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">Orders</h1>
            <p className="text-stone-400 text-sm font-body mt-2">
              {rows.length} order{rows.length === 1 ? '' : 's'} · {filters.from} → {filters.to}
            </p>
          </div>
          <Link href="/admin" className="text-stone-400 text-xs font-body underline-offset-4 hover:underline">← Dashboard</Link>
        </header>

        <FilterBar filters={filters} />

        <div className="card-faire-detail border border-stone-700/40 overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-stone-900/60 text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-left px-3 py-2">Order #</th>
                <th className="text-left px-3 py-2">Email</th>
                <th className="text-left px-3 py-2">State</th>
                <th className="text-right px-3 py-2">Items</th>
                <th className="text-right px-3 py-2">Total</th>
                <th className="text-left px-3 py-2">Payment</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-stone-500 font-body text-sm">
                    No orders match the current filters.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-stone-900/40">
                  <td className="px-3 py-2 text-stone-400 whitespace-nowrap">
                    <Link href={`/admin/orders/${r.id}`} className="block">
                      {r.created_at.slice(0, 10)}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-stone-200 whitespace-nowrap">
                    <Link href={`/admin/orders/${r.id}`} className="block font-mono">
                      {r.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-stone-300">
                    <Link href={`/admin/orders/${r.id}`} className="block truncate max-w-[180px]" title={r.email}>
                      {r.email}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-stone-400">
                    <Link href={`/admin/orders/${r.id}`} className="block">{r.buyer_state || '—'}</Link>
                  </td>
                  <td className="px-3 py-2 text-right text-stone-300">
                    <Link href={`/admin/orders/${r.id}`} className="block">{r.items_total}</Link>
                  </td>
                  <td className="px-3 py-2 text-right text-stone-200 whitespace-nowrap font-mono">
                    <Link href={`/admin/orders/${r.id}`} className="block">{fmtCents(r.total_cents)}</Link>
                  </td>
                  <td className="px-3 py-2 text-stone-400 whitespace-nowrap">
                    <Link href={`/admin/orders/${r.id}`} className="block">{r.payment_method}</Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/orders/${r.id}`} className="block"><StatusBadge status={r.status} /></Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/orders/${r.id}`} className="block"><FlagPill ship={r.shipment} /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

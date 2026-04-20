import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  aggregatePnl,
  type PnlOrder,
  type ProductCostTemplate,
  type OrderCostOverride,
  type OverheadExpense,
} from '@/lib/pnl';
import { getAllProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin — Jimmy Potters', robots: 'noindex, nofollow' };

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmtCents = (c: number) => USD.format(c / 100);

function monthBounds(now = new Date()) {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return { from: iso(start), to: iso(today) };
}

type OrderRow = {
  id: string;
  created_at: string;
  status: PnlOrder['status'];
  subtotal_cents: number | null;
  sales_tax_cents: number | null;
  total_cents: number | null;
  internal_shipping_cost_cents: number | null;
  stripe_fee_cents: number | null;
  buyer_state: string | null;
  payment_method: PnlOrder['payment_method'] | null;
  order_items?: Array<{ product_id: string; quantity: number; unit_price_cents: number | null }>;
};

type ShipmentRow = {
  order_id: string;
  required_ship_by: string | null;
  shipment_status: string | null;
  flag: string | null;
};

async function loadDashboardData() {
  const supabase = createSupabaseAdminClient();
  const { from, to } = monthBounds();

  const fromIso = `${from}T00:00:00.000Z`;
  const toIso = new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();

  const [ordersRes, templatesRes, overridesRes, overheadRes, pendingRes, shipmentsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, created_at, status, subtotal_cents, sales_tax_cents, total_cents, internal_shipping_cost_cents, stripe_fee_cents, buyer_state, payment_method, order_items(product_id, quantity, unit_price_cents)')
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    supabase.from('product_costs').select('product_id, materials_cents, labor_cents, packaging_cents, freight_cents, other_cents'),
    supabase.from('order_cost_overrides').select('order_id, materials_cents, labor_cents, packaging_cents, freight_cents, other_cents'),
    supabase.from('overhead_expenses').select('amount_cents, incurred_on, category').gte('incurred_on', from).lte('incurred_on', to),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('shipments').select('order_id, required_ship_by, shipment_status, flag'),
  ]);

  const rawOrders = (ordersRes.data ?? []) as OrderRow[];
  const orders: PnlOrder[] = rawOrders.map((o) => ({
    id: o.id,
    created_at: o.created_at,
    status: o.status,
    subtotal_cents: o.subtotal_cents ?? 0,
    sales_tax_cents: o.sales_tax_cents ?? 0,
    total_cents: o.total_cents ?? 0,
    internal_shipping_cost_cents: o.internal_shipping_cost_cents ?? 0,
    stripe_fee_cents: o.stripe_fee_cents,
    buyer_state: o.buyer_state ?? '',
    payment_method: (o.payment_method ?? 'stripe') as PnlOrder['payment_method'],
    items: (o.order_items ?? []).map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price_cents: i.unit_price_cents ?? 0,
    })),
  }));

  const templates = (templatesRes.data ?? []) as ProductCostTemplate[];
  const overrides = (overridesRes.data ?? []) as OrderCostOverride[];
  const overhead = (overheadRes.data ?? []) as OverheadExpense[];

  const pnl = aggregatePnl(orders, templates, overrides, overhead, from, to);

  const productIds = getAllProducts().map((p) => p.id);
  const coveredIds = new Set(templates.map((t) => t.product_id));
  const uncovered = productIds.filter((id) => !coveredIds.has(id));

  const shipments = (shipmentsRes.data ?? []) as ShipmentRow[];
  const todayIso = new Date().toISOString().slice(0, 10);
  const bulkAttention = shipments.filter((s) => {
    if (s.flag === 'critical' || s.flag === 'urgent') return true;
    if (!s.required_ship_by) return false;
    const overdue = s.required_ship_by < todayIso && s.shipment_status !== 'shipped' && s.shipment_status !== 'delivered';
    return overdue;
  }).length;

  return {
    period: { from, to },
    pnl,
    pendingPaymentsCount: pendingRes.count ?? 0,
    productCount: productIds.length,
    uncoveredSkus: uncovered,
    bulkAttentionCount: bulkAttention,
    hasEstimates: pnl.has_estimates,
  };
}

type KpiCardProps = {
  label: string;
  value: string;
  sublabel?: string;
  href?: string;
  tone?: 'default' | 'warn' | 'danger' | 'good';
};

function KpiCard({ label, value, sublabel, href, tone = 'default' }: KpiCardProps) {
  const toneRing = {
    default: 'border-stone-700/40',
    warn:    'border-amber-500/40',
    danger:  'border-red-500/40',
    good:    'border-emerald-500/40',
  }[tone];
  const toneValue = {
    default: 'text-white',
    warn:    'text-amber-300',
    danger:  'text-red-300',
    good:    'text-emerald-300',
  }[tone];

  const card = (
    <div className={`card-faire-detail p-6 border ${toneRing} h-full flex flex-col justify-between`}>
      <div>
        <p className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">{label}</p>
        <p className={`font-heading font-black text-3xl mt-3 ${toneValue}`}>{value}</p>
      </div>
      {sublabel && <p className="text-stone-500 text-xs font-body mt-3">{sublabel}</p>}
    </div>
  );

  return href ? <Link href={href} className="block h-full">{card}</Link> : card;
}

export default async function AdminIndexPage() {
  const data = await loadDashboardData();
  const { pnl, period, pendingPaymentsCount, productCount, uncoveredSkus, bulkAttentionCount, hasEstimates } = data;

  const mtdRevenue = fmtCents(pnl.gross_revenue);
  const mtdNetProfit = fmtCents(pnl.net_profit);
  const netProfitTone: KpiCardProps['tone'] = pnl.net_profit < 0 ? 'danger' : pnl.net_profit === 0 ? 'default' : 'good';

  const uncoveredCount = uncoveredSkus.length;
  const coverageTone: KpiCardProps['tone'] = uncoveredCount === 0 ? 'good' : uncoveredCount <= 2 ? 'warn' : 'danger';

  const pendingTone: KpiCardProps['tone'] = pendingPaymentsCount > 0 ? 'warn' : 'default';
  const bulkTone: KpiCardProps['tone'] = bulkAttentionCount === 0 ? 'default' : bulkAttentionCount >= 3 ? 'danger' : 'warn';

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <header className="mb-8">
          <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">Admin</p>
          <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">Jimmy Potters Dashboard</h1>
          <p className="text-stone-400 text-sm font-body mt-2">
            Month-to-date: <span className="text-stone-300">{period.from}</span> → <span className="text-stone-300">{period.to}</span>
            {hasEstimates && (
              <span className="ml-2 inline-block rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5">
                Includes COGS estimates
              </span>
            )}
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="MTD Revenue"
            value={mtdRevenue}
            sublabel={`${pnl.order_count} paid order${pnl.order_count === 1 ? '' : 's'}`}
            href="/admin/orders"
          />
          <KpiCard
            label="MTD Net Profit"
            value={mtdNetProfit}
            sublabel={`Gross ${fmtCents(pnl.gross_profit)} − OpEx ${fmtCents(pnl.operating_expenses)}`}
            tone={netProfitTone}
            href="/admin/pnl"
          />
          <KpiCard
            label="Pending Payments"
            value={String(pendingPaymentsCount)}
            sublabel={pendingPaymentsCount > 0 ? 'Venmo / PayPal awaiting confirmation' : 'All caught up'}
            tone={pendingTone}
            href="/admin/orders"
          />
          <KpiCard
            label="Bulk Orders Needing Attention"
            value={String(bulkAttentionCount)}
            sublabel={bulkAttentionCount > 0 ? 'Critical / urgent or overdue' : 'None flagged'}
            tone={bulkTone}
            href="/admin/shipments"
          />
        </section>

        <section className="mt-6">
          <div className={`card-faire-detail p-6 border ${uncoveredCount === 0 ? 'border-emerald-500/40' : uncoveredCount <= 2 ? 'border-amber-500/40' : 'border-red-500/40'}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">Cost Coverage</p>
                <p className={`font-heading font-black text-2xl mt-2 ${uncoveredCount === 0 ? 'text-emerald-300' : uncoveredCount <= 2 ? 'text-amber-300' : 'text-red-300'}`}>
                  {productCount - uncoveredCount} / {productCount} SKUs covered
                </p>
                <p className="text-stone-500 text-xs font-body mt-2">
                  {uncoveredCount === 0
                    ? 'Every product has a cost template. P&L math is template-complete.'
                    : `${uncoveredCount} product${uncoveredCount === 1 ? '' : 's'} still using $0 COGS — P&L will overstate margin until filled.`}
                </p>
                {uncoveredCount > 0 && (
                  <p className="text-stone-400 text-xs font-body mt-3">
                    Missing: <span className="text-stone-300 break-all">{uncoveredSkus.slice(0, 5).join(', ')}{uncoveredSkus.length > 5 ? `, +${uncoveredSkus.length - 5} more` : ''}</span>
                  </p>
                )}
              </div>
              <Link href="/admin/products/costs" className="btn-faire !w-auto flex-shrink-0">Fill Costs</Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/orders" className="card-faire-detail p-5 hover:border-[#C9A96E]/60 transition-colors">
            <p className="font-heading font-bold text-white text-sm">Orders</p>
            <p className="text-stone-500 text-xs font-body mt-1">Filterable table · Mark-Paid · Labor forecast</p>
          </Link>
          <Link href="/admin/pnl" className="card-faire-detail p-5 hover:border-[#C9A96E]/60 transition-colors">
            <p className="font-heading font-bold text-white text-sm">P&amp;L Report</p>
            <p className="text-stone-500 text-xs font-body mt-1">Date range · Sales tax by state · Print</p>
          </Link>
          <Link href="/admin/margins" className="card-faire-detail p-5 hover:border-[#C9A96E]/60 transition-colors">
            <p className="font-heading font-bold text-white text-sm">Margins</p>
            <p className="text-stone-500 text-xs font-body mt-1">Retail vs bulk · Per-SKU contribution</p>
          </Link>
          <Link href="/admin/expenses" className="card-faire-detail p-5 hover:border-[#C9A96E]/60 transition-colors">
            <p className="font-heading font-bold text-white text-sm">Expenses</p>
            <p className="text-stone-500 text-xs font-body mt-1">Overhead · Recurring · Documents</p>
          </Link>
          <Link href="/admin/shipments" className="card-faire-detail p-5 hover:border-[#C9A96E]/60 transition-colors">
            <p className="font-heading font-bold text-white text-sm">Shipments</p>
            <p className="text-stone-500 text-xs font-body mt-1">List · Calendar · Ship-by warnings</p>
          </Link>
          <Link href="/admin/insights" className="card-faire-detail p-5 hover:border-[#C9A96E]/60 transition-colors">
            <p className="font-heading font-bold text-white text-sm">Insights</p>
            <p className="text-stone-500 text-xs font-body mt-1">Typed &amp; voice · Weekly digest</p>
          </Link>
        </section>
      </div>
    </main>
  );
}

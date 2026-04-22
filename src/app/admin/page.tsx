import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserProfile } from '@/lib/supabase/server';
import {
  aggregatePnl,
  type PnlOrder,
  type ProductCostTemplate,
  type OrderCostOverride,
  type OverheadExpense,
} from '@/lib/pnl';
import { getAllProducts } from '@/lib/products';
import { getWholesaleApplicationCounts } from '@/lib/wholesale-applications-data';

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

// Cheap count helper — always returns a number, never throws, no-ops on missing table.
async function safeCount(promise: Promise<{ count: number | null; error: unknown }>): Promise<number> {
  try {
    const { count, error } = await promise;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function loadDashboardData() {
  const supabase = createSupabaseAdminClient();
  const { from, to } = monthBounds();

  const fromIso = `${from}T00:00:00.000Z`;
  const toIso = new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();

  const [
    ordersRes,
    templatesRes,
    overridesRes,
    overheadRes,
    pendingRes,
    shipmentsRes,
    wholesaleCounts,
    openDisputesCount,
    pendingDocsCount,
    pendingProductsCount,
    todaysOrdersCount,
    workersActiveCount,
  ] = await Promise.all([
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
    getWholesaleApplicationCounts().catch(() => ({ pending: 0, needs_info: 0, approved: 0, rejected: 0, active: 0, total: 0 })),
    safeCount(supabase.from('customer_disputes').select('id', { count: 'exact', head: true }).in('status', ['new', 'investigating', 'awaiting_customer']) as unknown as Promise<{ count: number | null; error: unknown }>),
    safeCount(supabase.from('financial_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending') as unknown as Promise<{ count: number | null; error: unknown }>),
    // Pending products (scraped-but-not-approved) — uses whatever table pending-products reads from. Best-effort; 0 on miss.
    safeCount(supabase.from('pending_products').select('id', { count: 'exact', head: true }).eq('status', 'pending') as unknown as Promise<{ count: number | null; error: unknown }>),
    safeCount(supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', fromIso).lte('created_at', toIso) as unknown as Promise<{ count: number | null; error: unknown }>),
    safeCount(supabase.from('workers').select('id', { count: 'exact', head: true }).eq('status', 'active') as unknown as Promise<{ count: number | null; error: unknown }>),
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
    wholesaleCounts,
    openDisputesCount,
    pendingDocsCount,
    pendingProductsCount,
    todaysOrdersCount,
    workersActiveCount,
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

type ToolTileProps = {
  href: string;
  title: string;
  description: string;
  badge?: string | number;
  badgeTone?: 'default' | 'warn' | 'danger' | 'good';
  external?: boolean;
};

function ToolTile({ href, title, description, badge, badgeTone = 'default', external }: ToolTileProps) {
  const badgeClass = {
    default: 'bg-stone-800 text-stone-300 border-stone-600/40',
    warn:    'bg-amber-500/15 text-amber-300 border-amber-500/40',
    danger:  'bg-red-500/15 text-red-300 border-red-500/40',
    good:    'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  }[badgeTone];

  const inner = (
    <div className="card-faire-detail p-5 hover:border-[#C9A96E]/60 transition-colors h-full flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <p className="font-heading font-bold text-white text-sm">{title}{external && <span className="ml-1 text-stone-500 text-[10px]">↗</span>}</p>
          {badge !== undefined && badge !== null && String(badge) !== '0' && (
            <span className={`text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-stone-500 text-xs font-body mt-1">{description}</p>
      </div>
    </div>
  );

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block h-full">{inner}</a>
  ) : (
    <Link href={href} className="block h-full">{inner}</Link>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-stone-500 mt-10 mb-3">{children}</h2>
  );
}

export default async function AdminIndexPage() {
  const [profile, data] = await Promise.all([
    getCurrentUserProfile().catch(() => null),
    loadDashboardData(),
  ]);
  const {
    pnl, period, pendingPaymentsCount, productCount, uncoveredSkus,
    bulkAttentionCount, hasEstimates, wholesaleCounts,
    openDisputesCount, pendingDocsCount, pendingProductsCount,
    todaysOrdersCount, workersActiveCount,
  } = data;

  const mtdRevenue = fmtCents(pnl.gross_revenue);
  const mtdNetProfit = fmtCents(pnl.net_profit);
  const netProfitTone: KpiCardProps['tone'] = pnl.net_profit < 0 ? 'danger' : pnl.net_profit === 0 ? 'default' : 'good';

  const uncoveredCount = uncoveredSkus.length;

  const pendingTone: KpiCardProps['tone'] = pendingPaymentsCount > 0 ? 'warn' : 'default';
  const bulkTone: KpiCardProps['tone'] = bulkAttentionCount === 0 ? 'default' : bulkAttentionCount >= 3 ? 'danger' : 'warn';
  const wholesaleTone: KpiCardProps['tone'] = wholesaleCounts.active === 0 ? 'default' : wholesaleCounts.active >= 3 ? 'danger' : 'warn';

  const year = new Date().getUTCFullYear();

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        {/* -------- Welcome header -------- */}
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">Admin Hub</p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">Jimmy Potters Dashboard</h1>
            <p className="text-stone-400 text-sm font-body mt-2">
              {profile ? (
                <>Signed in as <span className="text-stone-200">{profile.email}</span> · <span className="text-emerald-300 font-heading font-bold uppercase text-[11px] tracking-wider">{profile.role}</span></>
              ) : (
                <>Signed in</>
              )}
            </p>
            <p className="text-stone-500 text-xs font-body mt-1">
              Month-to-date: <span className="text-stone-400">{period.from}</span> → <span className="text-stone-400">{period.to}</span>
              {hasEstimates && (
                <span className="ml-2 inline-block rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5">
                  Includes COGS estimates
                </span>
              )}
            </p>
          </div>
          <a
            href={`/admin/pnl/statement?year=${year}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15 hover:border-emerald-400 transition-colors px-4 py-2.5 text-sm font-heading font-bold uppercase tracking-wider"
          >
            <span>CPA Statement</span>
            <span className="text-[10px] opacity-70">Monthly · Quarterly · Annual · Schedule C ↗</span>
          </a>
        </header>

        {/* -------- Top-line KPIs -------- */}
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
            href="/admin/orders?status=pending"
          />
          <KpiCard
            label="Bulk Orders Needing Attention"
            value={String(bulkAttentionCount)}
            sublabel={bulkAttentionCount > 0 ? 'Critical / urgent or overdue' : 'None flagged'}
            tone={bulkTone}
            href="/admin/shipments"
          />
        </section>

        <section className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Wholesale Applications"
            value={String(wholesaleCounts.active)}
            sublabel={
              wholesaleCounts.active > 0
                ? `${wholesaleCounts.pending} pending · ${wholesaleCounts.needs_info} needs info`
                : `${wholesaleCounts.total} total · queue is clear`
            }
            tone={wholesaleTone}
            href="/admin/wholesale"
          />
          <KpiCard
            label="Open Disputes"
            value={String(openDisputesCount)}
            sublabel={openDisputesCount > 0 ? 'New · investigating · awaiting customer' : 'No open cases'}
            tone={openDisputesCount === 0 ? 'default' : openDisputesCount >= 2 ? 'danger' : 'warn'}
            href="/admin/disputes"
          />
          <KpiCard
            label="Documents Awaiting Review"
            value={String(pendingDocsCount)}
            sublabel={pendingDocsCount > 0 ? 'Parse → confirm → link' : 'Inbox clear'}
            tone={pendingDocsCount === 0 ? 'default' : 'warn'}
            href="/admin/documents"
          />
          <KpiCard
            label="Cost Coverage"
            value={`${productCount - uncoveredCount}/${productCount}`}
            sublabel={uncoveredCount === 0 ? 'All SKUs covered' : `${uncoveredCount} SKU${uncoveredCount === 1 ? '' : 's'} still using $0 COGS`}
            tone={uncoveredCount === 0 ? 'good' : uncoveredCount <= 2 ? 'warn' : 'danger'}
            href="/admin/products/costs"
          />
        </section>

        {/* -------- Quick actions -------- */}
        <section className="mt-6 flex flex-wrap gap-2">
          <Link href="/admin/orders" className="inline-flex items-center gap-2 rounded-md border border-stone-600/60 bg-stone-900 hover:border-[#C9A96E]/60 text-stone-200 px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider">
            Today&rsquo;s Revenue ({todaysOrdersCount} orders MTD)
          </Link>
          <Link href="/admin/wholesale?status=pending" className="inline-flex items-center gap-2 rounded-md border border-stone-600/60 bg-stone-900 hover:border-[#C9A96E]/60 text-stone-200 px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider">
            Pending Wholesale Apps
          </Link>
          <Link href="/admin/orders?status=pending" className="inline-flex items-center gap-2 rounded-md border border-stone-600/60 bg-stone-900 hover:border-[#C9A96E]/60 text-stone-200 px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider">
            Unpaid Orders
          </Link>
          <Link href="/admin/shipments" className="inline-flex items-center gap-2 rounded-md border border-stone-600/60 bg-stone-900 hover:border-[#C9A96E]/60 text-stone-200 px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider">
            Ship Calendar
          </Link>
          <Link href="/admin/insights" className="inline-flex items-center gap-2 rounded-md border border-stone-600/60 bg-stone-900 hover:border-[#C9A96E]/60 text-stone-200 px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider">
            Ask Insights
          </Link>
        </section>

        {/* -------- Operations -------- */}
        <SectionHeader>Operations</SectionHeader>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ToolTile href="/admin/orders"    title="Orders"    description="Filterable table · Mark-paid · Refund · Labor forecast" badge={pendingPaymentsCount} badgeTone={pendingPaymentsCount > 0 ? 'warn' : 'default'} />
          <ToolTile href="/admin/shipments" title="Shipments" description="Ship-by calendar · Flags · Tracking · Carriers" badge={bulkAttentionCount} badgeTone={bulkTone} />
          <ToolTile href="/admin/disputes"  title="Disputes"  description="Customer service queue · Refund · Replacement" badge={openDisputesCount} badgeTone={openDisputesCount > 0 ? 'warn' : 'default'} />
          <ToolTile href="/admin/documents" title="Documents" description="Receipts / bills · AI-parse · Link to expense" badge={pendingDocsCount} badgeTone={pendingDocsCount > 0 ? 'warn' : 'default'} />
        </section>

        {/* -------- Finance -------- */}
        <SectionHeader>Finance</SectionHeader>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ToolTile href="/admin/pnl"                                   title="P&L Report"          description="Date range · Sales tax by state · Print" />
          <ToolTile href={`/admin/pnl/statement?year=${year}`}          title="CPA Statement"       description="Monthly · Quarterly · Annual · Schedule C" />
          <ToolTile href="/admin/pnl/drilldown"                         title="P&L Drilldown"       description="3-tier interactive · Revenue × Cost stack" />
          <ToolTile href="/admin/margins"                               title="Margins"             description="Retail vs bulk · Per-SKU contribution" />
          <ToolTile href="/admin/expenses"                              title="Expenses"            description="Overhead · Recurring · Document-linked" />
          <ToolTile href="/admin/products/costs"                        title="Cost Templates"      description="Per-SKU materials · labor · packaging · freight" badge={uncoveredCount > 0 ? `${uncoveredCount} missing` : undefined} badgeTone={uncoveredCount > 0 ? 'warn' : 'default'} />
        </section>

        {/* -------- Growth -------- */}
        <SectionHeader>Growth</SectionHeader>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ToolTile href="/admin/analytics"           title="Analytics"    description="Visitors · Sources · Funnel · Wholesale conv" />
          <ToolTile href="/admin/wholesale"           title="Wholesale"    description="Application queue · Approve · Invite" badge={wholesaleCounts.active} badgeTone={wholesaleTone} />
          <ToolTile href="/admin/insights"            title="Insights"     description="Typed &amp; voice Q&amp;A · Weekly digest" />
          <ToolTile href="/admin/pending-products"    title="Pending Products" description="Scraped inventory awaiting approval" badge={pendingProductsCount} badgeTone={pendingProductsCount > 0 ? 'warn' : 'default'} />
        </section>

        {/* -------- Catalog -------- */}
        <SectionHeader>Catalog</SectionHeader>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ToolTile href="/admin/products/costs"       title="Product Costs"  description={`${productCount} SKUs · Edit COGS templates`} />
          <ToolTile href="/admin/products/labor-times" title="Labor Times"    description="Minutes per unit by role · Feeds forecast" />
          <ToolTile href="/shop"                       title="Live Shop"       description={`${productCount} products · Stripe checkout`} external />
        </section>

        {/* -------- Team -------- */}
        <SectionHeader>Team</SectionHeader>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ToolTile href="/admin/labor/roles" title="Labor Roles" description="Role keys · Hourly · Contract · Piece rate" />
          <ToolTile href="/admin/labor/hire"  title="Hire Scenarios" description="W2 · 1099 · Temp · Piece · AI recommend" badge={workersActiveCount || undefined} badgeTone="default" />
        </section>

        {/* -------- External dashboards -------- */}
        <SectionHeader>External Dashboards</SectionHeader>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ToolTile href="https://dashboard.stripe.com/"                                                title="Stripe"    description="Payments · Webhooks · Payouts" external />
          <ToolTile href="https://supabase.com/dashboard/project/iyvktystdlbqcnzkkooq"                  title="Supabase"  description="DB · Auth · Storage · SQL editor" external />
          <ToolTile href="https://vercel.com/jeffbanias-projects/website"                               title="Vercel"    description="Deploys · Logs · Env vars · Domains" external />
          <ToolTile href="https://venmo.com/Jimmy-Potters"                                              title="Venmo"     description="Alt-payment ledger" external />
        </section>
      </div>
    </main>
  );
}

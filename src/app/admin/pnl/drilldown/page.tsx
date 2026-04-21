// /admin/pnl/drilldown — Three-tier drill-down P&L dashboard (prototype).
//
// TIER 1 (this page): KPI strip + wholesale/retail segment tables side-by-side.
// TIER 2 (order drawer): cost waterfall + line items — see DrilldownClient.
// TIER 3 (line item drawer): BOM + labor timesheet + carrier receipt.
//
// DATA SOURCES:
//   Revenue:  MOCK (pending Stripe keys — see PnL_Dashboard_Stripe_Activation_2026-04-20.md)
//   Costs:    REAL — Pottery_Shipping_Protocol_2026-04-20.docx ($2.14 BOM, $11-13 USPS, $0.45 Shipsurance)
//   Labor:    REAL — 15 min/pot @ $20/hr blended
//
// SEGMENTATION: qty >= 10 units = wholesale. TODO: replace with profiles.segment
// field once DRAFT-0003_customer_segmentation.sql is applied.

import Link from 'next/link';
import type { DrilldownOrder, DailyWorkload, ProductSalesRow } from '@/lib/pnl-drilldown';
import {
  loadDrilldownDashboard,
  computeWorkerRequirements,
  computeDailyWorkload,
  computeProductSales,
  BLENDED_LABOR_RATE_PER_HOUR_CENTS,
  PACK_MINUTES_PER_POT,
  THROW_MINUTES_PER_POT,
  GLAZE_MINUTES_PER_POT,
  FIRE_MINUTES_PER_POT,
  FIXED_COSTS_MONTHLY,
  fixedCostsMonthlyTotalCents,
  fixedCostsDailyBurnCents,
  fixedCostsPerUnitCents,
} from '@/lib/pnl-drilldown';
import { getAllProducts } from '@/lib/products';
import { computeScaleInsights } from '@/lib/pnl-insights';
import DrilldownController from './DrilldownClient';
import ScaleInsights from './ScaleInsights';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'P&L Drill-Down — Admin — Jimmy Potters',
  robots: 'noindex, nofollow',
};

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmt = (c: number) => USD.format(c / 100);
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default async function PnlDrilldownPage() {
  const data = loadDrilldownDashboard();
  const { orders, per_order, segments, totals } = data;
  const insights = computeScaleInsights(data);

  const wholesaleOrders = orders.filter((o) => o.segment === 'wholesale');
  const retailOrders    = orders.filter((o) => o.segment === 'retail');

  // ---- Daily Worker Requirements rollup ----
  // Roll up per-phase minutes across every order in the queue, then convert to
  // full-time headcount by 8-hour-day windows (1-day / 2-day / 3-day turnaround).
  const totalUnitsAll = totals.units;
  const packMinTotal  = totalUnitsAll * PACK_MINUTES_PER_POT;
  const throwMinTotal = totalUnitsAll * THROW_MINUTES_PER_POT;
  const glazeMinTotal = totalUnitsAll * GLAZE_MINUTES_PER_POT;
  const fireMinTotal  = totalUnitsAll * FIRE_MINUTES_PER_POT;
  const totalWorkerMinutes = packMinTotal + throwMinTotal + glazeMinTotal + fireMinTotal;
  const totalWorkerHours = totalWorkerMinutes / 60;
  const packerHours = packMinTotal / 60;
  const throwHours  = throwMinTotal / 60;
  const glazeHours  = glazeMinTotal / 60;
  const fireHours   = fireMinTotal  / 60;
  const FT_HOURS_PER_DAY = 8;
  const staffFor1Day = Math.max(1, Math.ceil(totalWorkerHours / FT_HOURS_PER_DAY));
  const staffFor2Day = Math.max(1, Math.ceil(totalWorkerHours / (2 * FT_HOURS_PER_DAY)));
  const staffFor3Day = Math.max(1, Math.ceil(totalWorkerHours / (3 * FT_HOURS_PER_DAY)));
  const ftPackersFor1Day = Math.max(1, Math.ceil(packerHours / FT_HOURS_PER_DAY));
  // Also surface worst-case per-order parallelism (any 10+ unit order triggers 2 packers)
  const parallelOrderCount = orders.filter((o) => computeWorkerRequirements(o).packers > 1).length;
  const laborCostQueueCents = Math.round(totalWorkerHours * BLENDED_LABOR_RATE_PER_HOUR_CENTS);

  // ---- Daily Workload (last 14 days) ----
  const dailyWorkload = computeDailyWorkload(orders, 14);

  // ---- Product Sales Summary (which SKUs move the most units) ----
  const productSales = computeProductSales(orders, getAllProducts());

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · P&amp;L Drill-Down
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">
              Profit &amp; Loss — Drill-Down
            </h1>
            <p className="text-stone-400 text-sm font-body mt-2">
              Last 30 days · Segmented by wholesale vs retail · Click any row for full cost stack
              <span className="ml-2 inline-block rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5">
                Prototype · Mock revenue · Stripe pending
              </span>
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← Dashboard
            </Link>
            <Link href="/admin/pnl" className="text-xs text-stone-400 hover:text-stone-200 underline">
              Classic P&amp;L
            </Link>
          </nav>
        </header>

        {/* Tier 1: KPI strip */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <Kpi label="Orders"      value={String(totals.order_count)} tone="text-sky-400" />
          <Kpi label="Units"       value={String(totals.units)} tone="text-sky-400" />
          <Kpi label="Revenue"     value={fmt(totals.revenue_cents)} tone="text-sky-400" />
          <Kpi label="To make & ship" value={fmt(totals.cogs_cents)} tone="text-sky-400" />
          <Kpi label="You keep"       value={fmt(totals.net_margin_cents)} tone="text-sky-400" />
          <Kpi label="Your take"      value={pct(totals.margin_pct)} tone="text-sky-400" />
        </section>

        {/* Segment comparison bar */}
        <section className="mb-8 card-faire-detail p-5">
          <p className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
            Segment Comparison
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SegmentSummary
              title="Wholesale"
              color="emerald"
              orders={segments.wholesale.order_count}
              units={segments.wholesale.units}
              revenue={segments.wholesale.revenue_cents}
              margin={segments.wholesale.net_margin_cents}
              marginPct={segments.wholesale.margin_pct}
            />
            <SegmentSummary
              title="Retail"
              color="sky"
              orders={segments.retail.order_count}
              units={segments.retail.units}
              revenue={segments.retail.revenue_cents}
              margin={segments.retail.net_margin_cents}
              marginPct={segments.retail.margin_pct}
            />
          </div>
        </section>

        {/* Fixed monthly overhead — transparency for the team */}
        <FixedCostsCard unitsThisMonth={totals.units} />

        {/* Dual-lane buyer ticker — scrolls order-by-order so the queue feels alive */}
        <BuyerTicker wholesale={wholesaleOrders} retail={retailOrders} />

        {/* Daily Worker Requirements — throughput across today's queue */}
        <section className="mb-8 card-faire-detail p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">
                Daily Worker Requirements
              </p>
              <p className="text-stone-400 text-xs font-body mt-1">
                Rolls up every pot in today&apos;s queue across throw / glaze / fire / pack phases.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-200 text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5">
              ${(BLENDED_LABOR_RATE_PER_HOUR_CENTS / 100).toFixed(2)}/hr blended
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Kpi label="Total worker-hours" value={`${totalWorkerHours.toFixed(1)} hr`} />
            <Kpi label="Packer hours"       value={`${packerHours.toFixed(1)} hr`} />
            <Kpi label="Throw / Glaze / Fire" value={`${(throwHours + glazeHours + fireHours).toFixed(1)} hr`} />
            <Kpi label="Queue labor cost"   value={fmt(laborCostQueueCents)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="border border-stone-800 rounded-md p-3 bg-stone-900/40">
              <p className="text-[9px] uppercase tracking-wider text-stone-500">Ship in 1 day</p>
              <p className="font-heading font-black text-xl text-white mt-1 font-mono tabular-nums">{staffFor1Day} FT</p>
              <p className="text-[9px] text-stone-600 mt-0.5">full-time workers · 8 hr each</p>
            </div>
            <div className="border border-stone-800 rounded-md p-3 bg-stone-900/40">
              <p className="text-[9px] uppercase tracking-wider text-stone-500">Ship in 2 days</p>
              <p className="font-heading font-black text-xl text-white mt-1 font-mono tabular-nums">{staffFor2Day} FT</p>
              <p className="text-[9px] text-stone-600 mt-0.5">half the crew, twice the clock</p>
            </div>
            <div className="border border-stone-800 rounded-md p-3 bg-stone-900/40">
              <p className="text-[9px] uppercase tracking-wider text-stone-500">Ship in 3 days</p>
              <p className="font-heading font-black text-xl text-white mt-1 font-mono tabular-nums">{staffFor3Day} FT</p>
              <p className="text-[9px] text-stone-600 mt-0.5">conservative turnaround</p>
            </div>
          </div>

          <p className="text-sm text-stone-300 leading-relaxed">
            At today&apos;s queue volume, you need{' '}
            <span className="text-white font-bold font-mono tabular-nums">{ftPackersFor1Day}</span>{' '}
            full-time packer{ftPackersFor1Day === 1 ? '' : 's'} (1 FT = 8 hrs) to ship in 24 hours.
            {parallelOrderCount > 0 && (
              <>
                {' '}
                <span className="text-purple-200">
                  {parallelOrderCount} wholesale order{parallelOrderCount === 1 ? '' : 's'} in the queue trigger parallel packing
                  (2 packers per order ≥10 units).
                </span>
              </>
            )}
          </p>
        </section>

        {/* Daily Workload — day-by-day order volume + packers needed */}
        <DailyWorkloadChart daily={dailyWorkload} />

        {/* Product Sales Summary — which SKUs move the most */}
        <ProductSummaryTable rows={productSales} />

        {/* Tier 1 drill-down tables (click a row -> Tier 2 drawer) */}
        <section className="mb-8">
          <DrilldownController
            wholesaleOrders={wholesaleOrders}
            retailOrders={retailOrders}
            perOrder={per_order}
          />
        </section>

        {/* Scale Insights (Phase 3) */}
        <section className="mb-8">
          <ScaleInsights insights={insights} />
        </section>

        {/* Traffic-to-revenue funnel overlay (stubbed — GA not yet wired) */}
        <section className="mb-8">
          <div className="card-faire-detail p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">
                  Traffic → Revenue Funnel
                </p>
                <p className="text-stone-400 text-xs font-body mt-1">
                  Vercel Web Analytics / GA4 not yet wired — funnel is stubbed
                </p>
              </div>
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 rounded-full px-2 py-0.5">
                TODO
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'Sessions',   value: '—', sub: 'GA4 pending' },
                { label: 'Product Views', value: '—', sub: 'GA4 pending' },
                { label: 'Checkouts', value: '—', sub: 'Stripe pending' },
                { label: 'Paid Orders', value: String(totals.order_count), sub: 'mock' },
              ].map((s) => (
                <div key={s.label} className="border border-stone-800 rounded-md p-3 bg-stone-900/40">
                  <p className="text-[9px] uppercase tracking-wider text-stone-500">{s.label}</p>
                  <p className="text-stone-100 font-heading font-bold text-xl mt-1">{s.value}</p>
                  <p className="text-[9px] text-stone-600 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer: data provenance */}
        <footer className="text-[10px] text-stone-600 border-t border-stone-800 pt-4">
          <p>
            Mock revenue · cost stack from <code className="text-stone-400">Pottery_Shipping_Protocol_2026-04-20.docx</code>
            {' '}· Stripe activation details in <code className="text-stone-400">PnL_Dashboard_Stripe_Activation_2026-04-20.md</code>
          </p>
        </footer>
      </div>
    </main>
  );
}

// ---------------- helpers ----------------

function FixedCostsCard({ unitsThisMonth }: { unitsThisMonth: number }) {
  const monthlyTotal = fixedCostsMonthlyTotalCents();
  const dailyBurn    = fixedCostsDailyBurnCents();
  const perUnit      = fixedCostsPerUnitCents(unitsThisMonth);
  const breakEvenUnits = Math.ceil(monthlyTotal / 4000); // at ~$40 avg contribution / pot

  return (
    <section className="mb-8 card-faire-detail p-5 border-l-4 border-amber-500/60">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-amber-300">
            Fixed Monthly Overhead
          </p>
          <p className="text-stone-400 text-xs font-body mt-1">
            The bills that run whether or not a single pot ships — paid by the owner before anyone earns a dollar.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-200 text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5">
          Transparency view
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="border border-amber-500/30 rounded-md p-3 bg-amber-500/5">
          <p className="text-[9px] uppercase tracking-wider text-amber-300/80">Monthly total</p>
          <p className="font-heading font-black text-2xl text-white mt-1 font-mono tabular-nums">
            {fmt(monthlyTotal)}
          </p>
          <p className="text-[10px] text-stone-500 mt-1">committed every month</p>
        </div>
        <div className="border border-stone-800 rounded-md p-3 bg-stone-900/40">
          <p className="text-[9px] uppercase tracking-wider text-stone-500">Daily burn</p>
          <p className="font-heading font-black text-2xl text-white mt-1 font-mono tabular-nums">
            {fmt(dailyBurn)}
          </p>
          <p className="text-[10px] text-stone-500 mt-1">~30-day amortization</p>
        </div>
        <div className="border border-stone-800 rounded-md p-3 bg-stone-900/40">
          <p className="text-[9px] uppercase tracking-wider text-stone-500">Overhead per pot shipped</p>
          <p className="font-heading font-black text-2xl text-white mt-1 font-mono tabular-nums">
            {unitsThisMonth > 0 ? fmt(perUnit) : '—'}
          </p>
          <p className="text-[10px] text-stone-500 mt-1">
            {unitsThisMonth > 0 ? `${unitsThisMonth} units this period` : 'no units yet this period'}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.15em] text-stone-500 border-b border-stone-800">
              <th className="text-left  font-heading font-bold px-3 py-2">Category</th>
              <th className="text-left  font-heading font-bold px-3 py-2">Notes</th>
              <th className="text-right font-heading font-bold px-3 py-2">Monthly</th>
              <th className="text-right font-heading font-bold px-3 py-2">% of total</th>
            </tr>
          </thead>
          <tbody>
            {FIXED_COSTS_MONTHLY.map((c) => {
              const share = monthlyTotal > 0 ? c.monthly_cents / monthlyTotal : 0;
              return (
                <tr key={c.category} className="border-b border-stone-900 hover:bg-stone-900/40">
                  <td className="px-3 py-2 text-stone-200 font-medium">{c.category}</td>
                  <td className="px-3 py-2 text-stone-500 text-[12px]">{c.note ?? ''}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-white">{fmt(c.monthly_cents)}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-stone-400">{pct(share)}</td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-amber-500/40 bg-amber-500/5">
              <td className="px-3 py-2 font-heading font-bold text-amber-200 uppercase tracking-wider text-[11px]">
                Total fixed overhead
              </td>
              <td className="px-3 py-2" />
              <td className="px-3 py-2 text-right font-mono tabular-nums font-bold text-white">{fmt(monthlyTotal)}</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums text-stone-500">100.0%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-stone-400 leading-relaxed mt-4">
        <span className="text-amber-200 font-bold">Reality check:</span>{' '}
        before Jimmy sells a single pot this month, he has already committed{' '}
        <span className="text-white font-bold font-mono tabular-nums">{fmt(monthlyTotal)}</span>{' '}
        in fixed costs — that&apos;s about{' '}
        <span className="text-white font-bold font-mono tabular-nums">{fmt(dailyBurn)}</span>{' '}
        every single day the doors are open. At a blended ~$40 contribution per pot, the shop has to ship roughly{' '}
        <span className="text-white font-bold font-mono tabular-nums">{breakEvenUnits}</span>{' '}
        pots each month just to cover rent, power, and insurance — before payroll, materials, or profit.
      </p>
    </section>
  );
}

function BuyerTicker({
  wholesale,
  retail,
}: {
  wholesale: DrilldownOrder[];
  retail: DrilldownOrder[];
}) {
  const toItems = (orders: DrilldownOrder[]) =>
    orders.map((o, i) => ({
      idx: i + 1,
      id: o.id,
      name: o.buyer_name,
      qty: o.line_items.reduce((s, li) => s + li.quantity, 0),
      channel: o.channel.toUpperCase(),
    }));
  const wholesaleItems = toItems(wholesale);
  const retailItems    = toItems(retail);

  const renderLane = (
    items: ReturnType<typeof toItems>,
    tone: 'emerald' | 'sky',
    label: string,
  ) => {
    if (items.length === 0) return null;
    const border = tone === 'emerald' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-sky-500/30 bg-sky-500/5';
    const chip   = tone === 'emerald' ? 'bg-emerald-950 text-emerald-200' : 'bg-sky-950 text-sky-200';
    const dot    = tone === 'emerald' ? 'bg-emerald-400' : 'bg-sky-400';
    const speedClass = tone === 'emerald' ? 'ticker-track-wholesale' : 'ticker-track-retail';
    // Duplicate the items so translateX(-50%) hand-off is seamless.
    const doubled = [...items, ...items];
    return (
      <div className={`ticker-wrap relative overflow-hidden rounded-md border ${border}`}>
        <div className={`absolute left-0 top-0 bottom-0 z-20 flex items-center px-3 ${chip} border-r border-white/10 shadow-[4px_0_8px_rgba(0,0,0,0.5)]`}>
          <span className="text-[10px] font-heading font-bold uppercase tracking-[0.2em] whitespace-nowrap">
            {label} · {items.length}
          </span>
        </div>
        <div className="absolute left-[8rem] top-0 bottom-0 z-10 w-10 pointer-events-none bg-gradient-to-r from-stone-950 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 z-10 w-12 pointer-events-none bg-gradient-to-l from-stone-950 to-transparent" />
        <div
          className={`flex whitespace-nowrap py-2.5 ticker-track ${speedClass} pl-40`}
        >
          {doubled.map((it, i) => (
            <span key={`${it.id}-${i}`} className="inline-flex items-center gap-2 mx-6 text-[13px] font-body text-stone-200">
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
              <span className="font-mono text-stone-500 tabular-nums">{it.idx}.</span>
              <span className="font-medium">{it.name}</span>
              <span className="text-stone-500">·</span>
              <span className="font-mono tabular-nums text-white">{it.qty}</span>
              <span className="text-stone-500 text-[11px] uppercase tracking-wider">
                {it.qty === 1 ? 'pot' : 'pots'}
              </span>
              <span className="text-stone-600">·</span>
              <span className="text-[10px] uppercase tracking-wider text-stone-500">{it.channel}</span>
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="mb-6 space-y-2">
      {renderLane(wholesaleItems, 'emerald', 'Wholesale')}
      {renderLane(retailItems,    'sky',     'Retail')}
    </section>
  );
}

function ProductSummaryTable({ rows }: { rows: ProductSalesRow[] }) {
  const totalUnits = rows.reduce((s, r) => s + r.units_sold, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue_cents, 0);
  const topSeller = rows[0];
  const maxUnits = Math.max(...rows.map((r) => r.units_sold), 1);

  return (
    <section className="card-faire-detail p-5 mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">
            Product Sales Summary · Best Sellers
          </p>
          <p className="text-stone-400 text-xs font-body mt-1">
            Total units sold per SKU across all orders. Top-seller is row 1. Make more of what moves.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-heading font-bold uppercase tracking-wider">
          <span className="inline-flex items-center gap-1 rounded-full border border-stone-700 bg-stone-900/60 text-stone-300 px-2 py-0.5 font-mono tabular-nums">
            {rows.length} SKUs · {totalUnits} pots sold
          </span>
          {topSeller && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Top: {topSeller.units_sold} pots
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-stone-900/60 text-stone-400 text-[10px] uppercase tracking-wider">
            <tr>
              <th className="text-center px-2 py-2 w-8">#</th>
              <th className="text-left px-2 py-2 w-14">Photo</th>
              <th className="text-left px-3 py-2">Product</th>
              <th className="text-right px-3 py-2">Retail price</th>
              <th className="text-right px-3 py-2">Units sold</th>
              <th className="text-left px-3 py-2 w-40">Volume</th>
              <th className="text-right px-3 py-2">Revenue</th>
              <th className="text-right px-3 py-2">Orders</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-stone-500 text-center text-sm">
                  No product sales yet.
                </td>
              </tr>
            )}
            {rows.map((r, idx) => {
              const barPct = (r.units_sold / maxUnits) * 100;
              const wholesalePct = (r.wholesale_units / maxUnits) * 100;
              const rankTone =
                idx === 0 ? 'text-amber-300 font-bold' :
                idx === 1 ? 'text-stone-200 font-bold' :
                idx === 2 ? 'text-stone-400 font-bold' :
                            'text-stone-500';
              return (
                <tr key={r.product_id} className="border-t border-stone-800 hover:bg-stone-900/40 transition-colors">
                  <td className={`px-2 py-2.5 text-center font-mono tabular-nums ${rankTone}`}>
                    {idx + 1}
                  </td>
                  <td className="px-2 py-2">
                    {r.image_path ? (
                      <div className="relative w-11 h-11 rounded overflow-hidden bg-stone-800 border border-stone-700">
                        {/* Use plain img to avoid Next/Image remotePatterns config for local paths */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={r.image_path}
                          alt={r.product_name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-600 text-[9px]">
                        no img
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-stone-200 font-medium leading-tight">{r.product_name}</div>
                    <div className="text-stone-600 text-[10px] mt-0.5 font-mono">{r.product_id}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-stone-300">
                    {USD.format(r.retail_price_cents / 100)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-heading font-black text-base text-white font-mono tabular-nums">
                      {r.units_sold}
                    </span>
                    <span className="text-stone-500 text-[10px] uppercase tracking-wider ml-1">
                      {r.units_sold === 1 ? 'pot' : 'pots'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative h-3 rounded-sm bg-stone-900 overflow-hidden" title={`${r.retail_units} retail · ${r.wholesale_units} wholesale`}>
                      <div className="absolute inset-y-0 left-0 bg-sky-500/60" style={{ width: `${barPct}%` }} />
                      {r.wholesale_units > 0 && (
                        <div className="absolute inset-y-0 left-0 bg-emerald-400/70" style={{ width: `${wholesalePct}%` }} />
                      )}
                    </div>
                    <div className="text-[9px] text-stone-600 mt-1 flex gap-2">
                      <span className="text-emerald-400">W {r.wholesale_units}</span>
                      <span className="text-sky-400">R {r.retail_units}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-stone-200">
                    {USD.format(r.revenue_cents / 100)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-stone-400">
                    {r.order_count}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-stone-900/40 border-t-2 border-stone-800">
            <tr>
              <td colSpan={4} className="px-3 py-2.5 text-stone-500 text-[10px] uppercase tracking-wider">
                Totals across {rows.length} SKUs
              </td>
              <td className="px-3 py-2.5 text-right font-mono font-bold text-white">{totalUnits}</td>
              <td className="px-3 py-2.5"></td>
              <td className="px-3 py-2.5 text-right font-mono font-bold text-white">
                {USD.format(totalRevenue / 100)}
              </td>
              <td className="px-3 py-2.5"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-[10px] text-stone-600 mt-3">
        Bar legend: <span className="text-emerald-400">emerald</span> = wholesale share,{' '}
        <span className="text-sky-400">sky</span> = retail share. Ranked by units sold desc.
        Row #1 is your top-seller — double production on it when inventory dips.
      </p>
    </section>
  );
}

function DailyWorkloadChart({ daily }: { daily: DailyWorkload[] }) {
  const maxUnits = Math.max(...daily.map((d) => d.units), 1);
  const totalUnits = daily.reduce((s, d) => s + d.units, 0);
  const totalOrders = daily.reduce((s, d) => s + d.orderCount, 0);
  const busiestDay = daily.reduce((a, b) => (b.units > a.units ? b : a), daily[0]);
  const idleDayCount = daily.filter((d) => d.units === 0).length;

  return (
    <section className="card-faire-detail p-5 mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">
            Daily Workload · Last 14 Days
          </p>
          <p className="text-stone-400 text-xs font-body mt-1">
            How many pots landed each day, who the buyers were, and how many packers the day needs.
            Avoids overstaffing when the queue is light.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-heading font-bold uppercase tracking-wider">
          <span className="inline-flex items-center gap-1 rounded-full border border-stone-700 bg-stone-900/60 text-stone-300 px-2 py-0.5 font-mono tabular-nums">
            {totalOrders} orders · {totalUnits} pots
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> 0-2 packers
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> 3-4
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 text-red-300 px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> 5+
          </span>
        </div>
      </div>

      {/* Bar rows — one per day */}
      <div className="space-y-1 mb-4">
        {daily.map((d) => {
          const barPct = (d.units / maxUnits) * 100;
          const wholesalePct = (d.wholesaleUnits / maxUnits) * 100;
          const packerTone =
            d.packersNeeded === 0 ? 'text-stone-500 border-stone-700 bg-stone-900/40' :
            d.packersNeeded <= 2 ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' :
            d.packersNeeded <= 4 ? 'text-amber-300 border-amber-500/40 bg-amber-500/10' :
                                   'text-red-300 border-red-500/40 bg-red-500/10';
          const barTone =
            d.packersNeeded === 0 ? 'bg-stone-700/40' :
            d.packersNeeded <= 2 ? 'bg-emerald-500/60' :
            d.packersNeeded <= 4 ? 'bg-amber-500/70' :
                                   'bg-red-500/70';
          return (
            <div
              key={d.date}
              className={`grid grid-cols-12 items-center gap-3 px-2 py-2 rounded border ${
                d.isToday ? 'border-purple-500/50 bg-purple-500/5' : 'border-transparent'
              }`}
              title={d.buyerTags.length ? d.buyerTags.join('  |  ') : 'no orders'}
            >
              {/* Day label */}
              <div className="col-span-2 flex items-center gap-2 text-xs">
                <span className={`font-mono font-bold tabular-nums ${d.isWeekend ? 'text-stone-500' : 'text-stone-300'}`}>
                  {d.weekday}
                </span>
                <span className="text-stone-500 text-[11px]">{d.monthDay}</span>
                {d.isToday && (
                  <span className="rounded-full bg-purple-500/30 text-purple-200 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5">
                    Today
                  </span>
                )}
              </div>

              {/* Bar */}
              <div className="col-span-5 h-6 rounded-sm bg-stone-900 overflow-hidden relative">
                {/* retail + wholesale share same bar; wholesale layered darker on top */}
                <div className={`absolute inset-y-0 left-0 ${barTone}`} style={{ width: `${barPct}%` }} />
                {d.wholesaleUnits > 0 && (
                  <div className="absolute inset-y-0 left-0 bg-emerald-400/35" style={{ width: `${wholesalePct}%` }} />
                )}
              </div>

              {/* Units + order count */}
              <div className="col-span-2 flex items-baseline gap-2 justify-end">
                <span className="font-heading font-black text-base text-white font-mono tabular-nums">{d.units}</span>
                <span className="text-stone-500 text-[10px] uppercase tracking-wider">
                  {d.units === 1 ? 'pot' : 'pots'}
                </span>
              </div>
              <div className="col-span-1 text-right text-[11px] text-stone-500">
                {d.orderCount} {d.orderCount === 1 ? 'order' : 'orders'}
              </div>

              {/* Packers-needed pill */}
              <div className="col-span-2 text-right">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-heading font-bold uppercase tracking-wider ${packerTone}`}>
                  {d.packersNeeded === 0 ? 'Idle' : `${d.packersNeeded} packer${d.packersNeeded > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-stone-800">
        <Kpi label="Busiest day"   value={`${busiestDay.weekday} ${busiestDay.monthDay} · ${busiestDay.units}`} />
        <Kpi label="Idle days"     value={`${idleDayCount} / 14`} />
        <Kpi label="Total pots"    value={String(totalUnits)} />
        <Kpi label="Total orders"  value={String(totalOrders)} />
      </div>

      <p className="text-[11px] text-stone-500 leading-relaxed mt-4">
        Each bar = that day&apos;s orders. Darker overlay = wholesale slice. Packers-needed assumes{' '}
        <span className="text-stone-300 font-mono">{PACK_MINUTES_PER_POT} min</span> per pot pack time at a{' '}
        <span className="text-stone-300 font-mono">${(BLENDED_LABOR_RATE_PER_HOUR_CENTS / 100).toFixed(2)}/hr</span>{' '}
        rate — so a 50-pot Monday takes ~{Math.round((50 * PACK_MINUTES_PER_POT) / 60 * 10) / 10} packer-hours (1 person).
        Hover a row to see buyer names.
      </p>
    </section>
  );
}

function Kpi({ label, value, tone = 'text-white' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card-faire-detail p-4">
      <p className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">{label}</p>
      <p className={`font-heading font-black text-xl mt-1 ${tone}`}>{value}</p>
    </div>
  );
}

function SegmentSummary({
  title,
  color,
  orders,
  units,
  revenue,
  margin,
  marginPct,
}: {
  title: string;
  color: 'emerald' | 'sky';
  orders: number;
  units: number;
  revenue: number;
  margin: number;
  marginPct: number;
}) {
  const dot = color === 'emerald' ? 'bg-emerald-400' : 'bg-sky-400';
  const barGradient =
    color === 'emerald'
      ? 'from-emerald-500 to-emerald-300'
      : 'from-sky-500 to-sky-300';
  const marginTone =
    marginPct < 0.15 ? 'text-red-300' :
    marginPct < 0.3 ? 'text-amber-300' : 'text-emerald-300';
  const barWidth = Math.min(100, marginPct * 100 * 2); // scale so 50% margin fills the bar

  return (
    <div className="bg-stone-900/40 border border-stone-800 rounded-md p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <h3 className="font-heading font-bold text-white text-sm uppercase tracking-wider">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
        <span className="text-stone-400">Orders</span><span className="text-right font-mono text-stone-200">{orders}</span>
        <span className="text-stone-400">Units</span><span className="text-right font-mono text-stone-200">{units}</span>
        <span className="text-stone-400">Revenue</span><span className="text-right font-mono text-stone-200">{fmt(revenue)}</span>
        <span className="text-stone-400">You keep</span><span className={`text-right font-mono ${marginTone}`}>{fmt(margin)}</span>
        <span className="text-stone-400 font-bold">Your take</span><span className={`text-right font-mono font-bold ${marginTone}`}>{pct(marginPct)}</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-stone-900 overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${barGradient}`} style={{ width: `${barWidth}%` }} />
      </div>
    </div>
  );
}

// /admin/pnl/statement — CPA-grade monthly + quarterly + annual P&L
// statement. Replaces the bookkeeper/CPA monthly reconciliation step.
//
// Opens in a new tab from the admin dashboard and /admin/pnl. Every number
// is computed from typed Supabase rows via the same pnl.ts engine that
// powers the rest of the admin surface, so this view CANNOT drift from
// /admin/pnl, /admin/pnl/drilldown, /admin/margins, or the MTD card on
// /admin.

import Link from 'next/link';
import { loadPnlStatement } from '@/lib/pnl-statement-data';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'CPA Statement — Admin — Jimmy Potters',
  robots: 'noindex, nofollow',
};

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmt = (c: number) => USD.format(c / 100);
const fmtPlain = (c: number) => (c / 100).toFixed(2);
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function parseYear(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return new Date().getUTCFullYear();
  if (n < 2020 || n > 2099) return new Date().getUTCFullYear();
  return Math.floor(n);
}

export default async function PnlStatementPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const year = parseYear(sp?.year);
  const statement = await loadPnlStatement(year, true);
  const { monthly, quarterly, annual, priorAnnual, scheduleC, salesTaxByStateMonth, has_estimates } = statement;

  const yoyDelta = priorAnnual ? annual.net_profit - priorAnnual.net_profit : null;
  const yoyPct = priorAnnual && priorAnnual.net_profit !== 0
    ? (annual.net_profit - priorAnnual.net_profit) / Math.abs(priorAnnual.net_profit)
    : null;

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200 print:bg-white print:text-stone-900">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · CPA Statement
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight print:text-stone-900">
              Profit &amp; Loss Statement · {year}
            </h1>
            <p className="text-stone-400 text-sm font-body mt-2 print:text-stone-600">
              Cash basis · Monthly, quarterly, annual · IRS Schedule C mapping · Sales tax by state
              {has_estimates && (
                <span className="ml-2 inline-block rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5">
                  Includes COGS estimates
                </span>
              )}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2 print:hidden">
            <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-200 underline">← Dashboard</Link>
            <Link href="/admin/pnl" className="text-xs text-stone-400 hover:text-stone-200 underline">Range P&amp;L</Link>
            <Link href="/admin/pnl/drilldown" className="text-xs text-stone-400 hover:text-stone-200 underline">Drill-Down</Link>
            <YearSelector year={year} />
            <Link
              href={`/admin/pnl/statement/csv?year=${year}`}
              className="btn-faire !w-auto flex-shrink-0"
            >
              Export CSV
            </Link>
          </nav>
        </header>

        {/* Annual headline */}
        <section className="mb-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Kpi label="Gross Revenue" value={fmt(annual.gross_revenue)} tone="text-white" />
          <Kpi label="COGS" value={fmt(annual.total_cogs)} tone="text-stone-300" />
          <Kpi label="Gross Profit" value={fmt(annual.gross_profit)} tone="text-stone-200" />
          <Kpi label="Operating Expenses" value={fmt(annual.operating_expenses)} tone="text-stone-300" />
          <Kpi
            label="Net Profit"
            value={fmt(annual.net_profit)}
            tone={annual.net_profit > 0 ? 'text-emerald-300' : annual.net_profit < 0 ? 'text-red-300' : 'text-stone-200'}
          />
          <Kpi
            label="Margin"
            value={pct(annual.margin_pct)}
            tone={annual.margin_pct > 0.3 ? 'text-emerald-300' : annual.margin_pct > 0.15 ? 'text-amber-300' : 'text-red-300'}
          />
        </section>

        {/* Year-over-year */}
        {priorAnnual && (
          <section className="mb-8 card-faire-detail p-5">
            <p className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
              Year-over-Year · {year - 1} → {year}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <YoyCell label="Gross Revenue" current={annual.gross_revenue} prior={priorAnnual.gross_revenue} />
              <YoyCell label="Gross Profit"  current={annual.gross_profit}  prior={priorAnnual.gross_profit} />
              <YoyCell label="Net Profit"    current={annual.net_profit}    prior={priorAnnual.net_profit} />
              <YoyCell label="Orders"        current={annual.order_count}   prior={priorAnnual.order_count} isCount />
            </div>
            {yoyDelta !== null && yoyPct !== null && (
              <p className="text-[11px] text-stone-500 mt-3">
                Net profit change: <span className={yoyDelta >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                  {yoyDelta >= 0 ? '+' : ''}{fmt(yoyDelta)} ({yoyDelta >= 0 ? '+' : ''}{pct(yoyPct)})
                </span>
              </p>
            )}
          </section>
        )}

        {/* Monthly P&L grid */}
        <section className="mb-8">
          <h2 className="text-lg font-heading font-bold text-white mb-3">Monthly Breakdown</h2>
          <div className="card-faire-detail p-0 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-900/60 text-stone-400 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="text-left px-3 py-2">Month</th>
                  <th className="text-right px-3 py-2">Orders</th>
                  <th className="text-right px-3 py-2">Gross Revenue</th>
                  <th className="text-right px-3 py-2">Sales Tax</th>
                  <th className="text-right px-3 py-2">COGS</th>
                  <th className="text-right px-3 py-2">Stripe Fees</th>
                  <th className="text-right px-3 py-2">Gross Profit</th>
                  <th className="text-right px-3 py-2">Op. Expenses</th>
                  <th className="text-right px-3 py-2">Net Profit</th>
                  <th className="text-right px-3 py-2">Margin</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((row) => {
                  const netTone =
                    row.aggregate.net_profit > 0 ? 'text-emerald-300' :
                    row.aggregate.net_profit < 0 ? 'text-red-300' : 'text-stone-400';
                  const marginPct = row.aggregate.gross_revenue > 0
                    ? row.aggregate.net_profit / row.aggregate.gross_revenue
                    : 0;
                  const marginTone =
                    marginPct < 0.15 ? 'text-red-300' :
                    marginPct < 0.3 ? 'text-amber-300' : 'text-emerald-300';
                  return (
                    <tr key={row.monthKey} className="border-t border-stone-800 hover:bg-stone-900/40 transition-colors">
                      <td className="px-3 py-2 text-stone-200 font-medium">
                        {row.short} <span className="text-stone-500 text-[10px] ml-1">{row.from.slice(5)}–{row.to.slice(5)}</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-stone-400">{row.aggregate.order_count}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-stone-200">{fmt(row.aggregate.gross_revenue)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-stone-500">{fmt(row.aggregate.sales_tax_collected)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-stone-300">{fmt(row.aggregate.total_cogs)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-stone-500">{fmt(row.aggregate.total_stripe_fees)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-stone-200">{fmt(row.aggregate.gross_profit)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-stone-300">{fmt(row.aggregate.operating_expenses)}</td>
                      <td className={`px-3 py-2 text-right font-mono tabular-nums font-semibold ${netTone}`}>{fmt(row.aggregate.net_profit)}</td>
                      <td className={`px-3 py-2 text-right font-mono tabular-nums ${marginTone}`}>{pct(marginPct)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-stone-900/60 border-t-2 border-stone-700">
                <tr>
                  <td className="px-3 py-2.5 text-stone-300 uppercase text-[10px] tracking-wider font-bold">Total {year}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-white">{annual.order_count}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-white">{fmt(annual.gross_revenue)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-stone-400">{fmt(annual.sales_tax_collected)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-stone-200">{fmt(annual.total_cogs)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-stone-400">{fmt(annual.total_stripe_fees)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-white">{fmt(annual.gross_profit)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-stone-200">{fmt(annual.operating_expenses)}</td>
                  <td className={`px-3 py-2.5 text-right font-mono tabular-nums font-bold ${annual.net_profit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {fmt(annual.net_profit)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono tabular-nums font-bold ${annual.margin_pct > 0.3 ? 'text-emerald-300' : annual.margin_pct > 0.15 ? 'text-amber-300' : 'text-red-300'}`}>
                    {pct(annual.margin_pct)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Quarterly rollup */}
        <section className="mb-8">
          <h2 className="text-lg font-heading font-bold text-white mb-3">Quarterly Rollup</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {quarterly.map((q) => {
              const netTone =
                q.net_profit > 0 ? 'text-emerald-300' :
                q.net_profit < 0 ? 'text-red-300' : 'text-stone-400';
              return (
                <div key={q.quarter} className="card-faire-detail p-4">
                  <p className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">{q.label}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{q.order_count} order{q.order_count === 1 ? '' : 's'}</p>
                  <div className="mt-3 space-y-1 text-sm font-mono tabular-nums">
                    <Row label="Revenue"      value={fmt(q.gross_revenue)} />
                    <Row label="COGS"         value={fmt(q.total_cogs)} />
                    <Row label="Gross Profit" value={fmt(q.gross_profit)} />
                    <Row label="OpEx"         value={fmt(q.operating_expenses)} />
                    <div className="h-px bg-stone-800 my-1" />
                    <Row label="Net"          value={fmt(q.net_profit)} tone={netTone} strong />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* IRS Schedule C mapping */}
        <section className="mb-8">
          <h2 className="text-lg font-heading font-bold text-white mb-3">IRS Schedule C Mapping · {year}</h2>
          <p className="text-stone-500 text-xs font-body mb-3">
            Every line below maps directly to Form 1040 Schedule C (Profit or Loss from Business). Year-end
            filing becomes a copy operation — Brian Fay reviews, does not reconstruct.
          </p>
          <div className="card-faire-detail p-5">
            <table className="w-full text-sm">
              <tbody>
                <tr><td colSpan={3} className="pb-2 text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">Part I · Income</td></tr>
                <ScheduleRow line="1"  label="Gross receipts or sales"        value={fmt(scheduleC.line1_gross_receipts)} />
                <ScheduleRow line="2"  label="Returns and allowances"         value={fmt(scheduleC.line2_returns_allowances)} />
                <ScheduleRow line="3"  label="Subtract line 2 from line 1"   value={fmt(scheduleC.line3_net_receipts)} bold />
                <ScheduleRow line="4"  label="Cost of goods sold (Part III)" value={fmt(scheduleC.line4_cogs)} />
                <ScheduleRow line="7"  label="Gross income"                   value={fmt(scheduleC.line7_gross_income)} bold />
                <tr><td colSpan={3} className="pt-4 pb-2 text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">Part II · Expenses</td></tr>
                <ScheduleRow line="11" label="Commissions and fees (Stripe)"  value={fmt(scheduleC.line11_commissions_fees)} />
                <ScheduleRow line="15" label="Insurance (other than health)"  value={fmt(scheduleC.line15_insurance)} subnote="TODO: split Shipsurance out of COGS freight" />
                <ScheduleRow line="—"  label="Other operating expenses"      value={fmt(scheduleC.line_other_operating)} />
                <ScheduleRow line="28" label="Total expenses"                 value={fmt(scheduleC.line28_total_expenses)} bold />
                <tr><td colSpan={3} className="pt-4 pb-2 text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">Net</td></tr>
                <ScheduleRow
                  line="31"
                  label="Net profit or loss (flows to Form 1040 line 3)"
                  value={fmt(scheduleC.line31_net_profit)}
                  bold
                  tone={scheduleC.line31_net_profit >= 0 ? 'text-emerald-300' : 'text-red-300'}
                />
                <tr><td colSpan={3} className="pt-4 pb-2 text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">Estimated Tax (Planning Only · Brian Fay Reviews)</td></tr>
                <ScheduleRow line="—" label="Estimated self-employment tax (~15.3%)"  value={fmt(scheduleC.estimated_se_tax)} tone="text-amber-300" />
                <ScheduleRow line="—" label="Estimated federal income tax (~12% bracket)" value={fmt(scheduleC.estimated_federal_income_tax)} tone="text-amber-300" />
              </tbody>
            </table>
          </div>
        </section>

        {/* Sales tax × state × month grid */}
        {salesTaxByStateMonth.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-heading font-bold text-white mb-3">Sales Tax by State × Month</h2>
            <p className="text-stone-500 text-xs font-body mb-3">
              Remittance worksheet. Florida remits monthly; most other states quarterly. Cents precision retained.
            </p>
            <div className="card-faire-detail p-0 overflow-hidden overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-stone-900/60 text-stone-400 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2 sticky left-0 bg-stone-900">State</th>
                    {Array.from({ length: 12 }, (_, i) => (
                      <th key={i} className="text-right px-2 py-2">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}</th>
                    ))}
                    <th className="text-right px-3 py-2 font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {salesTaxByStateMonth.map((row) => (
                    <tr key={row.state} className="border-t border-stone-800 hover:bg-stone-900/40">
                      <td className="px-3 py-2 text-stone-200 font-medium sticky left-0 bg-stone-950">{row.state}</td>
                      {row.monthly.map((c, i) => (
                        <td key={i} className={`px-2 py-2 text-right font-mono tabular-nums ${c > 0 ? 'text-stone-300' : 'text-stone-700'}`}>
                          {c > 0 ? fmtPlain(c) : '—'}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-white font-bold">{fmt(row.annual_total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-stone-900/60 border-t-2 border-stone-700">
                  <tr>
                    <td className="px-3 py-2.5 text-[10px] uppercase tracking-wider text-stone-400 font-bold sticky left-0 bg-stone-900">Total</td>
                    {Array.from({ length: 12 }, (_, i) => {
                      const col = salesTaxByStateMonth.reduce((s, r) => s + r.monthly[i], 0);
                      return (
                        <td key={i} className="px-2 py-2.5 text-right font-mono tabular-nums font-bold text-white">
                          {col > 0 ? fmtPlain(col) : '—'}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-white">
                      {fmt(annual.sales_tax_collected)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {/* Footer provenance */}
        <footer className="text-[10px] text-stone-600 border-t border-stone-800 pt-4">
          <p>
            Cash basis · Every line computed from typed Supabase rows via <code className="text-stone-400">src/lib/pnl.ts</code> →{' '}
            <code className="text-stone-400">src/lib/pnl-statement.ts</code>. No manual data entry. No reconciliation step.
          </p>
          <p className="mt-1">
            Schedule C mapping is CPA-grade but tax amounts are planning estimates — Brian Fay, CPA reviews before filing.
            Shipsurance currently bucketed into COGS freight; Phase-2 split to line 15 pending.
          </p>
        </footer>
      </div>
    </main>
  );
}

// ---------- Small components ----------

function Kpi({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="card-faire-detail p-4">
      <p className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">{label}</p>
      <p className={`font-heading font-black text-xl mt-1 ${tone}`}>{value}</p>
    </div>
  );
}

function YearSelector({ year }: { year: number }) {
  const options = [year + 1, year, year - 1, year - 2].filter((y, i, a) => a.indexOf(y) === i);
  return (
    <form method="get" className="flex items-center gap-2">
      <label className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Year</label>
      <select
        name="year"
        defaultValue={year}
        className="bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded px-2 py-1 font-mono tabular-nums"
      >
        {options.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      <button type="submit" className="text-xs text-[#C9A96E] hover:underline">Go</button>
    </form>
  );
}

function YoyCell({ label, current, prior, isCount = false }: { label: string; current: number; prior: number; isCount?: boolean }) {
  const delta = current - prior;
  const deltaPct = prior !== 0 ? delta / Math.abs(prior) : null;
  const tone = delta >= 0 ? 'text-emerald-300' : 'text-red-300';
  const display = (v: number) => (isCount ? String(v) : fmt(v));
  return (
    <div className="border border-stone-800 rounded-md p-3 bg-stone-900/40">
      <p className="text-[10px] uppercase tracking-wider text-stone-500">{label}</p>
      <p className="text-lg font-heading font-black text-white mt-1 font-mono tabular-nums">{display(current)}</p>
      <p className="text-[11px] text-stone-500 mt-0.5 font-mono">
        prior: {display(prior)} · <span className={tone}>{delta >= 0 ? '+' : ''}{isCount ? delta : fmt(delta)}{deltaPct !== null ? ` (${delta >= 0 ? '+' : ''}${pct(deltaPct)})` : ''}</span>
      </p>
    </div>
  );
}

function Row({ label, value, tone = 'text-stone-200', strong = false }: { label: string; value: string; tone?: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={strong ? 'text-stone-100 font-bold' : 'text-stone-400'}>{label}</span>
      <span className={`${tone} ${strong ? 'font-bold' : ''}`}>{value}</span>
    </div>
  );
}

function ScheduleRow({
  line,
  label,
  value,
  bold = false,
  tone = 'text-stone-200',
  subnote,
}: {
  line: string;
  label: string;
  value: string;
  bold?: boolean;
  tone?: string;
  subnote?: string;
}) {
  return (
    <tr className="border-t border-stone-800">
      <td className="px-2 py-2 text-[10px] font-mono text-stone-500 text-center w-12">{line}</td>
      <td className={`px-3 py-2 ${bold ? 'text-stone-100 font-bold' : 'text-stone-300'}`}>
        {label}
        {subnote && <div className="text-[10px] text-stone-500 font-body mt-0.5">{subnote}</div>}
      </td>
      <td className={`px-3 py-2 text-right font-mono tabular-nums ${tone} ${bold ? 'font-bold' : ''}`}>{value}</td>
    </tr>
  );
}

import Link from 'next/link';
import { loadPnlRangeData, rangePresets } from '@/lib/pnl-data';
import DateRangeBar from './DateRangeBar';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'P&L Report — Admin — Jimmy Potters', robots: 'noindex, nofollow' };

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmtCents = (c: number) => USD.format(c / 100);

function resolveRange(searchParams: Record<string, string | string[] | undefined>) {
  const presets = rangePresets();
  const fromRaw = typeof searchParams.from === 'string' ? searchParams.from : '';
  const toRaw = typeof searchParams.to === 'string' ? searchParams.to : '';
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (iso.test(fromRaw) && iso.test(toRaw) && fromRaw <= toRaw) {
    return { from: fromRaw, to: toRaw };
  }
  // Default to MTD.
  return { from: presets.mtd.from, to: presets.mtd.to };
}

export default async function PnlReportPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { from, to } = resolveRange(searchParams);
  const data = await loadPnlRangeData(from, to);
  const { aggregate: pnl, orders, uncoveredSkus } = data;

  const presets = rangePresets();
  const presetList = [
    { key: 'mtd',         ...presets.mtd },
    { key: 'lastMonth',   ...presets.lastMonth },
    { key: 'lastQuarter', ...presets.lastQuarter },
    { key: 'ytd',         ...presets.ytd },
    { key: 'lastYear',    ...presets.lastYear },
  ];

  const exportQs = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  const netProfitTone =
    pnl.net_profit < 0 ? 'text-red-300' : pnl.net_profit === 0 ? 'text-stone-200' : 'text-emerald-300';

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200 print:bg-white print:text-black">
      <div className="max-w-6xl mx-auto p-6 md:p-10 print:p-0">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2 print:text-stone-600">
              Admin · P&amp;L Report
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight print:text-black">
              Profit &amp; Loss
            </h1>
            <p className="text-stone-400 text-sm font-body mt-2 print:text-stone-700">
              Range: <span className="text-stone-300 print:text-black">{from}</span> →{' '}
              <span className="text-stone-300 print:text-black">{to}</span> · {pnl.order_count} order
              {pnl.order_count === 1 ? '' : 's'}
              {pnl.has_estimates && (
                <span className="ml-2 inline-block rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 print:hidden">
                  Includes COGS estimates
                </span>
              )}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2 print:hidden">
            <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← Dashboard
            </Link>
            <PrintButton />
            <Link href={`/admin/pnl/pdf${exportQs}`} className="btn-faire !w-auto" prefetch={false}>
              PDF
            </Link>
            <Link href={`/admin/pnl/csv${exportQs}`} className="btn-faire !w-auto" prefetch={false}>
              CSV
            </Link>
          </nav>
        </header>

        <div className="mb-6">
          <DateRangeBar from={from} to={to} presets={presetList} />
        </div>

        {uncoveredSkus.length > 0 && (
          <div className="mb-6 card-faire-detail p-4 border border-amber-500/40 print:hidden">
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-amber-300">
              {uncoveredSkus.length} product{uncoveredSkus.length === 1 ? '' : 's'} missing cost templates
            </p>
            <p className="text-stone-400 text-xs font-body mt-1">
              P&amp;L overstates margin for orders containing:{' '}
              <span className="text-stone-300 break-all">{uncoveredSkus.slice(0, 5).join(', ')}
                {uncoveredSkus.length > 5 ? ` + ${uncoveredSkus.length - 5} more` : ''}</span>
              .{' '}
              <Link href="/admin/products/costs" className="text-[#C9A96E] hover:underline">
                Fill cost templates →
              </Link>
            </p>
          </div>
        )}

        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 print:grid-cols-3 print:gap-2">
          <Kpi label="Gross Revenue" value={fmtCents(pnl.gross_revenue)} />
          <Kpi label="Sales Tax" value={fmtCents(pnl.sales_tax_collected)} sub="Pass-through" />
          <Kpi label="Total COGS" value={fmtCents(pnl.total_cogs)} />
          <Kpi label="Stripe Fees" value={fmtCents(pnl.total_stripe_fees)} />
          <Kpi label="Overhead" value={fmtCents(pnl.operating_expenses)} />
          <Kpi label="Net Profit" value={fmtCents(pnl.net_profit)} valueClass={netProfitTone} />
        </section>

        <section className="mb-8">
          <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3 print:text-stone-700">
            Sales Tax by State
          </h2>
          <div className="card-faire-detail p-0 overflow-hidden print:border print:border-stone-300">
            <table className="w-full text-sm">
              <thead className="bg-stone-900/60 text-stone-400 text-[10px] uppercase tracking-wider print:bg-stone-100 print:text-stone-700">
                <tr>
                  <th className="text-left px-4 py-2">State</th>
                  <th className="text-right px-4 py-2">Orders</th>
                  <th className="text-right px-4 py-2">Tax Collected</th>
                </tr>
              </thead>
              <tbody>
                {pnl.sales_tax_by_state.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-stone-500 text-center">No sales tax in range.</td>
                  </tr>
                ) : (
                  pnl.sales_tax_by_state.map((row) => (
                    <tr key={row.state} className="border-t border-stone-800 print:border-stone-200">
                      <td className="px-4 py-2 font-mono text-stone-200 print:text-black">{row.state || 'UNKNOWN'}</td>
                      <td className="px-4 py-2 text-right text-stone-300 print:text-black">{row.order_count}</td>
                      <td className="px-4 py-2 text-right text-stone-200 print:text-black">{fmtCents(row.tax_cents)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3 print:text-stone-700">
            Per-Order P&amp;L
          </h2>
          <div className="card-faire-detail p-0 overflow-x-auto print:border print:border-stone-300">
            <table className="w-full text-xs">
              <thead className="bg-stone-900/60 text-stone-400 text-[10px] uppercase tracking-wider print:bg-stone-100 print:text-stone-700">
                <tr>
                  <th className="text-left px-3 py-2">Date</th>
                  <th className="text-left px-3 py-2">Order</th>
                  <th className="text-left px-3 py-2">Customer</th>
                  <th className="text-left px-3 py-2">State</th>
                  <th className="text-right px-3 py-2">Revenue</th>
                  <th className="text-right px-3 py-2">Tax</th>
                  <th className="text-right px-3 py-2">COGS</th>
                  <th className="text-right px-3 py-2">Stripe</th>
                  <th className="text-right px-3 py-2">Gross Profit</th>
                </tr>
              </thead>
              <tbody>
                {pnl.per_order.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-stone-500 text-center">No revenue orders in range.</td>
                  </tr>
                ) : (
                  pnl.per_order.map((p) => {
                    const o = orders.find((x) => x.id === p.order_id);
                    const profitTone =
                      p.gross_profit < 0 ? 'text-red-300' : p.gross_profit === 0 ? 'text-stone-300' : 'text-emerald-300';
                    return (
                      <tr key={p.order_id} className="border-t border-stone-800 print:border-stone-200">
                        <td className="px-3 py-2 text-stone-400 whitespace-nowrap print:text-black">
                          {o ? new Date(o.created_at).toISOString().slice(0, 10) : '—'}
                        </td>
                        <td className="px-3 py-2 font-mono print:text-black">
                          <Link
                            href={`/admin/orders/${p.order_id}`}
                            className="text-[#C9A96E] hover:underline print:text-black"
                          >
                            {p.order_id.slice(0, 8)}
                          </Link>
                          {p.uses_estimate && (
                            <span className="ml-1 text-amber-400 print:hidden" title="Uses template estimate">≈</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-stone-300 print:text-black">{o?.email ?? '—'}</td>
                        <td className="px-3 py-2 text-stone-300 print:text-black">{o?.buyer_state || '—'}</td>
                        <td className="px-3 py-2 text-right font-mono text-stone-200 print:text-black">
                          {fmtCents(p.revenue - p.sales_tax_passthrough)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-stone-400 print:text-black">
                          {fmtCents(p.sales_tax_passthrough)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-stone-300 print:text-black">
                          {fmtCents(p.cogs_total)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-stone-400 print:text-black">
                          {fmtCents(p.stripe_fee)}
                        </td>
                        <td className={`px-3 py-2 text-right font-mono ${profitTone} print:text-black`}>
                          {fmtCents(p.gross_profit)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {pnl.per_order.length > 0 && (
                <tfoot className="bg-stone-900/40 text-stone-200 font-semibold print:bg-stone-100 print:text-black">
                  <tr className="border-t border-stone-700 print:border-stone-400">
                    <td colSpan={4} className="px-3 py-2 text-right uppercase tracking-wider text-[10px] text-stone-400 print:text-stone-700">
                      Totals
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{fmtCents(pnl.gross_revenue)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtCents(pnl.sales_tax_collected)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtCents(pnl.total_cogs)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtCents(pnl.total_stripe_fees)}</td>
                    <td className={`px-3 py-2 text-right font-mono ${netProfitTone} print:text-black`}>
                      {fmtCents(pnl.gross_profit)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3 print:text-stone-700">
            Summary
          </h2>
          <div className="card-faire-detail p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 text-sm print:border print:border-stone-300">
            <SumRow label="Gross Revenue"     value={fmtCents(pnl.gross_revenue)} />
            <SumRow label="Sales Tax Collected" value={fmtCents(pnl.sales_tax_collected)} note="pass-through to states" />
            <SumRow label="Total COGS"        value={`− ${fmtCents(pnl.total_cogs)}`} />
            <SumRow label="Stripe Fees"       value={`− ${fmtCents(pnl.total_stripe_fees)}`} />
            <SumRow label="Gross Profit"      value={fmtCents(pnl.gross_profit)} />
            <SumRow label="Overhead / OpEx"   value={`− ${fmtCents(pnl.operating_expenses)}`} />
            <SumRow label="Net Profit"        value={fmtCents(pnl.net_profit)} strong valueClass={netProfitTone} />
          </div>
        </section>
      </div>
    </main>
  );
}

function Kpi({
  label,
  value,
  sub,
  valueClass = 'text-white',
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="card-faire-detail p-4 print:border print:border-stone-300">
      <p className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 print:text-stone-700">
        {label}
      </p>
      <p className={`font-heading font-black text-xl mt-1 ${valueClass} print:text-black`}>{value}</p>
      {sub && <p className="text-stone-500 text-[10px] mt-1 print:text-stone-600">{sub}</p>}
    </div>
  );
}

function SumRow({
  label,
  value,
  note,
  strong,
  valueClass,
}: {
  label: string;
  value: string;
  note?: string;
  strong?: boolean;
  valueClass?: string;
}) {
  return (
    <div className={`flex items-baseline justify-between ${strong ? 'border-t border-stone-800 pt-2 mt-1 print:border-stone-400' : ''}`}>
      <span className={`${strong ? 'font-heading font-bold text-stone-200 print:text-black' : 'text-stone-400 print:text-stone-700'} text-sm`}>
        {label}
        {note && <span className="text-[10px] text-stone-500 ml-2 print:text-stone-600">({note})</span>}
      </span>
      <span className={`font-mono ${strong ? 'text-lg' : 'text-sm'} ${valueClass ?? 'text-stone-100 print:text-black'}`}>
        {value}
      </span>
    </div>
  );
}

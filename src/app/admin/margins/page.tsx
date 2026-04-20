import Link from 'next/link';
import { loadMarginRangeData } from '@/lib/margin-data';
import { rangePresets } from '@/lib/pnl-data';
import DateRangeBar from '../pnl/DateRangeBar';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Margins — Admin — Jimmy Potters', robots: 'noindex, nofollow' };

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmtCents = (c: number) => USD.format(c / 100);
const fmtPct = (p: number) => `${(p * 100).toFixed(1)}%`;

function resolveRange(searchParams: Record<string, string | string[] | undefined>) {
  const presets = rangePresets();
  const fromRaw = typeof searchParams.from === 'string' ? searchParams.from : '';
  const toRaw = typeof searchParams.to === 'string' ? searchParams.to : '';
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (iso.test(fromRaw) && iso.test(toRaw) && fromRaw <= toRaw) {
    return { from: fromRaw, to: toRaw };
  }
  return { from: presets.ytd.from, to: presets.ytd.to };
}

function marginTone(pct: number, units: number) {
  if (units === 0) return 'text-stone-500';
  if (pct < 0) return 'text-red-300';
  if (pct < 0.3) return 'text-amber-300';
  return 'text-emerald-300';
}

export default async function MarginsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { from, to } = resolveRange(searchParams);
  const data = await loadMarginRangeData(from, to);
  const { rows, totals, uncoveredSkus, bulkOrdersMissingVolumeCost } = data;

  const presets = rangePresets();
  const presetList = [
    { key: 'mtd', ...presets.mtd },
    { key: 'lastMonth', ...presets.lastMonth },
    { key: 'lastQuarter', ...presets.lastQuarter },
    { key: 'ytd', ...presets.ytd },
    { key: 'lastYear', ...presets.lastYear },
  ];

  const totalUnits = totals.retail_units + totals.bulk_units;
  const retailSharePct = totalUnits > 0 ? totals.retail_units / totalUnits : 0;
  const bulkSharePct = totalUnits > 0 ? totals.bulk_units / totalUnits : 0;
  const blendedMarginPct =
    totals.retail_revenue + totals.bulk_revenue > 0
      ? totals.total_margin_contribution / (totals.retail_revenue + totals.bulk_revenue)
      : 0;

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · Margins
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">
              Retail vs Bulk
            </h1>
            <p className="text-stone-400 text-sm font-body mt-2">
              Range: <span className="text-stone-300">{from}</span> → <span className="text-stone-300">{to}</span>
              {' · '}
              {totalUnits} unit{totalUnits === 1 ? '' : 's'} across {rows.length} SKU
              {rows.length === 1 ? '' : 's'}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← Dashboard
            </Link>
            <Link href="/admin/pnl" className="btn-faire !w-auto">
              P&amp;L Report
            </Link>
            <Link href="/admin/products/costs" className="btn-faire !w-auto">
              Cost Templates
            </Link>
          </nav>
        </header>

        <div className="mb-6">
          <DateRangeBar from={from} to={to} presets={presetList} basePath="/admin/margins" />
        </div>

        {(uncoveredSkus.length > 0 || bulkOrdersMissingVolumeCost > 0) && (
          <div className="mb-6 card-faire-detail p-4 border border-amber-500/40 space-y-2">
            {uncoveredSkus.length > 0 && (
              <p className="text-stone-400 text-xs font-body">
                <span className="text-amber-300 font-heading font-bold uppercase tracking-wider text-[11px] mr-2">
                  {uncoveredSkus.length} SKU{uncoveredSkus.length === 1 ? '' : 's'} missing cost templates
                </span>
                Margin pct reads high for these —{' '}
                <Link href="/admin/products/costs" className="text-[#C9A96E] hover:underline">
                  fill cost templates →
                </Link>
              </p>
            )}
            {bulkOrdersMissingVolumeCost > 0 && (
              <p className="text-stone-400 text-xs font-body">
                <span className="text-amber-300 font-heading font-bold uppercase tracking-wider text-[11px] mr-2">
                  {bulkOrdersMissingVolumeCost} bulk order
                  {bulkOrdersMissingVolumeCost === 1 ? '' : 's'} missing volume unit cost
                </span>
                Bulk COGS defaults to per-pot template × quantity until volume unit cost is set on the
                order.
              </p>
            )}
          </div>
        )}

        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          <Kpi label="Retail Units" value={String(totals.retail_units)} sub={fmtPct(retailSharePct)} />
          <Kpi label="Retail Revenue" value={fmtCents(totals.retail_revenue)} />
          <Kpi label="Retail Margin" value={fmtCents(totals.retail_margin)} />
          <Kpi label="Bulk Units" value={String(totals.bulk_units)} sub={fmtPct(bulkSharePct)} />
          <Kpi label="Bulk Revenue" value={fmtCents(totals.bulk_revenue)} />
          <Kpi label="Bulk Margin" value={fmtCents(totals.bulk_margin)} />
        </section>

        <section className="mb-6 card-faire-detail p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <p className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">
                Blended Margin Contribution
              </p>
              <p
                className={`font-heading font-black text-3xl mt-2 ${
                  totals.total_margin_contribution < 0 ? 'text-red-300' : 'text-emerald-300'
                }`}
              >
                {fmtCents(totals.total_margin_contribution)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">
                Blended Margin %
              </p>
              <p className={`font-heading font-black text-2xl mt-2 ${marginTone(blendedMarginPct, totalUnits)}`}>
                {totalUnits > 0 ? fmtPct(blendedMarginPct) : '—'}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
            Per-SKU Contribution
          </h2>
          {rows.length === 0 ? (
            <div className="card-faire-detail p-6 border border-stone-700">
              <p className="text-stone-400 text-sm">
                No revenue-status orders in this range. Pick a longer window or check{' '}
                <Link href="/admin/orders" className="text-[#C9A96E] hover:underline">
                  /admin/orders
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="card-faire-detail p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-stone-900/60 text-stone-400 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-4 py-3">SKU</th>
                      <th className="text-right px-3 py-3">Retail Units</th>
                      <th className="text-right px-3 py-3">Retail Avg $</th>
                      <th className="text-right px-3 py-3">Retail COGS</th>
                      <th className="text-right px-3 py-3">Retail Margin</th>
                      <th className="text-right px-3 py-3">Retail %</th>
                      <th className="text-right px-3 py-3">Bulk Units</th>
                      <th className="text-right px-3 py-3">Bulk Avg $</th>
                      <th className="text-right px-3 py-3">Bulk COGS</th>
                      <th className="text-right px-3 py-3">Bulk Margin</th>
                      <th className="text-right px-3 py-3">Bulk %</th>
                      <th className="text-right px-4 py-3">Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {rows.map((r) => (
                      <tr key={r.product_id} className="hover:bg-stone-900/40">
                        <td className="px-4 py-2">
                          <p className="text-stone-200 font-body">{r.product_name}</p>
                          <p className="text-stone-600 text-[11px] font-mono">{r.product_id}</p>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-stone-200">{r.retail_units}</td>
                        <td className="px-3 py-2 text-right font-mono text-stone-400">
                          {r.retail_units ? fmtCents(r.retail_avg_unit_price) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-stone-400">
                          {r.retail_units ? fmtCents(r.retail_avg_unit_cogs) : '—'}
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-mono ${marginTone(
                            r.retail_margin_pct,
                            r.retail_units,
                          )}`}
                        >
                          {r.retail_units ? fmtCents(r.retail_unit_margin) : '—'}
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-mono ${marginTone(
                            r.retail_margin_pct,
                            r.retail_units,
                          )}`}
                        >
                          {r.retail_units ? fmtPct(r.retail_margin_pct) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-stone-200">{r.bulk_units}</td>
                        <td className="px-3 py-2 text-right font-mono text-stone-400">
                          {r.bulk_units ? fmtCents(r.bulk_avg_unit_price) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-stone-400">
                          {r.bulk_units ? fmtCents(r.bulk_avg_unit_cogs) : '—'}
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-mono ${marginTone(
                            r.bulk_margin_pct,
                            r.bulk_units,
                          )}`}
                        >
                          {r.bulk_units ? fmtCents(r.bulk_unit_margin) : '—'}
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-mono ${marginTone(
                            r.bulk_margin_pct,
                            r.bulk_units,
                          )}`}
                        >
                          {r.bulk_units ? fmtPct(r.bulk_margin_pct) : '—'}
                        </td>
                        <td
                          className={`px-4 py-2 text-right font-mono ${
                            r.total_margin_contribution < 0 ? 'text-red-300' : 'text-stone-200'
                          }`}
                        >
                          {fmtCents(r.total_margin_contribution)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-stone-900/40 text-stone-300 text-[11px] font-heading font-bold uppercase tracking-wider">
                    <tr>
                      <td className="px-4 py-3">Total</td>
                      <td className="px-3 py-3 text-right font-mono">{totals.retail_units}</td>
                      <td className="px-3 py-3"></td>
                      <td className="px-3 py-3"></td>
                      <td className="px-3 py-3 text-right font-mono">{fmtCents(totals.retail_margin)}</td>
                      <td className="px-3 py-3"></td>
                      <td className="px-3 py-3 text-right font-mono">{totals.bulk_units}</td>
                      <td className="px-3 py-3"></td>
                      <td className="px-3 py-3"></td>
                      <td className="px-3 py-3 text-right font-mono">{fmtCents(totals.bulk_margin)}</td>
                      <td className="px-3 py-3"></td>
                      <td className="px-4 py-3 text-right font-mono">
                        {fmtCents(totals.total_margin_contribution)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Kpi({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="card-faire-detail p-4">
      <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`font-heading font-black text-lg mt-1 ${valueClass ?? 'text-stone-200'}`}>{value}</p>
      {sub && <p className="text-stone-500 text-[11px] font-body mt-1">{sub}</p>}
    </div>
  );
}

import type { SavedProforma } from '@/lib/proforma-data';

export default function SavedProformasList({
  rows,
  fmtCents,
}: {
  rows: SavedProforma[];
  fmtCents: (c: number) => string;
}) {
  if (rows.length === 0) {
    return (
      <div className="card-faire-detail p-6">
        <p className="text-stone-400 text-sm">
          No saved scenarios yet. Configure the panel above, click <strong>Save Scenario</strong>, and reload.
        </p>
      </div>
    );
  }

  return (
    <div className="card-faire-detail p-0 overflow-hidden overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-stone-900/60 text-stone-400 text-[10px] uppercase tracking-wider">
          <tr>
            <th className="text-left px-3 py-2">Saved</th>
            <th className="text-left px-3 py-2">Name</th>
            <th className="text-right px-3 py-2">Kilns</th>
            <th className="text-right px-3 py-2">Buyers</th>
            <th className="text-right px-3 py-2">Price %</th>
            <th className="text-right px-3 py-2">Revenue</th>
            <th className="text-right px-3 py-2">Net</th>
            <th className="text-right px-3 py-2">Cap %</th>
            <th className="text-right px-3 py-2">Payback wk</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const netTone =
              r.forecasted_net_cents < 0
                ? 'text-red-300'
                : r.forecasted_net_cents === 0
                  ? 'text-stone-300'
                  : 'text-emerald-300';
            const capTone =
              r.capacity_utilization_pct >= 100
                ? 'text-red-300'
                : r.capacity_utilization_pct > 80
                  ? 'text-amber-300'
                  : 'text-stone-300';
            return (
              <tr key={r.id} className="border-t border-stone-800">
                <td className="px-3 py-2 text-stone-400 whitespace-nowrap">
                  {new Date(r.created_at).toISOString().slice(0, 10)}
                </td>
                <td className="px-3 py-2 text-stone-200">{r.scenario_name}</td>
                <td className="px-3 py-2 text-right font-mono text-stone-300">{r.kiln_count}</td>
                <td className="px-3 py-2 text-right font-mono text-stone-300">{r.buyer_count}</td>
                <td className="px-3 py-2 text-right font-mono text-stone-300">
                  {Math.round(r.wholesale_price_multiplier * 100)}%
                </td>
                <td className="px-3 py-2 text-right font-mono text-stone-200">
                  {fmtCents(r.forecasted_revenue_cents)}
                </td>
                <td className={`px-3 py-2 text-right font-mono ${netTone}`}>
                  {fmtCents(r.forecasted_net_cents)}
                </td>
                <td className={`px-3 py-2 text-right font-mono ${capTone}`}>
                  {r.capacity_utilization_pct.toFixed(0)}%
                </td>
                <td className="px-3 py-2 text-right font-mono text-stone-400">
                  {r.payback_weeks == null ? '—' : r.payback_weeks.toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

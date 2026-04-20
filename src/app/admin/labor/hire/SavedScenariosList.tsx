'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteScenario } from './actions';

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export type SavedScenario = {
  id: string;
  scenario_name: string;
  role_display_name: string | null;
  weekly_hours_est: number;
  duration_weeks_est: number;
  base_rate_cents_input: number;
  fully_loaded_cost_cents_hourly_w2: number | null;
  fully_loaded_cost_cents_1099: number | null;
  fully_loaded_cost_cents_temp_agency: number | null;
  fully_loaded_cost_cents_piece_rate: number | null;
  ai_recommendation: string | null;
  generated_at: string;
};

export default function SavedScenariosList({ scenarios }: { scenarios: SavedScenario[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onDelete(id: string, name: string) {
    if (!window.confirm(`Delete scenario "${name}"?`)) return;
    setErr(null);
    startTransition(async () => {
      const res = await deleteScenario(id);
      if (!res.ok) setErr(res.error ?? 'Delete failed');
      else router.refresh();
    });
  }

  if (scenarios.length === 0) {
    return (
      <div className="card-faire-detail p-6 border border-stone-700">
        <p className="text-stone-400 text-sm">No saved scenarios yet. Run one above and click Run + Save.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {err && <p className="text-red-300 text-xs">{err}</p>}
      {scenarios.map((s) => {
        const costs = [
          { label: 'W-2', cents: s.fully_loaded_cost_cents_hourly_w2 },
          { label: '1099', cents: s.fully_loaded_cost_cents_1099 },
          { label: 'Temp', cents: s.fully_loaded_cost_cents_temp_agency },
          { label: 'Piece', cents: s.fully_loaded_cost_cents_piece_rate },
        ].filter((c) => c.cents != null) as Array<{ label: string; cents: number }>;
        const cheapest = costs.sort((a, b) => a.cents - b.cents)[0];
        return (
          <article key={s.id} className="card-faire-detail p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
              <div>
                <p className="font-heading font-bold text-white text-sm">{s.scenario_name}</p>
                <p className="text-stone-500 text-xs font-mono">
                  {s.role_display_name ?? 'no role'} · {s.weekly_hours_est} hrs/wk × {s.duration_weeks_est} wks ·
                  base {USD.format(s.base_rate_cents_input / 100)}/hr
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-stone-600 text-[10px] font-mono">
                  {new Date(s.generated_at).toISOString().slice(0, 10)}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onDelete(s.id, s.scenario_name)}
                  className="text-[11px] font-heading font-bold uppercase tracking-wider px-2 py-1 rounded border border-red-500/30 text-red-300 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(
                [
                  { label: 'W-2', cents: s.fully_loaded_cost_cents_hourly_w2 },
                  { label: '1099', cents: s.fully_loaded_cost_cents_1099 },
                  { label: 'Temp', cents: s.fully_loaded_cost_cents_temp_agency },
                  { label: 'Piece', cents: s.fully_loaded_cost_cents_piece_rate },
                ] as Array<{ label: string; cents: number | null }>
              ).map((c) => {
                const isCheapest = cheapest && c.cents === cheapest.cents;
                return (
                  <div
                    key={c.label}
                    className={`p-2 rounded border ${
                      c.cents == null
                        ? 'border-stone-800 text-stone-600'
                        : isCheapest
                        ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300'
                        : 'border-stone-700 text-stone-300'
                    }`}
                  >
                    <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">
                      {c.label}
                    </p>
                    <p className="font-mono text-sm mt-0.5">
                      {c.cents == null ? '—' : USD.format(c.cents / 100)}
                    </p>
                  </div>
                );
              })}
            </div>
            {s.ai_recommendation && (
              <p className="text-stone-400 text-xs font-body mt-2 leading-relaxed">{s.ai_recommendation}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}

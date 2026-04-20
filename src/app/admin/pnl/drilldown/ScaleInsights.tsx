// Server component — renders the Scale Insights card on /admin/pnl/drilldown.
// Uses deterministic rule-based insights from pnl-insights.ts. For narrative
// LLM-driven insights the admin can still go to /admin/insights (separate flow).

import Link from 'next/link';
import type { ScaleInsight } from '@/lib/pnl-insights';

export default function ScaleInsights({ insights }: { insights: ScaleInsight[] }) {
  if (insights.length === 0) {
    return (
      <div className="card-faire-detail p-5">
        <p className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">
          Scale Insights
        </p>
        <p className="text-stone-400 text-sm mt-2">
          Not enough data yet. Ship a few more orders and insights will populate here.
        </p>
      </div>
    );
  }

  return (
    <div className="card-faire-detail p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-[#C9A96E]">
            Scale Insights
          </p>
          <p className="text-stone-400 text-xs font-body mt-1">
            Computed from the data above · 3 actionable levers to grow margin
          </p>
        </div>
        <Link href="/admin/insights" className="text-xs text-stone-500 hover:text-stone-300 underline">
          Ask Claude →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {insights.map((i) => {
          const toneBorder =
            i.severity === 'opportunity' ? 'border-emerald-500/40' :
            i.severity === 'warning' ? 'border-amber-500/40' :
            'border-stone-700';
          const toneDot =
            i.severity === 'opportunity' ? 'bg-emerald-400' :
            i.severity === 'warning' ? 'bg-amber-400' :
            'bg-stone-400';
          return (
            <div key={i.id} className={`border ${toneBorder} rounded-md p-4 bg-stone-900/40`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`h-2 w-2 rounded-full ${toneDot}`} />
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-400">
                  {i.severity}
                </span>
              </div>
              <p className="text-stone-100 font-medium text-sm leading-snug">{i.headline}</p>
              <p className="text-stone-400 text-xs font-body mt-2 leading-relaxed">{i.detail}</p>
              {i.cta && (
                <Link href={i.cta.href} className="inline-block mt-3 text-xs text-[#C9A96E] hover:underline">
                  {i.cta.label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

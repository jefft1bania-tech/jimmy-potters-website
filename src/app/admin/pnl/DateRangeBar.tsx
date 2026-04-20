'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

type Preset = { key: string; label: string; from: string; to: string };

type Props = {
  from: string;
  to: string;
  presets: Preset[];
};

export default function DateRangeBar({ from, to, presets }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [start, setStart] = useState(from);
  const [end, setEnd] = useState(to);

  function apply(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams(sp?.toString());
    params.set('from', nextFrom);
    params.set('to', nextTo);
    router.push(`/admin/pnl?${params.toString()}`);
  }

  const activeKey = presets.find((p) => p.from === from && p.to === to)?.key;

  return (
    <div className="card-faire-detail p-5 print:hidden">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => apply(p.from, p.to)}
              className={`text-xs font-heading font-bold uppercase tracking-wider px-3 py-2 rounded border transition-colors ${
                activeKey === p.key
                  ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E]'
                  : 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2 ml-auto">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">From</span>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">To</span>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => apply(start, end)}
            disabled={!start || !end || start > end}
            className="btn-faire !w-auto disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

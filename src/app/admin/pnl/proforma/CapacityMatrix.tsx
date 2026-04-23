'use client';

import { useMemo, useState } from 'react';
import {
  computeMatrix,
  UNITS_PER_BUYER_ORDER,
  type ProformaSkuInput,
} from '@/lib/proforma';

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmtCents = (c: number) => USD.format(c / 100);
const fmtPct = (pct: number) => `${pct.toFixed(0)}%`;

const KILN_ROWS = [1, 2, 3];
const BUYER_COLS = [1, 2, 5];
const PRICE_STEPS = [0.4, 0.5, 0.55, 0.6];

export default function CapacityMatrix({ skuInputs }: { skuInputs: ProformaSkuInput[] }) {
  const [priceMultiplier, setPriceMultiplier] = useState(0.55);
  const matrix = useMemo(
    () => computeMatrix(KILN_ROWS, BUYER_COLS, priceMultiplier, skuInputs),
    [priceMultiplier, skuInputs],
  );

  return (
    <div className="card-faire-detail p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 bg-stone-900/40">
        <p className="text-xs text-stone-400">
          Each cell: revenue / net (after overhead + amortized CapEx) / capacity utilization.
        </p>
        <label className="flex items-center gap-2 text-xs">
          <span className="text-stone-500">Wholesale %</span>
          <select
            value={priceMultiplier}
            onChange={(e) => setPriceMultiplier(Number(e.target.value))}
            className="bg-stone-900 border border-stone-700 rounded px-2 py-1 text-stone-200"
          >
            {PRICE_STEPS.map((p) => (
              <option key={p} value={p}>
                {Math.round(p * 100)}%
              </option>
            ))}
          </select>
        </label>
      </div>

      <table className="w-full text-xs">
        <thead className="bg-stone-900/60 text-stone-400 text-[10px] uppercase tracking-wider">
          <tr>
            <th className="text-left px-3 py-2">Kilns →<br />Buyers ↓</th>
            {BUYER_COLS.map((b) => (
              <th key={b} className="text-right px-3 py-2">
                {b} buyer{b === 1 ? '' : 's'}
                <br />
                <span className="text-stone-500 normal-case text-[9px]">
                  {b * UNITS_PER_BUYER_ORDER} pots
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, rIdx) => (
            <tr key={KILN_ROWS[rIdx]} className="border-t border-stone-800">
              <td className="px-3 py-2 text-stone-300 font-heading font-bold">
                {KILN_ROWS[rIdx]} kiln{KILN_ROWS[rIdx] === 1 ? '' : 's'}
                <br />
                <span className="text-stone-500 text-[10px] font-body font-normal">
                  {KILN_ROWS[rIdx] * 104} pots/wk
                </span>
              </td>
              {row.map((cell, cIdx) => {
                const netTone =
                  cell.net_cents < 0
                    ? 'text-red-300'
                    : cell.net_cents === 0
                      ? 'text-stone-300'
                      : 'text-emerald-300';
                const capTone = cell.capacity_exceeded
                  ? 'text-red-300'
                  : cell.capacity_utilization_pct > 80
                    ? 'text-amber-300'
                    : 'text-stone-400';
                return (
                  <td
                    key={BUYER_COLS[cIdx]}
                    className={`px-3 py-2 text-right font-mono align-top ${
                      cell.capacity_exceeded ? 'bg-red-950/20' : ''
                    }`}
                  >
                    <div className="text-stone-200">{fmtCents(cell.revenue_cents)}</div>
                    <div className={netTone}>{fmtCents(cell.net_cents)}</div>
                    <div className={capTone}>
                      {fmtPct(cell.capacity_utilization_pct)}
                      {cell.capacity_exceeded && ' ⚠'}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

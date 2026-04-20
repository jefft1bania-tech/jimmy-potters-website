'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { upsertProductLaborTimes, type ActionResult } from './actions';

type Role = {
  id: string;
  role_key: string;
  display_name: string;
  default_hourly_rate_cents: number;
};

type Props = {
  productId: string;
  productName: string;
  roles: Role[];
  existing: Map<string, number>;
};

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function ProductLaborTimesRow({ productId, productName, roles, existing }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const [values, setValues] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const r of roles) {
      const v = existing.get(r.id);
      m[r.id] = v && v > 0 ? String(v) : '';
    }
    return m;
  });

  const totalMinutes = Object.values(values).reduce((sum, v) => {
    const n = parseFloat(v);
    return sum + (isFinite(n) && n > 0 ? n : 0);
  }, 0);

  const totalCostCents = roles.reduce((sum, r) => {
    const m = parseFloat(values[r.id]);
    if (!isFinite(m) || m <= 0) return sum;
    return sum + (m / 60) * r.default_hourly_rate_cents;
  }, 0);

  const coveredRoles = Object.values(values).filter((v) => {
    const n = parseFloat(v);
    return isFinite(n) && n > 0;
  }).length;
  const isCovered = coveredRoles > 0;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await upsertProductLaborTimes(data);
      setStatus(res);
      if (res.ok) router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`card-faire-detail p-4 border ${isCovered ? 'border-stone-700' : 'border-amber-500/40'}`}
    >
      <input type="hidden" name="product_id" value={productId} />

      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <p className="font-heading font-bold text-white text-sm truncate">{productName}</p>
          <p className="text-stone-500 text-[11px] font-mono">
            {productId}
            {!isCovered && <span className="text-amber-300 ml-2">· No labor mapped</span>}
          </p>
        </div>
        <div className="text-right whitespace-nowrap">
          <p className="text-[10px] uppercase tracking-wider text-stone-500">Per Unit</p>
          <p className="font-mono text-sm text-stone-200">
            {totalMinutes.toFixed(1)} min · {USD.format(totalCostCents / 100)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
        {roles.map((r) => (
          <label key={r.id} className="flex flex-col gap-1">
            <span
              className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500 truncate"
              title={r.display_name}
            >
              {r.display_name}
            </span>
            <input
              type="number"
              name={`minutes__${r.id}`}
              step="0.1"
              min="0"
              value={values[r.id]}
              onChange={(e) => setValues({ ...values, [r.id]: e.target.value })}
              placeholder="0"
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono focus:border-[#C9A96E] focus:outline-none"
            />
            <span className="text-[9px] text-stone-600 font-mono">
              {USD.format(r.default_hourly_rate_cents / 100)}/hr
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-stone-400 text-xs">
          <span className="font-mono text-stone-200">{coveredRoles}</span>
          <span className="text-stone-500"> / {roles.length} roles set</span>
        </p>
        <div className="flex items-center gap-3">
          {status && (
            <span className={`text-xs ${status.ok ? 'text-emerald-300' : 'text-red-300'}`}>
              {status.ok ? status.message : status.error}
            </span>
          )}
          <button type="submit" disabled={pending} className="btn-faire !w-auto disabled:opacity-50">
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </form>
  );
}

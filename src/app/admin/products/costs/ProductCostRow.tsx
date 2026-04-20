'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { upsertProductCost, type ActionResult } from './actions';

type Template = {
  materials_cents: number;
  labor_cents: number;
  packaging_cents: number;
  freight_cents: number;
  other_cents: number;
};

type Props = {
  productId: string;
  productName: string;
  priceCents: number;
  existing: Template | null;
};

const FIELDS: Array<{ key: keyof Template; label: string; formKey: string }> = [
  { key: 'materials_cents', label: 'Materials', formKey: 'materials' },
  { key: 'labor_cents',     label: 'Labor',     formKey: 'labor' },
  { key: 'packaging_cents', label: 'Packaging', formKey: 'packaging' },
  { key: 'freight_cents',   label: 'Freight',   formKey: 'freight' },
  { key: 'other_cents',     label: 'Other',     formKey: 'other' },
];

function centsToDollars(c: number): string {
  return (c / 100).toFixed(2);
}

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function ProductCostRow({ productId, productName, priceCents, existing }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const [values, setValues] = useState<Record<string, string>>({
    materials: centsToDollars(existing?.materials_cents ?? 0),
    labor:     centsToDollars(existing?.labor_cents ?? 0),
    packaging: centsToDollars(existing?.packaging_cents ?? 0),
    freight:   centsToDollars(existing?.freight_cents ?? 0),
    other:     centsToDollars(existing?.other_cents ?? 0),
  });

  const totalCents = Object.values(values).reduce((sum, v) => {
    const n = parseFloat(v.replace(/[$,]/g, ''));
    return sum + (isFinite(n) ? Math.round(n * 100) : 0);
  }, 0);

  const marginCents = priceCents - totalCents;
  const marginPct = priceCents > 0 ? (marginCents / priceCents) * 100 : 0;
  const marginTone = marginCents <= 0 ? 'text-red-300' : marginPct < 30 ? 'text-amber-300' : 'text-emerald-300';

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await upsertProductCost(data);
      setStatus(res);
      if (res.ok) router.refresh();
    });
  }

  const isCovered = existing !== null;

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
            {productId} · Retail {USD.format(priceCents / 100)}
            {!isCovered && <span className="text-amber-300 ml-2">· Missing template</span>}
          </p>
        </div>
        <div className="text-right whitespace-nowrap">
          <p className="text-[10px] uppercase tracking-wider text-stone-500">Margin</p>
          <p className={`font-mono text-sm ${marginTone}`}>
            {USD.format(marginCents / 100)} · {marginPct.toFixed(0)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">
              {f.label}
            </span>
            <input
              type="number"
              name={f.formKey}
              step="0.01"
              min="0"
              value={values[f.formKey]}
              onChange={(e) => setValues({ ...values, [f.formKey]: e.target.value })}
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono focus:border-[#C9A96E] focus:outline-none"
            />
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-stone-400 text-xs">
          <span className="font-mono">Total COGS:</span>{' '}
          <span className="font-mono text-stone-200">{USD.format(totalCents / 100)}</span>
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

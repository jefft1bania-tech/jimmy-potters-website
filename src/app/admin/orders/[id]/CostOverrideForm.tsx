'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type CostFields = {
  materials_cents: number | null;
  labor_cents: number | null;
  packaging_cents: number | null;
  freight_cents: number | null;
  other_cents: number | null;
};

type Props = {
  orderId: string;
  templateTotals: {
    materials_cents: number;
    labor_cents: number;
    packaging_cents: number;
    freight_cents: number;
    other_cents: number;
  };
  existingOverride: CostFields | null;
  internalShippingCostCents: number;
  hasUncoveredSkus: boolean;
};

const FIELDS: Array<{ key: keyof CostFields; label: string; hint?: string }> = [
  { key: 'materials_cents', label: 'Materials' },
  { key: 'labor_cents',     label: 'Labor' },
  { key: 'packaging_cents', label: 'Packaging' },
  { key: 'freight_cents',   label: 'Freight', hint: 'Includes internal FedEx cost' },
  { key: 'other_cents',     label: 'Other' },
];

function centsToDollars(c: number): string {
  return (c / 100).toFixed(2);
}

export default function CostOverrideForm({
  orderId,
  templateTotals,
  existingOverride,
  internalShippingCostCents,
  hasUncoveredSkus,
}: Props) {
  const router = useRouter();

  const baseline = {
    materials_cents: templateTotals.materials_cents,
    labor_cents:     templateTotals.labor_cents,
    packaging_cents: templateTotals.packaging_cents,
    freight_cents:   templateTotals.freight_cents + internalShippingCostCents,
    other_cents:     templateTotals.other_cents,
  };

  const initial: Record<keyof CostFields, string> = {
    materials_cents: centsToDollars(existingOverride?.materials_cents ?? baseline.materials_cents),
    labor_cents:     centsToDollars(existingOverride?.labor_cents     ?? baseline.labor_cents),
    packaging_cents: centsToDollars(existingOverride?.packaging_cents ?? baseline.packaging_cents),
    freight_cents:   centsToDollars(existingOverride?.freight_cents   ?? baseline.freight_cents),
    other_cents:     centsToDollars(existingOverride?.other_cents     ?? baseline.other_cents),
  };

  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const wasOverridden = (k: keyof CostFields) =>
    existingOverride && existingOverride[k] !== null && existingOverride[k] !== undefined;

  async function submit() {
    setBusy(true);
    setError(null);
    setSavedAt(null);
    try {
      const payload: Record<string, number> = {};
      for (const { key } of FIELDS) {
        const raw = parseFloat(values[key]);
        if (!Number.isFinite(raw) || raw < 0) throw new Error(`Invalid value for ${key}`);
        payload[key] = Math.round(raw * 100);
      }
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `save failed (${res.status})`);
      }
      setSavedAt(new Date().toLocaleTimeString());
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setValues({
      materials_cents: centsToDollars(baseline.materials_cents),
      labor_cents:     centsToDollars(baseline.labor_cents),
      packaging_cents: centsToDollars(baseline.packaging_cents),
      freight_cents:   centsToDollars(baseline.freight_cents),
      other_cents:     centsToDollars(baseline.other_cents),
    });
  }

  return (
    <div>
      {hasUncoveredSkus && (
        <p className="mb-3 inline-block rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5">
          Uses estimate — one or more SKUs missing a cost template
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {FIELDS.map(({ key, label, hint }) => (
          <label key={key} className="block">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">{label}</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={values[key]}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              className="mt-1 w-full bg-stone-950 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1.5 font-mono"
            />
            <span className="block text-[10px] text-stone-500 mt-1">
              Template: ${centsToDollars(baseline[key])}
              {wasOverridden(key) && <span className="text-amber-300 ml-1">· overridden</span>}
              {hint && <span className="block text-stone-600">{hint}</span>}
            </span>
          </label>
        ))}
      </div>
      {error && <p className="text-red-300 text-xs font-body mt-3">{error}</p>}
      {savedAt && <p className="text-emerald-300 text-xs font-body mt-3">Saved at {savedAt}</p>}
      <div className="flex gap-2 mt-4">
        <button type="button" onClick={submit} disabled={busy} className="btn-faire !w-auto flex-shrink-0">
          {busy ? 'Saving…' : 'Save Override'}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={busy}
          className="text-stone-400 text-xs font-body underline-offset-4 hover:underline"
        >
          Reset to template
        </button>
      </div>
    </div>
  );
}

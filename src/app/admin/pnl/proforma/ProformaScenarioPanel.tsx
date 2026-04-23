'use client';

import { useMemo, useState } from 'react';
import {
  computeScenario,
  DEFAULT_TIMELINE_WEEKS,
  UNITS_PER_BUYER_ORDER,
  POTS_PER_FIRING,
  FIRINGS_PER_WEEK,
  type ProformaSkuInput,
} from '@/lib/proforma';

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmtCents = (c: number) => USD.format(c / 100);
const fmtPct = (pct: number) => `${pct.toFixed(1)}%`;

const KILN_OPTIONS = [1, 2, 3];
const BUYER_OPTIONS = [1, 2, 5];
const PRICE_STEPS = [0.4, 0.45, 0.5, 0.55, 0.6, 0.65];

export default function ProformaScenarioPanel({ skuInputs }: { skuInputs: ProformaSkuInput[] }) {
  const [kilns, setKilns] = useState(1);
  const [buyers, setBuyers] = useState(1);
  const [priceMultiplier, setPriceMultiplier] = useState(0.55);
  const [timelineWeeks, setTimelineWeeks] = useState(DEFAULT_TIMELINE_WEEKS);
  const [scenarioName, setScenarioName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const result = useMemo(
    () =>
      computeScenario({
        kilns,
        buyers,
        priceMultiplier,
        timelineWeeks,
        skus: skuInputs,
      }),
    [kilns, buyers, priceMultiplier, timelineWeeks, skuInputs],
  );

  const netTone =
    result.net_cents < 0
      ? 'text-red-300'
      : result.net_cents === 0
        ? 'text-stone-200'
        : 'text-emerald-300';

  const marginTone =
    result.net_margin_pct < 0
      ? 'text-red-300'
      : result.net_margin_pct < 0.1
        ? 'text-amber-300'
        : 'text-emerald-300';

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch('/api/admin/proforma/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          scenario_name: scenarioName || undefined,
          kilns,
          buyers,
          priceMultiplier,
          timelineWeeks,
          notes: notes || null,
          skus: skuInputs,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !json.ok) {
        setSaveMsg(`Error: ${json.error ?? res.statusText}`);
      } else {
        setSaveMsg(`Saved scenario ${json.id?.slice(0, 8)} — reload to see in list below.`);
        setScenarioName('');
        setNotes('');
      }
    } catch (e) {
      setSaveMsg(`Error: ${e instanceof Error ? e.message : 'unknown'}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {result.capacity_exceeded && (
        <div className="card-faire-detail p-4 border border-red-500/50 bg-red-950/20">
          <p className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-red-300">
            Capacity exceeded ({fmtPct(result.capacity_utilization_pct)})
          </p>
          <p className="text-stone-300 text-xs font-body mt-1">
            {buyers} buyers × {UNITS_PER_BUYER_ORDER} pots = {result.units_total} pots demanded over {timelineWeeks} weeks.
            {' '}{kilns} kiln{kilns === 1 ? '' : 's'} × {FIRINGS_PER_WEEK} firings/week × {POTS_PER_FIRING} pots/firing =
            {' '}{result.firings_available * POTS_PER_FIRING} pots available.
            {' '}Add kilns, extend timeline, or turn away buyers.
          </p>
        </div>
      )}

      <div className="card-faire-detail p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <SelectField
            label="Kilns"
            value={kilns}
            options={KILN_OPTIONS.map((k) => ({
              value: k,
              label: `${k} kiln${k === 1 ? '' : 's'}`,
            }))}
            onChange={setKilns}
          />
          <SelectField
            label="Concurrent buyers"
            value={buyers}
            options={BUYER_OPTIONS.map((b) => ({
              value: b,
              label: `${b} buyer${b === 1 ? '' : 's'} (${b * UNITS_PER_BUYER_ORDER} pots)`,
            }))}
            onChange={setBuyers}
          />
          <SelectField
            label="Wholesale price (% of retail)"
            value={priceMultiplier}
            options={PRICE_STEPS.map((p) => ({ value: p, label: `${Math.round(p * 100)}%` }))}
            onChange={setPriceMultiplier}
          />
          <SelectField
            label="Timeline (weeks)"
            value={timelineWeeks}
            options={[1, 2, 3, 4].map((w) => ({ value: w, label: `${w} wk` }))}
            onChange={setTimelineWeeks}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Kpi label="Revenue" value={fmtCents(result.revenue_cents)} />
          <Kpi label="COGS total" value={fmtCents(result.cogs_total_cents)} />
          <Kpi
            label="Net (after overhead + CapEx amort)"
            value={fmtCents(result.net_cents)}
            valueClass={netTone}
          />
          <Kpi
            label="Net margin"
            value={fmtPct(result.net_margin_pct * 100)}
            valueClass={marginTone}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs mb-5">
          <CogLine label="Materials" cents={result.cogs.materials_cents} />
          <CogLine label="Labor" cents={result.cogs.labor_cents} />
          <CogLine label="Packaging" cents={result.cogs.packaging_cents} />
          <CogLine label="Electricity" cents={result.cogs.electricity_cents} />
          <CogLine label="Shipping" cents={result.cogs.shipping_cents} />
          <CogLine label="Stripe" cents={result.cogs.stripe_cents} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs border-t border-stone-800 pt-4">
          <StatLine
            label="Blended unit price"
            value={fmtCents(result.blended_unit_price_cents)}
            sub={`${Math.round(priceMultiplier * 100)}% of retail`}
          />
          <StatLine
            label="Capacity utilization"
            value={fmtPct(result.capacity_utilization_pct)}
            sub={`${result.firings_needed} / ${result.firings_available} firings`}
          />
          <StatLine
            label="Kiln CapEx"
            value={result.kiln_capex_cents === 0 ? '—' : fmtCents(result.kiln_capex_cents)}
            sub={`${Math.max(0, kilns - 1)} additional kiln${kilns === 2 ? '' : 's'} @ $3,000`}
          />
          <StatLine
            label="Payback"
            value={
              result.payback_weeks == null
                ? result.kiln_capex_cents === 0
                  ? 'n/a (no CapEx)'
                  : 'never (net ≤ 0)'
                : `${result.payback_weeks.toFixed(1)} weeks`
            }
            sub="time to recover new-kiln cost"
          />
        </div>
      </div>

      <div className="card-faire-detail p-5">
        <p className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
          Save this scenario
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Scenario name (e.g. '2 kilns, 5 buyers, 55%')"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            className="md:col-span-2 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 text-sm"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-faire !w-auto disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Scenario'}
          </button>
        </div>
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full mt-3 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 text-sm"
        />
        {saveMsg && (
          <p
            className={`text-xs mt-2 ${
              saveMsg.startsWith('Error') ? 'text-red-300' : 'text-emerald-300'
            }`}
          >
            {saveMsg}
          </p>
        )}
      </div>
    </div>
  );
}

function SelectField<T extends number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 block mb-1">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as T)}
        className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 text-sm"
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Kpi({
  label,
  value,
  valueClass = 'text-white',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="card-faire-detail p-4">
      <p className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">
        {label}
      </p>
      <p className={`font-heading font-black text-xl mt-1 ${valueClass}`}>{value}</p>
    </div>
  );
}

function CogLine({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex items-baseline justify-between border border-stone-800 rounded px-2 py-1.5">
      <span className="text-stone-400">{label}</span>
      <span className="font-mono text-stone-200">{fmtCents(cents)}</span>
    </div>
  );
}

function StatLine({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">
        {label}
      </p>
      <p className="font-mono text-stone-100 text-sm mt-0.5">{value}</p>
      {sub && <p className="text-stone-500 text-[10px] mt-0.5">{sub}</p>}
    </div>
  );
}

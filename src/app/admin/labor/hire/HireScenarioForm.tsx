'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { runAndMaybeSaveScenario, type ActionResult } from './actions';

export type RoleOption = {
  id: string;
  role_key: string;
  display_name: string;
  default_hourly_rate_cents: number;
};

type Props = { roles: RoleOption[] };

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function HireScenarioForm({ roles }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<ActionResult | null>(null);

  const [roleId, setRoleId] = useState<string>(roles[0]?.id ?? '');
  const [baseRate, setBaseRate] = useState<string>(
    roles[0] ? (roles[0].default_hourly_rate_cents / 100).toFixed(2) : '',
  );
  const [weeklyHours, setWeeklyHours] = useState<string>('20');
  const [durationWeeks, setDurationWeeks] = useState<string>('8');
  const [markupPct, setMarkupPct] = useState<string>('');
  const [piecePerUnit, setPiecePerUnit] = useState<string>('');
  const [unitsPerHour, setUnitsPerHour] = useState<string>('');
  const [scenarioName, setScenarioName] = useState<string>('');

  function onRoleChange(nextId: string) {
    setRoleId(nextId);
    const r = roles.find((x) => x.id === nextId);
    if (r) setBaseRate((r.default_hourly_rate_cents / 100).toFixed(2));
  }

  function submit(save: boolean) {
    const fd = new FormData();
    fd.set('role_id', roleId);
    fd.set('scenario_name', scenarioName || roles.find((r) => r.id === roleId)?.display_name || 'scenario');
    fd.set('base_rate', baseRate);
    fd.set('weekly_hours', weeklyHours);
    fd.set('duration_weeks', durationWeeks);
    if (markupPct) fd.set('temp_agency_markup_pct', markupPct);
    if (piecePerUnit) fd.set('piece_rate_per_unit', piecePerUnit);
    if (unitsPerHour) fd.set('units_per_hour', unitsPerHour);
    if (save) fd.set('save', 'true');

    startTransition(async () => {
      const res = await runAndMaybeSaveScenario(fd);
      setStatus(res);
      if (res.ok && save) router.refresh();
    });
  }

  const output = status?.ok ? status.output : null;

  return (
    <div className="space-y-4">
      <div className="card-faire-detail p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Role</span>
            <select
              value={roleId}
              onChange={(e) => onRoleChange(e.target.value)}
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
            >
              {roles.length === 0 && <option value="">(no roles — add one first)</option>}
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.display_name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Scenario name</span>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="auto-filled from role"
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Base rate ($/hr)</span>
            <input
              type="number"
              value={baseRate}
              onChange={(e) => setBaseRate(e.target.value)}
              step="0.01"
              min="0"
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono focus:border-[#C9A96E] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Weekly hours</span>
            <input
              type="number"
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(e.target.value)}
              step="1"
              min="1"
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono focus:border-[#C9A96E] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Duration (weeks)</span>
            <input
              type="number"
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
              step="1"
              min="1"
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono focus:border-[#C9A96E] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Temp markup (%)</span>
            <input
              type="number"
              value={markupPct}
              onChange={(e) => setMarkupPct(e.target.value)}
              step="1"
              min="0"
              placeholder="e.g. 50"
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono focus:border-[#C9A96E] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Piece $/unit</span>
            <input
              type="number"
              value={piecePerUnit}
              onChange={(e) => setPiecePerUnit(e.target.value)}
              step="0.01"
              min="0"
              placeholder="optional"
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono focus:border-[#C9A96E] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Units / hr</span>
            <input
              type="number"
              value={unitsPerHour}
              onChange={(e) => setUnitsPerHour(e.target.value)}
              step="0.1"
              min="0"
              placeholder="optional"
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono focus:border-[#C9A96E] focus:outline-none"
            />
          </label>
        </div>

        <div className="flex items-center justify-between mt-4 gap-3">
          <div className="text-xs">
            {status && !status.ok && <span className="text-red-300">{status.error}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pending || !roleId}
              onClick={() => submit(false)}
              className="text-xs font-heading font-bold uppercase tracking-wider px-3 py-2 rounded border border-stone-700 text-stone-300 hover:border-[#C9A96E] hover:text-[#C9A96E] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pending ? 'Running…' : 'Run'}
            </button>
            <button
              type="button"
              disabled={pending || !roleId}
              onClick={() => submit(true)}
              className="btn-faire !w-auto disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pending ? 'Saving…' : 'Run + Save'}
            </button>
          </div>
        </div>
      </div>

      {output && (
        <section className="card-faire-detail p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <h2 className="font-heading font-bold text-white">{output.scenario_name}</h2>
            <p className="text-stone-500 text-xs font-mono">
              {output.total_hours} hrs total · W-2 burden {(output.burden_pct_w2 * 100).toFixed(1)}%
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <CostCard label="Hourly W-2" cents={output.fully_loaded.hourly_w2} />
            <CostCard label="1099" cents={output.fully_loaded.contract_1099} />
            <CostCard label="Temp agency" cents={output.fully_loaded.temp_agency} />
            <CostCard label="Piece rate" cents={output.fully_loaded.piece_rate} />
          </div>
          {status?.ok && (
            <p className="text-stone-300 text-sm font-body leading-relaxed">{status.recommendation}</p>
          )}
        </section>
      )}
    </div>
  );
}

function CostCard({ label, cents }: { label: string; cents: number | null }) {
  return (
    <div className={`card-faire-detail p-3 border ${cents == null ? 'border-stone-800' : 'border-stone-700'}`}>
      <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`font-heading font-black text-lg mt-1 ${cents == null ? 'text-stone-600' : 'text-stone-200'}`}>
        {cents == null ? '—' : USD.format(cents / 100)}
      </p>
    </div>
  );
}

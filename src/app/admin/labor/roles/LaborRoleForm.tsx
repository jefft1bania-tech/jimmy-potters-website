'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { upsertLaborRole, deleteLaborRole, type ActionResult } from './actions';

export type LaborRole = {
  id: string;
  role_key: string;
  display_name: string;
  default_hourly_rate_cents: number;
  default_contract_rate_cents: number | null;
  default_piece_rate_cents: number | null;
  tax_treatment: 'w2' | '1099' | 'temp_agency';
  notes: string | null;
};

type Props = {
  existing: LaborRole | null; // null = create mode
};

const TAX_TREATMENTS: Array<LaborRole['tax_treatment']> = ['w2', '1099', 'temp_agency'];

function centsToDollars(c: number | null): string {
  if (c == null) return '';
  return (c / 100).toFixed(2);
}

export default function LaborRoleForm({ existing }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<ActionResult | null>(null);

  const isCreate = existing === null;

  const [values, setValues] = useState({
    role_key: existing?.role_key ?? '',
    display_name: existing?.display_name ?? '',
    tax_treatment: existing?.tax_treatment ?? 'w2',
    default_hourly_rate: centsToDollars(existing?.default_hourly_rate_cents ?? 0),
    default_contract_rate: centsToDollars(existing?.default_contract_rate_cents ?? null),
    default_piece_rate: centsToDollars(existing?.default_piece_rate_cents ?? null),
    notes: existing?.notes ?? '',
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await upsertLaborRole(form);
      setStatus(res);
      if (res.ok) {
        if (isCreate) {
          setValues({
            role_key: '',
            display_name: '',
            tax_treatment: 'w2',
            default_hourly_rate: '',
            default_contract_rate: '',
            default_piece_rate: '',
            notes: '',
          });
        }
        router.refresh();
      }
    });
  }

  async function onDelete() {
    if (!existing) return;
    if (!window.confirm(`Delete role ${existing.display_name}? Removes all product_labor_times rows too.`)) return;
    startTransition(async () => {
      const res = await deleteLaborRole(existing.id);
      setStatus(res);
      if (res.ok) router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="card-faire-detail p-4 border border-stone-700">
      {existing && <input type="hidden" name="id" value={existing.id} />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Role key</span>
          <input
            type="text"
            name="role_key"
            value={values.role_key}
            onChange={(e) => setValues({ ...values, role_key: e.target.value })}
            placeholder="throwing"
            required
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono focus:border-[#C9A96E] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Display name</span>
          <input
            type="text"
            name="display_name"
            value={values.display_name}
            onChange={(e) => setValues({ ...values, display_name: e.target.value })}
            placeholder="Wheel Throwing"
            required
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Tax treatment</span>
          <select
            name="tax_treatment"
            value={values.tax_treatment}
            onChange={(e) => setValues({ ...values, tax_treatment: e.target.value as LaborRole['tax_treatment'] })}
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
          >
            {TAX_TREATMENTS.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Hourly ($)</span>
          <input
            type="number"
            name="default_hourly_rate"
            value={values.default_hourly_rate}
            onChange={(e) => setValues({ ...values, default_hourly_rate: e.target.value })}
            step="0.01"
            min="0"
            required
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono focus:border-[#C9A96E] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">1099 ($ /hr)</span>
          <input
            type="number"
            name="default_contract_rate"
            value={values.default_contract_rate}
            onChange={(e) => setValues({ ...values, default_contract_rate: e.target.value })}
            step="0.01"
            min="0"
            placeholder="—"
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono focus:border-[#C9A96E] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Piece ($/unit)</span>
          <input
            type="number"
            name="default_piece_rate"
            value={values.default_piece_rate}
            onChange={(e) => setValues({ ...values, default_piece_rate: e.target.value })}
            step="0.01"
            min="0"
            placeholder="—"
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono focus:border-[#C9A96E] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Notes</span>
          <input
            type="text"
            name="notes"
            value={values.notes}
            onChange={(e) => setValues({ ...values, notes: e.target.value })}
            placeholder="Optional"
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
          />
        </label>
      </div>

      <div className="flex items-center justify-between mt-3 gap-3">
        <div className="text-xs">
          {status && (
            <span className={status.ok ? 'text-emerald-300' : 'text-red-300'}>
              {status.ok ? status.message : status.error}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {existing && (
            <button
              type="button"
              disabled={pending}
              onClick={onDelete}
              className="text-xs font-heading font-bold uppercase tracking-wider px-3 py-2 rounded border border-red-500/30 text-red-300 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          )}
          <button
            type="submit"
            disabled={pending}
            className="btn-faire !w-auto disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? 'Saving…' : isCreate ? 'Add role' : 'Save'}
          </button>
        </div>
      </div>
    </form>
  );
}

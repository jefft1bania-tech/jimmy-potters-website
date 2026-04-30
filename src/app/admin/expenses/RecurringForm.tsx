'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addRecurringExpense, type ActionResult } from './actions';
import type { VendorPickerOption } from '@/lib/vendors-data';

const CATEGORIES = [
  'rent',
  'utilities',
  'software',
  'insurance',
  'subscriptions',
  'marketing',
  'other',
];

export default function RecurringForm({ vendors = [] }: { vendors?: VendorPickerOption[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const res = await addRecurringExpense(data);
      setStatus(res);
      if (res.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={onSubmit} className="card-faire-detail p-5 space-y-3">
      <p className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">
        Recurring Expense
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Field label="Category" required>
          <select name="category" required className="input">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Amount (USD)" required>
          <input type="number" name="amount" step="0.01" min="0.01" required placeholder="0.00" className="input" />
        </Field>
        <Field label="Recurrence" required>
          <select name="recurrence" required defaultValue="monthly" className="input">
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
        </Field>
        <Field label="Starts" required>
          <input type="date" name="starts_on" defaultValue={today} required className="input" />
        </Field>
        <Field label="Ends (optional)">
          <input type="date" name="ends_on" className="input" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Vendor (optional)">
          <select name="vendor_id" defaultValue="" className="input">
            <option value="">—</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name} ({v.role})</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-faire !w-auto disabled:opacity-50">
          {pending ? 'Saving…' : 'Add Recurring'}
        </button>
        {status && (
          <span className={`text-xs ${status.ok ? 'text-emerald-300' : 'text-red-300'}`}>
            {status.ok ? status.message : status.error}
          </span>
        )}
      </div>

      <style jsx>{`
        .input {
          background-color: rgb(17 15 14);
          border: 1px solid rgb(68 64 60);
          color: rgb(231 229 228);
          font-size: 14px;
          border-radius: 4px;
          padding: 6px 10px;
          width: 100%;
        }
        .input:focus {
          outline: none;
          border-color: #c9a96e;
        }
      `}</style>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}

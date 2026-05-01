'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { VendorPickerOption } from '@/lib/vendors-data';

const CATEGORIES = [
  'rent',
  'utilities',
  'software',
  'equipment',
  'packaging',
  'materials',
  'paint',
  'freight',
  'marketing',
  'travel',
  'other',
];

type Status = { ok: true; message: string } | { ok: false; error: string };

export default function OverheadForm({ vendors = [] }: { vendors?: VendorPickerOption[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/expenses/overhead', {
          method: 'POST',
          body: data,
        });
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          document_id?: string | null;
        };
        if (!res.ok || !json.ok) {
          setStatus({ ok: false, error: json.error || `Request failed (${res.status})` });
          return;
        }
        setStatus({
          ok: true,
          message: json.document_id ? 'Expense added · receipt attached.' : 'Expense added.',
        });
        form.reset();
        router.refresh();
      } catch (err) {
        setStatus({ ok: false, error: err instanceof Error ? err.message : 'Network error' });
      }
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={onSubmit} className="card-faire-detail p-5 space-y-3">
      <p className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">
        One-Time Overhead Expense
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Field label="Date" required>
          <input
            type="date"
            name="incurred_on"
            defaultValue={today}
            required
            className="input"
          />
        </Field>
        <Field label="Category" required>
          <select name="category" required className="input">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Amount (USD)" required>
          <input
            type="number"
            name="amount"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className="input"
          />
        </Field>
        <Field label="Note">
          <input
            type="text"
            name="notes"
            maxLength={500}
            placeholder="optional"
            className="input"
          />
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
        <Field label="Receipt — JPG · PNG · PDF · 25MB max (optional)">
          <input
            type="file"
            name="receipt"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
            className="input file-input"
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-faire !w-auto disabled:opacity-50">
          {pending ? 'Saving…' : 'Add Expense'}
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
        .file-input {
          padding: 4px 6px;
          line-height: 1.2;
        }
        .file-input::file-selector-button {
          background-color: rgb(40 36 32);
          color: rgb(201 169 110);
          border: 1px solid rgb(68 64 60);
          border-radius: 3px;
          padding: 4px 10px;
          margin-right: 10px;
          font-size: 12px;
          cursor: pointer;
        }
        .file-input::file-selector-button:hover {
          background-color: rgb(60 50 40);
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

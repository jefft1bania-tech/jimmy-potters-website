'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addVendor, updateVendor, type ActionResult } from './actions';
import {
  VENDOR_ROLES,
  VENDOR_STATUSES,
  type VendorRow,
  type VendorRole,
  type VendorStatus,
} from '@/lib/vendors-data';

type Props = {
  // When provided, the form operates as Edit on this vendor; otherwise Create.
  initial?: VendorRow | null;
  onSaved?: () => void;
};

// VendorForm renders all fields for the vendors master row, including the
// optional domain-expiration field that is only meaningful when role='domain'.
// W-9 (IRS Form W-9) and COI (Certificate of Insurance) on-file flags ride on
// boolean checkboxes; document links land separately via the documents page.
export default function VendorForm({ initial, onSaved }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<VendorRole>(initial?.role ?? 'other');

  const isEdit = Boolean(initial);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const res = isEdit && initial ? await updateVendor(initial.id, data) : await addVendor(data);
      setStatus(res);
      if (res.ok) {
        if (!isEdit) form.reset();
        router.refresh();
        onSaved?.();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card-faire-detail p-5 space-y-4">
      <p className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">
        {isEdit ? 'Edit Vendor' : 'Add Vendor'}
      </p>

      <fieldset className="space-y-3">
        <legend className="text-[10px] uppercase tracking-wider text-stone-500">Identity</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Name" required>
            <input type="text" name="name" required defaultValue={initial?.name ?? ''}
              maxLength={200} className="input" />
          </Field>
          <Field label="Role" required>
            <select name="role" required defaultValue={role}
              onChange={(e) => setRole(e.target.value as VendorRole)} className="input">
              {VENDOR_ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
            </select>
          </Field>
          <Field label="Status" required>
            <select name="status" required defaultValue={initial?.status ?? 'active'} className="input">
              {VENDOR_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Login URL">
            <input type="url" name="login_url" defaultValue={initial?.login_url ?? ''}
              maxLength={500} placeholder="https://..." className="input" />
          </Field>
          <Field label="Account email">
            <input type="email" name="account_email" defaultValue={initial?.account_email ?? ''}
              maxLength={200} className="input" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-[10px] uppercase tracking-wider text-stone-500">Cost (USD + COP)</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Monthly USD">
            <input type="number" name="monthly_cost_usd" step="0.01" min="0"
              defaultValue={initial?.monthly_cost_usd ?? ''} className="input" />
          </Field>
          <Field label="Monthly COP">
            <input type="number" name="monthly_cost_cop" step="1" min="0"
              defaultValue={initial?.monthly_cost_cop ?? ''} className="input" />
          </Field>
          <Field label="Billing day (1 to 31)">
            <input type="number" name="billing_day_of_month" min="1" max="31"
              defaultValue={initial?.billing_day_of_month ?? ''} className="input" />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Rate date (USD-COP)">
            <input type="date" name="cost_rate_date"
              defaultValue={initial?.cost_rate_date ?? ''} className="input" />
          </Field>
          <Field label="Rate source">
            <input type="text" name="cost_rate_source" maxLength={200}
              defaultValue={initial?.cost_rate_source ?? ''}
              placeholder="x-rates.com 2026-04-30" className="input" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-[10px] uppercase tracking-wider text-stone-500">Contract</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Term (months)">
            <input type="number" name="contract_term_months" min="0"
              defaultValue={initial?.contract_term_months ?? ''} className="input" />
          </Field>
          <Field label="Starts">
            <input type="date" name="contract_starts_at"
              defaultValue={initial?.contract_starts_at ?? ''} className="input" />
          </Field>
          <Field label="Ends">
            <input type="date" name="contract_ends_at"
              defaultValue={initial?.contract_ends_at ?? ''} className="input" />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Cancellation lead (days)">
            <input type="number" name="cancellation_deadline_days" min="0"
              defaultValue={initial?.cancellation_deadline_days ?? ''} className="input" />
          </Field>
          <Field label="Auto-renew">
            <label className="flex items-center gap-2 mt-1">
              <input type="checkbox" name="auto_renew" defaultChecked={initial?.auto_renew ?? false} />
              <span className="text-xs text-stone-300">Renews automatically at term end</span>
            </label>
          </Field>
        </div>
      </fieldset>

      {role === 'domain' && (
        <fieldset className="space-y-3">
          <legend className="text-[10px] uppercase tracking-wider text-stone-500">
            Domain (RDAP synced ..... Registration Data Access Protocol)
          </legend>
          <Field label="Domain expires at">
            <input type="date" name="domain_expires_at"
              defaultValue={initial?.domain_expires_at?.slice(0, 10) ?? ''} className="input" />
          </Field>
        </fieldset>
      )}

      <fieldset className="space-y-3">
        <legend className="text-[10px] uppercase tracking-wider text-stone-500">
          Compliance documents (W-9 = IRS Form W-9, COI = Certificate of Insurance)
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="W-9 on file">
            <label className="flex items-center gap-2 mt-1">
              <input type="checkbox" name="w9_on_file" defaultChecked={initial?.w9_on_file ?? false} />
              <span className="text-xs text-stone-300">Yes</span>
            </label>
          </Field>
          <Field label="COI on file">
            <label className="flex items-center gap-2 mt-1">
              <input type="checkbox" name="coi_on_file" defaultChecked={initial?.coi_on_file ?? false} />
              <span className="text-xs text-stone-300">Yes</span>
            </label>
          </Field>
          <Field label="COI expires at">
            <input type="date" name="coi_expires_at"
              defaultValue={initial?.coi_expires_at ?? ''} className="input" />
          </Field>
        </div>
      </fieldset>

      <Field label="Notes">
        <textarea name="notes" rows={3} maxLength={2000}
          defaultValue={initial?.notes ?? ''} className="input" />
      </Field>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-faire !w-auto disabled:opacity-50">
          {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vendor'}
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
        .input:focus { outline: none; border-color: #c9a96e; }
        fieldset { border: 1px solid rgb(41 37 36); border-radius: 6px; padding: 12px; }
        legend { padding: 0 8px; }
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

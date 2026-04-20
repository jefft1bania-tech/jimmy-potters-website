'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  type DocumentCategory,
  type DocumentStatus,
  type FinancialDocument,
} from '@/lib/documents-data';

type Props = { doc: FinancialDocument };

export default function ReviewForm({ doc }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [category, setCategory] = useState<DocumentCategory>(doc.category);
  const [vendor, setVendor] = useState<string>(doc.extracted_vendor ?? '');
  const [amount, setAmount] = useState<string>(
    doc.extracted_amount_cents != null ? (doc.extracted_amount_cents / 100).toFixed(2) : '',
  );
  const [tax, setTax] = useState<string>(
    doc.extracted_tax_cents != null ? (doc.extracted_tax_cents / 100).toFixed(2) : '',
  );
  const [issuedOn, setIssuedOn] = useState<string>(doc.extracted_issued_on ?? '');
  const [taxYear, setTaxYear] = useState<string>(doc.tax_year ? String(doc.tax_year) : '');
  const [notes, setNotes] = useState<string>(doc.notes ?? '');

  function toCents(raw: string): number | null {
    if (!raw.trim()) return null;
    const n = parseFloat(raw.replace(/[$,]/g, ''));
    return isFinite(n) ? Math.round(n * 100) : null;
  }

  async function submit(body: Record<string, unknown>, successMsg: string) {
    setErr(null);
    setOk(null);
    const res = await fetch(`/api/admin/documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: 'Update failed' }));
      setErr(j.error ?? 'Update failed');
      return;
    }
    setOk(successMsg);
    router.refresh();
  }

  function onSave() {
    startTransition(() => {
      submit(
        {
          category,
          extracted_vendor: vendor,
          extracted_amount_cents: toCents(amount),
          extracted_tax_cents: toCents(tax),
          extracted_issued_on: issuedOn || null,
          tax_year: taxYear || null,
          notes,
        },
        'Saved',
      );
    });
  }

  function onStatus(next: DocumentStatus) {
    startTransition(() => submit({ status: next }, `Marked ${next}`));
  }

  async function onDelete() {
    if (!window.confirm(`Delete ${doc.original_filename}? This removes the file from storage.`)) return;
    startTransition(async () => {
      setErr(null);
      setOk(null);
      const res = await fetch(`/api/admin/documents/${doc.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'Delete failed' }));
        setErr(j.error ?? 'Delete failed');
        return;
      }
      router.push('/admin/documents');
      router.refresh();
    });
  }

  const readOnly = doc.status === 'confirmed' || doc.status === 'rejected';

  return (
    <div className="space-y-4">
      <div className="card-faire-detail p-5">
        <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
          Extracted fields
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Category</span>
            <select
              disabled={readOnly}
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 disabled:opacity-60 focus:border-[#C9A96E] focus:outline-none"
            >
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace('_', ' ')}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Vendor</span>
            <input
              type="text"
              disabled={readOnly}
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 disabled:opacity-60 focus:border-[#C9A96E] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Amount ($)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              disabled={readOnly}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono disabled:opacity-60 focus:border-[#C9A96E] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Tax ($)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              disabled={readOnly}
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono disabled:opacity-60 focus:border-[#C9A96E] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Issued on</span>
            <input
              type="date"
              disabled={readOnly}
              value={issuedOn}
              onChange={(e) => setIssuedOn(e.target.value)}
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 disabled:opacity-60 focus:border-[#C9A96E] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Tax Year</span>
            <input
              type="number"
              disabled={readOnly}
              value={taxYear}
              onChange={(e) => setTaxYear(e.target.value)}
              min={2000}
              max={2100}
              step={1}
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono disabled:opacity-60 focus:border-[#C9A96E] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2 lg:col-span-3">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Notes</span>
            <textarea
              disabled={readOnly}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 disabled:opacity-60 focus:border-[#C9A96E] focus:outline-none"
            />
          </label>
        </div>

        <div className="flex items-center justify-between mt-4 gap-3">
          <div className="text-xs">
            {err && <span className="text-red-300">{err}</span>}
            {ok && <span className="text-emerald-300">{ok}</span>}
          </div>
          <button
            type="button"
            disabled={pending || readOnly}
            onClick={onSave}
            className="btn-faire !w-auto disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? 'Saving…' : 'Save edits'}
          </button>
        </div>
      </div>

      <div className="card-faire-detail p-5">
        <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
          Status
        </h2>
        <div className="flex flex-wrap gap-2">
          {DOCUMENT_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending || doc.status === s}
              onClick={() => onStatus(s)}
              className={`text-xs font-heading font-bold uppercase tracking-wider px-3 py-2 rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                doc.status === s
                  ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E]'
                  : 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200'
              }`}
            >
              Mark {s}
            </button>
          ))}
        </div>
        <p className="text-stone-500 text-[11px] mt-3">
          Confirmed / rejected docs become read-only. Switch status back to parsed to edit fields again.
        </p>
      </div>

      <div className="card-faire-detail p-5 border border-red-500/20">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-red-300 mb-1">
              Danger
            </h2>
            <p className="text-stone-500 text-xs">Permanently removes the row and the file in storage.</p>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={onDelete}
            className="text-xs font-heading font-bold uppercase tracking-wider px-3 py-2 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete document
          </button>
        </div>
      </div>
    </div>
  );
}

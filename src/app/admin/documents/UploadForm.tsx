'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DOCUMENT_CATEGORIES, type DocumentCategory } from '@/lib/documents-data';

export default function UploadForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get('file');
    if (!(file instanceof File) || file.size === 0) {
      setErr('Pick a file first.');
      return;
    }
    startTransition(async () => {
      const res = await fetch('/api/admin/documents/upload', {
        method: 'POST',
        body: data,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'Upload failed' }));
        setErr(j.error ?? 'Upload failed');
        return;
      }
      setOk(`Uploaded ${file.name}`);
      form.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="card-faire-detail p-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 min-w-0 flex-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">File</span>
          <input
            type="file"
            name="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none file:mr-3 file:rounded file:border-0 file:bg-[#C9A96E] file:text-stone-900 file:px-3 file:py-1 file:text-xs file:font-heading file:font-bold file:uppercase file:tracking-wider"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Category</span>
          <select
            name="category"
            defaultValue="receipt"
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
          >
            {DOCUMENT_CATEGORIES.map((c: DocumentCategory) => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Tax Year</span>
          <input
            type="number"
            name="tax_year"
            placeholder={String(new Date().getUTCFullYear())}
            min={2000}
            max={2100}
            step={1}
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono w-24 focus:border-[#C9A96E] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Notes</span>
          <input
            type="text"
            name="notes"
            placeholder="Optional"
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="btn-faire !w-auto disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? 'Uploading…' : 'Upload'}
        </button>
      </div>
      {(err || ok) && (
        <p className={`mt-3 text-xs ${err ? 'text-red-300' : 'text-emerald-300'}`}>{err ?? ok}</p>
      )}
      <p className="text-stone-500 text-[11px] mt-3">
        PDF / JPEG / PNG / WEBP / HEIC · max 25 MB. Status lands at <span className="font-mono">pending</span> —
        review and confirm from the detail page.
      </p>
    </form>
  );
}

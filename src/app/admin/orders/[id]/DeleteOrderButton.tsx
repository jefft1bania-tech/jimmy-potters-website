'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  orderId: string;
  isBulk: boolean;
};

export default function DeleteOrderButton({ orderId, isBulk }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState('');

  const shortId = orderId.slice(0, 8);

  async function submit() {
    if (typed.trim().toLowerCase() !== shortId.toLowerCase()) {
      setError(`Type "${shortId}" exactly to confirm.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `delete failed (${res.status})`);
      }
      router.replace('/admin/orders');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 hover:border-red-400 text-red-200 px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider transition-colors"
        title="Admin only: permanently remove this order and its line items, shipments, payments, and overrides"
      >
        Delete {isBulk ? 'Bulk ' : ''}Order
      </button>
    );
  }

  return (
    <div className="card-faire-detail p-4 border border-red-500/40 bg-red-500/5 mb-6">
      <p className="text-[11px] font-heading font-bold uppercase tracking-[0.2em] text-red-300 mb-1">
        Confirm permanent delete
      </p>
      <p className="text-stone-300 text-sm font-body mb-3">
        This will permanently remove order <span className="font-mono text-white">#{shortId}</span>
        {isBulk && <> (<span className="text-indigo-300">bulk</span>)</>}, all line items, shipments,
        payment records, cost overrides, and bulk pricing. <span className="text-red-300 font-heading font-bold">Cannot be undone.</span>
      </p>
      <label className="block mb-3">
        <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">
          Type <span className="font-mono text-stone-300">{shortId}</span> to confirm
        </span>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoFocus
          autoComplete="off"
          className="mt-1 w-full max-w-xs bg-stone-950 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1.5 font-mono"
          placeholder={shortId}
        />
      </label>
      {error && <p className="text-red-300 text-xs font-body mb-2">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy || typed.trim().toLowerCase() !== shortId.toLowerCase()}
          className="inline-flex items-center gap-2 rounded-md border border-red-500/60 bg-red-500/20 hover:bg-red-500/30 hover:border-red-400 text-red-100 px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? 'Deleting…' : 'Delete permanently'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); setTyped(''); }}
          disabled={busy}
          className="text-stone-400 text-xs font-body underline-offset-4 hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  orderId: string;
  provider: 'venmo' | 'paypal';
  defaultAmountCents: number;
};

export default function MarkPaidButton({ orderId, provider, defaultAmountCents }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState((defaultAmountCents / 100).toFixed(2));
  const [receivedOn, setReceivedOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const cents = Math.round(parseFloat(amount) * 100);
      if (!Number.isFinite(cents) || cents < 0) throw new Error('Amount must be a positive number');
      const res = await fetch(`/api/admin/orders/${orderId}/mark-paid`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider, amount_cents: cents, received_on: receivedOn, notes: notes || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `mark-paid failed (${res.status})`);
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-faire !w-auto flex-shrink-0">
        Mark Paid ({provider})
      </button>
    );
  }

  return (
    <div className="mt-3 p-3 border border-stone-700/60 rounded bg-stone-900/40">
      <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500 mb-2">
        Record {provider} payment
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Amount (USD)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full bg-stone-950 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1.5"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Received on</span>
          <input
            type="date"
            value={receivedOn}
            onChange={(e) => setReceivedOn(e.target.value)}
            className="mt-1 w-full bg-stone-950 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1.5"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Notes (optional)</span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Venmo handle, confirmation #"
            className="mt-1 w-full bg-stone-950 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1.5"
          />
        </label>
      </div>
      {error && <p className="text-red-300 text-xs font-body mt-2">{error}</p>}
      <div className="flex gap-2 mt-3">
        <button type="button" onClick={submit} disabled={busy} className="btn-faire !w-auto flex-shrink-0">
          {busy ? 'Saving…' : 'Confirm'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          disabled={busy}
          className="text-stone-400 text-xs font-body underline-offset-4 hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

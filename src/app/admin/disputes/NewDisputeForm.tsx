'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DISPUTE_TYPES,
  DISPUTE_CHANNELS,
  type DisputeType,
  type DisputeChannel,
} from '@/lib/disputes-data';

export default function NewDisputeForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [email, setEmail] = useState('');
  const [type, setType] = useState<DisputeType>('refund_request');
  const [channel, setChannel] = useState<DisputeChannel>('manual');
  const [orderId, setOrderId] = useState('');
  const [notes, setNotes] = useState('');

  function reset() {
    setEmail('');
    setType('refund_request');
    setChannel('manual');
    setOrderId('');
    setNotes('');
  }

  function submit() {
    setErr(null);
    setOk(null);
    startTransition(async () => {
      const res = await fetch('/api/admin/disputes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customer_email: email,
          dispute_type: type,
          opened_via: channel,
          order_id: orderId || null,
          resolution_notes: notes,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'Create failed' }));
        setErr(j.error ?? 'Create failed');
        return;
      }
      const j = (await res.json()) as { dispute?: { id: string } };
      setOk('Dispute created');
      reset();
      if (j.dispute?.id) router.push(`/admin/disputes/${j.dispute.id}`);
      else router.refresh();
    });
  }

  if (!open) {
    return (
      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-faire !w-auto"
        >
          + Log dispute
        </button>
      </div>
    );
  }

  return (
    <div className="card-faire-detail p-5 mb-6">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">
          Log a dispute
        </h2>
        <button
          type="button"
          onClick={() => { setOpen(false); reset(); setErr(null); setOk(null); }}
          className="text-stone-500 text-xs hover:text-stone-300"
        >
          Cancel
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Customer email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DisputeType)}
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
          >
            {DISPUTE_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Channel</span>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as DisputeChannel)}
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
          >
            {DISPUTE_CHANNELS.map((c) => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Order ID</span>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="optional UUID"
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono focus:border-[#C9A96E] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2 lg:col-span-4">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="What's the customer saying?"
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
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
          disabled={pending || !email}
          onClick={submit}
          className="btn-faire !w-auto disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? 'Creating…' : 'Create'}
        </button>
      </div>
    </div>
  );
}

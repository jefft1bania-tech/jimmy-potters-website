'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DISPUTE_STATUSES,
  type CustomerDispute,
  type DisputeStatus,
  type LinkedOrderSnapshot,
} from '@/lib/disputes-data';

type Props = {
  dispute: CustomerDispute;
  linkedOrder: LinkedOrderSnapshot | null;
};

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const ORDER_REFUNDABLE = new Set(['paid', 'shipped', 'delivered']);

export default function DisputeControls({ dispute, linkedOrder }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [status, setStatus] = useState<DisputeStatus>(dispute.status);
  const [notes, setNotes] = useState<string>(dispute.resolution_notes ?? '');
  const [refundAmount, setRefundAmount] = useState<string>(
    linkedOrder ? (linkedOrder.total_cents / 100).toFixed(2) : '',
  );

  async function patchDispute(body: Record<string, unknown>, successMsg: string): Promise<void> {
    const res = await fetch(`/api/admin/disputes/${dispute.id}`, {
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
    setErr(null);
    setOk(null);
    startTransition(async () => {
      await patchDispute({ status, resolution_notes: notes }, 'Saved');
    });
  }

  function onIssueRefund() {
    setErr(null);
    setOk(null);
    if (!linkedOrder) return;
    const amountCents = Math.round(parseFloat(refundAmount.replace(/[$,]/g, '')) * 100);
    if (!isFinite(amountCents) || amountCents <= 0) {
      setErr('Enter a valid refund amount');
      return;
    }
    if (amountCents > linkedOrder.total_cents) {
      setErr(`Max refund is ${USD.format(linkedOrder.total_cents / 100)}`);
      return;
    }
    if (linkedOrder.payment_method !== 'stripe') {
      setErr(
        `Refund API only handles Stripe orders (order is ${linkedOrder.payment_method}). Handle the refund manually in the vendor's dashboard, then mark the dispute resolved below.`,
      );
      return;
    }
    startTransition(async () => {
      const refundRes = await fetch(`/api/admin/orders/${linkedOrder.id}/refund`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount_cents: amountCents, reason: `Dispute ${dispute.id}` }),
      });
      if (!refundRes.ok) {
        const j = await refundRes.json().catch(() => ({ error: 'Refund failed' }));
        setErr(j.error ?? 'Refund failed');
        return;
      }
      await patchDispute(
        {
          status: 'resolved_refund',
          resolution_notes: (notes.trim() ? `${notes.trim()}\n\n` : '') +
            `Refunded ${USD.format(amountCents / 100)} via Stripe on ${new Date().toISOString().slice(0, 10)}.`,
        },
        `Refunded ${USD.format(amountCents / 100)}`,
      );
    });
  }

  const closing = status === 'resolved_refund' || status === 'resolved_replacement' || status === 'resolved_no_action' || status === 'closed';

  return (
    <div className="space-y-4">
      <section className="card-faire-detail p-5">
        <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
          Update
        </h2>
        <label className="flex flex-col gap-1 mb-3">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as DisputeStatus)}
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
          >
            {DISPUTE_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 mb-3">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Resolution notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="What did we do about it?"
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
          />
        </label>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs">
            {err && <span className="text-red-300">{err}</span>}
            {ok && <span className="text-emerald-300">{ok}</span>}
            {closing && !ok && !err && (
              <span className="text-stone-500">Saving will stamp closed_at.</span>
            )}
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={onSave}
            className="btn-faire !w-auto disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </section>

      {linkedOrder && (
        <section className="card-faire-detail p-5 border border-emerald-500/20">
          <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-emerald-300 mb-3">
            Issue refund
          </h2>
          <p className="text-stone-400 text-xs font-body mb-3">
            Order total {USD.format(linkedOrder.total_cents / 100)} · status {linkedOrder.status} ·
            payment {linkedOrder.payment_method}.
            {!ORDER_REFUNDABLE.has(linkedOrder.status) && (
              <span className="text-amber-300 ml-1">
                Order status isn't paid/shipped/delivered — refund API will 409.
              </span>
            )}
          </p>
          <div className="flex items-end gap-3">
            <label className="flex flex-col gap-1 flex-1">
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Amount ($)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={linkedOrder.total_cents / 100}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono focus:border-[#C9A96E] focus:outline-none"
              />
            </label>
            <button
              type="button"
              disabled={pending || linkedOrder.payment_method !== 'stripe'}
              onClick={onIssueRefund}
              className="btn-faire !w-auto disabled:opacity-40 disabled:cursor-not-allowed"
              title={linkedOrder.payment_method !== 'stripe' ? 'Only Stripe orders refund through this button' : undefined}
            >
              {pending ? 'Refunding…' : 'Refund + mark resolved'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

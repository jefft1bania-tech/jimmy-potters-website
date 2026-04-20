'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type CustomerType = 'wholesale' | 'faire' | 'direct_bulk' | 'school_program';
const CUSTOMER_TYPES: CustomerType[] = ['wholesale', 'faire', 'direct_bulk', 'school_program'];

type Props = {
  orderId: string;
  isBulk: boolean;
  bulk: {
    customer_type: string;
    tier_discount_pct: number | null;
    volume_unit_cost_cents: number | null;
    notes: string | null;
  } | null;
};

export default function BulkToggleCard({ orderId, isBulk, bulk }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [customerType, setCustomerType] = useState<CustomerType>(
    (bulk?.customer_type as CustomerType) ?? 'wholesale',
  );
  const [discountPct, setDiscountPct] = useState<string>(
    bulk?.tier_discount_pct != null ? String(bulk.tier_discount_pct) : '',
  );
  const [volumeUnitCost, setVolumeUnitCost] = useState<string>(
    bulk?.volume_unit_cost_cents != null ? (bulk.volume_unit_cost_cents / 100).toFixed(2) : '',
  );
  const [notes, setNotes] = useState<string>(bulk?.notes ?? '');

  function buildBody(nextIsBulk: boolean): Record<string, unknown> {
    const body: Record<string, unknown> = { is_bulk: nextIsBulk };
    if (nextIsBulk) {
      body.customer_type = customerType;
      if (discountPct.trim()) {
        const n = parseFloat(discountPct);
        if (isFinite(n)) body.tier_discount_pct = n;
      }
      if (volumeUnitCost.trim()) {
        const n = parseFloat(volumeUnitCost.replace(/[$,]/g, ''));
        if (isFinite(n)) body.volume_unit_cost_cents = Math.round(n * 100);
      }
      if (notes.trim()) body.notes = notes.trim();
    }
    return body;
  }

  function submit(nextIsBulk: boolean) {
    setErr(null);
    setOk(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/orders/${orderId}/bulk`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(buildBody(nextIsBulk)),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'Save failed' }));
        setErr(j.error ?? 'Save failed');
        return;
      }
      setOk(nextIsBulk ? 'Marked as bulk' : 'Bulk flag removed');
      router.refresh();
    });
  }

  return (
    <section className="card-faire-detail p-5 border border-indigo-500/20 mb-6">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div>
          <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-indigo-300">
            Bulk order
          </h2>
          <p className="text-stone-400 text-xs font-body mt-1">
            Flag affects shipment tier, margin-board bucketing, and the P&amp;L's volume-unit-cost
            override. Pick a customer type and (optionally) a per-unit volume cost that overrides
            the per-pot COGS template for this order only.
          </p>
        </div>
        <span
          className={`text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
            isBulk
              ? 'bg-indigo-500/10 border border-indigo-500/40 text-indigo-200'
              : 'bg-stone-800 text-stone-500'
          }`}
        >
          {isBulk ? 'Bulk' : 'Retail'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Customer type</span>
          <select
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value as CustomerType)}
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
          >
            {CUSTOMER_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Tier discount %</span>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={discountPct}
            onChange={(e) => setDiscountPct(e.target.value)}
            placeholder="0"
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono focus:border-[#C9A96E] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Volume unit cost ($)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={volumeUnitCost}
            onChange={(e) => setVolumeUnitCost(e.target.value)}
            placeholder="per-pot override"
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono focus:border-[#C9A96E] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Notes</span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 mt-4">
        <p className="text-xs">
          {err && <span className="text-red-300">{err}</span>}
          {ok && <span className="text-emerald-300">{ok}</span>}
        </p>
        <div className="flex items-center gap-2">
          {isBulk && (
            <button
              type="button"
              disabled={pending}
              onClick={() => submit(false)}
              className="text-xs font-heading font-bold uppercase tracking-wider px-3 py-2 rounded border border-stone-700 text-stone-300 hover:border-red-500/40 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Unmark bulk
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => submit(true)}
            className="btn-faire !w-auto disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? 'Saving…' : isBulk ? 'Update bulk fields' : 'Mark as bulk'}
          </button>
        </div>
      </div>
    </section>
  );
}

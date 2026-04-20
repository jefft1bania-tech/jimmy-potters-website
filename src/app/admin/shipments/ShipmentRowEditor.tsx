'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ShipmentRow } from '@/lib/shipments-data';

const SHIPMENT_STATUSES = [
  'queued',
  'in_production',
  'packed',
  'shipped',
  'in_transit',
  'delivered',
  'delayed',
] as const;

const FLAGS = ['normal', 'heads_up', 'critical', 'urgent'] as const;
const CARRIERS = ['', 'fedex', 'usps', 'ups', 'local'] as const;

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

type Props = { row: ShipmentRow };

function flagPillClass(flag: ShipmentRow['flag']): string {
  if (flag === 'urgent') return 'bg-red-500/15 border border-red-500/40 text-red-300';
  if (flag === 'critical') return 'bg-orange-500/15 border border-orange-500/40 text-orange-300';
  if (flag === 'heads_up') return 'bg-amber-500/10 border border-amber-500/30 text-amber-300';
  return 'bg-stone-900 border border-stone-700 text-stone-400';
}

function windowPillClass(w: ShipmentRow['ship_by_window']): string {
  if (w === 'overdue') return 'bg-red-600/20 border border-red-500/40 text-red-300';
  if (w === 'ship_by_3d') return 'bg-red-500/10 border border-red-500/30 text-red-300';
  if (w === 'ship_by_7d') return 'bg-orange-500/10 border border-orange-500/30 text-orange-300';
  if (w === 'ship_by_14d') return 'bg-amber-500/10 border border-amber-500/30 text-amber-300';
  if (w === 'ship_by_30d') return 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300';
  return 'bg-stone-900 border border-stone-700 text-stone-500';
}

function windowLabel(w: ShipmentRow['ship_by_window'], days: number | null): string {
  if (w === 'overdue') return days !== null ? `${Math.abs(days)}d overdue` : 'Overdue';
  if (!w) return days !== null && days > 30 ? `${days}d out` : 'No deadline';
  if (w === 'ship_by_3d') return `≤3d`;
  if (w === 'ship_by_7d') return `≤7d`;
  if (w === 'ship_by_14d') return `≤14d`;
  if (w === 'ship_by_30d') return `≤30d`;
  return w;
}

export default function ShipmentRowEditor({ row }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [status, setStatus] = useState<ShipmentRow['shipment_status']>(row.shipment_status);
  const [flag, setFlag] = useState<ShipmentRow['flag']>(row.flag);
  const [shipBy, setShipBy] = useState<string>(row.required_ship_by ?? '');
  const [carrier, setCarrier] = useState<string>(row.carrier ?? '');
  const [tracking, setTracking] = useState<string>(row.tracking_number ?? '');

  function hasChanges(): boolean {
    return (
      status !== row.shipment_status ||
      flag !== row.flag ||
      (shipBy || '') !== (row.required_ship_by ?? '') ||
      carrier !== (row.carrier ?? '') ||
      tracking !== (row.tracking_number ?? '')
    );
  }

  function onSave() {
    setErr(null);
    startTransition(async () => {
      const body: Record<string, unknown> = {};
      if (status !== row.shipment_status) body.shipment_status = status;
      if (flag !== row.flag) body.flag = flag;
      if ((shipBy || '') !== (row.required_ship_by ?? '')) body.required_ship_by = shipBy || null;
      if (carrier !== (row.carrier ?? '')) body.carrier = carrier || null;
      if (tracking !== (row.tracking_number ?? '')) body.tracking_number = tracking;
      const res = await fetch(`/api/admin/shipments/${row.order_id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'Save failed' }));
        setErr(j.error ?? 'Save failed');
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="card-faire-detail p-4 border border-stone-700">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/admin/orders/${row.order_id}`}
              className="font-heading font-bold text-white text-sm hover:text-[#C9A96E] hover:underline font-mono truncate"
            >
              {row.order_id.slice(0, 8)}…
            </Link>
            {row.order_is_bulk && (
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-purple-500/40 bg-purple-500/10 text-purple-300">
                Bulk · {row.order_item_count}
              </span>
            )}
            <span className={`text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded ${flagPillClass(row.flag)}`}>
              {row.flag.replace('_', ' ')}
            </span>
            <span className={`text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded ${windowPillClass(row.ship_by_window)}`}>
              {windowLabel(row.ship_by_window, row.days_until_ship_by)}
            </span>
          </div>
          <p className="text-stone-400 text-xs font-body mt-1">
            <span className="text-stone-300">{row.order_email || '—'}</span>
            <span className="text-stone-600 mx-2">·</span>
            <span className="font-mono">{USD.format(row.order_total_cents / 100)}</span>
            <span className="text-stone-600 mx-2">·</span>
            <span>Ordered {new Date(row.order_created_at).toISOString().slice(0, 10)}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ShipmentRow['shipment_status'])}
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
          >
            {SHIPMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Flag</span>
          <select
            value={flag}
            onChange={(e) => setFlag(e.target.value as ShipmentRow['flag'])}
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
          >
            {FLAGS.map((f) => (
              <option key={f} value={f}>{f.replace('_', ' ')}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Ship by</span>
          <input
            type="date"
            value={shipBy}
            onChange={(e) => setShipBy(e.target.value)}
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Carrier</span>
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 focus:border-[#C9A96E] focus:outline-none"
          >
            {CARRIERS.map((c) => (
              <option key={c} value={c}>{c || '—'}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">Tracking</span>
          <input
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="—"
            className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-2 py-1 font-mono focus:border-[#C9A96E] focus:outline-none"
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-stone-500 text-[11px]">
          {row.shipped_at && <span>Shipped {new Date(row.shipped_at).toISOString().slice(0, 10)} · </span>}
          {row.delivered_at && <span>Delivered {new Date(row.delivered_at).toISOString().slice(0, 10)} · </span>}
          {row.notes && <span className="text-stone-400">{row.notes}</span>}
        </p>
        <div className="flex items-center gap-3">
          {err && <span className="text-xs text-red-300">{err}</span>}
          <button
            type="button"
            onClick={onSave}
            disabled={pending || !hasChanges()}
            className="btn-faire !w-auto disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

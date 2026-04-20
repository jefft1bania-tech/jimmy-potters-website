// Server-side loader for /admin/shipments. Joins shipments + orders (for
// buyer email + is_bulk + order_items quantity totals) and annotates each
// row with the ship-by window classification from lib/notifications.
//
// SERVER ONLY — imports the service-role client.

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { classifyShipByWindow, type ShipByWindow } from '@/lib/notifications';

export type ShipmentRow = {
  order_id: string;
  required_ship_by: string | null;
  promised_delivery: string | null;
  production_started_at: string | null;
  packed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  carrier: 'fedex' | 'usps' | 'ups' | 'local' | null;
  tracking_number: string | null;
  shipment_status:
    | 'queued'
    | 'in_production'
    | 'packed'
    | 'shipped'
    | 'in_transit'
    | 'delivered'
    | 'delayed';
  flag: 'normal' | 'heads_up' | 'critical' | 'urgent';
  notes: string | null;
  // Joined from orders
  order_email: string;
  order_created_at: string;
  order_is_bulk: boolean;
  order_total_cents: number;
  order_item_count: number;
  // Derived
  ship_by_window: ShipByWindow;
  days_until_ship_by: number | null;
};

const ACTIVE_STATUSES = new Set([
  'queued',
  'in_production',
  'packed',
  'shipped',
  'in_transit',
  'delayed',
]);

export function isActiveStatus(s: ShipmentRow['shipment_status']): boolean {
  return ACTIVE_STATUSES.has(s);
}

export async function loadShipments(opts: {
  from?: string; // YYYY-MM-DD, required_ship_by >= this
  to?: string;   // YYYY-MM-DD, required_ship_by <= this
  includeDelivered?: boolean;
  today?: Date;
}): Promise<ShipmentRow[]> {
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const today = opts.today ?? new Date();

  let query = supabase
    .from('shipments')
    .select(
      'order_id, required_ship_by, promised_delivery, production_started_at, packed_at, shipped_at, delivered_at, carrier, tracking_number, shipment_status, flag, notes, orders!inner(email, created_at, is_bulk, total_cents, order_items(quantity))',
    );

  if (opts.from) query = query.gte('required_ship_by', opts.from);
  if (opts.to) query = query.lte('required_ship_by', opts.to);
  if (!opts.includeDelivered) query = query.neq('shipment_status', 'delivered');

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  type Raw = Omit<ShipmentRow, 'order_email' | 'order_created_at' | 'order_is_bulk' | 'order_total_cents' | 'order_item_count' | 'ship_by_window' | 'days_until_ship_by'> & {
    orders: {
      email: string | null;
      created_at: string;
      is_bulk: boolean | null;
      total_cents: number | null;
      order_items: Array<{ quantity: number }> | null;
    };
  };

  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  const rows: ShipmentRow[] = (data ?? []).map((raw: Raw) => {
    const ship_by_window = classifyShipByWindow(raw.required_ship_by, today);
    let days_until_ship_by: number | null = null;
    if (raw.required_ship_by) {
      const shipUtc = Date.parse(`${raw.required_ship_by}T00:00:00Z`);
      days_until_ship_by = Math.round((shipUtc - todayUtc) / 86_400_000);
    }
    const itemCount = (raw.orders.order_items ?? []).reduce((s, i) => s + (i.quantity ?? 0), 0);
    return {
      order_id: raw.order_id,
      required_ship_by: raw.required_ship_by,
      promised_delivery: raw.promised_delivery,
      production_started_at: raw.production_started_at,
      packed_at: raw.packed_at,
      shipped_at: raw.shipped_at,
      delivered_at: raw.delivered_at,
      carrier: raw.carrier,
      tracking_number: raw.tracking_number,
      shipment_status: raw.shipment_status,
      flag: raw.flag,
      notes: raw.notes,
      order_email: raw.orders.email ?? '',
      order_created_at: raw.orders.created_at,
      order_is_bulk: raw.orders.is_bulk === true,
      order_total_cents: raw.orders.total_cents ?? 0,
      order_item_count: itemCount,
      ship_by_window,
      days_until_ship_by,
    };
  });

  // Default sort: overdue first, then by required_ship_by asc; nulls last.
  rows.sort((a, b) => {
    const aOver = a.ship_by_window === 'overdue' ? 0 : 1;
    const bOver = b.ship_by_window === 'overdue' ? 0 : 1;
    if (aOver !== bOver) return aOver - bOver;
    if (a.required_ship_by && b.required_ship_by) {
      return a.required_ship_by.localeCompare(b.required_ship_by);
    }
    if (a.required_ship_by) return -1;
    if (b.required_ship_by) return 1;
    return a.order_created_at.localeCompare(b.order_created_at);
  });

  return rows;
}

export function monthRange(yyyyMm: string, today: Date = new Date()): { from: string; to: string; label: string } {
  const iso = /^\d{4}-\d{2}$/;
  const valid = iso.test(yyyyMm);
  const [yStr, mStr] = valid ? yyyyMm.split('-') : [
    String(today.getUTCFullYear()),
    String(today.getUTCMonth() + 1).padStart(2, '0'),
  ];
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const last = new Date(Date.UTC(y, m, 0));
  const pad = (n: number) => String(n).padStart(2, '0');
  const from = `${y}-${pad(m)}-01`;
  const to = `${y}-${pad(m)}-${pad(last.getUTCDate())}`;
  const label = first.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return { from, to, label };
}

export function shiftMonth(yyyyMm: string, delta: number): string {
  const [y, m] = yyyyMm.split('-').map((n) => parseInt(n, 10));
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

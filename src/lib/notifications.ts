// Notification engine: bulk-order flags + ship-by countdown.
// Pure decision logic; caller pairs with Resend + Supabase inserts.

export type BulkFlag = 'normal' | 'heads_up' | 'critical' | 'urgent';

export const BULK_TIER_THRESHOLDS = {
  heads_up: 10,
  critical: 25,
  urgent: 50,
} as const;

export function classifyBulkFlag(totalQuantity: number): BulkFlag {
  if (totalQuantity >= BULK_TIER_THRESHOLDS.urgent)   return 'urgent';
  if (totalQuantity >= BULK_TIER_THRESHOLDS.critical) return 'critical';
  if (totalQuantity >= BULK_TIER_THRESHOLDS.heads_up) return 'heads_up';
  return 'normal';
}

export type ShipByWindow = 'ship_by_30d' | 'ship_by_14d' | 'ship_by_7d' | 'ship_by_3d' | 'overdue' | null;

export function classifyShipByWindow(
  requiredShipBy: string | null,
  today: Date = new Date(),
): ShipByWindow {
  if (!requiredShipBy) return null;

  const ship = new Date(requiredShipBy + 'T00:00:00Z').getTime();
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const diffDays = Math.round((ship - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)  return 'overdue';
  if (diffDays <= 3) return 'ship_by_3d';
  if (diffDays <= 7) return 'ship_by_7d';
  if (diffDays <= 14) return 'ship_by_14d';
  if (diffDays <= 30) return 'ship_by_30d';
  return null;
}

export type AlreadyNotified = { order_id: string; notification_type: string };

// Decide which orders need a notification this cron run. Dedupe against already-sent log.
export function selectOrdersToNotify(
  shipments: Array<{ order_id: string; required_ship_by: string | null; shipment_status: string }>,
  alreadyNotified: AlreadyNotified[],
  today: Date = new Date(),
): Array<{ order_id: string; notification_type: ShipByWindow }> {
  const sentSet = new Set(alreadyNotified.map((a) => `${a.order_id}::${a.notification_type}`));
  const inFlight = new Set(['queued', 'in_production']);
  const out: Array<{ order_id: string; notification_type: ShipByWindow }> = [];

  for (const s of shipments) {
    if (!inFlight.has(s.shipment_status) && s.shipment_status !== 'packed') continue;
    const window = classifyShipByWindow(s.required_ship_by, today);
    if (!window) continue;
    if (sentSet.has(`${s.order_id}::${window}`) && window !== 'overdue') continue;
    // overdue fires daily until resolved → caller still dedupes by (order_id, type, date) if needed
    out.push({ order_id: s.order_id, notification_type: window });
  }

  return out;
}

export function renderBulkOrderEmail(opts: {
  buyer_name: string;
  buyer_contact: string;
  total_pots: number;
  required_ship_by: string | null;
  flag: BulkFlag;
  dashboard_url: string;
}): { subject: string; html: string; text: string } {
  const flagLabel = opts.flag.replace('_', ' ').toUpperCase();
  const shipBy = opts.required_ship_by ?? 'not set';
  const subject = `[${flagLabel}] ${opts.total_pots}-pot order from ${opts.buyer_name} — ship by ${shipBy}`;

  const text = [
    `Bulk order alert — ${flagLabel}`,
    '',
    `Buyer: ${opts.buyer_name}`,
    `Contact: ${opts.buyer_contact}`,
    `Quantity: ${opts.total_pots} pots`,
    `Required ship-by: ${shipBy}`,
    '',
    `Dashboard: ${opts.dashboard_url}`,
  ].join('\n');

  const html = `<p><strong>Bulk order alert — ${flagLabel}</strong></p>
<table><tr><td><strong>Buyer</strong></td><td>${opts.buyer_name}</td></tr>
<tr><td><strong>Contact</strong></td><td>${opts.buyer_contact}</td></tr>
<tr><td><strong>Quantity</strong></td><td>${opts.total_pots} pots</td></tr>
<tr><td><strong>Required ship-by</strong></td><td>${shipBy}</td></tr></table>
<p><a href="${opts.dashboard_url}">Open on dashboard →</a></p>`;

  return { subject, html, text };
}

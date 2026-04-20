import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SHIPMENT_STATUSES = new Set([
  'queued',
  'in_production',
  'packed',
  'shipped',
  'in_transit',
  'delivered',
  'delayed',
]);
const FLAGS = new Set(['normal', 'heads_up', 'critical', 'urgent']);
const CARRIERS = new Set(['fedex', 'usps', 'ups', 'local']);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function PATCH(req: Request, ctx: { params: { orderId: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const orderId = ctx.params.orderId;
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if ('shipment_status' in body) {
    const v = body.shipment_status;
    if (typeof v !== 'string' || !SHIPMENT_STATUSES.has(v)) {
      return NextResponse.json({ error: 'Invalid shipment_status' }, { status: 400 });
    }
    patch.shipment_status = v;
    const now = new Date().toISOString();
    if (v === 'in_production') patch.production_started_at = now;
    if (v === 'packed') patch.packed_at = now;
    if (v === 'shipped' || v === 'in_transit') patch.shipped_at = now;
    if (v === 'delivered') patch.delivered_at = now;
  }

  if ('flag' in body) {
    const v = body.flag;
    if (typeof v !== 'string' || !FLAGS.has(v)) {
      return NextResponse.json({ error: 'Invalid flag' }, { status: 400 });
    }
    patch.flag = v;
  }

  if ('carrier' in body) {
    const v = body.carrier;
    if (v === null || v === '') {
      patch.carrier = null;
    } else if (typeof v !== 'string' || !CARRIERS.has(v)) {
      return NextResponse.json({ error: 'Invalid carrier' }, { status: 400 });
    } else {
      patch.carrier = v;
    }
  }

  if ('tracking_number' in body) {
    const v = body.tracking_number;
    patch.tracking_number = typeof v === 'string' && v.trim() ? v.trim() : null;
  }

  if ('required_ship_by' in body) {
    const v = body.required_ship_by;
    if (v === null || v === '') {
      patch.required_ship_by = null;
    } else if (typeof v !== 'string' || !ISO_DATE.test(v)) {
      return NextResponse.json({ error: 'required_ship_by must be YYYY-MM-DD' }, { status: 400 });
    } else {
      patch.required_ship_by = v;
    }
  }

  if ('notes' in body) {
    const v = body.notes;
    patch.notes = typeof v === 'string' && v.trim() ? v.trim() : null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { data, error } = await supabase
    .from('shipments')
    .update(patch)
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Shipment not found for order' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, shipment: data });
}

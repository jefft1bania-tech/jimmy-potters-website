import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/* eslint-disable @typescript-eslint/no-explicit-any */

type Body = {
  materials_cents?: number;
  labor_cents?: number;
  packaging_cents?: number;
  freight_cents?: number;
  other_cents?: number;
  notes?: string;
};

const COST_KEYS = ['materials_cents', 'labor_cents', 'packaging_cents', 'freight_cents', 'other_cents'] as const;

function bad(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return bad(400, 'Invalid JSON');
  }

  const patch: Record<string, number | string | null> = { order_id: params.id };
  let anyProvided = false;
  for (const k of COST_KEYS) {
    const v = body[k];
    if (v === undefined) continue;
    if (!Number.isInteger(v) || v < 0) return bad(400, `${k} must be a non-negative integer`);
    patch[k] = v;
    anyProvided = true;
  }
  if (body.notes !== undefined) patch.notes = body.notes ?? null;

  if (!anyProvided && body.notes === undefined) return bad(400, 'No fields to update');

  const supabase = createSupabaseAdminClient();
  const admin = supabase as unknown as { from: (t: string) => any };

  const { data: order, error: lookupErr } = await admin
    .from('orders')
    .select('id')
    .eq('id', params.id)
    .maybeSingle();
  if (lookupErr) return bad(500, `lookup failed: ${lookupErr.message}`);
  if (!order) return bad(404, 'Order not found');

  patch.updated_at = new Date().toISOString();

  const { error: upsertErr } = await admin
    .from('order_cost_overrides')
    .upsert(patch, { onConflict: 'order_id' });
  if (upsertErr) return bad(500, `upsert failed: ${upsertErr.message}`);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return bad(404, 'Not found');
  }

  const supabase = createSupabaseAdminClient();
  const admin = supabase as unknown as { from: (t: string) => any };

  const { data: order, error: lookupErr } = await admin
    .from('orders')
    .select('id, status')
    .eq('id', params.id)
    .maybeSingle();
  if (lookupErr) return bad(500, `lookup failed: ${lookupErr.message}`);
  if (!order) return bad(404, 'Order not found');

  // Money/fulfillment guard: paid/shipped/delivered orders cannot be deleted.
  // Stripe charges, Venmo/PayPal records, and outbound shipments would diverge
  // from DB state. Refund or cancel first, then delete.
  const PROTECTED_STATUSES = new Set(['paid', 'shipped', 'delivered']);
  if (PROTECTED_STATUSES.has(order.status)) {
    return bad(
      409,
      `Cannot delete order in status "${order.status}". Refund or cancel the order first, then retry.`,
    );
  }

  // Cascade delete children before parent. Order matters: anything FK-referencing
  // orders.id must go first. Best-effort on optional tables (no row = no error).
  const childTables = [
    'bulk_order_pricing',
    'order_cost_overrides',
    'payment_records',
    'shipments',
    'order_items',
  ] as const;

  for (const table of childTables) {
    const { error } = await admin.from(table).delete().eq('order_id', params.id);
    if (error) return bad(500, `${table} delete failed: ${error.message}`);
  }

  const { error: orderErr } = await admin.from('orders').delete().eq('id', params.id);
  if (orderErr) return bad(500, `orders delete failed: ${orderErr.message}`);

  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  revalidatePath('/admin/pnl');
  revalidatePath('/admin/shipments');

  return NextResponse.json({ ok: true, deleted: params.id });
}

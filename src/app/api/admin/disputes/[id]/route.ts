import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STATUSES = new Set([
  'new',
  'investigating',
  'awaiting_customer',
  'resolved_refund',
  'resolved_replacement',
  'resolved_no_action',
  'closed',
]);

const CLOSING_STATUSES = new Set([
  'resolved_refund',
  'resolved_replacement',
  'resolved_no_action',
  'closed',
]);

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const id = ctx.params.id;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if ('status' in body) {
    if (typeof body.status !== 'string' || !STATUSES.has(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    patch.status = body.status;
    if (CLOSING_STATUSES.has(body.status)) {
      patch.closed_at = new Date().toISOString();
    } else {
      patch.closed_at = null;
    }
    patch.handled_by = profile.id;
  }

  if ('resolution_notes' in body) {
    const v = body.resolution_notes;
    patch.resolution_notes = typeof v === 'string' && v.trim() ? v.trim() : null;
  }

  if ('order_id' in body) {
    const v = body.order_id;
    if (v === null || v === '') patch.order_id = null;
    else if (typeof v === 'string') patch.order_id = v.trim() || null;
    else return NextResponse.json({ error: 'order_id must be uuid or null' }, { status: 400 });
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { data, error } = await supabase
    .from('customer_disputes')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true, dispute: data });
}

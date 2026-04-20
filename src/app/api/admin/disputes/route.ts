import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DISPUTE_TYPES = new Set([
  'not_received',
  'damaged',
  'wrong_item',
  'refund_request',
  'late_delivery',
  'other',
]);
const DISPUTE_CHANNELS = new Set(['chat_widget', 'email', 'voice', 'manual']);

export async function POST(req: Request) {
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = typeof body.customer_email === 'string' ? body.customer_email.trim() : '';
  const dispute_type = typeof body.dispute_type === 'string' ? body.dispute_type : '';
  const opened_via = typeof body.opened_via === 'string' ? body.opened_via : 'manual';
  const order_id = typeof body.order_id === 'string' && body.order_id.trim() ? body.order_id.trim() : null;
  const resolution_notes =
    typeof body.resolution_notes === 'string' && body.resolution_notes.trim()
      ? body.resolution_notes.trim()
      : null;

  if (!email) return NextResponse.json({ error: 'Missing customer_email' }, { status: 400 });
  if (!DISPUTE_TYPES.has(dispute_type)) return NextResponse.json({ error: 'Invalid dispute_type' }, { status: 400 });
  if (!DISPUTE_CHANNELS.has(opened_via)) return NextResponse.json({ error: 'Invalid opened_via' }, { status: 400 });

  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { data, error } = await supabase
    .from('customer_disputes')
    .insert({
      customer_email: email,
      dispute_type,
      opened_via,
      order_id,
      resolution_notes,
      status: 'new',
      handled_by: profile.id,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, dispute: data });
}

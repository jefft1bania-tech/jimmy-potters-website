import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/* eslint-disable @typescript-eslint/no-explicit-any */

type Body = {
  provider?: 'venmo' | 'paypal';
  amount_cents?: number;
  received_on?: string;
  notes?: string;
};

function bad(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return bad(400, 'Invalid JSON');
  }

  const { provider, amount_cents, received_on, notes } = body;
  if (provider !== 'venmo' && provider !== 'paypal') return bad(400, 'provider must be venmo or paypal');
  if (!Number.isInteger(amount_cents) || (amount_cents as number) < 0) return bad(400, 'amount_cents must be a non-negative integer');
  if (!received_on || !/^\d{4}-\d{2}-\d{2}$/.test(received_on)) return bad(400, 'received_on must be YYYY-MM-DD');

  const supabase = createSupabaseAdminClient();
  const admin = supabase as unknown as { from: (t: string) => any };

  const { data: existing, error: fetchErr } = await admin
    .from('orders')
    .select('id, status, payment_method')
    .eq('id', params.id)
    .maybeSingle();
  if (fetchErr) return bad(500, `lookup failed: ${fetchErr.message}`);
  if (!existing) return bad(404, 'Order not found');
  if (existing.status !== 'pending') return bad(409, `Order is already ${existing.status}`);
  if (existing.payment_method !== 'venmo' && existing.payment_method !== 'paypal') {
    return bad(409, `Order payment_method is ${existing.payment_method}, not venmo/paypal`);
  }

  const nowIso = new Date().toISOString();

  const { error: payErr } = await admin.from('payment_records').insert({
    order_id: params.id,
    provider,
    amount_cents,
    received_on,
    notes: notes ?? null,
  });
  if (payErr) return bad(500, `payment_records insert failed: ${payErr.message}`);

  const { error: orderErr } = await admin
    .from('orders')
    .update({ status: 'paid', paid_at: nowIso })
    .eq('id', params.id);
  if (orderErr) return bad(500, `orders update failed: ${orderErr.message}`);

  return NextResponse.json({ ok: true, paid_at: nowIso });
}

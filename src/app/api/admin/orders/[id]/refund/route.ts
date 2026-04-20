import { NextResponse, type NextRequest } from 'next/server';
import { Resend } from 'resend';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const runtime = 'nodejs';

type Body = {
  amount_cents?: number;
  reason?: string;
};

function bad(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let body: Body = {};
  try {
    body = (await req.json().catch(() => ({}))) as Body;
  } catch {
    return bad(400, 'Invalid JSON');
  }

  if (body.amount_cents !== undefined) {
    if (!Number.isInteger(body.amount_cents) || body.amount_cents <= 0) {
      return bad(400, 'amount_cents must be a positive integer when provided');
    }
  }

  const supabase = createSupabaseAdminClient();
  const admin = supabase as unknown as { from: (t: string) => any };

  const { data: order, error: lookupErr } = await admin
    .from('orders')
    .select('id, email, status, payment_method, total_cents, stripe_payment_intent_id')
    .eq('id', params.id)
    .maybeSingle();
  if (lookupErr) return bad(500, `lookup failed: ${lookupErr.message}`);
  if (!order) return bad(404, 'Order not found');

  if (order.payment_method !== 'stripe') {
    return bad(409, `Refund route only handles Stripe orders; got ${order.payment_method}. Use /admin/disputes for manual refunds.`);
  }
  if (!order.stripe_payment_intent_id) {
    return bad(409, 'Order is missing a Stripe payment intent ID.');
  }
  if (order.status !== 'paid' && order.status !== 'shipped' && order.status !== 'delivered') {
    return bad(409, `Cannot refund an order with status ${order.status}`);
  }

  const refundAmount = body.amount_cents ?? order.total_cents;
  if (refundAmount > order.total_cents) return bad(400, 'amount_cents cannot exceed order total');

  const stripe = getStripe();
  let stripeRefundId: string;
  try {
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      amount: refundAmount,
      reason: body.reason === 'duplicate' || body.reason === 'fraudulent' || body.reason === 'requested_by_customer'
        ? body.reason
        : undefined,
    });
    stripeRefundId = refund.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'stripe refund failed';
    return bad(502, `Stripe refund failed: ${msg}`);
  }

  const { error: insertErr } = await admin.from('refunds').insert({
    order_id: params.id,
    stripe_refund_id: stripeRefundId,
    amount_cents: refundAmount,
    reason: body.reason ?? null,
    status: 'succeeded',
  });
  if (insertErr) return bad(500, `refunds insert failed: ${insertErr.message}`);

  const { error: updateErr } = await admin
    .from('orders')
    .update({ status: 'refunded', refunded_at: new Date().toISOString() })
    .eq('id', params.id);
  if (updateErr) return bad(500, `orders update failed: ${updateErr.message}`);

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const amountUsd = (refundAmount / 100).toFixed(2);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'orders@jimmypotters.com',
        to: order.email,
        subject: `Refund issued — Order #${order.id.slice(0, 8)}`,
        text: [
          `Hi,`,
          ``,
          `A refund of $${amountUsd} has been issued for your Jimmy Potters order #${order.id.slice(0, 8)}.`,
          `It should appear on your original payment method within 5–10 business days.`,
          ``,
          body.reason ? `Reason: ${body.reason}` : '',
          ``,
          `— Jimmy Potters`,
        ].filter(Boolean).join('\n'),
      });
    } catch (e) {
      console.warn('[admin/refund] customer email failed:', e);
      // Non-fatal.
    }
  } else {
    console.warn('[admin/refund] RESEND_API_KEY not set — skipping customer email.');
  }

  return NextResponse.json({ ok: true, stripe_refund_id: stripeRefundId, amount_cents: refundAmount });
}

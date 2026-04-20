import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { updateOrderStatus } from '@/lib/orders';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Fetch the balance transaction to get the exact Stripe fee in cents.
    let stripeFeeCents: number | undefined;
    try {
      const latestChargeId = typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : paymentIntent.latest_charge?.id;

      if (latestChargeId) {
        const charge = await stripe.charges.retrieve(latestChargeId, {
          expand: ['balance_transaction'],
        });
        const bt = charge.balance_transaction;
        if (bt && typeof bt !== 'string') {
          stripeFeeCents = bt.fee;
        }
      }
    } catch (feeErr) {
      console.warn(`[WEBHOOK] fee lookup failed for PI ${paymentIntent.id}:`, feeErr);
    }

    const order = await updateOrderStatus(paymentIntent.id, 'paid', {
      stripeFeeCents,
      paidAt: new Date().toISOString(),
    });

    if (order) {
      console.log(
        `[WEBHOOK] Order ${order.id} PAID fee=${stripeFeeCents ?? 'unknown'} ` +
        `total=${order.total} items=${order.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}`,
      );
    } else {
      console.warn(`[WEBHOOK] payment_intent.succeeded but no matching order for PI: ${paymentIntent.id}`);
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log(`[WEBHOOK] Checkout session completed for ${session.customer_details?.email}`);
  }

  return NextResponse.json({ received: true });
}

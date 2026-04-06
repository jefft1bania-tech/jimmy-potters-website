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
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // ═══ PAYMENT INTENT SUCCEEDED ═══
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Update order status to 'paid'
    const order = updateOrderStatus(paymentIntent.id, 'paid');

    if (order) {
      console.log(`[WEBHOOK] Order ${order.id} PAID:
  Email: ${order.email}
  State: ${order.buyerState}
  Subtotal: $${(order.subtotal / 100).toFixed(2)}
  Sales Tax: $${(order.salesTaxCollected / 100).toFixed(2)}
  Total Charged: $${(order.total / 100).toFixed(2)}
  Internal Shipping Cost: $${(order.internalShippingCost / 100).toFixed(2)}
  Items: ${order.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}
`);
    } else {
      console.warn(`[WEBHOOK] payment_intent.succeeded but no matching order for PI: ${paymentIntent.id}`);
    }
  }

  // ═══ CHECKOUT SESSION COMPLETED (legacy fallback) ═══
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_details?.email;

    console.log(`[WEBHOOK] Checkout session completed:
  Email: ${customerEmail}
  Products: ${session.metadata?.product_ids}
`);
  }

  return NextResponse.json({ received: true });
}

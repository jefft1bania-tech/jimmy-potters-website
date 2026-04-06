import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_details?.email;

    if (!customerEmail) {
      console.error('No customer email found in session');
      return NextResponse.json({ received: true });
    }

    const productIds = session.metadata?.product_ids;

    // Send order confirmation email
    // await resend.emails.send({...})

    console.log(`[WEBHOOK] Product order confirmed:
      Email: ${customerEmail}
      Products: ${productIds}
      Shipping: ${JSON.stringify((session as any).shipping_details?.address)}
    `);
  }

  return NextResponse.json({ received: true });
}

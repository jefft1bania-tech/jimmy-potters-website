import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { getClassByIdFull } from '@/lib/classes';

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
    const orderType = session.metadata?.order_type;
    const customerEmail = session.customer_details?.email;

    if (!customerEmail) {
      console.error('No customer email found in session');
      return NextResponse.json({ received: true });
    }

    if (orderType === 'class') {
      const classId = session.metadata?.class_id;
      const childName = session.metadata?.child_name;

      if (classId) {
        const classData = getClassByIdFull(classId);

        if (classData) {
          // Send email with Zoom link
          // In production, integrate with Resend:
          // await resend.emails.send({
          //   from: 'Jimmy Potters <hello@jimmypotters.com>',
          //   to: customerEmail,
          //   subject: `You're registered: ${classData.name}`,
          //   html: buildClassEmail(classData, childName, (session as any).shipping_details?.address)
          // });

          console.log(`[WEBHOOK] Class registration confirmed:
            Email: ${customerEmail}
            Child: ${childName}
            Class: ${classData.name}
            Zoom Link: ${classData.zoomLink}
            Schedule: ${classData.schedule.dates.join(', ')}
            Shipping: ${JSON.stringify((session as any).shipping_details?.address)}
          `);
        }
      }
    } else if (orderType === 'product') {
      const productIds = session.metadata?.product_ids;

      // Send order confirmation email
      // await resend.emails.send({...})

      console.log(`[WEBHOOK] Product order confirmed:
        Email: ${customerEmail}
        Products: ${productIds}
        Shipping: ${JSON.stringify((session as any).shipping_details?.address)}
      `);
    }
  }

  return NextResponse.json({ received: true });
}

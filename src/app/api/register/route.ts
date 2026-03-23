import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { classId, childName, stripePriceId } = await req.json();

    if (!classId || !childName || !stripePriceId) {
      return NextResponse.json(
        { error: 'Missing required fields: classId, childName, stripePriceId' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      ...(process.env.STRIPE_SHIPPING_RATE_KIT
        ? {
            shipping_options: [
              { shipping_rate: process.env.STRIPE_SHIPPING_RATE_KIT },
            ],
          }
        : {}),
      allow_promotion_codes: true, // Enable SIBLING15 coupon code
      success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}&type=class`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/classes`,
      metadata: {
        order_type: 'class',
        class_id: classId,
        child_name: childName,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

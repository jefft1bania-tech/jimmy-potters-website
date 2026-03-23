import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: items.map((item: { stripePriceId: string }) => ({
        price: item.stripePriceId,
        quantity: 1,
      })),
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      ...(process.env.STRIPE_SHIPPING_RATE_PRODUCT
        ? {
            shipping_options: [
              { shipping_rate: process.env.STRIPE_SHIPPING_RATE_PRODUCT },
            ],
          }
        : {}),
      success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}&type=product`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/cart`,
      metadata: {
        order_type: 'product',
        product_ids: items.map((i: { id: string }) => i.id).join(','),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

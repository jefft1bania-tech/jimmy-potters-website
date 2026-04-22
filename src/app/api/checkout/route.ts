import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { salesEnabled } from '@/lib/sales-mode';

export const dynamic = 'force-dynamic';

function resolveOrigin(req: NextRequest): string {
  if (process.env.NEXT_PUBLIC_URL) return process.env.NEXT_PUBLIC_URL;
  const host = req.headers.get('host');
  if (host) {
    const proto = req.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
    return `${proto}://${host}`;
  }
  return new URL(req.url).origin;
}

export async function POST(req: NextRequest) {
  if (!salesEnabled) {
    return NextResponse.json(
      { error: 'Sales disabled during preview mode' },
      { status: 403 }
    );
  }
  try {
    const { items } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    const origin = resolveOrigin(req);
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
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&type=product`,
      cancel_url: `${origin}/cart`,
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

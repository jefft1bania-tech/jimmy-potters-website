import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createOrder, type OrderItem, type ShippingAddress } from '@/lib/orders';
import { calculateSalesTax } from '@/lib/tax';
import { getInternalShippingCost } from '@/lib/shipping';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { salesEnabled } from '@/lib/sales-mode';

export const dynamic = 'force-dynamic';

interface CheckoutPayload {
  flow: 'guest' | 'register';
  email: string;
  name: string;
  items: OrderItem[];
  shipping: ShippingAddress;
  subtotal: number;
  salesTax: number;
  total: number;
}

export async function POST(req: NextRequest) {
  if (!salesEnabled) {
    return NextResponse.json(
      { error: 'Sales disabled during preview mode' },
      { status: 403 }
    );
  }
  try {
    const body: CheckoutPayload = await req.json();
    const { email, name, items, shipping, subtotal } = body;

    if (!email || !name || !items?.length || !shipping || !subtotal) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const buyerState = shipping.state;
    const salesTax = calculateSalesTax(subtotal, buyerState);
    const total = subtotal + salesTax;
    const internalShippingCost = getInternalShippingCost(buyerState);

    // Resolve member from Supabase session (if signed in — via AuthProvider).
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const memberId = user?.id;
    const flow: 'guest' | 'registered' = memberId ? 'registered' : 'guest';

    const stripe = getStripe();
    let stripeCustomerId: string | undefined;

    if (memberId) {
      const customer = await stripe.customers.create({
        email: email.toLowerCase(),
        name,
        metadata: { memberId },
        shipping: {
          name: shipping.name,
          address: {
            line1: shipping.line1,
            line2: shipping.line2 || undefined,
            city: shipping.city,
            state: shipping.state,
            postal_code: shipping.postalCode,
            country: shipping.country || 'US',
          },
        },
      });
      stripeCustomerId = customer.id;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      ...(stripeCustomerId ? { customer: stripeCustomerId } : {}),
      receipt_email: email.toLowerCase(),
      metadata: {
        order_type: 'product',
        checkout_flow: flow,
        member_id: memberId || '',
        product_ids: items.map((i) => `${i.productId}:${i.quantity || 1}`).join(','),
        buyer_state: buyerState,
        subtotal: String(subtotal),
        sales_tax: String(salesTax),
        internal_shipping_cost: String(internalShippingCost),
        shipping_method: 'FedEx Ground (Free)',
      },
      ...(flow === 'guest'
        ? { setup_future_usage: undefined }
        : { setup_future_usage: 'off_session' as const }),
      automatic_payment_methods: { enabled: true },
    });

    const order = await createOrder({
      type: flow,
      email: email.toLowerCase(),
      memberId,
      items,
      shipping,
      shippingTier: 'ground',
      shippingCost: 0,
      internalShippingCost,
      salesTaxCollected: salesTax,
      buyerState,
      subtotal,
      total,
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      salesTax,
      total,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create payment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

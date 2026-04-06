import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createMember, findMemberByEmail, generateToken } from '@/lib/auth';
import { createOrder, type OrderItem, type ShippingAddress } from '@/lib/orders';
import { calculateSalesTax } from '@/lib/tax';
import { getInternalShippingCost } from '@/lib/shipping';

export const dynamic = 'force-dynamic';

interface CheckoutPayload {
  flow: 'guest' | 'register';
  email: string;
  name: string;
  password?: string;
  newsletter?: boolean;
  items: OrderItem[];
  shipping: ShippingAddress;
  subtotal: number;    // product total in cents (from client)
  salesTax: number;    // client-calculated tax (verified server-side)
  total: number;       // client-calculated total (verified server-side)
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutPayload = await req.json();
    const { flow, email, name, items, shipping, subtotal } = body;

    if (!email || !name || !items?.length || !shipping || !subtotal) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const buyerState = shipping.state;

    // ═══ SERVER-SIDE TAX CALCULATION (authoritative) ═══
    const salesTax = calculateSalesTax(subtotal, buyerState);
    const total = subtotal + salesTax; // Product total + tax. Shipping is FREE to buyer.

    // ═══ INTERNAL SHIPPING COST (not charged to buyer) ═══
    const internalShippingCost = getInternalShippingCost(buyerState);

    const stripe = getStripe();
    let stripeCustomerId: string | undefined;
    let memberId: string | undefined;
    let token: string | undefined;

    // ═══ REGISTERED USER FLOW ═══
    if (flow === 'register') {
      const { password, newsletter } = body;
      if (!password || password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      const existing = findMemberByEmail(email);
      if (existing) {
        return NextResponse.json({ error: 'An account with this email already exists. Please use guest checkout or log in.' }, { status: 409 });
      }

      const member = await createMember(email, name, password);
      memberId = member.id;

      if (newsletter !== undefined) {
        member.preferences.newsletter = newsletter;
      }

      token = generateToken(member);

      const customer = await stripe.customers.create({
        email: email.toLowerCase(),
        name,
        metadata: { memberId: member.id },
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

    // ═══ CREATE PAYMENT INTENT ═══
    // Amount = subtotal + salesTax. Shipping is absorbed by seller.
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
        : { setup_future_usage: 'off_session' }
      ),
      automatic_payment_methods: { enabled: true },
    });

    // ═══ CREATE ORDER RECORD ═══
    const order = createOrder({
      type: flow === 'register' ? 'registered' : 'guest',
      email: email.toLowerCase(),
      memberId,
      items,
      shipping,
      shippingTier: 'ground',
      shippingCost: 0,                         // $0 to customer
      internalShippingCost,                    // actual FedEx cost
      salesTaxCollected: salesTax,             // tax charged
      buyerState,                              // state abbreviation
      subtotal,
      total,
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId,
    });

    // Build response — send server-calculated tax back to client for display
    const response: Record<string, unknown> = {
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      salesTax,
      total,
    };

    if (flow === 'register' && token) {
      response.token = token;
    }

    const res = NextResponse.json(response);

    if (flow === 'register' && token) {
      res.cookies.set('jp_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    return res;
  } catch (error: any) {
    console.error('Payment intent error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    );
  }
}

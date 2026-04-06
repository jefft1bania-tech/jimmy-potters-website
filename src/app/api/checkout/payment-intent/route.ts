import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createMember, findMemberByEmail, generateToken, stripPrivate } from '@/lib/auth';
import { createOrder, type OrderItem, type ShippingAddress } from '@/lib/orders';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

interface CheckoutPayload {
  flow: 'guest' | 'register';
  email: string;
  name: string;
  password?: string;
  newsletter?: boolean;
  items: OrderItem[];
  shipping: ShippingAddress;
  shippingTier: string;
  shippingCost: number;
  subtotal: number;
  total: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutPayload = await req.json();
    const { flow, email, name, items, shipping, shippingTier, shippingCost, subtotal, total } = body;

    if (!email || !name || !items?.length || !shipping || !total) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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

      // Check for existing account
      const existing = findMemberByEmail(email);
      if (existing) {
        return NextResponse.json({ error: 'An account with this email already exists. Please use guest checkout or log in.' }, { status: 409 });
      }

      // Create member account
      const member = await createMember(email, name, password);
      memberId = member.id;

      // Update newsletter preference
      if (newsletter !== undefined) {
        member.preferences.newsletter = newsletter;
      }

      // Generate auth token
      token = generateToken(member);

      // Create Stripe Customer linked to account
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
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      ...(stripeCustomerId ? { customer: stripeCustomerId } : {}),
      receipt_email: email.toLowerCase(),
      metadata: {
        order_type: 'product',
        checkout_flow: flow,
        member_id: memberId || '',
        product_ids: items.map((i) => i.productId).join(','),
        shipping_tier: shippingTier,
      },
      // Don't save payment method for guests
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
      shippingTier,
      shippingCost,
      subtotal,
      total,
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId,
    });

    // Build response
    const response: Record<string, unknown> = {
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
    };

    if (flow === 'register' && token) {
      response.token = token;
    }

    const res = NextResponse.json(response);

    // Set auth cookie for registered users
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

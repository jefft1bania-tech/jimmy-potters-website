import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Supabase types placeholder is loose; cast `.from()` to untyped for inserts/updates.
// Once types are regenerated via `supabase gen types`, this can be removed.
/* eslint-disable @typescript-eslint/no-explicit-any */
function db(): { from: (table: string) => any } {
  return createSupabaseAdminClient() as unknown as { from: (table: string) => any };
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  type: 'guest' | 'registered';
  email: string;
  memberId?: string;
  items: OrderItem[];
  shipping: ShippingAddress;
  shippingTier: string;
  shippingCost: number;
  internalShippingCost: number;
  salesTaxCollected: number;
  buyerState: string;
  subtotal: number;
  total: number;
  stripePaymentIntentId: string;
  stripeCustomerId?: string;
  stripeFeeCents?: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'refunded' | 'cancelled';
  createdAt: string;
  paidAt?: string;
}

type OrderRow = {
  id: string;
  type: 'guest' | 'registered';
  email: string;
  member_id: string | null;
  shipping: ShippingAddress;
  shipping_cost_cents: number;
  internal_shipping_cost_cents: number;
  sales_tax_cents: number;
  buyer_state: string;
  subtotal_cents: number;
  total_cents: number;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  stripe_fee_cents: number | null;
  status: Order['status'];
  created_at: string;
  paid_at: string | null;
};

type OrderItemRow = {
  product_id: string;
  name: string;
  unit_price_cents: number;
  quantity: number;
  image: string | null;
};

function rowToOrder(row: OrderRow, items: OrderItemRow[]): Order {
  return {
    id: row.id,
    type: row.type,
    email: row.email,
    memberId: row.member_id ?? undefined,
    items: items.map((i) => ({
      productId: i.product_id,
      name: i.name,
      price: i.unit_price_cents,
      image: i.image ?? '',
      quantity: i.quantity,
    })),
    shipping: row.shipping,
    shippingTier: 'ground',
    shippingCost: row.shipping_cost_cents,
    internalShippingCost: row.internal_shipping_cost_cents,
    salesTaxCollected: row.sales_tax_cents,
    buyerState: row.buyer_state,
    subtotal: row.subtotal_cents,
    total: row.total_cents,
    stripePaymentIntentId: row.stripe_payment_intent_id ?? '',
    stripeCustomerId: row.stripe_customer_id ?? undefined,
    stripeFeeCents: row.stripe_fee_cents ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    paidAt: row.paid_at ?? undefined,
  };
}

export async function createOrder(
  order: Omit<Order, 'id' | 'createdAt' | 'status'>,
): Promise<Order> {
  const admin = db();

  const { data: inserted, error } = await admin
    .from('orders')
    .insert({
      type: order.type,
      email: order.email,
      member_id: order.memberId ?? null,
      shipping: order.shipping,
      buyer_state: order.buyerState,
      subtotal_cents: order.subtotal,
      sales_tax_cents: order.salesTaxCollected,
      shipping_cost_cents: order.shippingCost,
      internal_shipping_cost_cents: order.internalShippingCost,
      total_cents: order.total,
      payment_method: 'stripe',
      stripe_payment_intent_id: order.stripePaymentIntentId,
      stripe_customer_id: order.stripeCustomerId ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !inserted) {
    throw new Error(`createOrder failed: ${error?.message ?? 'no row returned'}`);
  }

  const orderRow = inserted as unknown as OrderRow;

  const itemRows = order.items.map((item) => ({
    order_id: orderRow.id,
    product_id: item.productId,
    name: item.name,
    unit_price_cents: item.price,
    quantity: item.quantity,
    image: item.image || null,
  }));

  const { error: itemsError } = await admin.from('order_items').insert(itemRows);
  if (itemsError) {
    throw new Error(`createOrder items failed: ${itemsError.message}`);
  }

  // shipments row (1:1 with orders, lifecycle starts here)
  await admin.from('shipments').insert({ order_id: orderRow.id });

  return rowToOrder(orderRow, itemRows);
}

export async function updateOrderStatus(
  paymentIntentId: string,
  status: Order['status'],
  patch: { stripeFeeCents?: number; paidAt?: string } = {},
): Promise<Order | undefined> {
  const admin = db();

  const update: Record<string, unknown> = { status };
  if (patch.stripeFeeCents !== undefined) update.stripe_fee_cents = patch.stripeFeeCents;
  if (patch.paidAt) update.paid_at = patch.paidAt;
  if (status === 'paid' && !patch.paidAt) update.paid_at = new Date().toISOString();

  const { data, error } = await admin
    .from('orders')
    .update(update)
    .eq('stripe_payment_intent_id', paymentIntentId)
    .select()
    .single();

  if (error || !data) return undefined;

  const orderRow = data as unknown as OrderRow;

  const { data: items } = await admin
    .from('order_items')
    .select('product_id, name, unit_price_cents, quantity, image')
    .eq('order_id', orderRow.id);

  return rowToOrder(orderRow, (items as unknown as OrderItemRow[]) ?? []);
}

export async function getOrdersByEmail(email: string): Promise<Order[]> {
  const admin = db();
  const { data } = await admin
    .from('orders')
    .select('*')
    .eq('email', email.toLowerCase())
    .order('created_at', { ascending: false });
  return hydrate(data as unknown as OrderRow[] | null);
}

export async function getOrdersByMemberId(memberId: string): Promise<Order[]> {
  const admin = db();
  const { data } = await admin
    .from('orders')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });
  return hydrate(data as unknown as OrderRow[] | null);
}

export async function getAllOrders(): Promise<Order[]> {
  const admin = db();
  const { data } = await admin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  return hydrate(data as unknown as OrderRow[] | null);
}

async function hydrate(rows: OrderRow[] | null): Promise<Order[]> {
  if (!rows || rows.length === 0) return [];
  const admin = db();
  const { data: items } = await admin
    .from('order_items')
    .select('order_id, product_id, name, unit_price_cents, quantity, image')
    .in('order_id', rows.map((r) => r.id));
  const byOrder = new Map<string, OrderItemRow[]>();
  for (const it of ((items as unknown as (OrderItemRow & { order_id: string })[]) ?? [])) {
    const bucket = byOrder.get(it.order_id) ?? [];
    bucket.push(it);
    byOrder.set(it.order_id, bucket);
  }
  return rows.map((r) => rowToOrder(r, byOrder.get(r.id) ?? []));
}

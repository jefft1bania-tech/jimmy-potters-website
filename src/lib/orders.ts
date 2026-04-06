import fs from 'fs';
import path from 'path';

const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  image: string;
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
  subtotal: number;
  total: number;
  stripePaymentIntentId: string;
  stripeCustomerId?: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
  createdAt: string;
}

function readOrders(): Order[] {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, '[]', 'utf-8');
      return [];
    }
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeOrders(orders: Order[]): void {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
}

export function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'status'>): Order {
  const orders = readOrders();
  const newOrder: Order = {
    ...order,
    id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  orders.push(newOrder);
  writeOrders(orders);
  return newOrder;
}

export function updateOrderStatus(paymentIntentId: string, status: Order['status']): Order | undefined {
  const orders = readOrders();
  const idx = orders.findIndex((o) => o.stripePaymentIntentId === paymentIntentId);
  if (idx === -1) return undefined;
  orders[idx].status = status;
  writeOrders(orders);
  return orders[idx];
}

export function getOrdersByEmail(email: string): Order[] {
  return readOrders().filter((o) => o.email.toLowerCase() === email.toLowerCase());
}

export function getOrdersByMemberId(memberId: string): Order[] {
  return readOrders().filter((o) => o.memberId === memberId);
}

// Shared server-side loader used by /admin/pnl (HTML), /admin/pnl/print,
// /admin/pnl/pdf, and /admin/pnl/csv. Keeps the Supabase query + P&L
// aggregation identical across all four surfaces so the HTML, print, PDF,
// and CSV views can never drift.
//
// SERVER ONLY — imports the service-role client. Do not import from a
// client component. Middleware + requireAdmin guard the admin routes that
// call this.

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  aggregatePnl,
  type PnlAggregate,
  type PnlOrder,
  type ProductCostTemplate,
  type OrderCostOverride,
  type OverheadExpense,
} from '@/lib/pnl';
import { getAllProducts } from '@/lib/products';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type OrderWithEmail = PnlOrder & {
  email: string;
  shipping_city: string | null;
};

export type PnlRangeData = {
  from: string;
  to: string;
  aggregate: PnlAggregate;
  orders: OrderWithEmail[];
  uncoveredSkus: string[];
};

export function validateRange(from: string, to: string): void {
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) {
    throw new Error('start/end must be ISO dates (YYYY-MM-DD)');
  }
  if (from > to) {
    throw new Error('start must be <= end');
  }
}

/**
 * Range presets in YYYY-MM-DD (UTC). Returned from a single clock read so the
 * UI and server never disagree within a render.
 */
export function rangePresets(now = new Date()) {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  const mtdStart = new Date(Date.UTC(y, m, 1));
  const mtdEnd   = new Date(Date.UTC(y, m, d));

  const lastMonthStart = new Date(Date.UTC(y, m - 1, 1));
  const lastMonthEnd   = new Date(Date.UTC(y, m, 0)); // last day of previous month

  const currentQuarter = Math.floor(m / 3);
  const quarterStartMonth = currentQuarter * 3;
  const lastQuarterStart = new Date(Date.UTC(y, quarterStartMonth - 3, 1));
  const lastQuarterEnd   = new Date(Date.UTC(y, quarterStartMonth, 0));

  const ytdStart = new Date(Date.UTC(y, 0, 1));
  const ytdEnd   = new Date(Date.UTC(y, m, d));

  const lastYearStart = new Date(Date.UTC(y - 1, 0, 1));
  const lastYearEnd   = new Date(Date.UTC(y - 1, 11, 31));

  return {
    mtd:        { label: 'Month to Date',  from: iso(mtdStart),        to: iso(mtdEnd) },
    lastMonth:  { label: 'Last Month',     from: iso(lastMonthStart),  to: iso(lastMonthEnd) },
    lastQuarter:{ label: 'Last Quarter',   from: iso(lastQuarterStart),to: iso(lastQuarterEnd) },
    ytd:        { label: 'Year to Date',   from: iso(ytdStart),        to: iso(ytdEnd) },
    lastYear:   { label: 'Last Year',      from: iso(lastYearStart),   to: iso(lastYearEnd) },
  };
}

/**
 * Load orders + cost templates + per-order overrides + overhead expenses for
 * [from, to] (inclusive, YYYY-MM-DD) and compute the full P&L aggregate.
 */
export async function loadPnlRangeData(from: string, to: string): Promise<PnlRangeData> {
  validateRange(from, to);

  const supabase = createSupabaseAdminClient();

  const fromIso = `${from}T00:00:00.000Z`;
  const toIso = new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();

  const [ordersRes, templatesRes, overridesRes, overheadRes] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'id, created_at, status, email, subtotal_cents, sales_tax_cents, total_cents, internal_shipping_cost_cents, stripe_fee_cents, buyer_state, payment_method, shipping, order_items(product_id, quantity, unit_price_cents)',
      )
      .gte('created_at', fromIso)
      .lte('created_at', toIso)
      .order('created_at', { ascending: false }),
    supabase
      .from('product_costs')
      .select('product_id, materials_cents, labor_cents, packaging_cents, freight_cents, other_cents'),
    supabase
      .from('order_cost_overrides')
      .select('order_id, materials_cents, labor_cents, packaging_cents, freight_cents, other_cents'),
    supabase
      .from('overhead_expenses')
      .select('amount_cents, incurred_on, category')
      .gte('incurred_on', from)
      .lte('incurred_on', to),
  ]);

  type RawOrder = {
    id: string;
    created_at: string;
    status: PnlOrder['status'];
    email: string;
    subtotal_cents: number | null;
    sales_tax_cents: number | null;
    total_cents: number | null;
    internal_shipping_cost_cents: number | null;
    stripe_fee_cents: number | null;
    buyer_state: string | null;
    payment_method: PnlOrder['payment_method'] | null;
    shipping: { city?: string } | null;
    order_items?: Array<{ product_id: string; quantity: number; unit_price_cents: number | null }>;
  };

  const raw = (ordersRes.data ?? []) as RawOrder[];
  const orders: OrderWithEmail[] = raw.map((o) => ({
    id: o.id,
    created_at: o.created_at,
    status: o.status,
    email: o.email ?? '',
    shipping_city: o.shipping?.city ?? null,
    subtotal_cents: o.subtotal_cents ?? 0,
    sales_tax_cents: o.sales_tax_cents ?? 0,
    total_cents: o.total_cents ?? 0,
    internal_shipping_cost_cents: o.internal_shipping_cost_cents ?? 0,
    stripe_fee_cents: o.stripe_fee_cents,
    buyer_state: o.buyer_state ?? '',
    payment_method: (o.payment_method ?? 'stripe') as PnlOrder['payment_method'],
    items: (o.order_items ?? []).map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price_cents: i.unit_price_cents ?? 0,
    })),
  }));

  const templates = (templatesRes.data ?? []) as ProductCostTemplate[];
  const overrides = (overridesRes.data ?? []) as OrderCostOverride[];
  const overhead  = (overheadRes.data ?? []) as OverheadExpense[];

  const aggregate = aggregatePnl(orders, templates, overrides, overhead, from, to);

  const productIds = getAllProducts().map((p) => p.id);
  const covered = new Set(templates.map((t) => t.product_id));
  const uncoveredSkus = productIds.filter((id) => !covered.has(id));

  return { from, to, aggregate, orders, uncoveredSkus };
}

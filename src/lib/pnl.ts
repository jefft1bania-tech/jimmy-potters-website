// P&L calculation engine — pure functions, unit-testable.
// All monetary values in integer cents.

export type PnlOrderItem = { product_id: string; quantity: number; unit_price_cents: number };

export type PnlOrder = {
  id: string;
  created_at: string; // ISO
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'refunded' | 'cancelled';
  subtotal_cents: number;
  sales_tax_cents: number;
  total_cents: number;
  internal_shipping_cost_cents: number;
  stripe_fee_cents: number | null;
  buyer_state: string;
  payment_method: 'stripe' | 'venmo' | 'paypal';
  items: PnlOrderItem[];
};

export type ProductCostTemplate = {
  product_id: string;
  materials_cents: number;
  labor_cents: number;
  packaging_cents: number;
  freight_cents: number;
  other_cents: number;
};

export type OrderCostOverride = {
  order_id: string;
  materials_cents: number | null;
  labor_cents: number | null;
  packaging_cents: number | null;
  freight_cents: number | null;
  other_cents: number | null;
};

export type OverheadExpense = {
  amount_cents: number;
  incurred_on: string; // ISO date
  category: string;
};

export type PnlPerOrder = {
  order_id: string;
  revenue: number;
  sales_tax_passthrough: number;
  stripe_fee: number;
  cogs_materials: number;
  cogs_labor: number;
  cogs_packaging: number;
  cogs_freight: number;
  cogs_other: number;
  cogs_total: number;
  gross_profit: number;
  uses_estimate: boolean; // true if any COGS field came from a template (no override)
};

export type PnlAggregate = {
  from: string;
  to: string;
  order_count: number;
  gross_revenue: number;
  sales_tax_collected: number;
  total_cogs: number;
  total_stripe_fees: number;
  gross_profit: number;
  operating_expenses: number;
  net_profit: number;
  sales_tax_by_state: Array<{ state: string; order_count: number; tax_cents: number }>;
  per_order: PnlPerOrder[];
  has_estimates: boolean;
};

const REVENUE_STATUSES = new Set(['paid', 'shipped', 'delivered']);

function sumOrderCogsFromTemplates(
  items: PnlOrderItem[],
  templates: Map<string, ProductCostTemplate>,
) {
  const totals = { materials: 0, labor: 0, packaging: 0, freight: 0, other: 0 };
  for (const item of items) {
    const t = templates.get(item.product_id);
    if (!t) continue;
    totals.materials  += t.materials_cents  * item.quantity;
    totals.labor      += t.labor_cents      * item.quantity;
    totals.packaging  += t.packaging_cents  * item.quantity;
    totals.freight    += t.freight_cents    * item.quantity;
    totals.other      += t.other_cents      * item.quantity;
  }
  return totals;
}

export function computeOrderPnl(
  order: PnlOrder,
  templates: Map<string, ProductCostTemplate>,
  override: OrderCostOverride | null,
): PnlPerOrder {
  const fromTemplate = sumOrderCogsFromTemplates(order.items, templates);

  const overrideOrTemplate = (o: number | null | undefined, t: number) =>
    (o ?? null) === null ? { value: t, fromOverride: false } : { value: o as number, fromOverride: true };

  const m = overrideOrTemplate(override?.materials_cents, fromTemplate.materials);
  const l = overrideOrTemplate(override?.labor_cents,     fromTemplate.labor);
  const p = overrideOrTemplate(override?.packaging_cents, fromTemplate.packaging);
  const fTemplate = fromTemplate.freight + order.internal_shipping_cost_cents;
  const f = overrideOrTemplate(override?.freight_cents,   fTemplate);
  const o = overrideOrTemplate(override?.other_cents,     fromTemplate.other);

  const cogs_total = m.value + l.value + p.value + f.value + o.value;
  const stripe_fee = order.stripe_fee_cents ?? 0;
  const gross_profit = (order.total_cents - order.sales_tax_cents) - cogs_total - stripe_fee;

  const allOverridden = m.fromOverride && l.fromOverride && p.fromOverride && f.fromOverride && o.fromOverride;

  return {
    order_id: order.id,
    revenue: order.total_cents,
    sales_tax_passthrough: order.sales_tax_cents,
    stripe_fee,
    cogs_materials: m.value,
    cogs_labor:     l.value,
    cogs_packaging: p.value,
    cogs_freight:   f.value,
    cogs_other:     o.value,
    cogs_total,
    gross_profit,
    uses_estimate: !allOverridden,
  };
}

export function aggregatePnl(
  orders: PnlOrder[],
  templates: ProductCostTemplate[],
  overrides: OrderCostOverride[],
  overhead: OverheadExpense[],
  from: string,
  to: string,
): PnlAggregate {
  const templateMap = new Map(templates.map((t) => [t.product_id, t]));
  const overrideMap = new Map(overrides.map((o) => [o.order_id, o]));

  const fromTs = new Date(from).getTime();
  const toTs = new Date(to).getTime() + 24 * 60 * 60 * 1000 - 1; // inclusive end-of-day

  const inRange = orders.filter((o) => {
    const ts = new Date(o.created_at).getTime();
    return ts >= fromTs && ts <= toTs && REVENUE_STATUSES.has(o.status);
  });

  const per_order = inRange.map((o) => computeOrderPnl(o, templateMap, overrideMap.get(o.id) ?? null));

  const gross_revenue = per_order.reduce((s, p) => s + (p.revenue - p.sales_tax_passthrough), 0);
  const sales_tax_collected = per_order.reduce((s, p) => s + p.sales_tax_passthrough, 0);
  const total_cogs = per_order.reduce((s, p) => s + p.cogs_total, 0);
  const total_stripe_fees = per_order.reduce((s, p) => s + p.stripe_fee, 0);
  const gross_profit = gross_revenue - total_cogs - total_stripe_fees;

  const operating_expenses = overhead.reduce((s, e) => {
    const ts = new Date(e.incurred_on).getTime();
    return ts >= fromTs && ts <= toTs ? s + e.amount_cents : s;
  }, 0);

  const net_profit = gross_profit - operating_expenses;

  // Sales tax by state (directly from orders, not per_order, to keep the source column authoritative)
  const byState = new Map<string, { order_count: number; tax_cents: number }>();
  for (const o of inRange) {
    const prev = byState.get(o.buyer_state) ?? { order_count: 0, tax_cents: 0 };
    byState.set(o.buyer_state, {
      order_count: prev.order_count + 1,
      tax_cents: prev.tax_cents + o.sales_tax_cents,
    });
  }
  const sales_tax_by_state = Array.from(byState.entries())
    .map(([state, v]) => ({ state, ...v }))
    .sort((a, b) => b.tax_cents - a.tax_cents);

  return {
    from,
    to,
    order_count: inRange.length,
    gross_revenue,
    sales_tax_collected,
    total_cogs,
    total_stripe_fees,
    gross_profit,
    operating_expenses,
    net_profit,
    sales_tax_by_state,
    per_order,
    has_estimates: per_order.some((p) => p.uses_estimate),
  };
}

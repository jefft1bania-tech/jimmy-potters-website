// Per-SKU margin engine (retail vs bulk). Pure functions.
// All monetary values in integer cents.

export type MarginOrder = {
  id: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'refunded' | 'cancelled';
  is_bulk: boolean;
  items: Array<{ product_id: string; quantity: number; unit_price_cents: number }>;
  // Per-order total COGS (already computed by computeOrderPnl — passed in as pre-aggregated).
  order_cogs_total_cents: number;
  // Bulk-only: overrides the per-pot COGS with a batch-production cost when is_bulk=true.
  bulk_volume_unit_cost_cents?: number | null;
};

export type SkuMarginRow = {
  product_id: string;
  product_name: string;

  retail_units: number;
  retail_revenue: number;          // Σ unit_price_cents * quantity, before tax
  retail_cogs: number;             // Σ per-unit COGS × quantity
  retail_avg_unit_price: number;   // weighted
  retail_avg_unit_cogs: number;
  retail_unit_margin: number;
  retail_margin_pct: number;       // 0-1, null if no retail sales

  bulk_units: number;
  bulk_revenue: number;
  bulk_cogs: number;
  bulk_avg_unit_price: number;
  bulk_avg_unit_cogs: number;
  bulk_unit_margin: number;
  bulk_margin_pct: number;

  total_units: number;
  total_margin_contribution: number;
};

const REVENUE_STATUSES = new Set(['paid', 'shipped', 'delivered']);

export function computeSkuMargins(
  orders: MarginOrder[],
  productNames: Map<string, string>,
): SkuMarginRow[] {
  type Bucket = { units: number; revenue: number; cogs: number };
  const retail = new Map<string, Bucket>();
  const bulk = new Map<string, Bucket>();

  for (const order of orders) {
    if (!REVENUE_STATUSES.has(order.status)) continue;

    // Distribute the order's total COGS across items proportionally to line-revenue.
    // For bulk orders with a volume unit cost, use that directly × quantity instead.
    const orderRevenue = order.items.reduce((s, i) => s + i.unit_price_cents * i.quantity, 0) || 1;

    for (const item of order.items) {
      const bucket = order.is_bulk ? bulk : retail;
      const prev = bucket.get(item.product_id) ?? { units: 0, revenue: 0, cogs: 0 };

      const lineRevenue = item.unit_price_cents * item.quantity;
      const lineCogs = order.is_bulk && order.bulk_volume_unit_cost_cents != null
        ? order.bulk_volume_unit_cost_cents * item.quantity
        : Math.round(order.order_cogs_total_cents * (lineRevenue / orderRevenue));

      bucket.set(item.product_id, {
        units: prev.units + item.quantity,
        revenue: prev.revenue + lineRevenue,
        cogs: prev.cogs + lineCogs,
      });
    }
  }

  const allProducts = new Set<string>([...retail.keys(), ...bulk.keys()]);

  const rows: SkuMarginRow[] = [];
  for (const product_id of allProducts) {
    const r = retail.get(product_id) ?? { units: 0, revenue: 0, cogs: 0 };
    const b = bulk.get(product_id) ?? { units: 0, revenue: 0, cogs: 0 };

    const retail_avg_unit_price = r.units ? Math.round(r.revenue / r.units) : 0;
    const retail_avg_unit_cogs = r.units ? Math.round(r.cogs / r.units) : 0;
    const retail_unit_margin = retail_avg_unit_price - retail_avg_unit_cogs;
    const retail_margin_pct = retail_avg_unit_price ? retail_unit_margin / retail_avg_unit_price : 0;

    const bulk_avg_unit_price = b.units ? Math.round(b.revenue / b.units) : 0;
    const bulk_avg_unit_cogs = b.units ? Math.round(b.cogs / b.units) : 0;
    const bulk_unit_margin = bulk_avg_unit_price - bulk_avg_unit_cogs;
    const bulk_margin_pct = bulk_avg_unit_price ? bulk_unit_margin / bulk_avg_unit_price : 0;

    const total_units = r.units + b.units;
    const total_margin_contribution = (r.revenue + b.revenue) - (r.cogs + b.cogs);

    rows.push({
      product_id,
      product_name: productNames.get(product_id) ?? product_id,

      retail_units: r.units,
      retail_revenue: r.revenue,
      retail_cogs: r.cogs,
      retail_avg_unit_price,
      retail_avg_unit_cogs,
      retail_unit_margin,
      retail_margin_pct,

      bulk_units: b.units,
      bulk_revenue: b.revenue,
      bulk_cogs: b.cogs,
      bulk_avg_unit_price,
      bulk_avg_unit_cogs,
      bulk_unit_margin,
      bulk_margin_pct,

      total_units,
      total_margin_contribution,
    });
  }

  return rows.sort((a, b) => b.total_margin_contribution - a.total_margin_contribution);
}

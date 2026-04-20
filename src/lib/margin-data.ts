// Shared server-side loader used by /admin/margins. Queries Supabase for
// orders + items + cost templates + order overrides + bulk pricing in a
// date range, then reduces to the SkuMarginRow list consumed by the
// retail-vs-bulk board.
//
// SERVER ONLY — imports the service-role client. Do not import from a
// client component. Middleware + requireAdmin guard the admin routes that
// call this.

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  computeOrderPnl,
  type PnlOrder,
  type ProductCostTemplate,
  type OrderCostOverride,
} from '@/lib/pnl';
import {
  computeSkuMargins,
  type MarginOrder,
  type SkuMarginRow,
} from '@/lib/margin';
import { getAllProducts } from '@/lib/products';
import { validateRange } from '@/lib/pnl-data';

export type MarginRangeData = {
  from: string;
  to: string;
  rows: SkuMarginRow[];
  totals: {
    retail_units: number;
    retail_revenue: number;
    retail_margin: number;
    bulk_units: number;
    bulk_revenue: number;
    bulk_margin: number;
    total_margin_contribution: number;
  };
  uncoveredSkus: string[];
  bulkOrdersMissingVolumeCost: number;
};

export async function loadMarginRangeData(from: string, to: string): Promise<MarginRangeData> {
  validateRange(from, to);

  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };

  const fromIso = `${from}T00:00:00.000Z`;
  const toIso = new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();

  const [ordersRes, templatesRes, overridesRes, bulkRes] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'id, created_at, status, email, is_bulk, subtotal_cents, sales_tax_cents, total_cents, internal_shipping_cost_cents, stripe_fee_cents, buyer_state, payment_method, order_items(product_id, quantity, unit_price_cents)',
      )
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    supabase
      .from('product_costs')
      .select('product_id, materials_cents, labor_cents, packaging_cents, freight_cents, other_cents'),
    supabase
      .from('order_cost_overrides')
      .select('order_id, materials_cents, labor_cents, packaging_cents, freight_cents, other_cents'),
    supabase
      .from('bulk_order_pricing')
      .select('order_id, volume_unit_cost_cents'),
  ]);

  type RawOrder = {
    id: string;
    created_at: string;
    status: PnlOrder['status'];
    email: string | null;
    is_bulk: boolean | null;
    subtotal_cents: number | null;
    sales_tax_cents: number | null;
    total_cents: number | null;
    internal_shipping_cost_cents: number | null;
    stripe_fee_cents: number | null;
    buyer_state: string | null;
    payment_method: PnlOrder['payment_method'] | null;
    order_items?: Array<{ product_id: string; quantity: number; unit_price_cents: number | null }>;
  };

  const raw = (ordersRes.data ?? []) as RawOrder[];
  const templates = (templatesRes.data ?? []) as ProductCostTemplate[];
  const overrides = (overridesRes.data ?? []) as OrderCostOverride[];
  const bulkRows =
    (bulkRes.data ?? []) as Array<{ order_id: string; volume_unit_cost_cents: number | null }>;

  const templateMap = new Map(templates.map((t) => [t.product_id, t]));
  const overrideMap = new Map(overrides.map((o) => [o.order_id, o]));
  const bulkVolumeMap = new Map<string, number | null>(
    bulkRows.map((b) => [b.order_id, b.volume_unit_cost_cents]),
  );

  let bulkOrdersMissingVolumeCost = 0;
  const marginOrders: MarginOrder[] = raw.map((o) => {
    const pnlOrder: PnlOrder = {
      id: o.id,
      created_at: o.created_at,
      status: o.status,
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
    };
    const per = computeOrderPnl(pnlOrder, templateMap, overrideMap.get(o.id) ?? null);
    const is_bulk = o.is_bulk === true;
    const bulkUnitCost = is_bulk ? bulkVolumeMap.get(o.id) ?? null : null;
    if (is_bulk && bulkUnitCost == null) bulkOrdersMissingVolumeCost++;
    return {
      id: o.id,
      status: pnlOrder.status as MarginOrder['status'],
      is_bulk,
      items: pnlOrder.items,
      order_cogs_total_cents: per.cogs_total,
      bulk_volume_unit_cost_cents: bulkUnitCost ?? null,
    };
  });

  const productNames = new Map(getAllProducts().map((p) => [p.id, p.name]));
  const rows = computeSkuMargins(marginOrders, productNames);

  const totals = rows.reduce(
    (acc, r) => {
      acc.retail_units += r.retail_units;
      acc.retail_revenue += r.retail_revenue;
      acc.retail_margin += r.retail_revenue - r.retail_cogs;
      acc.bulk_units += r.bulk_units;
      acc.bulk_revenue += r.bulk_revenue;
      acc.bulk_margin += r.bulk_revenue - r.bulk_cogs;
      acc.total_margin_contribution += r.total_margin_contribution;
      return acc;
    },
    {
      retail_units: 0,
      retail_revenue: 0,
      retail_margin: 0,
      bulk_units: 0,
      bulk_revenue: 0,
      bulk_margin: 0,
      total_margin_contribution: 0,
    },
  );

  const productIds = getAllProducts().map((p) => p.id);
  const covered = new Set(templates.map((t) => t.product_id));
  const uncoveredSkus = productIds.filter((id) => !covered.has(id));

  return { from, to, rows, totals, uncoveredSkus, bulkOrdersMissingVolumeCost };
}

// Server-only loader for the /admin/pnl/statement route.
// One Supabase round-trip per year (current + optionally prior for YoY),
// then all 12 monthly aggregations run in-memory via the pnl.ts engine.

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  type PnlOrder,
  type ProductCostTemplate,
  type OrderCostOverride,
  type OverheadExpense,
} from '@/lib/pnl';
import { buildPnlStatement, type PnlStatement } from '@/lib/pnl-statement';

type RawOrder = {
  id: string;
  created_at: string;
  status: PnlOrder['status'];
  subtotal_cents: number | null;
  sales_tax_cents: number | null;
  total_cents: number | null;
  internal_shipping_cost_cents: number | null;
  stripe_fee_cents: number | null;
  buyer_state: string | null;
  payment_method: PnlOrder['payment_method'] | null;
  order_items?: Array<{ product_id: string; quantity: number; unit_price_cents: number | null }>;
};

async function loadYearInputs(year: number) {
  const supabase = createSupabaseAdminClient();
  const fromIso = `${year}-01-01T00:00:00.000Z`;
  const toIso = `${year}-12-31T23:59:59.999Z`;

  const [ordersRes, templatesRes, overridesRes, overheadRes] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'id, created_at, status, subtotal_cents, sales_tax_cents, total_cents, internal_shipping_cost_cents, stripe_fee_cents, buyer_state, payment_method, order_items(product_id, quantity, unit_price_cents)',
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
      .from('overhead_expenses')
      .select('amount_cents, incurred_on, category')
      .gte('incurred_on', `${year}-01-01`)
      .lte('incurred_on', `${year}-12-31`),
  ]);

  const raw = (ordersRes.data ?? []) as RawOrder[];
  const orders: PnlOrder[] = raw.map((o) => ({
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
  }));

  return {
    orders,
    templates: (templatesRes.data ?? []) as ProductCostTemplate[],
    overrides: (overridesRes.data ?? []) as OrderCostOverride[],
    overhead: (overheadRes.data ?? []) as OverheadExpense[],
  };
}

export async function loadPnlStatement(year: number, includePriorYear = true): Promise<PnlStatement> {
  const [current, prior] = await Promise.all([
    loadYearInputs(year),
    includePriorYear ? loadYearInputs(year - 1) : Promise.resolve(null),
  ]);

  return buildPnlStatement(
    year,
    current.orders,
    current.templates,
    current.overrides,
    current.overhead,
    prior ?? undefined,
  );
}

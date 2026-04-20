// Builds the compact business-state snapshot that accompanies every
// /admin/insights question. Keep this small — Claude reads it on every
// query. Target: under 10k tokens.
//
// SERVER ONLY.

import { createHash } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { loadPnlRangeData, rangePresets } from '@/lib/pnl-data';
import { loadMarginRangeData } from '@/lib/margin-data';
import { getAllProducts } from '@/lib/products';

export type InsightsSnapshot = {
  generated_at: string;
  pottery_shop_profile: {
    inventory_count: number;
    price_low_cents: number;
    price_high_cents: number;
  };
  pnl: {
    mtd: { revenue: number; cogs: number; stripe_fees: number; operating_expenses: number; net_profit: number; order_count: number };
    ytd: { revenue: number; cogs: number; stripe_fees: number; operating_expenses: number; net_profit: number; order_count: number };
  };
  top_margin_skus_ytd: Array<{ product_id: string; name: string; units: number; contribution_cents: number; blended_margin_pct: number }>;
  bottom_margin_skus_ytd: Array<{ product_id: string; name: string; units: number; contribution_cents: number; blended_margin_pct: number }>;
  uncovered_cost_templates: string[];
  shipments: {
    overdue: number;
    in_next_7d: number;
    in_next_30d: number;
    critical_or_urgent_active: number;
  };
  bulk_orders_pending_attention: number;
  documents: {
    pending_count: number;
    parsed_unconfirmed_count: number;
    recent_confirmed_total_30d_cents: number;
  };
  recent_overhead_30d_cents: number;
};

export type SnapshotBundle = {
  snapshot: InsightsSnapshot;
  snapshot_hash: string;
};

export async function buildInsightsSnapshot(today: Date = new Date()): Promise<SnapshotBundle> {
  const presets = rangePresets(today);
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };

  const [mtdPnl, ytdPnl, ytdMargins, shipmentsRes, bulkRes, docsPendingRes, docsParsedRes, docs30dRes, overhead30dRes] =
    await Promise.all([
      loadPnlRangeData(presets.mtd.from, presets.mtd.to),
      loadPnlRangeData(presets.ytd.from, presets.ytd.to),
      loadMarginRangeData(presets.ytd.from, presets.ytd.to),
      supabase
        .from('shipments')
        .select('order_id, required_ship_by, shipment_status, flag')
        .neq('shipment_status', 'delivered'),
      supabase
        .from('shipments')
        .select('order_id, flag')
        .in('flag', ['critical', 'urgent'])
        .neq('shipment_status', 'delivered'),
      supabase.from('financial_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase
        .from('financial_documents')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'parsed'),
      supabase
        .from('financial_documents')
        .select('extracted_amount_cents, reviewed_at')
        .eq('status', 'confirmed')
        .gte('reviewed_at', new Date(today.getTime() - 30 * 86_400_000).toISOString()),
      supabase
        .from('overhead_expenses')
        .select('amount_cents')
        .gte('incurred_on', new Date(today.getTime() - 30 * 86_400_000).toISOString().slice(0, 10)),
    ]);

  const products = getAllProducts();
  const priceLow = products.length ? Math.min(...products.map((p) => p.price)) : 0;
  const priceHigh = products.length ? Math.max(...products.map((p) => p.price)) : 0;

  const shipments = (shipmentsRes.data ?? []) as Array<{
    order_id: string;
    required_ship_by: string | null;
    shipment_status: string;
    flag: string;
  }>;
  const todayMs = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  let overdueCount = 0;
  let next7Count = 0;
  let next30Count = 0;
  for (const s of shipments) {
    if (!s.required_ship_by) continue;
    const diffDays = Math.round((Date.parse(`${s.required_ship_by}T00:00:00Z`) - todayMs) / 86_400_000);
    if (diffDays < 0) overdueCount++;
    else if (diffDays <= 7) next7Count++;
    else if (diffDays <= 30) next30Count++;
  }

  const critUrgCount = (bulkRes.data ?? []).length;

  const docs30d = (docs30dRes.data ?? []) as Array<{ extracted_amount_cents: number | null }>;
  const confirmedTotal30d = docs30d.reduce((s, d) => s + (d.extracted_amount_cents ?? 0), 0);

  const overhead30d = ((overhead30dRes.data ?? []) as Array<{ amount_cents: number }>).reduce(
    (s, r) => s + (r.amount_cents ?? 0),
    0,
  );

  const top = ytdMargins.rows
    .filter((r) => r.total_units > 0)
    .slice(0, 5)
    .map((r) => ({
      product_id: r.product_id,
      name: r.product_name,
      units: r.total_units,
      contribution_cents: r.total_margin_contribution,
      blended_margin_pct:
        r.retail_revenue + r.bulk_revenue > 0
          ? (r.retail_revenue + r.bulk_revenue - r.retail_cogs - r.bulk_cogs) /
            (r.retail_revenue + r.bulk_revenue)
          : 0,
    }));
  const bottom = ytdMargins.rows
    .filter((r) => r.total_units > 0)
    .slice(-5)
    .reverse()
    .map((r) => ({
      product_id: r.product_id,
      name: r.product_name,
      units: r.total_units,
      contribution_cents: r.total_margin_contribution,
      blended_margin_pct:
        r.retail_revenue + r.bulk_revenue > 0
          ? (r.retail_revenue + r.bulk_revenue - r.retail_cogs - r.bulk_cogs) /
            (r.retail_revenue + r.bulk_revenue)
          : 0,
    }));

  const snapshot: InsightsSnapshot = {
    generated_at: today.toISOString(),
    pottery_shop_profile: {
      inventory_count: products.length,
      price_low_cents: priceLow,
      price_high_cents: priceHigh,
    },
    pnl: {
      mtd: {
        revenue: mtdPnl.aggregate.gross_revenue,
        cogs: mtdPnl.aggregate.total_cogs,
        stripe_fees: mtdPnl.aggregate.total_stripe_fees,
        operating_expenses: mtdPnl.aggregate.operating_expenses,
        net_profit: mtdPnl.aggregate.net_profit,
        order_count: mtdPnl.aggregate.order_count,
      },
      ytd: {
        revenue: ytdPnl.aggregate.gross_revenue,
        cogs: ytdPnl.aggregate.total_cogs,
        stripe_fees: ytdPnl.aggregate.total_stripe_fees,
        operating_expenses: ytdPnl.aggregate.operating_expenses,
        net_profit: ytdPnl.aggregate.net_profit,
        order_count: ytdPnl.aggregate.order_count,
      },
    },
    top_margin_skus_ytd: top,
    bottom_margin_skus_ytd: bottom,
    uncovered_cost_templates: ytdPnl.uncoveredSkus,
    shipments: {
      overdue: overdueCount,
      in_next_7d: next7Count,
      in_next_30d: next30Count,
      critical_or_urgent_active: critUrgCount,
    },
    bulk_orders_pending_attention: critUrgCount,
    documents: {
      pending_count: (docsPendingRes.count as number | null) ?? 0,
      parsed_unconfirmed_count: (docsParsedRes.count as number | null) ?? 0,
      recent_confirmed_total_30d_cents: confirmedTotal30d,
    },
    recent_overhead_30d_cents: overhead30d,
  };

  const snapshot_hash = createHash('sha256')
    .update(JSON.stringify(snapshot))
    .digest('hex')
    .slice(0, 16);

  return { snapshot, snapshot_hash };
}

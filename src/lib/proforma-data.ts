// Server-side loader for the /admin/pnl/proforma page.
// Pulls SKU retail prices + cost templates + saved scenarios from Supabase.
// SERVER ONLY.

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAllProducts } from '@/lib/products';
import type { ProformaSkuInput } from '@/lib/proforma';

export type SkuRow = {
  product_id: string;
  name: string;
  retail_price_cents: number;
};

export type SavedProforma = {
  id: string;
  scenario_name: string;
  kiln_count: number;
  buyer_count: number;
  wholesale_price_multiplier: number;
  timeline_weeks: number;
  forecasted_revenue_cents: number;
  forecasted_cogs_cents: number;
  forecasted_net_cents: number;
  capacity_utilization_pct: number;
  kiln_capex_cents: number;
  payback_weeks: number | null;
  notes: string | null;
  created_at: string;
};

export type ProformaPageData = {
  skus: SkuRow[];
  skuInputs: ProformaSkuInput[];
  saved: SavedProforma[];
};

export async function loadProformaPageData(): Promise<ProformaPageData> {
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };

  // Live SKUs with a real retail price (filter out the $0 placeholders).
  const skus: SkuRow[] = getAllProducts()
    .filter((p) => p.price > 0)
    .map((p) => ({
      product_id: p.id,
      name: p.name,
      retail_price_cents: p.price,
    }));

  // Equal mix as default (1/N share each). Caller can override from the UI.
  const share = skus.length > 0 ? 1 / skus.length : 0;
  const skuInputs: ProformaSkuInput[] = skus.map((s) => ({
    product_id: s.product_id,
    retail_price_cents: s.retail_price_cents,
    mix_share: share,
  }));

  const { data: savedRaw } = await supabase
    .from('wholesale_proformas')
    .select(
      'id, scenario_name, kiln_count, buyer_count, wholesale_price_multiplier, timeline_weeks, forecasted_revenue_cents, forecasted_cogs_cents, forecasted_net_cents, capacity_utilization_pct, kiln_capex_cents, payback_weeks, notes, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(20);

  const saved: SavedProforma[] = (savedRaw ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    scenario_name: String(r.scenario_name),
    kiln_count: Number(r.kiln_count),
    buyer_count: Number(r.buyer_count),
    wholesale_price_multiplier:
      typeof r.wholesale_price_multiplier === 'string'
        ? parseFloat(r.wholesale_price_multiplier)
        : Number(r.wholesale_price_multiplier),
    timeline_weeks: Number(r.timeline_weeks),
    forecasted_revenue_cents: Number(r.forecasted_revenue_cents),
    forecasted_cogs_cents: Number(r.forecasted_cogs_cents),
    forecasted_net_cents: Number(r.forecasted_net_cents),
    capacity_utilization_pct:
      typeof r.capacity_utilization_pct === 'string'
        ? parseFloat(r.capacity_utilization_pct)
        : Number(r.capacity_utilization_pct),
    kiln_capex_cents: Number(r.kiln_capex_cents),
    payback_weeks:
      r.payback_weeks == null
        ? null
        : typeof r.payback_weeks === 'string'
          ? parseFloat(r.payback_weeks)
          : Number(r.payback_weeks),
    notes: r.notes == null ? null : String(r.notes),
    created_at: String(r.created_at),
  }));

  return { skus, skuInputs, saved };
}

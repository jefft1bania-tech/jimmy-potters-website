import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/server';
import { computeScenario, equalMix, type ProformaSkuInput } from '@/lib/proforma';
import { getAllProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SaveBody = {
  scenario_name?: string;
  kilns?: number;
  buyers?: number;
  priceMultiplier?: number;
  timelineWeeks?: number;
  notes?: string | null;
  skus?: ProformaSkuInput[];
};

function clampInt(val: unknown, min: number, max: number): number | null {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  if (i < min || i > max) return null;
  return i;
}

function clampMultiplier(val: unknown): number | null {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n)) return null;
  if (n < 0.3 || n > 1) return null;
  return Math.round(n * 100) / 100; // numeric(3,2)
}

export async function POST(req: Request) {
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: SaveBody;
  try {
    body = (await req.json()) as SaveBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const scenario_name =
    typeof body.scenario_name === 'string' && body.scenario_name.trim().length > 0
      ? body.scenario_name.trim().slice(0, 120)
      : `Scenario ${new Date().toISOString().slice(0, 10)}`;

  const kilns = clampInt(body.kilns, 1, 10);
  const buyers = clampInt(body.buyers, 1, 20);
  const priceMultiplier = clampMultiplier(body.priceMultiplier);
  const timelineWeeks = clampInt(body.timelineWeeks ?? 2, 1, 52);

  if (kilns == null || buyers == null || priceMultiplier == null || timelineWeeks == null) {
    return NextResponse.json(
      { error: 'kilns (1-10), buyers (1-20), priceMultiplier (0.30-1.00), timelineWeeks (1-52) required' },
      { status: 400 },
    );
  }

  const skus: ProformaSkuInput[] =
    Array.isArray(body.skus) && body.skus.length > 0
      ? body.skus
      : equalMix(
          getAllProducts()
            .filter((p) => p.price > 0)
            .map((p) => ({ product_id: p.id, retail_price_cents: p.price })),
        );

  const result = computeScenario({
    kilns,
    buyers,
    priceMultiplier,
    timelineWeeks,
    skus,
  });

  const insertRow = {
    scenario_name,
    kiln_count: kilns,
    buyer_count: buyers,
    wholesale_price_multiplier: priceMultiplier,
    timeline_weeks: timelineWeeks,
    forecasted_revenue_cents: result.revenue_cents,
    forecasted_cogs_cents: result.cogs_total_cents,
    forecasted_net_cents: result.net_cents,
    capacity_utilization_pct: result.capacity_utilization_pct,
    kiln_capex_cents: result.kiln_capex_cents,
    payback_weeks: result.payback_weeks,
    notes: typeof body.notes === 'string' ? body.notes.slice(0, 1000) : null,
    created_by: profile.id,
  };

  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { data, error } = await supabase
    .from('wholesale_proformas')
    .insert(insertRow)
    .select('id, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    id: data.id,
    created_at: data.created_at,
    result,
  });
}

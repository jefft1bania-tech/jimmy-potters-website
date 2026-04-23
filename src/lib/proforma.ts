// Wholesale proforma compute engine — pure functions, no I/O.
//
// Powers /admin/pnl/proforma what-if analysis for 25-pot wholesale lots
// across N concurrent buyers on a 2-week aggressive delivery window.
// Varies: kiln_count (capacity) x buyer_count (demand) x
// wholesale_price_multiplier (revenue).
//
// Reuses the same unit-economics constants as pnl-drilldown.ts so the
// proforma cost basis cannot drift from the real P&L engine.

import {
  LABOR_BLENDED_RATE_CENTS_PER_HOUR,
  LABOR_MINUTES_PER_POT,
  MATERIALS_COST_PER_POT_CENTS,
  SHIPSURANCE_PER_UNIT_CENTS,
  bomForPot,
  bomTotalCents,
  laborCostCents,
  fixedCostsMonthlyTotalCents,
} from './pnl-drilldown';

// ---------------------------------------------------------------------------
// Capacity model (proforma-specific)
// ---------------------------------------------------------------------------

export const POTS_PER_FIRING = 52;
export const FIRINGS_PER_WEEK = 2;
export const POTS_PER_KILN_PER_WEEK = POTS_PER_FIRING * FIRINGS_PER_WEEK; // 104

// Additional kiln CapEx (per unit beyond the first).
// Small 240V production kiln, user-confirmed 2026-04-23.
export const KILN_CAPEX_CENTS = 300_000; // $3,000

// Variable electricity per firing. The existing FIXED_COSTS_MONTHLY already
// carries a $250/mo base electricity line which covers studio lighting +
// idle draw. The PER-FIRING kiln draw below is incremental to that base,
// and scales with firings_per_week x kiln_count.
export const ELECTRICITY_PER_FIRING_CENTS = 1750; // $17.50 @ ~$0.18/kWh x 50 kWh

// Shipping absorbed by JP for wholesale: FedEx Ground + insurance per pot.
// Distinct from SHIPSURANCE_PER_UNIT_CENTS ($0.45 add-on coverage); this is
// the flat FedEx declared-value insurance on each package.
export const FEDEX_PER_POT_CENTS = 1299;         // $12.99
export const FEDEX_INSURANCE_PER_POT_CENTS = 250; // $2.50
export const SHIPPING_PER_POT_CENTS =
  FEDEX_PER_POT_CENTS + FEDEX_INSURANCE_PER_POT_CENTS; // $15.49

// Standard order definition
export const UNITS_PER_BUYER_ORDER = 25;
export const DEFAULT_TIMELINE_WEEKS = 2;

// Amortize kiln CapEx over a standard 26-week (6-month) payback horizon
// when reporting "effective CapEx burden per 2-week cycle". Used for the
// Scenario Matrix cell "net after CapEx" number; raw payback_weeks is
// reported separately.
export const CAPEX_AMORTIZATION_WEEKS = 26;

// ---------------------------------------------------------------------------
// Input / output types
// ---------------------------------------------------------------------------

export type ProformaSkuInput = {
  product_id: string;
  retail_price_cents: number;
  mix_share: number; // 0..1; across all SKUs in input should sum to ~1.0
};

export type ProformaInput = {
  kilns: number;             // 1..10
  buyers: number;            // 1..20
  priceMultiplier: number;   // 0.30..1.00 (e.g. 0.55 = 55% of retail)
  skus: ProformaSkuInput[];
  timelineWeeks?: number;    // default DEFAULT_TIMELINE_WEEKS
  unitsPerBuyer?: number;    // default UNITS_PER_BUYER_ORDER
};

export type ProformaCostBreakdown = {
  materials_cents: number;
  labor_cents: number;
  packaging_cents: number;
  electricity_cents: number;
  shipping_cents: number;
  stripe_cents: number;
};

export type ProformaResult = {
  // Volume
  units_total: number;
  firings_needed: number;
  firings_available: number;
  // Revenue
  revenue_cents: number;
  blended_unit_price_cents: number;
  // COGS
  cogs: ProformaCostBreakdown;
  cogs_total_cents: number;
  // Bottom line
  gross_profit_cents: number;     // revenue - cogs_total
  gross_margin_pct: number;       // 0..1
  // CapEx + overhead burden
  kiln_capex_cents: number;             // (kilns - 1) * KILN_CAPEX_CENTS
  overhead_allocation_cents: number;    // fixed overhead scaled to timelineWeeks
  capex_amortization_cents: number;     // kiln_capex / CAPEX_AMORTIZATION_WEEKS * timelineWeeks
  net_cents: number;                    // gross_profit - overhead - capex_amortization
  net_margin_pct: number;               // net / revenue
  // Capacity
  capacity_utilization_pct: number;     // units / (kilns * POTS_PER_KILN_PER_WEEK * weeks) * 100
  capacity_exceeded: boolean;
  // Payback (null if kilns === 1 or weekly_net <= 0)
  payback_weeks: number | null;
};

// ---------------------------------------------------------------------------
// Compute
// ---------------------------------------------------------------------------

const PACKAGING_PER_POT_CENTS = bomTotalCents(bomForPot()); // $2.14 from BOM

function blendedUnitPriceCents(skus: ProformaSkuInput[], multiplier: number): number {
  if (skus.length === 0) return 0;
  const shareSum = skus.reduce((s, k) => s + k.mix_share, 0);
  const normalizedFactor = shareSum > 0 ? 1 / shareSum : 0;
  const blendedRetail = skus.reduce(
    (s, k) => s + k.retail_price_cents * (k.mix_share * normalizedFactor),
    0,
  );
  return Math.round(blendedRetail * multiplier);
}

export function computeScenario(input: ProformaInput): ProformaResult {
  const kilns = Math.max(1, Math.floor(input.kilns));
  const buyers = Math.max(0, Math.floor(input.buyers));
  const multiplier = Math.max(0, Math.min(1, input.priceMultiplier));
  const weeks = Math.max(1, Math.floor(input.timelineWeeks ?? DEFAULT_TIMELINE_WEEKS));
  const unitsPerBuyer = Math.max(0, Math.floor(input.unitsPerBuyer ?? UNITS_PER_BUYER_ORDER));

  const units_total = buyers * unitsPerBuyer;
  const blended_unit_price_cents = blendedUnitPriceCents(input.skus, multiplier);
  const revenue_cents = units_total * blended_unit_price_cents;

  // Variable COGS (per-pot costs x units)
  const materials_cents = units_total * MATERIALS_COST_PER_POT_CENTS;
  const labor_cents = units_total * laborCostCents(LABOR_MINUTES_PER_POT);
  const packaging_cents = units_total * PACKAGING_PER_POT_CENTS;
  const shipping_cents =
    units_total * (SHIPPING_PER_POT_CENTS + SHIPSURANCE_PER_UNIT_CENTS);

  // Electricity scales with firings actually needed, not per-pot.
  // Each firing fires POTS_PER_FIRING pots, so firings_needed =
  // ceil(units_total / POTS_PER_FIRING).
  const firings_needed =
    units_total === 0 ? 0 : Math.ceil(units_total / POTS_PER_FIRING);
  const electricity_cents = firings_needed * ELECTRICITY_PER_FIRING_CENTS;

  // Stripe fee: 2.9% + $0.30 per BUYER (each buyer = 1 order).
  const stripe_cents =
    buyers === 0 ? 0 : Math.round(revenue_cents * 0.029) + 30 * buyers;

  const cogs: ProformaCostBreakdown = {
    materials_cents,
    labor_cents,
    packaging_cents,
    electricity_cents,
    shipping_cents,
    stripe_cents,
  };
  const cogs_total_cents =
    materials_cents + labor_cents + packaging_cents +
    electricity_cents + shipping_cents + stripe_cents;

  const gross_profit_cents = revenue_cents - cogs_total_cents;
  const gross_margin_pct = revenue_cents > 0 ? gross_profit_cents / revenue_cents : 0;

  // Overhead allocation: monthly fixed costs pro-rated to timelineWeeks.
  const monthlyOverhead = fixedCostsMonthlyTotalCents();
  const overhead_allocation_cents = Math.round((monthlyOverhead / 4) * weeks);

  // CapEx: every kiln beyond the first is $3K. Amortized straight-line
  // over CAPEX_AMORTIZATION_WEEKS (~6 months) for "burden per cycle".
  const kiln_capex_cents = Math.max(0, (kilns - 1) * KILN_CAPEX_CENTS);
  const capex_amortization_cents = Math.round(
    (kiln_capex_cents / CAPEX_AMORTIZATION_WEEKS) * weeks,
  );

  const net_cents =
    gross_profit_cents - overhead_allocation_cents - capex_amortization_cents;
  const net_margin_pct = revenue_cents > 0 ? net_cents / revenue_cents : 0;

  // Capacity
  const firings_available = kilns * FIRINGS_PER_WEEK * weeks;
  const capacity_ceiling = firings_available * POTS_PER_FIRING;
  const capacity_utilization_pct =
    capacity_ceiling > 0 ? (units_total / capacity_ceiling) * 100 : 0;
  const capacity_exceeded = units_total > capacity_ceiling;

  // Payback: kilns beyond first pay for themselves at weekly_net rate.
  // weekly_net = net_cents (this cycle) / weeks. Add back the capex
  // amortization we subtracted so payback is measured against true weekly
  // profit, not amortized profit.
  let payback_weeks: number | null = null;
  if (kiln_capex_cents > 0) {
    const weekly_net_pre_capex = (gross_profit_cents - overhead_allocation_cents) / weeks;
    if (weekly_net_pre_capex > 0) {
      payback_weeks = +(kiln_capex_cents / weekly_net_pre_capex).toFixed(2);
    }
  }

  return {
    units_total,
    firings_needed,
    firings_available,
    revenue_cents,
    blended_unit_price_cents,
    cogs,
    cogs_total_cents,
    gross_profit_cents,
    gross_margin_pct,
    kiln_capex_cents,
    overhead_allocation_cents,
    capex_amortization_cents,
    net_cents,
    net_margin_pct,
    capacity_utilization_pct: +capacity_utilization_pct.toFixed(2),
    capacity_exceeded,
    payback_weeks,
  };
}

// ---------------------------------------------------------------------------
// Matrix helper: kilns (rows) x buyers (cols) grid
// ---------------------------------------------------------------------------

export type MatrixCell = ProformaResult & {
  kilns: number;
  buyers: number;
};

export function computeMatrix(
  kilnOptions: number[],
  buyerOptions: number[],
  priceMultiplier: number,
  skus: ProformaSkuInput[],
  timelineWeeks: number = DEFAULT_TIMELINE_WEEKS,
): MatrixCell[][] {
  return kilnOptions.map((kilns) =>
    buyerOptions.map((buyers) => {
      const r = computeScenario({
        kilns,
        buyers,
        priceMultiplier,
        skus,
        timelineWeeks,
      });
      return { ...r, kilns, buyers };
    }),
  );
}

// ---------------------------------------------------------------------------
// Default SKU mix: equal share across N products (used when callers don't
// supply explicit mix weights). Keep exported so the xlsx generator and
// the Supabase_Feed sheet produce the same numbers the live UI shows.
// ---------------------------------------------------------------------------

export function equalMix(
  skus: Array<{ product_id: string; retail_price_cents: number }>,
): ProformaSkuInput[] {
  if (skus.length === 0) return [];
  const share = 1 / skus.length;
  return skus.map((s) => ({ ...s, mix_share: share }));
}

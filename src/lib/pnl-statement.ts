// CPA-grade monthly / quarterly / annual P&L statement engine.
//
// This module replaces the bookkeeper + CPA monthly reconciliation step:
// every number flows from typed Supabase rows through the existing pnl.ts
// aggregator, then is sliced into IRS-filing-ready buckets.
//
// Chain-of-thought for the CPA-grade design choices:
//   1. Cash-basis accounting (IRS default for sole proprietorships). A sale
//      is recognized in the month it was PAID, not the month it was placed.
//      We use orders.created_at as a proxy today because the existing
//      aggregator keys off created_at; Phase-2 TODO: switch to paid_at once
//      Stripe webhook populates it on >95% of orders.
//   2. Sales tax is a PASSTHROUGH (liability, not revenue). The aggregator
//      already excludes it from gross_revenue; this module reports it on its
//      own line so Jeff can see monthly remittance obligations at a glance.
//   3. COGS composes materials + labor + packaging + freight + other, with
//      per-order overrides preferred over per-SKU templates — the same rule
//      the /admin/pnl surface uses.
//   4. Stripe fees are a Schedule C line-11 expense (Commissions & Fees),
//      broken out separately from other operating expenses.
//   5. Shipsurance is Schedule C line 15 (Insurance). Today we bucket it
//      into COGS freight; Phase-2 TODO: route to insurance line.
//   6. Net profit = Gross profit − Operating expenses. Matches Schedule C
//      line 31 (the number that flows to Form 1040 line 3).
//
// Non-goals:
//   • No accrual view yet (would require a toggle + invoice table).
//   • No self-employment tax calc (needs Brian Fay's current SE-tax rate
//     assumptions for the year; surfaced as "estimated ≈ 15.3% × net" only).

import {
  aggregatePnl,
  type PnlAggregate,
  type PnlOrder,
  type ProductCostTemplate,
  type OrderCostOverride,
  type OverheadExpense,
} from '@/lib/pnl';

// ---------- Types ----------

export type MonthKey = `${number}-${'01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12'}`;

export type MonthlyRow = {
  monthIndex: number; // 0..11
  monthKey: MonthKey;
  label: string; // "January 2026"
  short: string; // "Jan"
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD (last day of month, clamped to today for current month)
  aggregate: PnlAggregate;
};

export type QuarterRow = {
  quarter: 1 | 2 | 3 | 4;
  label: string; // "Q1 2026"
  months: number[]; // e.g. [0, 1, 2]
  gross_revenue: number;
  sales_tax_collected: number;
  total_cogs: number;
  total_stripe_fees: number;
  gross_profit: number;
  operating_expenses: number;
  net_profit: number;
  order_count: number;
};

export type AnnualTotal = {
  year: number;
  gross_revenue: number;
  sales_tax_collected: number;
  total_cogs: number;
  total_stripe_fees: number;
  gross_profit: number;
  operating_expenses: number;
  net_profit: number;
  order_count: number;
  margin_pct: number;
};

export type ScheduleCMapping = {
  // Income
  line1_gross_receipts: number; // Gross receipts (before sales tax)
  line2_returns_allowances: number; // Refunds + returns
  line3_net_receipts: number; // line1 − line2
  line4_cogs: number; // From Part III
  line7_gross_income: number; // line3 − line4
  // Expenses (Part II, lines 8-27)
  line11_commissions_fees: number; // Stripe processing fees
  line15_insurance: number; // Shipsurance + business liability (approximated as 0 for now)
  line_other_operating: number; // Everything else in overhead_expenses
  line28_total_expenses: number; // Sum of lines 8-27
  // Net
  line31_net_profit: number; // line7 − line28 (flows to Form 1040 line 3)
  // Estimated tax
  estimated_se_tax: number; // ~15.3% × net (planning only)
  estimated_federal_income_tax: number; // ~12% bracket (rough; CPA review required)
};

export type StateMonthGridRow = {
  state: string;
  annual_total: number;
  monthly: number[]; // 12 cells, cents
};

export type PnlStatement = {
  year: number;
  monthly: MonthlyRow[];
  quarterly: QuarterRow[];
  annual: AnnualTotal;
  priorAnnual: AnnualTotal | null; // year-over-year
  scheduleC: ScheduleCMapping;
  salesTaxByStateMonth: StateMonthGridRow[];
  has_estimates: boolean;
  range: { from: string; to: string };
};

// ---------- Helpers ----------

const MONTH_LABELS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

export function monthBounds(year: number, monthIdx: number, clampToTodayIfCurrent = true): { from: string; to: string } {
  const from = `${year}-${pad2(monthIdx + 1)}-01`;
  const lastDay = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
  let to = `${year}-${pad2(monthIdx + 1)}-${pad2(lastDay)}`;
  if (clampToTodayIfCurrent) {
    const now = new Date();
    if (now.getUTCFullYear() === year && now.getUTCMonth() === monthIdx) {
      to = now.toISOString().slice(0, 10);
    }
  }
  return { from, to };
}

// ---------- Computation ----------

export function computeMonthlyBreakdown(
  year: number,
  orders: PnlOrder[],
  templates: ProductCostTemplate[],
  overrides: OrderCostOverride[],
  overhead: OverheadExpense[],
): MonthlyRow[] {
  const rows: MonthlyRow[] = [];
  for (let m = 0; m < 12; m++) {
    const { from, to } = monthBounds(year, m, true);
    const aggregate = aggregatePnl(orders, templates, overrides, overhead, from, to);
    rows.push({
      monthIndex: m,
      monthKey: `${year}-${pad2(m + 1)}` as MonthKey,
      label: `${MONTH_LABELS[m]} ${year}`,
      short: MONTH_SHORT[m],
      from,
      to,
      aggregate,
    });
  }
  return rows;
}

export function computeQuarterlyRollup(monthly: MonthlyRow[]): QuarterRow[] {
  const quarters: QuarterRow[] = [];
  for (let q = 0; q < 4; q++) {
    const months = [q * 3, q * 3 + 1, q * 3 + 2];
    const slice = monthly.filter((r) => months.includes(r.monthIndex));
    const sum = (pick: (a: PnlAggregate) => number) => slice.reduce((s, r) => s + pick(r.aggregate), 0);
    quarters.push({
      quarter: (q + 1) as 1 | 2 | 3 | 4,
      label: `Q${q + 1} ${monthly[0]?.monthKey.slice(0, 4) ?? ''}`,
      months,
      gross_revenue:       sum((a) => a.gross_revenue),
      sales_tax_collected: sum((a) => a.sales_tax_collected),
      total_cogs:          sum((a) => a.total_cogs),
      total_stripe_fees:   sum((a) => a.total_stripe_fees),
      gross_profit:        sum((a) => a.gross_profit),
      operating_expenses:  sum((a) => a.operating_expenses),
      net_profit:          sum((a) => a.net_profit),
      order_count:         sum((a) => a.order_count),
    });
  }
  return quarters;
}

export function computeAnnualTotal(year: number, monthly: MonthlyRow[]): AnnualTotal {
  const sum = (pick: (a: PnlAggregate) => number) => monthly.reduce((s, r) => s + pick(r.aggregate), 0);
  const gross_revenue = sum((a) => a.gross_revenue);
  const net_profit    = sum((a) => a.net_profit);
  return {
    year,
    gross_revenue,
    sales_tax_collected: sum((a) => a.sales_tax_collected),
    total_cogs:          sum((a) => a.total_cogs),
    total_stripe_fees:   sum((a) => a.total_stripe_fees),
    gross_profit:        sum((a) => a.gross_profit),
    operating_expenses:  sum((a) => a.operating_expenses),
    net_profit,
    order_count:         sum((a) => a.order_count),
    margin_pct:          gross_revenue > 0 ? net_profit / gross_revenue : 0,
  };
}

// IRS Schedule C line mapping. Numbers in cents.
export function mapToScheduleC(annual: AnnualTotal, refundsCents = 0): ScheduleCMapping {
  const line1 = annual.gross_revenue; // Gross receipts (cash basis, sales tax already excluded upstream)
  const line2 = refundsCents;
  const line3 = line1 - line2;
  const line4 = annual.total_cogs;
  const line7 = line3 - line4;

  const line11 = annual.total_stripe_fees;
  const line15 = 0; // TODO: split shipsurance out of COGS freight
  const lineOther = annual.operating_expenses; // Everything recorded in overhead_expenses
  const line28 = line11 + line15 + lineOther;
  const line31 = line7 - line28;

  // Rough SE + federal income tax brackets — Brian Fay reviews actual.
  const estimated_se_tax = Math.max(0, Math.round(line31 * 0.153));
  const estimated_federal_income_tax = Math.max(0, Math.round(line31 * 0.12));

  return {
    line1_gross_receipts: line1,
    line2_returns_allowances: line2,
    line3_net_receipts: line3,
    line4_cogs: line4,
    line7_gross_income: line7,
    line11_commissions_fees: line11,
    line15_insurance: line15,
    line_other_operating: lineOther,
    line28_total_expenses: line28,
    line31_net_profit: line31,
    estimated_se_tax,
    estimated_federal_income_tax,
  };
}

// Sales-tax-by-state × month grid for filing (FL remits monthly; most
// states quarterly or annually).
export function computeSalesTaxByStateMonth(monthly: MonthlyRow[]): StateMonthGridRow[] {
  const stateMap = new Map<string, number[]>(); // state → 12-cell array
  for (const row of monthly) {
    for (const s of row.aggregate.sales_tax_by_state) {
      const cells = stateMap.get(s.state) ?? Array(12).fill(0);
      cells[row.monthIndex] += s.tax_cents;
      stateMap.set(s.state, cells);
    }
  }
  return Array.from(stateMap.entries())
    .map(([state, monthly]) => ({
      state: state || 'Unknown',
      annual_total: monthly.reduce((s, c) => s + c, 0),
      monthly,
    }))
    .sort((a, b) => b.annual_total - a.annual_total);
}

export function buildPnlStatement(
  year: number,
  orders: PnlOrder[],
  templates: ProductCostTemplate[],
  overrides: OrderCostOverride[],
  overhead: OverheadExpense[],
  priorYearInputs?: {
    orders: PnlOrder[];
    templates: ProductCostTemplate[];
    overrides: OrderCostOverride[];
    overhead: OverheadExpense[];
  },
): PnlStatement {
  const monthly = computeMonthlyBreakdown(year, orders, templates, overrides, overhead);
  const quarterly = computeQuarterlyRollup(monthly);
  const annual = computeAnnualTotal(year, monthly);
  const scheduleC = mapToScheduleC(annual);
  const salesTaxByStateMonth = computeSalesTaxByStateMonth(monthly);

  let priorAnnual: AnnualTotal | null = null;
  if (priorYearInputs) {
    const priorMonthly = computeMonthlyBreakdown(
      year - 1,
      priorYearInputs.orders,
      priorYearInputs.templates,
      priorYearInputs.overrides,
      priorYearInputs.overhead,
    );
    priorAnnual = computeAnnualTotal(year - 1, priorMonthly);
  }

  const has_estimates = monthly.some((m) => m.aggregate.has_estimates);

  return {
    year,
    monthly,
    quarterly,
    annual,
    priorAnnual,
    scheduleC,
    salesTaxByStateMonth,
    has_estimates,
    range: { from: `${year}-01-01`, to: `${year}-12-31` },
  };
}

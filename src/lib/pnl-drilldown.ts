// P&L drill-down prototype engine.
//
// Purpose: power /admin/pnl/drilldown — the three-tier drill-down dashboard
// (segment -> order -> line item). Pure functions + seeded mock data.
//
// STRIPE ACTIVATION: swap `getMockDrilldownOrders()` with a real Supabase
// pull once Stripe keys are live. The shape of DrilldownOrder is designed
// to map 1:1 onto the existing `orders` + `order_items` + `order_cost_overrides`
// + `product_costs` tables — no engine changes required.
//
// All monetary values in integer cents.

import { getAllProducts } from './products';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Segment = 'wholesale' | 'retail';

export type BomLine = {
  sku: string;            // e.g. 'box-12x12', 'bubble-wrap', 'peanuts', 'shipsurance'
  label: string;          // human-readable
  unit_cost_cents: number;
  quantity: number;       // per pot
};

export type DrilldownLineItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
  // Per-unit costs (cents)
  materials_cents: number;  // clay, glaze, firing
  labor_minutes: number;    // throw + glaze + pack
  labor_cost_cents: number; // labor_minutes * blended rate
  packaging_cents: number;  // sum of BOM
  bom: BomLine[];
  // Shipping is allocated proportionally at the order level — not per-SKU
};

export type DrilldownOrder = {
  id: string;
  buyer_name: string;
  buyer_email: string;
  segment: Segment;
  channel: 'stripe' | 'faire' | 'venmo' | 'paypal';
  created_at: string;       // ISO
  line_items: DrilldownLineItem[];
  // Order-level costs
  shipping_cost_cents: number;   // actual FedEx / USPS invoice
  shipsurance_cents: number;     // $0.45/unit × total units
  stripe_fee_cents: number;      // 2.9% + $0.30 (0 for Faire/Venmo)
  sales_tax_cents: number;
};

export type OrderPnl = {
  order_id: string;
  revenue_cents: number;           // sum(unit_price * qty)
  units: number;
  materials_cents: number;
  labor_cents: number;
  labor_minutes: number;
  packaging_cents: number;
  shipping_cents: number;
  shipsurance_cents: number;
  stripe_fee_cents: number;
  sales_tax_cents: number;
  cogs_total_cents: number;        // materials + labor + packaging + shipping + shipsurance
  net_margin_cents: number;        // revenue - cogs - stripe_fee - sales_tax
  margin_pct: number;              // 0-1
};

export type SegmentRollup = {
  segment: Segment;
  order_count: number;
  units: number;
  revenue_cents: number;
  cogs_total_cents: number;
  net_margin_cents: number;
  margin_pct: number;
};

// ---------------------------------------------------------------------------
// Cost constants (from Pottery_Shipping_Protocol_2026-04-20.docx)
// ---------------------------------------------------------------------------

export const LABOR_BLENDED_RATE_CENTS_PER_HOUR = 2000; // $20/hr
// Alias for "receipt-view" consumers — same value, clearer name when you're
// NOT deep in the cost engine and just need "the hourly rate".
export const BLENDED_LABOR_RATE_PER_HOUR_CENTS = LABOR_BLENDED_RATE_CENTS_PER_HOUR;

export const LABOR_MINUTES_PER_POT = 15;
// Per-phase breakdown (sums to LABOR_MINUTES_PER_POT).
// These drive both the unit labor cost AND the daily worker-requirement rollup.
export const THROW_MINUTES_PER_POT = 6;
export const GLAZE_MINUTES_PER_POT = 4;
export const PACK_MINUTES_PER_POT  = 5;
// Firing is a batch-oven step — allocated per-pot as labor-tended minutes
// (load/unload/monitor), NOT the full 8-hour bisque cycle.
export const FIRE_MINUTES_PER_POT  = 2;

// When a single order hits >=10 units, two packers run in parallel so the
// order ships same-day. This is a WALL-CLOCK optimization — total labor cost
// (minutes * rate) is unchanged. Parallelism only halves the calendar time
// to get the order out the door.
export const PARALLEL_PACK_THRESHOLD_UNITS = 10;

export const MATERIALS_COST_PER_POT_CENTS = 350;       // clay + glaze + firing allocation
export const SHIPSURANCE_PER_UNIT_CENTS = 45;          // $0.45

// ---------------------------------------------------------------------------
// Fixed overhead (monthly). Runs whether or not a single pot ships.
// Source of truth; edit these in-place when a bill changes.
// Purpose: transparency for employees — shows what the owner commits before
// any revenue comes in.
// ---------------------------------------------------------------------------

export type FixedCost = {
  category: string;
  monthly_cents: number;
  note?: string;
};

export const FIXED_COSTS_MONTHLY: FixedCost[] = [
  { category: 'Warehouse Monthly Rental',         monthly_cents: 150000, note: 'Studio + storage lease' },
  { category: 'Warehouse Monthly Electricity',    monthly_cents:  25000, note: 'Kiln draws most of this' },
  { category: 'General Liability Insurance',      monthly_cents:  10000, note: 'Policy minimum — required' },
];

export function fixedCostsMonthlyTotalCents(): number {
  return FIXED_COSTS_MONTHLY.reduce((s, c) => s + c.monthly_cents, 0);
}

export function fixedCostsDailyBurnCents(daysInMonth = 30): number {
  return Math.round(fixedCostsMonthlyTotalCents() / daysInMonth);
}

export function fixedCostsPerUnitCents(unitsThisMonth: number): number {
  if (unitsThisMonth <= 0) return 0;
  return Math.round(fixedCostsMonthlyTotalCents() / unitsThisMonth);
}

// Packaging BOM at 500-qty bulk rate — $2.14/unit per protocol
export function bomForPot(): BomLine[] {
  return [
    { sku: 'uline-box-12x12x12',  label: 'ULINE 12x12x12 shipping box',   unit_cost_cents: 120, quantity: 1 },
    { sku: 'bubble-wrap-roll',    label: 'Bubble wrap wrap (24" × 6ft)',  unit_cost_cents: 45,  quantity: 1 },
    { sku: 'packing-peanuts',     label: 'Biodegradable packing peanuts', unit_cost_cents: 30,  quantity: 1 },
    { sku: 'kraft-wrap',          label: 'Kraft paper inner wrap',        unit_cost_cents: 12,  quantity: 1 },
    { sku: 'shipping-tape',       label: 'Scotch shipping tape (linear ft allocated)', unit_cost_cents: 7, quantity: 1 },
  ];
  // Total: 214 cents = $2.14/unit. Matches Operations_Research protocol.
}

export function bomTotalCents(bom: BomLine[]): number {
  return bom.reduce((s, l) => s + l.unit_cost_cents * l.quantity, 0);
}

// Labor cost (cents) for N minutes at blended rate
export function laborCostCents(minutes: number): number {
  return Math.round((minutes / 60) * LABOR_BLENDED_RATE_CENTS_PER_HOUR);
}

// Stripe fee: 2.9% + 30c on total. Returns 0 for non-Stripe channels.
export function stripeFeeCents(totalCents: number, channel: DrilldownOrder['channel']): number {
  if (channel !== 'stripe') return 0;
  return Math.round(totalCents * 0.029) + 30;
}

// ---------------------------------------------------------------------------
// Segmentation rule (simple): quantity >= 10 units = wholesale. Else retail.
// TODO: replace with profiles.segment field once migration DRAFT-0003 is applied.
// ---------------------------------------------------------------------------

export const WHOLESALE_UNIT_THRESHOLD = 10;

export function classifySegment(totalUnits: number): Segment {
  return totalUnits >= WHOLESALE_UNIT_THRESHOLD ? 'wholesale' : 'retail';
}

// ---------------------------------------------------------------------------
// Per-order P&L computation
// ---------------------------------------------------------------------------

export function computeDrilldownOrderPnl(order: DrilldownOrder): OrderPnl {
  let revenue = 0;
  let units = 0;
  let materials = 0;
  let labor = 0;
  let laborMinutes = 0;
  let packaging = 0;

  for (const li of order.line_items) {
    revenue += li.unit_price_cents * li.quantity;
    units += li.quantity;
    materials += li.materials_cents * li.quantity;
    labor += li.labor_cost_cents * li.quantity;
    laborMinutes += li.labor_minutes * li.quantity;
    packaging += li.packaging_cents * li.quantity;
  }

  const cogs_total =
    materials + labor + packaging + order.shipping_cost_cents + order.shipsurance_cents;
  const net_margin =
    revenue - cogs_total - order.stripe_fee_cents; // sales_tax is pass-through
  const margin_pct = revenue > 0 ? net_margin / revenue : 0;

  return {
    order_id: order.id,
    revenue_cents: revenue,
    units,
    materials_cents: materials,
    labor_cents: labor,
    labor_minutes: laborMinutes,
    packaging_cents: packaging,
    shipping_cents: order.shipping_cost_cents,
    shipsurance_cents: order.shipsurance_cents,
    stripe_fee_cents: order.stripe_fee_cents,
    sales_tax_cents: order.sales_tax_cents,
    cogs_total_cents: cogs_total,
    net_margin_cents: net_margin,
    margin_pct,
  };
}

export function rollupSegment(orders: DrilldownOrder[], segment: Segment): SegmentRollup {
  const segOrders = orders.filter((o) => o.segment === segment);
  let units = 0;
  let revenue = 0;
  let cogs = 0;
  let margin = 0;
  for (const o of segOrders) {
    const p = computeDrilldownOrderPnl(o);
    units += p.units;
    revenue += p.revenue_cents;
    cogs += p.cogs_total_cents + p.stripe_fee_cents;
    margin += p.net_margin_cents;
  }
  return {
    segment,
    order_count: segOrders.length,
    units,
    revenue_cents: revenue,
    cogs_total_cents: cogs,
    net_margin_cents: margin,
    margin_pct: revenue > 0 ? margin / revenue : 0,
  };
}

// ---------------------------------------------------------------------------
// Mock data seeder — 3 wholesale + 9 retail, last 30 days
// ---------------------------------------------------------------------------

function buildLineItem(
  productId: string,
  productName: string,
  unitPriceCents: number,
  quantity: number,
): DrilldownLineItem {
  const bom = bomForPot();
  const packaging = bomTotalCents(bom);
  return {
    product_id: productId,
    product_name: productName,
    quantity,
    unit_price_cents: unitPriceCents,
    materials_cents: MATERIALS_COST_PER_POT_CENTS,
    labor_minutes: LABOR_MINUTES_PER_POT,
    labor_cost_cents: laborCostCents(LABOR_MINUTES_PER_POT),
    packaging_cents: packaging,
    bom,
  };
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function productByIndex(idx: number): { id: string; name: string; price_cents: number } {
  const live = getAllProducts().filter((p) => p.price > 0).slice(0, 11);
  const p = live[idx % live.length];
  return { id: p.id, name: p.name, price_cents: p.price };
}

export function getMockDrilldownOrders(): DrilldownOrder[] {
  const orders: DrilldownOrder[] = [];

  // --- 3 WHOLESALE ---
  // W1: 50-pot Faire order (no Stripe fee)
  {
    const p = productByIndex(0);
    const qty = 50;
    // Wholesale price ~ 55% of retail (standard Faire split after 25% commission)
    const wholesalePrice = Math.round(p.price_cents * 0.55);
    const line = buildLineItem(p.id, p.name, wholesalePrice, qty);
    orders.push({
      id: 'w-demo-001',
      buyer_name: 'Wholesale Buyer 1 · Plant Nook Boutique',
      buyer_email: 'orders@plantnook.example',
      segment: 'wholesale',
      channel: 'faire',
      created_at: daysAgo(24),
      line_items: [line],
      shipping_cost_cents: 7800,   // $78 LTL / bulk FedEx
      shipsurance_cents: SHIPSURANCE_PER_UNIT_CENTS * qty,
      stripe_fee_cents: 0,
      sales_tax_cents: 0,
    });
  }
  // W2: 24-pot direct wholesale (Stripe invoice)
  {
    const p = productByIndex(4);
    const qty = 24;
    const wholesalePrice = Math.round(p.price_cents * 0.6);
    const line = buildLineItem(p.id, p.name, wholesalePrice, qty);
    const revenue = wholesalePrice * qty;
    orders.push({
      id: 'w-demo-002',
      buyer_name: 'Wholesale Buyer 2 · Urban Jungle Miami',
      buyer_email: 'buying@urbanjunglemia.example',
      segment: 'wholesale',
      channel: 'stripe',
      created_at: daysAgo(17),
      line_items: [line],
      shipping_cost_cents: 4400,
      shipsurance_cents: SHIPSURANCE_PER_UNIT_CENTS * qty,
      stripe_fee_cents: stripeFeeCents(revenue, 'stripe'),
      sales_tax_cents: 0,
    });
  }
  // W3: 20-pot mixed SKU via Faire
  {
    const p1 = productByIndex(1);
    const p2 = productByIndex(5);
    const q1 = 12;
    const q2 = 8;
    orders.push({
      id: 'w-demo-003',
      buyer_name: 'Wholesale Buyer 3 · Coastal Home Goods Co.',
      buyer_email: 'purchasing@coastalhome.example',
      segment: 'wholesale',
      channel: 'faire',
      created_at: daysAgo(8),
      line_items: [
        buildLineItem(p1.id, p1.name, Math.round(p1.price_cents * 0.55), q1),
        buildLineItem(p2.id, p2.name, Math.round(p2.price_cents * 0.55), q2),
      ],
      shipping_cost_cents: 3400,
      shipsurance_cents: SHIPSURANCE_PER_UNIT_CENTS * (q1 + q2),
      stripe_fee_cents: 0,
      sales_tax_cents: 0,
    });
  }

  // --- 9 RETAIL ---
  const retailMeta: Array<{ name: string; email: string; idx: number; qty: number; daysAgo: number }> = [
    { name: 'Mom · Sarah Chen',       email: 'sarah.chen@example.com',    idx: 0, qty: 1, daysAgo: 2 },
    { name: 'Retail · Mia Rodriguez', email: 'mia.r@example.com',         idx: 2, qty: 2, daysAgo: 4 },
    { name: 'Retail · James Park',    email: 'jpark@example.com',         idx: 3, qty: 1, daysAgo: 5 },
    { name: 'Gift · Linda Walsh',     email: 'lwalsh@example.com',        idx: 6, qty: 1, daysAgo: 6 },
    { name: 'Retail · David Kim',     email: 'dkim@example.com',          idx: 1, qty: 3, daysAgo: 11 },
    { name: 'Retail · Aisha Patel',   email: 'aisha.p@example.com',       idx: 7, qty: 1, daysAgo: 13 },
    { name: 'Retail · Tom Reilly',    email: 'treilly@example.com',       idx: 8, qty: 2, daysAgo: 18 },
    { name: 'Retail · Elena Vargas',  email: 'evargas@example.com',       idx: 9, qty: 1, daysAgo: 21 },
    { name: 'Retail · Ben Cohen',     email: 'bcohen@example.com',        idx: 10, qty: 1, daysAgo: 27 },
  ];

  for (let i = 0; i < retailMeta.length; i++) {
    const m = retailMeta[i];
    const p = productByIndex(m.idx);
    const line = buildLineItem(p.id, p.name, p.price_cents, m.qty);
    const revenue = p.price_cents * m.qty;
    const salesTax = Math.round(revenue * 0.07); // 7% avg
    const shipping = m.qty === 1 ? 1100 : m.qty === 2 ? 1300 : 1600; // $11-$16 USPS Priority
    orders.push({
      id: `r-demo-${String(i + 1).padStart(3, '0')}`,
      buyer_name: m.name,
      buyer_email: m.email,
      segment: 'retail',
      channel: 'stripe',
      created_at: daysAgo(m.daysAgo),
      line_items: [line],
      shipping_cost_cents: shipping,
      shipsurance_cents: SHIPSURANCE_PER_UNIT_CENTS * m.qty,
      stripe_fee_cents: stripeFeeCents(revenue + salesTax + shipping, 'stripe'),
      sales_tax_cents: salesTax,
    });
  }

  return orders;
}

// ---------------------------------------------------------------------------
// Convenience: load everything for the dashboard in one call
// ---------------------------------------------------------------------------

export type DrilldownDashboardData = {
  orders: DrilldownOrder[];
  per_order: OrderPnl[];
  segments: { wholesale: SegmentRollup; retail: SegmentRollup };
  totals: {
    revenue_cents: number;
    cogs_cents: number;
    net_margin_cents: number;
    margin_pct: number;
    order_count: number;
    units: number;
  };
};

// ---------------------------------------------------------------------------
// Worker requirements (packer throughput + wall-clock time)
// ---------------------------------------------------------------------------
//
// Distinction worth calling out — it trips people up on the receipt view:
//
//   TOTAL LABOR MINUTES = units × (throw + glaze + fire + pack) per pot.
//   LABOR COST          = TOTAL LABOR MINUTES × rate. Full stop.
//                         It is NOT divided by the number of packers.
//
//   PARALLELISM only affects WALL-CLOCK time (how long before the box is
//   on the porch). Two packers splitting a 50-pot queue each spend
//   50 × 5 / 2 = 125 minutes AT THE BENCH. The business still paid for
//   250 packer-minutes total — because both humans were on the clock.
//
// So `totalLaborMinutesAllRoles` is the cost driver, and `perPackerMinutes`
// is the "when can I actually ship this" driver.

export type WorkerRequirement = {
  packers: number;                    // 1 for retail, 2 for wholesale (>= threshold)
  totalPackMinutes: number;           // units × PACK_MINUTES_PER_POT (all packers combined)
  perPackerMinutes: number;           // totalPackMinutes / packers — WALL CLOCK pack time
  totalLaborMinutesAllRoles: number;  // throw + glaze + fire + pack, summed across ALL units
};

export function computeWorkerRequirements(order: DrilldownOrder): WorkerRequirement {
  const units = order.line_items.reduce((s, li) => s + li.quantity, 0);
  const packers = units >= PARALLEL_PACK_THRESHOLD_UNITS ? 2 : 1;
  const totalPackMinutes = units * PACK_MINUTES_PER_POT;
  const perPackerMinutes = packers > 0 ? Math.ceil(totalPackMinutes / packers) : totalPackMinutes;
  const totalLaborMinutesAllRoles =
    units * (THROW_MINUTES_PER_POT + GLAZE_MINUTES_PER_POT + FIRE_MINUTES_PER_POT + PACK_MINUTES_PER_POT);
  return { packers, totalPackMinutes, perPackerMinutes, totalLaborMinutesAllRoles };
}

// ---------------------------------------------------------------------------
// Receipt view — "grocery receipt" format for any order
// ---------------------------------------------------------------------------

export type ReceiptCategory =
  | 'revenue'
  | 'materials'
  | 'packaging'
  | 'labor'
  | 'shipping'
  | 'fees'
  | 'total_costs'
  | 'net_margin';

export type ReceiptLine = {
  label: string;
  detail?: string;   // the small grey bit shown under the label ("6 min × $20/hr", etc.)
  cents: number;     // signed: positive for revenue / keep, negative for costs
  category: ReceiptCategory;
};

export function computeOrderReceipt(order: DrilldownOrder): ReceiptLine[] {
  const pnl = computeDrilldownOrderPnl(order);
  const units = pnl.units;
  const lines: ReceiptLine[] = [];

  // --- Revenue ---
  const skuDescription = order.line_items
    .map((li) => `${li.quantity} × ${li.product_name}`)
    .join(' · ');
  lines.push({
    label: 'Sold to customer',
    detail: skuDescription || `${units} pots`,
    cents: pnl.revenue_cents,
    category: 'revenue',
  });

  // --- Materials (clay + glaze + firing lumped at $3.50/pot) ---
  lines.push({
    label: 'Clay + glaze + firing',
    detail: `${units} pot${units === 1 ? '' : 's'} × $3.50`,
    cents: -pnl.materials_cents,
    category: 'materials',
  });

  // --- Packaging BOM, expanded line by line across the whole order ---
  // Uses the FIRST line item's BOM as the representative template — all
  // line items share the same ULINE BOM today.
  const bom = order.line_items[0]?.bom ?? bomForPot();
  for (const part of bom) {
    const totalCents = part.unit_cost_cents * part.quantity * units;
    lines.push({
      label: part.label,
      detail: `${units} × ${(part.unit_cost_cents / 100).toFixed(2)}`,
      cents: -totalCents,
      category: 'packaging',
    });
  }

  // --- Labor, phase by phase. Each line shows (minutes × $20/hr). ---
  const rateLabel = `$${(BLENDED_LABOR_RATE_PER_HOUR_CENTS / 100).toFixed(2)}/hr`;
  const laborPhases: Array<{ label: string; minutesPerPot: number }> = [
    { label: 'Throw + trim',     minutesPerPot: THROW_MINUTES_PER_POT },
    { label: 'Glaze',            minutesPerPot: GLAZE_MINUTES_PER_POT },
    { label: 'Fire (tend kiln)', minutesPerPot: FIRE_MINUTES_PER_POT  },
    { label: 'Pack + label',     minutesPerPot: PACK_MINUTES_PER_POT  },
  ];
  for (const phase of laborPhases) {
    const totalMinutes = phase.minutesPerPot * units;
    const cost = laborCostCents(totalMinutes);
    lines.push({
      label: `Labor · ${phase.label}`,
      detail: `${totalMinutes} min × ${rateLabel}`,
      cents: -cost,
      category: 'labor',
    });
  }

  // --- Shipping + Shipsurance (carrier side) ---
  lines.push({
    label: order.segment === 'wholesale' ? 'Shipping (bulk FedEx/LTL)' : 'Shipping (USPS Priority)',
    detail: `${units} pot${units === 1 ? '' : 's'} · carrier invoice`,
    cents: -pnl.shipping_cents,
    category: 'shipping',
  });
  lines.push({
    label: 'Insurance (Shipsurance)',
    detail: `${units} × $0.45`,
    cents: -pnl.shipsurance_cents,
    category: 'shipping',
  });

  // --- Payment processor fee ---
  if (pnl.stripe_fee_cents > 0) {
    lines.push({
      label: 'Payment processor fee (Stripe)',
      detail: '2.9% + $0.30',
      cents: -pnl.stripe_fee_cents,
      category: 'fees',
    });
  } else {
    lines.push({
      label: `Payment processor fee (${order.channel.toUpperCase()})`,
      detail: 'no Stripe on this channel',
      cents: 0,
      category: 'fees',
    });
  }

  // --- Totals ---
  const totalCosts =
    pnl.materials_cents +
    pnl.packaging_cents +
    pnl.labor_cents +
    pnl.shipping_cents +
    pnl.shipsurance_cents +
    pnl.stripe_fee_cents;

  lines.push({
    label: 'What it costs to make & ship',
    detail: 'materials + packaging + labor + shipping + fees',
    cents: -totalCosts,
    category: 'total_costs',
  });
  lines.push({
    label: 'You keep',
    detail: `your take: ${(pnl.margin_pct * 100).toFixed(1)}%`,
    cents: pnl.net_margin_cents,
    category: 'net_margin',
  });

  return lines;
}

export function loadDrilldownDashboard(): DrilldownDashboardData {
  const orders = getMockDrilldownOrders();
  const per_order = orders.map(computeDrilldownOrderPnl);

  const wholesale = rollupSegment(orders, 'wholesale');
  const retail = rollupSegment(orders, 'retail');

  const totals = {
    revenue_cents: wholesale.revenue_cents + retail.revenue_cents,
    cogs_cents: wholesale.cogs_total_cents + retail.cogs_total_cents,
    net_margin_cents: wholesale.net_margin_cents + retail.net_margin_cents,
    margin_pct: 0,
    order_count: wholesale.order_count + retail.order_count,
    units: wholesale.units + retail.units,
  };
  totals.margin_pct = totals.revenue_cents > 0 ? totals.net_margin_cents / totals.revenue_cents : 0;

  return { orders, per_order, segments: { wholesale, retail }, totals };
}

// ============================================================================
// DAILY WORKLOAD — how many pots landed on each day, and how many packers
// it takes to ship them. Drives right-sized daily staffing: don't hire 5
// packers when only 1 pot came in.
//
//   packer-hours per day  = units × PACK_MINUTES_PER_POT / 60
//   packers needed today  = ceil(packer-hours / 8), min 1 if any units
//
// Other production phases (throw / glaze / fire) are amortized across the
// multi-day production cycle, so this chart shows PACKING-day load specifically.
// ============================================================================

export type DailyWorkload = {
  date: string;              // YYYY-MM-DD
  weekday: string;           // "Mon"
  monthDay: string;          // "Apr 14"
  isToday: boolean;
  isWeekend: boolean;
  orderCount: number;
  units: number;
  wholesaleUnits: number;
  retailUnits: number;
  revenue_cents: number;
  packMinutes: number;
  packHours: number;
  packersNeeded: number;     // ceil(packHours / 8) with min 1 when units > 0
  totalLaborMinutes: number; // pack + throw + glaze + fire
  laborCostCents: number;    // burden of that day's full production-equivalent labor
  buyerTags: string[];       // short buyer names for the day ("Plant Nook · 50", etc.)
};

// ============================================================================
// PRODUCT SALES SUMMARY — which SKUs move the most units, at what price,
// generating what revenue. Fuels the "what to make more of" decision.
// ============================================================================

export type ProductSalesRow = {
  product_id: string;
  product_name: string;
  image_path: string | null;    // first image from products.json or null
  retail_price_cents: number;   // catalog price
  units_sold: number;
  order_count: number;
  revenue_cents: number;
  wholesale_units: number;
  retail_units: number;
};

export function computeProductSales(
  orders: DrilldownOrder[],
  productCatalog: Array<{ id: string; name: string; price: number; images?: string[] }>,
): ProductSalesRow[] {
  const catalogById = new Map(productCatalog.map((p) => [p.id, p]));
  const agg = new Map<string, ProductSalesRow>();

  for (const o of orders) {
    for (const li of o.line_items) {
      const existing = agg.get(li.product_id);
      const catalog = catalogById.get(li.product_id);
      const image = catalog?.images?.[0] ?? null;
      const retailPrice = catalog?.price ?? li.unit_price_cents;

      if (existing) {
        existing.units_sold += li.quantity;
        existing.order_count += 1;
        existing.revenue_cents += li.unit_price_cents * li.quantity;
        if (o.segment === 'wholesale') existing.wholesale_units += li.quantity;
        else existing.retail_units += li.quantity;
      } else {
        agg.set(li.product_id, {
          product_id: li.product_id,
          product_name: li.product_name,
          image_path: image,
          retail_price_cents: retailPrice,
          units_sold: li.quantity,
          order_count: 1,
          revenue_cents: li.unit_price_cents * li.quantity,
          wholesale_units: o.segment === 'wholesale' ? li.quantity : 0,
          retail_units: o.segment === 'retail' ? li.quantity : 0,
        });
      }
    }
  }

  // Sort by units sold desc so top sellers rise to the top.
  return Array.from(agg.values()).sort((a, b) => b.units_sold - a.units_sold);
}

export function computeDailyWorkload(
  orders: DrilldownOrder[],
  days: number = 14,
): DailyWorkload[] {
  const FT_MIN_PER_DAY = 8 * 60;
  const TOTAL_MIN_PER_POT =
    THROW_MINUTES_PER_POT + GLAZE_MINUTES_PER_POT + FIRE_MINUTES_PER_POT + PACK_MINUTES_PER_POT;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = today.toISOString().slice(0, 10);

  // Initialize the last N days with empty buckets so gaps show as "idle".
  const byDay = new Map<string, DrilldownOrder[]>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    byDay.set(d.toISOString().slice(0, 10), []);
  }

  // Bucket orders into their created_at day.
  for (const o of orders) {
    const key = new Date(o.created_at).toISOString().slice(0, 10);
    if (byDay.has(key)) byDay.get(key)!.push(o);
  }

  const out: DailyWorkload[] = [];
  for (const [key, dayOrders] of byDay) {
    const d = new Date(key + 'T00:00:00');
    const unitsOf = (list: DrilldownOrder[]) =>
      list.reduce((s, o) => s + o.line_items.reduce((ss, li) => ss + li.quantity, 0), 0);

    const units = unitsOf(dayOrders);
    const wholesaleUnits = unitsOf(dayOrders.filter((o) => o.segment === 'wholesale'));
    const retailUnits = units - wholesaleUnits;
    const revenue = dayOrders.reduce(
      (s, o) => s + o.line_items.reduce((ss, li) => ss + li.unit_price_cents * li.quantity, 0),
      0,
    );
    const packMinutes = units * PACK_MINUTES_PER_POT;
    const packHours = packMinutes / 60;
    const packersNeeded = units === 0 ? 0 : Math.max(1, Math.ceil(packMinutes / FT_MIN_PER_DAY));
    const totalLaborMinutes = units * TOTAL_MIN_PER_POT;
    const laborCostCents = Math.round((totalLaborMinutes / 60) * BLENDED_LABOR_RATE_PER_HOUR_CENTS);

    const buyerTags = dayOrders.map((o) => {
      const qty = o.line_items.reduce((s, li) => s + li.quantity, 0);
      const shortName = o.buyer_name.length > 22 ? o.buyer_name.slice(0, 20) + '…' : o.buyer_name;
      return `${shortName} · ${qty}`;
    });

    out.push({
      date: key,
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      monthDay: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday: key === todayKey,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      orderCount: dayOrders.length,
      units,
      wholesaleUnits,
      retailUnits,
      revenue_cents: revenue,
      packMinutes,
      packHours,
      packersNeeded,
      totalLaborMinutes,
      laborCostCents,
      buyerTags,
    });
  }

  return out;
}

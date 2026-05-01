/**
 * State Sales Tax Rates — All 50 States + DC
 * Origin: Fort Lauderdale, Florida (Jimmy Potters)
 *
 * Rates are combined state + average local sales tax rates stored as
 * decimal multipliers (e.g., 0.07 = 7%).
 *
 * Source: Tax Foundation, "State and Local Sales Tax Rates, Midyear 2025"
 *   https://taxfoundation.org/data/all/state/2025-sales-taxes/
 * Published January 2025 (midyear 2025 table). These are the most stable,
 * widely-cited combined rates; individual state revenue dept pages are the
 * authoritative legal source for exact collection amounts.
 *
 * Pottery/ceramics = tangible personal property — taxable in all listed states
 * that impose a general sales tax. States with rate=0 have no general sales tax.
 *
 * --------------------------------------------------------------------------
 * IMPORTANT NEXUS WARNING:
 * This table provides RATES for all 50 states + DC, but Jimmy Potters is only
 * legally obligated to COLLECT sales tax in states where he has nexus.
 *   - PHYSICAL nexus: Florida (origin / studio). ALWAYS collect FL tax.
 *   - ECONOMIC nexus: Most states require collection only after $100K in sales
 *     OR 200 transactions in that state in the prior 12 months.
 * For production, recommend Stripe Tax (auto-detects buyer state, only collects
 * in registered states, files returns). This static table is a fallback / for
 * estimating tax during checkout preview when Stripe Tax is unavailable.
 * --------------------------------------------------------------------------
 */

export interface StateTaxRate {
  state: string;
  abbreviation: string;
  rate: number;       // decimal (0.06 = 6%)
  displayRate: string; // "6.00%"
}

export const STATE_TAX_RATES: StateTaxRate[] = [
  // ── No state sales tax ────────────────────────────────────────────────────
  // AK: 0% state tax but avg ~1.76% local (Tax Foundation 2025)
  // DE, MT, NH, OR: 0% combined
  { state: 'Alaska',         abbreviation: 'AK', rate: 0.0176, displayRate: '1.76%' },
  { state: 'Delaware',       abbreviation: 'DE', rate: 0.0,    displayRate: '0.00%' },
  { state: 'Montana',        abbreviation: 'MT', rate: 0.0,    displayRate: '0.00%' },
  { state: 'New Hampshire',  abbreviation: 'NH', rate: 0.0,    displayRate: '0.00%' },
  { state: 'Oregon',         abbreviation: 'OR', rate: 0.0,    displayRate: '0.00%' },

  // ── Southeast ─────────────────────────────────────────────────────────────
  { state: 'Alabama',        abbreviation: 'AL', rate: 0.0922, displayRate: '9.22%' },
  { state: 'Florida',        abbreviation: 'FL', rate: 0.07,   displayRate: '7.00%' },
  { state: 'Georgia',        abbreviation: 'GA', rate: 0.0736, displayRate: '7.36%' },
  { state: 'Mississippi',    abbreviation: 'MS', rate: 0.0707, displayRate: '7.07%' },
  { state: 'South Carolina', abbreviation: 'SC', rate: 0.0743, displayRate: '7.43%' },
  { state: 'Tennessee',      abbreviation: 'TN', rate: 0.0955, displayRate: '9.55%' },

  // ── Mid-Atlantic / South Atlantic ─────────────────────────────────────────
  { state: 'Maryland',       abbreviation: 'MD', rate: 0.06,   displayRate: '6.00%' },
  { state: 'North Carolina', abbreviation: 'NC', rate: 0.0698, displayRate: '6.98%' },
  { state: 'Virginia',       abbreviation: 'VA', rate: 0.057,  displayRate: '5.70%' },
  { state: 'Washington DC',  abbreviation: 'DC', rate: 0.06,   displayRate: '6.00%' },
  { state: 'West Virginia',  abbreviation: 'WV', rate: 0.065,  displayRate: '6.50%' },

  // ── Northeast ─────────────────────────────────────────────────────────────
  { state: 'Connecticut',    abbreviation: 'CT', rate: 0.0635, displayRate: '6.35%' },
  { state: 'Maine',          abbreviation: 'ME', rate: 0.055,  displayRate: '5.50%' },
  { state: 'Massachusetts',  abbreviation: 'MA', rate: 0.0625, displayRate: '6.25%' },
  { state: 'New Jersey',     abbreviation: 'NJ', rate: 0.06625,displayRate: '6.625%'},
  { state: 'New York',       abbreviation: 'NY', rate: 0.0852, displayRate: '8.52%' },
  { state: 'Pennsylvania',   abbreviation: 'PA', rate: 0.0634, displayRate: '6.34%' },
  { state: 'Rhode Island',   abbreviation: 'RI', rate: 0.07,   displayRate: '7.00%' },
  { state: 'Vermont',        abbreviation: 'VT', rate: 0.0624, displayRate: '6.24%' },

  // ── South Central ─────────────────────────────────────────────────────────
  { state: 'Arkansas',       abbreviation: 'AR', rate: 0.0946, displayRate: '9.46%' },
  { state: 'Kentucky',       abbreviation: 'KY', rate: 0.06,   displayRate: '6.00%' },
  { state: 'Louisiana',      abbreviation: 'LA', rate: 0.0956, displayRate: '9.56%' },
  { state: 'Oklahoma',       abbreviation: 'OK', rate: 0.0898, displayRate: '8.98%' },
  { state: 'Texas',          abbreviation: 'TX', rate: 0.0819, displayRate: '8.19%' },

  // ── Midwest ───────────────────────────────────────────────────────────────
  { state: 'Illinois',       abbreviation: 'IL', rate: 0.0882, displayRate: '8.82%' },
  { state: 'Indiana',        abbreviation: 'IN', rate: 0.07,   displayRate: '7.00%' },
  { state: 'Iowa',           abbreviation: 'IA', rate: 0.0694, displayRate: '6.94%' },
  { state: 'Kansas',         abbreviation: 'KS', rate: 0.0868, displayRate: '8.68%' },
  { state: 'Michigan',       abbreviation: 'MI', rate: 0.06,   displayRate: '6.00%' },
  { state: 'Minnesota',      abbreviation: 'MN', rate: 0.0748, displayRate: '7.48%' },
  { state: 'Missouri',       abbreviation: 'MO', rate: 0.0819, displayRate: '8.19%' },
  { state: 'Nebraska',       abbreviation: 'NE', rate: 0.069,  displayRate: '6.90%' },
  { state: 'North Dakota',   abbreviation: 'ND', rate: 0.0696, displayRate: '6.96%' },
  { state: 'Ohio',           abbreviation: 'OH', rate: 0.0722, displayRate: '7.22%' },
  { state: 'South Dakota',   abbreviation: 'SD', rate: 0.0611, displayRate: '6.11%' },
  { state: 'Wisconsin',      abbreviation: 'WI', rate: 0.0543, displayRate: '5.43%' },

  // ── Mountain ──────────────────────────────────────────────────────────────
  { state: 'Arizona',        abbreviation: 'AZ', rate: 0.0837, displayRate: '8.37%' },
  { state: 'Colorado',       abbreviation: 'CO', rate: 0.0773, displayRate: '7.73%' },
  { state: 'Idaho',          abbreviation: 'ID', rate: 0.0603, displayRate: '6.03%' },
  { state: 'Nevada',         abbreviation: 'NV', rate: 0.0823, displayRate: '8.23%' },
  { state: 'New Mexico',     abbreviation: 'NM', rate: 0.0724, displayRate: '7.24%' },
  { state: 'Utah',           abbreviation: 'UT', rate: 0.0719, displayRate: '7.19%' },
  { state: 'Wyoming',        abbreviation: 'WY', rate: 0.0536, displayRate: '5.36%' },

  // ── Pacific ───────────────────────────────────────────────────────────────
  { state: 'California',     abbreviation: 'CA', rate: 0.0867, displayRate: '8.67%' },
  { state: 'Hawaii',         abbreviation: 'HI', rate: 0.0444, displayRate: '4.44%' },
  { state: 'Washington',     abbreviation: 'WA', rate: 0.0928, displayRate: '9.28%' },
];

// Total: 51 entries (50 states + DC)

/**
 * Get the tax rate for a state abbreviation.
 * Returns the decimal rate, or null if state not found.
 */
export function getTaxRate(stateAbbr: string): number | null {
  const entry = STATE_TAX_RATES.find((s) => s.abbreviation === stateAbbr);
  return entry ? entry.rate : null;
}

/**
 * Get the display rate string for a state (e.g., "6.00%").
 */
export function getTaxDisplayRate(stateAbbr: string): string | null {
  const entry = STATE_TAX_RATES.find((s) => s.abbreviation === stateAbbr);
  return entry ? entry.displayRate : null;
}

/**
 * Calculate sales tax in cents.
 * @param subtotalCents — product total in cents
 * @param stateAbbr — two-letter state code
 * @returns tax amount in cents (rounded to nearest cent)
 */
export function calculateSalesTax(subtotalCents: number, stateAbbr: string): number {
  const rate = getTaxRate(stateAbbr);
  if (rate === null || rate === 0) return 0;
  return Math.round(subtotalCents * rate);
}

/**
 * Format cents as dollar string for tax display.
 */
export function formatTaxAmount(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

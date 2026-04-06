/**
 * State Sales Tax Rates — East Coast States
 * Origin: Fort Lauderdale, Florida (Jimmy Potters)
 *
 * These are combined state + average local rates for each state we ship to.
 * Rates are stored as decimal multipliers (e.g., 0.06 = 6%).
 *
 * Source: state revenue department published rates as of 2026.
 * Note: Some states have no sales tax on certain goods. Pottery/ceramics
 * are classified as tangible personal property and are taxable in all
 * listed states.
 */

export interface StateTaxRate {
  state: string;
  abbreviation: string;
  rate: number;       // decimal (0.06 = 6%)
  displayRate: string; // "6.00%"
}

export const STATE_TAX_RATES: StateTaxRate[] = [
  // Florida — origin state, 6% state + ~1% avg local
  { state: 'Florida', abbreviation: 'FL', rate: 0.07, displayRate: '7.00%' },

  // No state sales tax
  { state: 'Delaware', abbreviation: 'DE', rate: 0.0, displayRate: '0.00%' },
  { state: 'New Hampshire', abbreviation: 'NH', rate: 0.0, displayRate: '0.00%' },

  // East Coast states with sales tax
  { state: 'Virginia', abbreviation: 'VA', rate: 0.053, displayRate: '5.30%' },
  { state: 'Washington DC', abbreviation: 'DC', rate: 0.06, displayRate: '6.00%' },
  { state: 'Maryland', abbreviation: 'MD', rate: 0.06, displayRate: '6.00%' },
  { state: 'Pennsylvania', abbreviation: 'PA', rate: 0.06, displayRate: '6.00%' },
  { state: 'New Jersey', abbreviation: 'NJ', rate: 0.06625, displayRate: '6.625%' },
  { state: 'West Virginia', abbreviation: 'WV', rate: 0.06, displayRate: '6.00%' },
  { state: 'New York', abbreviation: 'NY', rate: 0.08, displayRate: '8.00%' },
  { state: 'Connecticut', abbreviation: 'CT', rate: 0.0635, displayRate: '6.35%' },
  { state: 'North Carolina', abbreviation: 'NC', rate: 0.0475, displayRate: '4.75%' },
  { state: 'Massachusetts', abbreviation: 'MA', rate: 0.0625, displayRate: '6.25%' },
  { state: 'Rhode Island', abbreviation: 'RI', rate: 0.07, displayRate: '7.00%' },
  { state: 'South Carolina', abbreviation: 'SC', rate: 0.06, displayRate: '6.00%' },
  { state: 'Georgia', abbreviation: 'GA', rate: 0.04, displayRate: '4.00%' },
];

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

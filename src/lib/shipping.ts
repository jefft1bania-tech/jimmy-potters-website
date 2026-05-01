/**
 * FedEx Shipping — Internal Cost Tracking
 * Origin: Fort Lauderdale, Florida
 *
 * IMPORTANT: Shipping is FREE to the customer ("Complimentary FedEx Ground").
 * These rates are internal costs that Jimmy Potters absorbs.
 * They are never shown to the buyer — only stored in order records
 * for accounting/P&L reporting.
 *
 * Based on typical pottery package: 3-5 lbs, insured, with protective packaging
 * Source: FedEx Ground zone map from ZIP 33301 (Fort Lauderdale FL) + published
 * rate card estimates, midyear 2025. Zones follow standard FedEx Ground routing.
 *
 * Zone definitions from Fort Lauderdale FL origin:
 *   Zone 2 (FL origin — same-state):         $8.99
 *   Zone 3 (FL-adjacent: GA, AL, SC):        $9.99
 *   Zone 4 (Southeast / Mid-Atlantic):       $11.99
 *   Zone 5 (Northeast / Midwest near):       $13.99
 *   Zone 6 (Midwest / South Central):        $15.99
 *   Zone 7 (Plains / Mountain):              $17.99
 *   Zone 8 (Mountain far / Pacific near):    $19.99
 *   Zone 8+ (West Coast: CA, WA, NV):        $21.99
 *   Zone 8++ (AK, HI — FedEx surcharge):     $34.99
 */

export interface StateShippingRate {
  state: string;
  abbreviation: string;
  zone: number;
  internalCost: number; // FedEx Ground cost in cents — absorbed by seller
}

export const STATE_SHIPPING_RATES: StateShippingRate[] = [
  // ── Zone 2 — FL origin (same state) ──────────────────────────────────────
  { state: 'Florida',        abbreviation: 'FL', zone: 2, internalCost:  899 },

  // ── Zone 3 — FL-adjacent ─────────────────────────────────────────────────
  { state: 'Alabama',        abbreviation: 'AL', zone: 3, internalCost:  999 },
  { state: 'Georgia',        abbreviation: 'GA', zone: 3, internalCost:  999 },
  { state: 'South Carolina', abbreviation: 'SC', zone: 3, internalCost:  999 },

  // ── Zone 4 — Southeast / Mid-Atlantic ────────────────────────────────────
  { state: 'Mississippi',    abbreviation: 'MS', zone: 4, internalCost: 1199 },
  { state: 'North Carolina', abbreviation: 'NC', zone: 4, internalCost: 1199 },
  { state: 'Tennessee',      abbreviation: 'TN', zone: 4, internalCost: 1199 },
  { state: 'Virginia',       abbreviation: 'VA', zone: 4, internalCost: 1199 },
  { state: 'Washington DC',  abbreviation: 'DC', zone: 4, internalCost: 1199 },
  { state: 'West Virginia',  abbreviation: 'WV', zone: 4, internalCost: 1199 },

  // ── Zone 5 — Northeast / Upper South ─────────────────────────────────────
  { state: 'Arkansas',       abbreviation: 'AR', zone: 5, internalCost: 1399 },
  { state: 'Delaware',       abbreviation: 'DE', zone: 5, internalCost: 1399 },
  { state: 'Kentucky',       abbreviation: 'KY', zone: 5, internalCost: 1399 },
  { state: 'Louisiana',      abbreviation: 'LA', zone: 5, internalCost: 1399 },
  { state: 'Maryland',       abbreviation: 'MD', zone: 5, internalCost: 1399 },
  { state: 'New Jersey',     abbreviation: 'NJ', zone: 5, internalCost: 1399 },
  { state: 'New York',       abbreviation: 'NY', zone: 5, internalCost: 1399 },
  { state: 'Ohio',           abbreviation: 'OH', zone: 5, internalCost: 1399 },
  { state: 'Pennsylvania',   abbreviation: 'PA', zone: 5, internalCost: 1399 },

  // ── Zone 6 — Midwest / South Central ─────────────────────────────────────
  { state: 'Connecticut',    abbreviation: 'CT', zone: 6, internalCost: 1599 },
  { state: 'Illinois',       abbreviation: 'IL', zone: 6, internalCost: 1599 },
  { state: 'Indiana',        abbreviation: 'IN', zone: 6, internalCost: 1599 },
  { state: 'Massachusetts',  abbreviation: 'MA', zone: 6, internalCost: 1599 },
  { state: 'Michigan',       abbreviation: 'MI', zone: 6, internalCost: 1599 },
  { state: 'Missouri',       abbreviation: 'MO', zone: 6, internalCost: 1599 },
  { state: 'New Hampshire',  abbreviation: 'NH', zone: 6, internalCost: 1599 },
  { state: 'Oklahoma',       abbreviation: 'OK', zone: 6, internalCost: 1599 },
  { state: 'Rhode Island',   abbreviation: 'RI', zone: 6, internalCost: 1599 },
  { state: 'Texas',          abbreviation: 'TX', zone: 6, internalCost: 1599 },
  { state: 'Vermont',        abbreviation: 'VT', zone: 6, internalCost: 1599 },
  { state: 'Wisconsin',      abbreviation: 'WI', zone: 6, internalCost: 1599 },

  // ── Zone 7 — Plains / Mountain West ──────────────────────────────────────
  { state: 'Iowa',           abbreviation: 'IA', zone: 7, internalCost: 1799 },
  { state: 'Kansas',         abbreviation: 'KS', zone: 7, internalCost: 1799 },
  { state: 'Maine',          abbreviation: 'ME', zone: 7, internalCost: 1799 },
  { state: 'Minnesota',      abbreviation: 'MN', zone: 7, internalCost: 1799 },
  { state: 'Nebraska',       abbreviation: 'NE', zone: 7, internalCost: 1799 },
  { state: 'New Mexico',     abbreviation: 'NM', zone: 7, internalCost: 1799 },
  { state: 'North Dakota',   abbreviation: 'ND', zone: 7, internalCost: 1799 },
  { state: 'South Dakota',   abbreviation: 'SD', zone: 7, internalCost: 1799 },
  { state: 'Wyoming',        abbreviation: 'WY', zone: 7, internalCost: 1799 },

  // ── Zone 8 — Mountain Far ─────────────────────────────────────────────────
  { state: 'Arizona',        abbreviation: 'AZ', zone: 8, internalCost: 1999 },
  { state: 'Colorado',       abbreviation: 'CO', zone: 8, internalCost: 1999 },
  { state: 'Idaho',          abbreviation: 'ID', zone: 8, internalCost: 1999 },
  { state: 'Montana',        abbreviation: 'MT', zone: 8, internalCost: 1999 },
  { state: 'Utah',           abbreviation: 'UT', zone: 8, internalCost: 1999 },

  // ── Zone 8+ — West Coast ─────────────────────────────────────────────────
  { state: 'California',     abbreviation: 'CA', zone: 8, internalCost: 2199 },
  { state: 'Nevada',         abbreviation: 'NV', zone: 8, internalCost: 2199 },
  { state: 'Oregon',         abbreviation: 'OR', zone: 8, internalCost: 2199 },
  { state: 'Washington',     abbreviation: 'WA', zone: 8, internalCost: 2199 },

  // ── Zone 8++ — Alaska + Hawaii (FedEx surcharge) ─────────────────────────
  { state: 'Alaska',         abbreviation: 'AK', zone: 8, internalCost: 3499 },
  { state: 'Hawaii',         abbreviation: 'HI', zone: 8, internalCost: 3499 },
];

// Total: 51 entries (50 states + DC)

/**
 * @deprecated Use STATE_SHIPPING_RATES. This alias exists to avoid breaking
 * existing imports. Will be removed in a future cleanup.
 */
export const EAST_COAST_STATES: StateShippingRate[] = STATE_SHIPPING_RATES;

/**
 * Get the internal FedEx Ground shipping cost for a state (in cents).
 * This cost is absorbed by the seller — the buyer sees $0.00.
 */
export function getInternalShippingCost(stateAbbr: string): number {
  const stateData = STATE_SHIPPING_RATES.find((s) => s.abbreviation === stateAbbr);
  return stateData ? stateData.internalCost : 0;
}

/**
 * Format cents as dollar string.
 */
export function formatShippingPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Check if we ship to a given state.
 * Returns true for all 50 states + DC.
 */
export function isShippingAvailable(stateAbbr: string): boolean {
  return STATE_SHIPPING_RATES.some((s) => s.abbreviation === stateAbbr);
}

/**
 * Get state info by abbreviation.
 */
export function getStateByAbbreviation(abbr: string): StateShippingRate | undefined {
  return STATE_SHIPPING_RATES.find((s) => s.abbreviation === abbr);
}

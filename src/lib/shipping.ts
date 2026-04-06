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
 *
 * Zone 1: Local (VA, DC, MD, DE)
 * Zone 2: Near (PA, NJ, WV)
 * Zone 3: Mid (NY, CT, NC)
 * Zone 4: Far (MA, RI, NH, SC, GA)
 * Zone 5: Extended (FL — origin)
 */

export interface StateShippingRate {
  state: string;
  abbreviation: string;
  zone: number;
  internalCost: number; // FedEx Ground cost in cents — absorbed by seller
}

export const EAST_COAST_STATES: StateShippingRate[] = [
  // Zone 1 — Local
  { state: 'Virginia', abbreviation: 'VA', zone: 1, internalCost: 999 },
  { state: 'Washington DC', abbreviation: 'DC', zone: 1, internalCost: 999 },
  { state: 'Maryland', abbreviation: 'MD', zone: 1, internalCost: 999 },
  { state: 'Delaware', abbreviation: 'DE', zone: 1, internalCost: 999 },

  // Zone 2 — Near
  { state: 'Pennsylvania', abbreviation: 'PA', zone: 2, internalCost: 1199 },
  { state: 'New Jersey', abbreviation: 'NJ', zone: 2, internalCost: 1199 },
  { state: 'West Virginia', abbreviation: 'WV', zone: 2, internalCost: 1199 },

  // Zone 3 — Mid
  { state: 'New York', abbreviation: 'NY', zone: 3, internalCost: 1399 },
  { state: 'Connecticut', abbreviation: 'CT', zone: 3, internalCost: 1399 },
  { state: 'North Carolina', abbreviation: 'NC', zone: 3, internalCost: 1399 },

  // Zone 4 — Far
  { state: 'Massachusetts', abbreviation: 'MA', zone: 4, internalCost: 1499 },
  { state: 'Rhode Island', abbreviation: 'RI', zone: 4, internalCost: 1499 },
  { state: 'New Hampshire', abbreviation: 'NH', zone: 4, internalCost: 1499 },
  { state: 'South Carolina', abbreviation: 'SC', zone: 4, internalCost: 1499 },
  { state: 'Georgia', abbreviation: 'GA', zone: 4, internalCost: 1499 },

  // Zone 5 — Origin (FL)
  { state: 'Florida', abbreviation: 'FL', zone: 5, internalCost: 899 },
];

/**
 * Get the internal FedEx Ground shipping cost for a state (in cents).
 * This cost is absorbed by the seller — the buyer sees $0.00.
 */
export function getInternalShippingCost(stateAbbr: string): number {
  const stateData = EAST_COAST_STATES.find((s) => s.abbreviation === stateAbbr);
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
 */
export function isShippingAvailable(stateAbbr: string): boolean {
  return EAST_COAST_STATES.some((s) => s.abbreviation === stateAbbr);
}

/**
 * Get state info by abbreviation.
 */
export function getStateByAbbreviation(abbr: string): StateShippingRate | undefined {
  return EAST_COAST_STATES.find((s) => s.abbreviation === abbr);
}

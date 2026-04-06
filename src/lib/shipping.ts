/**
 * FedEx Shipping Rates — East Coast States
 * Origin: Fort Lauderdale, Florida
 * Based on typical pottery package: 3-5 lbs, insured, with protective packaging
 *
 * Zone 1: Local (VA, DC, MD, DE) — closest to origin
 * Zone 2: Near (PA, NJ, WV) — 1 state away
 * Zone 3: Mid (NY, CT, NC) — 2-3 states away
 * Zone 4: Far (SC, GA, MA, RI, NH) — 4+ states away
 * Zone 5: Extended (FL) — farthest East Coast
 */

export interface ShippingTier {
  id: 'ground' | 'express' | 'overnight';
  name: string;
  carrier: string;
  description: string;
  deliveryTime: string;
  icon: 'truck' | 'bolt' | 'star';
}

export interface StateShippingRate {
  state: string;
  abbreviation: string;
  zone: number;
  rates: {
    ground: number;
    express: number;
    overnight: number;
  };
}

export const SHIPPING_TIERS: ShippingTier[] = [
  {
    id: 'ground',
    name: 'FedEx Ground',
    carrier: 'FedEx',
    description: 'Standard delivery with tracking. Pottery carefully packaged with double-boxing and cushion wrap.',
    deliveryTime: '3-5 business days',
    icon: 'truck',
  },
  {
    id: 'express',
    name: 'FedEx 2Day',
    carrier: 'FedEx',
    description: 'Expedited delivery with tracking and signature confirmation. Same protective packaging.',
    deliveryTime: '2 business days',
    icon: 'bolt',
  },
  {
    id: 'overnight',
    name: 'FedEx Priority Overnight',
    carrier: 'FedEx',
    description: 'Next business day delivery by 10:30 AM with tracking and signature confirmation.',
    deliveryTime: 'Next business day',
    icon: 'star',
  },
];

export const EAST_COAST_STATES: StateShippingRate[] = [
  // Zone 1 — Local
  { state: 'Virginia', abbreviation: 'VA', zone: 1, rates: { ground: 999, express: 1899, overnight: 3499 } },
  { state: 'Washington DC', abbreviation: 'DC', zone: 1, rates: { ground: 999, express: 1899, overnight: 3499 } },
  { state: 'Maryland', abbreviation: 'MD', zone: 1, rates: { ground: 999, express: 1899, overnight: 3499 } },
  { state: 'Delaware', abbreviation: 'DE', zone: 1, rates: { ground: 999, express: 1899, overnight: 3499 } },

  // Zone 2 — Near
  { state: 'Pennsylvania', abbreviation: 'PA', zone: 2, rates: { ground: 1199, express: 2199, overnight: 3999 } },
  { state: 'New Jersey', abbreviation: 'NJ', zone: 2, rates: { ground: 1199, express: 2199, overnight: 3999 } },
  { state: 'West Virginia', abbreviation: 'WV', zone: 2, rates: { ground: 1199, express: 2199, overnight: 3999 } },

  // Zone 3 — Mid
  { state: 'New York', abbreviation: 'NY', zone: 3, rates: { ground: 1399, express: 2499, overnight: 4499 } },
  { state: 'Connecticut', abbreviation: 'CT', zone: 3, rates: { ground: 1399, express: 2499, overnight: 4499 } },
  { state: 'North Carolina', abbreviation: 'NC', zone: 3, rates: { ground: 1399, express: 2499, overnight: 4499 } },

  // Zone 4 — Far
  { state: 'Massachusetts', abbreviation: 'MA', zone: 4, rates: { ground: 1499, express: 2799, overnight: 4999 } },
  { state: 'Rhode Island', abbreviation: 'RI', zone: 4, rates: { ground: 1499, express: 2799, overnight: 4999 } },
  { state: 'New Hampshire', abbreviation: 'NH', zone: 4, rates: { ground: 1499, express: 2799, overnight: 4999 } },
  { state: 'South Carolina', abbreviation: 'SC', zone: 4, rates: { ground: 1499, express: 2799, overnight: 4999 } },
  { state: 'Georgia', abbreviation: 'GA', zone: 4, rates: { ground: 1499, express: 2799, overnight: 4999 } },

  // Zone 5 — Extended
  { state: 'Florida', abbreviation: 'FL', zone: 5, rates: { ground: 1699, express: 2999, overnight: 5499 } },
];

export function getShippingRate(stateAbbr: string, tier: 'ground' | 'express' | 'overnight'): number | null {
  const stateData = EAST_COAST_STATES.find((s) => s.abbreviation === stateAbbr);
  if (!stateData) return null;
  return stateData.rates[tier];
}

export function formatShippingPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function getStateByAbbreviation(abbr: string): StateShippingRate | undefined {
  return EAST_COAST_STATES.find((s) => s.abbreviation === abbr);
}

export function isShippingAvailable(stateAbbr: string): boolean {
  return EAST_COAST_STATES.some((s) => s.abbreviation === stateAbbr);
}

/**
 * Build a summary string for the chatbot / display
 */
export function getShippingRateSummary(): string {
  const zones = [
    { label: 'VA, DC, MD, DE', ground: '$9.99', express: '$18.99', overnight: '$34.99' },
    { label: 'PA, NJ, WV', ground: '$11.99', express: '$21.99', overnight: '$39.99' },
    { label: 'NY, CT, NC', ground: '$13.99', express: '$24.99', overnight: '$44.99' },
    { label: 'MA, RI, NH, SC, GA', ground: '$14.99', express: '$27.99', overnight: '$49.99' },
    { label: 'FL', ground: '$16.99', express: '$29.99', overnight: '$54.99' },
  ];

  return zones
    .map((z) => `${z.label}: Ground ${z.ground} | 2Day ${z.express} | Overnight ${z.overnight}`)
    .join('\n');
}

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Order } from '../src/lib/orders';

// Mock the Supabase-backed orders module BEFORE importing reports.ts so the
// generateRangeReport path never touches the real admin client.
const orderFixtures: Order[] = [
  {
    id: 'ord_1',
    type: 'guest',
    email: 'a@x.com',
    items: [{ productId: 'p1', name: 'A', price: 5000, image: '', quantity: 1 }],
    shipping: {
      name: 'Alice', line1: '1 St', city: 'Miami', state: 'FL',
      postalCode: '33101', country: 'US',
    },
    shippingTier: 'ground',
    shippingCost: 0,
    internalShippingCost: 899,
    salesTaxCollected: 350, // FL 7%
    buyerState: 'FL',
    subtotal: 5000,
    total: 5350,
    status: 'paid',
    createdAt: '2026-01-10T12:00:00.000Z',
  } as Order,
  {
    id: 'ord_2',
    type: 'guest',
    email: 'b@y.com',
    items: [{ productId: 'p2', name: 'B', price: 7500, image: '', quantity: 1 }],
    shipping: {
      name: 'Bob', line1: '2 St', city: 'Austin', state: 'TX',
      postalCode: '73301', country: 'US',
    },
    shippingTier: 'ground',
    shippingCost: 0,
    internalShippingCost: 1200,
    salesTaxCollected: 619, // TX 8.25%
    buyerState: 'TX',
    subtotal: 7500,
    total: 8119,
    status: 'shipped',
    createdAt: '2026-02-15T12:00:00.000Z',
  } as Order,
  {
    id: 'ord_3',
    type: 'guest',
    email: 'c@z.com',
    items: [{ productId: 'p1', name: 'A', price: 5000, image: '', quantity: 1 }],
    shipping: {
      name: 'Cam', line1: '3 St', city: 'Miami', state: 'FL',
      postalCode: '33101', country: 'US',
    },
    shippingTier: 'ground',
    shippingCost: 0,
    internalShippingCost: 899,
    salesTaxCollected: 350,
    buyerState: 'FL',
    subtotal: 5000,
    total: 5350,
    status: 'pending', // excluded from revenue
    createdAt: '2026-03-01T12:00:00.000Z',
  } as Order,
  {
    id: 'ord_4',
    type: 'guest',
    email: 'd@w.com',
    items: [{ productId: 'p2', name: 'B', price: 7500, image: '', quantity: 1 }],
    shipping: {
      name: 'Dana', line1: '4 St', city: 'Tampa', state: 'FL',
      postalCode: '33601', country: 'US',
    },
    shippingTier: 'ground',
    shippingCost: 0,
    internalShippingCost: 1200,
    salesTaxCollected: 525,
    buyerState: 'FL',
    subtotal: 7500,
    total: 8025,
    status: 'delivered',
    createdAt: '2026-04-05T12:00:00.000Z',
  } as Order,
];

vi.mock('../src/lib/orders', () => ({
  getAllOrders: vi.fn(async () => orderFixtures),
}));

// Import AFTER mock is set up.
import {
  generateMonthlyReport,
  generateYearlyReport,
  generateRangeReport,
} from '../src/lib/reports';

describe('generateRangeReport — arbitrary date range', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects malformed dates', async () => {
    await expect(generateRangeReport('2026', '2026-12-31')).rejects.toThrow(/ISO dates/);
    await expect(generateRangeReport('2026-01-01', '12/31/2026')).rejects.toThrow(/ISO dates/);
  });

  it('rejects start > end', async () => {
    await expect(generateRangeReport('2026-06-01', '2026-05-01')).rejects.toThrow(/start must be <= end/);
  });

  it('includes only revenue orders (paid/shipped/delivered) in range', async () => {
    const r = await generateRangeReport('2026-01-01', '2026-04-30');
    // ord_3 is pending — must be excluded
    expect(r.orderCount).toBe(3);
    // Gross = 5350 + 8119 + 8025
    expect(r.grossRevenue).toBe(5350 + 8119 + 8025);
    // Product revenue = subtotals only
    expect(r.productRevenue).toBe(5000 + 7500 + 7500);
    // Total tax = 350 + 619 + 525
    expect(r.totalSalesTaxCollected).toBe(350 + 619 + 525);
  });

  it('matches generateMonthlyReport for a single month', async () => {
    const month = await generateMonthlyReport(2026, 4);
    const range = await generateRangeReport('2026-04-01', '2026-04-30');
    expect(range.orderCount).toBe(month.orderCount);
    expect(range.grossRevenue).toBe(month.grossRevenue);
    expect(range.productRevenue).toBe(month.productRevenue);
    expect(range.totalSalesTaxCollected).toBe(month.totalSalesTaxCollected);
  });

  it('matches generateYearlyReport for a full year', async () => {
    const yearly = await generateYearlyReport(2026);
    const range = await generateRangeReport('2026-01-01', '2026-12-31');
    expect(range.orderCount).toBe(yearly.orderCount);
    expect(range.grossRevenue).toBe(yearly.grossRevenue);
    expect(range.productRevenue).toBe(yearly.productRevenue);
    expect(range.totalSalesTaxCollected).toBe(yearly.totalSalesTaxCollected);
  });

  it('aggregates sales tax by state (descending by amount)', async () => {
    const r = await generateRangeReport('2026-01-01', '2026-12-31');
    const fl = r.salesTaxByState.find((s) => s.state === 'FL');
    const tx = r.salesTaxByState.find((s) => s.state === 'TX');
    expect(fl?.orderCount).toBe(2); // ord_1, ord_4
    expect(fl?.taxCollected).toBe(350 + 525);
    expect(tx?.orderCount).toBe(1);
    expect(tx?.taxCollected).toBe(619);
    // FL > TX -> FL first
    expect(r.salesTaxByState[0]?.state).toBe('FL');
  });

  it('inclusive on end date (captures orders on final day)', async () => {
    // ord_4 created 2026-04-05 — end date 2026-04-05 must include it.
    const r = await generateRangeReport('2026-04-01', '2026-04-05');
    expect(r.orderCount).toBe(1);
    expect(r.grossRevenue).toBe(8025);
  });

  it('returns rangeStart/rangeEnd on the report', async () => {
    const r = await generateRangeReport('2026-02-01', '2026-03-31');
    expect(r.rangeStart).toBe('2026-02-01');
    expect(r.rangeEnd).toBe('2026-03-31');
    expect(r.periodType).toBe('range');
    expect(r.period).toBe('2026-02-01..2026-03-31');
  });

  it('computes net revenue after shipping correctly', async () => {
    const r = await generateRangeReport('2026-01-01', '2026-12-31');
    expect(r.totalInternalShippingCosts).toBe(899 + 1200 + 1200);
    expect(r.netRevenueAfterShipping).toBe(r.productRevenue - r.totalInternalShippingCosts);
  });

  it('empty range returns zeros, not NaN', async () => {
    const r = await generateRangeReport('2027-01-01', '2027-01-31');
    expect(r.orderCount).toBe(0);
    expect(r.grossRevenue).toBe(0);
    expect(r.totalSalesTaxCollected).toBe(0);
    expect(r.netRevenueAfterShipping).toBe(0);
    expect(r.salesTaxByState).toEqual([]);
  });
});

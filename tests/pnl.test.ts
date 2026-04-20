import { describe, it, expect } from 'vitest';
import {
  aggregatePnl,
  computeOrderPnl,
  type PnlOrder,
  type ProductCostTemplate,
  type OrderCostOverride,
  type OverheadExpense,
} from '../src/lib/pnl';

const POT_A: ProductCostTemplate = {
  product_id: 'pot-a',
  materials_cents: 500,
  labor_cents: 1000,
  packaging_cents: 200,
  freight_cents: 0,
  other_cents: 100,
};

const baseOrder = (overrides: Partial<PnlOrder> = {}): PnlOrder => ({
  id: 'ord_1',
  created_at: '2026-04-15T00:00:00Z',
  status: 'paid',
  subtotal_cents: 7500,
  sales_tax_cents: 525,
  total_cents: 8025,
  internal_shipping_cost_cents: 899,
  stripe_fee_cents: 263, // 2.9% + 30¢ on $80.25
  buyer_state: 'FL',
  payment_method: 'stripe',
  items: [{ product_id: 'pot-a', quantity: 1, unit_price_cents: 7500 }],
  ...overrides,
});

describe('computeOrderPnl', () => {
  it('uses template when no override', () => {
    const p = computeOrderPnl(baseOrder(), new Map([['pot-a', POT_A]]), null);
    expect(p.cogs_materials).toBe(500);
    expect(p.cogs_labor).toBe(1000);
    expect(p.cogs_packaging).toBe(200);
    expect(p.cogs_freight).toBe(0 + 899); // template + internal_shipping
    expect(p.cogs_other).toBe(100);
    expect(p.cogs_total).toBe(2699);
    // revenue 8025 - sales_tax 525 - cogs 2699 - stripe_fee 263 = 4538
    expect(p.gross_profit).toBe(4538);
    expect(p.uses_estimate).toBe(true);
  });

  it('uses override values when provided', () => {
    const override: OrderCostOverride = {
      order_id: 'ord_1',
      materials_cents: 700,
      labor_cents: 1200,
      packaging_cents: 250,
      freight_cents: 950,
      other_cents: 150,
    };
    const p = computeOrderPnl(baseOrder(), new Map([['pot-a', POT_A]]), override);
    expect(p.cogs_materials).toBe(700);
    expect(p.cogs_freight).toBe(950);
    expect(p.cogs_total).toBe(3250);
    expect(p.uses_estimate).toBe(false);
  });

  it('falls back to template for NULL fields in override', () => {
    const override: OrderCostOverride = {
      order_id: 'ord_1',
      materials_cents: 700, // override
      labor_cents: null,    // fall back to template
      packaging_cents: null,
      freight_cents: null,
      other_cents: null,
    };
    const p = computeOrderPnl(baseOrder(), new Map([['pot-a', POT_A]]), override);
    expect(p.cogs_materials).toBe(700);
    expect(p.cogs_labor).toBe(1000); // from template
    expect(p.uses_estimate).toBe(true);
  });

  it('handles Venmo order (no Stripe fee)', () => {
    const p = computeOrderPnl(
      baseOrder({ payment_method: 'venmo', stripe_fee_cents: null }),
      new Map([['pot-a', POT_A]]),
      null,
    );
    expect(p.stripe_fee).toBe(0);
    // revenue 8025 - sales_tax 525 - cogs 2699 - 0 = 4801
    expect(p.gross_profit).toBe(4801);
  });

  it('handles missing template gracefully (zero COGS)', () => {
    const p = computeOrderPnl(baseOrder(), new Map(), null);
    expect(p.cogs_materials).toBe(0);
    expect(p.cogs_total).toBe(899); // only internal_shipping_cost is non-zero
  });

  it('scales COGS with quantity', () => {
    const order = baseOrder({
      items: [{ product_id: 'pot-a', quantity: 3, unit_price_cents: 7500 }],
    });
    const p = computeOrderPnl(order, new Map([['pot-a', POT_A]]), null);
    expect(p.cogs_materials).toBe(1500);  // 500 * 3
    expect(p.cogs_labor).toBe(3000);      // 1000 * 3
  });
});

describe('aggregatePnl', () => {
  it('filters by date range and status', () => {
    const orders: PnlOrder[] = [
      baseOrder({ id: 'ord_in', created_at: '2026-04-15T00:00:00Z', status: 'paid' }),
      baseOrder({ id: 'ord_old', created_at: '2026-03-15T00:00:00Z', status: 'paid' }),
      baseOrder({ id: 'ord_pending', created_at: '2026-04-15T00:00:00Z', status: 'pending' }),
    ];
    const agg = aggregatePnl(orders, [POT_A], [], [], '2026-04-01', '2026-04-30');
    expect(agg.order_count).toBe(1);
    expect(agg.per_order[0].order_id).toBe('ord_in');
  });

  it('subtracts operating expenses from net profit', () => {
    const orders = [baseOrder({ id: 'o1' })];
    const expenses: OverheadExpense[] = [
      { amount_cents: 120000, incurred_on: '2026-04-01', category: 'rent' },
      { amount_cents: 50000, incurred_on: '2026-03-01', category: 'rent' }, // out of range
    ];
    const agg = aggregatePnl(orders, [POT_A], [], expenses, '2026-04-01', '2026-04-30');
    expect(agg.operating_expenses).toBe(120000);
    expect(agg.net_profit).toBe(agg.gross_profit - 120000);
  });

  it('groups sales tax by state', () => {
    const orders: PnlOrder[] = [
      baseOrder({ id: 'o1', buyer_state: 'FL', sales_tax_cents: 525, status: 'paid' }),
      baseOrder({ id: 'o2', buyer_state: 'FL', sales_tax_cents: 700, status: 'paid' }),
      baseOrder({ id: 'o3', buyer_state: 'VA', sales_tax_cents: 400, status: 'shipped' }),
    ];
    const agg = aggregatePnl(orders, [POT_A], [], [], '2026-04-01', '2026-04-30');
    expect(agg.sales_tax_by_state).toHaveLength(2);
    expect(agg.sales_tax_by_state[0]).toEqual({ state: 'FL', order_count: 2, tax_cents: 1225 });
    expect(agg.sales_tax_by_state[1]).toEqual({ state: 'VA', order_count: 1, tax_cents: 400 });
  });

  it('returns empty aggregate for a date range with no orders', () => {
    const agg = aggregatePnl([], [POT_A], [], [], '2025-01-01', '2025-12-31');
    expect(agg.order_count).toBe(0);
    expect(agg.gross_revenue).toBe(0);
    expect(agg.net_profit).toBe(0);
    expect(agg.has_estimates).toBe(false);
  });

  it('flags has_estimates when any order uses template fallback', () => {
    const agg = aggregatePnl([baseOrder()], [POT_A], [], [], '2026-04-01', '2026-04-30');
    expect(agg.has_estimates).toBe(true);
  });
});

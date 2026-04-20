import { describe, it, expect } from 'vitest';
import { computeSkuMargins, type MarginOrder } from '../src/lib/margin';

const names = new Map([['pot-a', 'Pot A'], ['pot-b', 'Pot B']]);

describe('computeSkuMargins', () => {
  it('computes retail-only margins', () => {
    const orders: MarginOrder[] = [{
      id: 'o1',
      status: 'paid',
      is_bulk: false,
      items: [{ product_id: 'pot-a', quantity: 2, unit_price_cents: 7500 }],
      order_cogs_total_cents: 4000, // 2000/pot
    }];
    const [row] = computeSkuMargins(orders, names);
    expect(row.retail_units).toBe(2);
    expect(row.retail_avg_unit_price).toBe(7500);
    expect(row.retail_avg_unit_cogs).toBe(2000);
    expect(row.retail_unit_margin).toBe(5500);
    expect(row.retail_margin_pct).toBeCloseTo(5500 / 7500, 4);
    expect(row.bulk_units).toBe(0);
  });

  it('uses bulk volume unit cost when provided', () => {
    const orders: MarginOrder[] = [{
      id: 'bulk_1',
      status: 'paid',
      is_bulk: true,
      items: [{ product_id: 'pot-a', quantity: 50, unit_price_cents: 4000 }],
      order_cogs_total_cents: 200000, // ignored because volume override provided
      bulk_volume_unit_cost_cents: 1500,
    }];
    const [row] = computeSkuMargins(orders, names);
    expect(row.bulk_units).toBe(50);
    expect(row.bulk_avg_unit_price).toBe(4000);
    expect(row.bulk_avg_unit_cogs).toBe(1500);
    expect(row.bulk_unit_margin).toBe(2500);
  });

  it('keeps retail and bulk buckets separate', () => {
    const orders: MarginOrder[] = [
      { id: 'r1', status: 'paid', is_bulk: false,
        items: [{ product_id: 'pot-a', quantity: 1, unit_price_cents: 7500 }],
        order_cogs_total_cents: 2000 },
      { id: 'b1', status: 'shipped', is_bulk: true,
        items: [{ product_id: 'pot-a', quantity: 50, unit_price_cents: 4000 }],
        order_cogs_total_cents: 75000,
        bulk_volume_unit_cost_cents: 1500 },
    ];
    const [row] = computeSkuMargins(orders, names);
    expect(row.retail_units).toBe(1);
    expect(row.bulk_units).toBe(50);
    expect(row.retail_margin_pct).toBeGreaterThan(row.bulk_margin_pct);
  });

  it('allocates COGS proportionally to line revenue across mixed items', () => {
    const orders: MarginOrder[] = [{
      id: 'mix',
      status: 'paid',
      is_bulk: false,
      items: [
        { product_id: 'pot-a', quantity: 1, unit_price_cents: 7500 }, // 75% of revenue
        { product_id: 'pot-b', quantity: 1, unit_price_cents: 2500 }, // 25%
      ],
      order_cogs_total_cents: 4000,
    }];
    const rows = computeSkuMargins(orders, names);
    const a = rows.find((r) => r.product_id === 'pot-a')!;
    const b = rows.find((r) => r.product_id === 'pot-b')!;
    expect(a.retail_cogs).toBe(3000);  // 75% of 4000
    expect(b.retail_cogs).toBe(1000);  // 25%
  });

  it('ignores non-revenue-recognized statuses', () => {
    const orders: MarginOrder[] = [
      { id: 'pending_o', status: 'pending', is_bulk: false,
        items: [{ product_id: 'pot-a', quantity: 10, unit_price_cents: 7500 }],
        order_cogs_total_cents: 20000 },
    ];
    expect(computeSkuMargins(orders, names)).toHaveLength(0);
  });

  it('sorts by total margin contribution descending', () => {
    const orders: MarginOrder[] = [
      { id: 'a', status: 'paid', is_bulk: false,
        items: [{ product_id: 'pot-a', quantity: 1, unit_price_cents: 1000 }],
        order_cogs_total_cents: 500 },
      { id: 'b', status: 'paid', is_bulk: false,
        items: [{ product_id: 'pot-b', quantity: 1, unit_price_cents: 10000 }],
        order_cogs_total_cents: 2000 },
    ];
    const rows = computeSkuMargins(orders, names);
    expect(rows[0].product_id).toBe('pot-b');
    expect(rows[1].product_id).toBe('pot-a');
  });
});

import { describe, it, expect } from 'vitest';
import { forecastOrderLabor, type LaborRole, type ProductLaborTime } from '../src/lib/labor/forecast';
import { computeHireScenario, recommendFromScenario } from '../src/lib/labor/hiring';

const roles: LaborRole[] = [
  { id: 'r_paint', role_key: 'painting', display_name: 'Painting',
    default_hourly_rate_cents: 1800, tax_treatment: 'w2' },
  { id: 'r_box',   role_key: 'boxing',   display_name: 'Boxing',
    default_hourly_rate_cents: 1500, tax_treatment: 'w2' },
];

describe('forecastOrderLabor', () => {
  it('forecasts labor for a 50-pot bulk order', () => {
    const times: ProductLaborTime[] = [
      { product_id: 'pot-a', role_id: 'r_paint', minutes_per_unit: 12 },
      { product_id: 'pot-a', role_id: 'r_box',   minutes_per_unit: 3 },
    ];

    const f = forecastOrderLabor(
      [{ product_id: 'pot-a', quantity: 50 }],
      roles,
      times,
    );

    const paint = f.per_role.find((r) => r.role_key === 'painting')!;
    expect(paint.minutes).toBe(600);
    expect(paint.hours).toBeCloseTo(10, 2);
    // base = 10 hours × $18 = $180 = 18000 cents
    expect(paint.base_cost_cents).toBe(18000);
    // burden = 7.65 + 0.6 + 2.7 + 2 = 12.95% → 2331 cents
    expect(paint.employer_burden_cents).toBe(2331);
    expect(paint.total_cost_cents).toBe(20331);
    expect(paint.suggested_workers).toBe(2); // 600min / 480min workday = 1.25 → ceil 2

    const box = f.per_role.find((r) => r.role_key === 'boxing')!;
    expect(box.minutes).toBe(150);
    // 2.5h × $15 = $37.50 = 3750
    expect(box.base_cost_cents).toBe(3750);
  });

  it('flags missing product labor times', () => {
    const f = forecastOrderLabor(
      [{ product_id: 'pot-unknown', quantity: 10 }],
      roles,
      [],
    );
    expect(f.has_missing_times).toBe(true);
    expect(f.per_role).toHaveLength(0);
  });

  it('sorts per_role by total cost descending', () => {
    const times: ProductLaborTime[] = [
      { product_id: 'pot-a', role_id: 'r_paint', minutes_per_unit: 1 },
      { product_id: 'pot-a', role_id: 'r_box',   minutes_per_unit: 10 },
    ];
    const f = forecastOrderLabor([{ product_id: 'pot-a', quantity: 100 }], roles, times);
    expect(f.per_role[0].role_key).toBe('boxing');
  });
});

describe('computeHireScenario', () => {
  it('computes FL W-2 fully-loaded cost correctly', () => {
    const out = computeHireScenario({
      scenario_name: 'Painter 20hr/wk × 8 weeks',
      base_rate_cents: 1800,
      weekly_hours: 20,
      duration_weeks: 8,
    });
    expect(out.total_hours).toBe(160);
    expect(out.base_pay_only_cents).toBe(288000); // 160 × 1800
    // burden 12.95% → 288000 × 1.1295 = 325296
    expect(out.fully_loaded.hourly_w2).toBe(325296);
    expect(out.fully_loaded.contract_1099).toBe(288000);
  });

  it('applies temp agency markup', () => {
    const out = computeHireScenario({
      scenario_name: 'temp',
      base_rate_cents: 1800,
      weekly_hours: 20,
      duration_weeks: 8,
      temp_agency_markup_pct: 0.5,
    });
    expect(out.fully_loaded.temp_agency).toBe(432000); // 288000 × 1.5
  });

  it('computes piece-rate effective hourly', () => {
    const out = computeHireScenario({
      scenario_name: 'piece',
      base_rate_cents: 1800,
      weekly_hours: 20,
      duration_weeks: 8,
      piece_rate_cents_per_unit: 300,
      units_per_hour: 5,
    });
    expect(out.piece_rate_effective_hourly_cents).toBe(1500); // 300 × 5
    expect(out.fully_loaded.piece_rate).toBe(1500 * 160);
  });

  it('recommender picks the cheapest option', () => {
    const out = computeHireScenario({
      scenario_name: 'x',
      base_rate_cents: 1800,
      weekly_hours: 20,
      duration_weeks: 8,
      temp_agency_markup_pct: 0.5,
    });
    const rec = recommendFromScenario(out);
    expect(rec).toContain('1099 contractor'); // cheapest at equal base rate
  });
});

// Per-order labor forecast. Pure functions.

export type LaborRole = {
  id: string;
  role_key: string;
  display_name: string;
  default_hourly_rate_cents: number;
  tax_treatment: 'w2' | '1099' | 'temp_agency';
};

export type ProductLaborTime = {
  product_id: string;
  role_id: string;
  minutes_per_unit: number;
};

export type OrderLineForForecast = {
  product_id: string;
  quantity: number;
};

export type EmployerBurdenConfig = {
  // decimal, e.g. 0.0765 = 7.65% FICA
  fica_pct: number;
  futa_pct: number;
  state_reemployment_pct: number;
  workers_comp_pct: number;
  extra_benefits_pct: number;
};

export const FL_W2_BURDEN: EmployerBurdenConfig = {
  fica_pct: 0.0765,
  futa_pct: 0.006,
  state_reemployment_pct: 0.027, // FL new-employer default
  workers_comp_pct: 0.02,         // conservative default
  extra_benefits_pct: 0,
};

export type RoleForecast = {
  role_id: string;
  role_key: string;
  display_name: string;
  minutes: number;
  hours: number;
  base_cost_cents: number;
  employer_burden_cents: number;
  total_cost_cents: number;
  suggested_workers: number;       // minutes / (workday_minutes)
};

export type OrderLaborForecast = {
  per_role: RoleForecast[];
  total_minutes: number;
  total_hours: number;
  total_labor_cost_cents: number;
  has_missing_times: boolean;
};

export function forecastOrderLabor(
  items: OrderLineForForecast[],
  roles: LaborRole[],
  times: ProductLaborTime[],
  burden: EmployerBurdenConfig = FL_W2_BURDEN,
  workdayHours: number = 8,
): OrderLaborForecast {
  const roleMap = new Map(roles.map((r) => [r.id, r]));

  // Build a lookup of minutes_per_unit keyed by `${product_id}::${role_id}`
  const timeKey = (p: string, r: string) => `${p}::${r}`;
  const timeMap = new Map(times.map((t) => [timeKey(t.product_id, t.role_id), t.minutes_per_unit]));

  const burdenMultiplier =
    burden.fica_pct + burden.futa_pct + burden.state_reemployment_pct +
    burden.workers_comp_pct + burden.extra_benefits_pct;

  const byRole = new Map<string, { minutes: number }>();
  let hasMissingTimes = false;

  for (const role of roles) {
    let minutes = 0;
    for (const item of items) {
      const mpu = timeMap.get(timeKey(item.product_id, role.id));
      if (mpu == null) {
        hasMissingTimes = true;
        continue;
      }
      minutes += mpu * item.quantity;
    }
    if (minutes > 0) byRole.set(role.id, { minutes });
  }

  const per_role: RoleForecast[] = [];
  for (const [role_id, { minutes }] of byRole) {
    const role = roleMap.get(role_id)!;
    const hours = minutes / 60;
    const base_cost_cents = Math.round((minutes / 60) * role.default_hourly_rate_cents);
    const employer_burden_cents = Math.round(base_cost_cents * burdenMultiplier);
    const total_cost_cents = base_cost_cents + employer_burden_cents;
    const suggested_workers = Math.max(1, Math.ceil(minutes / (workdayHours * 60)));

    per_role.push({
      role_id,
      role_key: role.role_key,
      display_name: role.display_name,
      minutes,
      hours: +hours.toFixed(2),
      base_cost_cents,
      employer_burden_cents,
      total_cost_cents,
      suggested_workers,
    });
  }

  per_role.sort((a, b) => b.total_cost_cents - a.total_cost_cents);

  const total_minutes = per_role.reduce((s, r) => s + r.minutes, 0);
  const total_labor_cost_cents = per_role.reduce((s, r) => s + r.total_cost_cents, 0);

  return {
    per_role,
    total_minutes,
    total_hours: +(total_minutes / 60).toFixed(2),
    total_labor_cost_cents,
    has_missing_times: hasMissingTimes,
  };
}

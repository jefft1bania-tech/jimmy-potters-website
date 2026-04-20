// Hiring assistant: fully-loaded cost comparison (W-2 / 1099 / temp / piece-rate).
// Pure functions. All monetary values in integer cents.

import { FL_W2_BURDEN, type EmployerBurdenConfig } from './forecast';

export type HireScenarioInput = {
  scenario_name: string;
  base_rate_cents: number;       // hourly base wage OR hourly equivalent contract rate
  weekly_hours: number;
  duration_weeks: number;
  employer_burden?: EmployerBurdenConfig; // defaults to FL_W2_BURDEN
  temp_agency_markup_pct?: number;         // e.g. 0.5 = 50% markup on pay rate
  piece_rate_cents_per_unit?: number;
  units_per_hour?: number;                 // used to compute effective hourly for piece rate
};

export type HireScenarioOutput = {
  scenario_name: string;
  total_hours: number;
  base_pay_only_cents: number;
  fully_loaded: {
    hourly_w2: number | null;
    contract_1099: number | null;
    temp_agency: number | null;
    piece_rate: number | null;
  };
  piece_rate_effective_hourly_cents: number | null;
  burden_pct_w2: number;
};

export function computeHireScenario(input: HireScenarioInput): HireScenarioOutput {
  const total_hours = input.weekly_hours * input.duration_weeks;
  const base_pay_only_cents = Math.round(total_hours * input.base_rate_cents);

  const burden = input.employer_burden ?? FL_W2_BURDEN;
  const burden_pct =
    burden.fica_pct + burden.futa_pct + burden.state_reemployment_pct +
    burden.workers_comp_pct + burden.extra_benefits_pct;

  const hourly_w2 = Math.round(base_pay_only_cents * (1 + burden_pct));

  // 1099: no employer burden. Contractor self-pays SE tax.
  const contract_1099 = base_pay_only_cents;

  // Temp agency: markup over pay rate.
  const tempMarkup = input.temp_agency_markup_pct;
  const temp_agency = tempMarkup != null
    ? Math.round(base_pay_only_cents * (1 + tempMarkup))
    : null;

  // Piece-rate: if units_per_hour and cents_per_unit provided, compute effective hourly.
  let piece_rate: number | null = null;
  let piece_rate_effective_hourly_cents: number | null = null;
  if (input.piece_rate_cents_per_unit != null && input.units_per_hour != null) {
    piece_rate_effective_hourly_cents = input.piece_rate_cents_per_unit * input.units_per_hour;
    piece_rate = piece_rate_effective_hourly_cents * total_hours;
  }

  return {
    scenario_name: input.scenario_name,
    total_hours,
    base_pay_only_cents,
    fully_loaded: {
      hourly_w2,
      contract_1099,
      temp_agency,
      piece_rate,
    },
    piece_rate_effective_hourly_cents,
    burden_pct_w2: +burden_pct.toFixed(4),
  };
}

export function recommendFromScenario(output: HireScenarioOutput): string {
  const raw: Array<{ label: string; cost: number | null }> = [
    { label: 'hourly W-2', cost: output.fully_loaded.hourly_w2 },
    { label: '1099 contractor', cost: output.fully_loaded.contract_1099 },
    { label: 'temp agency', cost: output.fully_loaded.temp_agency },
    { label: 'piece rate', cost: output.fully_loaded.piece_rate },
  ];
  const options: Array<{ label: string; cost: number }> = raw
    .filter((o): o is { label: string; cost: number } => o.cost != null);

  options.sort((a, b) => a.cost - b.cost);
  const cheapest = options[0];
  const mostExpensive = options[options.length - 1];

  const deltaCents = mostExpensive.cost - cheapest.cost;
  return `Cheapest option: ${cheapest.label} at $${(cheapest.cost / 100).toFixed(2)}; ` +
    `most expensive: ${mostExpensive.label} at $${(mostExpensive.cost / 100).toFixed(2)} ` +
    `(delta $${(deltaCents / 100).toFixed(2)}). 1099 avoids employer tax but adds misclassification risk ` +
    `if you control schedule/method — consult CPA before defaulting to it for recurring roles.`;
}

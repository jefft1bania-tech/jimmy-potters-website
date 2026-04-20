'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/server';
import { computeHireScenario, recommendFromScenario, type HireScenarioOutput } from '@/lib/labor/hiring';

export type ActionResult =
  | { ok: true; message: string; output: HireScenarioOutput; recommendation: string }
  | { ok: false; error: string };

function num(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const n = parseFloat(raw);
  return isFinite(n) ? n : null;
}

function centsFromDollars(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const n = parseFloat(raw.replace(/[$,]/g, ''));
  return isFinite(n) ? Math.round(n * 100) : null;
}

export async function runAndMaybeSaveScenario(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'Forbidden' };
  }

  const scenario_name = typeof formData.get('scenario_name') === 'string' ? (formData.get('scenario_name') as string).trim() : '';
  const role_id = typeof formData.get('role_id') === 'string' ? (formData.get('role_id') as string).trim() : '';
  const weekly_hours = num(formData.get('weekly_hours'));
  const duration_weeks = num(formData.get('duration_weeks'));
  const base_rate_cents = centsFromDollars(formData.get('base_rate'));
  const temp_agency_markup_pct_raw = num(formData.get('temp_agency_markup_pct'));
  const piece_rate_cents_per_unit = centsFromDollars(formData.get('piece_rate_per_unit'));
  const units_per_hour = num(formData.get('units_per_hour'));
  const save = formData.get('save') === 'true';

  if (!scenario_name) return { ok: false, error: 'Missing scenario name' };
  if (weekly_hours == null || weekly_hours <= 0) return { ok: false, error: 'weekly_hours must be > 0' };
  if (duration_weeks == null || duration_weeks <= 0) return { ok: false, error: 'duration_weeks must be > 0' };
  if (base_rate_cents == null || base_rate_cents < 0) return { ok: false, error: 'base_rate must be >= 0' };

  const temp_agency_markup_pct =
    temp_agency_markup_pct_raw != null && temp_agency_markup_pct_raw >= 0
      ? temp_agency_markup_pct_raw / 100
      : undefined;

  const output = computeHireScenario({
    scenario_name,
    base_rate_cents,
    weekly_hours,
    duration_weeks,
    temp_agency_markup_pct,
    piece_rate_cents_per_unit: piece_rate_cents_per_unit ?? undefined,
    units_per_hour: units_per_hour ?? undefined,
  });

  const recommendation = recommendFromScenario(output);

  if (save) {
    const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
    const { error } = await supabase.from('hire_scenarios').insert({
      role_id: role_id || null,
      scenario_name,
      weekly_hours_est: weekly_hours,
      duration_weeks_est: duration_weeks,
      base_rate_cents_input: base_rate_cents,
      fully_loaded_cost_cents_hourly_w2: output.fully_loaded.hourly_w2,
      fully_loaded_cost_cents_1099: output.fully_loaded.contract_1099,
      fully_loaded_cost_cents_temp_agency: output.fully_loaded.temp_agency,
      fully_loaded_cost_cents_piece_rate: output.fully_loaded.piece_rate,
      ai_recommendation: recommendation,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath('/admin/labor/hire');
  }

  return {
    ok: true,
    message: save ? `Saved ${scenario_name}` : `Ran ${scenario_name}`,
    output,
    recommendation,
  };
}

export async function deleteScenario(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'Forbidden' };
  }
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { error } = await supabase.from('hire_scenarios').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/labor/hire');
  return { ok: true };
}

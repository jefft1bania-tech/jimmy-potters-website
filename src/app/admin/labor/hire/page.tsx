import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import HireScenarioForm, { type RoleOption } from './HireScenarioForm';
import SavedScenariosList, { type SavedScenario } from './SavedScenariosList';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Hire Comparison — Admin — Jimmy Potters', robots: 'noindex, nofollow' };

type ScenarioRow = {
  id: string;
  scenario_name: string;
  weekly_hours_est: number | string;
  duration_weeks_est: number | string;
  base_rate_cents_input: number;
  fully_loaded_cost_cents_hourly_w2: number | null;
  fully_loaded_cost_cents_1099: number | null;
  fully_loaded_cost_cents_temp_agency: number | null;
  fully_loaded_cost_cents_piece_rate: number | null;
  ai_recommendation: string | null;
  generated_at: string;
  labor_roles: { display_name: string } | null;
};

export default async function HireComparisonPage() {
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };

  const [rolesRes, scenariosRes] = await Promise.all([
    supabase
      .from('labor_roles')
      .select('id, role_key, display_name, default_hourly_rate_cents')
      .order('display_name'),
    supabase
      .from('hire_scenarios')
      .select(
        'id, scenario_name, weekly_hours_est, duration_weeks_est, base_rate_cents_input, fully_loaded_cost_cents_hourly_w2, fully_loaded_cost_cents_1099, fully_loaded_cost_cents_temp_agency, fully_loaded_cost_cents_piece_rate, ai_recommendation, generated_at, labor_roles(display_name)',
      )
      .order('generated_at', { ascending: false })
      .limit(20),
  ]);

  const roles = (rolesRes.data ?? []) as RoleOption[];
  const rawScenarios = (scenariosRes.data ?? []) as ScenarioRow[];

  const scenarios: SavedScenario[] = rawScenarios.map((r) => ({
    id: r.id,
    scenario_name: r.scenario_name,
    role_display_name: r.labor_roles?.display_name ?? null,
    weekly_hours_est:
      typeof r.weekly_hours_est === 'string' ? parseFloat(r.weekly_hours_est) : r.weekly_hours_est,
    duration_weeks_est:
      typeof r.duration_weeks_est === 'string' ? parseFloat(r.duration_weeks_est) : r.duration_weeks_est,
    base_rate_cents_input: r.base_rate_cents_input,
    fully_loaded_cost_cents_hourly_w2: r.fully_loaded_cost_cents_hourly_w2,
    fully_loaded_cost_cents_1099: r.fully_loaded_cost_cents_1099,
    fully_loaded_cost_cents_temp_agency: r.fully_loaded_cost_cents_temp_agency,
    fully_loaded_cost_cents_piece_rate: r.fully_loaded_cost_cents_piece_rate,
    ai_recommendation: r.ai_recommendation,
    generated_at: r.generated_at,
  }));

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · Labor · Hire Comparison
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">
              W-2 vs 1099 vs Temp vs Piece
            </h1>
            <p className="text-stone-400 text-sm font-body mt-2">
              Fully-loaded cost comparison for a new hire. W-2 uses Florida employer burden defaults
              (FICA + FUTA + state re-employment + workers' comp ≈ 12.95%). 1099 excludes employer burden.
              Temp agency adds a markup on top of pay. Piece rate needs <span className="font-mono">units/hr</span>
              to convert to an effective hourly.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← Dashboard
            </Link>
            <Link href="/admin/labor/roles" className="btn-faire !w-auto">Manage Roles</Link>
          </nav>
        </header>

        {roles.length === 0 ? (
          <div className="card-faire-detail p-6 border border-amber-500/40">
            <p className="text-amber-300 text-sm">
              No labor roles yet.{' '}
              <Link href="/admin/labor/roles" className="underline hover:text-[#C9A96E]">
                Add a role first →
              </Link>
            </p>
          </div>
        ) : (
          <section className="mb-8">
            <HireScenarioForm roles={roles} />
          </section>
        )}

        <section>
          <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
            Recent scenarios
          </h2>
          <SavedScenariosList scenarios={scenarios} />
        </section>
      </div>
    </main>
  );
}

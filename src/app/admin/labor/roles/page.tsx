import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import LaborRoleForm, { type LaborRole } from './LaborRoleForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Labor Roles — Admin — Jimmy Potters', robots: 'noindex, nofollow' };

async function loadRoles(): Promise<LaborRole[]> {
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { data } = await supabase
    .from('labor_roles')
    .select('id, role_key, display_name, default_hourly_rate_cents, default_contract_rate_cents, default_piece_rate_cents, tax_treatment, notes')
    .order('display_name', { ascending: true });
  return (data ?? []) as LaborRole[];
}

export default async function LaborRolesPage() {
  const roles = await loadRoles();

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · Labor · Roles
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">
              Labor Roles
            </h1>
            <p className="text-stone-400 text-sm font-body mt-2">
              Every role that performs work on a pottery order — throwing, trimming, glazing, kiln
              ops, packing, shipping. Drives the per-order labor forecast and the hiring comparison.
            </p>
            <p className="text-stone-500 text-xs font-body mt-2">
              <span className="font-mono text-stone-300">{roles.length}</span> role
              {roles.length === 1 ? '' : 's'} seeded
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← Dashboard
            </Link>
            <Link href="/admin/labor/hire" className="btn-faire !w-auto">Hire Comparison</Link>
            <Link href="/admin/products/labor-times" className="btn-faire !w-auto">Product Labor Times</Link>
          </nav>
        </header>

        <section className="mb-6">
          <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
            Add new role
          </h2>
          <LaborRoleForm existing={null} />
        </section>

        <section>
          <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
            Existing roles
          </h2>
          {roles.length === 0 ? (
            <div className="card-faire-detail p-6 border border-stone-700">
              <p className="text-stone-400 text-sm">No roles yet. Add one above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {roles.map((r) => (
                <LaborRoleForm key={r.id} existing={r} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

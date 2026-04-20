import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAllProducts } from '@/lib/products';
import ProductLaborTimesRow from './ProductLaborTimesRow';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Product Labor Times — Admin — Jimmy Potters', robots: 'noindex, nofollow' };

type RoleRow = {
  id: string;
  role_key: string;
  display_name: string;
  default_hourly_rate_cents: number;
};

type TimeRow = {
  product_id: string;
  role_id: string;
  minutes_per_unit: number | string;
};

async function loadRolesAndTimes(): Promise<{
  roles: RoleRow[];
  timesByProduct: Map<string, Map<string, number>>;
}> {
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const [rolesRes, timesRes] = await Promise.all([
    supabase
      .from('labor_roles')
      .select('id, role_key, display_name, default_hourly_rate_cents')
      .order('display_name'),
    supabase.from('product_labor_times').select('product_id, role_id, minutes_per_unit'),
  ]);

  const roles = (rolesRes.data ?? []) as RoleRow[];
  const timesByProduct = new Map<string, Map<string, number>>();
  for (const t of (timesRes.data ?? []) as TimeRow[]) {
    const mins = typeof t.minutes_per_unit === 'string' ? parseFloat(t.minutes_per_unit) : t.minutes_per_unit;
    if (!isFinite(mins as number)) continue;
    if (!timesByProduct.has(t.product_id)) timesByProduct.set(t.product_id, new Map());
    timesByProduct.get(t.product_id)!.set(t.role_id, mins as number);
  }
  return { roles, timesByProduct };
}

export default async function ProductLaborTimesPage() {
  const products = getAllProducts();
  const { roles, timesByProduct } = await loadRolesAndTimes();

  let covered = 0;
  for (const p of products) if ((timesByProduct.get(p.id)?.size ?? 0) > 0) covered++;
  const uncoveredCount = products.length - covered;
  const coverageTone =
    uncoveredCount === 0 ? 'text-emerald-300' : uncoveredCount <= 2 ? 'text-amber-300' : 'text-red-300';

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · Product Labor Times
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">
              Minutes per Unit
            </h1>
            <p className="text-stone-400 text-sm font-body mt-2">
              How long each role spends on one unit of each SKU. Feeds the per-order labor forecast.
              Leave a role at 0 to mark it as not applicable for the product.
            </p>
            <p className={`font-heading font-bold text-sm mt-2 ${coverageTone}`}>
              {covered} / {products.length} SKUs have at least one role mapped
              {uncoveredCount > 0 && (
                <span className="text-stone-400 font-normal"> · {uncoveredCount} missing</span>
              )}
            </p>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← Dashboard
            </Link>
            <Link href="/admin/products/costs" className="btn-faire !w-auto">
              Cost Templates
            </Link>
          </nav>
        </header>

        {roles.length === 0 ? (
          <div className="card-faire-detail p-6 border border-amber-500/40">
            <p className="text-amber-300 text-sm">
              No labor roles seeded yet. Seed roles through the Supabase migration or the (upcoming)
              /admin/labor/roles page before mapping minutes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <ProductLaborTimesRow
                key={p.id}
                productId={p.id}
                productName={p.name}
                roles={roles}
                existing={timesByProduct.get(p.id) ?? new Map()}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

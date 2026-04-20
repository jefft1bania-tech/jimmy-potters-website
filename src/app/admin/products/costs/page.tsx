import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAllProducts } from '@/lib/products';
import ProductCostRow from './ProductCostRow';
import type { ProductCostTemplate } from '@/lib/pnl';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Product Costs — Admin — Jimmy Potters', robots: 'noindex, nofollow' };

async function loadTemplates(): Promise<Map<string, ProductCostTemplate>> {
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { data } = await supabase
    .from('product_costs')
    .select('product_id, materials_cents, labor_cents, packaging_cents, freight_cents, other_cents');
  const map = new Map<string, ProductCostTemplate>();
  for (const row of (data ?? []) as ProductCostTemplate[]) map.set(row.product_id, row);
  return map;
}

export default async function ProductCostsPage() {
  const products = getAllProducts();
  const templates = await loadTemplates();

  const coveredCount = products.filter((p) => templates.has(p.id)).length;
  const uncoveredCount = products.length - coveredCount;
  const coverageTone =
    uncoveredCount === 0 ? 'text-emerald-300' : uncoveredCount <= 2 ? 'text-amber-300' : 'text-red-300';

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · Product Costs
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">
              Cost Templates
            </h1>
            <p className="text-stone-400 text-sm font-body mt-2">
              Materials · Labor · Packaging · Freight · Other — per SKU. Used as the P&amp;L baseline;
              each order can override these on its detail page.
            </p>
            <p className={`font-heading font-bold text-sm mt-2 ${coverageTone}`}>
              {coveredCount} / {products.length} SKUs covered
              {uncoveredCount > 0 && <span className="text-stone-400 font-normal"> · {uncoveredCount} missing</span>}
            </p>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← Dashboard
            </Link>
            <Link href="/admin/expenses" className="btn-faire !w-auto">Overhead Expenses</Link>
          </nav>
        </header>

        <div className="space-y-3">
          {products.map((p) => (
            <ProductCostRow
              key={p.id}
              productId={p.id}
              productName={p.name}
              priceCents={p.price}
              existing={templates.get(p.id) ?? null}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

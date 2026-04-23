import Link from 'next/link';
import { loadProformaPageData } from '@/lib/proforma-data';
import ProformaScenarioPanel from './ProformaScenarioPanel';
import CapacityMatrix from './CapacityMatrix';
import SavedProformasList from './SavedProformasList';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Wholesale Proforma — Admin — Jimmy Potters',
  robots: 'noindex, nofollow',
};

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmtCents = (c: number) => USD.format(c / 100);

export default async function ProformaPage() {
  const { skus, skuInputs, saved } = await loadProformaPageData();

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · P&amp;L · Wholesale Proforma
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">
              Wholesale Scenario Planner
            </h1>
            <p className="text-stone-400 text-sm font-body mt-2">
              Model 25-pot wholesale lots across N concurrent buyers on a 2-week delivery window.
              Vary kilns (capacity) and wholesale price multiplier (revenue). Capacity banner
              fires when buyer demand exceeds kiln throughput at{' '}
              <span className="font-mono text-stone-300">52 pots/firing × 2 firings/week</span>.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← Dashboard
            </Link>
            <Link href="/admin/pnl" className="text-xs text-stone-400 hover:text-stone-200 underline">
              P&amp;L Report
            </Link>
            <Link href="/admin/pnl/drilldown" className="text-xs text-stone-400 hover:text-stone-200 underline">
              Drilldown
            </Link>
            <Link href="/admin/pnl/statement" className="text-xs text-stone-400 hover:text-stone-200 underline">
              CPA Statement
            </Link>
          </nav>
        </header>

        {skus.length === 0 ? (
          <div className="card-faire-detail p-6 border border-amber-500/40">
            <p className="text-amber-300 text-sm">
              No live SKUs found in <code className="font-mono">data/products.json</code>. Populate the
              catalog first, then reload this page.
            </p>
          </div>
        ) : (
          <>
            <section className="mb-8">
              <ProformaScenarioPanel skuInputs={skuInputs} />
            </section>

            <section className="mb-8">
              <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
                Capacity Matrix · kilns × buyers
              </h2>
              <CapacityMatrix skuInputs={skuInputs} />
            </section>

            <section className="mb-8">
              <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
                Saved Scenarios
              </h2>
              <SavedProformasList rows={saved} fmtCents={fmtCents} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}

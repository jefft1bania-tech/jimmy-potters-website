import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import InsightsChat from './InsightsChat';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Insights — Admin — Jimmy Potters', robots: 'noindex, nofollow' };

type Row = {
  id: string;
  query_text: string;
  response_markdown: string;
  generated_at: string;
};

async function loadRecent(): Promise<Row[]> {
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { data } = await supabase
    .from('ai_insights')
    .select('id, query_text, response_markdown, generated_at')
    .order('generated_at', { ascending: false })
    .limit(10);
  return (data ?? []) as Row[];
}

export default async function InsightsPage() {
  const recent = await loadRecent();
  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · Insights
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">
              Ask the Business
            </h1>
            <p className="text-stone-400 text-sm font-body mt-2">
              Typed or voice questions, answered from live P&amp;L + margins + shipments + docs state.
              Responses cache for 30 min on identical queries against the same snapshot.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← Dashboard
            </Link>
            <Link href="/admin/pnl" className="btn-faire !w-auto">P&amp;L</Link>
            <Link href="/admin/margins" className="btn-faire !w-auto">Margins</Link>
          </nav>
        </header>

        <InsightsChat initialInsights={recent} />
      </div>
    </main>
  );
}

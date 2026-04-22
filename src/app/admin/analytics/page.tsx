import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Analytics — Admin — Jimmy Potters', robots: 'noindex, nofollow' };

type Overview = {
  uv_today: number;
  uv_7d: number;
  uv_30d: number;
  pv_today: number;
  pv_7d: number;
  wholesale_apply_7d: number;
  wholesale_apply_30d: number;
  checkout_complete_7d: number;
  bounce_rate_7d: number;
  avg_session_sec_7d: number;
};

type SourceRow = {
  traffic_source: string;
  sessions: number;
  applications: number;
};

type PathRow = {
  path: string;
  views: number;
};

type CountryRow = {
  country: string;
  sessions: number;
};

type QueryRow = {
  utm_term: string;
  sessions: number;
};

async function loadData() {
  const supabase = createSupabaseAdminClient() as unknown as {
    from: (t: string) => any;
    rpc: (fn: string) => any;
  };

  const since7dIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since30dIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Top-line overview (materialized view).
  const { data: overviewRows } = await supabase.from('vw_analytics_overview').select('*').limit(1);
  const overview: Overview = (overviewRows?.[0] as Overview) ?? {
    uv_today: 0, uv_7d: 0, uv_30d: 0, pv_today: 0, pv_7d: 0,
    wholesale_apply_7d: 0, wholesale_apply_30d: 0, checkout_complete_7d: 0,
    bounce_rate_7d: 0, avg_session_sec_7d: 0,
  };

  // Traffic source breakdown (30d, non-bot).
  const { data: sessions30d } = await supabase
    .from('website_sessions')
    .select('traffic_source, is_wholesale')
    .gte('started_at', since30dIso)
    .eq('is_bot', false);

  const sourceMap = new Map<string, { sessions: number; applications: number }>();
  for (const s of (sessions30d ?? []) as Array<{ traffic_source: string; is_wholesale: boolean }>) {
    const key = s.traffic_source || 'unknown';
    const cur = sourceMap.get(key) ?? { sessions: 0, applications: 0 };
    cur.sessions += 1;
    if (s.is_wholesale) cur.applications += 1;
    sourceMap.set(key, cur);
  }
  const sources: SourceRow[] = Array.from(sourceMap.entries())
    .map(([traffic_source, v]) => ({ traffic_source, ...v }))
    .sort((a, b) => b.sessions - a.sessions);

  // Top pages (7d, non-bot).
  const { data: pageViews7d } = await supabase
    .from('website_page_views')
    .select('path')
    .gte('created_at', since7dIso)
    .eq('is_bot', false)
    .limit(5000);

  const pathMap = new Map<string, number>();
  for (const p of (pageViews7d ?? []) as Array<{ path: string }>) {
    pathMap.set(p.path, (pathMap.get(p.path) ?? 0) + 1);
  }
  const topPages: PathRow[] = Array.from(pathMap.entries())
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 15);

  // Geo (30d, non-bot) — lean second query just for country.
  const countryMap = new Map<string, number>();
  const { data: geoSessions } = await supabase
    .from('website_sessions')
    .select('country')
    .gte('started_at', since30dIso)
    .eq('is_bot', false);
  for (const s of (geoSessions ?? []) as Array<{ country: string | null }>) {
    const key = s.country || 'Unknown';
    countryMap.set(key, (countryMap.get(key) ?? 0) + 1);
  }
  const countries: CountryRow[] = Array.from(countryMap.entries())
    .map(([country, sessions]) => ({ country, sessions }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);

  // UTM term queries (proxy for search terms — Google strips the real query).
  const { data: termSessions } = await supabase
    .from('website_sessions')
    .select('utm_term')
    .gte('started_at', since30dIso)
    .eq('is_bot', false)
    .not('utm_term', 'is', null);
  const termMap = new Map<string, number>();
  for (const s of (termSessions ?? []) as Array<{ utm_term: string | null }>) {
    if (!s.utm_term) continue;
    termMap.set(s.utm_term, (termMap.get(s.utm_term) ?? 0) + 1);
  }
  const queries: QueryRow[] = Array.from(termMap.entries())
    .map(([utm_term, sessions]) => ({ utm_term, sessions }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);

  // Funnel (30d): retail — home → product → checkout_start → checkout_complete
  //               wholesale — /wholesale visit → wholesale_apply_submit
  const { count: homeVisits } = await supabase
    .from('website_page_views')
    .select('*', { count: 'exact', head: true })
    .eq('is_bot', false)
    .eq('path', '/')
    .gte('created_at', since30dIso);

  const { count: productVisits } = await supabase
    .from('website_page_views')
    .select('*', { count: 'exact', head: true })
    .eq('is_bot', false)
    .like('path', '/shop%')
    .gte('created_at', since30dIso);

  const { count: addCart } = await supabase
    .from('website_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_name', 'add_to_cart')
    .gte('created_at', since30dIso);

  const { count: checkoutStarts } = await supabase
    .from('website_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_name', 'checkout_start')
    .gte('created_at', since30dIso);

  const { count: checkoutCompletes } = await supabase
    .from('website_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_name', 'checkout_complete')
    .gte('created_at', since30dIso);

  const { count: wholesaleVisits } = await supabase
    .from('website_page_views')
    .select('*', { count: 'exact', head: true })
    .eq('is_bot', false)
    .eq('path', '/wholesale')
    .gte('created_at', since30dIso);

  const { count: wholesaleSubmits } = await supabase
    .from('website_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_name', 'wholesale_apply_submit')
    .gte('created_at', since30dIso);

  return {
    overview,
    sources,
    topPages,
    countries,
    queries,
    funnel: {
      home: homeVisits ?? 0,
      product: productVisits ?? 0,
      add_to_cart: addCart ?? 0,
      checkout_start: checkoutStarts ?? 0,
      checkout_complete: checkoutCompletes ?? 0,
      wholesale_visit: wholesaleVisits ?? 0,
      wholesale_submit: wholesaleSubmits ?? 0,
    },
  };
}

function fmtInt(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n));
}

function fmtPct(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

function fmtDuration(sec: number): string {
  if (!sec || sec < 1) return '0s';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

const SOURCE_LABELS: Record<string, string> = {
  google_organic: 'Google (Organic)',
  google_paid: 'Google (Paid)',
  search_other: 'Other Search',
  social: 'Social',
  referral: 'Referral',
  direct: 'Direct',
  other: 'Other',
  unknown: 'Unknown',
};

export default async function AnalyticsPage() {
  const data = await loadData();
  const { overview, sources, topPages, countries, queries, funnel } = data;

  const wholesaleConvPct = funnel.wholesale_visit > 0
    ? (funnel.wholesale_submit / funnel.wholesale_visit)
    : 0;
  const checkoutConvPct = funnel.add_to_cart > 0
    ? (funnel.checkout_complete / funnel.add_to_cart)
    : 0;

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · Analytics
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">
              Website Traffic & Brand Signals
            </h1>
            <p className="text-stone-400 text-sm font-body mt-2">
              Self-hosted analytics — no third-party tracker, no cookies beyond our own. DNT respected.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← Dashboard
            </Link>
            <Link href="/admin/insights" className="btn-faire !w-auto">Insights</Link>
          </nav>
        </header>

        {/* Top-line cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card label="Visitors Today" value={fmtInt(overview.uv_today)} sub={`${fmtInt(overview.pv_today)} page views`} />
          <Card label="Visitors 7d" value={fmtInt(overview.uv_7d)} sub={`${fmtInt(overview.pv_7d)} page views`} />
          <Card label="Visitors 30d" value={fmtInt(overview.uv_30d)} />
          <Card
            label="Wholesale Apps 7d"
            value={fmtInt(overview.wholesale_apply_7d)}
            sub={`${fmtInt(overview.wholesale_apply_30d)} in 30d`}
            tone={overview.wholesale_apply_7d > 0 ? 'good' : 'default'}
          />
        </section>

        <section className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card label="Checkouts 7d" value={fmtInt(overview.checkout_complete_7d)} tone={overview.checkout_complete_7d > 0 ? 'good' : 'default'} />
          <Card label="Avg Session" value={fmtDuration(overview.avg_session_sec_7d)} sub="7d, non-bot" />
          <Card label="Bounce Rate" value={fmtPct(overview.bounce_rate_7d, 0)} sub="Sessions with ≤1 page" tone={overview.bounce_rate_7d > 0.7 ? 'warn' : 'default'} />
          <Card label="Wholesale Conv" value={fmtPct(wholesaleConvPct, 1)} sub={`${funnel.wholesale_submit} / ${funnel.wholesale_visit} visits`} tone={wholesaleConvPct > 0.02 ? 'good' : 'default'} />
        </section>

        {/* Traffic sources */}
        <section className="mt-8">
          <h2 className="font-heading font-bold text-white text-lg mb-3">Traffic Sources (30d)</h2>
          <div className="card-faire-detail p-0 overflow-hidden">
            <table className="w-full text-sm font-body">
              <thead className="bg-stone-900/60 text-stone-400 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">Source</th>
                  <th className="text-right p-3">Sessions</th>
                  <th className="text-right p-3">Wholesale Apps</th>
                  <th className="text-right p-3">App / Session</th>
                </tr>
              </thead>
              <tbody>
                {sources.length === 0 ? (
                  <tr><td colSpan={4} className="p-6 text-center text-stone-500">No traffic yet.</td></tr>
                ) : sources.map((row) => {
                  const rate = row.sessions > 0 ? row.applications / row.sessions : 0;
                  return (
                    <tr key={row.traffic_source} className="border-t border-stone-800/80">
                      <td className="p-3 text-stone-200">{SOURCE_LABELS[row.traffic_source] || row.traffic_source}</td>
                      <td className="p-3 text-right text-stone-300 tabular-nums">{fmtInt(row.sessions)}</td>
                      <td className="p-3 text-right text-stone-300 tabular-nums">{fmtInt(row.applications)}</td>
                      <td className="p-3 text-right text-stone-400 tabular-nums">{fmtPct(rate, 1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Search queries */}
        <section className="mt-8">
          <h2 className="font-heading font-bold text-white text-lg mb-1">Search Queries (30d)</h2>
          <p className="text-[11px] text-stone-500 font-body mb-3">
            Google strips the query string from HTTPS referrers, so only explicit UTM-tagged
            campaigns surface here. Phase 2: wire up Google Search Console API to capture real organic queries.
          </p>
          <div className="card-faire-detail p-0 overflow-hidden">
            <table className="w-full text-sm font-body">
              <thead className="bg-stone-900/60 text-stone-400 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">UTM Term</th>
                  <th className="text-right p-3">Sessions</th>
                </tr>
              </thead>
              <tbody>
                {queries.length === 0 ? (
                  <tr><td colSpan={2} className="p-6 text-center text-stone-500">
                    No UTM-tagged searches yet. Add ?utm_source=google&amp;utm_term=… to campaign links to populate this.
                  </td></tr>
                ) : queries.map((q) => (
                  <tr key={q.utm_term} className="border-t border-stone-800/80">
                    <td className="p-3 text-stone-200 font-mono text-xs">{q.utm_term}</td>
                    <td className="p-3 text-right text-stone-300 tabular-nums">{fmtInt(q.sessions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Funnels */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="font-heading font-bold text-white text-lg mb-3">Wholesale Funnel (30d)</h2>
            <FunnelList
              rows={[
                { label: 'Visited /wholesale', count: funnel.wholesale_visit },
                { label: 'Submitted application', count: funnel.wholesale_submit },
              ]}
            />
            <p className="text-xs text-stone-500 mt-2 font-body">
              Conversion: <span className="text-stone-300 font-semibold">{fmtPct(wholesaleConvPct, 1)}</span>
            </p>
          </div>
          <div>
            <h2 className="font-heading font-bold text-white text-lg mb-3">Retail Checkout Funnel (30d)</h2>
            <FunnelList
              rows={[
                { label: 'Home views', count: funnel.home },
                { label: 'Shop views', count: funnel.product },
                { label: 'Add to cart', count: funnel.add_to_cart },
                { label: 'Checkout started', count: funnel.checkout_start },
                { label: 'Checkout complete', count: funnel.checkout_complete },
              ]}
            />
            <p className="text-xs text-stone-500 mt-2 font-body">
              Cart → paid: <span className="text-stone-300 font-semibold">{fmtPct(checkoutConvPct, 1)}</span>
            </p>
          </div>
        </section>

        {/* Top pages + Geo */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="font-heading font-bold text-white text-lg mb-3">Top Pages (7d)</h2>
            <div className="card-faire-detail p-0 overflow-hidden">
              <table className="w-full text-sm font-body">
                <tbody>
                  {topPages.length === 0 ? (
                    <tr><td colSpan={2} className="p-6 text-center text-stone-500">No page views yet.</td></tr>
                  ) : topPages.map((p) => (
                    <tr key={p.path} className="border-t border-stone-800/80 first:border-t-0">
                      <td className="p-3 text-stone-200 font-mono text-xs break-all">{p.path}</td>
                      <td className="p-3 text-right text-stone-300 tabular-nums w-24">{fmtInt(p.views)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h2 className="font-heading font-bold text-white text-lg mb-3">Top Countries (30d)</h2>
            <div className="card-faire-detail p-0 overflow-hidden">
              <table className="w-full text-sm font-body">
                <tbody>
                  {countries.length === 0 ? (
                    <tr><td colSpan={2} className="p-6 text-center text-stone-500">No geo data yet (Vercel geo headers populate in prod).</td></tr>
                  ) : countries.map((c) => (
                    <tr key={c.country} className="border-t border-stone-800/80 first:border-t-0">
                      <td className="p-3 text-stone-200">{c.country}</td>
                      <td className="p-3 text-right text-stone-300 tabular-nums w-24">{fmtInt(c.sessions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <p className="text-[11px] text-stone-600 font-body mt-10">
          All numbers exclude bot traffic (UA filter: googlebot / bingbot / crawl / spider / curl / headless / etc.).
          DNT users are logged anonymously at the server layer only — no UA, no geo.
        </p>
      </div>
    </main>
  );
}

function Card({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'good' | 'warn' | 'danger';
}) {
  const toneRing = {
    default: 'border-stone-700/40',
    good: 'border-emerald-500/40',
    warn: 'border-amber-500/40',
    danger: 'border-red-500/40',
  }[tone];
  const toneValue = {
    default: 'text-white',
    good: 'text-emerald-300',
    warn: 'text-amber-300',
    danger: 'text-red-300',
  }[tone];
  return (
    <div className={`card-faire-detail p-5 border ${toneRing}`}>
      <p className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">{label}</p>
      <p className={`font-heading font-black text-2xl mt-2 ${toneValue}`}>{value}</p>
      {sub && <p className="text-stone-500 text-[11px] font-body mt-2">{sub}</p>}
    </div>
  );
}

function FunnelList({ rows }: { rows: Array<{ label: string; count: number }> }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="card-faire-detail p-0 overflow-hidden">
      {rows.map((r, i) => {
        const pct = (r.count / max) * 100;
        return (
          <div key={r.label} className={`p-3 ${i > 0 ? 'border-t border-stone-800/80' : ''}`}>
            <div className="flex items-center justify-between text-sm font-body mb-1.5">
              <span className="text-stone-200">{r.label}</span>
              <span className="text-stone-300 tabular-nums">{fmtInt(r.count)}</span>
            </div>
            <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#C9A96E] h-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

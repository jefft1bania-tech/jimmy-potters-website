/**
 * Server-side analytics helpers. No client imports — this module uses the
 * service-role key and is safe only under app/api/** and middleware.ts.
 *
 * Chain of thought (audit trail for Jeff):
 *  1. Jeff wants: "how many visitors today, where from, did any apply
 *     wholesale". Server-side capture is adblock-proof and gets Vercel geo
 *     for free via request headers.
 *  2. Client enrichment (scroll + time-on-page) lands later via
 *     /api/track/event with the same session_id. No aggregation in the hot
 *     path — the dashboard does it at read time from indexed columns.
 *  3. Bot UA filter runs at insert time so the dashboard doesn't have to
 *     re-apply it on every query. Filter list is intentionally minimal —
 *     broad "bot" substring catches googlebot, bingbot, ahrefsbot, etc.
 *     without lockstep maintenance.
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const BOT_SIGNATURES = [
  'bot', 'crawl', 'spider', 'slurp', 'preview', 'monitor',
  'fetch', 'axios/', 'curl/', 'wget/', 'headless', 'lighthouse',
  'pagespeed', 'scrape', 'python-requests', 'okhttp',
];

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return true; // no UA → almost always bot/tool
  const lower = ua.toLowerCase();
  return BOT_SIGNATURES.some((sig) => lower.includes(sig));
}

export function detectDevice(ua: string | null | undefined): string {
  if (!ua) return 'unknown';
  const s = ua.toLowerCase();
  if (/ipad|tablet/.test(s)) return 'tablet';
  if (/mobile|iphone|android(?!.*tablet)/.test(s)) return 'mobile';
  return 'desktop';
}

export function detectBrowser(ua: string | null | undefined): string {
  if (!ua) return 'unknown';
  const s = ua.toLowerCase();
  if (s.includes('edg/')) return 'edge';
  if (s.includes('chrome/')) return 'chrome';
  if (s.includes('firefox/')) return 'firefox';
  if (s.includes('safari/') && !s.includes('chrome/')) return 'safari';
  return 'other';
}

export function detectOs(ua: string | null | undefined): string {
  if (!ua) return 'unknown';
  const s = ua.toLowerCase();
  if (s.includes('windows')) return 'windows';
  if (s.includes('mac os') || s.includes('macintosh')) return 'macos';
  if (s.includes('android')) return 'android';
  if (s.includes('iphone') || s.includes('ipad') || s.includes('ios')) return 'ios';
  if (s.includes('linux')) return 'linux';
  return 'other';
}

export function extractReferrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Classify traffic source from referrer + utm_* signals.
 *   google_organic — referrer is google.* and no utm_medium=cpc/paid
 *   google_paid    — utm_source=google and utm_medium in (cpc, paid, ppc)
 *   social         — referrer is a known social host
 *   referral       — some other referrer host
 *   direct         — no referrer, no utms
 *   other          — utm-tagged but doesn't fit above buckets
 */
export function classifyTrafficSource(
  referrerHost: string | null,
  utmSource: string | null,
  utmMedium: string | null,
): string {
  const medium = (utmMedium || '').toLowerCase();
  const source = (utmSource || '').toLowerCase();
  const host = (referrerHost || '').toLowerCase();

  const paidMediums = new Set(['cpc', 'ppc', 'paid', 'paidsocial', 'paid_social', 'display']);
  if (source === 'google' && paidMediums.has(medium)) return 'google_paid';
  if (host.includes('google.')) return 'google_organic';
  if (host.includes('bing.com') || host.includes('duckduckgo') || host.includes('yahoo.')) {
    return 'search_other';
  }

  const socialHosts = [
    'facebook.com', 'fb.com', 'instagram.com', 'tiktok.com', 'twitter.com',
    'x.com', 'pinterest.com', 'linkedin.com', 'reddit.com', 'youtube.com',
    'youtu.be', 't.co', 'lnkd.in',
  ];
  if (socialHosts.some((h) => host.includes(h))) return 'social';

  if (host) return 'referral';
  if (source || medium) return 'other';
  return 'direct';
}

export type SessionInsert = {
  session_id: string;
  visitor_id: string;
  first_path: string;
  first_referrer: string | null;
  referrer_host: string | null;
  traffic_source: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  device: string;
  browser: string;
  os: string;
  viewport_width: number | null;
  is_bot: boolean;
  is_wholesale: boolean;
  is_returning: boolean;
  dnt: boolean;
};

export type PageViewInsert = {
  session_id: string;
  visitor_id: string;
  path: string;
  query: string | null;
  referrer: string | null;
  referrer_host: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  user_agent: string | null;
  country: string | null;
  device: string;
  viewport_width: number | null;
  is_bot: boolean;
  dnt: boolean;
};

/**
 * Fire-and-forget insert. Wrapped in try/catch so a Supabase hiccup never
 * breaks the user's page load. Caller should NOT await the returned promise
 * in the hot path — use Vercel's `waitUntil` or just drop the reference.
 */
export async function insertPageViewAndSession(opts: {
  session: SessionInsert | null;   // null = don't touch session (already exists)
  pageView: PageViewInsert;
}): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient() as unknown as {
      from: (t: string) => any;
    };

    if (opts.session) {
      // Upsert-like: try insert, on conflict (unique session_id) bump page_count.
      await supabase
        .from('website_sessions')
        .upsert(
          {
            ...opts.session,
            last_seen_at: new Date().toISOString(),
            page_count: 1,
          },
          { onConflict: 'session_id', ignoreDuplicates: false },
        );
    } else {
      // Existing session — bump counters.
      // NOTE: Supabase JS has no direct increment; do a two-step fetch+update.
      // This is a best-effort update and never blocks the pageview insert.
      const { data: sess } = await supabase
        .from('website_sessions')
        .select('page_count')
        .eq('session_id', opts.pageView.session_id)
        .maybeSingle();
      if (sess) {
        await supabase
          .from('website_sessions')
          .update({
            last_seen_at: new Date().toISOString(),
            page_count: (sess.page_count ?? 0) + 1,
          })
          .eq('session_id', opts.pageView.session_id);
      }
    }

    await supabase.from('website_page_views').insert(opts.pageView);
  } catch (err) {
    // Never let analytics break the page. Log to server console only.
    console.error('[analytics] insert failed:', err);
  }
}

/**
 * Named client event — `wholesale_apply_submit`, `add_to_cart`, etc.
 * Also increments the parent session's event_count.
 */
export async function insertEvent(row: {
  session_id: string;
  visitor_id: string;
  event_name: string;
  event_data?: Record<string, unknown>;
  path?: string | null;
  is_wholesale_flag?: boolean;
}): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient() as unknown as {
      from: (t: string) => any;
    };
    await supabase.from('website_events').insert({
      session_id: row.session_id,
      visitor_id: row.visitor_id,
      event_name: row.event_name,
      event_data: row.event_data ?? {},
      path: row.path ?? null,
    });
    // Best-effort session flag + counter bump.
    const { data: sess } = await supabase
      .from('website_sessions')
      .select('event_count, is_wholesale')
      .eq('session_id', row.session_id)
      .maybeSingle();
    if (sess) {
      await supabase
        .from('website_sessions')
        .update({
          event_count: (sess.event_count ?? 0) + 1,
          is_wholesale: row.is_wholesale_flag ? true : sess.is_wholesale,
          last_seen_at: new Date().toISOString(),
        })
        .eq('session_id', row.session_id);
    }
  } catch (err) {
    console.error('[analytics] event insert failed:', err);
  }
}

/**
 * PATCH-style update: client sends final time_on_page + max_scroll on
 * pagehide. We match on (session_id, path, most recent row) since the
 * client doesn't know the row UUID.
 */
export async function enrichLatestPageView(row: {
  session_id: string;
  path: string;
  time_on_page_sec: number | null;
  max_scroll_pct: number | null;
}): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient() as unknown as {
      from: (t: string) => any;
    };
    const { data: latest } = await supabase
      .from('website_page_views')
      .select('id')
      .eq('session_id', row.session_id)
      .eq('path', row.path)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!latest?.id) return;

    await supabase
      .from('website_page_views')
      .update({
        time_on_page_sec: row.time_on_page_sec,
        max_scroll_pct: row.max_scroll_pct,
      })
      .eq('id', latest.id);
  } catch (err) {
    console.error('[analytics] enrich failed:', err);
  }
}

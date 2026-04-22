import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Middleware runs in the Edge runtime which can't import @supabase/supabase-js
// directly (needed by server.ts). We forward analytics beacons to an internal
// Node-runtime API route instead.

const TRACKED_API_SKIP = /^\/(api\/(track|admin|webhooks|cron|chat)|_next|favicon|robots|sitemap|manifest|images|fonts)/;

function shouldTrack(path: string): boolean {
  if (TRACKED_API_SKIP.test(path)) return false;
  if (/\.[a-zA-Z0-9]{2,4}$/.test(path)) return false; // static asset
  return true;
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k) out[k] = decodeURIComponent(rest.join('='));
  }
  return out;
}

function fireAnalyticsBeacon(request: NextRequest): void {
  try {
    const url = request.nextUrl;
    const cookies = parseCookies(request.headers.get('cookie'));
    const body = {
      kind: 'pageview',
      path: url.pathname,
      query: url.search || null,
      referrer: request.headers.get('referer') || null,
      user_agent: request.headers.get('user-agent') || null,
      // Vercel geo headers (populated in production; undefined locally).
      country: request.headers.get('x-vercel-ip-country') || null,
      region: request.headers.get('x-vercel-ip-country-region') || null,
      city: decodeURIComponent(request.headers.get('x-vercel-ip-city') || '') || null,
      // Cookie-based IDs (client sets them; middleware just forwards).
      visitor_id: cookies['jp_vid'] || null,
      session_id: cookies['jp_sid'] || null,
      dnt: request.headers.get('dnt') === '1',
      utm: {
        source: url.searchParams.get('utm_source'),
        medium: url.searchParams.get('utm_medium'),
        campaign: url.searchParams.get('utm_campaign'),
        term: url.searchParams.get('utm_term'),
        content: url.searchParams.get('utm_content'),
      },
    };
    // Fire-and-forget to internal Node route. No await — middleware must
    // not add measurable latency to page loads.
    const origin = url.origin;
    void fetch(`${origin}/api/track/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // Next.js: don't keep a pending connection; cache: no-store.
      cache: 'no-store',
    }).catch(() => { /* swallow */ });
  } catch {
    /* never break the request */
  }
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options: CookieOptions) => {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options: CookieOptions) => {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  // Refresh session on every request so server components see the latest token.
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith('/admin') || path.startsWith('/api/admin');

  // Dev-only: allow the drill-down prototype without auth so Jeff can preview mock data.
  // Production (NODE_ENV=production on Vercel) still enforces admin auth — no prod impact.
  const isPrototypePreview =
    process.env.NODE_ENV === 'development' && path === '/admin/pnl/drilldown';

  if (isAdminRoute && !isPrototypePreview) {
    if (!user) {
      // Unauthed → send to login with redirect-back.
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }

    // Authed but maybe not admin — check role.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      // Non-admin: 404 so we don't leak the route's existence.
      return new NextResponse('Not found', { status: 404 });
    }
  }

  // -------- Analytics beacon (last, fire-and-forget) -----------------------
  // Skip /admin/* and API routes so internal traffic doesn't inflate numbers.
  if (shouldTrack(path) && !isAdminRoute) {
    fireAnalyticsBeacon(request);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets / _next / favicon / images
    '/((?!_next/static|_next/image|favicon.ico|images|fonts|.*\\..*).*)',
  ],
};

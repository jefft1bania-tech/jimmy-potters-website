import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import {
  classifyTrafficSource,
  detectBrowser,
  detectDevice,
  detectOs,
  extractReferrerHost,
  insertPageViewAndSession,
  isBotUserAgent,
  type PageViewInsert,
  type SessionInsert,
} from '@/lib/analytics/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Internal endpoint called only by middleware.ts. Accepts the raw request
 * snapshot and inserts into website_sessions (upsert) + website_page_views.
 *
 * If the client has no visitor_id / session_id cookies yet (first hit), the
 * server generates them + returns them as Set-Cookie so the next middleware
 * pass reuses them. Client-side <Analytics /> will also read them on mount
 * and stick them in localStorage for the 2-year visitor horizon.
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (body?.kind !== 'pageview') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ua: string | null = body.user_agent ?? null;
  const path: string = body.path ?? '/';
  const referrer: string | null = body.referrer ?? null;
  const referrerHost = extractReferrerHost(referrer);
  const is_bot = isBotUserAgent(ua);
  const dnt = !!body.dnt;

  // Cookie-based IDs; generate on first hit.
  const existingVisitor: string | null = body.visitor_id;
  const existingSession: string | null = body.session_id;
  const visitor_id = existingVisitor || randomUUID();
  const session_id = existingSession || randomUUID();
  const isNewSession = !existingSession;

  const session: SessionInsert | null = isNewSession
    ? {
        session_id,
        visitor_id,
        first_path: path,
        first_referrer: referrer,
        referrer_host: referrerHost,
        traffic_source: classifyTrafficSource(
          referrerHost,
          body.utm?.source ?? null,
          body.utm?.medium ?? null,
        ),
        utm_source: body.utm?.source ?? null,
        utm_medium: body.utm?.medium ?? null,
        utm_campaign: body.utm?.campaign ?? null,
        utm_term: body.utm?.term ?? null,
        utm_content: body.utm?.content ?? null,
        country: body.country ?? null,
        region: body.region ?? null,
        city: body.city ?? null,
        device: detectDevice(ua),
        browser: detectBrowser(ua),
        os: detectOs(ua),
        viewport_width: null, // client fills via event later if desired
        is_bot,
        is_wholesale: path.startsWith('/wholesale'),
        is_returning: !!existingVisitor, // cookie existed → seen before
        dnt,
      }
    : null;

  const pageView: PageViewInsert = {
    session_id,
    visitor_id,
    path,
    query: body.query ?? null,
    referrer,
    referrer_host: referrerHost,
    utm_source: body.utm?.source ?? null,
    utm_medium: body.utm?.medium ?? null,
    utm_campaign: body.utm?.campaign ?? null,
    utm_term: body.utm?.term ?? null,
    utm_content: body.utm?.content ?? null,
    user_agent: dnt ? null : ua, // honor DNT: drop UA
    country: body.country ?? null,
    device: detectDevice(ua),
    viewport_width: null,
    is_bot,
    dnt,
  };

  // Fire-and-forget inside the route — we DO await to ensure it queues
  // before response returns (Vercel may freeze the function otherwise).
  await insertPageViewAndSession({ session, pageView });

  const res = NextResponse.json({ ok: true, session_id, visitor_id, is_bot });

  // Set cookies only if we minted new IDs. 2-year visitor cookie, 30-min
  // rolling session cookie. SameSite=Lax so first-party links work.
  if (!existingVisitor && !dnt) {
    res.cookies.set('jp_vid', visitor_id, {
      maxAge: 60 * 60 * 24 * 365 * 2,
      path: '/',
      sameSite: 'lax',
      secure: true,
      httpOnly: false, // client lib reads it too
    });
  }
  if (!existingSession && !dnt) {
    res.cookies.set('jp_sid', session_id, {
      maxAge: 60 * 30,
      path: '/',
      sameSite: 'lax',
      secure: true,
      httpOnly: false,
    });
  } else if (existingSession && !dnt) {
    // Refresh session cookie idle TTL on every hit.
    res.cookies.set('jp_sid', existingSession, {
      maxAge: 60 * 30,
      path: '/',
      sameSite: 'lax',
      secure: true,
      httpOnly: false,
    });
  }

  return res;
}

import { NextRequest, NextResponse } from 'next/server';
import { enrichLatestPageView, insertEvent } from '@/lib/analytics/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public client endpoint. Accepts two payload shapes:
 *   { kind: 'event',   session_id, visitor_id, event_name, event_data, path }
 *   { kind: 'enrich',  session_id, path, time_on_page_sec, max_scroll_pct }
 *
 * Designed to be called via navigator.sendBeacon on pagehide, so it must
 * accept application/json + survive fire-and-forget with no response consumer.
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (body?.kind === 'event') {
    if (!body.session_id || !body.visitor_id || !body.event_name) {
      return NextResponse.json({ ok: false, error: 'missing ids' }, { status: 400 });
    }
    await insertEvent({
      session_id: String(body.session_id),
      visitor_id: String(body.visitor_id),
      event_name: String(body.event_name).slice(0, 64),
      event_data: typeof body.event_data === 'object' ? body.event_data : {},
      path: body.path ? String(body.path).slice(0, 512) : null,
      is_wholesale_flag: String(body.event_name).startsWith('wholesale_'),
    });
    return NextResponse.json({ ok: true });
  }

  if (body?.kind === 'enrich') {
    if (!body.session_id || !body.path) {
      return NextResponse.json({ ok: false, error: 'missing ids' }, { status: 400 });
    }
    await enrichLatestPageView({
      session_id: String(body.session_id),
      path: String(body.path),
      time_on_page_sec:
        typeof body.time_on_page_sec === 'number' ? Math.round(body.time_on_page_sec) : null,
      max_scroll_pct:
        typeof body.max_scroll_pct === 'number'
          ? Math.max(0, Math.min(100, Math.round(body.max_scroll_pct)))
          : null,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: 'unknown kind' }, { status: 400 });
}

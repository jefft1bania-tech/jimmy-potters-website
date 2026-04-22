/**
 * Browser-side analytics SDK. Safe to import from any client component.
 *
 * track(event, data) — fires a named event to /api/track/event.
 * Reads IDs from cookies (set by the pageview route) and mirrors them to
 * localStorage for the 2-year visitor horizon. Honors navigator.doNotTrack.
 */

const VISITOR_KEY = 'jp_vid_ls';   // 2-year localStorage
const SESSION_KEY = 'jp_sid_ls';   // 30-min sessionStorage idle
const LAST_SEEN_KEY = 'jp_last_seen_ms';
const SESSION_IDLE_MS = 30 * 60 * 1000;

function isDntOn(): boolean {
  if (typeof navigator === 'undefined') return false;
  // Respect both navigator.doNotTrack and the older Edge/IE MSTracking flag.
  return (
    (navigator as any).doNotTrack === '1' ||
    (window as any).doNotTrack === '1' ||
    (navigator as any).msDoNotTrack === '1'
  );
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateVisitorId(): string {
  if (isDntOn()) return 'dnt';
  try {
    const cookieVid = readCookie('jp_vid');
    if (cookieVid) {
      localStorage.setItem(VISITOR_KEY, cookieVid);
      return cookieVid;
    }
    const stored = localStorage.getItem(VISITOR_KEY);
    if (stored) return stored;
    const id = uuid();
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return uuid();
  }
}

function getOrCreateSessionId(): string {
  if (isDntOn()) return 'dnt';
  try {
    const cookieSid = readCookie('jp_sid');
    const now = Date.now();
    const lastSeen = Number(sessionStorage.getItem(LAST_SEEN_KEY) || 0);
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing && now - lastSeen < SESSION_IDLE_MS) {
      sessionStorage.setItem(LAST_SEEN_KEY, String(now));
      return existing;
    }
    const id = cookieSid || uuid();
    sessionStorage.setItem(SESSION_KEY, id);
    sessionStorage.setItem(LAST_SEEN_KEY, String(now));
    return id;
  } catch {
    return uuid();
  }
}

function send(payload: Record<string, unknown>, opts?: { beacon?: boolean }): void {
  if (typeof fetch === 'undefined') return;
  const url = '/api/track/event';
  const body = JSON.stringify(payload);
  try {
    if (opts?.beacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true, // survives unload
      cache: 'no-store',
    }).catch(() => { /* swallow */ });
  } catch {
    /* swallow */
  }
}

export function getIds(): { visitor_id: string; session_id: string } {
  return {
    visitor_id: getOrCreateVisitorId(),
    session_id: getOrCreateSessionId(),
  };
}

/**
 * Fire a named event. Safe to call in any client context; no-ops on DNT.
 * Example: track('wholesale_apply_submit', { volume_band: 'under_5k' })
 */
export function track(event_name: string, event_data: Record<string, unknown> = {}): void {
  if (isDntOn()) return;
  const { visitor_id, session_id } = getIds();
  send({
    kind: 'event',
    session_id,
    visitor_id,
    event_name,
    event_data,
    path: typeof location !== 'undefined' ? location.pathname : null,
  });
}

/**
 * PATCH-style enrichment — called on pagehide by <Analytics />.
 */
export function sendEnrich(
  path: string,
  time_on_page_sec: number,
  max_scroll_pct: number,
): void {
  if (isDntOn()) return;
  const { session_id } = getIds();
  send(
    {
      kind: 'enrich',
      session_id,
      path,
      time_on_page_sec,
      max_scroll_pct,
    },
    { beacon: true },
  );
}

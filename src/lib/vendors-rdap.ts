// RDAP (Registration Data Access Protocol) helpers extracted from the
// vendors-rdap cron route. Lives outside the App-Router route file because
// Next.js disallows non-method exports from route.ts modules.

export type RdapEvent = { eventAction?: string; eventDate?: string };
export type RdapResponse = { events?: RdapEvent[] };

export const RDAP_TIMEOUT_MS = 8000;

// extractDomain pulls a registrable domain from a vendor row.
// Priority: login_url hostname → name string (when name looks like a domain).
export function extractDomain(name: string, loginUrl: string | null): string | null {
  if (loginUrl) {
    try {
      const u = new URL(loginUrl);
      const host = u.hostname.toLowerCase();
      // Strip leading www. so RDAP routes to the apex registry.
      return host.startsWith('www.') ? host.slice(4) : host;
    } catch {
      // fall through
    }
  }
  const trimmed = (name ?? '').trim().toLowerCase();
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/.test(trimmed)) return trimmed;
  return null;
}

export async function fetchRdapExpiration(domain: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RDAP_TIMEOUT_MS);
  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      headers: { Accept: 'application/rdap+json' },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`RDAP HTTP ${res.status}`);
    }
    const body = (await res.json()) as RdapResponse;
    const event = (body.events ?? []).find(
      (ev) => (ev.eventAction ?? '').toLowerCase() === 'expiration',
    );
    if (!event?.eventDate) return null;
    const d = new Date(event.eventDate);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } finally {
    clearTimeout(timer);
  }
}

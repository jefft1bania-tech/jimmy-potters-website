// Vendors RDAP cron ..... refreshes domain expiration timestamps for every
// vendor row with role='domain' using RDAP (Registration Data Access Protocol,
// RFC 9083, ICANN's modern WHOIS replacement).
//
// Spec: research dossier section 5c. Endpoint `https://rdap.org/domain/<domain>`
// auto-routes to the authoritative registry RDAP server. Free, no key required.
// Per Rule "no paid APIs" and Rule #48 token-handle-only, no secret needed.
//
// Schedule: daily 06:00 UTC (= 01:00 COT) via vercel.json crons entry.
// Auth: CRON_SECRET bearer token via shared lib/cron-auth.ts.

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyCronRequest } from '@/lib/cron-auth';
import { extractDomain, fetchRdapExpiration } from '@/lib/vendors-rdap';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

type VendorDomainRow = {
  id: string;
  name: string;
  login_url: string | null;
};

export async function GET(req: Request) {
  const gate = verifyCronRequest(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const started = Date.now();
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };

  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, login_url')
    .eq('role', 'domain')
    .neq('status', 'cancelled');

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const vendors = (data ?? []) as VendorDomainRow[];
  const results = {
    considered: vendors.length,
    updated: 0,
    skipped: 0,
    errors: [] as Array<{ vendor: string; error: string }>,
  };

  for (const v of vendors) {
    const domain = extractDomain(v.name, v.login_url);
    if (!domain) {
      results.skipped++;
      results.errors.push({ vendor: v.name, error: 'no domain extractable from name/login_url' });
      continue;
    }

    try {
      const expires = await fetchRdapExpiration(domain);
      const now = new Date().toISOString();
      const { error: updErr } = await supabase
        .from('vendors')
        .update({
          domain_expires_at: expires,
          domain_last_checked_at: now,
        })
        .eq('id', v.id);

      if (updErr) {
        results.errors.push({ vendor: v.name, error: updErr.message });
      } else {
        results.updated++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      results.errors.push({ vendor: v.name, error: msg });
      // Still mark last_checked so we know the cron tried.
      await supabase
        .from('vendors')
        .update({ domain_last_checked_at: new Date().toISOString() })
        .eq('id', v.id);
    }
  }

  return NextResponse.json({
    ok: true,
    duration_ms: Date.now() - started,
    ...results,
  });
}

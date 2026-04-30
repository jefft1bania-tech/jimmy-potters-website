// Vendors Vercel-billing cron ..... reads billing@vercel.com emails from Gmail,
// parses invoice amount + period, updates the Vercel vendor row's
// monthly_cost_usd, and seeds a recurring_expenses row when missing.
//
// Why Gmail-parse: per the research dossier (section 5a) Vercel does NOT
// expose a first-party billing API for self-billed teams. Marketplace billing
// endpoints are partner-only. Email parse is the only Rule-clean free path.
//
// Schedule: daily 06:30 UTC (= 01:30 COT) via vercel.json crons entry.
// Auth: CRON_SECRET bearer token via shared lib/cron-auth.ts.

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyCronRequest } from '@/lib/cron-auth';
import { getGmailClient, searchAndParse, type ParsedMessage } from '@/lib/gmail/client';
import { parseVercelInvoiceBody } from '@/lib/vendors-vercel-parse';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

// Worst-case window per Rule #42. 30 days covers any monthly billing date and
// gives one full safety overlap with the prior month's invoice email.
const LOOKBACK_DAYS = 30;

type VercelInvoice = {
  amount_usd: number;
  period_start_iso: string | null;
  period_end_iso: string | null;
  message_id: string;
  internal_date: number;
};

export async function GET(req: Request) {
  const gate = verifyCronRequest(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const started = Date.now();
  const gmail = getGmailClient();
  if (!gmail.ok) {
    return NextResponse.json({ ok: false, skipped: 'gmail_not_configured', error: gmail.error });
  }

  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };

  // Find the Vercel vendor row. We match by name (case-insensitive) because
  // the row may pre-exist from manual seeding.
  const { data: vendorRows } = await supabase
    .from('vendors')
    .select('id, name, monthly_cost_usd')
    .ilike('name', 'vercel');

  let vendor = (vendorRows ?? [])[0] as { id: string; name: string; monthly_cost_usd: number | null } | undefined;

  // Pull recent billing emails.
  let messages: ParsedMessage[] = [];
  try {
    messages = await searchAndParse(
      gmail.client,
      gmail.user,
      `from:billing@vercel.com newer_than:${LOOKBACK_DAYS}d`,
      25,
    );
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : 'gmail_search_failed',
    }, { status: 500 });
  }

  const invoices: VercelInvoice[] = [];
  for (const msg of messages) {
    const parsed = parseVercelInvoiceBody(msg.body);
    if (!parsed) continue;
    invoices.push({
      amount_usd: parsed.amount_usd,
      period_start_iso: parsed.period_start_iso,
      period_end_iso: parsed.period_end_iso,
      message_id: msg.id,
      internal_date: msg.internalDate,
    });
  }

  // Pick the most recent parsed invoice as the current monthly cost figure.
  invoices.sort((a, b) => b.internal_date - a.internal_date);
  const latest = invoices[0] ?? null;

  // Auto-seed the vendor row if absent so the cron is idempotent on a clean DB.
  if (!vendor && latest) {
    const { data: created } = await supabase
      .from('vendors')
      .insert({
        name: 'Vercel',
        role: 'hosting',
        login_url: 'https://vercel.com/dashboard',
        account_email: gmail.user === 'me' ? null : gmail.user,
        monthly_cost_usd: latest.amount_usd,
        cost_rate_date: new Date(latest.internal_date).toISOString().slice(0, 10),
        cost_rate_source: `vercel_billing_email:${latest.message_id}`,
        billing_day_of_month: new Date(latest.internal_date).getUTCDate(),
        status: 'active',
      })
      .select('id, name, monthly_cost_usd')
      .single();
    if (created) vendor = created as typeof vendor;
  }

  let updated = false;
  if (vendor && latest && Math.abs((vendor.monthly_cost_usd ?? 0) - latest.amount_usd) > 0.005) {
    const { error } = await supabase
      .from('vendors')
      .update({
        monthly_cost_usd: latest.amount_usd,
        cost_rate_date: new Date(latest.internal_date).toISOString().slice(0, 10),
        cost_rate_source: `vercel_billing_email:${latest.message_id}`,
      })
      .eq('id', vendor.id);
    if (!error) updated = true;
  }

  // Seed a recurring_expenses row when none exist for this vendor yet, so
  // P&L reflects the cost without manual data entry.
  let recurringSeeded = false;
  if (vendor && latest) {
    const { data: existing } = await supabase
      .from('recurring_expenses')
      .select('id')
      .eq('vendor_id', vendor.id)
      .limit(1);
    const has = (existing ?? []).length > 0;
    if (!has) {
      const startsOn = latest.period_start_iso ?? new Date(latest.internal_date).toISOString().slice(0, 10);
      const { error } = await supabase.from('recurring_expenses').insert({
        category: 'software',
        amount_cents: Math.round(latest.amount_usd * 100),
        recurrence: 'monthly',
        starts_on: startsOn,
        notes: `Auto-seeded from Vercel billing email ${latest.message_id}`,
        vendor_id: vendor.id,
      });
      if (!error) recurringSeeded = true;
    }
  }

  return NextResponse.json({
    ok: true,
    duration_ms: Date.now() - started,
    messages_scanned: messages.length,
    invoices_parsed: invoices.length,
    vendor_id: vendor?.id ?? null,
    monthly_cost_updated: updated,
    recurring_seeded: recurringSeeded,
    latest: latest
      ? {
          amount_usd: latest.amount_usd,
          period_start_iso: latest.period_start_iso,
          period_end_iso: latest.period_end_iso,
          message_id: latest.message_id,
        }
      : null,
  });
}


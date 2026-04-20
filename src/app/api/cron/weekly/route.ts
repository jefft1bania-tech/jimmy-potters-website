import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { Resend } from 'resend';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyCronRequest } from '@/lib/cron-auth';
import { buildInsightsSnapshot } from '@/lib/insights-snapshot';
import { answerInsightQuery, INSIGHTS_PROMPT_VERSION } from '@/lib/insights-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const WEEKLY_DIGEST_QUERY = `Give me a one-week business digest. Call out:
- Net profit trend vs last week and vs MTD.
- The SKU moving the most margin this week and the one dragging.
- Any overdue or critical/urgent bulk shipments I need to touch today.
- Any uncovered cost templates or parsed-but-unconfirmed documents that are
  distorting the numbers.
- One concrete action to take today.
Keep it under 200 words, scannable Markdown.`;

export async function GET(req: Request) {
  const gate = verifyCronRequest(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const started = Date.now();
  const { snapshot, snapshot_hash } = await buildInsightsSnapshot();

  let response;
  try {
    response = await answerInsightQuery({ query: WEEKLY_DIGEST_QUERY, snapshot });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Claude request failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const query_hash = createHash('sha256')
    .update(`${INSIGHTS_PROMPT_VERSION}\n${snapshot_hash}\nweekly-digest\n${new Date().toISOString().slice(0, 10)}`)
    .digest('hex')
    .slice(0, 32);

  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };

  const { data: saved, error: insertErr } = await supabase
    .from('ai_insights')
    .insert({
      query_hash,
      query_text: 'weekly-digest-cron',
      prompt_version: INSIGHTS_PROMPT_VERSION,
      data_snapshot: snapshot,
      response_markdown: response.response_markdown,
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    })
    .select('id, generated_at')
    .single();

  let emailed = false;
  let email_error: string | null = null;

  const recipient = process.env.JIMMY_NOTIFY_EMAIL;
  const from = process.env.WHOLESALE_EMAIL_FROM ?? 'notifications@jimmypotters.com';
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && recipient) {
    const resend = new Resend(resendKey);
    const subject = `Jimmy Potters — weekly business digest (${new Date().toISOString().slice(0, 10)})`;
    const linkBlock = saved?.id
      ? `\n\nView full history: ${process.env.NEXT_PUBLIC_URL ?? ''}/admin/insights`
      : '';
    try {
      await resend.emails.send({
        from,
        to: recipient,
        subject,
        text: response.response_markdown + linkBlock,
      });
      emailed = true;
    } catch (e) {
      email_error = e instanceof Error ? e.message : 'email send failed';
    }
  }

  return NextResponse.json({
    ok: true,
    duration_ms: Date.now() - started,
    persisted: !insertErr,
    persist_error: insertErr?.message ?? null,
    insight_id: saved?.id ?? null,
    emailed,
    email_error,
    usage: response.usage,
  });
}

import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/server';
import { buildInsightsSnapshot } from '@/lib/insights-snapshot';
import {
  answerInsightQuery,
  INSIGHTS_PROMPT_VERSION,
} from '@/lib/insights-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function POST(req: Request) {
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { query?: string };
  try {
    body = (await req.json()) as { query?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  if (query.length > 2000) {
    return NextResponse.json({ error: 'Query too long (max 2000 chars)' }, { status: 400 });
  }

  const { snapshot, snapshot_hash } = await buildInsightsSnapshot();

  const query_hash = createHash('sha256')
    .update(`${INSIGHTS_PROMPT_VERSION}\n${snapshot_hash}\n${query.toLowerCase()}`)
    .digest('hex')
    .slice(0, 32);

  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };

  // Cache hit check: same query_hash within TTL.
  const cacheCutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();
  const { data: cached } = await supabase
    .from('ai_insights')
    .select('id, query_text, response_markdown, generated_at')
    .eq('query_hash', query_hash)
    .gte('generated_at', cacheCutoff)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached) {
    return NextResponse.json({
      ok: true,
      cached: true,
      id: cached.id,
      query_text: cached.query_text,
      response_markdown: cached.response_markdown,
      generated_at: cached.generated_at,
    });
  }

  let result;
  try {
    result = await answerInsightQuery({ query, snapshot });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Claude request failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const insertRow = {
    query_hash,
    query_text: query,
    prompt_version: INSIGHTS_PROMPT_VERSION,
    data_snapshot: snapshot,
    response_markdown: result.response_markdown,
    input_tokens: result.usage.input_tokens,
    output_tokens: result.usage.output_tokens,
    generated_by: profile.id,
  };

  const { data: saved, error: insertErr } = await supabase
    .from('ai_insights')
    .insert(insertRow)
    .select('id, query_text, response_markdown, generated_at')
    .single();

  if (insertErr) {
    // Answer is still useful even if persistence fails — return it but flag.
    return NextResponse.json({
      ok: true,
      cached: false,
      persisted: false,
      error: insertErr.message,
      query_text: query,
      response_markdown: result.response_markdown,
      generated_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    ok: true,
    cached: false,
    persisted: true,
    id: saved.id,
    query_text: saved.query_text,
    response_markdown: saved.response_markdown,
    generated_at: saved.generated_at,
    usage: result.usage,
  });
}

export async function GET(_req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { data, error } = await supabase
    .from('ai_insights')
    .select('id, query_text, response_markdown, generated_at, input_tokens, output_tokens')
    .order('generated_at', { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, insights: data ?? [] });
}

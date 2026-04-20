import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/server';
import { parseFinancialDocument } from '@/lib/documents-parse';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(_req: Request, ctx: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const id = ctx.params.id;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const db = supabase as unknown as { from: (t: string) => any };

  const { data: doc, error: fetchErr } = await db
    .from('financial_documents')
    .select('id, storage_path, mime_type, status')
    .eq('id', id)
    .single();
  if (fetchErr || !doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: blob, error: dlErr } = await supabase.storage
    .from('financial-documents')
    .download(doc.storage_path);
  if (dlErr || !blob) {
    return NextResponse.json({ error: `Download failed: ${dlErr?.message ?? 'unknown'}` }, { status: 500 });
  }
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = Buffer.from(arrayBuffer);

  let outcome;
  try {
    outcome = await parseFinancialDocument({ bytes, mimeType: doc.mime_type });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Parse failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const { parsed, usage } = outcome;

  const patch = {
    status: 'parsed' as const,
    extracted_vendor: parsed.vendor,
    extracted_amount_cents: parsed.amount_cents,
    extracted_tax_cents: parsed.tax_cents,
    extracted_issued_on: parsed.issued_on,
    extracted_line_items: parsed.line_items,
    extracted_raw_text: parsed.raw_text,
    ai_confidence: parsed.confidence,
  };

  const { data: updated, error: updErr } = await db
    .from('financial_documents')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, document: updated, usage });
}

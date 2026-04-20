import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/server';
import { DOCUMENT_CATEGORIES, DOCUMENT_STATUSES } from '@/lib/documents-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function numOrNull(raw: unknown): number | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || raw === '') return null;
  if (typeof raw === 'number' && isFinite(raw)) return Math.round(raw);
  if (typeof raw === 'string') {
    const n = parseFloat(raw);
    return isFinite(n) ? Math.round(n) : undefined;
  }
  return undefined;
}

function strOrNull(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  if (typeof raw !== 'string') return undefined;
  return raw.trim() ? raw.trim() : null;
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const id = ctx.params.id;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if ('category' in body) {
    if (typeof body.category !== 'string' || !(DOCUMENT_CATEGORIES as string[]).includes(body.category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    patch.category = body.category;
  }

  if ('status' in body) {
    if (typeof body.status !== 'string' || !(DOCUMENT_STATUSES as string[]).includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    patch.status = body.status;
    if (body.status === 'confirmed' || body.status === 'rejected') {
      patch.reviewed_at = new Date().toISOString();
    }
  }

  if ('extracted_vendor' in body) {
    const v = strOrNull(body.extracted_vendor);
    if (v !== undefined) patch.extracted_vendor = v;
  }

  if ('extracted_amount_cents' in body) {
    const v = numOrNull(body.extracted_amount_cents);
    if (v !== undefined) {
      if (v !== null && v < 0) return NextResponse.json({ error: 'amount must be >= 0' }, { status: 400 });
      patch.extracted_amount_cents = v;
    }
  }

  if ('extracted_tax_cents' in body) {
    const v = numOrNull(body.extracted_tax_cents);
    if (v !== undefined) {
      if (v !== null && v < 0) return NextResponse.json({ error: 'tax must be >= 0' }, { status: 400 });
      patch.extracted_tax_cents = v;
    }
  }

  if ('extracted_issued_on' in body) {
    const v = body.extracted_issued_on;
    if (v === null || v === '') patch.extracted_issued_on = null;
    else if (typeof v === 'string' && ISO_DATE.test(v)) patch.extracted_issued_on = v;
    else return NextResponse.json({ error: 'extracted_issued_on must be YYYY-MM-DD' }, { status: 400 });
  }

  if ('tax_year' in body) {
    const v = body.tax_year;
    if (v === null || v === '') patch.tax_year = null;
    else if (typeof v === 'string' && /^\d{4}$/.test(v)) patch.tax_year = parseInt(v, 10);
    else if (typeof v === 'number' && Number.isInteger(v) && v >= 2000 && v <= 2100) patch.tax_year = v;
    else return NextResponse.json({ error: 'tax_year must be a 4-digit year' }, { status: 400 });
  }

  if ('notes' in body) {
    const v = strOrNull(body.notes);
    if (v !== undefined) patch.notes = v;
  }

  if ('linked_expense_id' in body) {
    const v = body.linked_expense_id;
    if (v === null || v === '') patch.linked_expense_id = null;
    else if (typeof v === 'string') patch.linked_expense_id = v;
    else return NextResponse.json({ error: 'linked_expense_id must be uuid or null' }, { status: 400 });
  }

  if ('linked_order_id' in body) {
    const v = body.linked_order_id;
    if (v === null || v === '') patch.linked_order_id = null;
    else if (typeof v === 'string') patch.linked_order_id = v;
    else return NextResponse.json({ error: 'linked_order_id must be uuid or null' }, { status: 400 });
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { data, error } = await supabase
    .from('financial_documents')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ ok: true, document: data });
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const id = ctx.params.id;
  const supabase = createSupabaseAdminClient();
  const db = supabase as unknown as { from: (t: string) => any };

  const { data: doc, error: fetchErr } = await db
    .from('financial_documents')
    .select('storage_path')
    .eq('id', id)
    .single();
  if (fetchErr || !doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error: delErr } = await db.from('financial_documents').delete().eq('id', id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  await supabase.storage.from('financial-documents').remove([doc.storage_path]);
  return NextResponse.json({ ok: true });
}

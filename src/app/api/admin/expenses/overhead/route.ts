import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-]+/g, '_').slice(0, 120);
}

function pickStr(form: FormData, key: string, max: number): string | null {
  const raw = form.get(key);
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s) return null;
  return s.slice(0, max);
}

export async function POST(req: Request) {
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const incurred_on = pickStr(form, 'incurred_on', 10);
  const category = pickStr(form, 'category', 40);
  const amountRaw = pickStr(form, 'amount', 32);
  const notes = pickStr(form, 'notes', 500) ?? pickStr(form, 'note', 500);
  const vendor_id = pickStr(form, 'vendor_id', 36);

  if (!incurred_on || !ISO_DATE.test(incurred_on)) {
    return NextResponse.json({ error: 'Date must be YYYY-MM-DD' }, { status: 400 });
  }
  if (!category) {
    return NextResponse.json({ error: 'Category required' }, { status: 400 });
  }
  const amountNum = amountRaw ? parseFloat(amountRaw.replace(/[$,]/g, '')) : NaN;
  if (!isFinite(amountNum) || amountNum <= 0) {
    return NextResponse.json({ error: 'Amount must be > $0' }, { status: 400 });
  }
  const amount_cents = Math.round(amountNum * 100);

  const fileEntry = form.get('receipt');
  const hasFile = fileEntry instanceof Blob && fileEntry.size > 0;
  if (hasFile) {
    const file = fileEntry as Blob;
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Receipt exceeds ${MAX_BYTES / 1024 / 1024}MB cap` },
        { status: 413 },
      );
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported receipt type: ${file.type || 'unknown'}` },
        { status: 415 },
      );
    }
  }

  const supabase = createSupabaseAdminClient();
  const db = supabase as unknown as { from: (t: string) => any };

  const { data: expenseRow, error: expenseErr } = await db
    .from('overhead_expenses')
    .insert({ amount_cents, incurred_on, category, notes, vendor_id })
    .select('id')
    .single();
  if (expenseErr) {
    return NextResponse.json({ error: `Insert failed: ${expenseErr.message}` }, { status: 500 });
  }
  const expenseId = expenseRow.id as string;

  let documentId: string | null = null;
  if (hasFile) {
    const file = fileEntry as Blob;
    const originalName =
      'name' in file && typeof (file as File).name === 'string' ? (file as File).name : 'receipt';
    const safeName = sanitizeFilename(originalName);
    const docId = crypto.randomUUID();
    const storagePath = `expenses/${expenseId}/${docId}_${safeName}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadErr } = await supabase.storage
      .from('financial-documents')
      .upload(storagePath, bytes, { contentType: file.type, upsert: false });
    if (uploadErr) {
      await db.from('overhead_expenses').delete().eq('id', expenseId);
      return NextResponse.json(
        { error: `Receipt upload failed: ${uploadErr.message}` },
        { status: 500 },
      );
    }

    const { data: docRow, error: docErr } = await db
      .from('financial_documents')
      .insert({
        id: docId,
        storage_path: storagePath,
        original_filename: originalName,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: profile.id,
        category: 'receipt',
        status: 'confirmed',
        linked_expense_id: expenseId,
        reviewed_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (docErr) {
      await supabase.storage.from('financial-documents').remove([storagePath]);
      await db.from('overhead_expenses').delete().eq('id', expenseId);
      return NextResponse.json(
        { error: `Receipt link failed: ${docErr.message}` },
        { status: 500 },
      );
    }
    documentId = docRow.id as string;
  }

  revalidatePath('/admin/expenses');
  revalidatePath('/admin');
  revalidatePath('/admin/pnl');
  if (documentId) revalidatePath('/admin/documents');

  return NextResponse.json({ ok: true, expense_id: expenseId, document_id: documentId });
}

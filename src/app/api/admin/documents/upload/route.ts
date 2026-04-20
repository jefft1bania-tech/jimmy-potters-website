import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/server';
import { DOCUMENT_CATEGORIES, type DocumentCategory } from '@/lib/documents-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-]+/g, '_').slice(0, 120);
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

  const file = form.get('file');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }
  const originalName = 'name' in file && typeof (file as File).name === 'string' ? (file as File).name : 'upload';

  if (file.size === 0) return NextResponse.json({ error: 'Empty file' }, { status: 400 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `File exceeds ${MAX_BYTES / 1024 / 1024}MB cap` }, { status: 413 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: `Unsupported mime type: ${file.type || 'unknown'}` }, { status: 415 });
  }

  const categoryRaw = typeof form.get('category') === 'string' ? (form.get('category') as string) : 'other';
  const category: DocumentCategory = (DOCUMENT_CATEGORIES as string[]).includes(categoryRaw)
    ? (categoryRaw as DocumentCategory)
    : 'other';

  const taxYearRaw = typeof form.get('tax_year') === 'string' ? (form.get('tax_year') as string) : '';
  const taxYear = /^\d{4}$/.test(taxYearRaw) ? parseInt(taxYearRaw, 10) : null;

  const notesRaw = typeof form.get('notes') === 'string' ? (form.get('notes') as string) : '';
  const notes = notesRaw.trim() ? notesRaw.trim() : null;

  const docId = crypto.randomUUID();
  const safeName = sanitizeFilename(originalName);
  const folder = taxYear != null ? String(taxYear) : 'untagged';
  const storagePath = `${folder}/${docId}_${safeName}`;

  const supabase = createSupabaseAdminClient();
  const arrayBuffer = await file.arrayBuffer();
  const bytes = Buffer.from(arrayBuffer);

  const { error: uploadErr } = await supabase.storage
    .from('financial-documents')
    .upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadErr) {
    return NextResponse.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 });
  }

  const db = supabase as unknown as { from: (t: string) => any };
  const { error: insertErr, data: row } = await db
    .from('financial_documents')
    .insert({
      id: docId,
      storage_path: storagePath,
      original_filename: originalName,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: profile.id,
      category,
      status: 'pending',
      tax_year: taxYear,
      notes,
    })
    .select()
    .single();

  if (insertErr) {
    // Roll back the storage write so we don't orphan files.
    await supabase.storage.from('financial-documents').remove([storagePath]);
    return NextResponse.json({ error: `Insert failed: ${insertErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, document: row });
}

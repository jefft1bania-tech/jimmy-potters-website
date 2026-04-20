// Server-side loader for /admin/documents list + detail pages.
// SERVER ONLY — imports the service-role client.

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type DocumentCategory =
  | 'receipt'
  | 'invoice'
  | 'bill'
  | 'bank_statement'
  | '1099'
  | 'w2'
  | 'other';

export type DocumentStatus = 'pending' | 'parsed' | 'confirmed' | 'rejected';

export type FinancialDocument = {
  id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string | null;
  category: DocumentCategory;
  status: DocumentStatus;
  extracted_vendor: string | null;
  extracted_amount_cents: number | null;
  extracted_issued_on: string | null;
  extracted_tax_cents: number | null;
  extracted_line_items: unknown;
  extracted_raw_text: string | null;
  ai_confidence: number | null;
  linked_expense_id: string | null;
  linked_order_id: string | null;
  tax_year: number | null;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export async function listDocuments(opts: {
  status?: DocumentStatus | 'all';
  category?: DocumentCategory | 'all';
  taxYear?: number | 'all';
}): Promise<FinancialDocument[]> {
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  let query = supabase.from('financial_documents').select('*').order('created_at', { ascending: false });
  if (opts.status && opts.status !== 'all') query = query.eq('status', opts.status);
  if (opts.category && opts.category !== 'all') query = query.eq('category', opts.category);
  if (opts.taxYear && opts.taxYear !== 'all') query = query.eq('tax_year', opts.taxYear);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as FinancialDocument[];
}

export async function getDocument(id: string): Promise<FinancialDocument | null> {
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { data, error } = await supabase.from('financial_documents').select('*').eq('id', id).single();
  if (error) {
    if ((error as { code?: string }).code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return (data as FinancialDocument) ?? null;
}

export async function signedDocumentUrl(storage_path: string, expiresInSec = 300): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from('financial-documents')
    .createSignedUrl(storage_path, expiresInSec);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function availableTaxYears(): Promise<number[]> {
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { data } = await supabase
    .from('financial_documents')
    .select('tax_year')
    .not('tax_year', 'is', null);
  const years = new Set<number>();
  for (const r of (data ?? []) as Array<{ tax_year: number | null }>) {
    if (r.tax_year != null) years.add(r.tax_year);
  }
  return [...years].sort((a, b) => b - a);
}

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'receipt',
  'invoice',
  'bill',
  'bank_statement',
  '1099',
  'w2',
  'other',
];
export const DOCUMENT_STATUSES: DocumentStatus[] = ['pending', 'parsed', 'confirmed', 'rejected'];

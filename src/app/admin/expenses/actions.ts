'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/server';
import type { Recurrence } from '@/lib/expenses/recurring';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseDollarsToCents(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const n = parseFloat(raw.replace(/[$,]/g, ''));
  if (!isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function str(raw: FormDataEntryValue | null, max = 200): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s) return null;
  return s.slice(0, max);
}

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function addOverheadExpense(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'Forbidden' };
  }

  const amount = parseDollarsToCents(formData.get('amount'));
  const incurred_on = str(formData.get('incurred_on'), 10);
  const category = str(formData.get('category'), 40);
  const notes = str(formData.get('notes'), 500);
  const vendor_id = str(formData.get('vendor_id'), 36);

  if (amount === null || amount <= 0) return { ok: false, error: 'Amount must be > $0' };
  if (!incurred_on || !ISO_DATE.test(incurred_on)) return { ok: false, error: 'Date must be YYYY-MM-DD' };
  if (!category) return { ok: false, error: 'Category required' };

  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { error } = await supabase.from('overhead_expenses').insert({
    amount_cents: amount,
    incurred_on,
    category,
    notes,
    vendor_id,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/expenses');
  revalidatePath('/admin');
  revalidatePath('/admin/pnl');
  return { ok: true, message: `Added ${category} · $${(amount / 100).toFixed(2)} · ${incurred_on}` };
}

export async function deleteOverheadExpense(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'Forbidden' };
  }
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { error } = await supabase.from('overhead_expenses').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/expenses');
  revalidatePath('/admin/pnl');
  return { ok: true, message: 'Deleted.' };
}

const VALID_RECURRENCE: Recurrence[] = ['monthly', 'quarterly', 'annual'];

export async function addRecurringExpense(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'Forbidden' };
  }

  const amount = parseDollarsToCents(formData.get('amount'));
  const starts_on = str(formData.get('starts_on'), 10);
  const endsRaw = str(formData.get('ends_on'), 10);
  const category = str(formData.get('category'), 40);
  const recurrenceRaw = str(formData.get('recurrence'), 20);

  if (amount === null || amount <= 0) return { ok: false, error: 'Amount must be > $0' };
  if (!starts_on || !ISO_DATE.test(starts_on)) return { ok: false, error: 'Start date must be YYYY-MM-DD' };
  if (endsRaw && !ISO_DATE.test(endsRaw)) return { ok: false, error: 'End date must be YYYY-MM-DD' };
  if (!category) return { ok: false, error: 'Category required' };
  if (!recurrenceRaw || !VALID_RECURRENCE.includes(recurrenceRaw as Recurrence)) {
    return { ok: false, error: 'Recurrence must be monthly, quarterly, or annual' };
  }

  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { error } = await supabase.from('recurring_expenses').insert({
    amount_cents: amount,
    category,
    recurrence: recurrenceRaw,
    starts_on,
    ends_on: endsRaw ?? null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/expenses');
  return { ok: true, message: `Added recurring ${category} · $${(amount / 100).toFixed(2)} / ${recurrenceRaw}` };
}

export async function deleteRecurringExpense(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'Forbidden' };
  }
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/expenses');
  return { ok: true, message: 'Deleted.' };
}

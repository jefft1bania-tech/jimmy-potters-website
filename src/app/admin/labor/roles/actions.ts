'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/server';

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

const TAX_TREATMENTS = new Set(['w2', '1099', 'temp_agency']);

function toCents(raw: FormDataEntryValue | null): number {
  if (typeof raw !== 'string' || !raw.trim()) return 0;
  const n = parseFloat(raw.replace(/[$,]/g, ''));
  return isFinite(n) && n >= 0 ? Math.round(n * 100) : 0;
}

function toCentsOrNull(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const n = parseFloat(raw.replace(/[$,]/g, ''));
  return isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export async function upsertLaborRole(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'Forbidden' };
  }

  const id = typeof formData.get('id') === 'string' ? (formData.get('id') as string).trim() : '';
  const role_key =
    typeof formData.get('role_key') === 'string' ? (formData.get('role_key') as string).trim() : '';
  const display_name =
    typeof formData.get('display_name') === 'string' ? (formData.get('display_name') as string).trim() : '';
  const taxRaw =
    typeof formData.get('tax_treatment') === 'string' ? (formData.get('tax_treatment') as string) : '';
  const notes =
    typeof formData.get('notes') === 'string' && (formData.get('notes') as string).trim()
      ? (formData.get('notes') as string).trim()
      : null;

  if (!role_key) return { ok: false, error: 'Missing role_key' };
  if (!/^[a-z0-9_\-]{2,40}$/.test(role_key)) {
    return { ok: false, error: 'role_key must be 2-40 chars: a-z, 0-9, _ or -' };
  }
  if (!display_name) return { ok: false, error: 'Missing display name' };
  if (!TAX_TREATMENTS.has(taxRaw)) return { ok: false, error: 'Invalid tax_treatment' };

  const row = {
    role_key,
    display_name,
    default_hourly_rate_cents: toCents(formData.get('default_hourly_rate')),
    default_contract_rate_cents: toCentsOrNull(formData.get('default_contract_rate')),
    default_piece_rate_cents: toCentsOrNull(formData.get('default_piece_rate')),
    tax_treatment: taxRaw,
    notes,
  };

  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };

  if (id) {
    const { error } = await supabase.from('labor_roles').update(row).eq('id', id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from('labor_roles').insert(row);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath('/admin/labor/roles');
  revalidatePath('/admin/labor/hire');
  revalidatePath('/admin/products/labor-times');

  return { ok: true, message: id ? `Updated ${display_name}` : `Added ${display_name}` };
}

export async function deleteLaborRole(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'Forbidden' };
  }
  if (!id) return { ok: false, error: 'Missing id' };

  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { error } = await supabase.from('labor_roles').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/labor/roles');
  revalidatePath('/admin/labor/hire');
  revalidatePath('/admin/products/labor-times');

  return { ok: true, message: 'Role deleted' };
}

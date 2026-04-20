'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/server';

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

function toCents(raw: FormDataEntryValue | null): number {
  if (typeof raw !== 'string' || !raw.trim()) return 0;
  const n = parseFloat(raw.replace(/[$,]/g, ''));
  if (!isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export async function upsertProductCost(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'Forbidden' };
  }

  const product_id = typeof formData.get('product_id') === 'string' ? (formData.get('product_id') as string).trim() : '';
  if (!product_id) return { ok: false, error: 'Missing product id' };

  const row = {
    product_id,
    materials_cents: toCents(formData.get('materials')),
    labor_cents:     toCents(formData.get('labor')),
    packaging_cents: toCents(formData.get('packaging')),
    freight_cents:   toCents(formData.get('freight')),
    other_cents:     toCents(formData.get('other')),
  };

  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { error } = await supabase.from('product_costs').upsert(row, { onConflict: 'product_id' });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/products/costs');
  revalidatePath('/admin');
  revalidatePath('/admin/pnl');

  const total = (row.materials_cents + row.labor_cents + row.packaging_cents + row.freight_cents + row.other_cents) / 100;
  return { ok: true, message: `Saved ${product_id} · total $${total.toFixed(2)}` };
}

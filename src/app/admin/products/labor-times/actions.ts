'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/server';

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

export async function upsertProductLaborTimes(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'Forbidden' };
  }

  const product_id =
    typeof formData.get('product_id') === 'string' ? (formData.get('product_id') as string).trim() : '';
  if (!product_id) return { ok: false, error: 'Missing product id' };

  const upserts: Array<{ product_id: string; role_id: string; minutes_per_unit: number }> = [];
  const deletes: string[] = [];

  for (const [key, raw] of formData.entries()) {
    if (!key.startsWith('minutes__')) continue;
    const role_id = key.slice('minutes__'.length);
    const v = typeof raw === 'string' ? parseFloat(raw) : NaN;
    const minutes = isFinite(v) && v >= 0 ? v : 0;
    if (minutes > 0) upserts.push({ product_id, role_id, minutes_per_unit: minutes });
    else deletes.push(role_id);
  }

  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };

  if (upserts.length > 0) {
    const { error } = await supabase
      .from('product_labor_times')
      .upsert(upserts, { onConflict: 'product_id,role_id' });
    if (error) return { ok: false, error: error.message };
  }

  if (deletes.length > 0) {
    const { error } = await supabase
      .from('product_labor_times')
      .delete()
      .eq('product_id', product_id)
      .in('role_id', deletes);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath('/admin/products/labor-times');
  revalidatePath('/admin');

  const totalMinutes = upserts.reduce((s, r) => s + r.minutes_per_unit, 0);
  return {
    ok: true,
    message: `Saved ${product_id} · ${upserts.length} role${upserts.length === 1 ? '' : 's'} · ${totalMinutes.toFixed(1)} min/unit`,
  };
}

'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/server';
import { VENDOR_ROLES, VENDOR_STATUSES, type VendorRole, type VendorStatus } from '@/lib/vendors-data';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type ActionResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; error: string };

function str(raw: FormDataEntryValue | null, max = 500): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s) return null;
  return s.slice(0, max);
}

function num(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const n = parseFloat(raw.replace(/[$,]/g, ''));
  return isFinite(n) ? n : null;
}

function int(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const n = parseInt(raw, 10);
  return isFinite(n) ? n : null;
}

function bool(raw: FormDataEntryValue | null): boolean {
  return raw === 'on' || raw === 'true' || raw === '1';
}

function date(raw: FormDataEntryValue | null): string | null {
  const s = str(raw, 10);
  if (!s) return null;
  return ISO_DATE.test(s) ? s : null;
}

type VendorMutation = {
  name: string;
  role: VendorRole;
  login_url: string | null;
  account_email: string | null;
  monthly_cost_usd: number | null;
  monthly_cost_cop: number | null;
  cost_rate_date: string | null;
  cost_rate_source: string | null;
  billing_day_of_month: number | null;
  contract_term_months: number | null;
  contract_starts_at: string | null;
  contract_ends_at: string | null;
  auto_renew: boolean;
  cancellation_deadline_days: number | null;
  domain_expires_at: string | null;
  w9_on_file: boolean;
  coi_on_file: boolean;
  coi_expires_at: string | null;
  status: VendorStatus;
  notes: string | null;
};

function parseMutation(formData: FormData): VendorMutation | { error: string } {
  const name = str(formData.get('name'), 200);
  const roleRaw = str(formData.get('role'), 20);
  const statusRaw = str(formData.get('status'), 20) ?? 'active';

  if (!name) return { error: 'Name is required' };
  if (!roleRaw || !VENDOR_ROLES.includes(roleRaw as VendorRole)) {
    return { error: 'Role must be one of ' + VENDOR_ROLES.join(', ') };
  }
  if (!VENDOR_STATUSES.includes(statusRaw as VendorStatus)) {
    return { error: 'Status must be one of ' + VENDOR_STATUSES.join(', ') };
  }

  const billingDay = int(formData.get('billing_day_of_month'));
  if (billingDay !== null && (billingDay < 1 || billingDay > 31)) {
    return { error: 'Billing day must be between 1 and 31' };
  }

  const role = roleRaw as VendorRole;
  const domainExpiresIso = str(formData.get('domain_expires_at'), 30);
  // Domain field only valid when role='domain'; silently null otherwise.
  const domainExpires = role === 'domain' && domainExpiresIso
    ? (ISO_DATE.test(domainExpiresIso) ? `${domainExpiresIso}T00:00:00Z` : null)
    : null;

  return {
    name,
    role,
    login_url: str(formData.get('login_url'), 500),
    account_email: str(formData.get('account_email'), 200),
    monthly_cost_usd: num(formData.get('monthly_cost_usd')),
    monthly_cost_cop: int(formData.get('monthly_cost_cop')),
    cost_rate_date: date(formData.get('cost_rate_date')),
    cost_rate_source: str(formData.get('cost_rate_source'), 200),
    billing_day_of_month: billingDay,
    contract_term_months: int(formData.get('contract_term_months')),
    contract_starts_at: date(formData.get('contract_starts_at')),
    contract_ends_at: date(formData.get('contract_ends_at')),
    auto_renew: bool(formData.get('auto_renew')),
    cancellation_deadline_days: int(formData.get('cancellation_deadline_days')),
    domain_expires_at: domainExpires,
    w9_on_file: bool(formData.get('w9_on_file')),
    coi_on_file: bool(formData.get('coi_on_file')),
    coi_expires_at: date(formData.get('coi_expires_at')),
    status: statusRaw as VendorStatus,
    notes: str(formData.get('notes'), 2000),
  };
}

export async function addVendor(formData: FormData): Promise<ActionResult> {
  let actor;
  try {
    actor = await requireAdmin();
  } catch {
    return { ok: false, error: 'Forbidden' };
  }

  const parsed = parseMutation(formData);
  if ('error' in parsed) return { ok: false, error: parsed.error };

  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { data, error } = await supabase
    .from('vendors')
    .insert({ ...parsed, created_by: actor?.id ?? null, updated_by: actor?.id ?? null })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/vendors');
  revalidatePath('/admin/expenses');
  return { ok: true, message: `Added vendor ${parsed.name}`, id: data?.id };
}

export async function updateVendor(id: string, formData: FormData): Promise<ActionResult> {
  let actor;
  try {
    actor = await requireAdmin();
  } catch {
    return { ok: false, error: 'Forbidden' };
  }

  const parsed = parseMutation(formData);
  if ('error' in parsed) return { ok: false, error: parsed.error };

  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { error } = await supabase
    .from('vendors')
    .update({ ...parsed, updated_by: actor?.id ?? null })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/vendors');
  revalidatePath('/admin/expenses');
  return { ok: true, message: `Updated ${parsed.name}` };
}

export async function deleteVendor(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'Forbidden' };
  }
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { error } = await supabase.from('vendors').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/vendors');
  revalidatePath('/admin/expenses');
  return { ok: true, message: 'Deleted.' };
}

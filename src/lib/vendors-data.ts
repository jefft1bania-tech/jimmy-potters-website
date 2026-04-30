// Vendors registry data layer.
// Reads vendor master rows from Supabase and computes derived fields used by
// the /admin/vendors page (next-action-date, days-until alerts).
//
// Acronyms (per Rule expand-on-first-use):
//   FK = Foreign Key. RDAP = Registration Data Access Protocol.
//   COI = Certificate of Insurance. W-9 = IRS Form W-9.

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type VendorRole = 'hosting' | 'domain' | 'payments' | 'chat' | 'email' | 'other';
export type VendorStatus = 'active' | 'overdue' | 'cancelled' | 'paused';

export const VENDOR_ROLES: VendorRole[] = ['hosting', 'domain', 'payments', 'chat', 'email', 'other'];
export const VENDOR_STATUSES: VendorStatus[] = ['active', 'overdue', 'cancelled', 'paused'];

export type VendorRow = {
  id: string;
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
  domain_last_checked_at: string | null;
  w9_on_file: boolean;
  w9_document_id: string | null;
  coi_on_file: boolean;
  coi_document_id: string | null;
  coi_expires_at: string | null;
  status: VendorStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type VendorWithCounts = VendorRow & {
  overhead_expense_count: number;
  recurring_expense_count: number;
  next_action_date: string | null;
  next_action_label: string | null;
  next_action_days: number | null;
};

// Returns ISO date (YYYY-MM-DD) for the soonest upcoming action across:
//   - coi_expires_at (raw)
//   - contract_ends_at minus cancellation_deadline_days (cancellation deadline)
//   - domain_expires_at (raw, only when role='domain')
// Returns null when none are set or all are in the past.
export function computeNextAction(v: VendorRow, today: Date = new Date()): {
  date: string | null;
  label: string | null;
  days: number | null;
} {
  const candidates: Array<{ date: Date; label: string }> = [];

  if (v.coi_expires_at) {
    candidates.push({ date: parseDate(v.coi_expires_at), label: 'COI renewal' });
  }
  if (v.contract_ends_at) {
    const lead = v.cancellation_deadline_days ?? 0;
    const cancelBy = parseDate(v.contract_ends_at);
    cancelBy.setUTCDate(cancelBy.getUTCDate() - lead);
    candidates.push({
      date: cancelBy,
      label: lead > 0 ? `Cancel-by (${lead}d lead)` : 'Contract end',
    });
  }
  if (v.role === 'domain' && v.domain_expires_at) {
    candidates.push({ date: parseDate(v.domain_expires_at), label: 'Domain expiry' });
  }

  // Filter to upcoming + sort ascending.
  const todayMs = stripTime(today).getTime();
  const upcoming = candidates
    .filter((c) => c.date.getTime() >= todayMs)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (upcoming.length === 0) return { date: null, label: null, days: null };

  const top = upcoming[0];
  const days = Math.round((top.date.getTime() - todayMs) / 86_400_000);
  return { date: top.date.toISOString().slice(0, 10), label: top.label, days };
}

function parseDate(iso: string): Date {
  // Accepts YYYY-MM-DD or full ISO timestamp. Normalize to UTC midnight.
  const d = new Date(iso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function stripTime(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function listVendors(): Promise<VendorWithCounts[]> {
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };

  const [vendorsRes, overheadRes, recurringRes] = await Promise.all([
    supabase.from('vendors').select('*').order('name', { ascending: true }),
    supabase.from('overhead_expenses').select('vendor_id'),
    supabase.from('recurring_expenses').select('vendor_id'),
  ]);

  const vendors = (vendorsRes.data ?? []) as VendorRow[];
  const overhead = (overheadRes.data ?? []) as Array<{ vendor_id: string | null }>;
  const recurring = (recurringRes.data ?? []) as Array<{ vendor_id: string | null }>;

  const overheadCounts = new Map<string, number>();
  for (const r of overhead) {
    if (!r.vendor_id) continue;
    overheadCounts.set(r.vendor_id, (overheadCounts.get(r.vendor_id) ?? 0) + 1);
  }
  const recurringCounts = new Map<string, number>();
  for (const r of recurring) {
    if (!r.vendor_id) continue;
    recurringCounts.set(r.vendor_id, (recurringCounts.get(r.vendor_id) ?? 0) + 1);
  }

  const now = new Date();
  const enriched: VendorWithCounts[] = vendors.map((v) => {
    const next = computeNextAction(v, now);
    return {
      ...v,
      overhead_expense_count: overheadCounts.get(v.id) ?? 0,
      recurring_expense_count: recurringCounts.get(v.id) ?? 0,
      next_action_date: next.date,
      next_action_label: next.label,
      next_action_days: next.days,
    };
  });

  // Sort by next_action_date ascending; nulls last.
  enriched.sort((a, b) => {
    if (a.next_action_date === b.next_action_date) return a.name.localeCompare(b.name);
    if (a.next_action_date === null) return 1;
    if (b.next_action_date === null) return -1;
    return a.next_action_date.localeCompare(b.next_action_date);
  });

  return enriched;
}

// Lightweight picker shape used by OverheadForm + RecurringForm dropdowns.
export type VendorPickerOption = { id: string; name: string; role: VendorRole };

export async function listVendorOptions(): Promise<VendorPickerOption[]> {
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { data } = await supabase
    .from('vendors')
    .select('id, name, role')
    .eq('status', 'active')
    .order('name', { ascending: true });
  return (data ?? []) as VendorPickerOption[];
}

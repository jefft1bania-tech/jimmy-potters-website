import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type WholesaleBuyerType = 'business' | 'individual';

export type WholesaleApplicationStatus =
  | 'pending'
  | 'needs_info'
  | 'approved'
  | 'rejected';

export type WholesaleCartItemSnapshot = {
  id: string;
  slug: string;
  name: string;
  productNumber: number;
  price: number;
  quantity: number;
  subtotal: number;
};

export type WholesaleApplication = {
  id: string;
  buyer_type: WholesaleBuyerType;
  company_name: string | null;
  company_address: string | null;
  company_website: string | null;
  tax_id: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  shipping_address: string | null;
  expected_annual_volume_cents: number | null;
  cart_items: WholesaleCartItemSnapshot[];
  cart_item_count: number;
  cart_retail_total_cents: number;
  notes: string | null;
  status: WholesaleApplicationStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  updated_at: string;
};

export const WHOLESALE_APPLICATION_STATUSES: WholesaleApplicationStatus[] = [
  'pending',
  'needs_info',
  'approved',
  'rejected',
];

export const WHOLESALE_BUYER_TYPES: WholesaleBuyerType[] = ['business', 'individual'];

const ACTIVE_STATUSES = new Set<WholesaleApplicationStatus>(['pending', 'needs_info']);

export function isActive(status: WholesaleApplicationStatus): boolean {
  return ACTIVE_STATUSES.has(status);
}

export type WholesaleApplicationInsert = {
  buyerType: WholesaleBuyerType;
  company: { name: string; address: string; website?: string; taxId?: string } | null;
  contact: { name: string; email: string; phone: string };
  shippingAddress: string | null;
  expectedAnnualVolumeCents?: number | null;
  cartItems: WholesaleCartItemSnapshot[];
  cartItemCount: number;
  cartRetailTotalCents: number;
  notes: string | null;
};

type Client = { from: (t: string) => any };

export async function insertWholesaleApplication(
  input: WholesaleApplicationInsert,
): Promise<WholesaleApplication> {
  const supabase = createSupabaseAdminClient() as unknown as Client;
  const row = {
    buyer_type: input.buyerType,
    company_name: input.company?.name ?? null,
    company_address: input.company?.address ?? null,
    company_website: input.company?.website ?? null,
    tax_id: input.company?.taxId ?? null,
    contact_name: input.contact.name,
    contact_email: input.contact.email.toLowerCase(),
    contact_phone: input.contact.phone,
    shipping_address: input.shippingAddress,
    expected_annual_volume_cents: input.expectedAnnualVolumeCents ?? null,
    cart_items: input.cartItems,
    cart_item_count: input.cartItemCount,
    cart_retail_total_cents: input.cartRetailTotalCents,
    notes: input.notes,
  };

  const { data, error } = await supabase
    .from('wholesale_applications')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as WholesaleApplication;
}

export async function listWholesaleApplications(opts: {
  status?: WholesaleApplicationStatus | 'active' | 'all';
  buyerType?: WholesaleBuyerType | 'all';
}): Promise<WholesaleApplication[]> {
  const supabase = createSupabaseAdminClient() as unknown as Client;
  let query = supabase
    .from('wholesale_applications')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (opts.status === 'active') {
    query = query.in('status', ['pending', 'needs_info']);
  } else if (opts.status && opts.status !== 'all') {
    query = query.eq('status', opts.status);
  }
  if (opts.buyerType && opts.buyerType !== 'all') {
    query = query.eq('buyer_type', opts.buyerType);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as WholesaleApplication[];
}

export async function getWholesaleApplication(id: string): Promise<WholesaleApplication | null> {
  const supabase = createSupabaseAdminClient() as unknown as Client;
  const { data, error } = await supabase
    .from('wholesale_applications')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if ((error as { code?: string }).code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return (data as WholesaleApplication) ?? null;
}

export type WholesaleApplicationUpdate = {
  status?: WholesaleApplicationStatus;
  adminNotes?: string | null;
  reviewedBy?: string | null;
};

export async function updateWholesaleApplication(
  id: string,
  patch: WholesaleApplicationUpdate,
): Promise<WholesaleApplication> {
  const supabase = createSupabaseAdminClient() as unknown as Client;

  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) {
    row.status = patch.status;
    if (patch.status !== 'pending') {
      row.reviewed_at = new Date().toISOString();
      if (patch.reviewedBy !== undefined) row.reviewed_by = patch.reviewedBy;
    }
  }
  if (patch.adminNotes !== undefined) row.admin_notes = patch.adminNotes;

  const { data, error } = await supabase
    .from('wholesale_applications')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as WholesaleApplication;
}

export type WholesaleApplicationCounts = {
  pending: number;
  needs_info: number;
  approved: number;
  rejected: number;
  active: number;
  total: number;
};

export function tallyStatusCounts(
  rows: Array<{ status: WholesaleApplicationStatus }>,
): WholesaleApplicationCounts {
  const counts: WholesaleApplicationCounts = {
    pending: 0,
    needs_info: 0,
    approved: 0,
    rejected: 0,
    active: 0,
    total: 0,
  };
  for (const row of rows) {
    counts.total += 1;
    counts[row.status] += 1;
    if (isActive(row.status)) counts.active += 1;
  }
  return counts;
}

export async function getWholesaleApplicationCounts(): Promise<WholesaleApplicationCounts> {
  const supabase = createSupabaseAdminClient() as unknown as Client;
  const { data, error } = await supabase
    .from('wholesale_applications')
    .select('status');
  if (error) throw new Error(error.message);
  return tallyStatusCounts((data ?? []) as Array<{ status: WholesaleApplicationStatus }>);
}

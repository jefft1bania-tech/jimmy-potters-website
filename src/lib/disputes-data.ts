import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type DisputeType =
  | 'not_received'
  | 'damaged'
  | 'wrong_item'
  | 'refund_request'
  | 'late_delivery'
  | 'other';

export type DisputeStatus =
  | 'new'
  | 'investigating'
  | 'awaiting_customer'
  | 'resolved_refund'
  | 'resolved_replacement'
  | 'resolved_no_action'
  | 'closed';

export type DisputeChannel = 'chat_widget' | 'email' | 'voice' | 'manual';

export type CustomerDispute = {
  id: string;
  order_id: string | null;
  customer_email: string;
  dispute_type: DisputeType;
  opened_at: string;
  opened_via: DisputeChannel;
  status: DisputeStatus;
  resolution_notes: string | null;
  closed_at: string | null;
  handled_by: string | null;
  chat_transcript: unknown;
};

export const DISPUTE_TYPES: DisputeType[] = [
  'not_received',
  'damaged',
  'wrong_item',
  'refund_request',
  'late_delivery',
  'other',
];

export const DISPUTE_STATUSES: DisputeStatus[] = [
  'new',
  'investigating',
  'awaiting_customer',
  'resolved_refund',
  'resolved_replacement',
  'resolved_no_action',
  'closed',
];

export const DISPUTE_CHANNELS: DisputeChannel[] = ['chat_widget', 'email', 'voice', 'manual'];

const OPEN_STATUSES = new Set<DisputeStatus>(['new', 'investigating', 'awaiting_customer']);

export function isOpen(status: DisputeStatus): boolean {
  return OPEN_STATUSES.has(status);
}

export async function listDisputes(opts: {
  status?: DisputeStatus | 'open' | 'all';
  type?: DisputeType | 'all';
}): Promise<CustomerDispute[]> {
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  let query = supabase
    .from('customer_disputes')
    .select('*')
    .order('opened_at', { ascending: false });

  if (opts.status === 'open') {
    query = query.in('status', ['new', 'investigating', 'awaiting_customer']);
  } else if (opts.status && opts.status !== 'all') {
    query = query.eq('status', opts.status);
  }
  if (opts.type && opts.type !== 'all') {
    query = query.eq('dispute_type', opts.type);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as CustomerDispute[];
}

export async function getDispute(id: string): Promise<CustomerDispute | null> {
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { data, error } = await supabase.from('customer_disputes').select('*').eq('id', id).single();
  if (error) {
    if ((error as { code?: string }).code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return (data as CustomerDispute) ?? null;
}

export type LinkedOrderSnapshot = {
  id: string;
  email: string;
  status: string;
  payment_method: string;
  total_cents: number;
  created_at: string;
};

export async function getLinkedOrder(orderId: string | null): Promise<LinkedOrderSnapshot | null> {
  if (!orderId) return null;
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { data } = await supabase
    .from('orders')
    .select('id, email, status, payment_method, total_cents, created_at')
    .eq('id', orderId)
    .single();
  return (data as LinkedOrderSnapshot) ?? null;
}

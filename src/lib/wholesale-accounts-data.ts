import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type WholesaleAccountStatus = 'invited' | 'active' | 'suspended';

export const WHOLESALE_ACCOUNT_STATUSES: WholesaleAccountStatus[] = [
  'invited',
  'active',
  'suspended',
];

export type WholesaleAccount = {
  id: string;
  application_id: string;
  profile_id: string | null;
  contact_email: string;
  company_name: string | null;
  status: WholesaleAccountStatus;
  invited_by: string | null;
  invited_at: string;
  activated_at: string | null;
  last_invite_sent_at: string;
  created_at: string;
  updated_at: string;
};

type Client = { from: (t: string) => any };

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function canResendInvite(account: WholesaleAccount): boolean {
  return account.status === 'invited';
}

export function isActiveAccount(account: Pick<WholesaleAccount, 'status'>): boolean {
  return account.status === 'active';
}

export async function getWholesaleAccountByEmail(
  email: string,
): Promise<WholesaleAccount | null> {
  const supabase = createSupabaseAdminClient() as unknown as Client;
  const { data, error } = await supabase
    .from('wholesale_accounts')
    .select('*')
    .eq('contact_email', normalizeEmail(email))
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as WholesaleAccount | null) ?? null;
}

export async function getWholesaleAccountByProfileId(
  profileId: string,
): Promise<WholesaleAccount | null> {
  const supabase = createSupabaseAdminClient() as unknown as Client;
  const { data, error } = await supabase
    .from('wholesale_accounts')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as WholesaleAccount | null) ?? null;
}

export async function getWholesaleAccountForApplication(
  applicationId: string,
): Promise<WholesaleAccount | null> {
  const supabase = createSupabaseAdminClient() as unknown as Client;
  const { data, error } = await supabase
    .from('wholesale_accounts')
    .select('*')
    .eq('application_id', applicationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as WholesaleAccount | null) ?? null;
}

export type WholesaleAccountInsert = {
  applicationId: string;
  contactEmail: string;
  companyName: string | null;
  invitedBy: string | null;
};

export async function createWholesaleAccountInvite(
  input: WholesaleAccountInsert,
): Promise<WholesaleAccount> {
  const supabase = createSupabaseAdminClient() as unknown as Client;
  const row = {
    application_id: input.applicationId,
    contact_email: normalizeEmail(input.contactEmail),
    company_name: input.companyName,
    status: 'invited' as WholesaleAccountStatus,
    invited_by: input.invitedBy,
  };
  const { data, error } = await supabase
    .from('wholesale_accounts')
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as WholesaleAccount;
}

export async function markInviteResent(id: string): Promise<WholesaleAccount> {
  const supabase = createSupabaseAdminClient() as unknown as Client;
  const { data, error } = await supabase
    .from('wholesale_accounts')
    .update({ last_invite_sent_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as WholesaleAccount;
}

export async function activateWholesaleAccount(params: {
  email: string;
  profileId: string;
}): Promise<WholesaleAccount | null> {
  const supabase = createSupabaseAdminClient() as unknown as Client;
  const { data, error } = await supabase
    .from('wholesale_accounts')
    .update({
      profile_id: params.profileId,
      status: 'active' as WholesaleAccountStatus,
      activated_at: new Date().toISOString(),
    })
    .eq('contact_email', normalizeEmail(params.email))
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as WholesaleAccount | null) ?? null;
}

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWholesaleAccountByEmail, isActiveAccount } from '@/lib/wholesale-accounts-data';
import AcceptInviteForm from './AcceptInviteForm';

export const metadata: Metadata = {
  title: 'Accept Wholesale Invite — Jimmy Potters',
  description: 'Set a password and activate your wholesale account.',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function AcceptWholesaleInvitePage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect('/login?redirect=/wholesale/accept&error=Reopen+the+link+from+your+invite+email.');
  }

  const account = await getWholesaleAccountByEmail(user.email);

  // Already activated? Skip straight to shop.
  if (account && isActiveAccount(account) && account.profile_id === user.id) {
    redirect('/shop');
  }

  const noInvite = !account || account.status === 'suspended';

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 bg-brand-bg">
      <AcceptInviteForm
        email={user.email}
        companyName={account?.company_name ?? null}
        noInvite={noInvite}
      />
    </div>
  );
}

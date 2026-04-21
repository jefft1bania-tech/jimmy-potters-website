import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  activateWholesaleAccount,
  getWholesaleAccountByEmail,
  isActiveAccount,
  normalizeEmail,
} from '@/lib/wholesale-accounts-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MIN_PASSWORD_LENGTH = 8;

// Invitee lands here from /wholesale/accept after a password-set.
// We're already authed (the invite email → /auth/callback established a
// session). Update the password, then flip the wholesale_accounts row
// from 'invited' to 'active' with this user's profile id attached.
export async function POST(req: Request) {
  let body: { password?: unknown };
  try {
    body = (await req.json()) as { password?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Not signed in. Reopen the link from your invite email.' }, { status: 401 });
  }

  const email = normalizeEmail(user.email);
  const account = await getWholesaleAccountByEmail(email);
  if (!account) {
    return NextResponse.json(
      { error: 'No wholesale invite found for this account.' },
      { status: 404 },
    );
  }
  if (account.status === 'suspended') {
    return NextResponse.json(
      { error: 'This wholesale account is suspended. Contact Jimmy Potters.' },
      { status: 403 },
    );
  }
  if (isActiveAccount(account) && account.profile_id === user.id) {
    return NextResponse.json({ ok: true, alreadyActive: true, redirectTo: '/shop' });
  }

  const { error: pwError } = await supabase.auth.updateUser({ password });
  if (pwError) {
    return NextResponse.json({ error: pwError.message }, { status: 400 });
  }

  const activated = await activateWholesaleAccount({ email, profileId: user.id });
  if (!activated) {
    return NextResponse.json(
      { error: 'Activation failed. Try again or contact support.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, redirectTo: '/shop', account: activated });
}

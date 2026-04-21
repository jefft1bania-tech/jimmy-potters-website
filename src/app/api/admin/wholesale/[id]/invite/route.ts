import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  getWholesaleApplication,
  updateWholesaleApplication,
} from '@/lib/wholesale-applications-data';
import {
  createWholesaleAccountInvite,
  getWholesaleAccountForApplication,
  markInviteResent,
  normalizeEmail,
} from '@/lib/wholesale-accounts-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Admin action: approve a wholesale application and fire the Supabase Auth
// invite email. First call creates the wholesale_accounts row + flips the
// application to 'approved'. Subsequent calls resend the invite while the
// row is still 'invited'. Returns 409 if the account is already active.
export async function POST(req: Request, ctx: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const applicationId = ctx.params.id;
  if (!applicationId) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const application = await getWholesaleApplication(applicationId);
  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }
  if (application.status === 'rejected') {
    return NextResponse.json(
      { error: 'Cannot invite a rejected applicant. Reopen first.' },
      { status: 400 },
    );
  }

  const email = normalizeEmail(application.contact_email);
  const existing = await getWholesaleAccountForApplication(applicationId);

  if (existing?.status === 'active') {
    return NextResponse.json(
      { error: 'This applicant already has an active wholesale account.' },
      { status: 409 },
    );
  }
  if (existing?.status === 'suspended') {
    return NextResponse.json(
      { error: 'Account is suspended. Reactivate from the accounts admin view.' },
      { status: 409 },
    );
  }

  const origin = new URL(req.url).origin;
  const siteOrigin = process.env.NEXT_PUBLIC_URL || origin;
  const redirectTo = `${siteOrigin}/auth/callback?next=${encodeURIComponent('/wholesale/accept')}`;

  const supabase = createSupabaseAdminClient();

  // Fire the Supabase Auth invite. `inviteUserByEmail` is idempotent-ish — it
  // will re-send on subsequent calls provided the user hasn't confirmed yet.
  // If the email already belongs to an existing auth user (e.g. they signed
  // up as a customer first), we fall back to a recovery link so they can set
  // the password and still get flipped to wholesale on activation.
  const inviteResult = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      wholesale_application_id: applicationId,
      company_name: application.company_name,
    },
  });

  let recoveryLink: string | null = null;
  let existingAuthUser = false;

  if (inviteResult.error) {
    const msg = inviteResult.error.message || '';
    const alreadyExists =
      /already been registered/i.test(msg) ||
      /already registered/i.test(msg) ||
      /email address has already/i.test(msg);

    if (!alreadyExists) {
      return NextResponse.json(
        { error: `Invite failed: ${inviteResult.error.message}` },
        { status: 502 },
      );
    }

    existingAuthUser = true;
    const recovery = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    });
    if (recovery.error) {
      return NextResponse.json(
        { error: `Could not send invite or recovery link: ${recovery.error.message}` },
        { status: 502 },
      );
    }
    recoveryLink = recovery.data?.properties?.action_link ?? null;
  }

  // Persist the wholesale_accounts row (or bump last_invite_sent_at on resend).
  let account;
  if (existing) {
    account = await markInviteResent(existing.id);
  } else {
    account = await createWholesaleAccountInvite({
      applicationId,
      contactEmail: email,
      companyName: application.company_name,
      invitedBy: admin.id,
    });
  }

  // Mark the application itself as approved (non-destructive on reinvites).
  if (application.status !== 'approved') {
    await updateWholesaleApplication(applicationId, {
      status: 'approved',
      reviewedBy: admin.id,
    });
  }

  return NextResponse.json({
    ok: true,
    account,
    resent: !!existing,
    existingAuthUser,
    recoveryLink, // Only populated when Supabase refused an invite because the user already exists.
  });
}

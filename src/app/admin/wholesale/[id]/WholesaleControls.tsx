'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  WholesaleApplication,
  WholesaleApplicationStatus,
} from '@/lib/wholesale-applications-data';
import type { WholesaleAccount } from '@/lib/wholesale-accounts-data';

const ACTIONS: Array<{
  status: WholesaleApplicationStatus;
  label: string;
  tone: 'good' | 'warn' | 'danger' | 'neutral';
}> = [
  { status: 'approved', label: 'Approve', tone: 'good' },
  { status: 'needs_info', label: 'Request more info', tone: 'warn' },
  { status: 'rejected', label: 'Reject', tone: 'danger' },
  { status: 'pending', label: 'Reopen', tone: 'neutral' },
];

const toneClass: Record<'good' | 'warn' | 'danger' | 'neutral', string> = {
  good: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20',
  warn: 'border-blue-500/50 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20',
  danger: 'border-red-500/50 bg-red-500/10 text-red-300 hover:bg-red-500/20',
  neutral: 'border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800',
};

function accountPillClass(status: WholesaleAccount['status']): string {
  if (status === 'active') return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300';
  if (status === 'suspended') return 'bg-red-500/10 border border-red-500/30 text-red-300';
  return 'bg-amber-500/10 border border-amber-500/30 text-amber-300';
}

type Props = {
  application: WholesaleApplication;
  account: WholesaleAccount | null;
};

export default function WholesaleControls({ application, account }: Props) {
  const router = useRouter();
  const [adminNotes, setAdminNotes] = useState(application.admin_notes ?? '');
  const [submitting, setSubmitting] = useState<WholesaleApplicationStatus | 'notes' | 'invite' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [recoveryLink, setRecoveryLink] = useState<string | null>(null);

  const submit = async (body: Record<string, unknown>, key: WholesaleApplicationStatus | 'notes') => {
    setSubmitting(key);
    setError(null);
    setFlash(null);
    setRecoveryLink(null);
    try {
      const res = await fetch(`/api/admin/wholesale/${application.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      setFlash(key === 'notes' ? 'Notes saved.' : `Status set to ${key.replace('_', ' ')}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(null);
    }
  };

  const sendInvite = async () => {
    setSubmitting('invite');
    setError(null);
    setFlash(null);
    setRecoveryLink(null);
    try {
      const res = await fetch(`/api/admin/wholesale/${application.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Invite failed (${res.status})`);
      }
      if (data.existingAuthUser && data.recoveryLink) {
        setRecoveryLink(data.recoveryLink);
        setFlash('User already has an account — password-reset link ready to share below.');
      } else if (data.resent) {
        setFlash('Invite email resent.');
      } else {
        setFlash('Invite sent and application marked approved.');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed.');
    } finally {
      setSubmitting(null);
    }
  };

  const inviteDisabled =
    submitting !== null ||
    application.status === 'rejected' ||
    account?.status === 'active' ||
    account?.status === 'suspended';

  const inviteLabel = account
    ? account.status === 'active'
      ? 'Account active'
      : account.status === 'suspended'
        ? 'Account suspended'
        : 'Resend invite'
    : 'Approve & send invite';

  return (
    <section className="space-y-4">
      <article className="card-faire-detail p-5">
        <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
          Decision
        </h2>
        <p className="text-stone-400 text-xs font-body mb-4 leading-relaxed">
          Use the invite action below to both approve and send the activation
          email. The status buttons below are for reversible triage (reopen,
          request info, reject) and do not trigger emails.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ACTIONS.map((a) => {
            const isCurrent = a.status === application.status;
            return (
              <button
                key={a.status}
                type="button"
                disabled={isCurrent || submitting !== null}
                onClick={() => submit({ status: a.status }, a.status)}
                className={`text-xs font-heading font-bold uppercase tracking-wider px-4 py-3 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${toneClass[a.tone]}`}
              >
                {submitting === a.status ? 'Saving…' : a.label}
                {isCurrent && <span className="block text-[9px] opacity-60 mt-1 normal-case tracking-normal">current</span>}
              </button>
            );
          })}
        </div>
      </article>

      <article className="card-faire-detail p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">
            Wholesale account
          </h2>
          {account && (
            <span className={`text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded ${accountPillClass(account.status)}`}>
              {account.status}
            </span>
          )}
        </div>
        {account ? (
          <dl className="text-xs text-stone-400 space-y-1 mb-4 font-body">
            <div>
              <span className="text-stone-500">Invited:</span>{' '}
              <span className="font-mono text-stone-300">{new Date(account.invited_at).toISOString().slice(0, 16).replace('T', ' ')}</span>
            </div>
            {account.last_invite_sent_at !== account.invited_at && (
              <div>
                <span className="text-stone-500">Last resent:</span>{' '}
                <span className="font-mono text-stone-300">{new Date(account.last_invite_sent_at).toISOString().slice(0, 16).replace('T', ' ')}</span>
              </div>
            )}
            {account.activated_at && (
              <div>
                <span className="text-stone-500">Activated:</span>{' '}
                <span className="font-mono text-emerald-300">{new Date(account.activated_at).toISOString().slice(0, 16).replace('T', ' ')}</span>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-stone-500 text-xs font-body mb-4 leading-relaxed">
            No invite sent yet. Clicking below approves the application and
            emails {application.contact_email} a one-click activation link.
          </p>
        )}
        <button
          type="button"
          disabled={inviteDisabled}
          onClick={sendInvite}
          className="text-xs font-heading font-bold uppercase tracking-wider px-4 py-3 rounded-lg border border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 w-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting === 'invite' ? 'Sending…' : inviteLabel}
        </button>
        {recoveryLink && (
          <div className="mt-3 p-3 rounded-lg border border-amber-500/40 bg-amber-500/5">
            <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-amber-300 mb-1">
              Password-reset link (share manually)
            </p>
            <code className="block text-[10px] text-amber-200 break-all font-mono">{recoveryLink}</code>
          </div>
        )}
      </article>

      <article className="card-faire-detail p-5">
        <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
          Admin notes
        </h2>
        <p className="text-stone-500 text-xs font-body mb-3">
          Internal only. Track what you negotiated, volume expectations,
          reference checks, or why you rejected.
        </p>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={5}
          placeholder="Discount tier offered, resale cert on file, follow-up date…"
          className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50 resize-y"
        />
        <div className="flex items-center justify-end gap-3 mt-3">
          <button
            type="button"
            onClick={() => submit({ admin_notes: adminNotes }, 'notes')}
            disabled={submitting !== null || adminNotes === (application.admin_notes ?? '')}
            className="btn-faire !w-auto disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting === 'notes' ? 'Saving…' : 'Save notes'}
          </button>
        </div>
      </article>

      {(error || flash) && (
        <div
          className={`card-faire-detail p-4 text-sm font-body ${
            error
              ? 'border border-red-500/40 bg-red-500/10 text-red-300'
              : 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
          }`}
        >
          {error || flash}
        </div>
      )}
    </section>
  );
}

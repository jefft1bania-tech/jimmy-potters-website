'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  WholesaleApplication,
  WholesaleApplicationStatus,
} from '@/lib/wholesale-applications-data';

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

export default function WholesaleControls({ application }: { application: WholesaleApplication }) {
  const router = useRouter();
  const [adminNotes, setAdminNotes] = useState(application.admin_notes ?? '');
  const [submitting, setSubmitting] = useState<WholesaleApplicationStatus | 'notes' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const submit = async (body: Record<string, unknown>, key: WholesaleApplicationStatus | 'notes') => {
    setSubmitting(key);
    setError(null);
    setFlash(null);
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

  return (
    <section className="space-y-4">
      <article className="card-faire-detail p-5">
        <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
          Decision
        </h2>
        <p className="text-stone-400 text-xs font-body mb-4 leading-relaxed">
          Approving doesn't create the wholesale account yet — Stage 4 (invite
          email + password-set flow) ships in the next pass. For now, approve to
          mark the applicant ready for manual onboarding and log the decision.
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

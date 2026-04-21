'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  email: string;
  companyName: string | null;
  noInvite: boolean;
};

export default function AcceptInviteForm({ email, companyName, noInvite }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (noInvite) {
    return (
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-vibrant-purple via-vibrant-teal to-vibrant-orange p-6 text-center">
          <div className="text-3xl mb-2">🕊️</div>
          <h1 className="font-heading font-black text-xl text-white">No invite on file</h1>
          <p className="text-white/80 font-body text-sm mt-1">
            We couldn&apos;t find a pending wholesale invite for {email}.
          </p>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-brand-text font-body leading-relaxed">
            If you just applied for wholesale access, Jimmy will review your
            request shortly. If you think this is a mistake, reply to your
            application email and we&apos;ll sort it out.
          </p>
          <Link href="/" className="btn-vibrant w-full text-center inline-block">
            Back to the shop
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-vibrant-purple via-vibrant-teal to-vibrant-orange p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <h1 className="font-heading font-black text-xl text-white">Wholesale account active</h1>
          <p className="text-white/80 font-body text-sm mt-1">
            Welcome aboard{companyName ? `, ${companyName}` : ''}.
          </p>
        </div>
        <div className="p-6">
          <p className="text-sm text-brand-text font-body text-center">Redirecting you to the shop…</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/wholesale/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Activation failed (${res.status})`);
      }
      setDone(true);
      setTimeout(() => router.replace(data?.redirectTo || '/shop'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-vibrant-purple via-vibrant-teal to-vibrant-orange p-6 text-center">
        <div className="text-3xl mb-2">🎉</div>
        <h1 className="font-heading font-black text-xl text-white">
          {companyName ? `Welcome, ${companyName}` : 'Welcome to wholesale'}
        </h1>
        <p className="text-white/80 font-body text-sm mt-1">
          Pick a password to activate your Jimmy Potters wholesale account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-center">
          <div className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500 mb-1">
            Email
          </div>
          <div className="text-sm font-body text-brand-text break-all">{email}</div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-body rounded-xl p-3 text-center">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="wa-password" className="block text-sm font-heading font-bold text-brand-text mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="wa-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-4 py-3 pr-14 rounded-xl border-2 border-brand-border/60 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/15 outline-none font-body text-brand-text transition-all placeholder:text-gray-300"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-heading font-bold text-vibrant-purple hover:underline"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="wa-confirm" className="block text-sm font-heading font-bold text-brand-text mb-1.5">
            Confirm password
          </label>
          <input
            id="wa-confirm"
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password"
            className="w-full px-4 py-3 rounded-xl border-2 border-brand-border/60 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/15 outline-none font-body text-brand-text transition-all placeholder:text-gray-300"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-vibrant w-full disabled:opacity-50"
        >
          {submitting ? 'Activating…' : 'Activate wholesale account'}
        </button>
      </form>
    </div>
  );
}

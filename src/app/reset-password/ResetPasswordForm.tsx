'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

// The user lands here after clicking the email reset link:
// Supabase redirects to /auth/callback?code=... → exchangeCodeForSession
// → redirect here with a live recovery session. useAuth().member will be
// populated once the provider picks up the session.
export default function ResetPasswordForm() {
  const router = useRouter();
  const { member, loading, updatePassword, logout } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const expiredLink = !loading && !member && !done;

  useEffect(() => {
    // If user completed the reset and session picks up their normal role,
    // let them through to their account.
    if (done && member) {
      const t = setTimeout(() => router.replace('/account'), 1200);
      return () => clearTimeout(t);
    }
  }, [done, member, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-vibrant-purple via-vibrant-teal to-vibrant-orange p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <h1 className="font-heading font-black text-xl text-white">Password updated</h1>
          <p className="text-white/80 font-body text-sm mt-1">You&apos;re signed in.</p>
        </div>
        <div className="p-6">
          <p className="text-sm text-brand-text font-body text-center">
            Redirecting to your account…
          </p>
        </div>
      </div>
    );
  }

  if (expiredLink) {
    return (
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-vibrant-purple via-vibrant-teal to-vibrant-orange p-6 text-center">
          <div className="text-3xl mb-2">⏰</div>
          <h1 className="font-heading font-black text-xl text-white">Link expired</h1>
          <p className="text-white/80 font-body text-sm mt-1">
            Reset links are one-time use and expire after an hour.
          </p>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-brand-text font-body leading-relaxed">
            Request a fresh link and try again.
          </p>
          <Link href="/forgot-password" className="btn-vibrant w-full text-center inline-block">
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-vibrant-purple via-vibrant-teal to-vibrant-orange p-6 text-center">
        <div className="text-3xl mb-2">🔐</div>
        <h1 className="font-heading font-black text-xl text-white">Set a new password</h1>
        <p className="text-white/70 font-body text-sm mt-1">
          Pick something you&apos;ll remember — at least 6 characters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-body rounded-xl p-3 text-center">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="rp-password" className="block text-sm font-heading font-bold text-brand-text mb-1.5">
            New password
          </label>
          <div className="relative">
            <input
              id="rp-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 pr-14 rounded-xl border-2 border-brand-border/60 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/15 outline-none font-body text-brand-text transition-all placeholder:text-gray-300"
              required
              minLength={6}
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
          <label htmlFor="rp-confirm" className="block text-sm font-heading font-bold text-brand-text mb-1.5">
            Confirm new password
          </label>
          <input
            id="rp-confirm"
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password"
            className="w-full px-4 py-3 rounded-xl border-2 border-brand-border/60 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/15 outline-none font-body text-brand-text transition-all placeholder:text-gray-300"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-vibrant w-full disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Update password'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={async () => { await logout(); router.replace('/login'); }}
            className="text-xs text-stone-500 font-body hover:text-stone-700 hover:underline"
          >
            Cancel and sign out
          </button>
        </div>
      </form>
    </div>
  );
}

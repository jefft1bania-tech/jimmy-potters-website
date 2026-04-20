'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function ForgotPasswordForm() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await requestPasswordReset(email);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-vibrant-purple via-vibrant-teal to-vibrant-orange p-6 text-center">
          <div className="text-3xl mb-2">📬</div>
          <h1 className="font-heading font-black text-xl text-white">Check your inbox</h1>
          <p className="text-white/80 font-body text-sm mt-1">
            If an account exists for
          </p>
          <p className="text-white font-heading font-bold text-sm mt-0.5 break-all">{email}</p>
          <p className="text-white/80 font-body text-sm mt-1">
            we&apos;ve sent a link to reset your password.
          </p>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-brand-text font-body leading-relaxed">
            The link works for one hour. Check your spam folder if you don&apos;t see it.
          </p>
          <Link href="/login" className="btn-vibrant w-full text-center inline-block">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-vibrant-purple via-vibrant-teal to-vibrant-orange p-6 text-center">
        <div className="text-3xl mb-2">🔑</div>
        <h1 className="font-heading font-black text-xl text-white">Forgot your password?</h1>
        <p className="text-white/70 font-body text-sm mt-1">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-body rounded-xl p-3 text-center">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="fp-email" className="block text-sm font-heading font-bold text-brand-text mb-1.5">
            Email Address
          </label>
          <input
            id="fp-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl border-2 border-brand-border/60 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/15 outline-none font-body text-brand-text transition-all placeholder:text-gray-300"
            required
            autoComplete="email"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-vibrant w-full disabled:opacity-50"
        >
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>

        <div className="text-center">
          <Link href="/login" className="text-sm text-vibrant-purple font-heading font-bold hover:underline">
            ← Back to sign in
          </Link>
        </div>
      </form>
    </div>
  );
}

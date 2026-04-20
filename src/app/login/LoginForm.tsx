'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

function isSafeRedirect(target: string | null): target is string {
  if (!target) return false;
  return target.startsWith('/') && !target.startsWith('//');
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signup, member, loading: authLoading } = useAuth();

  const redirectParam = searchParams.get('redirect');
  const redirectTarget = isSafeRedirect(redirectParam) ? redirectParam : '/';

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && member) {
      router.replace(redirectTarget);
    }
  }, [authLoading, member, redirectTarget, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = mode === 'login'
      ? await login(email, password)
      : await signup(email, name, password);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.replace(redirectTarget);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
  };

  return (
    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-vibrant-purple via-vibrant-teal to-vibrant-orange p-6 text-center">
        <div className="text-3xl mb-2">🏺</div>
        <h1 className="font-heading font-black text-xl text-white">
          {mode === 'login' ? 'Welcome Back!' : 'Join Jimmy Potters'}
        </h1>
        <p className="text-white/70 font-body text-sm mt-1">
          {mode === 'login'
            ? 'Sign in to your account'
            : 'Get newsletters, new product drops & class schedules'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-body rounded-xl p-3 text-center">
            {error}
          </div>
        )}

        {mode === 'signup' && (
          <div>
            <label htmlFor="login-name" className="block text-sm font-heading font-bold text-brand-text mb-1.5">
              Your Name
            </label>
            <input
              id="login-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
              className="w-full px-4 py-3 rounded-xl border-2 border-brand-border/60 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/15 outline-none font-body text-brand-text transition-all placeholder:text-gray-300"
              required
              autoComplete="name"
            />
          </div>
        )}

        <div>
          <label htmlFor="login-email" className="block text-sm font-heading font-bold text-brand-text mb-1.5">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl border-2 border-brand-border/60 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/15 outline-none font-body text-brand-text transition-all placeholder:text-gray-300"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-heading font-bold text-brand-text mb-1.5">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
            className="w-full px-4 py-3 rounded-xl border-2 border-brand-border/60 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/15 outline-none font-body text-brand-text transition-all placeholder:text-gray-300"
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        {mode === 'signup' && (
          <div className="bg-vibrant-lavender/30 rounded-xl p-3">
            <p className="text-xs text-black font-body leading-relaxed">
              By signing up, you&apos;ll receive updates about new pottery drops, upcoming classes, and our newsletter. You can manage these preferences anytime.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-vibrant w-full disabled:opacity-50"
        >
          {submitting
            ? 'Please wait...'
            : mode === 'login'
            ? 'Sign In'
            : 'Create My Account'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={switchMode}
            className="text-sm text-vibrant-purple font-heading font-bold hover:underline"
          >
            {mode === 'login'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
}

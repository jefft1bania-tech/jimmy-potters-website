'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = mode === 'login'
      ? await login(email, password)
      : await signup(email, name, password);

    if (result.error) {
      setError(result.error);
    } else {
      setEmail('');
      setName('');
      setPassword('');
    }
    setLoading(false);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'login' ? 'Sign in' : 'Create account'}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowAuthModal(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-pop-in">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-vibrant-purple via-vibrant-teal to-vibrant-orange p-6 text-center">
          <div className="text-3xl mb-2">🏺</div>
          <h2 className="font-heading font-black text-xl text-white">
            {mode === 'login' ? 'Welcome Back!' : 'Join Jimmy Potters'}
          </h2>
          <p className="text-white/70 font-body text-sm mt-1">
            {mode === 'login'
              ? 'Sign in to your account'
              : 'Get newsletters, new product drops & class schedules'}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors p-1"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-body rounded-xl p-3 text-center">
              {error}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="block text-sm font-heading font-bold text-brand-text mb-1.5">
                Your Name
              </label>
              <input
                id="auth-name"
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
            <label htmlFor="auth-email" className="block text-sm font-heading font-bold text-brand-text mb-1.5">
              Email Address
            </label>
            <input
              id="auth-email"
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
            <label htmlFor="auth-password" className="block text-sm font-heading font-bold text-brand-text mb-1.5">
              Password
            </label>
            <input
              id="auth-password"
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
              <p className="text-xs text-gray-500 font-body leading-relaxed">
                By signing up, you&apos;ll receive updates about new pottery drops, upcoming classes, and our newsletter. You can manage these preferences anytime.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-vibrant w-full disabled:opacity-50"
          >
            {loading
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
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

export default function NewsletterBanner() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  if (dismissed) return null;

  return (
    <div className="bg-[#C96B3A] relative">
      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-3 text-white/50 hover:text-white transition-colors z-10"
        aria-label="Dismiss newsletter banner"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="section-container py-3 md:py-4">
        {!submitted ? (
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6">
            <div className="text-center md:text-left flex-shrink-0">
              <p className="font-heading font-bold text-white text-sm">
                {t.newsletter.title}
              </p>
              <p className="text-white/80 text-xs font-body">
                {t.newsletter.subtitle}{' '}
                <span className="font-bold text-amber-100">{t.newsletter.discount}</span>{' '}
                {t.newsletter.subtitleEnd}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.newsletter.placeholder}
                className="flex-1 md:w-56 px-3 py-2 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 font-body bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#8B3D1F] hover:bg-[#6B2D15] text-white font-body font-semibold text-xs rounded-lg transition-colors whitespace-nowrap tracking-wide"
              >
                {t.newsletter.button}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center">
            <p className="font-body font-semibold text-sm text-white">
              {t.newsletter.success}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

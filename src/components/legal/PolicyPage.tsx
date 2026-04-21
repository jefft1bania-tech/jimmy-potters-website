// Shared layout component for legal / policy pages.
// Keeps all four policies (Returns, Shipping, Terms, Privacy) visually
// consistent and makes it trivial to edit copy without touching layout.

import Link from 'next/link';
import type { ReactNode } from 'react';

export default function PolicyPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string; // YYYY-MM-DD
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F5F1EA]">
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-16 md:py-24">
        <nav className="mb-10 text-xs uppercase tracking-[0.2em] text-stone-500">
          <Link href="/" className="hover:text-stone-800 transition-colors">Home</Link>
          <span className="mx-2">·</span>
          <span className="text-stone-700">{title}</span>
        </nav>

        <header className="mb-10 pb-6 border-b border-stone-300">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-stone-900 tracking-tight">
            {title}
          </h1>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-stone-500">
            Last updated: {lastUpdated}
          </p>
        </header>

        <article className="policy-prose font-body text-stone-700 leading-relaxed space-y-6">
          {children}
        </article>

        <footer className="mt-16 pt-6 border-t border-stone-300 text-xs text-stone-500 font-body">
          <p>
            Questions? Email{' '}
            <a href="mailto:jimmy@jimmypotters.com" className="text-stone-700 underline hover:text-stone-900">
              jimmy@jimmypotters.com
            </a>{' '}
            or call <a href="tel:+17038621300" className="text-stone-700 underline hover:text-stone-900">(703) 862-1300</a>.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link href="/shipping" className="underline hover:text-stone-800">Shipping</Link>
            <Link href="/returns" className="underline hover:text-stone-800">Returns &amp; Refunds</Link>
            <Link href="/terms" className="underline hover:text-stone-800">Terms</Link>
            <Link href="/privacy" className="underline hover:text-stone-800">Privacy</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';
import { salesEnabled } from '@/lib/sales-mode';

/**
 * Site-wide preview-mode banner. Renders only when sales are disabled via
 * NEXT_PUBLIC_SALES_ENABLED. Hidden on /admin/** (admin has its own chrome).
 *
 * Styling reuses the existing brand palette (Jimmy Potters gold #C9A96E / #E8D5A3
 * on warm stone backgrounds) — no new colors.
 */
export default function TestRunBanner() {
  const { t } = useLanguage();
  const pathname = usePathname() || '/';

  if (salesEnabled) return null;
  if (pathname.startsWith('/admin')) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[60] w-full border-b border-[rgba(201,169,110,0.35)] bg-gradient-to-r from-[#3b2a14] via-[#4a3418] to-[#3b2a14] text-[#E8D5A3]"
    >
      <div className="section-container flex items-center justify-center gap-3 px-4 py-2 text-center">
        <span aria-hidden="true" className="text-base">🚧</span>
        <p className="font-heading text-xs sm:text-sm font-bold tracking-wide">
          {t.previewBanner.text}
        </p>
      </div>
    </div>
  );
}

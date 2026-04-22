'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';

/**
 * Friendly "coming soon" card shown at /checkout when the site is in preview mode
 * (NEXT_PUBLIC_SALES_ENABLED=false). The parent page renders THIS instead of the
 * interactive Stripe form, so no Stripe UI flashes on direct navigation.
 */
export default function CheckoutPreviewGate() {
  const { t } = useLanguage();
  return (
    <div className="shop-bg min-h-screen">
      <div className="shop-particles" aria-hidden="true">
        <div className="shop-particle" />
        <div className="shop-particle" />
        <div className="shop-particle" />
      </div>
      <div className="shop-section relative z-10">
        <div className="card-faire-detail p-10 md:p-16 text-center max-w-2xl mx-auto">
          <div aria-hidden="true" className="text-5xl md:text-6xl mb-5">🚧</div>
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-white tracking-tight">
            {t.preview.checkoutTitle}
          </h1>
          <p className="text-stone-400 font-body text-sm md:text-base leading-relaxed mt-4 max-w-xl mx-auto">
            {t.preview.checkoutSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link href="/shop" className="btn-faire inline-block !w-auto">
              {t.preview.backToShop}
            </Link>
            <Link
              href="/wholesale"
              className="inline-block px-6 py-3 rounded-xl border border-[rgba(201,169,110,0.3)] text-[#E8D5A3] hover:bg-[rgba(201,169,110,0.1)] transition-all duration-200 font-heading font-bold text-sm"
            >
              {t.preview.applyWholesale}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

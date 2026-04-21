'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/LanguageProvider';

export default function AboutPageClient() {
  const { t } = useLanguage();

  return (
    <div>
      {/* Hero — Full-bleed garden background */}
      <section className="relative min-h-[55vh] md:min-h-[72vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/brand/about-garden.jpg"
            alt="Jimmy Potters tropical patio in Fort Lauderdale — handmade pottery on white shelves with bougainvillea, palm trees, and blue sky"
            fill
            className="object-cover object-center scale-105"
            priority
            quality={90}
            sizes="100vw"
          />
          {/* Deeper gradient for crisp text legibility at any crop */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
        </div>

        {/* Hero text */}
        <div className="relative section-container py-24 md:py-32 text-center">
          <span className="inline-block font-body text-[10px] font-semibold tracking-[0.3em] uppercase text-white/90 mb-4">
            Our Story
          </span>
          <h1
            className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-[1.05] tracking-tight"
            style={{ textShadow: '0 2px 24px rgba(0,0,0,0.55)' }}
          >
            {t.aboutPage.title}
          </h1>
          <p className="text-white/95 font-body mt-4 text-lg md:text-xl max-w-2xl mx-auto" style={{ textShadow: '0 1px 12px rgba(0,0,0,0.55)' }}>
            {t.aboutPage.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5 text-xs font-body text-white/90">
            <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">Wheel-thrown in Florida</span>
            <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">Kiln-fired to 2,200°F</span>
            <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">Wholesale Available</span>
          </div>
        </div>
      </section>

      {/* Content — clean white cards on warm cream background */}
      <div className="bg-[#F7F3EE]">
        <div className="section-container py-16 md:py-20">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Our Mission */}
            <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12 border border-stone-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center">
                  <span className="text-xl">🏺</span>
                </div>
                <h2 className="font-heading font-bold text-2xl text-black">
                  {t.aboutPage.potteryTitle}
                </h2>
              </div>
              <p className="text-black font-body leading-relaxed mb-4 text-[15px]">
                {t.aboutPage.potteryP1}
              </p>
              <p className="text-black font-body leading-relaxed text-[15px]">
                {t.aboutPage.potteryP2}
              </p>
            </section>

            {/* What Makes Us Different — trust signals with wholesale-buyer relevance */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-stone-100 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔥</span>
                </div>
                <h3 className="font-heading font-bold text-base text-black mb-2">Kiln-Fired</h3>
                <p className="text-black font-body text-sm leading-relaxed">
                  Cone 6 (2,200°F), lead-free food-safe glazes. Built to survive shipping, retail handling, and real customers.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-stone-100 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✋</span>
                </div>
                <h3 className="font-heading font-bold text-base text-black mb-2">Handmade</h3>
                <p className="text-black font-body text-sm leading-relaxed">
                  Wheel-thrown stoneware. No two alike — a story your sales team can actually tell at checkout.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-stone-100 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📦</span>
                </div>
                <h3 className="font-heading font-bold text-base text-black mb-2">Ships Safely</h3>
                <p className="text-black font-body text-sm leading-relaxed">
                  Double-boxed FedEx with tracking + insurance. Under 1% breakage across 2025 fulfillment.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-stone-100 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏬</span>
                </div>
                <h3 className="font-heading font-bold text-base text-black mb-2">Wholesale-Ready</h3>
                <p className="text-black font-body text-sm leading-relaxed">
                  Tiered pricing, low MOQ, 4–6 week production. Line sheets and Net 30 terms on approval.
                </p>
              </div>
            </section>

            {/* Wholesale — pitch block for buyers */}
            <section className="relative rounded-2xl overflow-hidden border border-stone-200 bg-gradient-to-br from-[#1a1a1a] via-[#2a2420] to-[#1a1a1a] text-white">
              <div className="absolute inset-0 opacity-[0.15]">
                <Image
                  src="/images/products/teal-hanging-planter-pothos_hero.jpg"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 896px"
                />
              </div>
              <div className="relative p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                  <div>
                    <span className="inline-block font-body text-[10px] font-semibold tracking-[0.3em] uppercase text-[#E8D5A3] mb-3">
                      {t.aboutPage.wholesaleEyebrow}
                    </span>
                    <h2 className="font-heading font-bold text-2xl md:text-3xl text-white mb-4 leading-tight">
                      {t.aboutPage.wholesaleTitle}
                    </h2>
                    <p className="text-white/85 font-body leading-relaxed text-[15px] mb-6">
                      {t.aboutPage.wholesaleLead}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        href="/login?wholesale=1"
                        className="inline-flex items-center justify-center gap-2 bg-[#C9A96E] text-[#1a1a1a] hover:bg-[#E8D5A3] font-body font-semibold py-3 px-6 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-black/30"
                      >
                        {t.aboutPage.wholesaleCta}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                      <a
                        href="mailto:jimmy@jimmypotters.com?subject=Wholesale%20Line%20Sheet%20Request"
                        className="inline-flex items-center justify-center gap-2 border border-white/30 text-white hover:bg-white/10 font-body font-semibold py-3 px-6 rounded-xl transition-all duration-200 text-sm"
                      >
                        {t.aboutPage.wholesaleCtaSecondary}
                      </a>
                    </div>
                  </div>
                  <ul className="space-y-3 text-[15px] font-body">
                    {[t.aboutPage.wholesaleBullet1, t.aboutPage.wholesaleBullet2, t.aboutPage.wholesaleBullet3, t.aboutPage.wholesaleBullet4].map((line) => (
                      <li key={line} className="flex items-start gap-3">
                        <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#C9A96E]/20 text-[#E8D5A3] flex items-center justify-center text-[11px] font-bold">✓</span>
                        <span className="text-white/90">{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Visit & Contact */}
            <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-stone-100">
              {/* Garden image strip */}
              <div className="relative h-48 md:h-56">
                <Image
                  src="/images/products/orange-footed-planter-colorful-garden.jpg"
                  alt="Orange footed planter in a vibrant garden setting"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 896px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
              </div>

              <div className="p-8 md:p-12 text-center -mt-8 relative">
                <h2 className="font-heading font-bold text-2xl text-black mb-2">
                  {t.aboutPage.contactTitle}
                </h2>
                <p className="text-black font-body mb-6 text-sm">
                  {t.aboutPage.contactSubtitle}
                </p>

                {/* Contact grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto text-sm font-body">
                  <a href="mailto:jimmy@jimmypotters.com" className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 hover:bg-[#C9A96E]/10 transition-colors text-black hover:text-black">
                    <svg className="w-4 h-4 text-[#C9A96E] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    jimmy@jimmypotters.com
                  </a>
                  <a href="tel:+16194020018" className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 hover:bg-[#C9A96E]/10 transition-colors text-black hover:text-black">
                    <svg className="w-4 h-4 text-[#C9A96E] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    (619) 402-0018
                  </a>
                  <a href="https://instagram.com/jimmypottersvirtualclayclass" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 hover:bg-[#C9A96E]/10 transition-colors text-black hover:text-black">
                    <svg className="w-4 h-4 text-[#C9A96E] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                    Instagram
                  </a>
                  <a href="https://facebook.com/Jpsfairfax" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 hover:bg-[#C9A96E]/10 transition-colors text-black hover:text-black">
                    <svg className="w-4 h-4 text-[#C9A96E] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </a>
                </div>

                <div className="mt-6 flex items-center justify-center gap-3 text-black text-xs font-body">
                  <span>📍 Fort Lauderdale, Florida</span>
                  <span>·</span>
                  <span>Mon–Fri 10 AM – 6 PM</span>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
                  <Link href="/shop" className="inline-flex items-center justify-center gap-2 bg-[#C9A96E] text-[#1a1a1a] hover:bg-[#E8D5A3] font-body font-semibold py-3 px-6 rounded-xl transition-all duration-200 text-sm">
                    {t.aboutPage.shopBtn}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                  <Link href="/shop/gallery" className="inline-flex items-center justify-center gap-2 border border-stone-300 text-black hover:border-stone-400 hover:text-stone-800 font-body font-semibold py-3 px-6 rounded-xl transition-all duration-200 text-sm">
                    View Gallery
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

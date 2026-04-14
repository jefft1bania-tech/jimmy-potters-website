'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';

export default function KitPageClient() {
  const { t } = useLanguage();

  const kitItems = [
    { icon: '🎨', text: t.kit.item1 },
    { icon: '🏺', text: t.kit.item2 },
    { icon: '🔧', text: t.kit.item3 },
    { icon: '🌀', text: t.kit.item4 },
  ];

  const steps = [
    { number: '01', text: t.kit.step1 },
    { number: '02', text: t.kit.step2 },
    { number: '03', text: t.kit.step3 },
  ];

  return (
    <div>
      {/* Hero — Kit image with overlay */}
      <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/kit-date-night.jpeg"
            alt="Jimmy Potters Home Pottery Kit — Date Night Edition with paint tubes, clay shapes, sculpting tools, and stamp mat"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
        </div>

        <div className="relative section-container py-20 md:py-28 text-center">
          <span className="inline-block font-body text-[10px] font-semibold tracking-[0.3em] uppercase text-white/80 mb-4">
            {t.kit.dateNightTitle}
          </span>
          <h1
            className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-[1.05] tracking-tight"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
          >
            {t.kit.title}
          </h1>
          <p className="text-white/80 font-body mt-4 text-lg max-w-xl mx-auto" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>
            {t.kit.subtitle}
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="bg-[#F7F3EE]">
        <div className="section-container py-16 md:py-20">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Date Night Description */}
            <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12 border border-stone-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center">
                  <span className="text-xl">💑</span>
                </div>
                <h2 className="font-heading font-bold text-2xl text-stone-900">
                  {t.kit.dateNightTitle}
                </h2>
              </div>
              <p className="text-stone-600 font-body leading-relaxed text-[15px]">
                {t.kit.dateNightDesc}
              </p>
              <p className="text-stone-400 font-body text-sm mt-4 italic">
                {t.kit.perfectFor}
              </p>
            </section>

            {/* What's Inside */}
            <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12 border border-stone-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center">
                  <span className="text-xl">📦</span>
                </div>
                <h2 className="font-heading font-bold text-2xl text-stone-900">
                  {t.kit.whatsInside}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {kitItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-stone-50 border border-stone-100">
                    <div className="w-10 h-10 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">{item.icon}</span>
                    </div>
                    <p className="text-stone-700 font-body text-sm leading-relaxed pt-2">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* How It Works — 3 steps */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {steps.map((step) => (
                <div key={step.number} className="bg-white rounded-2xl shadow-sm p-6 border border-stone-100 text-center">
                  <div className="w-12 h-12 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center mx-auto mb-4">
                    <span className="font-heading font-bold text-lg text-[#C9A96E]">{step.number}</span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-stone-900 mb-2">
                    {t.kit.howItWorks}
                  </h3>
                  <p className="text-stone-500 font-body text-sm leading-relaxed">
                    {step.text}
                  </p>
                </div>
              ))}
            </section>

            {/* Price & CTA */}
            <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-stone-100">
              {/* Kit image strip */}
              <div className="relative h-48 md:h-56">
                <Image
                  src="/kit-date-night.jpeg"
                  alt="Jimmy Potters Home Pottery Kit contents"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 896px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
              </div>

              <div className="p-8 md:p-12 text-center -mt-8 relative">
                <h2 className="font-heading font-bold text-3xl md:text-4xl text-stone-900 mb-2">
                  {t.kit.price}
                </h2>
                <p className="text-stone-500 font-body text-sm mb-2">
                  {t.kit.videoAccess}
                </p>
                <p className="text-stone-400 font-body text-xs mb-8">
                  {t.kit.perfectFor}
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    href="/checkout"
                    className="inline-flex items-center justify-center gap-2 bg-[#C9A96E] text-[#1a1a1a] hover:bg-[#E8D5A3] font-body font-semibold py-3 px-8 rounded-xl transition-all duration-200 text-sm"
                  >
                    {t.kit.buyBtn}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                  <Link
                    href="/shop"
                    className="inline-flex items-center justify-center gap-2 border border-stone-300 text-stone-600 hover:border-stone-400 hover:text-stone-800 font-body font-semibold py-3 px-8 rounded-xl transition-all duration-200 text-sm"
                  >
                    {t.nav.shop}
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/LanguageProvider';
import { getAvailableProducts, formatPrice } from '@/lib/products';

export default function HeroSection() {
  const { t } = useLanguage();
  const products = getAvailableProducts();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const total = products.length;

  const goNext = useCallback(() => {
    setDirection('next');
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setDirection('prev');
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-advance one at a time
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(goNext, 3500);
    return () => clearInterval(interval);
  }, [isPaused, goNext]);

  // Get product at offset from active (wraps around)
  const getProduct = (offset: number) => {
    const idx = (activeIndex + offset + total) % total;
    return products[idx];
  };

  // Wheel positions: -2, -1, 0 (center), +1, +2
  const wheelSlots = [-2, -1, 0, 1, 2];

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden" aria-label="Homepage hero">
      {/* Full-bleed studio background */}
      <div className="absolute inset-0">
        <Image
          src="/images/brand/studio-hero.jpg"
          alt="Jimmy Potters pottery studio — bright brick storefront with glass windows, customers browsing handmade ceramics"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative section-container py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center">

          {/* Left — Text card */}
          <div className="lg:col-span-5">
            <div className="bg-[#1a1a1a]/85 backdrop-blur-lg rounded-2xl p-7 md:p-9 border border-white/[0.06] shadow-2xl">
              <span className="inline-block font-body text-[10px] font-semibold tracking-[0.3em] uppercase text-[#C9A96E] mb-4">
                {t.hero.eyebrow}
              </span>

              <div className="relative">
                {/* Jok mascot — positioned above "Kind" */}
                <div className="absolute -top-[180px] right-[10%] w-[160px] h-[200px] z-10 pointer-events-auto">
                  <iframe
                    src="/jok-viewer.html"
                    width="160"
                    height="200"
                    style={{ border: 'none', background: 'transparent', pointerEvents: 'none' }}
                    title="Jok 3D mascot"
                    loading="lazy"
                  />
                </div>
                <h1 className="font-heading font-bold text-4xl md:text-5xl text-white leading-[1.05] tracking-tight">
                  {t.hero.title1}
                  <br />
                  <span className="italic font-normal text-[#E8D5A3]">
                    {t.hero.title2}
                  </span>
                </h1>
              </div>

              <p className="mt-4 text-sm text-white/55 font-body leading-relaxed">
                {t.hero.subtitle}
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <Link
                  href="/shop"
                  className="flex items-center justify-center gap-2 bg-white text-[#1a1a1a] hover:bg-gray-100 font-body font-semibold py-3 px-5 rounded-xl transition-all duration-200 text-sm hover:shadow-lg"
                >
                  {t.hero.shopBtn}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
                <Link
                  href="/shop/gallery"
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/15 font-body font-semibold py-3 px-5 rounded-xl transition-all duration-200 text-sm"
                >
                  View Gallery
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Right — Rolodex Wheel Carousel */}
          <div className="lg:col-span-7">
            <div
              className="relative bg-[#1a1a1a]/80 backdrop-blur-lg rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <span className="font-body text-[10px] font-semibold tracking-[0.3em] uppercase text-white/30">
                  The Collection &mdash; {total} Pieces
                </span>
                <span className="font-body text-[10px] font-semibold tracking-[0.2em] uppercase text-[#C9A96E]/60">
                  #{getProduct(0).productNumber} of {total}
                </span>
              </div>

              {/* Wheel viewport */}
              <div className="relative h-[340px] md:h-[380px] mx-4 mb-2" style={{ perspective: '1000px' }}>
                {/* Left arrow — centered vertically on the wheel */}
                <button
                  onClick={goPrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 z-20 w-10 h-10 rounded-full bg-[#C9A96E] hover:bg-[#E8D5A3] text-[#1a1a1a] flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105 active:scale-95"
                  aria-label="Previous product"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>

                {/* Right arrow — centered vertically on the wheel */}
                <button
                  onClick={goNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 z-20 w-10 h-10 rounded-full bg-[#C9A96E] hover:bg-[#E8D5A3] text-[#1a1a1a] flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105 active:scale-95"
                  aria-label="Next product"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
                {wheelSlots.map((offset) => {
                  const product = getProduct(offset);
                  const isCenter = offset === 0;
                  const absOffset = Math.abs(offset);

                  // Wheel transform: center is front-facing, sides rotate away
                  const rotateY = offset * 35;
                  const translateX = offset * 120;
                  const translateZ = isCenter ? 0 : -80 * absOffset;
                  const scale = isCenter ? 1 : Math.max(0.6, 1 - absOffset * 0.2);
                  const opacity = isCenter ? 1 : Math.max(0.2, 1 - absOffset * 0.35);
                  const zIndex = 10 - absOffset;

                  return (
                    <div
                      key={`${activeIndex}-${offset}`}
                      className="absolute left-1/2 top-1/2 transition-all duration-500 ease-out"
                      style={{
                        transform: `translateX(calc(-50% + ${translateX}px)) translateY(-50%) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                        opacity,
                        zIndex,
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      <Link
                        href={`/shop/${product.slug}`}
                        className={`block relative rounded-xl overflow-hidden shadow-2xl ${isCenter ? 'ring-2 ring-[#C9A96E]/40' : ''}`}
                        style={{ width: isCenter ? '220px' : '180px' }}
                        tabIndex={isCenter ? 0 : -1}
                      >
                        {/* Product image */}
                        <div className={`${isCenter ? 'aspect-[3/4]' : 'aspect-[3/4]'} relative bg-[#292524]`}>
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="220px"
                            priority={isCenter}
                          />

                          {/* Gold number badge */}
                          <div className="absolute top-2 left-2 z-10">
                            <span className={`inline-flex items-center justify-center rounded-full bg-[#C9A96E] text-[#1a1a1a] font-heading font-black leading-none shadow-lg ${
                              isCenter ? 'w-11 h-11 text-xl' : 'w-8 h-8 text-sm'
                            }`}>
                              {product.productNumber}
                            </span>
                          </div>

                          {/* Gradient overlay on non-center */}
                          {!isCenter && (
                            <div className="absolute inset-0 bg-black/30" />
                          )}
                        </div>

                        {/* Product info — only on center card */}
                        {isCenter && (
                          <div className="bg-[#111] px-4 py-3">
                            <p className="text-white font-body font-semibold text-sm leading-tight truncate">
                              {product.name}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[#C9A96E] font-heading font-bold text-lg">
                                {formatPrice(product.price)}
                              </span>
                              <span className="text-white/40 font-heading font-black text-xs">
                                #{product.productNumber}
                              </span>
                            </div>
                            {product.quickSpec && (
                              <p className="text-white/60 font-body text-xs mt-1.5 leading-snug">
                                {product.quickSpec}
                              </p>
                            )}
                            {product.bestUse && (
                              <p className="text-[#C9A96E]/70 font-body text-xs mt-1 leading-snug italic">
                                {product.bestUse}
                              </p>
                            )}
                          </div>
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 px-5 pb-4">
                {products.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setDirection(i > activeIndex ? 'next' : 'prev'); setActiveIndex(i); }}
                    className={`flex-shrink-0 rounded-full transition-all duration-300 ${
                      i === activeIndex
                        ? 'w-6 h-2 bg-[#C9A96E]'
                        : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                    }`}
                    aria-label={`Go to product ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

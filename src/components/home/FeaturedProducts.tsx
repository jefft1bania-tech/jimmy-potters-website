'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAvailableProducts, formatPrice } from '@/lib/products';
import { useLanguage } from '@/components/LanguageProvider';

export default function FeaturedProducts() {
  const products = getAvailableProducts();
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = products.length;

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (isPaused || total <= 1) return;
    const interval = setInterval(goNext, 3500);
    return () => clearInterval(interval);
  }, [isPaused, goNext, total]);

  const getProduct = (offset: number) => {
    const idx = (activeIndex + offset + total) % total;
    return products[idx];
  };

  const wheelSlots = [-2, -1, 0, 1, 2];

  return (
    <section className="section-container py-16 md:py-20" aria-labelledby="featured-heading">
      <div className="flex items-end justify-between mb-10">
        <div>
          <span className="font-body text-[10px] font-semibold tracking-[0.3em] uppercase text-[#C9A96E]/60 block mb-2">
            {t.featured.eyebrow}
          </span>
          <h2
            id="featured-heading"
            className="font-heading font-bold text-3xl md:text-4xl text-white tracking-tight"
          >
            {t.featured.title}
          </h2>
          <p className="text-white/40 font-body mt-1.5 text-sm">
            {t.featured.subtitle}
          </p>
        </div>
        <Link
          href="/shop"
          className="hidden md:inline-flex items-center gap-1 text-white/50 font-body text-sm hover:text-white transition-colors"
        >
          {t.featured.viewAll}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>

      {total > 0 && (
        <div
          className="relative bg-[#1a1a1a]/60 backdrop-blur-sm rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <span className="font-body text-[10px] font-semibold tracking-[0.3em] uppercase text-white/30">
              The Studio &mdash; {total} Pieces
            </span>
            <span className="font-body text-[10px] font-semibold tracking-[0.2em] uppercase text-[#C9A96E]/60">
              #{getProduct(0).productNumber} of {total}
            </span>
          </div>

          <div className="relative h-[360px] md:h-[420px] mx-4 mb-2" style={{ perspective: '1000px' }}>
            <button
              onClick={goPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 z-20 w-10 h-10 rounded-full bg-[#C9A96E] hover:bg-[#E8D5A3] text-[#1a1a1a] flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105 active:scale-95"
              aria-label="Previous product"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
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
              const rotateY = offset * 35;
              const translateX = offset * 130;
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
                    style={{ width: isCenter ? '240px' : '190px' }}
                    tabIndex={isCenter ? 0 : -1}
                  >
                    <div className="aspect-[3/4] relative bg-[#292524]">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="240px"
                        priority={isCenter}
                      />
                      <div className="absolute top-2 left-2 z-10">
                        <span className={`inline-flex items-center justify-center rounded-full bg-[#C9A96E] text-[#1a1a1a] font-heading font-black leading-none shadow-lg ${
                          isCenter ? 'w-11 h-11 text-xl' : 'w-8 h-8 text-sm'
                        }`}>
                          {product.productNumber}
                        </span>
                      </div>
                      {!isCenter && <div className="absolute inset-0 bg-black/30" />}
                    </div>

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

          <div className="flex items-center justify-center gap-1.5 px-5 pb-4 flex-wrap">
            {products.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
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
      )}

      <div className="mt-8 text-center md:hidden">
        <Link href="/shop" className="inline-block bg-white text-brand-text hover:bg-gray-50 font-heading font-bold py-3.5 px-8 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
          {t.featured.viewAllMobile}
        </Link>
      </div>
    </section>
  );
}

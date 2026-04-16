'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';

const kitImages = [
  { src: '/kit-1.jpeg', alt: 'What\'s In My Kit? — Jimmy Potters Pottery Kit for Two branded blue box with pastel paints' },
  { src: '/kit-2.jpeg', alt: '2KG of Jimmy Potters branded air-dry clay — enough for 3-4 small pieces or 1-2 larger ones' },
  { src: '/kit-3.jpeg', alt: 'Pottery carving, shaping, and cutting tools in branded canvas drawstring bag' },
  { src: '/kit-4.jpeg', alt: '2 ultra fine bristle paintbrushes — Contoured Brush and Detail Brush' },
  { src: '/kit-5.jpeg', alt: 'Waterproof glossy or matte varnish — seal your finished piece with gloss or matte' },
  { src: '/kit-6.jpeg', alt: 'Paint set of your choice — pastel, floral, earth, or classic tones with 8 color tubes' },
  { src: '/kit-7.jpeg', alt: 'Ready to get making — woman creating pottery at home with the Jimmy Potters kit' },
];

export default function KitCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % kitImages.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + kitImages.length) % kitImages.length);
  }, []);

  // Auto-advance every 4 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, next]);

  const goTo = (index: number) => {
    setCurrent(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Main image */}
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#e8e0f0] shadow-lg">
        <Image
          src={kitImages[current].src}
          alt={kitImages[current].alt}
          fill
          className="object-contain transition-opacity duration-500"
          sizes="(max-width: 768px) 100vw, 640px"
          quality={85}
          priority={current === 0}
        />

        {/* Left arrow */}
        <button
          onClick={() => { prev(); setIsAutoPlaying(false); setTimeout(() => setIsAutoPlaying(true), 10000); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all backdrop-blur-sm"
          aria-label="Previous image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Right arrow */}
        <button
          onClick={() => { next(); setIsAutoPlaying(false); setTimeout(() => setIsAutoPlaying(true), 10000); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all backdrop-blur-sm"
          aria-label="Next image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Counter */}
        <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs font-body font-bold px-2.5 py-1 rounded-full">
          {current + 1} / {kitImages.length}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {kitImages.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === current
                ? 'bg-[#C9A96E] scale-125'
                : 'bg-stone-300 hover:bg-stone-400'
            }`}
            aria-label={`Go to image ${i + 1}`}
          />
        ))}
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 mt-3 overflow-x-auto pb-2 px-1">
        {kitImages.map((img, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${
              i === current
                ? 'border-[#C9A96E] shadow-md scale-105'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              width={64}
              height={80}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

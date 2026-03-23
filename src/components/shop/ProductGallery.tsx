'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export default function ProductGallery({ images, name }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      {/* Main Image — Faire clean, no border radius */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-50">
        <Image
          src={images[activeIndex]}
          alt={`${name} — view ${activeIndex + 1}`}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, 55vw"
          priority
        />
      </div>

      {/* Thumbnails — subtle, editorial */}
      {images.length > 1 && (
        <div className="flex gap-3 mt-4" role="tablist" aria-label="Product image gallery">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`View image ${i + 1} of ${images.length}`}
              className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cta ${
                i === activeIndex
                  ? 'border-brand-text shadow-sm'
                  : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

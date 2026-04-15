'use client';

import Image from 'next/image';
import { useState } from 'react';

const classPhotos = [
  { src: '/images/classes/class-1.jpeg', alt: 'Student Evie showing her handmade pottery bowls', caption: 'Evie (2nd grade) with her painted pottery bowls' },
  { src: '/images/classes/class-2.jpeg', alt: 'Student proudly displaying colorful clay creations', caption: 'Showing off colorful clay creations' },
  { src: '/images/classes/class-3.jpeg', alt: 'Instructor with students and their pottery projects', caption: 'Creating memories with every class' },
  { src: '/images/classes/class-4.jpeg', alt: 'Kids working together at a pottery table with paint and clay', caption: 'Hands-on creativity in every session' },
];

export default function ClassGallery() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <section className="bg-[#2A1810] py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block font-body font-bold text-[10px] tracking-[0.3em] uppercase text-[#C9A96E] mb-3">
            Our Little Artists
          </span>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-white">
            See What Kids Are Creating
          </h2>
          <p className="text-white/60 font-body mt-3 max-w-xl mx-auto">
            Real students, real creations. Every class is an adventure in creativity.
          </p>
        </div>

        {/* Rolodex Grid — 2x2 on desktop, scrollable on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {classPhotos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className="group relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Caption on hover */}
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white text-xs font-body font-semibold drop-shadow-lg">
                  {photo.caption}
                </p>
              </div>
              {/* Corner badge */}
              <div className="absolute top-2 right-2 bg-[#C9A96E] text-black text-[9px] font-extrabold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                {i + 1}/{classPhotos.length}
              </div>
            </button>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-8">
          <p className="text-white/50 text-sm font-body">
            K-5th grade &bull; 6-8 week sessions &bull; $235-$250 per child &bull; All materials included
          </p>
        </div>
      </div>

      {/* Lightbox overlay */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl z-10"
            onClick={() => setSelectedIndex(null)}
            aria-label="Close"
          >
            &times;
          </button>
          {/* Navigation arrows */}
          <button
            className="absolute left-4 text-white/70 hover:text-white text-4xl z-10"
            onClick={(e) => { e.stopPropagation(); setSelectedIndex((selectedIndex - 1 + classPhotos.length) % classPhotos.length); }}
            aria-label="Previous"
          >
            &#8249;
          </button>
          <button
            className="absolute right-4 text-white/70 hover:text-white text-4xl z-10"
            onClick={(e) => { e.stopPropagation(); setSelectedIndex((selectedIndex + 1) % classPhotos.length); }}
            aria-label="Next"
          >
            &#8250;
          </button>
          <div className="relative max-w-3xl max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={classPhotos[selectedIndex].src}
              alt={classPhotos[selectedIndex].alt}
              width={800}
              height={1067}
              className="rounded-xl object-contain max-h-[85vh] mx-auto"
            />
            <p className="text-white text-center mt-3 font-body text-sm">
              {classPhotos[selectedIndex].caption}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

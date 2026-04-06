'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';

const galleryImages = [
  {
    src: '/images/products/orange-drip-glaze-vase_lifestyle.jpg',
    alt: 'Orange drip-glaze vase with tulips on outdoor couch',
    caption: 'Drip-Glaze Vase — Patio Living',
    spec: '5"W × 8"H · 2.5 lbs',
    use: 'Outdoor patio · Fresh flowers',
  },
  {
    src: '/images/products/celadon-drip-vase_lifestyle.jpg',
    alt: 'Celadon vase with yellow tulips on dining table',
    caption: 'Celadon Vase — Dining Room',
    spec: '4.5"W × 7"H · 2 lbs',
    use: 'Dining table · Bookshelf · Bud vase',
  },
  {
    src: '/images/products/orange-footed-drip-planter_garden.jpg',
    alt: 'Orange footed planter with pothos in spring garden',
    caption: 'Footed Planter — Spring Garden',
    spec: '5"W × 5"H · Footed · 2.5 lbs',
    use: 'Garden · Windowsill · Herb planter',
  },
  {
    src: '/images/products/square-planter-garden-scene.jpg',
    alt: 'Square planter with daffodils surrounded by colorful flowers',
    caption: 'Square Planter — Garden Bed',
    spec: '5" × 5" × 5" · With saucer · 3 lbs',
    use: 'Outdoor garden · Patio table',
  },
  {
    src: '/images/products/navy-faceted-planter_shelf.jpg',
    alt: 'Navy faceted planter with money tree on wooden shelf',
    caption: 'Faceted Planter — Shelf Styling',
    spec: '5"W × 5.5"H · With saucer · 3 lbs',
    use: 'Desk · Shelf display · Indoor accent',
  },
  {
    src: '/images/products/dark-teal-hanging-planter-vines_porch.jpg',
    alt: 'Dark teal hanging planter with trailing vines on brick porch',
    caption: 'Hanging Planter — Brick Porch',
    spec: '6"W × 5"H · 12" ring · 3.5 lbs',
    use: 'Covered porch · Patio · Garden wall',
  },
];

export default function LifestyleGallery() {
  const { t } = useLanguage();

  return (
    <section className="section-container py-16 md:py-20 relative" aria-labelledby="gallery-heading">
      {/* Header — matching "From the Studio" format */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <span className="font-body text-[10px] font-semibold tracking-[0.3em] uppercase text-[#C9A96E]/60 block mb-2">
            Lifestyle
          </span>
          <h2
            id="gallery-heading"
            className="font-heading font-bold text-3xl md:text-4xl text-white tracking-tight"
          >
            {t.gallery.title}
          </h2>
          <p className="text-white/40 font-body mt-1.5 text-sm">
            {t.gallery.subtitle}
          </p>
        </div>
        <Link
          href="/shop"
          className="hidden md:inline-flex items-center gap-1 text-white/50 font-body text-sm hover:text-white transition-colors"
        >
          {t.gallery.shopLink}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>

      {/* Gallery grid — premium card-faire style with specs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {galleryImages.map((img, i) => (
          <Link
            key={i}
            href="/shop"
            className="card-faire group block"
          >
            <div className="faire-image-wrap aspect-[4/3]">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
            <div className="px-3 py-3">
              <p className="font-body text-sm font-medium text-stone-200 group-hover:text-white transition-colors">
                {img.caption}
              </p>
              <p className="font-body text-xs text-stone-300 mt-1 leading-snug">
                {img.spec}
              </p>
              <p className="font-body text-xs text-[#C9A96E]/80 mt-0.5 leading-snug italic">
                {img.use}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Mobile CTA */}
      <div className="mt-8 text-center md:hidden">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-white/50 font-body text-sm hover:text-white transition-colors"
        >
          {t.gallery.shopLink}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

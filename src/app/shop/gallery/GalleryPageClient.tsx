'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';

const ITEMS_PER_PAGE = 9;

interface GalleryPhoto {
  src: string;
  alt: string;
  caption: string;
}

interface GalleryPageClientProps {
  photos: GalleryPhoto[];
}

export default function GalleryPageClient({ photos }: GalleryPageClientProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { t } = useLanguage();

  const totalPages = Math.ceil(photos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPhotos = photos.slice(startIndex, endIndex);

  function goToPage(page: number) {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Global photo index for lightbox (accounts for pagination)
  const globalIndex = (localIndex: number) => startIndex + localIndex;

  function openLightbox(localIndex: number) {
    setLightboxIndex(globalIndex(localIndex));
  }

  function closeLightbox() {
    setLightboxIndex(null);
  }

  function prevPhoto() {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  }

  function nextPhoto() {
    if (lightboxIndex !== null && lightboxIndex < photos.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  }

  return (
    <div className="shop-bg min-h-screen">
      {/* Ambient particles */}
      <div className="shop-particles" aria-hidden="true">
        <div className="shop-particle" />
        <div className="shop-particle" />
        <div className="shop-particle" />
        <div className="shop-particle" />
        <div className="shop-particle" />
        <div className="shop-particle" />
      </div>

      <div className="shop-section relative z-10">
        {/* Breadcrumb */}
        <nav className="text-stone-500 text-sm font-body mb-12" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-stone-300 transition-colors">{t.shop.breadHome}</Link></li>
            <li aria-hidden="true"><span className="mx-1 text-stone-600">/</span></li>
            <li><Link href="/shop" className="hover:text-stone-300 transition-colors">{t.shop.breadShop}</Link></li>
            <li aria-hidden="true"><span className="mx-1 text-stone-600">/</span></li>
            <li><span className="text-stone-400">{t.galleryPage.breadGallery}</span></li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-4">
              {t.galleryPage.eyebrow}
            </p>
            <h1 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.05]">
              {t.galleryPage.title1}
              <br />
              <span className="text-stone-400">{t.galleryPage.title2}</span>
            </h1>

            <div className="gold-divider w-24 my-6" aria-hidden="true" />

            <p className="text-stone-400 font-body text-lg leading-relaxed">
              {t.galleryPage.subtitle(photos.length)}
              <br className="hidden sm:block" />
              {t.galleryPage.subtitle2}
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[rgba(201,169,110,0.3)] text-[#E8D5A3] hover:bg-[rgba(201,169,110,0.1)] transition-all duration-200 font-heading font-bold text-sm self-start md:self-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            {t.galleryPage.backBtn}
          </Link>
        </div>

        {/* Photo count */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-stone-500 font-body text-sm">
            {t.galleryPage.showing(startIndex + 1, Math.min(endIndex, photos.length), photos.length)}
          </p>
          <p className="text-stone-500 font-body text-sm">
            {t.shop.page(currentPage, totalPages)}
          </p>
        </div>

        {/* Photo Grid — 3x3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {currentPhotos.map((photo, i) => (
            <button
              key={startIndex + i}
              onClick={() => openLightbox(i)}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-stone-800/50 hover:border-[rgba(201,169,110,0.4)] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E] focus-visible:ring-offset-4 focus-visible:ring-offset-[#1C1917]"
              aria-label={`View ${photo.caption} full size`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              {/* Hover overlay with caption */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <p className="font-heading font-bold text-sm text-white">{photo.caption}</p>
              </div>
              {/* Photo number badge */}
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-heading font-bold backdrop-blur-sm border border-white/20 bg-black/40 text-white/70">
                  {startIndex + i + 1}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-16 flex items-center justify-center gap-2" aria-label="Gallery pagination">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1.5 px-5 py-3 rounded-xl font-heading font-bold text-sm transition-all duration-200 border border-[rgba(201,169,110,0.3)] text-[#E8D5A3] hover:bg-[rgba(201,169,110,0.1)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              aria-label="Previous page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              {t.shop.prev}
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-11 h-11 rounded-xl font-heading font-bold text-sm transition-all duration-200 ${
                  page === currentPage
                    ? 'bg-[rgba(201,169,110,0.25)] text-[#E8D5A3] border border-[rgba(201,169,110,0.5)]'
                    : 'text-stone-400 hover:text-[#E8D5A3] hover:bg-[rgba(201,169,110,0.08)] border border-transparent'
                }`}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1.5 px-5 py-3 rounded-xl font-heading font-bold text-sm transition-all duration-200 border border-[rgba(201,169,110,0.3)] text-[#E8D5A3] hover:bg-[rgba(201,169,110,0.1)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              aria-label="Next page"
            >
              {t.shop.next}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </nav>
        )}

        {/* Bottom divider */}
        <div className="gold-divider mt-20 mb-8" aria-hidden="true" />
        <p className="text-center text-stone-600 text-xs font-body tracking-[0.15em] uppercase">
          {t.shop.footer}
        </p>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Close lightbox"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous button */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Previous photo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          {/* Next button */}
          {lightboxIndex < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Next photo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-4xl max-h-[85vh] w-full h-full m-8"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[lightboxIndex].src}
              alt={photos[lightboxIndex].alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Caption */}
          <div className="absolute bottom-6 left-0 right-0 text-center">
            <p className="font-heading font-bold text-white text-lg">
              {photos[lightboxIndex].caption}
            </p>
            <p className="text-white/50 text-sm font-body mt-1">
              {t.galleryPage.ofPhotos(lightboxIndex + 1, photos.length)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

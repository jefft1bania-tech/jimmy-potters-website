'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types/product';
import { formatPrice } from '@/lib/products';
import { useLanguage } from '@/components/LanguageProvider';
import { useCart } from '@/components/cart/CartProvider';

const ITEMS_PER_PAGE = 9;

interface ShopPageClientProps {
  products: Product[];
}

// One card per product — primary image only, no duplicates
interface ProductCard {
  product: Product;
  imageSrc: string;
}

function buildProductCards(products: Product[]): ProductCard[] {
  return products.map((product) => ({
    product,
    imageSrc: product.images[0], // primary image only
  }));
}

export default function ShopPageClient({ products }: ShopPageClientProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useLanguage();
  const { addItem, isInCart, getItemQuantity } = useCart();

  const allCards = buildProductCards(products);
  const totalProducts = allCards.length;
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentCards = allCards.slice(startIndex, endIndex);

  function goToPage(page: number) {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen">
      {/* Hero background — luxury backyard with fire pit */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <img
          src="/images/brand/jimmy-potters-studio.jpeg"
          alt="Jimmy Potters pottery studio — handmade ceramics workshop"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0C0A09]" />
        <div className="absolute bottom-0 left-0 right-0 section-container pb-8 md:pb-12 relative z-10">
          <p className="text-xs font-heading font-bold uppercase tracking-[0.3em] text-white/70 mb-2">The Collection</p>
          <h1 className="font-heading font-bold text-4xl md:text-5xl text-white tracking-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            Handmade <span className="italic font-normal text-[#E8D5A3]">Pottery</span>
          </h1>
        </div>
      </div>

      {/* Products section — dark gallery */}
      <div className="shop-bg">
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
            <li><span className="text-stone-400">{t.shop.breadShop}</span></li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-4">
              {t.shop.eyebrow}
            </p>
            <h1 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.05]">
              {t.shop.title1}
              <br />
              <span className="text-stone-400">{t.shop.title2}</span>
            </h1>

            <div className="gold-divider w-24 my-6" aria-hidden="true" />

            <p className="text-stone-400 font-body text-lg leading-relaxed">
              {t.shop.subtitle}
              <br className="hidden sm:block" />
              {t.shop.subtitle2}
            </p>

            <p className="text-stone-500 font-body text-sm leading-relaxed mt-4">
              {t.shop.aboutIntro}
            </p>
            <p className="text-amber-400/80 font-heading font-bold text-sm mt-2">
              {t.shop.aboutHighlight}
            </p>
          </div>

          {/* Gallery link */}
          <Link
            href="/shop/gallery"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[rgba(201,169,110,0.3)] text-[#E8D5A3] hover:bg-[rgba(201,169,110,0.1)] transition-all duration-200 font-heading font-bold text-sm self-start md:self-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            {t.shop.galleryBtn}
          </Link>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <p className="text-stone-500 font-body text-sm">
            {t.shop.showing(startIndex + 1, Math.min(endIndex, totalProducts), totalProducts)}
          </p>
          {totalPages > 1 && (
            <p className="text-stone-500 font-body text-sm">
              {t.shop.page(currentPage, totalPages)}
            </p>
          )}
        </div>

        {/* Product Grid — one card per product, no duplicates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {currentCards.map((card) => {
            const isSold = card.product.status === 'sold';
            const inCart = isInCart(card.product.id);
            const qty = getItemQuantity(card.product.id);

            return (
              <div key={card.product.id} className="relative">
                <Link
                  href={`/shop/${card.product.slug}`}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E] focus-visible:ring-offset-4 focus-visible:ring-offset-[#1C1917] rounded-2xl"
                >
                  <article className={`card-faire group ${isSold ? 'opacity-50' : ''}`}>
                    {/* Image — primary only */}
                    <div className="faire-image-wrap aspect-[4/5]">
                      <Image
                        src={card.imageSrc}
                        alt={card.product.name}
                        fill
                        className={`object-cover ${isSold ? 'grayscale' : ''}`}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />

                      {/* Badge — top left: One of a Kind */}
                      <div className="absolute top-3 left-3 z-10">
                        {isSold ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-heading font-bold bg-black/60 text-stone-400 backdrop-blur-sm border border-stone-700/50">
                            Sold
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-heading font-bold backdrop-blur-sm border border-[rgba(201,169,110,0.3)]"
                            style={{ background: 'rgba(201, 169, 110, 0.15)', color: '#E8D5A3' }}
                          >
                            {t.shop.oneOfAKind}
                          </span>
                        )}
                      </div>

                      {/* Badge — top right: product number */}
                      <div className="absolute top-3 right-3 z-10">
                        <span className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#C9A96E] text-[#1a1a1a] font-heading font-black text-lg md:text-xl leading-none shadow-lg">
                          {card.product.productNumber}
                        </span>
                      </div>

                      {/* Cart quantity badge — bottom left of image */}
                      {inCart && (
                        <div className="absolute bottom-3 left-3 z-10">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-heading font-bold backdrop-blur-md border border-[rgba(201,169,110,0.4)]"
                            style={{ background: 'rgba(201, 169, 110, 0.2)', color: '#E8D5A3' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            {qty} in cart
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="px-4 pt-4 pb-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-heading font-semibold text-sm text-stone-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                          {card.product.name}
                        </h3>
                        <span className="text-xs font-heading font-bold text-stone-500 whitespace-nowrap mt-0.5">
                          #{card.product.productNumber}
                        </span>
                      </div>
                      <p className="price-faire text-base mt-1.5">
                        {formatPrice(card.product.price)}
                      </p>
                      {card.product.quickSpec && (
                        <p className="text-stone-300 font-body text-xs mt-2 leading-snug">
                          {card.product.quickSpec}
                        </p>
                      )}
                      {card.product.bestUse && (
                        <p className="text-[#C9A96E]/80 font-body text-xs mt-1 leading-snug italic">
                          {card.product.bestUse}
                        </p>
                      )}

                      {/* Add to Cart button — below text verbiage */}
                      {!isSold && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addItem(card.product);
                          }}
                          className="w-full mt-3 py-2.5 rounded-xl font-heading font-bold text-sm text-center transition-all duration-200 border"
                          style={{
                            background: inCart
                              ? 'rgba(201, 169, 110, 0.12)'
                              : 'linear-gradient(135deg, #C9A96E 0%, #B8923E 100%)',
                            color: inCart ? '#E8D5A3' : '#1a1a1a',
                            borderColor: inCart
                              ? 'rgba(201, 169, 110, 0.3)'
                              : 'transparent',
                          }}
                          aria-label={`Add ${card.product.name} to cart`}
                        >
                          {inCart ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                              Add Another ({qty})
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-5.98.286h5.98zm0 0h6m-6 0a3 3 0 005.98.286H7.5zm6 0h2.25m0 0l-.644 2.577A1.5 1.5 0 0113.662 18H7.338a1.5 1.5 0 01-1.444-1.173L5.25 14.25m9.75-9l.375 1.5M17.25 6.375l.375 1.5m0 0l.375 1.5M18 8.625l-1.5.375m1.5-.375l1.5.375" />
                              </svg>
                              Add to Cart
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </article>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-16 flex items-center justify-center gap-2" aria-label="Shop pagination">
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

        {/* Bottom decorative divider */}
        <div className="gold-divider mt-20 mb-8" aria-hidden="true" />
        <p className="text-center text-stone-600 text-xs font-body tracking-[0.15em] uppercase">
          {t.shop.footer}
        </p>
      </div>
      </div>
    </div>
  );
}

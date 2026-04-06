'use client';

import Link from 'next/link';
import { getFeaturedProducts } from '@/lib/products';
import ProductCard from '@/components/shop/ProductCard';
import { useLanguage } from '@/components/LanguageProvider';

export default function FeaturedProducts() {
  const products = getFeaturedProducts(4);
  const { t } = useLanguage();

  return (
    <section className="section-container py-16 md:py-20" aria-labelledby="featured-heading">
      {/* Header — consistent format */}
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

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Mobile CTA */}
      <div className="mt-8 text-center md:hidden">
        <Link href="/shop" className="inline-block bg-white text-brand-text hover:bg-gray-50 font-heading font-bold py-3.5 px-8 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
          {t.featured.viewAllMobile}
        </Link>
      </div>
    </section>
  );
}

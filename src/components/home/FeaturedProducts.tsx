import Link from 'next/link';
import { getFeaturedProducts } from '@/lib/products';
import ProductCard from '@/components/shop/ProductCard';

export default function FeaturedProducts() {
  const products = getFeaturedProducts(4);

  return (
    <section className="section-container py-20" aria-labelledby="featured-heading">
      {/* Header — Faire editorial */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2
            id="featured-heading"
            className="font-heading font-black text-3xl md:text-4xl text-white tracking-tight"
          >
            From the Studio
          </h2>
          <p className="text-white/40 font-body mt-1.5 text-sm">
            Handmade. One of a kind. Yours.
          </p>
        </div>
        <Link
          href="/shop"
          className="hidden md:inline-flex items-center gap-1 text-white/50 font-body text-sm hover:text-white transition-colors"
        >
          View all
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
        <Link href="/shop" className="btn-faire inline-block !w-auto">
          View All Pottery
        </Link>
      </div>
    </section>
  );
}

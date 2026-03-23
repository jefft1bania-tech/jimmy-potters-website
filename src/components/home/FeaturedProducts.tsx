import Link from 'next/link';
import { getFeaturedProducts } from '@/lib/products';
import ProductCard from '@/components/shop/ProductCard';
import SectionHeading from '@/components/shared/SectionHeading';

export default function FeaturedProducts() {
  const products = getFeaturedProducts(4);

  return (
    <section className="section-container py-16">
      <div className="card p-8 md:p-12">
        <div className="flex items-center justify-between mb-8">
          <SectionHeading>From the Studio</SectionHeading>
          <Link
            href="/shop"
            className="text-brand-cta font-heading font-bold text-sm hover:underline hidden md:block"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Link href="/shop" className="btn-primary text-sm">
            View All Pottery →
          </Link>
        </div>
      </div>
    </section>
  );
}

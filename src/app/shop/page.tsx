import { getAllProducts } from '@/lib/products';
import ProductCard from '@/components/shop/ProductCard';
import SectionHeading from '@/components/shared/SectionHeading';
import Link from 'next/link';

export const metadata = {
  title: 'Shop Handmade Pottery | Jimmy Potters',
  description: 'Browse one-of-a-kind handmade pottery. Hanging planters, drip-glaze vases, and footed planters. Each piece is unique.',
};

export default function ShopPage() {
  const products = getAllProducts();
  const availableCount = products.filter((p) => p.status === 'available').length;

  return (
    <div className="py-12">
      {/* Page Header */}
      <div className="section-container mb-8">
        <nav className="text-white/50 text-sm font-body mb-4">
          <Link href="/" className="hover:text-white">Home</Link>
          <span className="mx-2">→</span>
          <span className="text-white/80">Shop</span>
        </nav>
        <SectionHeading light>Shop Handmade Pottery</SectionHeading>
        <p className="mt-2 text-white/60 font-body text-lg">
          Each piece is one of a kind. When it&apos;s gone, it&apos;s gone.
        </p>
      </div>

      {/* Product Grid */}
      <div className="section-container">
        <div className="card p-6 md:p-10">
          {availableCount === 0 ? (
            <div className="text-center py-16">
              <p className="text-2xl mb-2">🏺</p>
              <p className="font-heading font-bold text-xl text-brand-text">
                Everything has found a home!
              </p>
              <p className="text-gray-500 font-body mt-2">
                Follow us on Instagram for new drops. 🎨
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

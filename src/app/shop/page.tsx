import { getAllProducts } from '@/lib/products';
import ProductCard from '@/components/shop/ProductCard';
import Link from 'next/link';

export const metadata = {
  title: 'Shop Handmade Pottery | Jimmy Potters',
  description:
    'Browse one-of-a-kind handmade pottery. Hanging planters, drip-glaze vases, and footed planters. Each piece is unique — when it\'s gone, it\'s gone.',
};

export default function ShopPage() {
  const products = getAllProducts();
  const availableCount = products.filter((p) => p.status === 'available').length;

  return (
    <div className="shop-section">
      {/* Breadcrumb */}
      <nav className="text-white/40 text-sm font-body mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:text-white/70 transition-colors">Home</Link></li>
          <li aria-hidden="true"><span className="mx-1 text-white/20">/</span></li>
          <li><span className="text-white/70">Shop</span></li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-12">
        <h1 className="font-heading font-black text-4xl md:text-5xl text-white tracking-tight">
          Shop
        </h1>
        <p className="mt-3 text-white/50 font-body text-lg max-w-md">
          Each piece is handmade and one of a kind.
          When it&apos;s gone, it&apos;s gone.
        </p>
      </div>

      {/* Product Grid — Faire layout */}
      {availableCount === 0 ? (
        <div className="card-faire-detail p-16 text-center">
          <p className="font-heading font-bold text-xl text-brand-text">
            Everything has found a home
          </p>
          <p className="text-gray-400 font-body mt-2 text-sm">
            Follow us on Instagram for new drops.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

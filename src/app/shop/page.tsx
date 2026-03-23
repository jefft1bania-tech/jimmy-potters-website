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
    <div className="shop-bg min-h-screen">
      <div className="shop-section relative z-10">
        {/* Breadcrumb */}
        <nav className="text-stone-400 text-sm font-body mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-stone-600 transition-colors">Home</Link></li>
            <li aria-hidden="true"><span className="mx-1 text-stone-300">/</span></li>
            <li><span className="text-stone-600">Shop</span></li>
          </ol>
        </nav>

        {/* Header — luxury editorial */}
        <div className="mb-14 max-w-xl">
          <p className="text-xs font-heading font-bold uppercase tracking-[0.2em] text-stone-400 mb-3">
            The Collection
          </p>
          <h1 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl text-stone-800 tracking-tight leading-[1.05]">
            Handmade
            <br />
            Pottery
          </h1>
          <p className="mt-4 text-stone-500 font-body text-lg leading-relaxed">
            Each piece is wheel-thrown, glazed, and kiln-fired by hand.
            One of a kind — when it&apos;s gone, it&apos;s gone.
          </p>
        </div>

        {/* Product Grid */}
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
    </div>
  );
}

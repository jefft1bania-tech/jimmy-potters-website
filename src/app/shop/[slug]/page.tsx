import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllProducts, getProductBySlug, formatPrice } from '@/lib/products';
import ProductGallery from '@/components/shop/ProductGallery';
import AddToCartButton from '@/components/shop/AddToCartButton';
import Badge from '@/components/shared/Badge';

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: 'Product Not Found' };
  return {
    title: `${product.name} | Jimmy Potters`,
    description: product.description,
  };
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();

  return (
    <div className="py-12">
      <div className="section-container">
        {/* Breadcrumb */}
        <nav className="text-white/50 text-sm font-body mb-6">
          <Link href="/" className="hover:text-white">Home</Link>
          <span className="mx-2">→</span>
          <Link href="/shop" className="hover:text-white">Shop</Link>
          <span className="mx-2">→</span>
          <span className="text-white/80">{product.name}</span>
        </nav>

        {/* Product Card */}
        <div className="card p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Gallery */}
            <ProductGallery images={product.images} name={product.name} />

            {/* Details */}
            <div className="flex flex-col">
              <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-brand-text">
                {product.name}
              </h1>

              <p className="mt-3 text-3xl font-body font-bold text-brand-orange">
                {formatPrice(product.price)}
              </p>

              <div className="mt-4">
                <Badge variant="teal">One of a Kind ✨</Badge>
              </div>

              <p className="mt-6 text-gray-600 font-body leading-relaxed">
                {product.description}
              </p>

              {/* Details list */}
              <ul className="mt-6 space-y-2">
                {product.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 font-body">
                    <span className="text-brand-teal mt-0.5">•</span>
                    {detail}
                  </li>
                ))}
              </ul>

              {/* Shipping note */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl text-sm text-gray-500 font-body">
                📦 Ships within 3-5 business days. Carefully packaged with love.
              </div>

              {/* Add to Cart */}
              <div className="mt-8">
                <AddToCartButton product={product} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllProducts, getProductBySlug, formatPrice } from '@/lib/products';
import ProductGallery from '@/components/shop/ProductGallery';
import AddToCartButton from '@/components/shop/AddToCartButton';

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
    <div className="shop-bg min-h-screen">
      <div className="shop-section relative z-10">
        {/* Breadcrumb */}
        <nav className="text-stone-400 text-sm font-body mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-stone-600 transition-colors">Home</Link></li>
            <li aria-hidden="true"><span className="mx-1 text-stone-300">/</span></li>
            <li><Link href="/shop" className="hover:text-stone-600 transition-colors">Shop</Link></li>
            <li aria-hidden="true"><span className="mx-1 text-stone-300">/</span></li>
            <li><span className="text-stone-600">{product.name}</span></li>
          </ol>
        </nav>

        {/* Product Detail */}
        <div className="card-faire-detail p-6 md:p-10 lg:p-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 lg:gap-20">
            {/* Gallery */}
            <ProductGallery images={product.images} name={product.name} />

            {/* Details */}
            <div className="flex flex-col">
              {/* Badge */}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-heading font-bold bg-stone-100 text-stone-500 w-fit mb-4">
                One of a Kind
              </span>

              <h1 className="font-heading font-black text-2xl md:text-3xl lg:text-4xl text-stone-800 tracking-tight leading-tight">
                {product.name}
              </h1>

              <p className="price-faire text-2xl md:text-3xl mt-4 text-stone-800">
                {formatPrice(product.price)}
              </p>

              <div className="divider-faire my-6" />

              <p className="text-stone-500 font-body leading-relaxed text-[15px]">
                {product.description}
              </p>

              {/* Details list */}
              <ul className="mt-6 space-y-2.5" aria-label="Product details">
                {product.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-stone-500 font-body">
                    <span className="w-1 h-1 rounded-full bg-stone-300 mt-2 flex-shrink-0" aria-hidden="true" />
                    {detail}
                  </li>
                ))}
              </ul>

              <div className="divider-faire my-6" />

              {/* Shipping */}
              <div className="flex items-start gap-3 text-sm text-stone-400 font-body">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                <span>Complimentary shipping within the US. Ships within 3–5 business days, carefully packaged.</span>
              </div>

              {/* CTA */}
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

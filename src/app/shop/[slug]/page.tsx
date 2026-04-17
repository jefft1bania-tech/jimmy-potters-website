import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllProducts, getProductBySlug, formatPrice } from '@/lib/products';
import ProductGallery from '@/components/shop/ProductGallery';
import AddToCartButton from '@/components/shop/AddToCartButton';
import AddToWholesaleCartButton from '@/components/wholesale/AddToWholesaleCartButton';
import ShippingEstimator from '@/components/shop/ShippingEstimator';

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
  const totalProducts = getAllProducts().length;

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
        <nav className="text-stone-500 text-sm font-body mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-stone-300 transition-colors">Home</Link></li>
            <li aria-hidden="true"><span className="mx-1 text-stone-600">/</span></li>
            <li><Link href="/shop" className="hover:text-stone-300 transition-colors">Shop</Link></li>
            <li aria-hidden="true"><span className="mx-1 text-stone-600">/</span></li>
            <li><span className="text-stone-400">{product.name}</span></li>
          </ol>
        </nav>

        {/* Product Detail */}
        <div className="card-faire-detail p-6 md:p-10 lg:p-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 lg:gap-20">
            {/* Gallery */}
            <ProductGallery images={product.images} name={product.name} />

            {/* Details */}
            <div className="flex flex-col">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-heading font-bold border border-[rgba(201,169,110,0.3)]"
                  style={{ background: 'rgba(201, 169, 110, 0.1)', color: '#C9A96E' }}
                >
                  One of a Kind
                </span>
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-heading font-bold border border-white/20 bg-white/5 text-white/70"
                >
                  Product #{product.productNumber} of {totalProducts}
                </span>
              </div>

              <h1 className="font-heading font-black text-2xl md:text-3xl lg:text-4xl text-white tracking-tight leading-tight">
                {product.name}
              </h1>

              <p className="price-faire text-2xl md:text-3xl mt-4">
                {formatPrice(product.price)}
              </p>

              <div className="divider-faire my-6" />

              {/* Specifications box */}
              <div className="rounded-xl border border-stone-700/50 bg-stone-900/50 p-5 mb-6">
                <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-[#C9A96E] mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                  Specifications
                </h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className="text-stone-500 text-[11px] font-heading font-bold uppercase tracking-wider">Height</p>
                    <p className="text-stone-200 text-sm font-body mt-0.5">{product.specs.height}</p>
                  </div>
                  <div>
                    <p className="text-stone-500 text-[11px] font-heading font-bold uppercase tracking-wider">Width</p>
                    <p className="text-stone-200 text-sm font-body mt-0.5">{product.specs.width}</p>
                  </div>
                  {product.specs.depth && (
                    <div>
                      <p className="text-stone-500 text-[11px] font-heading font-bold uppercase tracking-wider">Depth</p>
                      <p className="text-stone-200 text-sm font-body mt-0.5">{product.specs.depth}</p>
                    </div>
                  )}
                  {product.specs.mouth && (
                    <div>
                      <p className="text-stone-500 text-[11px] font-heading font-bold uppercase tracking-wider">Mouth Opening</p>
                      <p className="text-stone-200 text-sm font-body mt-0.5">{product.specs.mouth}</p>
                    </div>
                  )}
                  {product.specs.ringDiameter && (
                    <div>
                      <p className="text-stone-500 text-[11px] font-heading font-bold uppercase tracking-wider">Ring Diameter</p>
                      <p className="text-stone-200 text-sm font-body mt-0.5">{product.specs.ringDiameter}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-stone-500 text-[11px] font-heading font-bold uppercase tracking-wider">Weight</p>
                    <p className="text-stone-200 text-sm font-body mt-0.5">{product.specs.weight}</p>
                  </div>
                </div>
                {product.specs.note && (
                  <p className="text-stone-600 text-[11px] font-body mt-3 italic">
                    {product.specs.note}
                  </p>
                )}
              </div>

              <p className="text-stone-400 font-body leading-relaxed text-[15px]">
                {product.description}
              </p>

              {/* Details list */}
              <ul className="mt-6 space-y-2.5" aria-label="Product details">
                {product.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-stone-400 font-body">
                    <span className="w-1 h-1 rounded-full bg-[#C9A96E] mt-2 flex-shrink-0" aria-hidden="true" />
                    {detail}
                  </li>
                ))}
              </ul>

              <div className="divider-faire my-6" />

              {/* Shipping via FedEx */}
              <ShippingEstimator />

              {/* CTA */}
              <div className="mt-8 space-y-3">
                <AddToCartButton product={product} />
                <AddToWholesaleCartButton product={product} variant="detail" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

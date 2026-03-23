import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types/product';
import { formatPrice } from '@/lib/products';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isSold = product.status === 'sold';

  const card = (
    <article
      className={`card-faire group ${isSold ? 'opacity-60' : ''}`}
      aria-label={`${product.name} — ${isSold ? 'Sold' : formatPrice(product.price)}`}
    >
      {/* Image */}
      <div className="faire-image-wrap aspect-[4/5]">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className={`object-cover ${isSold ? 'grayscale' : ''}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {/* Badge — top left */}
        <div className="absolute top-3 left-3">
          {isSold ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-heading font-bold bg-white/90 text-gray-500 backdrop-blur-sm">
              Sold
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-heading font-bold bg-white/90 text-brand-text backdrop-blur-sm">
              One of a Kind
            </span>
          )}
        </div>
      </div>

      {/* Info — editorial spacing */}
      <div className="px-4 pt-4 pb-5">
        <h3 className="font-heading font-semibold text-sm text-brand-text leading-snug line-clamp-2 group-hover:text-gray-900 transition-colors">
          {product.name}
        </h3>
        <p className="price-faire text-base mt-1.5">
          {formatPrice(product.price)}
        </p>
      </div>
    </article>
  );

  if (isSold) return card;

  return (
    <Link href={`/shop/${product.slug}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cta focus-visible:ring-offset-4 rounded-2xl">
      {card}
    </Link>
  );
}

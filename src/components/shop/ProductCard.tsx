import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types/product';
import { formatPrice } from '@/lib/products';
import Badge from '@/components/shared/Badge';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isSold = product.status === 'sold';

  const card = (
    <div
      className={`group card overflow-hidden ${
        isSold ? 'opacity-70' : 'card-hover cursor-pointer'
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className={`object-cover transition-transform duration-300 ${
            isSold ? 'grayscale' : 'group-hover:scale-105'
          }`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {isSold ? (
            <Badge variant="sold">SOLD</Badge>
          ) : (
            <Badge variant="teal">One of a Kind</Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-heading font-semibold text-sm text-brand-text line-clamp-2">
          {product.name}
        </h3>
        <p className="font-body text-brand-orange font-bold text-base mt-1">
          {formatPrice(product.price)}
        </p>
      </div>
    </div>
  );

  if (isSold) return card;

  return (
    <Link href={`/shop/${product.slug}`}>
      {card}
    </Link>
  );
}

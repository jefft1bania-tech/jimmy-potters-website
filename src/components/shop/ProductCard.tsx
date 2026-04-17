'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types/product';
import { formatPrice } from '@/lib/products';
import { useLanguage } from '@/components/LanguageProvider';
import AddToWholesaleCartButton from '@/components/wholesale/AddToWholesaleCartButton';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isSold = product.status === 'sold';
  const { t } = useLanguage();

  const card = (
    <article
      className={`card-faire group ${isSold ? 'opacity-50' : ''}`}
      aria-label={`${product.name} — ${isSold ? t.shop.sold : formatPrice(product.price)}`}
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
        <div className="absolute top-3 left-3 z-10">
          {isSold ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-heading font-bold bg-black/60 text-stone-400 backdrop-blur-sm border border-stone-700/50">
              {t.shop.sold}
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-heading font-bold backdrop-blur-sm border border-[rgba(201,169,110,0.3)]"
              style={{ background: 'rgba(201, 169, 110, 0.15)', color: '#E8D5A3' }}>
              {t.shop.oneOfAKind}
            </span>
          )}
        </div>
      </div>

      {/* Large product number badge — top right */}
      <div className="absolute top-3 right-3 z-10">
        <span className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#C9A96E] text-[#1a1a1a] font-heading font-black text-lg md:text-xl leading-none shadow-lg">
          {product.productNumber}
        </span>
      </div>

      {/* Info */}
      <div className="px-4 pt-4 pb-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading font-semibold text-sm text-stone-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
            {product.name}
          </h3>
          <span className="text-[10px] font-heading font-bold text-stone-500 whitespace-nowrap mt-0.5">
            #{product.productNumber}
          </span>
        </div>
        <p className="price-faire text-base mt-1.5">
          {formatPrice(product.price)}
        </p>
        {product.quickSpec && (
          <p className="text-stone-300 font-body text-xs mt-2 leading-snug">
            {product.quickSpec}
          </p>
        )}
        {product.bestUse && (
          <p className="text-[#C9A96E]/80 font-body text-xs mt-1 leading-snug italic">
            {product.bestUse}
          </p>
        )}
        <AddToWholesaleCartButton product={product} variant="card" />
      </div>
    </article>
  );

  if (isSold) return card;

  return (
    <Link href={`/shop/${product.slug}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E] focus-visible:ring-offset-4 focus-visible:ring-offset-[#1C1917] rounded-2xl">
      {card}
    </Link>
  );
}

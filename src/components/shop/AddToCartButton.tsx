'use client';

import { useCart } from '@/components/cart/CartProvider';
import { Product } from '@/types/product';

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(product.id);
  const isSold = product.status === 'sold';

  if (isSold) {
    return (
      <button
        disabled
        className="btn-faire"
        aria-label={`${product.name} is sold out`}
      >
        Sold Out
      </button>
    );
  }

  if (inCart) {
    return (
      <button
        disabled
        className="w-full py-3.5 px-8 rounded-xl font-heading font-bold text-base bg-brand-teal/8 text-brand-teal border border-brand-teal/20 cursor-default transition-all"
        aria-label={`${product.name} is already in your cart`}
      >
        <span className="flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          In Your Cart
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={() => addItem(product)}
      className="btn-faire"
      aria-label={`Add ${product.name} to cart`}
    >
      Add to Cart
    </button>
  );
}

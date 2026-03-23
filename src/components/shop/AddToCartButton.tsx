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
        className="w-full py-4 px-8 rounded-xl bg-gray-200 text-gray-500 font-heading font-bold text-lg cursor-not-allowed"
      >
        Sold Out
      </button>
    );
  }

  if (inCart) {
    return (
      <button
        disabled
        className="w-full py-4 px-8 rounded-xl bg-brand-teal/10 text-brand-teal font-heading font-bold text-lg cursor-default"
      >
        ✓ In Your Cart
      </button>
    );
  }

  return (
    <button
      onClick={() => addItem(product)}
      className="w-full py-4 px-8 rounded-xl bg-brand-cta hover:bg-brand-cta-hover text-white font-heading font-bold text-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
    >
      Add to Cart 🛒
    </button>
  );
}

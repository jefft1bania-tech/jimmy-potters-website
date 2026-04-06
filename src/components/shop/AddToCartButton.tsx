'use client';

import { useCart } from '@/components/cart/CartProvider';
import { Product } from '@/types/product';

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem, isInCart, getItemQuantity, updateQuantity } = useCart();
  const inCart = isInCart(product.id);
  const qty = getItemQuantity(product.id);
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
      <div className="space-y-3">
        {/* Quantity controls */}
        <div className="flex items-center justify-between rounded-xl border px-4 py-3"
          style={{
            background: 'rgba(201, 169, 110, 0.08)',
            borderColor: 'rgba(201, 169, 110, 0.2)',
          }}
        >
          <span className="font-heading font-bold text-sm" style={{ color: '#C9A96E' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 inline mr-1.5 -mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            In Your Cart
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateQuantity(product.id, qty - 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors border border-stone-700 hover:border-[#C9A96E] bg-stone-800 hover:bg-stone-700 text-stone-300"
              aria-label="Decrease quantity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
              </svg>
            </button>
            <span className="font-heading font-bold text-white text-lg min-w-[1.5rem] text-center">{qty}</span>
            <button
              onClick={() => addItem(product)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors border border-stone-700 hover:border-[#C9A96E] bg-stone-800 hover:bg-stone-700 text-stone-300"
              aria-label="Increase quantity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>
        {/* Add more button */}
        <button
          onClick={() => addItem(product)}
          className="btn-faire w-full"
          aria-label={`Add another ${product.name} to cart`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Another
          </span>
        </button>
      </div>
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

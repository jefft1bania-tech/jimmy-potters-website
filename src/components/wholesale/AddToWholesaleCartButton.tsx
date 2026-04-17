'use client';

import { useWholesaleCart } from '@/components/wholesale/WholesaleCartProvider';
import { Product } from '@/types/product';

interface AddToWholesaleCartButtonProps {
  product: Product;
  /** `card` = compact inline variant for product grid tiles; `detail` = full CTA for product page */
  variant?: 'card' | 'detail';
}

export default function AddToWholesaleCartButton({
  product,
  variant = 'detail',
}: AddToWholesaleCartButtonProps) {
  const { addItem, isInCart, getItemQuantity, updateQuantity } = useWholesaleCart();
  const inCart = isInCart(product.id);
  const qty = getItemQuantity(product.id);
  const isSold = product.status === 'sold';

  if (isSold) {
    if (variant === 'card') return null;
    return (
      <button
        disabled
        className="btn-faire opacity-50 cursor-not-allowed"
        aria-label={`${product.name} is sold out`}
      >
        Sold Out
      </button>
    );
  }

  // The card button sits inside a <Link>, so every handler must stop propagation
  // to prevent a forced page navigation when the user just wants to add the item.
  const swallow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (variant === 'card') {
    if (inCart) {
      return (
        <div
          onClick={swallow}
          className="flex items-center justify-between gap-2 mt-3 rounded-lg border px-2.5 py-1.5"
          style={{
            background: 'rgba(56, 189, 248, 0.08)',
            borderColor: 'rgba(56, 189, 248, 0.25)',
          }}
        >
          <button
            onClick={(e) => {
              swallow(e);
              updateQuantity(product.id, qty - 1);
            }}
            className="w-6 h-6 rounded-md flex items-center justify-center border border-stone-700 hover:border-sky-400 bg-stone-800 hover:bg-stone-700 text-stone-300"
            aria-label={`Decrease wholesale quantity of ${product.name}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
            </svg>
          </button>
          <span className="font-heading font-bold text-sky-300 text-xs">
            Wholesale: {qty}
          </span>
          <button
            onClick={(e) => {
              swallow(e);
              addItem(product);
            }}
            className="w-6 h-6 rounded-md flex items-center justify-center border border-stone-700 hover:border-sky-400 bg-stone-800 hover:bg-stone-700 text-stone-300"
            aria-label={`Increase wholesale quantity of ${product.name}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={(e) => {
          swallow(e);
          addItem(product);
        }}
        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-heading font-bold uppercase tracking-wider transition-colors"
        style={{
          background: 'rgba(56, 189, 248, 0.08)',
          borderColor: 'rgba(56, 189, 248, 0.3)',
          color: '#7DD3FC',
        }}
        aria-label={`Add ${product.name} to wholesale cart`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Wholesale Cart
      </button>
    );
  }

  // variant === 'detail'
  if (inCart) {
    return (
      <div className="space-y-3">
        <div
          className="flex items-center justify-between rounded-xl border px-4 py-3"
          style={{
            background: 'rgba(56, 189, 248, 0.08)',
            borderColor: 'rgba(56, 189, 248, 0.2)',
          }}
        >
          <span className="font-heading font-bold text-sm text-sky-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 inline mr-1.5 -mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            In Wholesale Cart
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateQuantity(product.id, qty - 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors border border-stone-700 hover:border-sky-400 bg-stone-800 hover:bg-stone-700 text-stone-300"
              aria-label="Decrease wholesale quantity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
              </svg>
            </button>
            <span className="font-heading font-bold text-white text-lg min-w-[1.5rem] text-center">{qty}</span>
            <button
              onClick={() => addItem(product)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors border border-stone-700 hover:border-sky-400 bg-stone-800 hover:bg-stone-700 text-stone-300"
              aria-label="Increase wholesale quantity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>
        <button
          onClick={() => addItem(product)}
          className="w-full rounded-xl border px-4 py-3 font-heading font-bold text-sm uppercase tracking-wider transition-colors"
          style={{
            background: 'rgba(56, 189, 248, 0.08)',
            borderColor: 'rgba(56, 189, 248, 0.3)',
            color: '#7DD3FC',
          }}
          aria-label={`Add another ${product.name} to wholesale cart`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Another to Wholesale
          </span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => addItem(product)}
      className="w-full rounded-xl border px-4 py-3 font-heading font-bold text-sm uppercase tracking-wider transition-colors"
      style={{
        background: 'rgba(56, 189, 248, 0.08)',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        color: '#7DD3FC',
      }}
      aria-label={`Add ${product.name} to wholesale cart`}
    >
      <span className="flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Wholesale Cart
      </span>
    </button>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/cart/CartProvider';
import { formatPrice } from '@/lib/products';
import { useState } from 'react';

export default function CartPage() {
  const { items, removeItem, total, itemCount } = useCart();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            stripePriceId: item.stripePriceId,
            id: item.id,
          })),
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (itemCount === 0) {
    return (
      <div className="shop-section">
        <div className="card-faire-detail p-16 text-center max-w-lg mx-auto">
          <h1 className="font-heading font-black text-2xl text-brand-text">
            Your cart is empty
          </h1>
          <p className="text-gray-400 font-body mt-2 text-sm">
            Browse our one-of-a-kind pottery collection.
          </p>
          <Link href="/shop" className="btn-faire inline-block mt-6 !w-auto">
            Browse the Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-section">
      <h1 className="font-heading font-black text-3xl md:text-4xl text-white tracking-tight mb-8">
        Cart
        <span className="text-white/40 font-body font-normal text-lg ml-3">
          ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card-faire-detail p-4 flex items-center gap-5">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-brand-text text-sm truncate">
                  {item.name}
                </h3>
                <p className="price-faire text-base mt-0.5">
                  {formatPrice(item.price)}
                </p>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-gray-300 hover:text-red-400 transition-colors p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded-lg"
                aria-label={`Remove ${item.name} from cart`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Summary — Faire clean */}
        <div className="card-faire-detail p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-gray-400 mb-4">
            Summary
          </h2>

          <div className="divider-faire" />

          <div className="flex justify-between py-4 text-sm font-body">
            <span className="text-gray-500">Subtotal</span>
            <span className="price-faire">{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between pb-4 text-sm font-body">
            <span className="text-gray-500">Shipping</span>
            <span className="text-gray-400">Calculated at checkout</span>
          </div>

          <div className="divider-faire" />

          <div className="flex justify-between py-4">
            <span className="font-heading font-bold text-brand-text">Total</span>
            <span className="price-faire text-lg">{formatPrice(total)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="btn-faire mt-2"
            aria-busy={loading}
          >
            {loading ? 'Redirecting...' : 'Checkout'}
          </button>

          <p className="text-[11px] text-gray-300 text-center mt-3 font-body">
            Secure checkout powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}

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
      <div className="py-20">
        <div className="section-container">
          <div className="card p-12 text-center max-w-lg mx-auto">
            <p className="text-4xl mb-4">🛒</p>
            <h1 className="font-heading font-extrabold text-2xl text-brand-text">
              Your cart is empty
            </h1>
            <p className="text-gray-500 font-body mt-2">
              Let&apos;s fix that! 🎨
            </p>
            <Link href="/shop" className="btn-primary mt-6 inline-block">
              Browse the Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="section-container">
        <h1 className="font-heading font-extrabold text-3xl text-white mb-6">
          Your Cart ({itemCount})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="card p-4 flex items-center gap-4">
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
                  <h3 className="font-heading font-bold text-brand-text truncate">
                    {item.name}
                  </h3>
                  <p className="text-brand-orange font-body font-bold mt-1">
                    {formatPrice(item.price)}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2"
                  aria-label="Remove item"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="card p-6 h-fit sticky top-24">
            <h2 className="font-heading font-bold text-lg text-brand-text mb-4">
              Order Summary
            </h2>
            <div className="flex justify-between py-2 border-b border-brand-border">
              <span className="text-gray-600 font-body">Subtotal</span>
              <span className="font-body font-bold text-brand-text">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm text-gray-500 font-body">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full mt-6 py-4 px-8 rounded-xl bg-brand-cta hover:bg-brand-cta-hover text-white font-heading font-bold text-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Redirecting...' : 'Proceed to Checkout →'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3 font-body">
              Secure checkout powered by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

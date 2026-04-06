'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/cart/CartProvider';
import { formatPrice } from '@/lib/products';
import { useState } from 'react';
import { EAST_COAST_STATES } from '@/lib/shipping';
import { calculateSalesTax, getTaxDisplayRate, formatTaxAmount } from '@/lib/tax';

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, itemCount } = useCart();
  const [selectedState, setSelectedState] = useState('');

  const salesTax = selectedState ? calculateSalesTax(total, selectedState) : 0;
  const taxRate = selectedState ? getTaxDisplayRate(selectedState) : null;
  const orderTotal = total + salesTax; // Shipping is free

  if (itemCount === 0) {
    return (
      <div className="shop-bg min-h-screen">
        <div className="shop-particles" aria-hidden="true">
          <div className="shop-particle" />
          <div className="shop-particle" />
          <div className="shop-particle" />
          <div className="shop-particle" />
          <div className="shop-particle" />
          <div className="shop-particle" />
        </div>
        <div className="shop-section relative z-10">
          <div className="card-faire-detail p-16 text-center max-w-lg mx-auto">
            <h1 className="font-heading font-black text-2xl text-white">
              Your cart is empty
            </h1>
            <p className="text-stone-500 font-body mt-2 text-sm">
              Browse our one-of-a-kind pottery collection.
            </p>
            <Link href="/shop" className="btn-faire inline-block mt-6 !w-auto">
              Browse the Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-bg min-h-screen">
      <div className="shop-particles" aria-hidden="true">
        <div className="shop-particle" />
        <div className="shop-particle" />
        <div className="shop-particle" />
        <div className="shop-particle" />
        <div className="shop-particle" />
        <div className="shop-particle" />
      </div>
      <div className="shop-section relative z-10">
        <p className="text-xs font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-3">
          Your Selection
        </p>
        <h1 className="font-heading font-black text-3xl md:text-4xl text-white tracking-tight mb-8">
          Cart
          <span className="text-stone-500 font-body font-normal text-lg ml-3">
            ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="card-faire-detail p-4 flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-[#292524]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-white text-sm truncate">
                    {item.name}
                  </h3>
                  <p className="price-faire text-sm mt-0.5">
                    {formatPrice(item.price)} each
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-stone-400 text-xs font-body mt-0.5">
                      Subtotal: {formatPrice(item.price * item.quantity)}
                    </p>
                  )}
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors border border-stone-700 hover:border-[#C9A96E] bg-stone-800 hover:bg-stone-700 text-stone-300"
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                    </svg>
                  </button>
                  <span className="font-heading font-bold text-white text-sm min-w-[1.5rem] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors border border-stone-700 hover:border-[#C9A96E] bg-stone-800 hover:bg-stone-700 text-stone-300"
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-stone-600 hover:text-red-400 transition-colors p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded-lg flex-shrink-0"
                  aria-label={`Remove ${item.name} from cart`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="card-faire-detail p-6 h-fit lg:sticky lg:top-24">
            <h2 className="font-heading font-bold text-xs uppercase tracking-[0.15em] text-stone-500 mb-4">
              Order Summary
            </h2>

            <div className="divider-faire" />

            {/* Subtotal */}
            <div className="flex justify-between py-3 text-sm font-body">
              <span className="text-stone-500">Subtotal</span>
              <span className="price-faire">{formatPrice(total)}</span>
            </div>

            {/* Free Shipping */}
            <div className="flex justify-between py-3 text-sm font-body">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#C9A96E]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                <span className="text-stone-500">Shipping</span>
              </div>
              <span className="text-emerald-400 font-heading font-bold">FREE</span>
            </div>
            <p className="text-stone-600 text-[10px] font-body -mt-1 mb-2 pl-6">
              Free FedEx Ground Shipping (3–5 business days)
            </p>

            {/* State selector for tax calculation */}
            <div className="py-3 space-y-2">
              <label className="text-stone-500 text-xs font-body">Shipping state (for tax estimate)</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50"
              >
                <option value="">Select your state</option>
                {EAST_COAST_STATES.map((s) => (
                  <option key={s.abbreviation} value={s.abbreviation}>
                    {s.state} ({s.abbreviation})
                  </option>
                ))}
              </select>
            </div>

            {/* Sales Tax */}
            <div className="flex justify-between py-3 text-sm font-body">
              <div>
                <span className="text-stone-500">Sales Tax</span>
                {taxRate && <span className="text-stone-600 text-[10px] ml-1">({taxRate})</span>}
              </div>
              <span className="text-stone-300">
                {selectedState ? formatTaxAmount(salesTax) : 'Select state'}
              </span>
            </div>

            <div className="divider-faire" />

            {/* Total */}
            <div className="flex justify-between py-4">
              <span className="font-heading font-bold text-white">Total</span>
              <span className="price-faire text-lg">{formatPrice(orderTotal)}</span>
            </div>

            <Link
              href="/checkout"
              className="btn-faire mt-2 block text-center"
            >
              Proceed to Checkout
            </Link>

            <p className="text-[11px] text-stone-600 text-center mt-3 font-body">
              Secure checkout powered by Stripe. Shipped via FedEx with tracking & insurance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

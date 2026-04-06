'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/cart/CartProvider';
import { formatPrice } from '@/lib/products';
import {
  EAST_COAST_STATES,
  SHIPPING_TIERS,
  getShippingRate,
  formatShippingPrice,
} from '@/lib/shipping';
import CheckoutForm from './CheckoutForm';
import StripeProvider from '@/components/checkout/StripeProvider';

type Flow = 'guest' | 'register' | null;

export default function CheckoutPage() {
  const { items, total, itemCount } = useCart();
  const [flow, setFlow] = useState<Flow>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  // Shipping state
  const [selectedState, setSelectedState] = useState('');
  const [selectedTier, setSelectedTier] = useState<'ground' | 'express' | 'overnight'>('ground');

  // Form fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [newsletter, setNewsletter] = useState(true);

  // Shipping address
  const [shipName, setShipName] = useState('');
  const [shipLine1, setShipLine1] = useState('');
  const [shipLine2, setShipLine2] = useState('');
  const [shipCity, setShipCity] = useState('');
  const [shipZip, setShipZip] = useState('');

  const shippingCost = selectedState ? (getShippingRate(selectedState, selectedTier) || 0) : 0;
  const orderTotal = total + shippingCost;

  if (itemCount === 0) {
    return (
      <div className="shop-bg min-h-screen">
        <div className="shop-section relative z-10">
          <div className="card-faire-detail p-16 text-center max-w-lg mx-auto">
            <h1 className="font-heading font-bold text-2xl text-white">Your cart is empty</h1>
            <Link href="/shop" className="btn-faire inline-block mt-6 !w-auto">Browse the Shop</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleCreatePaymentIntent = async () => {
    setError('');
    if (!email || !name || !shipName || !shipLine1 || !shipCity || !selectedState || !shipZip) {
      setError('Please fill in all required fields.');
      return;
    }
    if (flow === 'register' && (!password || password.length < 6)) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/checkout/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow,
          email,
          name,
          password: flow === 'register' ? password : undefined,
          newsletter: flow === 'register' ? newsletter : undefined,
          items: items.map((item) => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
          })),
          shipping: {
            name: shipName,
            line1: shipLine1,
            line2: shipLine2 || undefined,
            city: shipCity,
            state: selectedState,
            postalCode: shipZip,
            country: 'US',
          },
          shippingTier: selectedTier,
          shippingCost,
          subtotal: total,
          total: orderTotal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }

      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="shop-bg min-h-screen">
      <div className="shop-particles" aria-hidden="true">
        <div className="shop-particle" />
        <div className="shop-particle" />
        <div className="shop-particle" />
      </div>
      <div className="shop-section relative z-10">
        <p className="text-xs font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-3">Secure Checkout</p>
        <h1 className="font-heading font-bold text-3xl md:text-4xl text-white tracking-tight mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Checkout Form */}
          <div className="lg:col-span-2 space-y-5">

            {/* Step 1: Choose checkout flow */}
            {!clientSecret && (
              <>
                <div className="card-faire-detail p-6">
                  <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-stone-400 mb-4">
                    Step 1: How would you like to check out?
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setFlow('guest')}
                      className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                        flow === 'guest'
                          ? 'border-[#C9A96E] bg-[#C9A96E]/10'
                          : 'border-stone-700/40 hover:border-stone-600 bg-stone-800/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${flow === 'guest' ? 'border-[#C9A96E]' : 'border-stone-600'}`}>
                          {flow === 'guest' && <div className="w-2.5 h-2.5 rounded-full bg-[#C9A96E]" />}
                        </div>
                        <span className="font-heading font-bold text-white text-sm">Guest Checkout</span>
                      </div>
                      <p className="text-stone-500 text-xs font-body ml-8">Quick and easy. No account needed.</p>
                    </button>
                    <button
                      onClick={() => setFlow('register')}
                      className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                        flow === 'register'
                          ? 'border-[#C9A96E] bg-[#C9A96E]/10'
                          : 'border-stone-700/40 hover:border-stone-600 bg-stone-800/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${flow === 'register' ? 'border-[#C9A96E]' : 'border-stone-600'}`}>
                          {flow === 'register' && <div className="w-2.5 h-2.5 rounded-full bg-[#C9A96E]" />}
                        </div>
                        <span className="font-heading font-bold text-white text-sm">Create Account & Checkout</span>
                      </div>
                      <p className="text-stone-500 text-xs font-body ml-8">Track orders, get notified of new drops, and save your info.</p>
                    </button>
                  </div>
                </div>

                {/* Step 2: Contact & Account info */}
                {flow && (
                  <div className="card-faire-detail p-6">
                    <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-stone-400 mb-4">
                      Step 2: Your Information
                    </h2>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-stone-400 text-xs font-body mb-1">Full Name *</label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Jane Smith"
                            className="w-full px-3 py-2.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50 focus:border-[#C9A96E]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-stone-400 text-xs font-body mb-1">Email Address *</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="jane@example.com"
                            className="w-full px-3 py-2.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50 focus:border-[#C9A96E]"
                            required
                          />
                        </div>
                      </div>

                      {/* Password + Newsletter — only for register flow */}
                      {flow === 'register' && (
                        <>
                          <div>
                            <label className="block text-stone-400 text-xs font-body mb-1">Password * (min 6 characters)</label>
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Create a password"
                              minLength={6}
                              className="w-full px-3 py-2.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50 focus:border-[#C9A96E]"
                              required
                            />
                          </div>
                          <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-lg bg-stone-800/50 border border-stone-700/40">
                            <input
                              type="checkbox"
                              checked={newsletter}
                              onChange={(e) => setNewsletter(e.target.checked)}
                              className="accent-[#C9A96E] w-4 h-4"
                            />
                            <span className="text-stone-400 text-xs font-body">
                              Sign me up for the newsletter — new pottery drops, studio updates, and 10% off my next order
                            </span>
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Shipping */}
                {flow && (
                  <div className="card-faire-detail p-6">
                    <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-stone-400 mb-4">
                      Step 3: Shipping Address
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-stone-400 text-xs font-body mb-1">Recipient Name *</label>
                        <input type="text" value={shipName} onChange={(e) => setShipName(e.target.value)} placeholder="Jane Smith" className="w-full px-3 py-2.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50" required />
                      </div>
                      <div>
                        <label className="block text-stone-400 text-xs font-body mb-1">Address Line 1 *</label>
                        <input type="text" value={shipLine1} onChange={(e) => setShipLine1(e.target.value)} placeholder="123 Main St" className="w-full px-3 py-2.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50" required />
                      </div>
                      <div>
                        <label className="block text-stone-400 text-xs font-body mb-1">Address Line 2</label>
                        <input type="text" value={shipLine2} onChange={(e) => setShipLine2(e.target.value)} placeholder="Apt 4B (optional)" className="w-full px-3 py-2.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50" />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-stone-400 text-xs font-body mb-1">City *</label>
                          <input type="text" value={shipCity} onChange={(e) => setShipCity(e.target.value)} placeholder="Fort Lauderdale" className="w-full px-3 py-2.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50" required />
                        </div>
                        <div>
                          <label className="block text-stone-400 text-xs font-body mb-1">State *</label>
                          <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50">
                            <option value="">State</option>
                            {EAST_COAST_STATES.map((s) => (
                              <option key={s.abbreviation} value={s.abbreviation}>{s.abbreviation}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-stone-400 text-xs font-body mb-1">ZIP *</label>
                          <input type="text" value={shipZip} onChange={(e) => setShipZip(e.target.value)} placeholder="22030" maxLength={10} className="w-full px-3 py-2.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50" required />
                        </div>
                      </div>

                      {/* Shipping tier */}
                      {selectedState && (
                        <div className="space-y-1.5 mt-2">
                          <p className="text-stone-500 text-xs font-heading font-bold flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-[#C9A96E]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                            FedEx Shipping
                          </p>
                          {SHIPPING_TIERS.map((tier) => {
                            const rate = getShippingRate(selectedState, tier.id);
                            if (!rate) return null;
                            return (
                              <label key={tier.id} className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer border transition-colors ${selectedTier === tier.id ? 'border-[#C9A96E]/50 bg-[#C9A96E]/10' : 'border-stone-700/40 bg-stone-800/40 hover:border-stone-600'}`}>
                                <div className="flex items-center gap-2">
                                  <input type="radio" name="shipping" value={tier.id} checked={selectedTier === tier.id} onChange={() => setSelectedTier(tier.id)} className="accent-[#C9A96E]" />
                                  <div>
                                    <span className="text-stone-200 text-xs font-heading font-bold">{tier.name}</span>
                                    <span className="text-stone-500 text-[10px] font-body block">{tier.deliveryTime}</span>
                                  </div>
                                </div>
                                <span className="text-[#C9A96E] text-xs font-heading font-bold">{formatShippingPrice(rate)}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-body">
                        {error}
                      </div>
                    )}

                    {/* Continue to payment */}
                    <button
                      onClick={handleCreatePaymentIntent}
                      disabled={creating || !selectedState}
                      className="btn-faire mt-5"
                      aria-busy={creating}
                    >
                      {creating ? 'Processing...' : 'Continue to Payment'}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Step 4: Stripe Payment */}
            {clientSecret && (
              <div className="card-faire-detail p-6">
                <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-stone-400 mb-4">
                  Step 4: Payment
                </h2>
                <StripeProvider clientSecret={clientSecret}>
                  <CheckoutForm orderId={orderId!} />
                </StripeProvider>
              </div>
            )}
          </div>

          {/* Right — Order Summary */}
          <div className="card-faire-detail p-6 h-fit lg:sticky lg:top-24">
            <h2 className="font-heading font-bold text-xs uppercase tracking-[0.15em] text-stone-500 mb-4">
              Order Summary
            </h2>
            <div className="divider-faire" />

            <div className="space-y-3 py-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#292524]">
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-body font-medium truncate">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="price-faire text-sm">{formatPrice(item.price)}</p>
                      {item.quantity > 1 && (
                        <span className="text-stone-500 text-xs font-body">x{item.quantity} = {formatPrice(item.price * item.quantity)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="divider-faire" />

            <div className="flex justify-between py-2 text-sm font-body">
              <span className="text-stone-500">Subtotal</span>
              <span className="price-faire">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm font-body">
              <span className="text-stone-500">Shipping</span>
              <span className="text-stone-400">{selectedState ? formatShippingPrice(shippingCost) : 'Select state'}</span>
            </div>

            <div className="divider-faire" />

            <div className="flex justify-between py-4">
              <span className="font-heading font-bold text-white">Total</span>
              <span className="price-faire text-lg">{formatPrice(orderTotal)}</span>
            </div>

            <p className="text-[10px] text-stone-600 text-center font-body mt-2">
              Secure checkout powered by Stripe. Shipped via FedEx with tracking & insurance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

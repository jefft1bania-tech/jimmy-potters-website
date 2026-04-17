'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useWholesaleCart } from '@/components/wholesale/WholesaleCartProvider';
import { formatPrice } from '@/lib/products';

type BuyerType = 'business' | 'individual';

interface WholesaleForm {
  buyerType: BuyerType;
  companyName: string;
  companyAddress: string;
  contactName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  notes: string;
}

const EMPTY_FORM: WholesaleForm = {
  buyerType: 'business',
  companyName: '',
  companyAddress: '',
  contactName: '',
  email: '',
  phone: '',
  shippingAddress: '',
  notes: '',
};

export default function WholesaleCartPage() {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useWholesaleCart();
  const [form, setForm] = useState<WholesaleForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof WholesaleForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const setBuyerType = (buyerType: BuyerType) => {
    setForm((prev) => ({ ...prev, buyerType }));
  };

  const isBusiness = form.buyerType === 'business';

  const canSubmit =
    itemCount > 0 &&
    form.contactName.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    (isBusiness
      ? form.companyName.trim() && form.companyAddress.trim()
      : form.shippingAddress.trim()) &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/wholesale/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerType: form.buyerType,
          company: isBusiness
            ? {
                name: form.companyName.trim(),
                address: form.companyAddress.trim(),
              }
            : null,
          contact: {
            name: form.contactName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
          },
          shippingAddress: isBusiness ? '' : form.shippingAddress.trim(),
          notes: form.notes.trim(),
          items: items.map((i) => ({
            id: i.id,
            slug: i.slug,
            name: i.name,
            productNumber: i.productNumber,
            price: i.price,
            quantity: i.quantity,
            subtotal: i.price * i.quantity,
          })),
          itemCount,
          total,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      setSuccess(true);
      setForm(EMPTY_FORM);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS STATE
  if (success) {
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
          <div className="card-faire-detail p-12 md:p-16 text-center max-w-xl mx-auto">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 border"
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                borderColor: 'rgba(56, 189, 248, 0.35)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-sky-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-xs font-heading font-bold uppercase tracking-[0.3em] text-sky-300 mb-3">
              Request Received
            </p>
            <h1 className="font-heading font-black text-2xl md:text-3xl text-white tracking-tight">
              Thank you for your wholesale order request!
            </h1>
            <p className="text-stone-400 font-body mt-4 text-sm leading-relaxed">
              We&apos;ve received your inquiry and forwarded it to the Jimmy Potters team.
              You&apos;ll hear back within 1&ndash;2 business days with a quote, lead time, and
              payment instructions tailored to your order.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/shop" className="btn-faire inline-block !w-auto">
                Continue Browsing
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-stone-700 hover:border-stone-500 text-stone-300 text-sm font-heading font-bold uppercase tracking-wider transition-colors"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY STATE
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
            <p className="text-xs font-heading font-bold uppercase tracking-[0.3em] text-sky-300 mb-3">
              Wholesale
            </p>
            <h1 className="font-heading font-black text-2xl text-white">
              Your wholesale cart is empty
            </h1>
            <p className="text-stone-500 font-body mt-2 text-sm">
              Add items from the shop using the &ldquo;+ Wholesale Cart&rdquo; button on any product.
            </p>
            <Link href="/shop" className="btn-faire inline-block mt-6 !w-auto">
              Browse the Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // MAIN STATE — items + checkout form
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
        <p className="text-xs font-heading font-bold uppercase tracking-[0.3em] text-sky-300 mb-3">
          Bulk Order Request
        </p>
        <h1 className="font-heading font-black text-3xl md:text-4xl text-white tracking-tight mb-2">
          Bulk Order Cart
          <span className="text-stone-500 font-body font-normal text-lg ml-3">
            ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
        </h1>
        <p className="text-stone-500 font-body text-sm max-w-2xl mb-8">
          Submit your bulk order request below &mdash; open to businesses <em>and</em> individual
          guest buyers. A member of our team will reach out with pricing, lead time, and next
          steps. No payment taken at this stage.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Items + Checkout form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Items */}
            <div className="space-y-3">
              <h2 className="font-heading font-bold text-xs uppercase tracking-[0.15em] text-stone-500">
                Items in this request
              </h2>
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
                    <p className="text-sky-300 text-sm mt-0.5 font-heading font-bold">
                      {formatPrice(item.price)} each
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-stone-400 text-xs font-body mt-0.5">
                        Subtotal: {formatPrice(item.price * item.quantity)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors border border-stone-700 hover:border-sky-400 bg-stone-800 hover:bg-stone-700 text-stone-300"
                      aria-label={`Decrease wholesale quantity of ${item.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                      </svg>
                    </button>
                    <span className="font-heading font-bold text-white text-sm min-w-[1.5rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors border border-stone-700 hover:border-sky-400 bg-stone-800 hover:bg-stone-700 text-stone-300"
                      aria-label={`Increase wholesale quantity of ${item.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-stone-600 hover:text-red-400 transition-colors p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded-lg flex-shrink-0"
                    aria-label={`Remove ${item.name} from wholesale cart`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Checkout form */}
            <form onSubmit={handleSubmit} className="card-faire-detail p-6 md:p-8 space-y-5">
              <div>
                <h2 className="font-heading font-bold text-lg text-white">
                  {isBusiness ? 'Your Business Details' : 'Your Details'}
                </h2>
                <p className="text-stone-500 text-xs font-body mt-1">
                  All fields required unless noted.
                </p>
              </div>

              {/* Buyer type toggle */}
              <div>
                <label className="block text-stone-400 text-xs font-heading font-bold uppercase tracking-wider mb-2">
                  I&apos;m ordering as<span className="text-sky-300 ml-0.5">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Buyer type">
                  <BuyerToggle
                    active={isBusiness}
                    label="A Business"
                    sub="Shop, gallery, retailer"
                    onClick={() => setBuyerType('business')}
                  />
                  <BuyerToggle
                    active={!isBusiness}
                    label="An Individual"
                    sub="Guest / personal bulk buy"
                    onClick={() => setBuyerType('individual')}
                  />
                </div>
              </div>

              {isBusiness && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                      label="Company Name"
                      id="companyName"
                      value={form.companyName}
                      onChange={handleChange('companyName')}
                      required
                    />
                    <Field
                      label="Contact Name"
                      id="contactName"
                      value={form.contactName}
                      onChange={handleChange('contactName')}
                      required
                    />
                  </div>
                  <Field
                    label="Company Address"
                    id="companyAddress"
                    value={form.companyAddress}
                    onChange={handleChange('companyAddress')}
                    placeholder="Street, City, State, ZIP"
                    required
                  />
                </>
              )}

              {!isBusiness && (
                <>
                  <Field
                    label="Full Name"
                    id="contactName"
                    value={form.contactName}
                    onChange={handleChange('contactName')}
                    required
                  />
                  <Field
                    label="Shipping Address"
                    id="shippingAddress"
                    value={form.shippingAddress}
                    onChange={handleChange('shippingAddress')}
                    placeholder="Street, City, State, ZIP"
                    required
                  />
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Email"
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  required
                />
                <Field
                  label="Phone Number"
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  required
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-stone-400 text-xs font-heading font-bold uppercase tracking-wider mb-2">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={handleChange('notes')}
                  rows={3}
                  placeholder="Lead time, custom finishes, shipping preferences…"
                  className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-sm font-body focus:outline-none focus:ring-2 focus:ring-sky-400/50 resize-y"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 font-body">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-xl px-6 py-4 font-heading font-black text-sm uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: 'rgba(56, 189, 248, 0.45)',
                  color: '#7DD3FC',
                }}
              >
                {submitting
                  ? 'Sending Request…'
                  : isBusiness
                  ? 'Submit Wholesale Request'
                  : 'Submit Bulk Order Request'}
              </button>

              <p className="text-[11px] text-stone-600 text-center font-body">
                No payment taken now. Our team will follow up with a quote.
              </p>
            </form>
          </div>

          {/* RIGHT: Summary */}
          <div className="lg:col-span-2">
            <div className="card-faire-detail p-6 lg:sticky lg:top-24">
              <h2 className="font-heading font-bold text-xs uppercase tracking-[0.15em] text-stone-500 mb-4">
                Request Summary
              </h2>
              <div className="divider-faire" />
              <div className="space-y-2 py-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs font-body gap-3">
                    <span className="text-stone-400 truncate">
                      {item.name}{' '}
                      <span className="text-stone-600">&times; {item.quantity}</span>
                    </span>
                    <span className="text-stone-300 whitespace-nowrap">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="divider-faire" />
              <div className="flex justify-between py-3 text-sm font-body">
                <span className="text-stone-500">Items</span>
                <span className="text-stone-300">{itemCount}</span>
              </div>
              <div className="flex justify-between py-3 text-sm font-body">
                <span className="text-stone-500">Retail Value</span>
                <span className="text-stone-300">{formatPrice(total)}</span>
              </div>
              <p className="text-stone-600 text-[11px] font-body -mt-1 mb-2 leading-relaxed">
                Final wholesale pricing will be quoted by our team based on order volume and
                custom requirements.
              </p>
              <div className="divider-faire" />
              <p className="text-[11px] text-stone-600 text-center mt-4 font-body leading-relaxed">
                This is a request &mdash; not a purchase. We&apos;ll respond within 1&ndash;2 business days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuyerToggle({
  active,
  label,
  sub,
  onClick,
}: {
  active: boolean;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className="text-left rounded-xl px-4 py-3 border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
      style={{
        background: active ? 'rgba(56, 189, 248, 0.12)' : 'rgba(41, 37, 36, 0.6)',
        borderColor: active ? 'rgba(56, 189, 248, 0.55)' : 'rgb(68, 64, 60)',
      }}
    >
      <div
        className="font-heading font-bold text-sm"
        style={{ color: active ? '#7DD3FC' : '#E7E5E4' }}
      >
        {label}
      </div>
      <div className="text-[11px] font-body text-stone-500 mt-0.5">{sub}</div>
    </button>
  );
}

function Field({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-stone-400 text-xs font-heading font-bold uppercase tracking-wider mb-2">
        {label}{required && <span className="text-sky-300 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-sm font-body focus:outline-none focus:ring-2 focus:ring-sky-400/50"
      />
    </div>
  );
}

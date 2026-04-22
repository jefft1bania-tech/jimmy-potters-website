'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useCart } from '@/components/cart/CartProvider';
import { useRouter } from 'next/navigation';
import { track } from '@/lib/analytics/client';

// Jeff will update these handles via env vars when the accounts are ready.
const VENMO_USERNAME = process.env.NEXT_PUBLIC_VENMO_USERNAME || 'Jimmy-Potters';
const PAYPAL_ME_USERNAME = process.env.NEXT_PUBLIC_PAYPAL_ME_USERNAME || 'JimmyPotters';

export default function CheckoutForm({ orderId, total }: { orderId: string; total: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const { clearCart } = useCart();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const amountFixed = total.toFixed(2);
  const memo = `Jimmy Potters order ${orderId}`;
  const venmoHref = `https://venmo.com/${VENMO_USERNAME}?txn=pay&amount=${amountFixed}&note=${encodeURIComponent(memo)}`;
  const paypalHref = `https://paypal.me/${PAYPAL_ME_USERNAME}/${amountFixed}`;

  const handleExternalPayment = (provider: 'venmo' | 'paypal') => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!termsAccepted) {
      e.preventDefault();
      setError('Please agree to the Terms, Returns Policy, and Privacy Policy before paying.');
      return;
    }
    track('checkout_complete', { order_id: orderId, total_usd: total, provider });
    clearCart();
    // mark order as awaiting-confirmation; success page shows the pending-payment notice
    router.push(`/success?order_id=${orderId}&type=product&pay=${provider}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!termsAccepted) {
      setError('Please agree to the Terms, Returns Policy, and Privacy Policy before paying.');
      return;
    }

    setProcessing(true);
    setError('');

    track('checkout_start', { order_id: orderId, total_usd: total, provider: 'stripe' });

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success?order_id=${orderId}&type=product`,
      },
      redirect: 'if_required',
    });

    if (result.error) {
      setError(result.error.message || 'Payment failed. Please try again.');
      setProcessing(false);
    } else if (result.paymentIntent?.status === 'succeeded') {
      track('checkout_complete', { order_id: orderId, total_usd: total, provider: 'stripe' });
      clearCart();
      router.push(`/success?order_id=${orderId}&type=product`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {/* Legal acceptance — gates Stripe, Venmo, and PayPal */}
      <label className="flex items-start gap-3 p-3 rounded-lg bg-stone-100/60 border border-stone-300/60 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => {
            setTermsAccepted(e.target.checked);
            if (e.target.checked) setError('');
          }}
          className="mt-0.5 h-4 w-4 rounded border-stone-400 text-stone-900 focus:ring-stone-700"
          aria-describedby="terms-accept-desc"
        />
        <span id="terms-accept-desc" className="text-[12px] leading-relaxed font-body text-stone-700">
          I have read and agree to the{' '}
          <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-stone-900 underline hover:text-stone-700">
            Terms of Service
          </Link>,{' '}
          <Link href="/returns" target="_blank" rel="noopener noreferrer" className="text-stone-900 underline hover:text-stone-700">
            Returns &amp; Refunds Policy
          </Link>,{' '}
          <Link href="/shipping" target="_blank" rel="noopener noreferrer" className="text-stone-900 underline hover:text-stone-700">
            Shipping Policy
          </Link>, and{' '}
          <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-stone-900 underline hover:text-stone-700">
            Privacy Policy
          </Link>.
        </span>
      </label>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-body">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing || !termsAccepted}
        className="btn-faire w-full disabled:opacity-60 disabled:cursor-not-allowed"
        aria-busy={processing}
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="42" strokeDashoffset="12" />
            </svg>
            Processing Payment...
          </span>
        ) : (
          'Pay Now'
        )}
      </button>

      <div className="flex items-center justify-center gap-3 text-stone-600 text-[10px] font-body">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <span>256-bit SSL encrypted. Your payment info is never stored on our servers.</span>
      </div>

      {/* Alternate payment options */}
      <div className="pt-2">
        <div className="flex items-center gap-3 my-4" aria-hidden="true">
          <div className="flex-1 h-px bg-stone-700/40" />
          <span className="text-stone-500 text-[10px] font-body uppercase tracking-widest">or pay with</span>
          <div className="flex-1 h-px bg-stone-700/40" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Venmo */}
          <a
            href={venmoHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleExternalPayment('venmo')}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#3D95CE] hover:bg-[#3382b8] text-white font-heading font-bold text-sm transition-colors"
            aria-label={`Pay $${amountFixed} with Venmo`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.5 4c.69 1.14 1 2.31 1 3.79 0 4.72-4.03 10.86-7.29 15.17H5.77L2.79 4.66l6.51-.62 1.58 12.7c1.47-2.4 3.29-6.18 3.29-8.75 0-1.41-.24-2.37-.62-3.16L19.5 4z"/>
            </svg>
            Pay ${amountFixed} with Venmo
          </a>

          {/* PayPal */}
          <a
            href={paypalHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleExternalPayment('paypal')}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#FFC439] hover:bg-[#eeb32e] text-[#253B80] font-heading font-bold text-sm transition-colors"
            aria-label={`Pay $${amountFixed} with PayPal`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M7.3 20.3c-.2 0-.4-.2-.4-.4V8.4c0-.2.2-.4.4-.4h4.4c3.3 0 5.2 1.6 5.2 4.3 0 3.4-2.5 5.4-6.3 5.4H9.2l-.7 2.2c0 .2-.2.4-.4.4H7.3zm3.3-7.1h1.1c1.6 0 2.6-.8 2.6-2.2 0-1.2-.8-1.8-2.1-1.8h-1.3l-.3 4z"/>
              <path d="M9.3 4.5c-.2 0-.4-.2-.4-.4 0-.2.2-.4.4-.4h4.4c3.3 0 5.2 1.6 5.2 4.3 0 3.4-2.5 5.4-6.3 5.4h-1.4l-.7 2.2c0 .2-.2.4-.4.4H9.3c-.2 0-.4-.2-.4-.4l-.1-.4c-.6-.7-.9-1.6-.9-2.8 0-3.7 2.5-8.3 8.3-8.3"/>
            </svg>
            Pay ${amountFixed} with PayPal
          </a>
        </div>

        <p className="text-[10px] text-stone-500 text-center font-body mt-3">
          Venmo & PayPal payments open in a new tab. Your order is marked <span className="text-stone-300">pending</span> until we confirm the payment — we'll ship within 2 business days of confirmation.
        </p>
      </div>
    </form>
  );
}

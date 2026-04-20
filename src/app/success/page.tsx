'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const pay = searchParams.get('pay');
  const orderId = searchParams.get('order_id');
  const isPending = pay === 'venmo' || pay === 'paypal';
  const providerLabel = pay === 'venmo' ? 'Venmo' : pay === 'paypal' ? 'PayPal' : '';

  return (
    <div>
      <div className="shop-section">
        <div className="card-faire-detail p-12 md:p-16 max-w-lg mx-auto text-center">
          <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${isPending ? 'bg-amber-500/10' : 'bg-brand-teal/8'}`}>
            {isPending ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-amber-500" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-brand-teal" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </div>
          <h1 className="font-heading font-black text-3xl text-brand-text tracking-tight">
            {isPending ? 'Almost There' : 'Thank You'}
          </h1>
          {isPending ? (
            <>
              <p className="text-black font-body mt-4 leading-relaxed">
                Your order is reserved. Please complete your {providerLabel} payment
                in the tab we just opened — your order ships within 2 business days
                of payment confirmation.
              </p>
              {orderId && (
                <p className="text-stone-600 font-body text-sm mt-3">
                  Order reference: <span className="font-mono text-stone-800">{orderId}</span>
                </p>
              )}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6 text-sm text-black font-body">
                Be sure the payment note includes the order reference above so we can match it to your shipment.
              </div>
            </>
          ) : (
            <>
              <p className="text-black font-body mt-4 leading-relaxed">
                Your order is confirmed. You&apos;ll receive a confirmation email
                with tracking once your pottery ships.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mt-6 text-sm text-black font-body">
                Orders ship within 3–5 business days, carefully packaged.
              </div>
            </>
          )}
          <div className="mt-8">
            <Link href="/shop" className="inline-block bg-brand-text text-white hover:bg-black font-heading font-bold py-3 px-6 rounded-xl transition-all duration-200">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}

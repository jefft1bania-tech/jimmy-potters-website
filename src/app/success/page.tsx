import Link from 'next/link';

export const metadata = {
  title: 'Order Confirmed | Jimmy Potters',
};

export default function SuccessPage() {
  return (
    <div>
      <div className="shop-section">
        <div className="card-faire-detail p-12 md:p-16 max-w-lg mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-brand-teal/8 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-brand-teal" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="font-heading font-black text-3xl text-brand-text tracking-tight">
            Thank You
          </h1>
          <p className="text-gray-400 font-body mt-4 leading-relaxed">
            Your order is confirmed. You&apos;ll receive a confirmation email
            with tracking once your pottery ships.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mt-6 text-sm text-gray-400 font-body">
            Orders ship within 3–5 business days, carefully packaged.
          </div>
          <div className="mt-8">
            <Link href="/shop" className="inline-block bg-brand-text text-white hover:bg-gray-800 font-heading font-bold py-3 px-6 rounded-xl transition-all duration-200">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

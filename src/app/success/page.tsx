import Link from 'next/link';

export const metadata = {
  title: 'Order Confirmed | Jimmy Potters',
};

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string; type?: string };
}) {
  const isClass = searchParams.type === 'class';

  return (
    <div className="py-20">
      <div className="section-container">
        <div className="card p-12 max-w-lg mx-auto text-center">
          {isClass ? (
            <>
              <p className="text-5xl mb-4">🎨</p>
              <h1 className="font-heading font-extrabold text-3xl text-brand-text">
                You&apos;re Registered!
              </h1>
              <p className="text-gray-600 font-body mt-4 leading-relaxed">
                Check your email for the <strong>Zoom link</strong> and class schedule.
                Your clay kit will ship within <strong>2-3 business days</strong>!
              </p>
              <div className="bg-brand-teal/5 rounded-xl p-4 mt-6 text-sm text-gray-600 font-body">
                📧 Didn&apos;t receive an email? Check your spam folder or contact us.
              </div>
            </>
          ) : (
            <>
              <p className="text-5xl mb-4">🎉</p>
              <h1 className="font-heading font-extrabold text-3xl text-brand-text">
                Thank You!
              </h1>
              <p className="text-gray-600 font-body mt-4 leading-relaxed">
                Your order is confirmed. You&apos;ll receive a confirmation email
                with tracking information once your order ships.
              </p>
              <div className="bg-brand-orange/5 rounded-xl p-4 mt-6 text-sm text-gray-600 font-body">
                📦 Orders typically ship within 3-5 business days.
              </div>
            </>
          )}

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/shop" className="btn-primary text-sm">
              Continue Shopping
            </Link>
            <Link
              href="/classes"
              className="px-6 py-3 rounded-xl border-2 border-brand-cta text-brand-cta font-heading font-bold text-sm hover:bg-brand-cta/5 transition-all"
            >
              View Classes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

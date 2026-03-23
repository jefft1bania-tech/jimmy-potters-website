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
    <div className={isClass ? 'relative overflow-hidden' : ''}>
      {/* Decorative blobs for class confirmation */}
      {isClass && (
        <>
          <div className="blob-bg-purple w-[400px] h-[400px] -top-32 -right-32 opacity-50" />
          <div className="blob-bg-teal w-[300px] h-[300px] bottom-0 -left-20 opacity-40" />
        </>
      )}

      <div className={isClass ? 'section-container py-20 relative' : 'shop-section'}>
        <div className={`${isClass ? 'card-vibrant' : 'card-faire-detail'} p-12 md:p-16 max-w-lg mx-auto text-center`}>
          {isClass ? (
            <>
              {/* ═══ CLASS REGISTRATION SUCCESS — Vibrant theme ═══ */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-vibrant-lavender flex items-center justify-center text-4xl animate-pop-in">
                🎨
              </div>
              <h1 className="font-heading font-black text-3xl text-brand-text">
                You&apos;re{' '}
                <span className="bg-gradient-to-r from-vibrant-purple to-vibrant-teal bg-clip-text text-transparent">
                  Registered!
                </span>
              </h1>
              <p className="text-gray-500 font-body mt-4 leading-relaxed">
                Check your email for the <strong className="text-brand-text">Zoom link</strong> and
                class schedule. Your clay kit ships within{' '}
                <strong className="text-brand-text">2–3 business days</strong>.
              </p>
              <div className="bg-vibrant-sky/50 rounded-2xl p-4 mt-6 text-sm text-gray-500 font-body">
                Didn&apos;t receive an email? Check your spam folder or contact us through the About page.
              </div>
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
                <Link href="/classes" className="btn-vibrant text-sm !py-3 !px-6">
                  View More Classes
                </Link>
                <Link href="/shop" className="btn-faire !w-auto text-sm">
                  Browse Pottery
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* ═══ PRODUCT ORDER SUCCESS — Faire/Shop theme ═══ */}
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
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
                <Link href="/shop" className="btn-faire !w-auto">
                  Continue Shopping
                </Link>
                <Link
                  href="/classes"
                  className="btn-vibrant text-sm !py-3 !px-6"
                >
                  Explore Classes
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

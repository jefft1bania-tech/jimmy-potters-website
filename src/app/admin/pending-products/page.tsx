import { headers } from 'next/headers';
import { getAllProducts } from '@/lib/products';
import PendingReviewClient from './PendingReviewClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin — Pending Products',
  robots: 'noindex, nofollow',
};

export default function PendingProductsPage() {
  const host = headers().get('host') || '';
  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  if (!isLocal) {
    return (
      <main className="min-h-screen bg-stone-950 text-stone-200 p-12">
        <h1 className="text-2xl font-bold mb-4">Admin — Local Only</h1>
        <p className="text-stone-400">
          This review page is only available on the local dev server.
        </p>
      </main>
    );
  }

  const pending = getAllProducts().filter((p) => p.status === 'pending-review');
  return <PendingReviewClient products={pending} />;
}

import type { Metadata } from 'next';
import WholesaleApplyClient from './WholesaleApplyClient';

export const metadata: Metadata = {
  title: 'Wholesale Partners — Jimmy Potters',
  description:
    'Stock handmade Jimmy Potters ceramics in your shop. Tiered pricing, low minimum order, 4–6 week lead time. Apply in under two minutes.',
};

export const dynamic = 'force-dynamic';

export default function WholesalePage() {
  return <WholesaleApplyClient />;
}

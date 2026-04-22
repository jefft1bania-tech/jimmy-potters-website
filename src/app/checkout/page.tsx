import { salesEnabled } from '@/lib/sales-mode';
import CheckoutClient from './CheckoutClient';
import CheckoutPreviewGate from './CheckoutPreviewGate';

// Server component — decides at request time whether to serve the Stripe
// checkout form or the "coming soon" preview card. Running the gate server-side
// prevents a flash of the real form on direct URL visits.
export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
  if (!salesEnabled) {
    return <CheckoutPreviewGate />;
  }
  return <CheckoutClient />;
}

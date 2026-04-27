'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Discreet bottom-right confirmation pill that appears for ~6 seconds
 * after a device hits any URL with ?internal=1. The cookie set itself
 * happens in middleware.ts on the same response — this component just
 * provides immediate visual confirmation that enrollment took.
 *
 * Renders nothing on every other request (no ?internal=1 in URL).
 * SSR-safe: useSearchParams is a client-only hook and the component is
 * marked 'use client'.
 */
export default function InternalTrafficToast() {
  const searchParams = useSearchParams();
  const enrolling = searchParams?.get('internal') === '1';
  const [visible, setVisible] = useState<boolean>(enrolling);

  useEffect(() => {
    if (!enrolling) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(t);
  }, [enrolling]);

  if (!enrolling || !visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[9999] rounded-full bg-neutral-900/90 px-4 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-sm"
    >
      Internal traffic enrolled — this device is excluded from analytics.
    </div>
  );
}

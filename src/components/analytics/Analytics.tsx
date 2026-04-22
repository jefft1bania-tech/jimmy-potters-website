'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getIds, sendEnrich } from '@/lib/analytics/client';

/**
 * Mount once in the root layout. Responsibilities:
 *   1. Ensure visitor_id / session_id cookies are alive (creates if missing).
 *   2. Track max scroll depth for the current page.
 *   3. On pagehide / route change, flush time_on_page + scroll via
 *      navigator.sendBeacon.
 *
 * This component renders nothing visible.
 */
export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Warm the cookies / localStorage on mount.
    getIds();

    const startedAt = Date.now();
    let maxScroll = 0;

    const updateScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const scrollHeight = (doc.scrollHeight || 0) - (window.innerHeight || 0);
      if (scrollHeight <= 0) {
        maxScroll = 100; // page fits on one screen
        return;
      }
      const pct = Math.round((scrollTop / scrollHeight) * 100);
      if (pct > maxScroll) maxScroll = pct;
    };

    // Initial scroll snapshot (for short pages).
    updateScroll();

    const onScroll = () => {
      // passive listener; keep it cheap.
      updateScroll();
    };

    const flush = () => {
      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      // Clamp to 15 minutes to keep the distribution sane.
      const bounded = Math.max(0, Math.min(elapsed, 900));
      sendEnrich(pathname || '/', bounded, maxScroll);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      // Also flush on route change (App Router unmounts the effect).
      flush();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [pathname]);

  return null;
}

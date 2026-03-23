'use client';

import { useEffect, useRef } from 'react';

/**
 * Attaches IntersectionObserver to all elements matching the given selector
 * within the ref container. Adds 'revealed' class when element enters viewport.
 * Respects prefers-reduced-motion.
 */
export function useScrollReveal(selector: string = '.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale') {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll(selector);

    if (prefersReducedMotion) {
      // Skip animation — show everything immediately
      elements.forEach((el) => el.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [selector]);

  return containerRef;
}

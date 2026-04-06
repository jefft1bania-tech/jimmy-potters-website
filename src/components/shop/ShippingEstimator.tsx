'use client';

import { EAST_COAST_STATES } from '@/lib/shipping';

export default function ShippingEstimator() {
  const stateList = EAST_COAST_STATES.map((s) => s.abbreviation).join(', ');

  return (
    <div className="rounded-xl border border-stone-700/50 bg-stone-900/50 p-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-emerald-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
        <h3 className="font-heading font-bold text-sm text-emerald-400">
          Free FedEx Ground Shipping
        </h3>
      </div>

      <p className="text-stone-400 text-xs font-body mt-2 leading-relaxed">
        Complimentary shipping on all orders. 3–5 business days with tracking & insurance.
        Double-boxed with cushion wrap from Fort Lauderdale, FL.
      </p>

      <p className="text-stone-600 text-[10px] font-body mt-2">
        Currently shipping to: {stateList}
      </p>
    </div>
  );
}

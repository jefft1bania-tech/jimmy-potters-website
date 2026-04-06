'use client';

import { useState } from 'react';
import {
  EAST_COAST_STATES,
  SHIPPING_TIERS,
  getShippingRate,
  formatShippingPrice,
} from '@/lib/shipping';

export default function ShippingEstimator() {
  const [selectedState, setSelectedState] = useState('');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-stone-700/50 bg-stone-900/50 p-5">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#C9A96E]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-[#C9A96E]">
            Shipped via FedEx
          </h3>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-4 h-4 text-stone-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Summary line always visible */}
      <p className="text-stone-500 text-xs font-body mt-2">
        All orders ship via FedEx from Fort Lauderdale, Florida. Double-boxed with cushion wrap for safe delivery.
      </p>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* State selector */}
          <div>
            <label htmlFor="shipping-state" className="text-stone-400 text-xs font-heading font-bold uppercase tracking-wider block mb-1.5">
              Estimate shipping to:
            </label>
            <select
              id="shipping-state"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50 focus:border-[#C9A96E]/50"
            >
              <option value="">Select your state</option>
              {EAST_COAST_STATES.map((s) => (
                <option key={s.abbreviation} value={s.abbreviation}>
                  {s.state} ({s.abbreviation})
                </option>
              ))}
            </select>
          </div>

          {/* Shipping tiers */}
          {selectedState ? (
            <div className="space-y-2.5">
              {SHIPPING_TIERS.map((tier) => {
                const rate = getShippingRate(selectedState, tier.id);
                if (!rate) return null;
                return (
                  <div
                    key={tier.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-stone-800/60 border border-stone-700/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {tier.icon === 'truck' && (
                          <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                          </svg>
                        )}
                        {tier.icon === 'bolt' && (
                          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                          </svg>
                        )}
                        {tier.icon === 'star' && (
                          <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-stone-200 text-sm font-heading font-bold">{tier.name}</p>
                        <p className="text-stone-500 text-xs font-body">{tier.deliveryTime}</p>
                      </div>
                    </div>
                    <span className="text-[#C9A96E] font-heading font-bold text-sm whitespace-nowrap">
                      {formatShippingPrice(rate)}
                    </span>
                  </div>
                );
              })}
              <p className="text-stone-600 text-[10px] font-body mt-1">
                Rates shown for typical pottery package (3-5 lbs). Includes tracking and insurance.
              </p>
            </div>
          ) : (
            /* Rate table preview */
            <div className="overflow-hidden rounded-lg border border-stone-700/40">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-stone-800/80">
                    <th className="text-left py-2 px-3 text-stone-400 font-heading font-bold uppercase tracking-wider">Region</th>
                    <th className="text-right py-2 px-3 text-stone-400 font-heading font-bold uppercase tracking-wider">Ground</th>
                    <th className="text-right py-2 px-3 text-stone-400 font-heading font-bold uppercase tracking-wider">2Day</th>
                    <th className="text-right py-2 px-3 text-stone-400 font-heading font-bold uppercase tracking-wider">Overnight</th>
                  </tr>
                </thead>
                <tbody className="text-stone-300 font-body">
                  <tr className="border-t border-stone-800">
                    <td className="py-2 px-3 text-stone-400">VA, DC, MD, DE</td>
                    <td className="py-2 px-3 text-right">$9.99</td>
                    <td className="py-2 px-3 text-right">$18.99</td>
                    <td className="py-2 px-3 text-right">$34.99</td>
                  </tr>
                  <tr className="border-t border-stone-800">
                    <td className="py-2 px-3 text-stone-400">PA, NJ, WV</td>
                    <td className="py-2 px-3 text-right">$11.99</td>
                    <td className="py-2 px-3 text-right">$21.99</td>
                    <td className="py-2 px-3 text-right">$39.99</td>
                  </tr>
                  <tr className="border-t border-stone-800">
                    <td className="py-2 px-3 text-stone-400">NY, CT, NC</td>
                    <td className="py-2 px-3 text-right">$13.99</td>
                    <td className="py-2 px-3 text-right">$24.99</td>
                    <td className="py-2 px-3 text-right">$44.99</td>
                  </tr>
                  <tr className="border-t border-stone-800">
                    <td className="py-2 px-3 text-stone-400">MA, RI, NH, SC, GA</td>
                    <td className="py-2 px-3 text-right">$14.99</td>
                    <td className="py-2 px-3 text-right">$27.99</td>
                    <td className="py-2 px-3 text-right">$49.99</td>
                  </tr>
                  <tr className="border-t border-stone-800">
                    <td className="py-2 px-3 text-stone-400">FL</td>
                    <td className="py-2 px-3 text-right">$16.99</td>
                    <td className="py-2 px-3 text-right">$29.99</td>
                    <td className="py-2 px-3 text-right">$54.99</td>
                  </tr>
                </tbody>
              </table>
              <div className="bg-stone-800/40 px-3 py-2">
                <p className="text-stone-600 text-[10px] font-body">
                  Ships from Fort Lauderdale, FL. Currently serving East Coast states. More states coming soon.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

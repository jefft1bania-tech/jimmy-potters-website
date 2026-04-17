'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Product } from '@/types/product';

type Status = 'available' | 'sold' | 'reserved' | 'pending-review';

interface RowState {
  priceDollars: string;
  status: Status;
  saving: boolean;
  saved: boolean;
  error: string | null;
}

function initialRow(p: Product): RowState {
  return {
    priceDollars: p.price > 0 ? (p.price / 100).toFixed(2) : '',
    status: p.status,
    saving: false,
    saved: false,
    error: null,
  };
}

export default function PendingReviewClient({ products }: { products: Product[] }) {
  const [rows, setRows] = useState<Record<string, RowState>>(
    () => Object.fromEntries(products.map((p) => [p.id, initialRow(p)]))
  );

  const updateRow = (id: string, patch: Partial<RowState>) =>
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const save = async (id: string) => {
    const row = rows[id];
    const priceNum = parseFloat(row.priceDollars);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      updateRow(id, { error: 'Enter a valid price' });
      return;
    }
    updateRow(id, { saving: true, error: null, saved: false });
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: priceNum, status: row.status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      updateRow(id, { saving: false, saved: true });
    } catch (err) {
      updateRow(id, {
        saving: false,
        error: err instanceof Error ? err.message : 'Save failed',
      });
    }
  };

  if (products.length === 0) {
    return (
      <main className="min-h-screen bg-stone-950 text-stone-200 p-12">
        <h1 className="text-2xl font-heading font-black mb-2">Pending Review</h1>
        <p className="text-stone-400">No products are currently in pending-review status.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-black text-white">Pending Review</h1>
          <p className="text-stone-400 text-sm mt-2 max-w-2xl">
            {products.length} Faire-imported products waiting on pricing &amp; approval. Set a
            price, change status to <span className="text-sky-300">available</span> to publish, or
            leave as <span className="text-amber-300">pending-review</span> to keep hidden. Saves
            write directly to <code className="text-[11px] bg-stone-800 px-1.5 py-0.5 rounded">data/products.json</code>.
          </p>
          <p className="text-stone-500 text-xs mt-2">
            Local dev only. Commit &amp; push to persist.
          </p>
        </div>

        <div className="space-y-4">
          {products.map((p) => {
            const row = rows[p.id];
            const faireUrl = p.source?.originalUrl;
            return (
              <div
                key={p.id}
                className="rounded-xl border border-stone-800 bg-stone-900 p-4 flex flex-col md:flex-row gap-4"
              >
                <div className="relative w-full md:w-40 h-40 rounded-lg overflow-hidden bg-stone-800 flex-shrink-0">
                  {p.images?.[0] && (
                    <Image
                      src={p.images[0]}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-heading font-bold text-white text-lg">{p.name}</h3>
                      <p className="text-stone-500 text-xs mt-0.5 font-mono break-all">
                        {p.id}
                      </p>
                    </div>
                    {faireUrl && (
                      <a
                        href={faireUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-sky-400 hover:text-sky-300 underline whitespace-nowrap"
                      >
                        View on Faire ↗
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 items-end">
                    <label className="block">
                      <span className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1">
                        Price (USD)
                      </span>
                      <div className="flex items-center">
                        <span className="px-2 text-stone-500">$</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          value={row.priceDollars}
                          onChange={(e) => updateRow(p.id, { priceDollars: e.target.value, saved: false })}
                          placeholder="0.00"
                          className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1">
                        Status
                      </span>
                      <select
                        value={row.status}
                        onChange={(e) => updateRow(p.id, { status: e.target.value as Status, saved: false })}
                        className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                      >
                        <option value="pending-review">pending-review (hidden)</option>
                        <option value="available">available (publish)</option>
                        <option value="reserved">reserved</option>
                        <option value="sold">sold</option>
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={() => save(p.id)}
                      disabled={row.saving}
                      className="w-full rounded-lg px-4 py-2 font-heading font-bold text-sm uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: row.saved
                          ? 'rgba(34, 197, 94, 0.15)'
                          : 'rgba(56, 189, 248, 0.15)',
                        border: `1px solid ${
                          row.saved ? 'rgba(34, 197, 94, 0.45)' : 'rgba(56, 189, 248, 0.45)'
                        }`,
                        color: row.saved ? '#86efac' : '#7DD3FC',
                      }}
                    >
                      {row.saving ? 'Saving…' : row.saved ? 'Saved ✓' : 'Save'}
                    </button>
                  </div>

                  {row.error && (
                    <p className="mt-2 text-xs text-red-400">{row.error}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

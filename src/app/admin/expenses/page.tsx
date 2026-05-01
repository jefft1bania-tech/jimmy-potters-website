import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { listVendorOptions } from '@/lib/vendors-data';
import OverheadForm from './OverheadForm';
import RecurringForm from './RecurringForm';
import { DeleteOverheadButton, DeleteRecurringButton } from './DeleteButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Expenses — Admin — Jimmy Potters', robots: 'noindex, nofollow' };

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmtCents = (c: number) => USD.format(c / 100);

type OverheadRow = {
  id: string;
  incurred_on: string;
  category: string;
  amount_cents: number;
  note: string | null;
};

type RecurringRow = {
  id: string;
  category: string;
  amount_cents: number;
  recurrence: 'monthly' | 'quarterly' | 'annual';
  starts_on: string;
  ends_on: string | null;
  last_posted_on: string | null;
};

type ReceiptInfo = { id: string; original_filename: string };

async function loadData() {
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };

  const [overheadRes, recurringRes] = await Promise.all([
    supabase
      .from('overhead_expenses')
      .select('id, incurred_on, category, amount_cents, note')
      .order('incurred_on', { ascending: false })
      .limit(50),
    supabase
      .from('recurring_expenses')
      .select('id, category, amount_cents, recurrence, starts_on, ends_on, last_posted_on')
      .order('starts_on', { ascending: false }),
  ]);

  const overhead = (overheadRes.data ?? []) as OverheadRow[];
  const recurring = (recurringRes.data ?? []) as RecurringRow[];

  const receiptsByExpense = new Map<string, ReceiptInfo>();
  if (overhead.length > 0) {
    const expenseIds = overhead.map((r) => r.id);
    const { data: docs } = await supabase
      .from('financial_documents')
      .select('id, linked_expense_id, original_filename')
      .in('linked_expense_id', expenseIds);
    for (const d of (docs ?? []) as Array<{
      id: string;
      linked_expense_id: string;
      original_filename: string;
    }>) {
      if (!receiptsByExpense.has(d.linked_expense_id)) {
        receiptsByExpense.set(d.linked_expense_id, {
          id: d.id,
          original_filename: d.original_filename,
        });
      }
    }
  }

  return { overhead, recurring, receiptsByExpense };
}

export default async function ExpensesPage() {
  const [{ overhead, recurring, receiptsByExpense }, vendorOptions] = await Promise.all([
    loadData(),
    listVendorOptions(),
  ]);

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · Expenses
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">
              Business Costs
            </h1>
            <p className="text-stone-400 text-sm font-body mt-2">
              One-time overhead (materials, paint runs, equipment) and recurring costs (rent, software, subscriptions).
              Flow into the P&amp;L automatically for any date range.
            </p>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← Dashboard
            </Link>
            <Link href="/admin/products/costs" className="btn-faire !w-auto">Product Cost Templates</Link>
          </nav>
        </header>

        <section className="space-y-4 mb-10">
          <OverheadForm vendors={vendorOptions} />
          <div className="card-faire-detail p-0 overflow-hidden">
            <div className="px-5 py-3 flex items-center justify-between bg-stone-900/40 border-b border-stone-800">
              <p className="text-[11px] font-heading font-bold uppercase tracking-wider text-stone-400">
                Recent Overhead (last 50)
              </p>
              <p className="text-[11px] font-mono text-stone-500">
                Total: {fmtCents(overhead.reduce((s, r) => s + r.amount_cents, 0))}
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className="text-stone-400 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-2">Date</th>
                  <th className="text-left px-5 py-2">Category</th>
                  <th className="text-right px-5 py-2">Amount</th>
                  <th className="text-center px-5 py-2">Receipt</th>
                  <th className="text-left px-5 py-2">Note</th>
                  <th className="text-right px-5 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {overhead.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-stone-500">
                      No overhead entries yet.
                    </td>
                  </tr>
                ) : (
                  overhead.map((r) => {
                    const receipt = receiptsByExpense.get(r.id);
                    return (
                      <tr key={r.id} className="border-t border-stone-800">
                        <td className="px-5 py-2 text-stone-400 whitespace-nowrap">{r.incurred_on}</td>
                        <td className="px-5 py-2 font-mono text-stone-200">{r.category}</td>
                        <td className="px-5 py-2 text-right font-mono text-stone-200">{fmtCents(r.amount_cents)}</td>
                        <td className="px-5 py-2 text-center">
                          {receipt ? (
                            <Link
                              href={`/admin/documents/${receipt.id}`}
                              className="text-[#C9A96E] hover:text-[#E8D5A3]"
                              title={receipt.original_filename}
                            >
                              📎
                            </Link>
                          ) : (
                            <span className="text-stone-600">—</span>
                          )}
                        </td>
                        <td className="px-5 py-2 text-stone-400">{r.note ?? ''}</td>
                        <td className="px-5 py-2 text-right"><DeleteOverheadButton id={r.id} /></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <RecurringForm vendors={vendorOptions} />
          <div className="card-faire-detail p-0 overflow-hidden">
            <div className="px-5 py-3 bg-stone-900/40 border-b border-stone-800">
              <p className="text-[11px] font-heading font-bold uppercase tracking-wider text-stone-400">
                Active Recurring Charges
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className="text-stone-400 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-2">Category</th>
                  <th className="text-right px-5 py-2">Amount</th>
                  <th className="text-left px-5 py-2">Frequency</th>
                  <th className="text-left px-5 py-2">Starts</th>
                  <th className="text-left px-5 py-2">Ends</th>
                  <th className="text-left px-5 py-2">Last Posted</th>
                  <th className="text-right px-5 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {recurring.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-6 text-center text-stone-500">
                      No recurring expenses configured.
                    </td>
                  </tr>
                ) : (
                  recurring.map((r) => (
                    <tr key={r.id} className="border-t border-stone-800">
                      <td className="px-5 py-2 font-mono text-stone-200">{r.category}</td>
                      <td className="px-5 py-2 text-right font-mono text-stone-200">{fmtCents(r.amount_cents)}</td>
                      <td className="px-5 py-2 text-stone-300">{r.recurrence}</td>
                      <td className="px-5 py-2 text-stone-400 whitespace-nowrap">{r.starts_on}</td>
                      <td className="px-5 py-2 text-stone-400 whitespace-nowrap">{r.ends_on ?? '—'}</td>
                      <td className="px-5 py-2 text-stone-400 whitespace-nowrap">{r.last_posted_on ?? '—'}</td>
                      <td className="px-5 py-2 text-right"><DeleteRecurringButton id={r.id} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

import Link from 'next/link';
import { listVendors, type VendorWithCounts } from '@/lib/vendors-data';
import VendorForm from './VendorForm';
import { DeleteVendorButton } from './DeleteVendorButton';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Vendors — Admin — Jimmy Potters',
  robots: 'noindex, nofollow',
};

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

// Worst-case-single-number window for the renewal banner (Rule #42).
// 30 calendar days is the action horizon; vendors with next_action_days <= 30
// surface in the banner.
const RENEWAL_HORIZON_DAYS = 30;

function StatusPill({ status }: { status: VendorWithCounts['status'] }) {
  const map: Record<typeof status, string> = {
    active: 'bg-emerald-900/40 text-emerald-300 border-emerald-800',
    overdue: 'bg-red-900/40 text-red-300 border-red-800',
    cancelled: 'bg-stone-800 text-stone-400 border-stone-700',
    paused: 'bg-amber-900/30 text-amber-300 border-amber-800',
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider rounded border ${map[status]}`}>
      {status}
    </span>
  );
}

function NextActionCell({ v }: { v: VendorWithCounts }) {
  if (!v.next_action_date) return <span className="text-stone-600">—</span>;
  const days = v.next_action_days ?? 0;
  let cls = 'text-stone-300';
  if (days <= 7) cls = 'text-red-300 font-bold';
  else if (days <= 30) cls = 'text-amber-300';
  return (
    <span className={cls}>
      {v.next_action_date}
      <span className="block text-[10px] text-stone-500 font-mono">
        {v.next_action_label} · {days}d
      </span>
    </span>
  );
}

export default async function VendorsPage() {
  const vendors = await listVendors();
  const renewalsDue = vendors.filter(
    (v) => v.next_action_days !== null && v.next_action_days <= RENEWAL_HORIZON_DAYS,
  );

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · Vendors
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">
              Vendor Registry
            </h1>
            <p className="text-stone-400 text-sm font-body mt-2 max-w-2xl">
              Master list of every paid third party (hosting, domain, payments, chat, email, other).
              Linked expense rows surface here for join-ready aggregation.
              W-9 (IRS Form W-9) and COI (Certificate of Insurance) status tracked per vendor.
            </p>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← Dashboard
            </Link>
            <Link href="/admin/expenses" className="btn-faire !w-auto">Expenses</Link>
          </nav>
        </header>

        {renewalsDue.length > 0 && (
          <section
            className="mb-6 border border-amber-800 bg-amber-900/20 rounded p-4"
            data-testid="renewal-banner"
          >
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-amber-300 mb-2">
              {renewalsDue.length} vendor action{renewalsDue.length === 1 ? '' : 's'} due in 30 days
            </p>
            <ul className="space-y-1 text-sm">
              {renewalsDue.map((v) => (
                <li key={v.id} className="text-amber-200">
                  <span className="font-mono">{v.next_action_date}</span>
                  <span className="text-stone-400 mx-2">·</span>
                  <strong>{v.name}</strong>
                  <span className="text-stone-400 mx-2">·</span>
                  {v.next_action_label}
                  <span className="text-stone-500 ml-2">({v.next_action_days}d)</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mb-10">
          <VendorForm />
        </section>

        <section>
          <div className="card-faire-detail p-0 overflow-hidden">
            <div className="px-5 py-3 flex items-center justify-between bg-stone-900/40 border-b border-stone-800">
              <p className="text-[11px] font-heading font-bold uppercase tracking-wider text-stone-400">
                All Vendors ({vendors.length})
              </p>
              <p className="text-[11px] font-mono text-stone-500">
                Sorted by next action date
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-stone-400 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-2">Name</th>
                    <th className="text-left px-5 py-2">Role</th>
                    <th className="text-left px-5 py-2">Status</th>
                    <th className="text-right px-5 py-2">USD/mo</th>
                    <th className="text-left px-5 py-2">Next Action</th>
                    <th className="text-right px-5 py-2"># Overhead</th>
                    <th className="text-right px-5 py-2"># Recurring</th>
                    <th className="text-left px-5 py-2">W-9 / COI</th>
                    <th className="text-right px-5 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-6 text-center text-stone-500">
                        No vendors yet. Add one with the form above.
                      </td>
                    </tr>
                  ) : (
                    vendors.map((v) => (
                      <tr key={v.id} className="border-t border-stone-800 align-top">
                        <td className="px-5 py-3">
                          <Link
                            href={`/admin/vendors/${v.id}`}
                            className="text-stone-100 hover:text-white underline"
                          >
                            {v.name}
                          </Link>
                          {v.account_email && (
                            <span className="block text-[10px] text-stone-500 font-mono">
                              {v.account_email}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 font-mono text-stone-300">{v.role}</td>
                        <td className="px-5 py-3"><StatusPill status={v.status} /></td>
                        <td className="px-5 py-3 text-right font-mono text-stone-200">
                          {v.monthly_cost_usd != null ? USD.format(v.monthly_cost_usd) : '—'}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap"><NextActionCell v={v} /></td>
                        <td className="px-5 py-3 text-right font-mono text-stone-400">
                          {v.overhead_expense_count}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-stone-400">
                          {v.recurring_expense_count}
                        </td>
                        <td className="px-5 py-3 text-[11px] text-stone-400">
                          <span className={v.w9_on_file ? 'text-emerald-300' : 'text-stone-600'}>
                            W-9 {v.w9_on_file ? '✓' : '·'}
                          </span>
                          <span className="mx-1">/</span>
                          <span className={v.coi_on_file ? 'text-emerald-300' : 'text-stone-600'}>
                            COI {v.coi_on_file ? '✓' : '·'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <DeleteVendorButton id={v.id} name={v.name} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

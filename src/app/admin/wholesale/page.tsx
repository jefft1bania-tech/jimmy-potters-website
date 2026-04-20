import Link from 'next/link';
import {
  listWholesaleApplications,
  WHOLESALE_APPLICATION_STATUSES,
  WHOLESALE_BUYER_TYPES,
  type WholesaleApplicationStatus,
  type WholesaleBuyerType,
} from '@/lib/wholesale-applications-data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Wholesale — Admin — Jimmy Potters', robots: 'noindex, nofollow' };

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmtCents = (c: number) => USD.format(c / 100);

type Search = Record<string, string | string[] | undefined>;
function str(v: string | string[] | undefined): string {
  return typeof v === 'string' ? v : '';
}

function statusPillClass(s: WholesaleApplicationStatus): string {
  if (s === 'pending') return 'bg-amber-500/10 border border-amber-500/30 text-amber-300';
  if (s === 'needs_info') return 'bg-blue-500/10 border border-blue-500/30 text-blue-300';
  if (s === 'approved') return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300';
  return 'bg-stone-700 text-stone-300';
}

export default async function WholesaleAdminPage({ searchParams }: { searchParams: Search }) {
  const statusRaw = str(searchParams.status) || 'active';
  const buyerTypeRaw = str(searchParams.buyer_type);

  const status: WholesaleApplicationStatus | 'active' | 'all' =
    statusRaw === 'active' ? 'active'
    : statusRaw === 'all' ? 'all'
    : (WHOLESALE_APPLICATION_STATUSES as string[]).includes(statusRaw)
      ? (statusRaw as WholesaleApplicationStatus)
      : 'active';
  const buyerType: WholesaleBuyerType | 'all' =
    (WHOLESALE_BUYER_TYPES as string[]).includes(buyerTypeRaw)
      ? (buyerTypeRaw as WholesaleBuyerType)
      : 'all';

  const applications = await listWholesaleApplications({ status, buyerType });

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · Wholesale
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">
              Wholesale Applications
            </h1>
            <p className="text-stone-400 text-sm font-body mt-2">
              Every bulk-order request submitted through the site lives here.
              Triage pending applications, then approve, reject, or ask for more info.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← Dashboard
            </Link>
          </nav>
        </header>

        <section className="mb-6 card-faire-detail p-4">
          <div className="flex flex-wrap items-end gap-4">
            <Filter
              label="Status"
              name="status"
              value={status}
              currentQuery={searchParams}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'all', label: 'All' },
                ...WHOLESALE_APPLICATION_STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') })),
              ]}
            />
            <Filter
              label="Buyer Type"
              name="buyer_type"
              value={buyerType}
              currentQuery={searchParams}
              options={[
                { value: 'all', label: 'Any' },
                ...WHOLESALE_BUYER_TYPES.map((t) => ({ value: t, label: t })),
              ]}
            />
            <p className="ml-auto text-stone-400 text-xs font-body">
              <span className="text-stone-200 font-mono">{applications.length}</span> application
              {applications.length === 1 ? '' : 's'}
            </p>
          </div>
        </section>

        {applications.length === 0 ? (
          <div className="card-faire-detail p-6 border border-stone-700">
            <p className="text-stone-400 text-sm">
              No wholesale applications match these filters.{' '}
              <Link href="/admin/wholesale" className="text-[#C9A96E] hover:underline">
                Clear →
              </Link>
            </p>
          </div>
        ) : (
          <div className="card-faire-detail p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-900/60 text-stone-400 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3">Submitted</th>
                    <th className="text-left px-3 py-3">Buyer</th>
                    <th className="text-left px-3 py-3">Type</th>
                    <th className="text-left px-3 py-3">Status</th>
                    <th className="text-left px-3 py-3">Contact</th>
                    <th className="text-right px-3 py-3">Items</th>
                    <th className="text-right px-4 py-3">Retail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {applications.map((a) => {
                    const buyerLabel = a.buyer_type === 'business'
                      ? (a.company_name || '(unnamed business)')
                      : `${a.contact_name} (individual)`;
                    return (
                      <tr key={a.id} className="hover:bg-stone-900/40">
                        <td className="px-4 py-2 font-mono text-stone-400 text-xs">
                          <Link href={`/admin/wholesale/${a.id}`} className="hover:text-[#C9A96E] hover:underline">
                            {new Date(a.submitted_at).toISOString().slice(0, 10)}
                          </Link>
                        </td>
                        <td className="px-3 py-2">
                          <Link
                            href={`/admin/wholesale/${a.id}`}
                            className="text-stone-200 hover:text-[#C9A96E] hover:underline"
                          >
                            {buyerLabel}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-stone-300 text-xs capitalize">{a.buyer_type}</td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusPillClass(a.status)}`}>
                            {a.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-stone-400 text-xs">
                          <span className="text-stone-300">{a.contact_name}</span>
                          <span className="text-stone-500"> · {a.contact_email}</span>
                        </td>
                        <td className="px-3 py-2 text-right text-stone-300 text-xs font-mono">
                          {a.cart_item_count}
                        </td>
                        <td className="px-4 py-2 text-right text-stone-300 text-xs font-mono">
                          {fmtCents(a.cart_retail_total_cents)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Filter({
  label,
  name,
  value,
  options,
  currentQuery,
}: {
  label: string;
  name: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  currentQuery: Search;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => {
          const params = new URLSearchParams();
          for (const [k, v] of Object.entries(currentQuery)) {
            if (typeof v === 'string' && v && k !== name) params.set(k, v);
          }
          if (o.value) params.set(name, o.value);
          const href = `/admin/wholesale?${params.toString()}`;
          const active = value === o.value;
          return (
            <Link
              key={o.value}
              href={href}
              prefetch={false}
              className={`text-[11px] font-heading font-bold uppercase tracking-wider px-2 py-1 rounded border transition-colors ${
                active
                  ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E]'
                  : 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200'
              }`}
            >
              {o.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

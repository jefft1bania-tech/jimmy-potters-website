import Link from 'next/link';
import { listDisputes, DISPUTE_STATUSES, DISPUTE_TYPES, type DisputeStatus, type DisputeType } from '@/lib/disputes-data';
import NewDisputeForm from './NewDisputeForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Disputes — Admin — Jimmy Potters', robots: 'noindex, nofollow' };

type Search = Record<string, string | string[] | undefined>;
function str(v: string | string[] | undefined): string {
  return typeof v === 'string' ? v : '';
}

function statusPillClass(s: DisputeStatus): string {
  if (s === 'new') return 'bg-red-500/10 border border-red-500/30 text-red-300';
  if (s === 'investigating') return 'bg-amber-500/10 border border-amber-500/30 text-amber-300';
  if (s === 'awaiting_customer') return 'bg-blue-500/10 border border-blue-500/30 text-blue-300';
  if (s === 'resolved_refund') return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300';
  if (s === 'resolved_replacement') return 'bg-teal-500/10 border border-teal-500/30 text-teal-300';
  if (s === 'resolved_no_action') return 'bg-stone-700 text-stone-300';
  return 'bg-stone-800 text-stone-500';
}

export default async function DisputesPage({ searchParams }: { searchParams: Search }) {
  const statusRaw = str(searchParams.status) || 'open';
  const typeRaw = str(searchParams.type);

  const status: DisputeStatus | 'open' | 'all' =
    statusRaw === 'open' ? 'open'
    : statusRaw === 'all' ? 'all'
    : (DISPUTE_STATUSES as string[]).includes(statusRaw) ? (statusRaw as DisputeStatus)
    : 'open';
  const type: DisputeType | 'all' = (DISPUTE_TYPES as string[]).includes(typeRaw) ? (typeRaw as DisputeType) : 'all';

  const disputes = await listDisputes({ status, type });
  const openCount = disputes.filter((d) => d.status === 'new' || d.status === 'investigating' || d.status === 'awaiting_customer').length;

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · Disputes
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">
              Customer Disputes
            </h1>
            <p className="text-stone-400 text-sm font-body mt-2">
              Refund requests, not-received, damaged, wrong-item — the places the business bleeds
              if you don't close the loop fast.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← Dashboard
            </Link>
          </nav>
        </header>

        <NewDisputeForm />

        <section className="mb-6 card-faire-detail p-4">
          <div className="flex flex-wrap items-end gap-4">
            <Filter
              label="Status"
              name="status"
              value={status}
              currentQuery={searchParams}
              options={[
                { value: 'open', label: `Open${openCount && status !== 'open' ? '' : ''}` },
                { value: 'all', label: 'All' },
                ...DISPUTE_STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') })),
              ]}
            />
            <Filter
              label="Type"
              name="type"
              value={type}
              currentQuery={searchParams}
              options={[
                { value: 'all', label: 'Any' },
                ...DISPUTE_TYPES.map((t) => ({ value: t, label: t.replace('_', ' ') })),
              ]}
            />
            <p className="ml-auto text-stone-400 text-xs font-body">
              <span className="text-stone-200 font-mono">{disputes.length}</span> dispute
              {disputes.length === 1 ? '' : 's'}
            </p>
          </div>
        </section>

        {disputes.length === 0 ? (
          <div className="card-faire-detail p-6 border border-stone-700">
            <p className="text-stone-400 text-sm">
              No disputes match these filters.{' '}
              <Link href="/admin/disputes" className="text-[#C9A96E] hover:underline">Clear →</Link>
            </p>
          </div>
        ) : (
          <div className="card-faire-detail p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-900/60 text-stone-400 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3">Opened</th>
                    <th className="text-left px-3 py-3">Customer</th>
                    <th className="text-left px-3 py-3">Type</th>
                    <th className="text-left px-3 py-3">Status</th>
                    <th className="text-left px-3 py-3">Channel</th>
                    <th className="text-left px-3 py-3">Order</th>
                    <th className="text-left px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {disputes.map((d) => (
                    <tr key={d.id} className="hover:bg-stone-900/40">
                      <td className="px-4 py-2 font-mono text-stone-400 text-xs">
                        <Link href={`/admin/disputes/${d.id}`} className="hover:text-[#C9A96E] hover:underline">
                          {new Date(d.opened_at).toISOString().slice(0, 10)}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/disputes/${d.id}`}
                          className="text-stone-200 hover:text-[#C9A96E] hover:underline"
                        >
                          {d.customer_email}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-stone-300 text-xs">{d.dispute_type.replace('_', ' ')}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusPillClass(d.status)}`}>
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-stone-500 text-xs font-mono">{d.opened_via}</td>
                      <td className="px-3 py-2 text-stone-500 text-xs font-mono">
                        {d.order_id ? (
                          <Link href={`/admin/orders/${d.order_id}`} className="hover:text-[#C9A96E] hover:underline">
                            {d.order_id.slice(0, 8)}…
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-2 text-stone-400 text-xs max-w-md truncate">
                        {d.resolution_notes ?? '—'}
                      </td>
                    </tr>
                  ))}
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
      <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => {
          const params = new URLSearchParams();
          for (const [k, v] of Object.entries(currentQuery)) {
            if (typeof v === 'string' && v && k !== name) params.set(k, v);
          }
          if (o.value && o.value !== 'all' && o.value !== 'open') params.set(name, o.value);
          else if (o.value === 'open' || o.value === 'all') params.set(name, o.value);
          const href = `/admin/disputes?${params.toString()}`;
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

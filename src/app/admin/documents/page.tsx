import Link from 'next/link';
import {
  listDocuments,
  availableTaxYears,
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  type DocumentCategory,
  type DocumentStatus,
} from '@/lib/documents-data';
import UploadForm from './UploadForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Documents — Admin — Jimmy Potters', robots: 'noindex, nofollow' };

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

type Search = Record<string, string | string[] | undefined>;
function str(v: string | string[] | undefined): string {
  return typeof v === 'string' ? v : '';
}

function statusPillClass(s: DocumentStatus): string {
  if (s === 'confirmed') return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300';
  if (s === 'parsed') return 'bg-blue-500/10 border border-blue-500/30 text-blue-300';
  if (s === 'rejected') return 'bg-red-500/10 border border-red-500/30 text-red-300';
  return 'bg-amber-500/10 border border-amber-500/30 text-amber-300';
}

export default async function DocumentsPage({ searchParams }: { searchParams: Search }) {
  const statusRaw = str(searchParams.status);
  const categoryRaw = str(searchParams.category);
  const taxYearRaw = str(searchParams.year);
  const taxYear =
    /^\d{4}$/.test(taxYearRaw) ? (parseInt(taxYearRaw, 10) as number)
    : taxYearRaw === 'all' ? 'all'
    : 'all';

  const status: DocumentStatus | 'all' = (DOCUMENT_STATUSES as string[]).includes(statusRaw)
    ? (statusRaw as DocumentStatus)
    : 'all';
  const category: DocumentCategory | 'all' = (DOCUMENT_CATEGORIES as string[]).includes(categoryRaw)
    ? (categoryRaw as DocumentCategory)
    : 'all';

  const [docs, years] = await Promise.all([
    listDocuments({ status, category, taxYear: taxYear === 'all' ? 'all' : taxYear }),
    availableTaxYears(),
  ]);

  const statusCounts = docs.reduce(
    (acc, d) => {
      acc[d.status] = (acc[d.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<DocumentStatus, number>,
  );

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · Documents
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">
              Financial Documents
            </h1>
            <p className="text-stone-400 text-sm font-body mt-2">
              Upload receipts, invoices, bills, 1099s. Extracted fields feed overhead expenses and the P&amp;L.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← Dashboard
            </Link>
            <Link href="/admin/expenses" className="btn-faire !w-auto">Overhead Expenses</Link>
          </nav>
        </header>

        <section className="mb-6">
          <UploadForm />
        </section>

        <section className="mb-6 card-faire-detail p-4">
          <div className="flex flex-wrap items-end gap-4">
            <FilterPills
              label="Status"
              name="status"
              value={status}
              options={[{ value: 'all', label: 'All' }, ...DOCUMENT_STATUSES.map((s) => ({
                value: s,
                label: `${s}${statusCounts[s] ? ` (${statusCounts[s]})` : ''}`,
              }))]}
              currentQuery={searchParams}
            />
            <FilterPills
              label="Category"
              name="category"
              value={category}
              options={[{ value: 'all', label: 'All' }, ...DOCUMENT_CATEGORIES.map((c) => ({
                value: c,
                label: c.replace('_', ' '),
              }))]}
              currentQuery={searchParams}
            />
            <FilterPills
              label="Tax Year"
              name="year"
              value={String(taxYear)}
              options={[
                { value: 'all', label: 'All' },
                ...years.map((y) => ({ value: String(y), label: String(y) })),
              ]}
              currentQuery={searchParams}
            />
            <p className="ml-auto text-stone-400 text-xs font-body">
              <span className="text-stone-200 font-mono">{docs.length}</span> document
              {docs.length === 1 ? '' : 's'}
            </p>
          </div>
        </section>

        {docs.length === 0 ? (
          <div className="card-faire-detail p-6 border border-stone-700">
            <p className="text-stone-400 text-sm">
              No documents match these filters. Upload one above or{' '}
              <Link href="/admin/documents" className="text-[#C9A96E] hover:underline">clear filters →</Link>
            </p>
          </div>
        ) : (
          <div className="card-faire-detail p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-900/60 text-stone-400 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3">Uploaded</th>
                    <th className="text-left px-3 py-3">File</th>
                    <th className="text-left px-3 py-3">Category</th>
                    <th className="text-left px-3 py-3">Status</th>
                    <th className="text-left px-3 py-3">Vendor</th>
                    <th className="text-right px-3 py-3">Amount</th>
                    <th className="text-left px-3 py-3">Issued</th>
                    <th className="text-right px-3 py-3">Year</th>
                    <th className="text-right px-4 py-3">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {docs.map((d) => (
                    <tr key={d.id} className="hover:bg-stone-900/40">
                      <td className="px-4 py-2 font-mono text-stone-400 text-xs">
                        <Link href={`/admin/documents/${d.id}`} className="hover:text-[#C9A96E] hover:underline">
                          {new Date(d.created_at).toISOString().slice(0, 10)}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/documents/${d.id}`}
                          className="text-stone-200 hover:text-[#C9A96E] hover:underline"
                        >
                          {d.original_filename}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-stone-400 text-xs font-mono">{d.category}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusPillClass(d.status)}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-stone-300">{d.extracted_vendor ?? '—'}</td>
                      <td className="px-3 py-2 text-right font-mono text-stone-200">
                        {d.extracted_amount_cents != null ? USD.format(d.extracted_amount_cents / 100) : '—'}
                      </td>
                      <td className="px-3 py-2 font-mono text-stone-400 text-xs">
                        {d.extracted_issued_on ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-stone-400 text-xs">
                        {d.tax_year ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-stone-500 text-xs">
                        {(d.size_bytes / 1024).toFixed(0)} KB
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

function FilterPills({
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
          if (o.value && o.value !== 'all') params.set(name, o.value);
          const href = `/admin/documents${params.toString() ? `?${params.toString()}` : ''}`;
          const active = value === o.value || (o.value === 'all' && (value === 'all' || !value));
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

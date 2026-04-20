import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getWholesaleApplication,
  type WholesaleApplicationStatus,
} from '@/lib/wholesale-applications-data';
import WholesaleControls from './WholesaleControls';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Wholesale Application — Admin — Jimmy Potters', robots: 'noindex, nofollow' };

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmtCents = (c: number) => USD.format(c / 100);

function statusPillClass(s: WholesaleApplicationStatus): string {
  if (s === 'pending') return 'bg-amber-500/10 border border-amber-500/30 text-amber-300';
  if (s === 'needs_info') return 'bg-blue-500/10 border border-blue-500/30 text-blue-300';
  if (s === 'approved') return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300';
  return 'bg-stone-700 text-stone-300';
}

export default async function WholesaleApplicationDetail({
  params,
}: {
  params: { id: string };
}) {
  const application = await getWholesaleApplication(params.id);
  if (!application) notFound();

  const isBusiness = application.buyer_type === 'business';
  const buyerLabel = isBusiness
    ? (application.company_name || '(unnamed business)')
    : `${application.contact_name} (individual)`;

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · Wholesale
            </p>
            <h1 className="text-2xl md:text-3xl font-heading font-black text-white tracking-tight">
              {buyerLabel}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-400">
              <span className={`text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusPillClass(application.status)}`}>
                {application.status.replace('_', ' ')}
              </span>
              <span className="font-mono text-stone-500 capitalize">{application.buyer_type}</span>
              <span className="text-stone-500">
                Submitted{' '}
                <span className="font-mono text-stone-400">
                  {new Date(application.submitted_at).toISOString().slice(0, 16).replace('T', ' ')}
                </span>
              </span>
              {application.reviewed_at && (
                <span className="text-stone-500">
                  Reviewed {new Date(application.reviewed_at).toISOString().slice(0, 10)}
                </span>
              )}
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/admin/wholesale" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← All applications
            </Link>
          </nav>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="space-y-4">
            {isBusiness ? (
              <article className="card-faire-detail p-5">
                <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
                  Business
                </h2>
                <dl className="space-y-2 text-sm">
                  <Field term="Company" value={application.company_name} />
                  <Field term="Address" value={application.company_address} />
                  <Field term="Website" value={application.company_website} />
                  <Field term="Tax ID" value={application.tax_id} />
                </dl>
              </article>
            ) : (
              <article className="card-faire-detail p-5">
                <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
                  Individual buyer
                </h2>
                <dl className="space-y-2 text-sm">
                  <Field term="Shipping" value={application.shipping_address} />
                </dl>
              </article>
            )}

            <article className="card-faire-detail p-5">
              <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
                Contact
              </h2>
              <dl className="space-y-2 text-sm">
                <Field term="Name" value={application.contact_name} />
                <Field
                  term="Email"
                  value={application.contact_email}
                  href={`mailto:${application.contact_email}`}
                />
                <Field term="Phone" value={application.contact_phone} />
              </dl>
            </article>

            {application.notes && (
              <article className="card-faire-detail p-5">
                <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
                  Buyer notes
                </h2>
                <p className="text-stone-300 text-sm whitespace-pre-wrap">{application.notes}</p>
              </article>
            )}

            <article className="card-faire-detail p-5">
              <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
                Requested items · {application.cart_item_count}
              </h2>
              {application.cart_items.length === 0 ? (
                <p className="text-stone-500 text-xs">No items on this request.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-stone-500 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="text-left py-2">Product</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Unit</th>
                      <th className="text-right py-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {application.cart_items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 text-stone-200 text-xs">
                          #{item.productNumber} {item.name}
                        </td>
                        <td className="py-2 text-right text-stone-300 text-xs font-mono">
                          {item.quantity}
                        </td>
                        <td className="py-2 text-right text-stone-400 text-xs font-mono">
                          {fmtCents(item.price)}
                        </td>
                        <td className="py-2 text-right text-stone-200 text-xs font-mono">
                          {fmtCents(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-stone-700">
                      <td colSpan={3} className="pt-3 text-right text-stone-400 text-xs font-heading font-bold uppercase tracking-wider">
                        Retail value
                      </td>
                      <td className="pt-3 text-right text-stone-200 text-sm font-mono">
                        {fmtCents(application.cart_retail_total_cents)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </article>
          </section>

          <WholesaleControls application={application} />
        </div>
      </div>
    </main>
  );
}

function Field({
  term,
  value,
  href,
}: {
  term: string;
  value: string | null | undefined;
  href?: string;
}) {
  if (!value) {
    return (
      <div className="flex gap-3">
        <dt className="text-stone-500 text-xs w-24 flex-shrink-0 uppercase tracking-wider font-heading font-bold">
          {term}
        </dt>
        <dd className="text-stone-600 text-xs italic">—</dd>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <dt className="text-stone-500 text-xs w-24 flex-shrink-0 uppercase tracking-wider font-heading font-bold">
        {term}
      </dt>
      <dd className="text-stone-200 text-sm break-all">
        {href ? (
          <a href={href} className="hover:text-[#C9A96E] hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

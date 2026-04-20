import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDispute, getLinkedOrder } from '@/lib/disputes-data';
import DisputeControls from './DisputeControls';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dispute — Admin — Jimmy Potters', robots: 'noindex, nofollow' };

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function statusPillClass(s: string): string {
  if (s === 'new') return 'bg-red-500/10 border border-red-500/30 text-red-300';
  if (s === 'investigating') return 'bg-amber-500/10 border border-amber-500/30 text-amber-300';
  if (s === 'awaiting_customer') return 'bg-blue-500/10 border border-blue-500/30 text-blue-300';
  if (s === 'resolved_refund') return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300';
  if (s === 'resolved_replacement') return 'bg-teal-500/10 border border-teal-500/30 text-teal-300';
  if (s === 'resolved_no_action') return 'bg-stone-700 text-stone-300';
  return 'bg-stone-800 text-stone-500';
}

export default async function DisputeDetailPage({ params }: { params: { id: string } }) {
  const dispute = await getDispute(params.id);
  if (!dispute) notFound();
  const linkedOrder = await getLinkedOrder(dispute.order_id);

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · Dispute
            </p>
            <h1 className="text-2xl md:text-3xl font-heading font-black text-white tracking-tight">
              {dispute.customer_email}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-400">
              <span className={`text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusPillClass(dispute.status)}`}>
                {dispute.status.replace('_', ' ')}
              </span>
              <span className="font-mono text-stone-500">
                {dispute.dispute_type.replace('_', ' ')}
              </span>
              <span className="text-stone-500">
                Opened via <span className="font-mono text-stone-400">{dispute.opened_via}</span> ·{' '}
                {new Date(dispute.opened_at).toISOString().slice(0, 16).replace('T', ' ')}
              </span>
              {dispute.closed_at && (
                <span className="text-stone-500">
                  Closed {new Date(dispute.closed_at).toISOString().slice(0, 10)}
                </span>
              )}
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/admin/disputes" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← All disputes
            </Link>
          </nav>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section>
            {linkedOrder ? (
              <article className="card-faire-detail p-5 mb-4">
                <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-2">
                  Linked order
                </h2>
                <p className="font-mono text-sm text-stone-200">
                  <Link href={`/admin/orders/${linkedOrder.id}`} className="hover:text-[#C9A96E] hover:underline">
                    {linkedOrder.id}
                  </Link>
                </p>
                <p className="text-xs text-stone-400 mt-2">
                  {USD.format(linkedOrder.total_cents / 100)} · status {linkedOrder.status} ·
                  payment {linkedOrder.payment_method} · placed{' '}
                  {new Date(linkedOrder.created_at).toISOString().slice(0, 10)}
                </p>
              </article>
            ) : (
              <article className="card-faire-detail p-5 mb-4 border border-stone-700">
                <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-2">
                  No linked order
                </h2>
                <p className="text-stone-400 text-xs">
                  This dispute isn't tied to an order in the database. Edit the dispute row to add one if it
                  ought to be.
                </p>
              </article>
            )}

            {Array.isArray(dispute.chat_transcript) && (dispute.chat_transcript as unknown[]).length > 0 && (
              <article className="card-faire-detail p-5">
                <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
                  Chat transcript
                </h2>
                <pre className="text-xs text-stone-300 whitespace-pre-wrap max-h-96 overflow-y-auto bg-stone-900/60 p-3 rounded border border-stone-800 font-mono">
                  {JSON.stringify(dispute.chat_transcript as unknown, null, 2)}
                </pre>
              </article>
            )}
          </section>

          <DisputeControls dispute={dispute} linkedOrder={linkedOrder} />
        </div>
      </div>
    </main>
  );
}

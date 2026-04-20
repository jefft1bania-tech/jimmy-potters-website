import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDocument, signedDocumentUrl } from '@/lib/documents-data';
import ReviewForm from './ReviewForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Document — Admin — Jimmy Potters', robots: 'noindex, nofollow' };

function statusPillClass(s: string): string {
  if (s === 'confirmed') return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300';
  if (s === 'parsed') return 'bg-blue-500/10 border border-blue-500/30 text-blue-300';
  if (s === 'rejected') return 'bg-red-500/10 border border-red-500/30 text-red-300';
  return 'bg-amber-500/10 border border-amber-500/30 text-amber-300';
}

export default async function DocumentDetailPage({ params }: { params: { id: string } }) {
  const doc = await getDocument(params.id);
  if (!doc) notFound();

  const signedUrl = await signedDocumentUrl(doc.storage_path, 300);
  const isImage = doc.mime_type.startsWith('image/');
  const isPdf = doc.mime_type === 'application/pdf';

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · Document
            </p>
            <h1 className="text-2xl md:text-3xl font-heading font-black text-white tracking-tight truncate">
              {doc.original_filename}
            </h1>
            <p className="text-stone-400 text-sm font-body mt-2 flex items-center gap-3 flex-wrap">
              <span className={`text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusPillClass(doc.status)}`}>
                {doc.status}
              </span>
              <span className="text-stone-500 font-mono text-xs">{doc.mime_type}</span>
              <span className="text-stone-500 font-mono text-xs">{(doc.size_bytes / 1024).toFixed(0)} KB</span>
              <span className="text-stone-500 text-xs">
                Uploaded {new Date(doc.created_at).toISOString().slice(0, 10)}
              </span>
              {doc.reviewed_at && (
                <span className="text-stone-500 text-xs">
                  Reviewed {new Date(doc.reviewed_at).toISOString().slice(0, 10)}
                </span>
              )}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/admin/documents" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← All documents
            </Link>
            {signedUrl && (
              <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="btn-faire !w-auto">
                Download
              </a>
            )}
          </nav>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="card-faire-detail p-0 overflow-hidden">
            {!signedUrl ? (
              <div className="p-10 text-center text-stone-500 text-sm">
                Preview unavailable. Use Download.
              </div>
            ) : isImage ? (
              <img
                src={signedUrl}
                alt={doc.original_filename}
                className="w-full h-auto bg-stone-900"
              />
            ) : isPdf ? (
              <iframe
                src={signedUrl}
                title={doc.original_filename}
                className="w-full h-[80vh] bg-stone-900"
              />
            ) : (
              <div className="p-10 text-center text-stone-500 text-sm">
                Inline preview not supported for {doc.mime_type}. Use Download.
              </div>
            )}
          </section>

          <section>
            <ReviewForm doc={doc} />
          </section>
        </div>
      </div>
    </main>
  );
}

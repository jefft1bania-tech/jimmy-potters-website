import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import VendorForm from '../VendorForm';
import { DeleteVendorButton } from '../DeleteVendorButton';
import type { VendorRow } from '@/lib/vendors-data';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Vendor Detail — Admin — Jimmy Potters',
  robots: 'noindex, nofollow',
};

export default async function VendorDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !data) notFound();
  const vendor = data as VendorRow;

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
              Admin · Vendor · Edit
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">
              {vendor.name}
            </h1>
            <p className="text-stone-400 text-sm font-body mt-2">
              Role: <span className="font-mono">{vendor.role}</span>
              <span className="mx-2">·</span>
              Status: <span className="font-mono">{vendor.status}</span>
            </p>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/admin/vendors" className="text-xs text-stone-400 hover:text-stone-200 underline">
              ← All Vendors
            </Link>
            <DeleteVendorButton id={vendor.id} name={vendor.name} />
          </nav>
        </header>

        <VendorForm initial={vendor} />
      </div>
    </main>
  );
}

'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteVendor } from './actions';

export function DeleteVendorButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete vendor "${name}"? Linked expenses keep history; vendor_id is set null.`)) return;
        startTransition(async () => {
          await deleteVendor(id);
          router.refresh();
        });
      }}
      className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50"
    >
      {pending ? '…' : 'Delete'}
    </button>
  );
}

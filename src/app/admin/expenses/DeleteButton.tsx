'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteOverheadExpense, deleteRecurringExpense } from './actions';

export function DeleteOverheadButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm('Delete this overhead entry?')) return;
        startTransition(async () => {
          await deleteOverheadExpense(id);
          router.refresh();
        });
      }}
      className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50"
    >
      {pending ? '…' : 'Delete'}
    </button>
  );
}

export function DeleteRecurringButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm('Delete this recurring expense?')) return;
        startTransition(async () => {
          await deleteRecurringExpense(id);
          router.refresh();
        });
      }}
      className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50"
    >
      {pending ? '…' : 'Delete'}
    </button>
  );
}

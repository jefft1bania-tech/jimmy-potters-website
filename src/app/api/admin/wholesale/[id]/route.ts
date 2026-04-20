import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/server';
import {
  updateWholesaleApplication,
  WHOLESALE_APPLICATION_STATUSES,
  type WholesaleApplicationStatus,
} from '@/lib/wholesale-applications-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STATUSES = new Set(WHOLESALE_APPLICATION_STATUSES);

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = ctx.params.id;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const patch: {
    status?: WholesaleApplicationStatus;
    adminNotes?: string | null;
    reviewedBy?: string | null;
  } = {};

  if ('status' in body) {
    if (typeof body.status !== 'string' || !STATUSES.has(body.status as WholesaleApplicationStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    patch.status = body.status as WholesaleApplicationStatus;
    patch.reviewedBy = profile.id;
  }

  if ('admin_notes' in body) {
    const v = body.admin_notes;
    patch.adminNotes = typeof v === 'string' && v.trim() ? v.trim() : null;
  }

  if (patch.status === undefined && patch.adminNotes === undefined) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  try {
    const updated = await updateWholesaleApplication(id, patch);
    return NextResponse.json({ ok: true, application: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

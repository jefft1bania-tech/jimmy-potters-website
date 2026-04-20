import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyCronRequest } from '@/lib/cron-auth';
import { selectOrdersToNotify, classifyShipByWindow } from '@/lib/notifications';
import { computeDuePosts, type RecurringExpense } from '@/lib/expenses/recurring';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: Request) {
  const gate = verifyCronRequest(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const started = Date.now();
  const results = {
    ship_by: { considered: 0, queued: 0, emailed: 0, logged: 0, errors: [] as string[] },
    recurring: { due: 0, posted: 0, errors: [] as string[] },
  };

  try {
    await runShipByNotifications(results.ship_by);
  } catch (e) {
    results.ship_by.errors.push(e instanceof Error ? e.message : 'ship_by failed');
  }

  try {
    await runRecurringExpensePosts(results.recurring);
  } catch (e) {
    results.recurring.errors.push(e instanceof Error ? e.message : 'recurring failed');
  }

  return NextResponse.json({ ok: true, duration_ms: Date.now() - started, ...results });
}

async function runShipByNotifications(out: {
  considered: number;
  queued: number;
  emailed: number;
  logged: number;
  errors: string[];
}) {
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };

  const [shipmentsRes, logRes] = await Promise.all([
    supabase
      .from('shipments')
      .select('order_id, required_ship_by, shipment_status, orders(email)')
      .neq('shipment_status', 'delivered'),
    supabase
      .from('notification_log')
      .select('order_id, notification_type')
      .in('notification_type', ['ship_by_30d', 'ship_by_14d', 'ship_by_7d', 'ship_by_3d', 'overdue']),
  ]);

  const shipments = (shipmentsRes.data ?? []) as Array<{
    order_id: string;
    required_ship_by: string | null;
    shipment_status: string;
    orders: { email: string | null } | null;
  }>;
  const alreadyNotified = (logRes.data ?? []) as Array<{ order_id: string; notification_type: string }>;

  out.considered = shipments.length;

  const today = new Date();
  const toNotify = selectOrdersToNotify(shipments, alreadyNotified, today);
  out.queued = toNotify.length;
  if (toNotify.length === 0) return;

  const recipient = process.env.JIMMY_NOTIFY_EMAIL;
  const from = process.env.WHOLESALE_EMAIL_FROM ?? 'notifications@jimmypotters.com';
  const resendKey = process.env.RESEND_API_KEY;
  const resend = resendKey ? new Resend(resendKey) : null;

  for (const entry of toNotify) {
    const ship = shipments.find((s) => s.order_id === entry.order_id);
    const window = classifyShipByWindow(ship?.required_ship_by ?? null, today);

    if (resend && recipient && entry.notification_type) {
      const subject = `[${entry.notification_type.toUpperCase().replace('_', ' ')}] Order ${entry.order_id.slice(0, 8)} — ship by ${ship?.required_ship_by ?? 'unset'}`;
      const body = `Order ${entry.order_id} (${ship?.orders?.email ?? 'unknown buyer'}) is in the ${entry.notification_type} window.\nCurrent window: ${window ?? 'cleared'}.\nDashboard: ${process.env.NEXT_PUBLIC_URL ?? ''}/admin/orders/${entry.order_id}`;
      try {
        await resend.emails.send({ from, to: recipient, subject, text: body });
        out.emailed++;
      } catch (e) {
        out.errors.push(`email ${entry.order_id}: ${e instanceof Error ? e.message : 'unknown'}`);
      }
    }

    const { error: logErr } = await supabase.from('notification_log').insert({
      order_id: entry.order_id,
      notification_type: entry.notification_type,
      recipient_email: recipient ?? 'n/a',
      payload: { window, shipment_status: ship?.shipment_status, required_ship_by: ship?.required_ship_by },
    });
    if (logErr) {
      // Overdue re-fires daily; dedupe unique index blocks duplicate (order_id, notification_type) —
      // expected for already-logged 30d/14d/7d/3d. Only surface unexpected errors.
      if (!String(logErr.message ?? '').includes('duplicate')) {
        out.errors.push(`log ${entry.order_id}: ${logErr.message}`);
      }
    } else {
      out.logged++;
    }
  }
}

async function runRecurringExpensePosts(out: {
  due: number;
  posted: number;
  errors: string[];
}) {
  const supabase = createSupabaseAdminClient() as unknown as { from: (t: string) => any };

  const todayIso = new Date().toISOString().slice(0, 10);
  const { data: recurring, error } = await supabase
    .from('recurring_expenses')
    .select('id, category, amount_cents, recurrence, starts_on, ends_on, last_posted_on')
    .or(`ends_on.is.null,ends_on.gte.${todayIso}`);
  if (error) {
    out.errors.push(`recurring fetch: ${error.message}`);
    return;
  }

  const due = computeDuePosts((recurring ?? []) as RecurringExpense[], new Date());
  out.due = due.length;
  if (due.length === 0) return;

  // Group by recurring_expense_id so we can set last_posted_on once per source row.
  const latestByExpense = new Map<string, string>();
  for (const p of due) {
    const prev = latestByExpense.get(p.recurring_expense_id);
    if (!prev || p.incurred_on > prev) latestByExpense.set(p.recurring_expense_id, p.incurred_on);
  }

  for (const post of due) {
    const { error: insertErr } = await supabase.from('overhead_expenses').insert({
      amount_cents: post.amount_cents,
      incurred_on: post.incurred_on,
      category: post.category,
      source: 'recurring',
      source_ref: post.recurring_expense_id,
      notes: `Auto-posted from recurring on ${post.incurred_on}`,
    });
    if (insertErr) {
      out.errors.push(`post ${post.recurring_expense_id} ${post.incurred_on}: ${insertErr.message}`);
    } else {
      out.posted++;
    }
  }

  for (const [id, lastDate] of latestByExpense.entries()) {
    const { error: updErr } = await supabase
      .from('recurring_expenses')
      .update({ last_posted_on: lastDate })
      .eq('id', id);
    if (updErr) {
      out.errors.push(`bump last_posted_on ${id}: ${updErr.message}`);
    }
  }
}

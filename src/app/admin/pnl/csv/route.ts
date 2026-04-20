import { NextRequest } from 'next/server';
import { loadPnlRangeData, validateRange } from '@/lib/pnl-data';
import { requireAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function dollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof Response) return err;
    return new Response('Forbidden', { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';

  try {
    validateRange(from, to);
  } catch (e) {
    return new Response((e as Error).message, { status: 400 });
  }

  const { aggregate, orders } = await loadPnlRangeData(from, to);

  const rows: string[] = [];
  rows.push(
    [
      'date',
      'order_id',
      'customer_email',
      'state',
      'payment_method',
      'revenue_usd',
      'sales_tax_usd',
      'cogs_materials_usd',
      'cogs_labor_usd',
      'cogs_packaging_usd',
      'cogs_freight_usd',
      'cogs_other_usd',
      'cogs_total_usd',
      'stripe_fee_usd',
      'gross_profit_usd',
      'uses_estimate',
    ].join(','),
  );

  for (const p of aggregate.per_order) {
    const o = orders.find((x) => x.id === p.order_id);
    rows.push(
      [
        csvEscape(o ? new Date(o.created_at).toISOString().slice(0, 10) : ''),
        csvEscape(p.order_id),
        csvEscape(o?.email ?? ''),
        csvEscape(o?.buyer_state ?? ''),
        csvEscape(o?.payment_method ?? ''),
        dollars(p.revenue - p.sales_tax_passthrough),
        dollars(p.sales_tax_passthrough),
        dollars(p.cogs_materials),
        dollars(p.cogs_labor),
        dollars(p.cogs_packaging),
        dollars(p.cogs_freight),
        dollars(p.cogs_other),
        dollars(p.cogs_total),
        dollars(p.stripe_fee),
        dollars(p.gross_profit),
        p.uses_estimate ? 'yes' : 'no',
      ].join(','),
    );
  }

  // Blank line + totals footer for tax-prep convenience.
  rows.push('');
  rows.push(`TOTALS,,,,,${dollars(aggregate.gross_revenue)},${dollars(aggregate.sales_tax_collected)},,,,,,${dollars(aggregate.total_cogs)},${dollars(aggregate.total_stripe_fees)},${dollars(aggregate.gross_profit)},`);
  rows.push('');
  rows.push('Summary,,,,Value');
  rows.push(`Gross Revenue,,,,${dollars(aggregate.gross_revenue)}`);
  rows.push(`Sales Tax Collected (pass-through),,,,${dollars(aggregate.sales_tax_collected)}`);
  rows.push(`Total COGS,,,,${dollars(aggregate.total_cogs)}`);
  rows.push(`Stripe Fees,,,,${dollars(aggregate.total_stripe_fees)}`);
  rows.push(`Gross Profit,,,,${dollars(aggregate.gross_profit)}`);
  rows.push(`Overhead (OpEx),,,,${dollars(aggregate.operating_expenses)}`);
  rows.push(`Net Profit,,,,${dollars(aggregate.net_profit)}`);

  rows.push('');
  rows.push('Sales Tax by State,Orders,Tax USD');
  for (const s of aggregate.sales_tax_by_state) {
    rows.push(`${csvEscape(s.state || 'UNKNOWN')},${s.order_count},${dollars(s.tax_cents)}`);
  }

  const body = rows.join('\n') + '\n';
  const filename = `pnl_${from}_to_${to}.csv`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

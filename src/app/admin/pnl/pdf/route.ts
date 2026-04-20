import { NextRequest } from 'next/server';
import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { loadPnlRangeData, validateRange } from '@/lib/pnl-data';
import { requireAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// @react-pdf needs Node runtime (Buffer + fs). Opt out of the Edge runtime.
export const runtime = 'nodejs';

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmtCents = (c: number) => USD.format(c / 100);

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#111',
  },
  h1: { fontSize: 20, fontWeight: 700, marginBottom: 2 },
  h2: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#666', marginBottom: 4, marginTop: 14 },
  sub: { fontSize: 9, color: '#555', marginBottom: 8 },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  kpi: {
    width: '32%',
    borderWidth: 0.5,
    borderColor: '#bbb',
    padding: 6,
    marginBottom: 6,
  },
  kpiLabel: { fontSize: 7, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiValue: { fontSize: 14, fontWeight: 700, marginTop: 2 },
  table: { display: 'flex', flexDirection: 'column', borderWidth: 0.5, borderColor: '#bbb', marginTop: 4 },
  thead: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderBottomWidth: 0.5, borderColor: '#bbb' },
  th: { fontSize: 7, fontWeight: 700, textTransform: 'uppercase', color: '#444', padding: 4 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.25, borderColor: '#ddd' },
  td: { fontSize: 8, padding: 4 },
  tfoot: { flexDirection: 'row', backgroundColor: '#f7f7f7', borderTopWidth: 0.5, borderColor: '#999', paddingVertical: 2 },
  right: { textAlign: 'right' },
  mono: { fontFamily: 'Courier' },
  colDate:   { width: '11%' },
  colOrder:  { width: '11%' },
  colEmail:  { width: '26%' },
  colState:  { width: '7%' },
  colMoney:  { width: '9%', textAlign: 'right' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  summaryStrong: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderColor: '#999',
    marginTop: 4,
    paddingTop: 4,
  },
  footer: { position: 'absolute', bottom: 18, left: 36, right: 36, fontSize: 7, color: '#888', textAlign: 'center' },
});

type PnlDocProps = {
  from: string;
  to: string;
  aggregate: Awaited<ReturnType<typeof loadPnlRangeData>>['aggregate'];
  orders: Awaited<ReturnType<typeof loadPnlRangeData>>['orders'];
};

function PnlDoc({ from, to, aggregate: pnl, orders }: PnlDocProps) {
  return React.createElement(
    Document,
    {
      title: `Jimmy Potters P&L ${from} to ${to}`,
      author: 'Jimmy Potters Admin',
    },
    React.createElement(
      Page,
      { size: 'LETTER', style: styles.page },
      React.createElement(Text, { style: styles.h1 }, 'Jimmy Potters — P&L Report'),
      React.createElement(
        Text,
        { style: styles.sub },
        `Range: ${from} → ${to}   ·   ${pnl.order_count} order${pnl.order_count === 1 ? '' : 's'}${
          pnl.has_estimates ? '   ·   Includes COGS estimates' : ''
        }`,
      ),

      React.createElement(Text, { style: styles.h2 }, 'Key Performance'),
      React.createElement(
        View,
        { style: styles.kpiRow },
        kpi('Gross Revenue',  fmtCents(pnl.gross_revenue)),
        kpi('Sales Tax',       fmtCents(pnl.sales_tax_collected)),
        kpi('Total COGS',      fmtCents(pnl.total_cogs)),
        kpi('Stripe Fees',     fmtCents(pnl.total_stripe_fees)),
        kpi('Overhead',        fmtCents(pnl.operating_expenses)),
        kpi('Net Profit',      fmtCents(pnl.net_profit)),
      ),

      React.createElement(Text, { style: styles.h2 }, 'Sales Tax by State'),
      React.createElement(
        View,
        { style: styles.table },
        React.createElement(
          View,
          { style: styles.thead },
          React.createElement(Text, { style: [styles.th, { width: '60%' }] }, 'State'),
          React.createElement(Text, { style: [styles.th, styles.right, { width: '20%' }] }, 'Orders'),
          React.createElement(Text, { style: [styles.th, styles.right, { width: '20%' }] }, 'Tax'),
        ),
        ...(pnl.sales_tax_by_state.length === 0
          ? [
              React.createElement(
                View,
                { style: styles.tr, key: 'empty' },
                React.createElement(
                  Text,
                  { style: [styles.td, { width: '100%', textAlign: 'center', color: '#888' }] },
                  'No sales tax in range.',
                ),
              ),
            ]
          : pnl.sales_tax_by_state.map((s) =>
              React.createElement(
                View,
                { style: styles.tr, key: s.state },
                React.createElement(Text, { style: [styles.td, { width: '60%' }] }, s.state || 'UNKNOWN'),
                React.createElement(Text, { style: [styles.td, styles.right, { width: '20%' }] }, String(s.order_count)),
                React.createElement(Text, { style: [styles.td, styles.right, styles.mono, { width: '20%' }] }, fmtCents(s.tax_cents)),
              ),
            )),
      ),

      React.createElement(Text, { style: styles.h2 }, 'Per-Order P&L'),
      React.createElement(
        View,
        { style: styles.table },
        React.createElement(
          View,
          { style: styles.thead },
          React.createElement(Text, { style: [styles.th, styles.colDate] }, 'Date'),
          React.createElement(Text, { style: [styles.th, styles.colOrder] }, 'Order'),
          React.createElement(Text, { style: [styles.th, styles.colEmail] }, 'Customer'),
          React.createElement(Text, { style: [styles.th, styles.colState] }, 'ST'),
          React.createElement(Text, { style: [styles.th, styles.colMoney] }, 'Rev'),
          React.createElement(Text, { style: [styles.th, styles.colMoney] }, 'Tax'),
          React.createElement(Text, { style: [styles.th, styles.colMoney] }, 'COGS'),
          React.createElement(Text, { style: [styles.th, styles.colMoney] }, 'Stripe'),
          React.createElement(Text, { style: [styles.th, styles.colMoney] }, 'Profit'),
        ),
        ...(pnl.per_order.length === 0
          ? [
              React.createElement(
                View,
                { style: styles.tr, key: 'empty' },
                React.createElement(
                  Text,
                  { style: [styles.td, { width: '100%', textAlign: 'center', color: '#888' }] },
                  'No revenue orders in range.',
                ),
              ),
            ]
          : pnl.per_order.map((p) => {
              const o = orders.find((x) => x.id === p.order_id);
              return React.createElement(
                View,
                { style: styles.tr, key: p.order_id },
                React.createElement(
                  Text,
                  { style: [styles.td, styles.colDate] },
                  o ? new Date(o.created_at).toISOString().slice(0, 10) : '—',
                ),
                React.createElement(Text, { style: [styles.td, styles.colOrder, styles.mono] }, p.order_id.slice(0, 8)),
                React.createElement(Text, { style: [styles.td, styles.colEmail] }, o?.email ?? '—'),
                React.createElement(Text, { style: [styles.td, styles.colState] }, o?.buyer_state ?? '—'),
                React.createElement(Text, { style: [styles.td, styles.colMoney, styles.mono] }, fmtCents(p.revenue - p.sales_tax_passthrough)),
                React.createElement(Text, { style: [styles.td, styles.colMoney, styles.mono] }, fmtCents(p.sales_tax_passthrough)),
                React.createElement(Text, { style: [styles.td, styles.colMoney, styles.mono] }, fmtCents(p.cogs_total)),
                React.createElement(Text, { style: [styles.td, styles.colMoney, styles.mono] }, fmtCents(p.stripe_fee)),
                React.createElement(Text, { style: [styles.td, styles.colMoney, styles.mono] }, fmtCents(p.gross_profit)),
              );
            })),
        pnl.per_order.length > 0
          ? React.createElement(
              View,
              { style: styles.tfoot, key: 'foot' },
              React.createElement(Text, { style: [styles.td, styles.colDate] }, ''),
              React.createElement(Text, { style: [styles.td, styles.colOrder] }, ''),
              React.createElement(Text, { style: [styles.td, styles.colEmail, { textAlign: 'right' }] }, 'TOTALS'),
              React.createElement(Text, { style: [styles.td, styles.colState] }, ''),
              React.createElement(Text, { style: [styles.td, styles.colMoney, styles.mono] }, fmtCents(pnl.gross_revenue)),
              React.createElement(Text, { style: [styles.td, styles.colMoney, styles.mono] }, fmtCents(pnl.sales_tax_collected)),
              React.createElement(Text, { style: [styles.td, styles.colMoney, styles.mono] }, fmtCents(pnl.total_cogs)),
              React.createElement(Text, { style: [styles.td, styles.colMoney, styles.mono] }, fmtCents(pnl.total_stripe_fees)),
              React.createElement(Text, { style: [styles.td, styles.colMoney, styles.mono] }, fmtCents(pnl.gross_profit)),
            )
          : null,
      ),

      React.createElement(Text, { style: styles.h2 }, 'Summary'),
      summaryRow('Gross Revenue', fmtCents(pnl.gross_revenue)),
      summaryRow('Sales Tax Collected (pass-through)', fmtCents(pnl.sales_tax_collected)),
      summaryRow('Total COGS', `- ${fmtCents(pnl.total_cogs)}`),
      summaryRow('Stripe Fees', `- ${fmtCents(pnl.total_stripe_fees)}`),
      summaryRow('Gross Profit', fmtCents(pnl.gross_profit)),
      summaryRow('Overhead / OpEx', `- ${fmtCents(pnl.operating_expenses)}`),
      React.createElement(
        View,
        { style: styles.summaryStrong },
        React.createElement(Text, { style: { fontWeight: 700 } }, 'Net Profit'),
        React.createElement(Text, { style: [{ fontWeight: 700 }, styles.mono] }, fmtCents(pnl.net_profit)),
      ),

      React.createElement(
        Text,
        { style: styles.footer, fixed: true },
        `Generated ${new Date().toISOString().slice(0, 10)} · Jimmy Potters Admin · Tax filing reference`,
      ),
    ),
  );
}

function kpi(label: string, value: string) {
  return React.createElement(
    View,
    { style: styles.kpi, key: label },
    React.createElement(Text, { style: styles.kpiLabel }, label),
    React.createElement(Text, { style: styles.kpiValue }, value),
  );
}

function summaryRow(label: string, value: string) {
  return React.createElement(
    View,
    { style: styles.summaryRow, key: label },
    React.createElement(Text, {}, label),
    React.createElement(Text, { style: styles.mono }, value),
  );
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

  // PnlDoc() returns a <Document>, but TypeScript can't infer that through our
  // React.createElement wrapper — cast to satisfy @react-pdf's renderToBuffer
  // which specifically wants ReactElement<DocumentProps>.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(PnlDoc as any, { from, to, aggregate, orders });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);

  const filename = `pnl_${from}_to_${to}.pdf`;

  // Buffer -> Uint8Array for cross-runtime BodyInit compatibility. Cast is
  // needed because the project's TS version types Uint8Array with a stricter
  // ArrayBufferLike generic than the BodyInit signature accepts.
  const body = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  return new Response(body as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

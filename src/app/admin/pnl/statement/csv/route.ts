// CSV export for /admin/pnl/statement — the accountant's handoff.
// Three sections concatenated: monthly grid, quarterly rollup, Schedule C
// mapping, sales-tax-by-state-by-month. All numbers as decimal dollars.

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/supabase/server';
import { loadPnlStatement } from '@/lib/pnl-statement-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const dollars = (c: number) => (c / 100).toFixed(2);
const csvEscape = (s: string) => /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;

export async function GET(req: NextRequest) {
  await requireAdmin();

  const yearParam = req.nextUrl.searchParams.get('year');
  const year = Number(yearParam) || new Date().getUTCFullYear();
  if (year < 2020 || year > 2099) {
    return NextResponse.json({ error: 'year out of range' }, { status: 400 });
  }

  const s = await loadPnlStatement(year, true);

  const lines: string[] = [];
  lines.push(`"Jimmy Potters P&L Statement",${year}`);
  lines.push(`"Generated",${new Date().toISOString()}`);
  lines.push('');

  // Monthly
  lines.push('"MONTHLY BREAKDOWN"');
  lines.push('"Month","From","To","Orders","Gross Revenue","Sales Tax","COGS","Stripe Fees","Gross Profit","Op. Expenses","Net Profit","Margin %"');
  for (const r of s.monthly) {
    const margin = r.aggregate.gross_revenue > 0 ? (r.aggregate.net_profit / r.aggregate.gross_revenue * 100).toFixed(1) : '0.0';
    lines.push([
      r.short,
      r.from,
      r.to,
      r.aggregate.order_count,
      dollars(r.aggregate.gross_revenue),
      dollars(r.aggregate.sales_tax_collected),
      dollars(r.aggregate.total_cogs),
      dollars(r.aggregate.total_stripe_fees),
      dollars(r.aggregate.gross_profit),
      dollars(r.aggregate.operating_expenses),
      dollars(r.aggregate.net_profit),
      margin,
    ].map((v) => csvEscape(String(v))).join(','));
  }
  // Annual totals row
  lines.push([
    `Total ${year}`, `${year}-01-01`, `${year}-12-31`,
    s.annual.order_count,
    dollars(s.annual.gross_revenue),
    dollars(s.annual.sales_tax_collected),
    dollars(s.annual.total_cogs),
    dollars(s.annual.total_stripe_fees),
    dollars(s.annual.gross_profit),
    dollars(s.annual.operating_expenses),
    dollars(s.annual.net_profit),
    (s.annual.margin_pct * 100).toFixed(1),
  ].map((v) => csvEscape(String(v))).join(','));
  lines.push('');

  // Quarterly
  lines.push('"QUARTERLY ROLLUP"');
  lines.push('"Quarter","Orders","Gross Revenue","COGS","Gross Profit","Op. Expenses","Net Profit"');
  for (const q of s.quarterly) {
    lines.push([
      q.label,
      q.order_count,
      dollars(q.gross_revenue),
      dollars(q.total_cogs),
      dollars(q.gross_profit),
      dollars(q.operating_expenses),
      dollars(q.net_profit),
    ].map((v) => csvEscape(String(v))).join(','));
  }
  lines.push('');

  // Schedule C
  lines.push('"IRS SCHEDULE C MAPPING"');
  lines.push('"Line","Description","Amount"');
  const sc = s.scheduleC;
  lines.push(['1',  'Gross receipts or sales',            dollars(sc.line1_gross_receipts)].map((v) => csvEscape(String(v))).join(','));
  lines.push(['2',  'Returns and allowances',              dollars(sc.line2_returns_allowances)].map((v) => csvEscape(String(v))).join(','));
  lines.push(['3',  'Subtract line 2 from line 1',        dollars(sc.line3_net_receipts)].map((v) => csvEscape(String(v))).join(','));
  lines.push(['4',  'Cost of goods sold (Part III)',      dollars(sc.line4_cogs)].map((v) => csvEscape(String(v))).join(','));
  lines.push(['7',  'Gross income',                        dollars(sc.line7_gross_income)].map((v) => csvEscape(String(v))).join(','));
  lines.push(['11', 'Commissions and fees (Stripe)',      dollars(sc.line11_commissions_fees)].map((v) => csvEscape(String(v))).join(','));
  lines.push(['15', 'Insurance',                           dollars(sc.line15_insurance)].map((v) => csvEscape(String(v))).join(','));
  lines.push(['—',  'Other operating expenses',            dollars(sc.line_other_operating)].map((v) => csvEscape(String(v))).join(','));
  lines.push(['28', 'Total expenses',                      dollars(sc.line28_total_expenses)].map((v) => csvEscape(String(v))).join(','));
  lines.push(['31', 'Net profit or loss',                  dollars(sc.line31_net_profit)].map((v) => csvEscape(String(v))).join(','));
  lines.push(['—',  'Estimated SE tax (~15.3%)',          dollars(sc.estimated_se_tax)].map((v) => csvEscape(String(v))).join(','));
  lines.push(['—',  'Estimated federal income tax (~12%)', dollars(sc.estimated_federal_income_tax)].map((v) => csvEscape(String(v))).join(','));
  lines.push('');

  // Sales tax × state × month
  if (s.salesTaxByStateMonth.length > 0) {
    lines.push('"SALES TAX BY STATE × MONTH"');
    lines.push(['"State"', ...MONTHS.map((m) => `"${m}"`), '"Total"'].join(','));
    for (const row of s.salesTaxByStateMonth) {
      lines.push([row.state, ...row.monthly.map((c) => dollars(c)), dollars(row.annual_total)].map((v) => csvEscape(String(v))).join(','));
    }
  }

  const body = lines.join('\n') + '\n';
  return new NextResponse(body, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="jimmy-potters-pnl-statement-${year}.csv"`,
    },
  });
}

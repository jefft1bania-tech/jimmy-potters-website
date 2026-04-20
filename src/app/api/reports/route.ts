import { NextRequest, NextResponse } from 'next/server';
import {
  generateMonthlyReport,
  generateYearlyReport,
  generateRangeReport,
  formatReportCurrency,
  type AccountingReport,
} from '@/lib/reports';
import { requireAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function formatReport(report: AccountingReport) {
  return {
    ...report,
    formatted: {
      grossRevenue: formatReportCurrency(report.grossRevenue),
      productRevenue: formatReportCurrency(report.productRevenue),
      totalSalesTaxCollected: formatReportCurrency(report.totalSalesTaxCollected),
      totalInternalShippingCosts: formatReportCurrency(report.totalInternalShippingCosts),
      netRevenueAfterShipping: formatReportCurrency(report.netRevenueAfterShipping),
      salesTaxByState: report.salesTaxByState.map((s) => ({
        ...s,
        taxCollected: formatReportCurrency(s.taxCollected),
      })),
    },
  };
}

/**
 * GET /api/reports?type=monthly&year=2026&month=4
 * GET /api/reports?type=yearly&year=2026
 * GET /api/reports?type=range&start=2026-01-01&end=2026-03-31
 *
 * All variants require admin role (enforced via requireAdmin()).
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'monthly';

  if (type === 'range') {
    const start = searchParams.get('start') || '';
    const end = searchParams.get('end') || '';
    if (!ISO_DATE.test(start) || !ISO_DATE.test(end)) {
      return NextResponse.json({ error: 'start/end must be YYYY-MM-DD' }, { status: 400 });
    }
    if (start > end) {
      return NextResponse.json({ error: 'start must be <= end' }, { status: 400 });
    }
    const report = await generateRangeReport(start, end);
    return NextResponse.json(formatReport(report));
  }

  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10);

  if (isNaN(year) || year < 2020 || year > 2100) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
  }

  if (type === 'monthly') {
    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid month (1-12)' }, { status: 400 });
    }
    const report = await generateMonthlyReport(year, month);
    return NextResponse.json(formatReport(report));
  }

  if (type === 'yearly') {
    const report = await generateYearlyReport(year);
    return NextResponse.json(formatReport(report));
  }

  return NextResponse.json(
    { error: 'Invalid type. Use "monthly", "yearly", or "range".' },
    { status: 400 },
  );
}

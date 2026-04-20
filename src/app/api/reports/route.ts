import { NextRequest, NextResponse } from 'next/server';
import { generateMonthlyReport, generateYearlyReport, formatReportCurrency } from '@/lib/reports';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports?type=monthly&year=2026&month=4
 * GET /api/reports?type=yearly&year=2026
 *
 * Returns accounting report with:
 *  - Gross Revenue
 *  - Total Sales Tax Collected (by state)
 *  - Total Internal Shipping Costs
 *  - Net Revenue After Shipping
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'monthly';
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
    return NextResponse.json({
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
    });
  }

  if (type === 'yearly') {
    const report = await generateYearlyReport(year);
    return NextResponse.json({
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
    });
  }

  return NextResponse.json({ error: 'Invalid type. Use "monthly" or "yearly".' }, { status: 400 });
}

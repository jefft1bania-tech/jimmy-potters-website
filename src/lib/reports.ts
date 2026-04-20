import { getAllOrders, type Order } from './orders';

// ═══════════════════════════════════════════════════════════════
// Accounting Reports — Monthly & Yearly
// ═══════════════════════════════════════════════════════════════

export interface TaxByState {
  state: string;
  orderCount: number;
  taxCollected: number; // cents
}

export interface AccountingReport {
  period: string;              // "2026-04" or "2026"
  periodType: 'monthly' | 'yearly';
  orderCount: number;
  grossRevenue: number;        // total charged to customers (cents)
  productRevenue: number;      // subtotals only — no tax (cents)
  totalSalesTaxCollected: number; // cents
  salesTaxByState: TaxByState[];
  totalInternalShippingCosts: number; // cents — absorbed by seller
  netRevenueAfterShipping: number;    // productRevenue - internalShipping
}

function filterOrdersByMonth(orders: Order[], year: number, month: number): Order[] {
  return orders.filter((o) => {
    if (o.status !== 'paid' && o.status !== 'shipped' && o.status !== 'delivered') return false;
    const d = new Date(o.createdAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

function filterOrdersByYear(orders: Order[], year: number): Order[] {
  return orders.filter((o) => {
    if (o.status !== 'paid' && o.status !== 'shipped' && o.status !== 'delivered') return false;
    const d = new Date(o.createdAt);
    return d.getFullYear() === year;
  });
}

function buildReport(orders: Order[], period: string, periodType: 'monthly' | 'yearly'): AccountingReport {
  const taxMap = new Map<string, TaxByState>();

  let grossRevenue = 0;
  let productRevenue = 0;
  let totalTax = 0;
  let totalShipping = 0;

  for (const order of orders) {
    grossRevenue += order.total;
    productRevenue += order.subtotal;
    totalTax += order.salesTaxCollected || 0;
    totalShipping += order.internalShippingCost || 0;

    const st = order.buyerState || order.shipping?.state || 'UNKNOWN';
    const existing = taxMap.get(st);
    if (existing) {
      existing.orderCount += 1;
      existing.taxCollected += order.salesTaxCollected || 0;
    } else {
      taxMap.set(st, {
        state: st,
        orderCount: 1,
        taxCollected: order.salesTaxCollected || 0,
      });
    }
  }

  const salesTaxByState = Array.from(taxMap.values()).sort((a, b) => b.taxCollected - a.taxCollected);

  return {
    period,
    periodType,
    orderCount: orders.length,
    grossRevenue,
    productRevenue,
    totalSalesTaxCollected: totalTax,
    salesTaxByState,
    totalInternalShippingCosts: totalShipping,
    netRevenueAfterShipping: productRevenue - totalShipping,
  };
}

/**
 * Generate a monthly accounting report.
 * @param year — e.g. 2026
 * @param month — 1-12
 */
export async function generateMonthlyReport(year: number, month: number): Promise<AccountingReport> {
  const orders = await getAllOrders();
  const filtered = filterOrdersByMonth(orders, year, month);
  const period = `${year}-${String(month).padStart(2, '0')}`;
  return buildReport(filtered, period, 'monthly');
}

/**
 * Generate a yearly accounting report.
 * @param year — e.g. 2026
 */
export async function generateYearlyReport(year: number): Promise<AccountingReport> {
  const orders = await getAllOrders();
  const filtered = filterOrdersByYear(orders, year);
  return buildReport(filtered, String(year), 'yearly');
}

/**
 * Format cents to USD string for display in reports.
 */
export function formatReportCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

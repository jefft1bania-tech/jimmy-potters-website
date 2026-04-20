// Lightweight, deterministic "Scale Insights" generator for /admin/pnl/drilldown.
//
// Not an LLM call — these are programmatic observations derived from the
// drill-down dashboard data. For longer-form narrative insights we route
// through `insights-engine.ts` (Anthropic SDK) via /admin/insights.

import type { DrilldownDashboardData } from './pnl-drilldown';

export type ScaleInsight = {
  id: string;
  severity: 'opportunity' | 'warning' | 'info';
  headline: string;
  detail: string;
  cta?: { label: string; href: string };
};

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function computeScaleInsights(data: DrilldownDashboardData): ScaleInsight[] {
  const insights: ScaleInsight[] = [];
  const { segments, orders, per_order, totals } = data;

  // Insight 1: Wholesale vs retail margin gap — push Faire if wholesale wins.
  const wMargin = segments.wholesale.margin_pct;
  const rMargin = segments.retail.margin_pct;
  const gap = wMargin - rMargin;
  if (Math.abs(gap) >= 0.05 && segments.wholesale.order_count > 0 && segments.retail.order_count > 0) {
    if (gap > 0) {
      insights.push({
        id: 'wholesale-margin-lever',
        severity: 'opportunity',
        headline: `Wholesale margin ${pct(wMargin)} vs retail ${pct(rMargin)} — push Faire harder`,
        detail: `Wholesale orders net ${dollars(segments.wholesale.net_margin_cents)} across ${segments.wholesale.order_count} orders (${segments.wholesale.units} units), vs retail ${dollars(segments.retail.net_margin_cents)} across ${segments.retail.order_count} orders. Each wholesale order is worth ~${pct(gap)} more margin than retail.`,
        cta: { label: 'Open wholesale queue →', href: '/admin/wholesale' },
      });
    } else {
      insights.push({
        id: 'retail-margin-lever',
        severity: 'info',
        headline: `Retail margin ${pct(rMargin)} beats wholesale ${pct(wMargin)} by ${pct(Math.abs(gap))}`,
        detail: `Retail is currently outperforming wholesale on margin. Re-examine Faire commission (25%) and wholesale unit prices — there may be room to lift wholesale pricing without losing the channel.`,
      });
    }
  }

  // Insight 2: Labor cost as % of revenue — single biggest controllable lever.
  const laborCents = per_order.reduce((s, p) => s + p.labor_cents, 0);
  const laborPct = totals.revenue_cents > 0 ? laborCents / totals.revenue_cents : 0;
  if (laborPct > 0) {
    insights.push({
      id: 'labor-lever',
      severity: laborPct > 0.2 ? 'warning' : 'info',
      headline: `Labor is ${pct(laborPct)} of revenue — ${laborPct > 0.2 ? 'biggest lever on margin' : 'within healthy range'}`,
      detail: `${dollars(laborCents)} of labor across ${per_order.reduce((s, p) => s + p.labor_minutes, 0)} minutes on ${totals.units} units. Dropping pack time by 3 min/pot (via pre-cut boxes + assembly-line stations) would save ${dollars(Math.round(totals.units * 100))}/month at current volume.`,
      cta: { label: 'Review labor times →', href: '/admin/products/labor-times' },
    });
  }

  // Insight 3: Shipsurance coverage — is every ship protected?
  const totalShipsurance = per_order.reduce((s, p) => s + p.shipsurance_cents, 0);
  const totalUnits = totals.units;
  const expectedShipsurance = totalUnits * 45;
  if (totalShipsurance < expectedShipsurance * 0.9) {
    insights.push({
      id: 'shipsurance-gap',
      severity: 'warning',
      headline: `Shipsurance coverage gap: ${dollars(expectedShipsurance - totalShipsurance)} of shipments unprotected`,
      detail: `At $0.45/unit, ${totalUnits} units should carry ${dollars(expectedShipsurance)} in Shipsurance premium. Actual: ${dollars(totalShipsurance)}. Unprotected breakage = full margin loss — activate Shipsurance on every ship.`,
      cta: { label: 'Shipping protocol →', href: '/admin/shipments' },
    });
  } else {
    insights.push({
      id: 'shipsurance-ok',
      severity: 'info',
      headline: `Shipsurance: ${dollars(totalShipsurance)} premium on ${totalUnits} units — fully covered`,
      detail: `Every ship carries the $0.45 Shipsurance line. Breakage claims should fully reimburse — confirm claim pipeline is active.`,
    });
  }

  // Insight 4: Stripe fee drag (only if we have at least one Stripe order)
  const stripeFees = per_order.reduce((s, p) => s + p.stripe_fee_cents, 0);
  const stripeOrders = orders.filter((o) => o.channel === 'stripe').length;
  if (stripeOrders > 0) {
    const stripeRevenue = orders
      .filter((o) => o.channel === 'stripe')
      .reduce((s, o) => s + o.line_items.reduce((ss, li) => ss + li.unit_price_cents * li.quantity, 0), 0);
    const stripePct = stripeRevenue > 0 ? stripeFees / stripeRevenue : 0;
    if (stripePct > 0.03) {
      insights.push({
        id: 'stripe-fee-drag',
        severity: 'info',
        headline: `Stripe fees eat ${pct(stripePct)} of Stripe revenue (${dollars(stripeFees)})`,
        detail: `On ${stripeOrders} Stripe orders totaling ${dollars(stripeRevenue)}, fees ran ${dollars(stripeFees)} — slightly above the 2.9%+$0.30 baseline due to small-ticket retail orders. Shifting high-volume wholesale off Stripe onto ACH/Net-30 would save fees.`,
      });
    }
  }

  // Top 3 — keep it tight, no noise.
  return insights.slice(0, 3);
}

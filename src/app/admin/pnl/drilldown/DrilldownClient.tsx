'use client';

// Drilldown client-side controller. Holds state for:
//   - which order is open in Tier 2 drawer
//   - which line item is open in Tier 3 drawer
// Keeps both drawers above the page via fixed positioning.

import { useState } from 'react';
import type {
  DrilldownOrder,
  DrilldownLineItem,
  OrderPnl,
  ReceiptLine,
  ReceiptCategory,
} from '@/lib/pnl-drilldown';
import {
  computeDrilldownOrderPnl,
  computeOrderReceipt,
  computeWorkerRequirements,
  bomForPot,
  BLENDED_LABOR_RATE_PER_HOUR_CENTS,
  PARALLEL_PACK_THRESHOLD_UNITS,
} from '@/lib/pnl-drilldown';

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmt = (c: number) => USD.format(c / 100);
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

// ---------- Segment Table (Tier 1) ----------

export function SegmentOrdersTable({
  title,
  subtitle,
  orders,
  perOrder,
  onOpenOrder,
  accentClass,
}: {
  title: string;
  subtitle: string;
  orders: DrilldownOrder[];
  perOrder: OrderPnl[];
  onOpenOrder: (order: DrilldownOrder) => void;
  accentClass: string;
}) {
  const lookup = new Map(perOrder.map((p) => [p.order_id, p]));

  return (
    <div className="card-faire-detail p-0 overflow-hidden">
      <div className={`px-5 py-4 border-b border-stone-800 ${accentClass}`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-heading font-bold text-white text-lg">{title}</h3>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 text-white text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-1 font-mono tabular-nums">
            <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
            {orders.length} {orders.length === 1 ? 'buyer' : 'buyers'}
          </span>
        </div>
        <p className="text-stone-400 text-xs font-body mt-1">{subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-stone-900/60 text-stone-400 text-[10px] uppercase tracking-wider">
            <tr>
              <th className="text-center px-2 py-2 w-8">#</th>
              <th className="text-left px-4 py-2">Buyer</th>
              <th className="text-right px-3 py-2">Units</th>
              <th className="text-right px-3 py-2">Revenue</th>
              <th className="text-right px-3 py-2">You keep</th>
              <th className="text-right px-3 py-2">Your take</th>
              <th className="text-left px-3 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-stone-500 text-center text-sm">
                  No orders in this segment for the range.
                </td>
              </tr>
            )}
            {orders.map((o, idx) => {
              const p = lookup.get(o.id);
              if (!p) return null;
              const marginTone =
                p.margin_pct < 0.15 ? 'text-red-300' :
                p.margin_pct < 0.3 ? 'text-amber-300' : 'text-emerald-300';
              return (
                <tr
                  key={o.id}
                  onClick={() => onOpenOrder(o)}
                  className="border-t border-stone-800 cursor-pointer hover:bg-stone-900/40 transition-colors"
                >
                  <td className="px-2 py-2.5 text-center font-mono text-[11px] text-stone-500 tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="text-stone-200 font-medium">{o.buyer_name}</div>
                    <div className="text-stone-500 text-[10px] mt-0.5">
                      {o.line_items.reduce((s, li) => s + li.quantity, 0)} pots · {o.channel.toUpperCase()}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-stone-300">{p.units}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-stone-200">{fmt(p.revenue_cents)}</td>
                  <td className={`px-3 py-2.5 text-right font-mono ${marginTone}`}>{fmt(p.net_margin_cents)}</td>
                  <td className={`px-3 py-2.5 text-right font-mono font-semibold ${marginTone}`}>{pct(p.margin_pct)}</td>
                  <td className="px-3 py-2.5 text-stone-500 whitespace-nowrap">
                    {new Date(o.created_at).toISOString().slice(0, 10)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Drill-down controller ----------

export default function DrilldownController({
  wholesaleOrders,
  retailOrders,
  perOrder,
}: {
  wholesaleOrders: DrilldownOrder[];
  retailOrders: DrilldownOrder[];
  perOrder: OrderPnl[];
}) {
  const [openOrder, setOpenOrder] = useState<DrilldownOrder | null>(null);
  const [openLine, setOpenLine] = useState<DrilldownLineItem | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SegmentOrdersTable
          title="Wholesale Segment"
          subtitle="≥10 units per order · Faire + direct B2B"
          orders={wholesaleOrders}
          perOrder={perOrder}
          onOpenOrder={setOpenOrder}
          accentClass="bg-gradient-to-r from-emerald-950/60 to-stone-900/40"
        />
        <SegmentOrdersTable
          title="Retail Segment"
          subtitle="1-9 units per order · Stripe checkout"
          orders={retailOrders}
          perOrder={perOrder}
          onOpenOrder={setOpenOrder}
          accentClass="bg-gradient-to-r from-sky-950/60 to-stone-900/40"
        />
      </div>

      {openOrder && (
        <OrderDrillDrawer
          order={openOrder}
          onClose={() => {
            setOpenOrder(null);
            setOpenLine(null);
          }}
          onOpenLine={setOpenLine}
        />
      )}

      {openLine && openOrder && (
        <LineItemDrawer
          order={openOrder}
          line={openLine}
          onClose={() => setOpenLine(null)}
        />
      )}
    </>
  );
}

// ---------- Tier 2: Order Cost Stack Drawer ----------

function OrderDrillDrawer({
  order,
  onClose,
  onOpenLine,
}: {
  order: DrilldownOrder;
  onClose: () => void;
  onOpenLine: (l: DrilldownLineItem) => void;
}) {
  const pnl = computeDrilldownOrderPnl(order);
  const totalUnits = order.line_items.reduce((s, li) => s + li.quantity, 0);
  const worker = computeWorkerRequirements(order);
  const receipt = computeOrderReceipt(order);
  const inlineBom = order.line_items[0]?.bom ?? bomForPot();

  // Default to the plain-language receipt — waterfall is for power users.
  const [view, setView] = useState<'receipt' | 'waterfall'>('receipt');

  // Waterfall rows — each bar sized by its share of revenue
  const waterfall = [
    { label: 'Revenue',                        value: pnl.revenue_cents,      tone: 'bg-emerald-500/70', sign: '+' },
    { label: 'Materials',                      value: -pnl.materials_cents,   tone: 'bg-red-500/60',     sign: '−' },
    { label: 'Labor',                          value: -pnl.labor_cents,       tone: 'bg-red-500/60',     sign: '−' },
    { label: 'Packaging',                      value: -pnl.packaging_cents,   tone: 'bg-red-500/60',     sign: '−' },
    { label: 'Shipping',                       value: -pnl.shipping_cents,    tone: 'bg-red-500/60',     sign: '−' },
    { label: 'Insurance (Shipsurance)',        value: -pnl.shipsurance_cents, tone: 'bg-red-500/60',     sign: '−' },
    { label: 'Payment processor fee (Stripe)', value: -pnl.stripe_fee_cents,  tone: 'bg-amber-500/60',   sign: '−' },
    { label: 'YOU KEEP',                       value: pnl.net_margin_cents,   tone: 'bg-emerald-400',    sign: '=' },
  ];
  const maxBar = Math.max(...waterfall.map((w) => Math.abs(w.value)));

  return (
    <div className="fixed inset-0 z-40 flex" role="dialog" aria-modal="true">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full md:w-[580px] bg-stone-950 border-l border-stone-800 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-stone-950/95 backdrop-blur px-6 py-4 border-b border-stone-800 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-heading font-bold uppercase tracking-[0.2em] text-stone-500">
              Order Drill · {order.segment === 'wholesale' ? 'Wholesale' : 'Retail'}
            </p>
            <h2 className="text-xl font-heading font-bold text-white mt-1">{order.buyer_name}</h2>
            <p className="text-stone-400 text-xs font-body mt-1">
              {totalUnits} pots · {order.channel.toUpperCase()} · {new Date(order.created_at).toISOString().slice(0, 10)}
            </p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white text-xl leading-none p-1">
            ×
          </button>
        </header>

        <div className="p-6 space-y-6">
          {/* KPIs — plain-language labels */}
          <div className="grid grid-cols-3 gap-3">
            <Kpi label="Revenue"   value={fmt(pnl.revenue_cents)} tone="text-white" />
            <Kpi label="You keep"  value={fmt(pnl.net_margin_cents)} tone={pnl.net_margin_cents > 0 ? 'text-emerald-300' : 'text-red-300'} />
            <Kpi label="Your take" value={pct(pnl.margin_pct)} tone={pnl.margin_pct > 0.3 ? 'text-emerald-300' : pnl.margin_pct > 0.15 ? 'text-amber-300' : 'text-red-300'} />
          </div>

          {/* Worker Requirements — throughput visible up top */}
          <WorkerRequirementsCard order={order} worker={worker} />

          {/* View toggle: plain receipt first, visual waterfall second */}
          <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
            <ViewTab active={view === 'receipt'}   onClick={() => setView('receipt')}>Receipt View</ViewTab>
            <ViewTab active={view === 'waterfall'} onClick={() => setView('waterfall')}>Visual Waterfall</ViewTab>
          </div>

          {view === 'receipt' && (
            <>
              <ReceiptView lines={receipt} />

              {/* Inline BOM so the user doesn't have to drill to Tier 3 to see packaging detail */}
              <section>
                <h3 className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
                  Packaging materials (ULINE BOM)
                </h3>
                <div className="card-faire-detail p-0 overflow-hidden">
                  <table className="w-full text-xs font-mono tabular-nums">
                    <tbody>
                      {inlineBom.map((b) => (
                        <tr key={b.sku} className="border-t border-stone-800 first:border-t-0">
                          <td className="px-3 py-1.5 text-stone-300">{b.label}</td>
                          <td className="px-3 py-1.5 text-right text-stone-200">{fmt(b.unit_cost_cents)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-stone-700 bg-stone-900/40">
                        <td className="px-3 py-1.5 text-stone-400 uppercase text-[10px] tracking-wider">Per-pot BOM total</td>
                        <td className="px-3 py-1.5 text-right text-stone-100 font-bold">
                          {fmt(inlineBom.reduce((s, l) => s + l.unit_cost_cents * l.quantity, 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {view === 'waterfall' && (
            <section>
              <h3 className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
                Cost Waterfall
              </h3>
              <div className="space-y-1.5">
                {waterfall.map((w) => {
                  const width = maxBar > 0 ? (Math.abs(w.value) / maxBar) * 100 : 0;
                  const bold = w.label === 'YOU KEEP' || w.label === 'Revenue';
                  return (
                    <div key={w.label} className="grid grid-cols-[160px_1fr_90px] gap-2 items-center">
                      <span className={`text-xs ${bold ? 'text-stone-100 font-bold' : 'text-stone-400'}`}>
                        {w.label}
                      </span>
                      <div className="h-5 bg-stone-900 rounded-sm overflow-hidden">
                        <div className={`h-full ${w.tone} transition-all`} style={{ width: `${width}%` }} />
                      </div>
                      <span className={`text-right text-xs font-mono tabular-nums ${bold ? 'text-stone-100 font-bold' : 'text-stone-300'}`}>
                        {w.sign} {fmt(Math.abs(w.value))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Line items — click to drill further */}
          <section>
            <h3 className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
              Line Items · click for BOM + labor detail
            </h3>
            <div className="space-y-2">
              {order.line_items.map((li, idx) => (
                <button
                  key={`${li.product_id}-${idx}`}
                  onClick={() => onOpenLine(li)}
                  className="w-full text-left card-faire-detail p-3 hover:border-[#C9A96E] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-stone-100 font-medium text-sm">{li.product_name}</p>
                      <p className="text-stone-500 text-[11px] mt-0.5">{li.product_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono tabular-nums text-stone-200 text-sm">
                        {li.quantity} × {fmt(li.unit_price_cents)}
                      </p>
                      <p className="text-stone-500 text-[11px] mt-0.5 font-mono tabular-nums">
                        {fmt(li.unit_price_cents * li.quantity)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-stone-500">
                    <span>Mat: {fmt(li.materials_cents)}/u</span>
                    <span>Pack: {fmt(li.packaging_cents)}/u</span>
                    <span>Labor: {li.labor_minutes}min</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <p className="text-[10px] text-stone-600 text-center pt-2 border-t border-stone-800">
            Revenue figures are mock until Stripe keys activate · cost stack uses real protocol data
          </p>
        </div>
      </aside>
    </div>
  );
}

// ---------- Receipt View (grocery-receipt style) ----------

const CATEGORY_DOT: Record<ReceiptCategory, string> = {
  revenue:     'bg-emerald-400',
  materials:   'bg-amber-400',
  packaging:   'bg-sky-400',
  labor:       'bg-purple-400',
  shipping:    'bg-emerald-500',
  fees:        'bg-rose-400',
  total_costs: 'bg-stone-500',
  net_margin:  'bg-emerald-300',
};

function ReceiptView({ lines }: { lines: ReceiptLine[] }) {
  return (
    <section>
      <h3 className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
        Receipt · every dollar in and out of this order
      </h3>
      <div className="card-faire-detail p-4 bg-stone-950/60">
        <div className="font-mono tabular-nums text-[12px] leading-relaxed">
          {lines.map((l, i) => {
            const isDividerBefore = l.category === 'total_costs' || l.category === 'net_margin';
            const isBold = l.category === 'revenue' || l.category === 'total_costs' || l.category === 'net_margin';
            const amountTone =
              l.category === 'revenue' ? 'text-emerald-300' :
              l.category === 'net_margin' ? (l.cents >= 0 ? 'text-emerald-300' : 'text-red-300') :
              l.category === 'total_costs' ? 'text-stone-100' :
              'text-stone-300';
            const amountPrefix = l.cents > 0 ? '' : l.cents < 0 ? '− ' : '  ';
            return (
              <div key={`${l.category}-${i}`}>
                {isDividerBefore && (
                  <div className="text-stone-700 select-none" aria-hidden="true">
                    ──────────────────────────────────────
                  </div>
                )}
                <div className="grid grid-cols-[14px_1fr_auto] gap-2 items-baseline py-0.5">
                  <span className={`h-2 w-2 rounded-full self-center ${CATEGORY_DOT[l.category]} ${l.cents === 0 ? 'opacity-30' : ''}`} />
                  <div className="min-w-0">
                    <div className={`${isBold ? 'text-stone-100 font-bold' : 'text-stone-200'} truncate`}>
                      {l.label}
                    </div>
                    {l.detail && (
                      <div className="text-[10px] text-stone-500 font-sans truncate">{l.detail}</div>
                    )}
                  </div>
                  <span className={`${amountTone} ${isBold ? 'font-bold' : ''} text-right whitespace-nowrap`}>
                    {amountPrefix}{fmt(Math.abs(l.cents))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------- Worker Requirements card ----------

function WorkerRequirementsCard({
  order,
  worker,
}: {
  order: DrilldownOrder;
  worker: ReturnType<typeof computeWorkerRequirements>;
}) {
  const rateDollars = (BLENDED_LABOR_RATE_PER_HOUR_CENTS / 100).toFixed(2);
  const laborCostCentsTotal = Math.round((worker.totalLaborMinutesAllRoles / 60) * BLENDED_LABOR_RATE_PER_HOUR_CENTS);
  const isWholesale = order.segment === 'wholesale';

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">
          Worker Requirements
        </h3>
        <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-200 text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5">
          ${rateDollars}/hr blended
        </span>
      </div>
      <div className="card-faire-detail p-4 bg-stone-900/30">
        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Packers" value={`${worker.packers}`} sub={worker.packers > 1 ? 'parallel' : 'solo'} />
          <MiniStat label="Wall-clock pack" value={`${worker.perPackerMinutes} min`} sub="each packer" />
          <MiniStat label="Total labor min" value={`${worker.totalLaborMinutesAllRoles}`} sub="all roles" />
        </div>
        <div className="mt-3 pt-3 border-t border-stone-800 flex items-baseline justify-between text-xs">
          <span className="text-stone-400">Labor cost this order</span>
          <span className="font-mono tabular-nums text-stone-100 font-bold">{fmt(laborCostCentsTotal)}</span>
        </div>
        {isWholesale && (
          <p className="mt-3 text-[11px] text-purple-200/80 leading-relaxed">
            Wholesale threshold (≥{PARALLEL_PACK_THRESHOLD_UNITS} units) triggers parallel packing —
            2 workers packing simultaneously to hit turnaround. Total labor cost is
            unchanged; only wall-clock shrinks.
          </p>
        )}
        {!isWholesale && (
          <p className="mt-3 text-[11px] text-stone-500 leading-relaxed">
            Retail order — one packer handles it solo. Parallel pack kicks in at
            ≥{PARALLEL_PACK_THRESHOLD_UNITS} units.
          </p>
        )}
      </div>
    </section>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-stone-800 rounded-md p-2.5 bg-stone-950/60">
      <p className="text-[9px] uppercase tracking-wider text-stone-500">{label}</p>
      <p className="font-heading font-black text-lg text-white mt-0.5 font-mono tabular-nums">{value}</p>
      {sub && <p className="text-[9px] text-stone-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function ViewTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'text-[11px] font-heading font-bold uppercase tracking-[0.15em] px-3 py-1.5 rounded-md transition-colors ' +
        (active
          ? 'bg-[#C9A96E]/15 text-[#E8C889] border border-[#C9A96E]/50'
          : 'text-stone-400 hover:text-stone-200 border border-transparent')
      }
    >
      {children}
    </button>
  );
}

// ---------- Tier 3: Line Item BOM / Labor Drawer ----------

function LineItemDrawer({
  order,
  line,
  onClose,
}: {
  order: DrilldownOrder;
  line: DrilldownLineItem;
  onClose: () => void;
}) {
  const bomTotal = line.bom.reduce((s, l) => s + l.unit_cost_cents * l.quantity, 0);
  const unitCost =
    line.materials_cents + line.labor_cost_cents + line.packaging_cents;
  const unitMargin = line.unit_price_cents - unitCost;
  const unitMarginPct = line.unit_price_cents > 0 ? unitMargin / line.unit_price_cents : 0;

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full md:w-[480px] bg-stone-950 border-l border-stone-800 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-stone-950/95 backdrop-blur px-6 py-4 border-b border-stone-800 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-heading font-bold uppercase tracking-[0.2em] text-[#C9A96E]">
              Line Item Drill
            </p>
            <h2 className="text-lg font-heading font-bold text-white mt-1">{line.product_name}</h2>
            <p className="text-stone-400 text-xs font-body mt-1">
              {line.quantity} × {fmt(line.unit_price_cents)} · {order.buyer_name}
            </p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white text-xl leading-none p-1">
            ×
          </button>
        </header>

        <div className="p-6 space-y-6">
          {/* Unit economics */}
          <section>
            <h3 className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
              Unit Economics
            </h3>
            <div className="card-faire-detail p-4 space-y-1.5 text-sm">
              <Row label="Sell price"      value={fmt(line.unit_price_cents)} />
              <Row label="Materials (clay + glaze + firing)" value={`− ${fmt(line.materials_cents)}`} tone="text-red-300" />
              <Row label={`Labor (${line.labor_minutes} min × $20/hr)`} value={`− ${fmt(line.labor_cost_cents)}`} tone="text-red-300" />
              <Row label="Packaging (BOM)" value={`− ${fmt(line.packaging_cents)}`} tone="text-red-300" />
              <div className="h-px bg-stone-800 my-2" />
              <Row label="You keep (per unit)" value={fmt(unitMargin)} tone={unitMargin > 0 ? 'text-emerald-300' : 'text-red-300'} strong />
              <Row label="Your take (per unit)" value={pct(unitMarginPct)} tone={unitMarginPct > 0.3 ? 'text-emerald-300' : unitMarginPct > 0.15 ? 'text-amber-300' : 'text-red-300'} strong />
            </div>
            <p className="text-[10px] text-stone-600 mt-2">
              Shipping + Shipsurance + Stripe fee allocated at order level, not per-unit.
            </p>
          </section>

          {/* BOM */}
          <section>
            <h3 className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
              Packing BOM · ULINE parts
            </h3>
            <div className="card-faire-detail p-0 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-stone-900/60 text-stone-400 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2">Part</th>
                    <th className="text-right px-3 py-2">Qty</th>
                    <th className="text-right px-3 py-2">Unit</th>
                    <th className="text-right px-3 py-2">Total/pot</th>
                  </tr>
                </thead>
                <tbody>
                  {line.bom.map((b) => (
                    <tr key={b.sku} className="border-t border-stone-800">
                      <td className="px-3 py-2 text-stone-200">{b.label}</td>
                      <td className="px-3 py-2 text-right font-mono text-stone-400">{b.quantity}</td>
                      <td className="px-3 py-2 text-right font-mono text-stone-400">{fmt(b.unit_cost_cents)}</td>
                      <td className="px-3 py-2 text-right font-mono text-stone-200">{fmt(b.unit_cost_cents * b.quantity)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-stone-700 bg-stone-900/40">
                    <td colSpan={3} className="px-3 py-2 text-right uppercase text-[10px] tracking-wider text-stone-400">BOM Total</td>
                    <td className="px-3 py-2 text-right font-mono text-stone-100 font-bold">{fmt(bomTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Labor timesheet */}
          <section>
            <h3 className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
              Labor Timesheet (per unit)
            </h3>
            <div className="card-faire-detail p-0 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-stone-900/60 text-stone-400 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2">Phase</th>
                    <th className="text-right px-3 py-2">Min</th>
                    <th className="text-right px-3 py-2">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { phase: 'Throw + trim',   minutes: 6 },
                    { phase: 'Glaze + fire',   minutes: 4 },
                    { phase: 'Pack + label',   minutes: 5 },
                  ].map((r) => {
                    const cost = Math.round((r.minutes / 60) * 2000);
                    return (
                      <tr key={r.phase} className="border-t border-stone-800">
                        <td className="px-3 py-2 text-stone-200">{r.phase}</td>
                        <td className="px-3 py-2 text-right font-mono text-stone-400">{r.minutes}</td>
                        <td className="px-3 py-2 text-right font-mono text-stone-300">{fmt(cost)}</td>
                      </tr>
                    );
                  })}
                  <tr className="border-t border-stone-700 bg-stone-900/40">
                    <td className="px-3 py-2 text-right uppercase text-[10px] tracking-wider text-stone-400">Total/pot</td>
                    <td className="px-3 py-2 text-right font-mono text-stone-100 font-bold">{line.labor_minutes}</td>
                    <td className="px-3 py-2 text-right font-mono text-stone-100 font-bold">{fmt(line.labor_cost_cents)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Carrier receipt summary */}
          <section>
            <h3 className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
              Carrier Receipt (order-level)
            </h3>
            <div className="card-faire-detail p-4 text-xs space-y-1.5">
              <Row label="Shipping invoice" value={fmt(order.shipping_cost_cents)} />
              <Row label="Insurance (Shipsurance)" value={fmt(order.shipsurance_cents)} />
              <Row label="Per-unit allocation" value={fmt(Math.round((order.shipping_cost_cents + order.shipsurance_cents) / Math.max(1, order.line_items.reduce((s, li) => s + li.quantity, 0))))} />
            </div>
          </section>

          <p className="text-[10px] text-stone-600 text-center pt-2 border-t border-stone-800">
            TODO: pull carrier receipt PDF from financial_documents once Stripe/FedEx sync is live.
          </p>
        </div>
      </aside>
    </div>
  );
}

// ---------- Small UI primitives ----------

function Kpi({ label, value, tone = 'text-white' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card-faire-detail p-3">
      <p className="text-[9px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500">{label}</p>
      <p className={`font-heading font-black text-lg mt-1 ${tone}`}>{value}</p>
    </div>
  );
}

function Row({ label, value, tone = 'text-stone-200', strong = false }: { label: string; value: string; tone?: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={`${strong ? 'text-stone-100 font-bold' : 'text-stone-400'}`}>{label}</span>
      <span className={`font-mono ${tone} ${strong ? 'font-bold' : ''}`}>{value}</span>
    </div>
  );
}

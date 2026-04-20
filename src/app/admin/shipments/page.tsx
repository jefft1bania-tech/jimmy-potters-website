import Link from 'next/link';
import {
  loadShipments,
  monthRange,
  shiftMonth,
  type ShipmentRow,
} from '@/lib/shipments-data';
import ShipmentRowEditor from './ShipmentRowEditor';
import ShipmentCalendar from './ShipmentCalendar';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Shipments — Admin — Jimmy Potters', robots: 'noindex, nofollow' };

type Search = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined): string {
  return typeof v === 'string' ? v : '';
}

const ACTIVE_STATUS_VALUES: ReadonlyArray<ShipmentRow['shipment_status']> = [
  'queued',
  'in_production',
  'packed',
  'shipped',
  'in_transit',
  'delayed',
];

export default async function ShipmentsPage({ searchParams }: { searchParams: Search }) {
  const view = str(searchParams.view) === 'calendar' ? 'calendar' : 'list';
  const statusFilter = str(searchParams.status) || 'active'; // active | all | delivered | queued | ...
  const flagFilter = str(searchParams.flag); // normal | heads_up | critical | urgent | ''
  const bulkFilter = str(searchParams.bulk); // 'true' | ''

  const today = new Date();

  if (view === 'calendar') {
    const monthParam = str(searchParams.month);
    const range = monthRange(monthParam, today);
    const rows = await loadShipments({
      from: range.from,
      to: range.to,
      includeDelivered: true,
      today,
    });
    const currentMonth = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}`;
    const monthYyyyMm = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : currentMonth;
    return (
      <main className="min-h-screen bg-stone-950 text-stone-200">
        <div className="max-w-7xl mx-auto p-6 md:p-10">
          <Header view={view} />
          <ShipmentCalendar
            monthYyyyMm={monthYyyyMm}
            monthLabel={range.label}
            rows={rows}
            prevMonth={shiftMonth(monthYyyyMm, -1)}
            nextMonth={shiftMonth(monthYyyyMm, 1)}
            currentMonth={currentMonth}
          />
        </div>
      </main>
    );
  }

  // List view
  const includeDelivered = statusFilter === 'all' || statusFilter === 'delivered';
  const rows = await loadShipments({ includeDelivered, today });

  let filtered = rows;
  if (statusFilter === 'delivered') {
    filtered = filtered.filter((r) => r.shipment_status === 'delivered');
  } else if (statusFilter === 'active') {
    filtered = filtered.filter((r) => ACTIVE_STATUS_VALUES.includes(r.shipment_status));
  } else if (statusFilter !== 'all') {
    filtered = filtered.filter((r) => r.shipment_status === statusFilter);
  }
  if (flagFilter) filtered = filtered.filter((r) => r.flag === flagFilter);
  if (bulkFilter === 'true') filtered = filtered.filter((r) => r.order_is_bulk);

  const overdueCount = filtered.filter((r) => r.ship_by_window === 'overdue').length;
  const critUrgCount = filtered.filter((r) => r.flag === 'critical' || r.flag === 'urgent').length;

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        <Header view={view} />

        <section className="mb-6 card-faire-detail p-4">
          <div className="flex flex-wrap items-end gap-3">
            <FilterGroup
              label="Status"
              name="status"
              value={statusFilter}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'all', label: 'All' },
                { value: 'queued', label: 'Queued' },
                { value: 'in_production', label: 'In Production' },
                { value: 'packed', label: 'Packed' },
                { value: 'shipped', label: 'Shipped' },
                { value: 'in_transit', label: 'In Transit' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'delayed', label: 'Delayed' },
              ]}
              currentQuery={searchParams}
            />
            <FilterGroup
              label="Flag"
              name="flag"
              value={flagFilter}
              options={[
                { value: '', label: 'Any' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'critical', label: 'Critical' },
                { value: 'heads_up', label: 'Heads up' },
                { value: 'normal', label: 'Normal' },
              ]}
              currentQuery={searchParams}
            />
            <FilterGroup
              label="Bulk"
              name="bulk"
              value={bulkFilter}
              options={[
                { value: '', label: 'Any' },
                { value: 'true', label: 'Bulk only' },
              ]}
              currentQuery={searchParams}
            />
            <div className="ml-auto text-stone-400 text-xs font-body">
              Showing <span className="text-stone-200 font-mono">{filtered.length}</span> shipment
              {filtered.length === 1 ? '' : 's'}
              {overdueCount > 0 && (
                <span className="ml-3 text-red-300 font-heading font-bold uppercase tracking-wider text-[10px]">
                  {overdueCount} overdue
                </span>
              )}
              {critUrgCount > 0 && (
                <span className="ml-3 text-orange-300 font-heading font-bold uppercase tracking-wider text-[10px]">
                  {critUrgCount} crit/urgent
                </span>
              )}
            </div>
          </div>
        </section>

        {filtered.length === 0 ? (
          <div className="card-faire-detail p-6 border border-stone-700">
            <p className="text-stone-400 text-sm">
              No shipments match these filters.{' '}
              <Link href="/admin/shipments" className="text-[#C9A96E] hover:underline">
                Clear filters →
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((row) => (
              <ShipmentRowEditor key={row.order_id} row={row} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Header({ view }: { view: 'list' | 'calendar' }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-heading font-bold uppercase tracking-[0.3em] text-gold-shimmer mb-2">
          Admin · Shipments
        </p>
        <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">
          Fulfillment Board
        </h1>
        <p className="text-stone-400 text-sm font-body mt-2">
          Shipment status · Flag tier · Ship-by window · Carrier and tracking.
        </p>
      </div>
      <nav className="flex flex-wrap items-center gap-2">
        <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-200 underline">
          ← Dashboard
        </Link>
        <div className="flex rounded border border-stone-700 overflow-hidden">
          <Link
            href="/admin/shipments?view=list"
            className={`px-3 py-2 text-xs font-heading font-bold uppercase tracking-wider ${view === 'list' ? 'bg-[#C9A96E]/10 text-[#C9A96E]' : 'text-stone-400 hover:text-stone-200'}`}
            prefetch={false}
          >
            List
          </Link>
          <Link
            href="/admin/shipments?view=calendar"
            className={`px-3 py-2 text-xs font-heading font-bold uppercase tracking-wider border-l border-stone-700 ${view === 'calendar' ? 'bg-[#C9A96E]/10 text-[#C9A96E]' : 'text-stone-400 hover:text-stone-200'}`}
            prefetch={false}
          >
            Calendar
          </Link>
        </div>
      </nav>
    </header>
  );
}

function FilterGroup({
  label,
  name,
  value,
  options,
  currentQuery,
}: {
  label: string;
  name: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  currentQuery: Search;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => {
          const params = new URLSearchParams();
          for (const [k, v] of Object.entries(currentQuery)) {
            if (typeof v === 'string' && v && k !== name) params.set(k, v);
          }
          if (o.value) params.set(name, o.value);
          params.set('view', 'list');
          const href = `/admin/shipments?${params.toString()}`;
          const active = value === o.value;
          return (
            <Link
              key={o.value || '_any'}
              href={href}
              prefetch={false}
              className={`text-[11px] font-heading font-bold uppercase tracking-wider px-2 py-1 rounded border transition-colors ${
                active
                  ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E]'
                  : 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200'
              }`}
            >
              {o.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

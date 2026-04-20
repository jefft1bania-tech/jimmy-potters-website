import Link from 'next/link';
import type { ShipmentRow } from '@/lib/shipments-data';

type Props = {
  monthYyyyMm: string;   // YYYY-MM
  monthLabel: string;
  rows: ShipmentRow[];   // already filtered to the month (server-side)
  prevMonth: string;
  nextMonth: string;
  currentMonth: string;
};

function flagDotClass(flag: ShipmentRow['flag']): string {
  if (flag === 'urgent') return 'bg-red-400';
  if (flag === 'critical') return 'bg-orange-400';
  if (flag === 'heads_up') return 'bg-amber-400';
  return 'bg-stone-500';
}

function statusTextClass(status: ShipmentRow['shipment_status']): string {
  if (status === 'delivered') return 'text-emerald-300 line-through';
  if (status === 'shipped' || status === 'in_transit') return 'text-blue-300';
  if (status === 'packed') return 'text-cyan-300';
  if (status === 'in_production') return 'text-amber-300';
  if (status === 'delayed') return 'text-red-300';
  return 'text-stone-300';
}

export default function ShipmentCalendar({
  monthYyyyMm,
  monthLabel,
  rows,
  prevMonth,
  nextMonth,
  currentMonth,
}: Props) {
  const [yStr, mStr] = monthYyyyMm.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const firstWeekday = first.getUTCDay(); // 0 = Sun

  // Bucket rows by day
  const byDay = new Map<number, ShipmentRow[]>();
  for (const r of rows) {
    if (!r.required_ship_by) continue;
    const [, , dStr] = r.required_ship_by.split('-');
    const day = parseInt(dStr, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(r);
  }

  // Build the 6-row grid
  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  while (cells.length % 7 !== 0) cells.push({ day: null });

  const today = new Date();
  const todayYmd = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-black text-white text-xl">{monthLabel}</h2>
        <nav className="flex items-center gap-2">
          <Link
            href={`/admin/shipments?view=calendar&month=${prevMonth}`}
            className="text-xs text-stone-400 hover:text-stone-200 underline"
            prefetch={false}
          >
            ← {prevMonth}
          </Link>
          {monthYyyyMm !== currentMonth && (
            <Link
              href={`/admin/shipments?view=calendar&month=${currentMonth}`}
              className="text-xs text-[#C9A96E] hover:underline"
              prefetch={false}
            >
              Today
            </Link>
          )}
          <Link
            href={`/admin/shipments?view=calendar&month=${nextMonth}`}
            className="text-xs text-stone-400 hover:text-stone-200 underline"
            prefetch={false}
          >
            {nextMonth} →
          </Link>
        </nav>
      </div>

      <div className="grid grid-cols-7 gap-px bg-stone-800 border border-stone-800 rounded overflow-hidden">
        {WEEKDAYS.map((w) => (
          <div key={w} className="bg-stone-900 text-stone-500 text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-2 text-center">
            {w}
          </div>
        ))}
        {cells.map((c, i) => {
          if (c.day === null) {
            return <div key={i} className="bg-stone-950 min-h-[96px]" />;
          }
          const dayYmd = `${yStr}-${mStr}-${String(c.day).padStart(2, '0')}`;
          const isToday = dayYmd === todayYmd;
          const entries = byDay.get(c.day) ?? [];
          return (
            <div
              key={i}
              className={`bg-stone-950 min-h-[96px] p-2 ${isToday ? 'ring-1 ring-inset ring-[#C9A96E]/60' : ''}`}
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className={`text-xs font-mono ${isToday ? 'text-[#C9A96E] font-bold' : 'text-stone-400'}`}>
                  {c.day}
                </span>
                {entries.length > 0 && (
                  <span className="text-[10px] text-stone-500 font-mono">{entries.length}</span>
                )}
              </div>
              <div className="space-y-1">
                {entries.slice(0, 4).map((e) => (
                  <Link
                    key={e.order_id}
                    href={`/admin/orders/${e.order_id}`}
                    className={`flex items-center gap-1 text-[10px] font-mono truncate hover:underline ${statusTextClass(e.shipment_status)}`}
                    prefetch={false}
                    title={`${e.order_email} · ${e.shipment_status} · ${e.flag}`}
                  >
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${flagDotClass(e.flag)}`} />
                    <span className="truncate">{e.order_id.slice(0, 6)}</span>
                  </Link>
                ))}
                {entries.length > 4 && (
                  <p className="text-[10px] text-stone-500 font-mono">+ {entries.length - 4} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-stone-500 font-body">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Urgent</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Critical</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Heads up</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-stone-500" /> Normal</span>
        <span className="ml-2">Text color = status · <span className="text-amber-300">in production</span> · <span className="text-cyan-300">packed</span> · <span className="text-blue-300">shipped</span> · <span className="text-emerald-300">delivered</span></span>
      </div>
    </section>
  );
}

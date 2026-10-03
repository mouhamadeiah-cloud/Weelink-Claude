// الحسابات: purchases and sales ledger with a dashboard and time filters.
import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Card, inputClass, EmptyState, formatMoney, formatDate } from '../adminUi';
import { AdminTabProps } from './tabProps';

type Range = 'today' | '7d' | '30d' | 'year' | 'all' | 'custom';

const RANGES: { id: Range; label: string }[] = [
  { id: 'today', label: 'اليوم' },
  { id: '7d', label: '7 أيام' },
  { id: '30d', label: '30 يوماً' },
  { id: 'year', label: 'هذه السنة' },
  { id: 'all', label: 'الكل' },
  { id: 'custom', label: 'فترة محددة' },
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const AccountsTab: React.FC<AdminTabProps> = ({ data }) => {
  const [range, setRange] = useState<Range>('30d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const currency = data.settings.currency;

  const [start, end] = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const endOfToday = new Date(today.getTime() + 86400000);
    switch (range) {
      case 'today': return [today, endOfToday];
      case '7d': return [new Date(today.getTime() - 6 * 86400000), endOfToday];
      case '30d': return [new Date(today.getTime() - 29 * 86400000), endOfToday];
      case 'year': return [new Date(now.getFullYear(), 0, 1), endOfToday];
      case 'custom': return [
        from ? new Date(from) : new Date(0),
        to ? new Date(new Date(to).getTime() + 86400000) : endOfToday,
      ];
      default: return [new Date(0), new Date(8640000000000000)];
    }
  }, [range, from, to]);

  const inRange = (iso: string) => {
    const t = new Date(iso).getTime();
    return t >= start.getTime() && t < end.getTime();
  };

  const movements = data.movements.filter((m) => inRange(m.createdAt));
  const sales = movements.filter((m) => m.type === 'sale').reduce((s, m) => s + m.qty * m.unitAmount, 0);
  const purchases = movements.filter((m) => m.type === 'purchase').reduce((s, m) => s + m.qty * m.unitAmount, 0);
  const orders = data.orders.filter((o) => o.status !== 'cancelled' && inRange(o.createdAt));
  const avgOrder = orders.length ? orders.reduce((s, o) => s + o.total, 0) / orders.length : 0;

  // Daily bars for the chart (last 14 days of the selected period at most).
  const days = useMemo(() => {
    const last = new Date(Math.min(end.getTime(), Date.now() + 86400000) - 1);
    const first = new Date(Math.max(start.getTime(), last.getTime() - 13 * 86400000));
    const list: { key: string; label: string; sales: number; purchases: number }[] = [];
    for (let d = startOfDay(first); d <= last; d = new Date(d.getTime() + 86400000)) {
      list.push({ key: dayKey(d), label: `${d.getDate()}/${d.getMonth() + 1}`, sales: 0, purchases: 0 });
    }
    data.movements.forEach((m) => {
      const day = list.find((x) => x.key === dayKey(new Date(m.createdAt)));
      if (!day) return;
      if (m.type === 'sale') day.sales += m.qty * m.unitAmount;
      else day.purchases += m.qty * m.unitAmount;
    });
    return list;
  }, [data.movements, start, end]);
  const maxBar = Math.max(1, ...days.map((d) => Math.max(d.sales, d.purchases)));

  const stats = [
    { label: 'المبيعات', value: formatMoney(sales, currency), color: '#34c759' },
    { label: 'المشتريات', value: formatMoney(purchases, currency), color: '#ff9f0a' },
    { label: 'الصافي', value: formatMoney(sales - purchases, currency), color: sales - purchases >= 0 ? '#0071e3' : '#ff3b30' },
    { label: 'الطلبات', value: String(orders.length), color: '#1d1d1f' },
    { label: 'متوسط الطلب', value: formatMoney(avgOrder, currency), color: '#1d1d1f' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRange(r.id)}
            className={`h-8 px-3 rounded-full text-[11px] font-bold border transition cursor-pointer ${range === r.id ? 'bg-[#1d1d1f] border-[#1d1d1f] text-white' : 'bg-white border-neutral-200 text-neutral-600'}`}
          >
            {r.label}
          </button>
        ))}
        {range === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" className={`${inputClass} h-8 w-36 text-xs`} value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="text-xs text-neutral-400">إلى</span>
            <input type="date" className={`${inputClass} h-8 w-36 text-xs`} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-neutral-200 rounded-2xl p-3">
            <div className="text-[10px] font-bold text-neutral-400">{s.label}</div>
            <div className="text-base sm:text-lg font-black mt-1 truncate" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <Card title="الحركة اليومية" actions={
        <div className="flex items-center gap-3 text-[10px] font-bold text-neutral-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#34c759]" />مبيعات</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#ff9f0a]" />مشتريات</span>
        </div>
      }>
        <div className="flex items-end gap-1.5 h-40 overflow-x-auto" dir="ltr">
          {days.map((d) => (
            <div key={d.key} className="flex-1 min-w-[22px] flex flex-col items-center justify-end h-full gap-1" title={`${d.label}: ${formatMoney(d.sales, currency)} / ${formatMoney(d.purchases, currency)}`}>
              <div className="flex items-end gap-0.5 w-full justify-center flex-1">
                <div className="w-2.5 rounded-t bg-[#34c759]" style={{ height: `${(d.sales / maxBar) * 100}%`, minHeight: d.sales ? 2 : 0 }} />
                <div className="w-2.5 rounded-t bg-[#ff9f0a]" style={{ height: `${(d.purchases / maxBar) * 100}%`, minHeight: d.purchases ? 2 : 0 }} />
              </div>
              <span className="text-[9px] text-neutral-400">{d.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="سجل المشتريات والمبيعات">
        {movements.length === 0 ? (
          <EmptyState text="لا توجد حركة في هذه الفترة." />
        ) : (
          <div className="space-y-1.5">
            {movements.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg border border-neutral-100 bg-[#fbfbfd] text-xs">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${m.type === 'sale' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {m.type === 'sale' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                </span>
                <span className="flex-1 min-w-0 truncate font-bold">{m.type === 'sale' ? 'بيع' : 'شراء'}: {m.name} × {m.qty}</span>
                <span className="text-neutral-400 shrink-0">{formatDate(m.createdAt)}</span>
                <span className={`font-black shrink-0 ${m.type === 'sale' ? 'text-emerald-600' : 'text-amber-600'}`}>{formatMoney(m.qty * m.unitAmount, currency)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

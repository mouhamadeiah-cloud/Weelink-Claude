// الحسابات: the store page's accounts (sales and stock purchases), the side accounts the merchant
// enters by hand (profits and expenses from outside the page), or both together; a dashboard with
// statistics for the chosen period; and an A4 report to print or save as PDF.
import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, Printer, FileDown, Trash2 } from 'lucide-react';
import { ShopEntry, PAYMENT_METHODS, newId } from '../shopTypes';
import { Card, Field, inputClass, inputFitClass, EmptyState, PrimaryButton, formatMoney, formatDate } from '../adminUi';
import { AdminTabProps } from './tabProps';
import { dayKey } from '../orderModel';
import { printReport } from './accountsReport';

type Range = 'today' | '7d' | '30d' | 'year' | 'all' | 'custom';
export type AccountsView = 'page' | 'side' | 'all';

const RANGES: { id: Range; label: string }[] = [
  { id: 'today', label: 'اليوم' },
  { id: '7d', label: '7 أيام' },
  { id: '30d', label: '30 يوماً' },
  { id: 'year', label: 'هذه السنة' },
  { id: 'all', label: 'الكل' },
  { id: 'custom', label: 'من تاريخ إلى تاريخ' },
];

export const VIEWS: { id: AccountsView; label: string }[] = [
  { id: 'page', label: 'حسابات الصفحة' },
  { id: 'side', label: 'الحسابات الجانبية' },
  { id: 'all', label: 'الحسابات الكلية' },
];

export type LedgerKind = 'sale' | 'purchase' | 'income' | 'expense';

export const KIND_LABELS: Record<LedgerKind, string> = { sale: 'بيع', purchase: 'شراء', income: 'ربح يدوي', expense: 'مصروف يدوي' };

export interface LedgerRow {
  id: string;
  kind: LedgerKind;
  label: string;
  date: string; // ISO or YYYY-MM-DD
  amount: number;
  entryId?: string; // set for manual entries, which can be deleted
}

export interface CountRow { label: string; value: number }

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
// A manual entry's date (YYYY-MM-DD) as local midnight, so it falls on the right day.
const entryTime = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1).getTime();
};

const today = () => dayKey(new Date());

const Bars: React.FC<{ rows: CountRow[]; color: string; format?: (n: number) => string; empty: string }> = ({ rows, color, format = String, empty }) => {
  if (!rows.length) return <div className="text-[11px] text-neutral-400 font-bold py-4 text-center">{empty}</div>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="space-y-1">
          <div className="flex justify-between gap-2 text-[11px] font-bold">
            <span className="text-[#1d1d1f] truncate">{r.label}</span>
            <span className="text-neutral-500 shrink-0">{format(r.value)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const countBy = <T,>(items: T[], key: (x: T) => string, weight: (x: T) => number = () => 1): CountRow[] => {
  const map = new Map<string, number>();
  items.forEach((x) => map.set(key(x), (map.get(key(x)) || 0) + weight(x)));
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};

export const AccountsTab: React.FC<AdminTabProps> = ({ data, update }) => {
  const [section, setSection] = useState<'accounts' | 'dashboard'>('accounts');
  const [view, setView] = useState<AccountsView>('page');
  const [range, setRange] = useState<Range>('30d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [entry, setEntry] = useState({ type: 'income' as ShopEntry['type'], amount: '', reason: '', date: today() });
  const [entryError, setEntryError] = useState('');
  const currency = data.settings.currency;
  // A negative amount keeps its minus sign before the digits in right-to-left text.
  const money = (n: number) => (n < 0 ? `\u2066-${formatMoney(-n, '').trim()}\u2069 ${currency}` : formatMoney(n, currency));

  const [start, end] = useMemo(() => {
    const now = new Date();
    const t = startOfDay(now);
    const endOfToday = new Date(t.getTime() + 86400000);
    switch (range) {
      case 'today': return [t, endOfToday];
      case '7d': return [new Date(t.getTime() - 6 * 86400000), endOfToday];
      case '30d': return [new Date(t.getTime() - 29 * 86400000), endOfToday];
      case 'year': return [new Date(now.getFullYear(), 0, 1), endOfToday];
      case 'custom': return [
        from ? new Date(entryTime(from)) : new Date(0),
        to ? new Date(entryTime(to) + 86400000) : endOfToday,
      ];
      default: return [new Date(0), new Date(8640000000000000)];
    }
  }, [range, from, to]);

  const inRange = (time: number) => time >= start.getTime() && time < end.getTime();
  const isoIn = (iso: string) => inRange(new Date(iso).getTime());

  const showPage = view !== 'side';
  const showSide = view !== 'page';

  const movements = showPage ? data.movements.filter((m) => isoIn(m.createdAt)) : [];
  const entries = showSide ? data.entries.filter((e) => inRange(entryTime(e.date))) : [];
  const sales = movements.filter((m) => m.type === 'sale').reduce((s, m) => s + m.qty * m.unitAmount, 0);
  const purchases = movements.filter((m) => m.type === 'purchase').reduce((s, m) => s + m.qty * m.unitAmount, 0);
  const income = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const expenses = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const net = sales + income - purchases - expenses;

  const orders = data.orders.filter((o) => o.status !== 'cancelled' && isoIn(o.createdAt));
  const avgOrder = orders.length ? orders.reduce((s, o) => s + o.total, 0) / orders.length : 0;

  const ledger: LedgerRow[] = [
    ...movements.map((m) => ({ id: m.id, kind: m.type, label: `${m.name} × ${m.qty}`, date: m.createdAt, amount: m.qty * m.unitAmount })),
    ...entries.map((e) => ({ id: e.id, kind: e.type, label: e.reason, date: e.date, amount: e.amount, entryId: e.id })),
  ].sort((a, b) => (b.date.length === 10 ? entryTime(b.date) : new Date(b.date).getTime()) - (a.date.length === 10 ? entryTime(a.date) : new Date(a.date).getTime()));

  // Daily bars (last 14 days of the period at most): money in and money out.
  const days = useMemo(() => {
    const last = new Date(Math.min(end.getTime(), Date.now() + 86400000) - 1);
    const first = new Date(Math.max(start.getTime(), last.getTime() - 13 * 86400000));
    const list: { key: string; label: string; inflow: number; outflow: number }[] = [];
    for (let d = startOfDay(first); d <= last; d = new Date(d.getTime() + 86400000)) {
      list.push({ key: dayKey(d), label: `${d.getDate()}/${d.getMonth() + 1}`, inflow: 0, outflow: 0 });
    }
    const add = (key: string, amount: number, inflow: boolean) => {
      const day = list.find((x) => x.key === key);
      if (day) day[inflow ? 'inflow' : 'outflow'] += amount;
    };
    if (showPage) data.movements.forEach((m) => add(dayKey(new Date(m.createdAt)), m.qty * m.unitAmount, m.type === 'sale'));
    if (showSide) data.entries.forEach((e) => add(e.date, e.amount, e.type === 'income'));
    return list;
  }, [data.movements, data.entries, start, end, showPage, showSide]);
  const maxBar = Math.max(1, ...days.map((d) => Math.max(d.inflow, d.outflow)));

  // Dashboard (store page only).
  const topProducts = countBy(data.movements.filter((m) => m.type === 'sale' && isoIn(m.createdAt)), (m) => m.name, (m) => m.qty).slice(0, 5);
  const visits = Object.entries(data.visits).filter(([k]) => inRange(entryTime(k))).reduce((s, [, n]) => s + n, 0);
  const buyerKey = (o: (typeof orders)[number]) => o.customerId || o.contact?.whatsapp || o.contact?.name || o.id;
  const provinceOf = (o: (typeof orders)[number]) =>
    o.contact?.province || data.customers.find((c) => c.id === o.customerId)?.province || 'غير محددة';
  const buyersByProvince = countBy(
    [...new Map(orders.map((o) => [buyerKey(o), o])).values()],
    provinceOf
  );
  const buyers = buyersByProvince.reduce((s, r) => s + r.value, 0);
  const payments = countBy(orders, (o) => PAYMENT_METHODS.find((m) => m.id === o.paymentMethod)?.label || o.paymentMethod);
  const deliveries = countBy(orders, (o) => (o.deliveryMethod === 'delivery' ? 'توصيل' : 'استلام من المتجر'));

  const stats = [
    ...(showPage ? [
      { label: 'المبيعات', value: money(sales), color: '#34c759' },
      { label: 'المشتريات', value: money(purchases), color: '#ff9f0a' },
    ] : []),
    ...(showSide ? [
      { label: 'أرباح يدوية', value: money(income), color: '#30b0c7' },
      { label: 'مصروفات يدوية', value: money(expenses), color: '#ff3b30' },
    ] : []),
    { label: 'الصافي', value: money(net), color: net >= 0 ? '#0071e3' : '#ff3b30' },
    ...(showPage ? [
      { label: 'الطلبات', value: String(orders.length), color: '#1d1d1f' },
      { label: 'متوسط الطلب', value: money(avgOrder), color: '#1d1d1f' },
    ] : []),
  ];

  const addEntry = () => {
    const amount = parseFloat(entry.amount);
    if (!(amount > 0)) return setEntryError('اكتب مبلغاً أكبر من صفر.');
    if (!entry.reason.trim()) return setEntryError('اكتب السبب.');
    if (!entry.date) return setEntryError('اختر التاريخ.');
    setEntryError('');
    const e: ShopEntry = { id: newId('ent'), type: entry.type, amount, reason: entry.reason.trim(), date: entry.date, createdAt: new Date().toISOString() };
    update((d) => ({ ...d, entries: [e, ...d.entries] }));
    setEntry({ ...entry, amount: '', reason: '' });
  };

  const removeEntry = (id: string) => update((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== id) }));

  const periodLabel = range === 'custom'
    ? `${from || 'البداية'} — ${to || today()}`
    : range === 'all' ? 'كل الفترات' : `${RANGES.find((r) => r.id === range)!.label} (${dayKey(start)} — ${dayKey(new Date(end.getTime() - 1))})`;

  const print = (pdf: boolean) =>
    printReport({
      storeName: data.settings.storeName || 'المتجر',
      viewLabel: section === 'dashboard' ? 'Dashboard والإحصائيات' : VIEWS.find((v) => v.id === view)!.label,
      periodLabel,
      dashboard: section === 'dashboard' ? { visits, buyers, topProducts, buyersByProvince, payments, deliveries } : null,
      stats: section === 'dashboard' ? [] : stats,
      ledger: section === 'dashboard' ? null : ledger,
      money,
      pdf,
    });

  return (
    <div className="space-y-4">
      <div className="flex border-b border-neutral-200" role="tablist" aria-label="أقسام الحسابات">
        {([['accounts', 'الحسابات'], ['dashboard', 'Dashboard والإحصائيات']] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={section === id} onClick={() => setSection(id)}
            className={`h-10 px-4 -mb-px border-b-2 text-xs font-black transition cursor-pointer ${section === id ? 'border-[#0071e3] text-[#0071e3]' : 'border-transparent text-neutral-500 hover:text-[#1d1d1f]'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {section === 'accounts' && <div className="flex p-1 rounded-xl bg-neutral-100" role="tablist" aria-label="نوع الحسابات">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)}
              className={`h-8 px-3 rounded-lg text-[11px] font-bold transition cursor-pointer ${view === v.id ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-neutral-500'}`}>
              {v.label}
            </button>
          ))}
        </div>}
        <div className="flex items-center gap-1.5 mr-auto">
          <button type="button" onClick={() => print(false)} className="h-8 px-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"><Printer size={13} /> طباعة A4</button>
          <button type="button" onClick={() => print(true)} className="h-8 px-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"><FileDown size={13} /> تصدير PDF</button>
        </div>
      </div>

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
            <input type="date" aria-label="من تاريخ" className={`${inputClass} h-8 w-36 text-xs`} value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="text-xs text-neutral-400">إلى</span>
            <input type="date" aria-label="إلى تاريخ" className={`${inputClass} h-8 w-36 text-xs`} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        )}
      </div>

      {section === 'accounts' && (<>
      <div className="flex gap-2 overflow-x-auto">
        {stats.map((s) => (
          <div key={s.label} className="flex-1 min-w-[96px] bg-white border border-neutral-200 rounded-xl px-2.5 py-1.5">
            <div className="text-[10px] font-bold text-neutral-400 truncate">{s.label}</div>
            <div className="text-[13px] font-black truncate" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <Card title="الحركة اليومية" actions={
        <div className="flex items-center gap-3 text-[10px] font-bold text-neutral-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#34c759]" />{view === 'page' ? 'مبيعات' : view === 'side' ? 'أرباح' : 'داخل'}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#ff9f0a]" />{view === 'page' ? 'مشتريات' : view === 'side' ? 'مصروفات' : 'خارج'}</span>
        </div>
      }>
        <div className="flex items-end gap-1.5 h-40 overflow-x-auto" dir="ltr">
          {days.map((d) => (
            <div key={d.key} className="flex-1 min-w-[22px] flex flex-col items-center justify-end h-full gap-1" title={`${d.label}: ${money(d.inflow)} / ${money(d.outflow)}`}>
              <div className="flex items-end gap-0.5 w-full justify-center flex-1">
                <div className="w-2.5 rounded-t bg-[#34c759]" style={{ height: `${(d.inflow / maxBar) * 100}%`, minHeight: d.inflow ? 2 : 0 }} />
                <div className="w-2.5 rounded-t bg-[#ff9f0a]" style={{ height: `${(d.outflow / maxBar) * 100}%`, minHeight: d.outflow ? 2 : 0 }} />
              </div>
              <span className="text-[9px] text-neutral-400">{d.label}</span>
            </div>
          ))}
        </div>
      </Card>

      </>)}

      {section === 'dashboard' && (
        <>
          <div className="flex gap-2 overflow-x-auto">
            {[
              { label: 'عدد الزوار', value: String(visits), color: '#5e5ce6' },
              { label: 'عدد المشترين', value: String(buyers), color: '#34c759' },
              { label: 'الطلبات', value: String(orders.length), color: '#1d1d1f' },
              { label: 'المبيعات', value: money(data.movements.filter((m) => m.type === 'sale' && isoIn(m.createdAt)).reduce((t, m) => t + m.qty * m.unitAmount, 0)), color: '#34c759' },
            ].map((s) => (
              <div key={s.label} className="flex-1 min-w-[96px] bg-white border border-neutral-200 rounded-xl px-2.5 py-1.5">
                <div className="text-[10px] font-bold text-neutral-400 truncate">{s.label}</div>
                <div className="text-[13px] font-black truncate" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4 items-start">
            <Card title="الأكثر مبيعاً">
              <Bars rows={topProducts} color="#34c759" format={(n) => `${n} قطعة`} empty="لا مبيعات في هذه الفترة." />
            </Card>
            <Card title="المشترون حسب المحافظة">
              <Bars rows={buyersByProvince} color="#0071e3" format={(n) => `${n} مشترٍ`} empty="لا مشترين في هذه الفترة." />
            </Card>
            <Card title="طرق الدفع الأكثر استعمالاً">
              <Bars rows={payments} color="#bf5af2" format={(n) => `${n} طلب`} empty="لا طلبات في هذه الفترة." />
            </Card>
            <Card title="طرق التوصيل الأكثر استعمالاً">
              <Bars rows={deliveries} color="#ff9f0a" format={(n) => `${n} طلب`} empty="لا طلبات في هذه الفترة." />
            </Card>
          </div>
        </>
      )}

      {section === 'accounts' && showSide && (
        <Card title="إدخال يدوي (ربح أو مصروف من خارج الصفحة)">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex p-1 rounded-xl bg-neutral-100 h-10" role="radiogroup" aria-label="نوع القيد">
              {(['income', 'expense'] as const).map((t) => (
                <button key={t} type="button" role="radio" aria-checked={entry.type === t} onClick={() => setEntry({ ...entry, type: t })}
                  className={`px-3 rounded-lg text-[11px] font-bold cursor-pointer ${entry.type === t ? (t === 'income' ? 'bg-white text-[#30b0c7] shadow-sm' : 'bg-white text-[#ff3b30] shadow-sm') : 'text-neutral-500'}`}>
                  {t === 'income' ? 'ربح' : 'مصروف'}
                </button>
              ))}
            </div>
            <Field label={`المبلغ (${currency})`}>
              <input className={`${inputFitClass} w-28`} type="number" min="0" value={entry.amount} onChange={(e) => setEntry({ ...entry, amount: e.target.value })} />
            </Field>
            <div className="flex-1 min-w-[160px]">
              <Field label="السبب">
                <input className={inputClass} value={entry.reason} onChange={(e) => setEntry({ ...entry, reason: e.target.value })} placeholder="مثال: إيجار المحل، بيع في المعرض" onKeyDown={(e) => e.key === 'Enter' && addEntry()} />
              </Field>
            </div>
            <Field label="التاريخ">
              <input className={`${inputFitClass} w-40`} type="date" value={entry.date} onChange={(e) => setEntry({ ...entry, date: e.target.value })} />
            </Field>
            <PrimaryButton onClick={addEntry} className="flex items-center gap-1"><Plus size={14} /> إضافة</PrimaryButton>
          </div>
          {entryError && <div className="text-[11px] text-red-600 font-bold">{entryError}</div>}
        </Card>
      )}

      {section === 'accounts' && <Card title="السجل">
        {ledger.length === 0 ? (
          <EmptyState text="لا توجد حركة في هذه الفترة." />
        ) : (
          <div className="space-y-1.5">
            {ledger.map((r) => {
              const inflow = r.kind === 'sale' || r.kind === 'income';
              return (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg border border-neutral-100 bg-[#fbfbfd] text-xs">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${inflow ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {inflow ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                  </span>
                  <span className="flex-1 min-w-0 truncate font-bold">{KIND_LABELS[r.kind]}: {r.label}</span>
                  <span className="text-neutral-400 shrink-0">{r.date.length === 10 ? formatDate(new Date(entryTime(r.date)).toISOString()) : formatDate(r.date)}</span>
                  <span className={`font-black shrink-0 ${inflow ? 'text-emerald-600' : 'text-amber-600'}`}>{money(r.amount)}</span>
                  {r.entryId && (
                    <button type="button" onClick={() => removeEntry(r.entryId!)} aria-label="حذف القيد" className="text-neutral-300 hover:text-red-500 cursor-pointer"><Trash2 size={13} /></button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>}
    </div>
  );
};

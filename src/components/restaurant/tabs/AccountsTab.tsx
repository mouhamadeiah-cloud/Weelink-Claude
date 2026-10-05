// الحسابات: the restaurant's books, kept live in Firestore (restaurants/{uid}/ledger) so the cashier
// can write its sales to the same place later. Income and expenses by hand (category, amount,
// payment method, day, note); every order marked «تم التسليم» adds its sale by itself. A period
// filter (today, this week, this month, a chosen range) with income, expenses and net, totals by
// category, the lines themselves, and a CSV export for a spreadsheet.
import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Download, TrendingUp, TrendingDown, Scale, ReceiptText } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, LedgerEntry, LedgerKind, PAYMENT_METHODS, todayKey } from '../restaurantTypes';
import { addLedgerEntry, deleteLedgerEntry, useLedger } from '../restaurantCloud';
import { Card, Field, inputClass, inputFitClass, PrimaryButton, EmptyState, formatMoney } from '../../shop/adminUi';
import { CloudNotice, RestaurantTabProps, parseAmount } from './shared';

type Period = 'today' | 'week' | 'month' | 'all' | 'range';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'اليوم' },
  { id: 'week', label: 'آخر 7 أيام' },
  { id: 'month', label: 'هذا الشهر' },
  { id: 'all', label: 'الكل' },
  { id: 'range', label: 'من - إلى' },
];

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return todayKey(d);
};

const SOURCE_LABEL: Record<LedgerEntry['source'], string> = { manual: 'يدوي', order: 'طلب', cashier: 'كاشير' };

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

export const AccountsTab: React.FC<RestaurantTabProps> = ({ data, ownerUid }) => {
  const ledger = useLedger(ownerUid);
  const currency = data.settings.currency;
  const [period, setPeriod] = useState<Period>('month');
  const [range, setRange] = useState({ from: daysAgo(30), to: todayKey() });
  const [kind, setKind] = useState<LedgerKind>('expense');
  const [form, setForm] = useState({ category: EXPENSE_CATEGORIES[0], amount: '', method: PAYMENT_METHODS[0], date: todayKey(), note: '' });
  const [error, setError] = useState('');

  const [from, to] =
    period === 'today' ? [todayKey(), todayKey()]
    : period === 'week' ? [daysAgo(6), todayKey()]
    : period === 'month' ? [todayKey().slice(0, 8) + '01', todayKey()]
    : period === 'range' ? [range.from, range.to]
    : ['0000-00-00', '9999-99-99'];

  const rows = useMemo(() => ledger.items.filter((e) => e.date >= from && e.date <= to), [ledger.items, from, to]);
  const income = rows.filter((e) => e.kind === 'income').reduce((s, e) => s + e.amount, 0);
  const expense = rows.filter((e) => e.kind === 'expense').reduce((s, e) => s + e.amount, 0);
  const byCategory = useMemo(() => {
    const m = new Map<string, { kind: LedgerKind; total: number }>();
    rows.forEach((e) => {
      const k = `${e.kind}|${e.category || 'بدون تصنيف'}`;
      m.set(k, { kind: e.kind, total: (m.get(k)?.total || 0) + e.amount });
    });
    return [...m.entries()].map(([k, v]) => ({ name: k.split('|')[1], ...v })).sort((a, b) => b.total - a.total);
  }, [rows]);
  const maxCat = Math.max(1, ...byCategory.map((c) => c.total));

  const pickKind = (k: LedgerKind) => {
    setKind(k);
    setForm((f) => ({ ...f, category: (k === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0] }));
  };
  // The entry shows in the list at once and is saved in the background (also when the connection is
  // slow); a refused save (e.g. the database rules not published yet) is reported here.
  const add = () => {
    const amount = parseAmount(form.amount);
    if (!amount) return setError('اكتب المبلغ.');
    setError('');
    addLedgerEntry(ownerUid, { kind, date: form.date || todayKey(), createdAt: new Date().toISOString(), amount, category: form.category, method: form.method, note: form.note.trim(), source: 'manual', orderId: '' })
      .catch(() => setError('تعذر الحفظ. تحقق من تفعيل قاعدة البيانات اللحظية.'));
    setForm((f) => ({ ...f, amount: '', note: '' }));
  };
  const remove = (e: LedgerEntry) => {
    if (!window.confirm(e.source === 'order' ? 'هذا القيد جاء من طلب مُسلَّم. حذفه؟' : 'حذف هذا القيد؟')) return;
    deleteLedgerEntry(ownerUid, e.id).catch(() => {});
  };
  const exportCsv = () => {
    const head = ['التاريخ', 'النوع', 'التصنيف', 'المبلغ', 'طريقة الدفع', 'المصدر', 'ملاحظة'];
    const lines = rows.map((e) => [e.date, e.kind === 'income' ? 'دخل' : 'مصروف', e.category, e.amount, e.method, SOURCE_LABEL[e.source], e.note].map(csvCell).join(','));
    const blob = new Blob(['﻿' + [head.map(csvCell).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `حسابات-${from}-${to}.csv`.replace('0000-00-00-9999-99-99', 'الكل');
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const tile = (label: string, value: number, Icon: React.ElementType, color: string) => (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs font-bold text-neutral-500"><Icon size={16} style={{ color }} />{label}</div>
      <div className="text-xl font-black mt-1" style={{ color }}>{formatMoney(value, currency)}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      <CloudNotice error={ledger.error} />

      <div className="flex flex-wrap items-center gap-1.5">
        {PERIODS.map((p) => (
          <button key={p.id} type="button" onClick={() => setPeriod(p.id)} className={`h-8 px-3 rounded-full text-xs font-bold border cursor-pointer ${period === p.id ? 'bg-[#1d1d1f] border-[#1d1d1f] text-white' : 'bg-white border-neutral-200 text-neutral-600'}`}>{p.label}</button>
        ))}
        {period === 'range' && (
          <span className="inline-flex items-center gap-1.5">
            <input type="date" className={`${inputFitClass} w-40 h-8`} value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} aria-label="من" />
            <span className="text-xs text-neutral-400">إلى</span>
            <input type="date" className={`${inputFitClass} w-40 h-8`} value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} aria-label="إلى" />
          </span>
        )}
        <button type="button" onClick={exportCsv} disabled={!rows.length} className="mr-auto h-8 px-3 rounded-full text-xs font-bold border border-neutral-200 bg-white inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40"><Download size={14} /> تصدير Excel (CSV)</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tile('الدخل', income, TrendingUp, '#2F9E44')}
        {tile('المصاريف', expense, TrendingDown, '#E03131')}
        {tile('الصافي', income - expense, Scale, income - expense >= 0 ? '#1971C2' : '#E03131')}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500"><ReceiptText size={16} className="text-[#7048E8]" />طلبات مُسلَّمة</div>
          <div className="text-xl font-black mt-1 text-[#7048E8]">{rows.filter((e) => e.source === 'order').length}</div>
        </div>
      </div>

      <Card title="قيد جديد">
        <div className="grid grid-cols-2 gap-2 max-w-xs">
          {(['income', 'expense'] as LedgerKind[]).map((k) => (
            <button key={k} type="button" onClick={() => pickKind(k)} className={`h-10 rounded-xl text-sm font-black border cursor-pointer ${kind === k ? 'text-white border-transparent' : 'bg-white border-neutral-200 text-neutral-600'}`} style={kind === k ? { backgroundColor: k === 'income' ? '#2F9E44' : '#E03131' } : undefined}>
              {k === 'income' ? 'دخل' : 'مصروف'}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="التصنيف">
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {(kind === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label={`المبلغ (${currency})`}><input className={inputClass} dir="ltr" inputMode="decimal" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add()} /></Field>
          <Field label="طريقة الدفع">
            <select className={inputClass} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="اليوم"><input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]"><Field label="ملاحظة (اختيارية)"><input className={inputClass} placeholder="مثلاً: فاتورة الخضار من سوق الهال" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add()} /></Field></div>
          <PrimaryButton onClick={add}><span className="inline-flex items-center gap-1"><Plus size={14} /> أضف القيد</span></PrimaryButton>
        </div>
        {error && <div className="text-xs font-bold text-[#E03131]">{error}</div>}
      </Card>

      {byCategory.length > 0 && (
        <Card title="حسب التصنيف">
          <div className="space-y-2">
            {byCategory.map((c) => (
              <div key={`${c.kind}-${c.name}`} className="flex items-center gap-3 text-xs">
                <span className="w-32 shrink-0 font-bold truncate">{c.name}</span>
                <div className="flex-1 h-3 rounded-full bg-neutral-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(c.total / maxCat) * 100}%`, backgroundColor: c.kind === 'income' ? '#2F9E44' : '#E03131' }} />
                </div>
                <span className="w-32 shrink-0 text-left font-black" style={{ color: c.kind === 'income' ? '#2F9E44' : '#E03131' }}>{formatMoney(c.total, currency)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!ledger.ready ? null : rows.length === 0 ? (
        <EmptyState text="لا قيود في هذه الفترة." />
      ) : (
        <Card title={`القيود (${rows.length})`}>
          <div className="divide-y divide-neutral-100 -my-2">
            {rows.map((e) => (
              <div key={e.id} className="py-2.5 flex items-center gap-3 text-sm">
                <span className="w-1.5 h-9 rounded-full shrink-0" style={{ backgroundColor: e.kind === 'income' ? '#2F9E44' : '#E03131' }} />
                <div className="flex-1 min-w-0">
                  <div className="font-black truncate">{e.category || 'بدون تصنيف'}{e.note ? <span className="font-bold text-neutral-500"> · {e.note}</span> : null}</div>
                  <div className="text-[11px] text-neutral-400 font-bold">{e.date} · {e.method} · {SOURCE_LABEL[e.source]}</div>
                </div>
                <span className="font-black shrink-0" style={{ color: e.kind === 'income' ? '#2F9E44' : '#E03131' }}>{e.kind === 'income' ? '+' : '−'}{formatMoney(e.amount, currency)}</span>
                <button type="button" aria-label="حذف" onClick={() => remove(e)} className="w-8 h-8 rounded-full text-neutral-400 hover:text-[#E03131] hover:bg-red-50 flex items-center justify-center cursor-pointer"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

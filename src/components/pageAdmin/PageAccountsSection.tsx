// «الحسابات» of a Pro page (Eyad, 25 Oct): income and expenses of a period, from the owner's hand entries
// and the booking deposits the owner confirmed. To read, print as A4 / PDF, or export to a spreadsheet.
import React, { useMemo, useState } from 'react';
import { Download, Plus, Printer, Trash2, Wallet } from 'lucide-react';
import { useDepositLines } from '../../services/bookings';
import { PAGE_EXPENSE, PAGE_INCOME, addPageEntry, deletePageEntry, usePageEntries } from '../../services/pageLedger';
import { periodDays } from './BookingReportView';
import type { ProjectKey } from '../../utils/projectKeys';

type Period = Parameters<typeof periodDays>[0];
const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'اليوم' },
  { id: 'week', label: 'آخر 7 أيام' },
  { id: 'month', label: 'هذا الشهر' },
  { id: 'lastMonth', label: 'الشهر الماضي' },
  { id: 'all', label: 'الكل' },
  { id: 'range', label: 'من - إلى' },
];

interface Row {
  id: string;
  kind: 'income' | 'expense';
  date: string;
  amount: number;
  category: string;
  note: string;
  source: 'manual' | 'deposit';
  currency?: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
const num = (n: number) => n.toLocaleString('en-US');

export const PageAccountsSection: React.FC<{ owner: string; project: ProjectKey; pageName: string }> = ({ owner, project, pageName }) => {
  const entries = usePageEntries(owner, project);
  const deposits = useDepositLines(owner, project);
  const [period, setPeriod] = useState<Period>('month');
  const [range, setRange] = useState({ from: today().slice(0, 8) + '01', to: today() });
  const [form, setForm] = useState({ kind: 'income' as 'income' | 'expense', amount: '', category: PAGE_INCOME[0], note: '', date: today() });
  const [error, setError] = useState('');
  const [from, to] = periodDays(period, range);

  const all = useMemo<Row[]>(
    () => [
      ...entries.items.map((e): Row => ({ ...e, source: 'manual' })),
      ...deposits.map((d): Row => ({ id: `dep-${d.id}`, kind: 'income', date: d.date, amount: d.amount, category: 'عربون حجز', note: d.name, source: 'deposit', currency: d.currency })),
    ].sort((a, b) => b.date.localeCompare(a.date)),
    [entries.items, deposits]
  );
  const rows = all.filter((r) => r.date >= from && r.date <= to);
  const income = rows.filter((r) => r.kind === 'income').reduce((s, r) => s + r.amount, 0);
  const expense = rows.filter((r) => r.kind === 'expense').reduce((s, r) => s + r.amount, 0);

  const add = () => {
    const amount = parseFloat(form.amount.replace(/,/g, ''));
    if (!(amount > 0)) return setError('اكتب مبلغاً أكبر من صفر.');
    if (!form.date) return setError('اختر التاريخ.');
    setError('');
    addPageEntry(owner, project, { kind: form.kind, amount, category: form.category, note: form.note.trim(), date: form.date }).catch(() => setError('تعذر الحفظ. تأكد من نشر قواعد Firebase الجديدة.'));
    setForm((f) => ({ ...f, amount: '', note: '' }));
  };

  const label = from === '0000-00-00' ? 'كل الفترات' : `${from} ← ${to}`;
  const exportCsv = () => {
    const head = ['التاريخ', 'النوع', 'التصنيف', 'المبلغ', 'ملاحظة', 'المصدر'];
    const lines = rows.map((r) => [r.date, r.kind === 'income' ? 'دخل' : 'مصروف', r.category, r.amount, r.note, r.source === 'deposit' ? 'عربون حجز' : 'يدوي'].map(csvCell).join(','));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + [head.map(csvCell).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = `حسابات-${from}-${to}.csv`.replace('0000-00-00-9999-99-99', 'الكل');
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const print = () => {
    const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير الحسابات</title><style>
@page{size:A4;margin:14mm}body{font-family:'IBM Plex Sans Arabic',Tahoma,Arial,sans-serif;color:#1d1d1f;font-size:11pt;margin:0}
header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1d1d1f;padding-bottom:8px;margin-bottom:14px}h1{font-size:18pt;margin:0}.muted{color:#6e6e73;font-size:9.5pt;margin:0}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}.stat{border:1px solid #d2d2d7;border-radius:8px;padding:8px}.stat b{display:block;font-size:13pt;margin-top:2px}
table{width:100%;border-collapse:collapse}td,th{padding:4px 6px;border-bottom:1px solid #ececf0;text-align:right;font-size:10pt}th{background:#f5f5f7}.num{text-align:left;white-space:nowrap}tr{break-inside:avoid}</style></head><body>
<header><div><h1>${esc(pageName)}</h1><p class="muted">تقرير الحسابات</p></div><div class="muted">الفترة: ${esc(label)}<br>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SY-u-nu-latn')}</div></header>
<div class="stats"><div class="stat"><span class="muted">الدخل</span><b>${num(income)}</b></div><div class="stat"><span class="muted">المصاريف</span><b>${num(expense)}</b></div><div class="stat"><span class="muted">الصافي</span><b>${num(income - expense)}</b></div></div>
${rows.length ? `<table><thead><tr><th>التاريخ</th><th>النوع</th><th>التصنيف</th><th>ملاحظة</th><th class="num">المبلغ</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.date)}</td><td>${r.kind === 'income' ? 'دخل' : 'مصروف'}</td><td>${esc(r.category)}</td><td>${esc(r.note)}</td><td class="num">${r.kind === 'income' ? '+' : '−'}${num(r.amount)}${r.currency ? ' ' + esc(r.currency) : ''}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">لا حركة في هذه الفترة.</p>'}</body></html>`;
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0;left:-9999px;top:0;';
    document.body.appendChild(frame);
    const doc = frame.contentDocument!;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      frame.contentWindow!.focus();
      frame.contentWindow!.print();
      setTimeout(() => frame.remove(), 1000);
    }, 250);
  };

  const field = 'h-9 px-3 rounded-xl border border-neutral-200 bg-white text-xs outline-none focus:border-neutral-400';
  const btn = 'h-8 px-3 rounded-full text-xs font-bold border border-neutral-200 bg-white inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40';
  const tile = (t: string, v: number, color: string) => (
    <div className="bg-bg rounded-xl p-3">
      <div className="text-xs font-bold text-neutral-500">{t}</div>
      <div className="text-lg font-black mt-0.5" style={{ color }}>{num(v)}</div>
    </div>
  );
  return (
    <section className="rounded-2xl bg-white border border-neutral-200 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-neutral-500"><Wallet size={15} /> الحسابات</div>
      <div className="flex flex-wrap items-center gap-1.5">
        {PERIODS.map((p) => (
          <button key={p.id} type="button" onClick={() => setPeriod(p.id)} className={`h-8 px-3 rounded-full text-xs font-bold border cursor-pointer ${period === p.id ? 'bg-ink border-ink text-white' : 'bg-white border-neutral-200 text-neutral-600'}`}>{p.label}</button>
        ))}
        {period === 'range' && (
          <span className="inline-flex items-center gap-1.5">
            <input type="date" className={`${field} h-8`} value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} aria-label="من" />
            <span className="text-xs text-neutral-400">إلى</span>
            <input type="date" className={`${field} h-8`} value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} aria-label="إلى" />
          </span>
        )}
        <span className="mr-auto flex gap-1.5">
          <button type="button" className={btn} onClick={print}><Printer size={14} /> طباعة / PDF</button>
          <button type="button" className={btn} onClick={exportCsv} disabled={!rows.length}><Download size={14} /> تصدير Excel (CSV)</button>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {tile('الدخل', income, '#2F9E44')}
        {tile('المصاريف', expense, '#E03131')}
        {tile('الصافي', income - expense, income - expense >= 0 ? '#1971C2' : '#E03131')}
      </div>
      <div className="rounded-xl border border-neutral-200 p-3 space-y-2">
        <div className="flex gap-1.5">
          {(['income', 'expense'] as const).map((k) => (
            <button key={k} type="button" onClick={() => setForm((f) => ({ ...f, kind: k, category: (k === 'income' ? PAGE_INCOME : PAGE_EXPENSE)[0] }))} className={`h-8 px-4 rounded-full text-xs font-black border cursor-pointer ${form.kind === k ? 'text-white border-transparent' : 'bg-white border-neutral-200 text-neutral-600'}`} style={form.kind === k ? { backgroundColor: k === 'income' ? '#2F9E44' : '#E03131' } : undefined}>{k === 'income' ? 'دخل' : 'مصروف'}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <select className={field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {(form.kind === 'income' ? PAGE_INCOME : PAGE_EXPENSE).map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className={`${field} w-28`} dir="ltr" inputMode="decimal" placeholder="المبلغ" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <input type="date" className={field} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input className={`${field} flex-1 min-w-[140px]`} placeholder="ملاحظة (اختيارية)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button type="button" onClick={add} className="h-9 px-4 rounded-xl bg-brand text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"><Plus size={14} /> أضف</button>
        </div>
        {error && <div className="text-xs font-bold text-red-600">{error}</div>}
        {entries.error && <div className="text-xs font-bold text-red-600">تعذر قراءة الحسابات. تأكد من نشر قواعد Firebase الجديدة.</div>}
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl bg-bg p-4 text-xs text-neutral-500">لا حركة في هذه الفترة. عرابين الحجز المؤكدة بتنزل هون لحالها.</div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {rows.map((r) => (
            <li key={r.id} className="py-2 flex items-center gap-3 text-xs">
              <span className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: r.kind === 'income' ? '#2F9E44' : '#E03131' }} />
              <div className="flex-1 min-w-0">
                <div className="font-black truncate">{r.category}{r.note ? <span className="font-bold text-neutral-500"> · {r.note}</span> : null}</div>
                <div className="text-neutral-400 font-bold">{r.date}{r.source === 'deposit' ? ' · عربون حجز' : ''}</div>
              </div>
              <span className="font-black shrink-0" style={{ color: r.kind === 'income' ? '#2F9E44' : '#E03131' }}>{r.kind === 'income' ? '+' : '−'}{num(r.amount)}{r.currency ? ` ${r.currency}` : ''}</span>
              {r.source === 'manual' ? (
                <button type="button" aria-label="حذف" onClick={() => window.confirm('حذف هذا القيد؟') && deletePageEntry(owner, r.id).catch(() => {})} className="w-8 h-8 rounded-full text-neutral-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"><Trash2 size={15} /></button>
              ) : (
                <span className="w-8" />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

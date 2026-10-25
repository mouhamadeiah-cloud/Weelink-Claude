// «التقرير» in the bookings tab (Eyad, 25 Oct): the bookings and the deposits of a chosen period, to read
// here, print as an A4 page (the browser's «Save as PDF» gives the file) or export to a spreadsheet.
import React, { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import type { Booking } from '../../services/bookings';
import { buildReport, type BookingReport, type DepositLine } from '../../services/bookingReport';

type Period = 'today' | 'week' | 'month' | 'lastMonth' | 'all' | 'range';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'اليوم' },
  { id: 'week', label: 'آخر 7 أيام' },
  { id: 'month', label: 'هذا الشهر' },
  { id: 'lastMonth', label: 'الشهر الماضي' },
  { id: 'all', label: 'الكل' },
  { id: 'range', label: 'من - إلى' },
];

const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return key(d);
};

export const periodDays = (p: Period, range: { from: string; to: string }): [string, string] => {
  const now = new Date();
  if (p === 'today') return [key(now), key(now)];
  if (p === 'week') return [daysAgo(6), key(now)];
  if (p === 'month') return [`${key(now).slice(0, 8)}01`, key(now)];
  if (p === 'lastMonth') return [key(new Date(now.getFullYear(), now.getMonth() - 1, 1)), key(new Date(now.getFullYear(), now.getMonth(), 0))];
  if (p === 'range') return [range.from, range.to];
  return ['0000-00-00', '9999-99-99'];
};

const STATUS_LABEL = { new: 'جديد', confirmed: 'مؤكد', done: 'منجز', cancelled: 'ملغى' };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
const money = (n: number, c: string) => `${n.toLocaleString('en-US')} ${c}`.trim();
const periodText = (from: string, to: string) => (from === '0000-00-00' ? 'كل الفترات' : `${from} ← ${to}`);

const countRows = (rows: { label: string; value: number }[], unit: string) =>
  rows.length ? `<table>${rows.map((r) => `<tr><td>${esc(r.label)}</td><td class="num">${r.value} ${unit}</td></tr>`).join('')}</table>` : '<p class="muted">لا بيانات.</p>';

const printHtml = (pageName: string, period: string, r: BookingReport) => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير الحجوزات</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'IBM Plex Sans Arabic', Tahoma, Arial, sans-serif; color: #1d1d1f; font-size: 11pt; margin: 0; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #1d1d1f; padding-bottom: 8px; margin-bottom: 14px; }
  h1 { font-size: 18pt; margin: 0; } h2 { font-size: 13pt; margin: 16px 0 8px; } h3 { font-size: 11pt; margin: 0 0 6px; }
  .muted { color: #6e6e73; font-size: 9.5pt; margin: 0; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .stat { border: 1px solid #d2d2d7; border-radius: 8px; padding: 8px; } .stat b { display: block; font-size: 13pt; margin-top: 2px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .box { border: 1px solid #d2d2d7; border-radius: 8px; padding: 8px; break-inside: avoid; }
  table { width: 100%; border-collapse: collapse; } td, th { padding: 4px 6px; border-bottom: 1px solid #ececf0; text-align: right; font-size: 10pt; }
  th { background: #f5f5f7; } .num { text-align: left; white-space: nowrap; } tr { break-inside: avoid; }
</style></head><body>
<header><div><h1>${esc(pageName)}</h1><p class="muted">تقرير الحجوزات</p></div>
<div class="muted">الفترة: ${esc(period)}<br>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SY-u-nu-latn')}</div></header>
<div class="stats">
  <div class="stat"><span class="muted">كل الحجوزات</span><b>${r.total}</b></div>
  <div class="stat"><span class="muted">مؤكدة ومنجزة</span><b>${r.byStatus.confirmed + r.byStatus.done}</b></div>
  <div class="stat"><span class="muted">ملغاة</span><b>${r.byStatus.cancelled} (${Math.round(r.cancelRate * 100)}%)</b></div>
  <div class="stat"><span class="muted">أشخاص / ليالٍ</span><b>${r.guests} / ${r.nights}</b></div>
</div>
<div class="grid" style="margin-top:10px">
  <section class="box"><h3>حسب النوع</h3>${countRows(r.byKind, 'حجز')}</section>
  <section class="box"><h3>الأيام الأكثر حجزاً</h3>${countRows(r.byDay, 'حجز')}</section>
  ${r.byPerson.length ? `<section class="box"><h3>حسب الفريق</h3>${countRows(r.byPerson, 'حجز')}</section>` : ''}
</div>
<h2>العرابين</h2>
${r.deposits.length ? `<div class="stats" style="grid-template-columns:repeat(2,1fr)">${r.deposits.map((d) => `<div class="stat"><span class="muted">مقبوضة (${esc(d.currency)})</span><b>${esc(money(d.received, d.currency))}</b></div><div class="stat"><span class="muted">لحجوزات ملغاة</span><b>${esc(money(d.cancelled, d.currency))}</b></div>`).join('')}</div>
<table style="margin-top:8px"><thead><tr><th>تاريخ التأكيد</th><th>الاسم</th><th>المحفظة</th><th>رقم العملية</th><th class="num">المبلغ</th><th>الحالة</th></tr></thead><tbody>
${r.depositLines.map((d) => `<tr><td>${esc(d.date)}</td><td>${esc(d.name)}</td><td>${esc(d.walletLabel)}</td><td>${esc(d.txn)}</td><td class="num">${esc(money(d.amount, d.currency))}</td><td>${d.state === 'received' ? 'مقبوض' : 'ملغى'}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">لا عرابين في هذه الفترة.</p>'}
</body></html>`;

const printReport = (pageName: string, period: string, r: BookingReport) => {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;left:-9999px;top:0;';
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(printHtml(pageName, period, r));
  doc.close();
  setTimeout(() => {
    frame.contentWindow!.focus();
    frame.contentWindow!.print();
    setTimeout(() => frame.remove(), 1000);
  }, 250);
};

const exportCsv = (bookings: Booking[], r: BookingReport, from: string, to: string) => {
  const head = ['التاريخ', 'الوقت', 'الاسم', 'الهاتف', 'الإيميل', 'الحالة', 'الأشخاص', 'الليالي', 'التفاصيل', 'العربون', 'حالة العربون'];
  const lines = bookings
    .filter((b) => b.date >= from && b.date <= to)
    .map((b) =>
      [
        b.date, b.slot, b.name, b.phone, b.email, STATUS_LABEL[b.status] || b.status, b.partySize || '', b.nights || '',
        [b.sessionName, b.roomName, b.tableName, b.personName].filter(Boolean).join(' · '),
        b.deposit ? `${b.deposit.amount} ${b.deposit.currency}` : '', b.deposit?.state || '',
      ].map(csvCell).join(',')
    );
  const dep = r.depositLines.map((d) => ['عربون مؤكد', d.date, d.name, d.walletLabel, d.txn, `${d.amount} ${d.currency}`, d.state === 'received' ? 'مقبوض' : 'ملغى'].map(csvCell).join(','));
  const text = [head.map(csvCell).join(','), ...lines, '', ...dep].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }));
  a.download = `حجوزات-${from}-${to}.csv`.replace('0000-00-00-9999-99-99', 'الكل');
  a.click();
  URL.revokeObjectURL(a.href);
};

export const BookingReportView: React.FC<{ pageName: string; bookings: Booking[]; deposits: DepositLine[] }> = ({ pageName, bookings, deposits }) => {
  const [period, setPeriod] = useState<Period>('month');
  const [range, setRange] = useState({ from: daysAgo(30), to: key(new Date()) });
  const [from, to] = periodDays(period, range);
  const r = useMemo(() => buildReport(bookings, deposits, from, to), [bookings, deposits, from, to]);
  const tile = (label: string, value: string) => (
    <div className="bg-bg rounded-xl p-3">
      <div className="text-xs font-bold text-neutral-500">{label}</div>
      <div className="text-lg font-black text-ink mt-0.5">{value}</div>
    </div>
  );
  const list = (title: string, rows: { label: string; value: number }[]) => (
    <div className="rounded-xl border border-neutral-200 p-3">
      <div className="text-xs font-black text-ink mb-2">{title}</div>
      {rows.length === 0 ? <div className="text-xs text-neutral-400">لا بيانات.</div> : rows.map((x) => (
        <div key={x.label} className="flex justify-between text-xs font-bold py-0.5"><span>{x.label}</span><span className="text-neutral-500">{x.value}</span></div>
      ))}
    </div>
  );
  const btn = 'h-8 px-3 rounded-full text-xs font-bold border border-neutral-200 bg-white inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40';
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {PERIODS.map((p) => (
          <button key={p.id} type="button" onClick={() => setPeriod(p.id)} className={`h-8 px-3 rounded-full text-xs font-bold border cursor-pointer ${period === p.id ? 'bg-ink border-ink text-white' : 'bg-white border-neutral-200 text-neutral-600'}`}>{p.label}</button>
        ))}
        {period === 'range' && (
          <span className="inline-flex items-center gap-1.5">
            <input type="date" className="h-8 px-2 rounded-lg border border-neutral-200 text-xs" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} aria-label="من" />
            <span className="text-xs text-neutral-400">إلى</span>
            <input type="date" className="h-8 px-2 rounded-lg border border-neutral-200 text-xs" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} aria-label="إلى" />
          </span>
        )}
        <span className="mr-auto flex gap-1.5">
          <button type="button" className={btn} onClick={() => printReport(pageName, periodText(from, to), r)}><Printer size={14} /> طباعة / PDF</button>
          <button type="button" className={btn} onClick={() => exportCsv(bookings, r, from, to)}><Download size={14} /> تصدير Excel (CSV)</button>
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {tile('كل الحجوزات', String(r.total))}
        {tile('مؤكدة ومنجزة', String(r.byStatus.confirmed + r.byStatus.done))}
        {tile('ملغاة', `${r.byStatus.cancelled} (${Math.round(r.cancelRate * 100)}%)`)}
        {tile('أشخاص / ليالٍ', `${r.guests} / ${r.nights}`)}
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {list('حسب النوع', r.byKind)}
        {list('الأيام الأكثر حجزاً', r.byDay)}
        {r.byPerson.length > 0 && list('حسب الفريق', r.byPerson)}
      </div>
      <div className="rounded-xl border border-neutral-200 p-3 space-y-2">
        <div className="text-xs font-black text-ink">العرابين</div>
        {r.deposits.length === 0 ? <div className="text-xs text-neutral-400">لا عرابين في هذه الفترة.</div> : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {r.deposits.flatMap((d) => [tile(`مقبوضة (${d.currency})`, money(d.received, d.currency)), tile('لحجوزات ملغاة', money(d.cancelled, d.currency))])}
            </div>
            <ul className="text-xs font-bold space-y-1">
              {r.depositLines.map((d) => (
                <li key={d.id} className="flex flex-wrap gap-x-3 text-neutral-600"><span>{d.date}</span><span>{d.name}</span><span dir="ltr">{d.walletLabel} · {d.txn}</span><span className="mr-auto">{money(d.amount, d.currency)}{d.state === 'cancelled' ? ' · ملغى' : ''}</span></li>
              ))}
            </ul>
          </>
        )}
      </div>
      <p className="text-xs text-neutral-400">الحجوزات بتنحفظ 3 أشهر، أما العرابين فبتضل بالتقرير والحسابات.</p>
    </div>
  );
};

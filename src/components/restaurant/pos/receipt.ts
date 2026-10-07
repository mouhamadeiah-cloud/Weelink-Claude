// A bill printed from the browser, narrow like a receipt (80 mm). A thermal printer prints it from
// the print window today; printing straight to the printer comes with the cashier app.
import { RestaurantSettings } from '../restaurantTypes';
import { Handover, Tab, itemTotal, tabTitle, tabTotals } from '../staffTypes';
import { formatMoney } from '../../shop/adminUi';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export const printReceipt = (tab: Tab, settings: RestaurantSettings) => {
  const w = window.open('', '_blank', 'width=420,height=700');
  if (!w) return;
  const money = (n: number) => esc(formatMoney(n, settings.currency));
  const t = tabTotals(tab);
  const rows = tab.items
    .filter((i) => !i.voided)
    .map((i) => {
      const extra = [...i.extras.map((e) => `+ ${e.name}`), ...i.removed.map((r) => `بدون ${r}`)].join('، ');
      return `<tr><td>${i.qty} × ${esc(i.name)}${extra ? `<div class="s">${esc(extra)}</div>` : ''}</td><td class="n">${money(itemTotal(i))}</td></tr>`;
    })
    .join('');
  const pays = tab.payments.map((p) => `<tr><td>${esc(p.method)} · ${esc(p.workerName)}</td><td class="n">${money(p.amount)}</td></tr>`).join('');
  w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${esc(tabTitle(tab))}</title>
<style>body{font-family:system-ui,sans-serif;width:72mm;margin:0 auto;padding:4mm;font-size:13px;color:#000}h1{font-size:17px;text-align:center;margin:0 0 2px}
.c{text-align:center;font-size:11px}table{width:100%;border-collapse:collapse;margin-top:6px}td{padding:3px 0;vertical-align:top}.n{text-align:left;white-space:nowrap}
.s{font-size:10px;color:#444}.t td{border-top:1px dashed #000;font-weight:700}hr{border:0;border-top:1px dashed #000}</style></head><body>
<h1>${esc(settings.name || 'المطعم')}</h1>
<div class="c">${esc([settings.address, settings.phone].filter(Boolean).join(' · '))}</div>
<hr><div class="c">${esc(tabTitle(tab))}${tab.hall ? ` · ${esc(tab.hall)}` : ''} · ${esc(tab.ownerName)}<br>${new Date().toLocaleString('ar-SY-u-nu-latn')}</div>
<table>${rows}
<tr class="t"><td>المجموع</td><td class="n">${money(t.subtotal)}</td></tr>
${t.discount ? `<tr><td>خصم${tab.discountPct ? ` ${tab.discountPct}%` : ''}</td><td class="n">- ${money(t.discount)}</td></tr>` : ''}
<tr class="t"><td>الإجمالي</td><td class="n">${money(t.total)}</td></tr>${pays}
${t.due > 0 ? `<tr class="t"><td>المتبقي</td><td class="n">${money(t.due)}</td></tr>` : ''}</table>
<hr><div class="c">شكرًا لزيارتكم</div><script>window.onload=()=>{window.print()}</script></body></html>`);
  w.document.close();
};

// The slip of a waiter's handover to the main cashier: both sides' signature is the four-digit code.
export const printHandover = (h: Handover, settings: RestaurantSettings) => {
  const w = window.open('', '_blank', 'width=420,height=600');
  if (!w) return;
  const money = (n: number) => esc(formatMoney(n, settings.currency));
  const at = (iso: string) => (iso ? esc(new Date(iso).toLocaleString('ar-SY-u-nu-latn')) : '');
  const diff = Math.round((h.receivedCash - h.expectedCash) * 100) / 100;
  w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>تسليم ${esc(h.workerName)}</title>
<style>body{font-family:system-ui,sans-serif;width:72mm;margin:0 auto;padding:4mm;font-size:13px;color:#000}h1{font-size:17px;text-align:center;margin:0 0 2px}
.c{text-align:center;font-size:11px}table{width:100%;border-collapse:collapse;margin-top:6px}td{padding:3px 0}.n{text-align:left;white-space:nowrap}hr{border:0;border-top:1px dashed #000}.t td{border-top:1px dashed #000;font-weight:700}</style></head><body>
<h1>${esc(settings.name || 'المطعم')}</h1><div class="c">إيصال تسليم صندوق نادل</div><hr>
<table><tr><td>النادل</td><td class="n">${esc(h.workerName)}</td></tr><tr><td>الجهاز</td><td class="n">${esc(h.deviceName)}</td></tr>
<tr><td>بدأت الجلسة</td><td class="n">${at(h.shiftOpenedAt)}</td></tr><tr><td>التسليم</td><td class="n">${at(h.confirmedAt)}</td></tr>
<tr class="t"><td>الواجب تحصيله</td><td class="n">${money(h.expectedCash)}</td></tr>
<tr><td>المستلَم</td><td class="n">${money(h.receivedCash)}</td></tr>
<tr><td>البخشيش</td><td class="n">${money(h.receivedTips)}</td></tr>
${diff ? `<tr class="t"><td>${diff > 0 ? 'زيادة' : 'نقص'}</td><td class="n">${money(Math.abs(diff))}</td></tr>` : ''}</table>
<hr><div class="c">استلم: ${esc(h.receivedBy)} · رمز التأكيد ${esc(h.code)}</div>
<script>window.onload=()=>{window.print()}</script></body></html>`);
  w.document.close();
};

// The report of a main cashier session (80 mm): totals, methods, dishes, workers and the drawer.
export const printCashReport = (r: import('../cashDay').CashReport, settings: RestaurantSettings, extra: { title: string; opening: number; expected: number; counted: number | null; by: string }) => {
  const w = window.open('', '_blank', 'width=420,height=800');
  if (!w) return;
  const money = (n: number) => esc(formatMoney(n, settings.currency));
  const at = (iso: string) => esc(new Date(iso).toLocaleString('ar-SY-u-nu-latn'));
  const row = (a: string, b: string, cls = '') => `<tr class="${cls}"><td>${a}</td><td class="n">${b}</td></tr>`;
  const diff = extra.counted === null ? 0 : Math.round((extra.counted - extra.expected) * 100) / 100;
  w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${esc(extra.title)}</title>
<style>body{font-family:system-ui,sans-serif;width:72mm;margin:0 auto;padding:4mm;font-size:12px;color:#000}h1{font-size:16px;text-align:center;margin:0 0 2px}h2{font-size:12px;margin:8px 0 2px;border-bottom:1px solid #000}
.c{text-align:center;font-size:11px}table{width:100%;border-collapse:collapse}td{padding:2px 0;vertical-align:top}.n{text-align:left;white-space:nowrap}hr{border:0;border-top:1px dashed #000}.t td{border-top:1px dashed #000;font-weight:700}</style></head><body>
<h1>${esc(settings.name || 'المطعم')}</h1><div class="c">${esc(extra.title)}</div><div class="c">من ${at(r.from)}<br>إلى ${at(r.to)}</div><hr>
<table>${row('المبيعات المحصّلة', money(r.sales), 't')}${row('البخشيش', money(r.tips))}${row('فواتير مغلقة', String(r.bills))}${r.discounts ? row('خصومات', money(r.discounts)) : ''}</table>
<h2>طرق الدفع</h2><table>${r.methods.map((m) => row(esc(m.method), money(m.amount))).join('')}</table>
<h2>الدرج</h2><table>${row('مبلغ الافتتاح', money(extra.opening))}${row('نقد الكاشير', money(r.cashDirect))}${row('نقد من النُّدُل', money(r.cashFromWaiters))}${row('الواجب وجوده', money(extra.expected), 't')}
${extra.counted === null ? '' : row('الموجود فعلًا', money(extra.counted)) + row(diff === 0 ? 'مطابق' : diff > 0 ? 'زيادة' : 'نقص', diff === 0 ? '' : money(Math.abs(diff)), 't')}</table>
<h2>الأطباق المباعة</h2><table>${r.dishes.map((d) => row(`${d.qty} × ${esc(d.name)}`, money(d.amount))).join('')}</table>
<h2>العمال</h2><table>${r.workers.map((x) => row(esc(x.name), money(x.collected)) + `<tr><td colspan="2" style="font-size:10px;color:#444">نقدي ${money(x.cash)} · بخشيش ${money(x.tips)}${x.handover === 'confirmed' ? ` · سلّم ${money(x.handedCash)}` : x.handover === 'skipped' ? ' · بدون تسليم' : ''}</td></tr>`).join('')}</table>
<hr><div class="c">${esc(extra.by)} · ${at(new Date().toISOString())}</div>
<script>window.onload=()=>{window.print()}</script></body></html>`);
  w.document.close();
};

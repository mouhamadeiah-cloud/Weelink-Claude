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

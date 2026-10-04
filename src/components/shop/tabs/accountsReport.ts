// The accounts report as an A4 page: printed through the browser's print dialog, where "Save as
// PDF" gives the PDF file (the dialog's file name comes from the report title).
import type { CountRow, LedgerRow } from './AccountsTab';
import { KIND_LABELS } from './AccountsTab';

interface ReportInput {
  storeName: string;
  viewLabel: string;
  periodLabel: string;
  stats: { label: string; value: string }[];
  dashboard: {
    visits: number;
    buyers: number;
    topProducts: CountRow[];
    buyersByProvince: CountRow[];
    payments: CountRow[];
    deliveries: CountRow[];
  } | null;
  ledger: LedgerRow[] | null; // null: a dashboard report
  money: (n: number) => string;
  pdf: boolean;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const countTable = (title: string, rows: CountRow[], unit: string) => `
  <section class="box">
    <h3>${esc(title)}</h3>
    ${rows.length
      ? `<table>${rows.map((r) => `<tr><td>${esc(r.label)}</td><td class="num">${r.value} ${unit}</td></tr>`).join('')}</table>`
      : '<p class="muted">لا بيانات في هذه الفترة.</p>'}
  </section>`;

const buildHtml = (r: ReportInput, title: string) => {
  const d = r.dashboard;
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'IBM Plex Sans Arabic', Tahoma, Arial, sans-serif; color: #1d1d1f; font-size: 11pt; margin: 0; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #1d1d1f; padding-bottom: 8px; margin-bottom: 14px; }
  h1 { font-size: 18pt; margin: 0; }
  h2 { font-size: 13pt; margin: 18px 0 8px; }
  h3 { font-size: 11pt; margin: 0 0 6px; }
  .muted { color: #6e6e73; font-size: 9.5pt; margin: 0; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .stat { border: 1px solid #d2d2d7; border-radius: 8px; padding: 8px; }
  .stat b { display: block; font-size: 13pt; margin-top: 2px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .box { border: 1px solid #d2d2d7; border-radius: 8px; padding: 8px; break-inside: avoid; }
  table { width: 100%; border-collapse: collapse; }
  td, th { padding: 4px 6px; border-bottom: 1px solid #ececf0; text-align: right; font-size: 10pt; }
  th { background: #f5f5f7; }
  .num { text-align: left; white-space: nowrap; }
  tr { break-inside: avoid; }
</style></head><body>
<header>
  <div><h1>${esc(r.storeName)}</h1><p class="muted">تقرير الحسابات · ${esc(r.viewLabel)}</p></div>
  <div class="muted">الفترة: ${esc(r.periodLabel)}<br>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SY-u-nu-latn')}</div>
</header>
${r.stats.length ? `<div class="stats">${r.stats.map((s) => `<div class="stat"><span class="muted">${esc(s.label)}</span><b>${esc(s.value)}</b></div>`).join('')}</div>` : ''}
${d ? `
<div class="stats" style="grid-template-columns: 1fr 1fr; margin-bottom: 10px;">
  <div class="stat"><span class="muted">عدد الزوار</span><b>${d.visits}</b></div>
  <div class="stat"><span class="muted">عدد المشترين</span><b>${d.buyers}</b></div>
</div>
<div class="grid">
  ${countTable('الأكثر مبيعاً', d.topProducts, 'قطعة')}
  ${countTable('المشترون حسب المحافظة', d.buyersByProvince, 'مشترٍ')}
  ${countTable('طرق الدفع الأكثر استعمالاً', d.payments, 'طلب')}
  ${countTable('طرق التوصيل الأكثر استعمالاً', d.deliveries, 'طلب')}
</div>` : ''}
${!r.ledger ? '' : `<h2>السجل</h2>
${r.ledger.length ? `<table><thead><tr><th>التاريخ</th><th>النوع</th><th>البيان</th><th class="num">المبلغ</th></tr></thead><tbody>
${r.ledger.map((l) => {
  const date = l.date.length === 10 ? l.date : l.date.slice(0, 10);
  return `<tr><td>${date}</td><td>${esc(l.kindLabel || KIND_LABELS[l.kind])}</td><td>${esc(l.label)}</td><td class="num">${esc(r.money(l.amount))}</td></tr>`;
}).join('')}
</tbody></table>` : '<p class="muted">لا توجد حركة في هذه الفترة.</p>'}`}
</body></html>`;
};

export const printReport = (r: ReportInput) => {
  const title = `تقرير-الحسابات-${r.storeName}-${new Date().toISOString().slice(0, 10)}`.replace(/\s+/g, '-');
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;left:-9999px;top:0;';
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(buildHtml(r, title));
  doc.close();
  // The parent's title names the saved PDF in some browsers, so set it for the dialog.
  const oldTitle = document.title;
  if (r.pdf) document.title = title;
  const done = () => {
    document.title = oldTitle;
    frame.remove();
  };
  setTimeout(() => {
    frame.contentWindow!.focus();
    frame.contentWindow!.print();
    setTimeout(done, 1000);
  }, 250);
};

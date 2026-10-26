// The rental's printable papers (Eyad, 25 Oct, step 3 of «تأجير»): the contract and the handover record,
// A4, filled from a booking in «المواعيد» and signed by hand at the handover. The contract carries the
// terms the visitor accepted when booking (kept with the booking), or the page's terms now. The handover
// record has the checks and the lines to fill by hand when the unit goes out and when it comes back.
// Same page and style as the showroom's documents (cars/carDocs.ts).
import type { Booking } from '../../services/bookings';
import { DEFAULT_TERMS } from '../../services/rentalBooking';
import { DOC_STYLE, dateAr, esc } from '../cars/carDocs';

export type RentalPaper = 'contract' | 'handover';

export const PAPER_LABEL: Record<RentalPaper, string> = { contract: 'عقد إيجار', handover: 'محضر تسليم واستلام' };
// The same papers for a hotel stay (booking.hotel): the contract at arrival and the room's handover record.
export const HOTEL_PAPER_LABEL: Record<RentalPaper, string> = { contract: 'عقد إقامة', handover: 'محضر استلام وتسليم الغرفة' };
export const paperLabel = (kind: RentalPaper, b: Pick<Booking, 'hotel'>) => (b.hotel ? HOTEL_PAPER_LABEL : PAPER_LABEL)[kind];

const HOTEL_CHECKS = ['نظافة الغرفة وجاهزيتها', 'الأثاث والمفروشات', 'الحمام والتجهيزات', 'التكييف والتلفاز والإضاءة', 'المفاتيح والبطاقات', 'محتويات الغرفة (ثلاجة، أدوات، مناشف)'];

const CHECKS = ['الحالة العامة والهيكل الخارجي', 'الداخل والنظافة', 'الإطارات', 'المفاتيح والملحقات', 'الأوراق والمستندات', 'التجهيزات المرافقة المتفق عليها'];

const blank = (label: string, wide = false) => `<div class="cell${wide ? ' wide' : ''}"><span>${esc(label)}</span><b>&nbsp;</b></div>`;
const cell = (label: string, value: string, ltr = false) => `<div class="cell"><span>${esc(label)}</span><b${ltr ? ' dir="ltr"' : ''}>${esc(value) || '&nbsp;'}</b></div>`;
const sigs = (a: string, b: string) => `<div class="sigs"><div class="sig"><span>${esc(a)}</span><div class="pad"></div><b>&nbsp;</b></div><div class="sig"><span>${esc(b)}</span><div class="pad"></div><b>&nbsp;</b></div></div>`;

// `terms`: the page's terms text now, used when the booking has none saved (the visitor did not have to accept).
export const buildRentalPaper = (b: Booking, kind: RentalPaper, terms = ''): string => {
  const hotel = b.hotel === true;
  const L = paperLabel(kind, b);
  const [lessor, lessee] = hotel ? ['الفندق', 'النزيل'] : ['المؤجّر', 'المستأجر'];
  const unit = b.roomName || '';
  const period = b.checkOut ? `من ${dateAr(b.date)} إلى ${dateAr(b.checkOut)} (${b.nights || ''} ${hotel ? (b.nights === 1 ? 'ليلة' : 'ليالٍ') : b.nights === 1 ? 'يوم' : 'أيام'})` : `${dateAr(b.date)} · ${b.slot}`;
  const price = b.price?.total ? `${b.price.total} ${b.price.currency || ''}`.trim() : '';
  const deposit = b.deposit ? `${b.deposit.amount} ${b.deposit.currency || ''}`.trim() : '';
  const header = `<header>
  <div><h1>${esc(b.pageName || lessor)}</h1></div>
  <div class="meta">رقم الحجز: <b dir="ltr">${esc(b.id.slice(0, 8))}</b><br>تاريخ الحجز: <b>${esc(dateAr(b.createdAt.slice(0, 10)))}</b></div>
</header>
<h2>${L}</h2>`;
  const parties = `<section class="box"><h3>الطرفان</h3><div class="grid">
    ${cell(lessor, b.pageName)}${blank('يمثله')}
    ${cell(lessee, b.name)}${cell('الهاتف', b.phone, true)}
    ${cell('الإيميل', b.email, true)}${blank(hotel ? 'رقم الهوية أو جواز السفر' : 'الرقم الوطني', false)}
    ${b.address ? cell('العنوان', b.address) : blank('العنوان')}
  </div></section>`;
  const item = `<section class="box"><h3>${b.items && b.items.length > 1 ? (hotel ? 'الغرف' : 'الوحدات المؤجّرة') : hotel ? 'الغرفة' : 'الوحدة المؤجّرة'}</h3><div class="grid">
    ${b.items && b.items.length > 1
      ? b.items.map((it, i) => cell(`${hotel ? 'الغرفة' : 'الوحدة'} ${i + 1}`, `${it.roomName}${it.driver ? ' (مع سائق)' : ''} · ${it.total} ${b.price?.currency || ''}`.trim())).join('')
      : cell(hotel ? 'الغرفة' : 'الوحدة', unit)}${cell('المدة', period)}
    ${hotel && b.partySize ? cell('عدد الضيوف', String(b.partySize)) : ''}
    ${b.driver && !(b.items && b.items.length > 1) ? cell('السائق', 'مع سائق') : ''}
    ${b.desc ? `<div class="cell wide"><span>ملاحظات ${lessee}</span><b>${esc(b.desc)}</b></div>` : ''}
  </div></section>`;
  const money = `<section class="box"><h3>${hotel ? 'السعر والعربون' : 'الأجرة والعربون'}</h3>
    ${b.price?.lines?.length ? `<div class="grid">${b.price.lines.map((l) => cell(l.label, `${l.amount} ${b.price!.currency || ''}`.trim())).join('')}</div>` : ''}
    ${b.price?.lines?.some((l) => l.note) ? `<ul class="notes">${b.price.lines.filter((l) => l.note).map((l) => `<li><b>${esc(l.label)}:</b> ${esc(l.note || '')}</li>`).join('')}</ul>` : ''}
    <div class="grid">${cell('المجموع', price)}${cell('العربون (الضمانة)', deposit ? `${deposit}${b.deposit?.state === 'paid' ? ' · مستلم' : ''}` : 'لا يوجد')}</div>
  </section>`;
  if (kind === 'contract') {
    const text = (b.terms || terms || (hotel ? DEFAULT_TERMS.hotel : DEFAULT_TERMS.other)).split('\n').map((t) => t.trim()).filter(Boolean);
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(`${L} ${b.name}`)}</title><style>${DOC_STYLE}</style></head><body>
${header}
<p class="intro">${hotel ? `إنه في يوم ${esc(dateAr(b.date))} تم الاتفاق بين الطرفين المذكورين أدناه، وهما بكامل الأهلية المعتبرة شرعًا وقانونًا، على إقامة النزيل في الغرفة الموصوفة، وفق ما يلي:` : `إنه في يوم ${esc(dateAr(b.date))} تم الاتفاق بين الطرفين المذكورين أدناه، وهما بكامل الأهلية المعتبرة شرعًا وقانونًا، على استئجار المستأجر للوحدة الموصوفة، وفق ما يلي:`}</p>
${parties}${item}${money}
<section class="box"><h3>الشروط</h3><ol>${text.map((t) => `<li>${esc(t.replace(/^\d+[.)\-]\s*/, ''))}</li>`).join('')}</ol>
${b.termsAt ? `<p style="margin:6px 0 0;font-size:9pt;color:#6e6e73">وافق ${lessee} على هذه الشروط إلكترونياً عند الحجز بتاريخ ${esc(new Date(b.termsAt).toISOString().slice(0, 16).replace('T', ' '))} (UTC).</p>` : ''}</section>
${sigs(lessor, lessee)}
</body></html>`;
  }
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(`${L} ${b.name}`)}</title><style>${DOC_STYLE}</style></head><body>
${header}
<p class="intro">${hotel ? 'يُثبت هذا المحضر حالة الغرفة عند استلام النزيل لها وعند مغادرته.' : 'يُثبت هذا المحضر حالة الوحدة المؤجَّرة عند تسليمها للمستأجر وعند إعادتها.'}</p>
${parties}${item}
<section class="box"><h3>الفحص</h3><div class="checks">${(hotel ? HOTEL_CHECKS : CHECKS).map((c) => `<div class="check"><i></i>${esc(c)}</div>`).join('')}</div></section>
<section class="box"><h3>عند التسليم</h3><div class="grid">${blank('التاريخ والوقت')}${blank('العداد (كم)')}${blank('الوقود أو الشحن')}${blank('عدد المفاتيح')}${blank('ملاحظات على الحالة', true)}</div></section>
${sigs(`المسلِّم (عن ${lessor})`, `المستلم (${lessee})`)}
<section class="box" style="margin-top:14px"><h3>عند الإعادة</h3><div class="grid">${blank('التاريخ والوقت')}${blank('العداد (كم)')}${blank('الوقود أو الشحن')}${blank('أضرار أو نواقص', true)}${blank('مبلغ إضافي أو خصم من العربون', true)}</div></section>
${sigs(`المستلم (عن ${lessor})`, `المسلِّم (${lessee})`)}
</body></html>`;
};

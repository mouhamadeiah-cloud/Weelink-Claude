// The showroom's three documents (sale contract, test drive form, handover record): which fields each
// has, how they fill from the car, the customer and the sale, and the A4 page they print as. The same
// page is shown as the live preview in the document window, so what is signed is what prints.
import { Car, CarAdminData, CarCustomer, CarDocType, CarDocument, CAR_DOC_TYPES } from './carTypes';
import { carTitle } from './carModel';
import { salePaid, saleRemaining, todayKey } from './carMoney';
import { formatMoney } from '../shop/adminUi';

export interface DocField {
  key: string;
  label: string;
  ltr?: boolean;
  wide?: boolean; // full row
  type?: 'date' | 'time';
}
export interface DocGroup { title: string; fields: DocField[] }

const carFields = (withMileage = true): DocField[] => [
  { key: 'carBrand', label: 'الماركة' },
  { key: 'carModel', label: 'الموديل والفئة' },
  { key: 'carYear', label: 'سنة الصنع', ltr: true },
  { key: 'carColor', label: 'اللون' },
  { key: 'carVin', label: 'رقم الهيكل (الشاصي)', ltr: true },
  { key: 'carEngine', label: 'رقم المحرك', ltr: true },
  { key: 'carPlate', label: 'رقم اللوحة' },
  ...(withMileage ? [{ key: 'carMileage', label: 'عداد المسافة (كم)', ltr: true }] : []),
];

export const DOC_GROUPS: Record<CarDocType, DocGroup[]> = {
  contract: [
    {
      title: 'الطرف الأول (البائع)',
      fields: [
        { key: 'sellerName', label: 'اسم المعرض' },
        { key: 'sellerOwner', label: 'يمثله السيد' },
        { key: 'sellerRecord', label: 'السجل التجاري', ltr: true },
        { key: 'sellerPhone', label: 'الهاتف', ltr: true },
        { key: 'sellerAddress', label: 'العنوان', wide: true },
      ],
    },
    {
      title: 'الطرف الثاني (المشتري)',
      fields: [
        { key: 'buyerName', label: 'الاسم الكامل' },
        { key: 'buyerFather', label: 'اسم الأب' },
        { key: 'buyerNationalId', label: 'الرقم الوطني', ltr: true },
        { key: 'buyerPhone', label: 'الهاتف', ltr: true },
        { key: 'buyerAddress', label: 'العنوان', wide: true },
      ],
    },
    { title: 'السيارة المبيعة', fields: [...carFields(), { key: 'carFuel', label: 'الوقود' }] },
    {
      title: 'الثمن وطريقة الدفع',
      fields: [
        { key: 'price', label: 'الثمن الكامل', ltr: true },
        { key: 'paid', label: 'المدفوع عند التوقيع', ltr: true },
        { key: 'remaining', label: 'المبلغ المتبقي', ltr: true },
        { key: 'remainingDue', label: 'موعد سداد المتبقي', type: 'date' },
        { key: 'paymentNote', label: 'ملاحظات الدفع', wide: true },
      ],
    },
    {
      title: 'الشهود',
      fields: [
        { key: 'witness1', label: 'الشاهد الأول' },
        { key: 'witness2', label: 'الشاهد الثاني' },
      ],
    },
  ],
  testDrive: [
    {
      title: 'السائق',
      fields: [
        { key: 'driverName', label: 'الاسم الكامل' },
        { key: 'driverNationalId', label: 'الرقم الوطني', ltr: true },
        { key: 'driverPhone', label: 'الهاتف', ltr: true },
        { key: 'licenseNumber', label: 'رقم شهادة السوق', ltr: true },
        { key: 'licenseCategory', label: 'فئة الشهادة' },
        { key: 'driverAddress', label: 'العنوان' },
      ],
    },
    { title: 'السيارة', fields: carFields(false) },
    {
      title: 'التجربة',
      fields: [
        { key: 'startTime', label: 'وقت الخروج', type: 'time' },
        { key: 'returnTime', label: 'وقت العودة المتوقع', type: 'time' },
        { key: 'mileageStart', label: 'العداد عند الخروج', ltr: true },
        { key: 'mileageEnd', label: 'العداد عند العودة', ltr: true },
        { key: 'fuelStart', label: 'مستوى الوقود' },
        { key: 'employee', label: 'الموظف المرافق' },
        { key: 'route', label: 'المسار المسموح', wide: true },
        { key: 'heldItem', label: 'الضمان المحجوز لدى المعرض', wide: true },
      ],
    },
  ],
  handover: [
    {
      title: 'الطرفان',
      fields: [
        { key: 'deliveredBy', label: 'المسلِّم (عن المعرض)' },
        { key: 'receiverName', label: 'المستلم' },
        { key: 'receiverNationalId', label: 'الرقم الوطني للمستلم', ltr: true },
        { key: 'receiverPhone', label: 'هاتف المستلم', ltr: true },
      ],
    },
    { title: 'السيارة', fields: carFields() },
    {
      title: 'التسليم',
      fields: [
        { key: 'handoverTime', label: 'وقت التسليم', type: 'time' },
        { key: 'fuelLevel', label: 'مستوى الوقود' },
        { key: 'keysCount', label: 'عدد المفاتيح', ltr: true },
        { key: 'notes', label: 'ملاحظات على حالة السيارة', wide: true },
      ],
    },
  ],
};

export const HANDOVER_CHECKS: { key: string; label: string }[] = [
  { key: 'registration', label: 'رخصة السير (دفتر السيارة)' },
  { key: 'contract', label: 'نسخة عقد البيع' },
  { key: 'keys', label: 'المفاتيح' },
  { key: 'spareTire', label: 'الإطار الاحتياطي' },
  { key: 'jack', label: 'الرافعة والعدة' },
  { key: 'triangle', label: 'مثلث التحذير' },
  { key: 'extinguisher', label: 'طفاية الحريق' },
  { key: 'serviceBook', label: 'دفتر الصيانة' },
  { key: 'body', label: 'الهيكل الخارجي كما هو موصوف' },
  { key: 'interior', label: 'المقصورة نظيفة وسليمة' },
  { key: 'lights', label: 'الأضواء والإشارات تعمل' },
  { key: 'ac', label: 'المكيف يعمل' },
];

export const SIGNER_LABELS: Record<CarDocType, [string, string]> = {
  contract: ['الطرف الأول (البائع)', 'الطرف الثاني (المشتري)'],
  testDrive: ['عن المعرض', 'السائق'],
  handover: ['المسلِّم', 'المستلم'],
};

export const docTypeLabel = (t: CarDocType) => CAR_DOC_TYPES.find((x) => x.id === t)!.label;

export const termsFor = (type: CarDocType, data: CarAdminData) =>
  type === 'contract' ? data.settings.contractTerms : type === 'testDrive' ? data.settings.testDriveTerms : data.settings.handoverTerms;

export const nextDocNumber = (docs: CarDocument[], type: CarDocType) => {
  const prefix = CAR_DOC_TYPES.find((x) => x.id === type)!.prefix;
  const max = docs.filter((d) => d.type === type).reduce((m, d) => Math.max(m, parseInt(d.number.split('-')[1] || '0', 10) || 0), 0);
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
};

const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const carValues = (car: Car | undefined): Record<string, string> =>
  car
    ? {
        carBrand: car.brand,
        carModel: [car.model, car.trim].filter(Boolean).map((x) => `\u2068${x}\u2069`).join(' '),
        carYear: car.year ? String(car.year) : '',
        carColor: car.color,
        carVin: car.vin,
        carEngine: car.engineNumber,
        carPlate: car.plateNumber,
        carMileage: car.mileage ? String(car.mileage) : '',
        carFuel: car.fuel,
      }
    : {};

const personAddress = (c?: CarCustomer) => (c ? [c.city, c.address].filter(Boolean).join('، ') : '');

// A new document's fields, filled from what the showroom already knows.
export const prefillDoc = (type: CarDocType, data: CarAdminData, car: Car | undefined, customer: CarCustomer | undefined): Record<string, string> => {
  const s = data.settings;
  const base = carValues(car);
  if (type === 'contract') {
    const price = car?.sale?.price || car?.price || 0;
    const paid = car ? (car.sale ? salePaid(car) : car.reservation?.deposit || 0) : 0;
    const rest = car ? (car.sale ? saleRemaining(car) : Math.max(0, price - paid)) : 0;
    const cur = car?.currency || s.currency;
    return {
      ...base,
      sellerName: s.showroomName,
      sellerOwner: s.ownerName,
      sellerRecord: s.commercialRecord,
      sellerPhone: s.phone,
      sellerAddress: s.address,
      buyerName: customer?.name || '',
      buyerFather: '',
      buyerNationalId: customer?.idNumber || '',
      buyerPhone: customer?.phone || '',
      buyerAddress: personAddress(customer),
      price: price ? formatMoney(price, cur) : '',
      paid: paid ? formatMoney(paid, cur) : '',
      remaining: formatMoney(rest, cur),
      remainingDue: '',
      paymentNote: '',
      witness1: '',
      witness2: '',
    };
  }
  if (type === 'testDrive') {
    return {
      ...base,
      driverName: customer?.name || '',
      driverNationalId: customer?.idNumber || '',
      driverPhone: customer?.phone || '',
      driverAddress: personAddress(customer),
      licenseNumber: '',
      licenseCategory: '',
      startTime: nowTime(),
      returnTime: '',
      mileageStart: car?.mileage ? String(car.mileage) : '',
      mileageEnd: '',
      fuelStart: '',
      employee: s.ownerName,
      route: '',
      heldItem: 'البطاقة الشخصية',
    };
  }
  return {
    ...base,
    deliveredBy: s.ownerName || s.showroomName,
    receiverName: customer?.name || '',
    receiverNationalId: customer?.idNumber || '',
    receiverPhone: customer?.phone || '',
    handoverTime: nowTime(),
    fuelLevel: '',
    keysCount: '2',
    notes: '',
  };
};

export const newDocument = (type: CarDocType, data: CarAdminData, carId: string, customerId: string): CarDocument => {
  const car = data.cars.find((c) => c.id === carId);
  const customer = data.customers.find((c) => c.id === customerId);
  const now = new Date().toISOString();
  return {
    id: '',
    type,
    number: nextDocNumber(data.documents, type),
    date: todayKey(),
    carId,
    customerId,
    fields: prefillDoc(type, data, car, customer),
    checks: type === 'handover' ? Object.fromEntries(HANDOVER_CHECKS.map((c) => [c.key, ['registration', 'contract', 'keys'].includes(c.key)])) : {},
    terms: termsFor(type, data),
    showroomSignature: '',
    customerSignature: '',
    createdAt: now,
    updatedAt: now,
  };
};

export const isSigned = (d: CarDocument) => !!(d.showroomSignature && d.customerSignature);

// ---- the A4 page ----

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const dateAr = (d: string) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('ar-SY-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' }) : '');

export const buildDocHtml = (doc: CarDocument, data: CarAdminData) => {
  const s = data.settings;
  const groups = DOC_GROUPS[doc.type];
  const val = (f: DocField) => {
    const v = doc.fields[f.key] || '';
    if (f.type === 'date') return dateAr(v);
    return v;
  };
  const groupHtml = (g: DocGroup) => `
    <section class="box"><h3>${esc(g.title)}</h3>
      <div class="grid">${g.fields.map((f) => `<div class="cell${f.wide ? ' wide' : ''}"><span>${esc(f.label)}</span><b${f.ltr ? ' dir="ltr"' : ''}>${esc(val(f)) || '&nbsp;'}</b></div>`).join('')}</div>
    </section>`;
  const terms = doc.terms.split('\n').map((t) => t.trim()).filter(Boolean);
  const checks = doc.type === 'handover'
    ? `<section class="box"><h3>الملحقات والحالة عند التسليم</h3><div class="checks">${HANDOVER_CHECKS.map((c) => `<div class="check"><i>${doc.checks[c.key] ? '✓' : ''}</i>${esc(c.label)}</div>`).join('')}</div></section>`
    : '';
  const [l1, l2] = SIGNER_LABELS[doc.type];
  const name1 = doc.type === 'contract' ? doc.fields.sellerOwner || doc.fields.sellerName : doc.type === 'testDrive' ? doc.fields.employee : doc.fields.deliveredBy;
  const name2 = doc.type === 'contract' ? doc.fields.buyerName : doc.type === 'testDrive' ? doc.fields.driverName : doc.fields.receiverName;
  const sig = (label: string, name: string, img: string) => `
    <div class="sig"><span>${esc(label)}</span><div class="pad">${img ? `<img src="${esc(img)}" alt="">` : ''}</div><b>${esc(name || '')}</b></div>`;
  const witnesses = doc.type === 'contract' && (doc.fields.witness1 || doc.fields.witness2)
    ? `<div class="sigs small">${[doc.fields.witness1, doc.fields.witness2].filter(Boolean).map((w, i) => `<div class="sig"><span>الشاهد ${i ? 'الثاني' : 'الأول'}</span><div class="pad"></div><b>${esc(w)}</b></div>`).join('')}</div>`
    : '';
  const intro = doc.type === 'contract'
    ? `<p class="intro">إنه في يوم ${esc(dateAr(doc.date))} تم الاتفاق بين الطرفين المذكورين أدناه، وهما بكامل الأهلية المعتبرة شرعًا وقانونًا، على ما يلي:</p>`
    : doc.type === 'testDrive'
      ? `<p class="intro">يسمح المعرض للسائق المذكور أدناه بتجربة قيادة السيارة الموصوفة بتاريخ ${esc(dateAr(doc.date))}، وفق الشروط التالية:</p>`
      : `<p class="intro">بتاريخ ${esc(dateAr(doc.date))} سُلِّمت السيارة الموصوفة أدناه من المعرض إلى المستلم بالحالة والملحقات المذكورة.</p>`;
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(`${docTypeLabel(doc.type)} ${doc.number}`)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  @media screen { body { padding: 18px; } }
  * { box-sizing: border-box; }
  body { font-family: 'IBM Plex Sans Arabic', 'Cairo', Tahoma, Arial, sans-serif; color: #1d1d1f; font-size: 10.5pt; margin: 0; padding: 0; background: #fff; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1d1d1f; padding-bottom: 8px; margin-bottom: 10px; gap: 12px; }
  header h1 { font-size: 15pt; margin: 0; }
  header p { margin: 2px 0 0; color: #6e6e73; font-size: 9pt; }
  .meta { text-align: left; font-size: 9pt; color: #6e6e73; white-space: nowrap; }
  .meta b { color: #1d1d1f; }
  h2 { text-align: center; font-size: 16pt; margin: 6px 0 4px; }
  .intro { margin: 4px 0 10px; line-height: 1.7; }
  .box { border: 1px solid #d2d2d7; border-radius: 8px; padding: 8px 10px; margin-bottom: 8px; break-inside: avoid; }
  .box h3 { font-size: 10.5pt; margin: 0 0 6px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; }
  .cell { display: flex; gap: 6px; border-bottom: 1px dotted #c7c7cc; padding: 2px 0; min-height: 20px; }
  .cell.wide { grid-column: 1 / -1; }
  .cell span { color: #6e6e73; white-space: nowrap; }
  .cell b { font-weight: 600; flex: 1; }
  ol { margin: 0; padding-inline-start: 20px; line-height: 1.7; }
  .checks { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 14px; }
  .check { display: flex; align-items: center; gap: 6px; }
  .check i { width: 14px; height: 14px; border: 1px solid #1d1d1f; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; font-style: normal; font-size: 10pt; }
  .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 14px; break-inside: avoid; }
  .sigs.small { margin-top: 26px; }
  .sig { text-align: center; }
  .sig span { font-weight: 700; }
  .pad { height: 70px; border-bottom: 1px solid #1d1d1f; display: flex; align-items: flex-end; justify-content: center; }
  .sigs.small .pad { height: 44px; }
  .pad img { max-height: 68px; max-width: 100%; }
  .sig b { display: block; font-weight: 600; margin-top: 4px; min-height: 16px; }
</style></head><body>
<header>
  <div><h1>${esc(s.showroomName || 'المعرض')}</h1><p>${esc([s.address, s.phone, s.commercialRecord ? `سجل تجاري ${s.commercialRecord}` : ''].filter(Boolean).join(' · '))}</p></div>
  <div class="meta">رقم: <b dir="ltr">${esc(doc.number)}</b><br>التاريخ: <b>${esc(dateAr(doc.date))}</b></div>
</header>
<h2>${esc(docTypeLabel(doc.type))}</h2>
${intro}
${groups.map(groupHtml).join('')}
${checks}
${terms.length ? `<section class="box"><h3>${doc.type === 'contract' ? 'البنود' : 'الشروط'}</h3><ol>${terms.map((t) => `<li>${esc(t)}</li>`).join('')}</ol></section>` : ''}
<div class="sigs">${sig(l1, name1, doc.showroomSignature)}${sig(l2, name2, doc.customerSignature)}</div>
${witnesses}
</body></html>`;
};

// Prints the page through the browser's print dialog, where "Save as PDF" gives the PDF file.
export const printDoc = (doc: CarDocument, data: CarAdminData, pdf: boolean) => {
  const title = `${docTypeLabel(doc.type)}-${doc.number}-${carTitle(data.cars.find((c) => c.id === doc.carId) || { brand: '', model: '' })}`.replace(/\s+/g, '-');
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;left:-9999px;top:0;';
  document.body.appendChild(frame);
  const d = frame.contentDocument!;
  d.open();
  d.write(buildDocHtml(doc, data));
  d.close();
  const oldTitle = document.title;
  if (pdf) document.title = title;
  const done = () => {
    document.title = oldTitle;
    frame.remove();
  };
  // Wait for the signature images before printing.
  const imgs = Array.from(d.images);
  Promise.all(imgs.map((i) => (i.complete ? Promise.resolve() : new Promise((r) => { i.onload = r; i.onerror = r; })))).then(() => {
    setTimeout(() => {
      frame.contentWindow!.focus();
      frame.contentWindow!.print();
      setTimeout(done, 1000);
    }, 150);
  });
};

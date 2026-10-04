// Small helpers shared by the showroom page and the admin window.
import { Car, CAR_ACCIDENTS, CAR_PAINT, CAR_STATUSES } from './carTypes';
import { formatMoney } from '../shop/adminUi';

export const carTitle = (c: Pick<Car, 'brand' | 'model'>) => [c.brand, c.model].filter(Boolean).join(' ') || 'سيارة بدون اسم';

// Each part is a bidi isolate (FSI … PDI) so a Latin trim such as "45 TFSI" keeps its order in RTL.
const isolate = (s: string) => `\u2068${s}\u2069`;

export const carSubtitle = (c: Car) => [c.trim, c.year ? String(c.year) : ''].filter(Boolean).map(isolate).join(' · ');

export const formatKm = (km: number) => `${Math.round(km).toLocaleString('en-US')} كم`;

export const carPrice = (c: Car) => (c.price > 0 ? formatMoney(c.price, c.currency) : '');

// What the visitor sees as the price.
export const carPriceLabel = (c: Car) => (c.showPrice && c.price > 0 ? carPrice(c) : 'السعر عند التواصل');

export const statusMeta = (s: Car['status']) => CAR_STATUSES.find((x) => x.id === s) || CAR_STATUSES[0];
export const paintLabel = (p: Car['paint']) => CAR_PAINT.find((x) => x.id === p)?.label || '';
export const accidentsLabel = (a: Car['accidents']) => CAR_ACCIDENTS.find((x) => x.id === a)?.label || '';

// The short facts under a card's title.
export const carFacts = (c: Car) =>
  [c.year ? String(c.year) : '', c.condition === 'new' ? 'جديدة' : c.mileage ? formatKm(c.mileage) : '', c.transmission, c.fuel].filter(Boolean);

// The full specification table of a car, rows without a value left out.
export const carSpecRows = (c: Car): { label: string; value: string }[] =>
  [
    { label: 'الماركة', value: c.brand },
    { label: 'الموديل', value: c.model },
    { label: 'الفئة', value: c.trim },
    { label: 'سنة الصنع', value: c.year ? String(c.year) : '' },
    { label: 'الحالة', value: c.condition === 'new' ? 'جديدة' : 'مستعملة' },
    { label: 'الممشى', value: c.condition === 'new' && !c.mileage ? '' : formatKm(c.mileage) },
    { label: 'نوع الهيكل', value: c.bodyType },
    { label: 'الوقود', value: c.fuel },
    { label: 'ناقل الحركة', value: c.transmission },
    { label: 'نظام الدفع', value: c.drive },
    { label: 'سعة المحرك', value: c.engineCc ? `${c.engineCc.toLocaleString('en-US')} سي سي` : '' },
    { label: 'القوة', value: c.horsepower ? `${c.horsepower} حصان` : '' },
    { label: 'اللون الخارجي', value: c.color },
    { label: 'اللون الداخلي', value: c.interiorColor },
    { label: 'الأبواب', value: c.doors ? String(c.doors) : '' },
    { label: 'المقاعد', value: c.seats ? String(c.seats) : '' },
    { label: 'المواصفات', value: c.specs },
    { label: 'عدد المالكين', value: c.owners ? String(c.owners) : '' },
    { label: 'الدهان', value: c.condition === 'used' ? paintLabel(c.paint) : '' },
    { label: 'الحوادث', value: c.condition === 'used' ? accidentsLabel(c.accidents) : '' },
  ].filter((r) => r.value);

// Profit expected from a car's price over what was paid for it.
export const expectedMargin = (c: Car) => (c.price > 0 && c.purchasePrice > 0 ? c.price - c.purchasePrice : 0);

export const whatsappHref = (number: string, text: string) =>
  `https://wa.me/${number.replace(/[^\d]/g, '')}?text=${encodeURIComponent(text)}`;

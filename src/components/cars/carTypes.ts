// Data of the car showroom project (Weelink / Cars): the showroom's cars and its settings. Stored
// in designs/{uid}.carAdmin, next to the project's own pages and elements (carPages/carElements).
// The showroom page lists the published cars live; everything else is managed in the floating
// admin window. normalizeCarAdmin fills defaults so older saved data still loads.
import type { GalleryLayout } from '../../types';
import { newId } from '../shop/shopTypes';

export type CarStatus = 'available' | 'reserved' | 'preparing' | 'sold';
export type CarCondition = 'new' | 'used';
export type CarPaint = 'original' | 'partial' | 'full';
export type CarAccidents = 'none' | 'minor' | 'major';

export interface Car {
  id: string;
  stockNumber: string; // the showroom's own number for the car, e.g. "A-0007"
  brand: string;
  model: string;
  trim: string; // الفئة، e.g. "M Sport"
  year: number;
  condition: CarCondition;
  bodyType: string;
  fuel: string;
  transmission: string;
  drive: string;
  engineCc: number;
  horsepower: number;
  mileage: number; // km
  color: string;
  interiorColor: string;
  doors: number;
  seats: number;
  specs: string; // المواصفات: خليجي، أمريكي، أوروبي...
  owners: number;
  paint: CarPaint;
  accidents: CarAccidents;
  conditionNotes: string;
  features: string[];
  description: string;
  images: string[]; // the first is the main photo, at most MAX_CAR_IMAGES
  galleryLayout: GalleryLayout;
  // Price for visitors.
  price: number;
  oldPrice: number; // 0 = none; shown crossed out
  currency: string;
  showPrice: boolean; // false = «السعر عند التواصل»
  negotiable: boolean;
  badge: string; // a short label on the card: «وصل حديثًا»، «عرض خاص»...
  // Purchase (never shown to visitors).
  purchasePrice: number;
  purchaseDate: string; // yyyy-mm-dd
  purchaseFrom: string;
  vin: string;
  internalNotes: string;
  status: CarStatus;
  published: boolean; // shown in the showroom
  featured: boolean; // shown in the «سيارات مميزة» slides
  createdAt: string;
  updatedAt: string;
}

export interface CarSettings {
  showroomName: string;
  currency: string;
  whatsappNumber: string; // international, digits only: 963...
  phone: string;
  address: string;
  workingHours: string;
  showSold: boolean; // sold cars stay in the showroom with a «مباعة» ribbon
}

export interface CarAdminData {
  cars: Car[];
  settings: CarSettings;
}

export const MAX_CAR_IMAGES = 15;

export const CAR_CURRENCIES = ['$', 'ل.س', '€'];

export const CAR_STATUSES: { id: CarStatus; label: string; color: string }[] = [
  { id: 'available', label: 'متاحة', color: '#34a853' },
  { id: 'reserved', label: 'محجوزة', color: '#f29900' },
  { id: 'preparing', label: 'قيد التجهيز', color: '#5e5ce6' },
  { id: 'sold', label: 'مباعة', color: '#8e8e93' },
];

export const CAR_PAINT: { id: CarPaint; label: string }[] = [
  { id: 'original', label: 'دهان أصلي بالكامل' },
  { id: 'partial', label: 'رش جزئي' },
  { id: 'full', label: 'رش كامل' },
];

export const CAR_ACCIDENTS: { id: CarAccidents; label: string }[] = [
  { id: 'none', label: 'بدون حوادث' },
  { id: 'minor', label: 'حوادث بسيطة' },
  { id: 'major', label: 'حادث سابق' },
];

// Brands sold in Syria, with their common models (the fields also accept any other text).
export const CAR_BRANDS: { brand: string; models: string[] }[] = [
  { brand: 'كيا', models: ['ريو', 'سيراتو', 'بيكانتو', 'سبورتاج', 'سورينتو', 'أوبتيما', 'K5', 'سول', 'كارنفال'] },
  { brand: 'هيونداي', models: ['أكسنت', 'إلنترا', 'سوناتا', 'توسان', 'سانتافي', 'i10', 'i20', 'كريتا', 'أزيرا'] },
  { brand: 'تويوتا', models: ['كورولا', 'كامري', 'يارس', 'راف 4', 'لاندكروزر', 'برادو', 'هايلكس', 'أفالون', 'فورتشنر'] },
  { brand: 'نيسان', models: ['صني', 'سنترا', 'ألتيما', 'إكس تريل', 'باترول', 'قشقاي', 'تيدا'] },
  { brand: 'ميتسوبيشي', models: ['لانسر', 'باجيرو', 'أوتلاندر', 'ASX', 'L200'] },
  { brand: 'مازدا', models: ['مازدا 3', 'مازدا 6', 'CX-5', 'CX-9'] },
  { brand: 'هوندا', models: ['سيفيك', 'أكورد', 'CR-V', 'جاز'] },
  { brand: 'شيفروليه', models: ['أفيو', 'كروز', 'ماليبو', 'كابتيفا', 'تاهو', 'سبارك'] },
  { brand: 'سوزوكي', models: ['سويفت', 'ألتو', 'فيتارا', 'جيمني', 'سياز'] },
  { brand: 'بيجو', models: ['206', '207', '301', '308', '508', '3008', '5008'] },
  { brand: 'رينو', models: ['لوغان', 'سيمبول', 'كليو', 'ميغان', 'داستر'] },
  { brand: 'فولكس فاغن', models: ['غولف', 'باسات', 'جيتا', 'تيغوان', 'بولو', 'طوارق'] },
  { brand: 'سكودا', models: ['أوكتافيا', 'فابيا', 'سوبيرب', 'كودياك'] },
  { brand: 'مرسيدس', models: ['C', 'E', 'S', 'A', 'GLA', 'GLC', 'GLE', 'G'] },
  { brand: 'بي إم دبليو', models: ['الفئة 3', 'الفئة 5', 'الفئة 7', 'X1', 'X3', 'X5', 'X6'] },
  { brand: 'أودي', models: ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7'] },
  { brand: 'لكزس', models: ['ES', 'IS', 'LS', 'RX', 'NX', 'LX'] },
  { brand: 'جيلي', models: ['إمغراند', 'كولراي', 'توغيلا', 'أوكافانغو'] },
  { brand: 'شيري', models: ['تيغو 4', 'تيغو 7', 'تيغو 8', 'أريزو 5', 'أريزو 6'] },
  { brand: 'إم جي', models: ['MG 5', 'MG 6', 'ZS', 'HS', 'RX5'] },
  { brand: 'سابا', models: ['سابا', 'شاهين'] },
  { brand: 'فورد', models: ['فوكس', 'فيوجن', 'إكسبلورر', 'إيدج', 'رينجر', 'موستانج'] },
  { brand: 'جيب', models: ['شيروكي', 'غراند شيروكي', 'رانغلر', 'كومباس'] },
  { brand: 'لاند روفر', models: ['رينج روفر', 'رينج روفر سبورت', 'إيفوك', 'ديفندر', 'ديسكفري'] },
  { brand: 'بورش', models: ['كايين', 'ماكان', 'باناميرا', '911'] },
];

export const CAR_BODY_TYPES = ['سيدان', 'هاتشباك', 'SUV', 'كروس أوفر', 'كوبيه', 'مكشوفة', 'ستيشن', 'فان', 'بيك أب', 'باص صغير'];
export const CAR_FUELS = ['بنزين', 'ديزل', 'هايبرد', 'كهرباء', 'غاز'];
export const CAR_TRANSMISSIONS = ['أوتوماتيك', 'عادي (يدوي)', 'نصف أوتوماتيك'];
export const CAR_DRIVES = ['دفع أمامي', 'دفع خلفي', 'دفع رباعي'];
export const CAR_SPECS = ['خليجي', 'أمريكي', 'أوروبي', 'كوري', 'ياباني', 'صيني', 'وكالة سورية'];
export const CAR_COLORS = ['أبيض', 'أسود', 'فضي', 'رمادي', 'أحمر', 'أزرق', 'كحلي', 'بني', 'بيج', 'أخضر', 'ذهبي', 'برتقالي'];
export const CAR_INTERIOR_COLORS = ['أسود', 'بيج', 'رمادي', 'بني', 'أحمر', 'أبيض'];
export const CAR_BADGES = ['وصل حديثًا', 'عرض خاص', 'فحص كامل', 'أول مالك', 'بحالة الوكالة'];

// Features, grouped as in the editor.
export const CAR_FEATURE_GROUPS: { title: string; items: string[] }[] = [
  { title: 'الراحة', items: ['مكيف', 'مكيف أوتوماتيك', 'فتحة سقف', 'سقف بانورامي', 'مقاعد جلد', 'مقاعد كهربائية', 'تدفئة مقاعد', 'تبريد مقاعد', 'دخول بدون مفتاح', 'تشغيل بزر', 'نوافذ كهربائية', 'مرايا كهربائية', 'مثبت سرعة'] },
  { title: 'التقنية', items: ['شاشة', 'بلوتوث', 'Apple CarPlay', 'Android Auto', 'نظام ملاحة', 'كاميرا خلفية', 'كاميرا 360', 'حساسات ركن', 'نظام صوت مميز', 'شاحن لاسلكي'] },
  { title: 'الأمان', items: ['وسائد هوائية', 'ABS', 'نظام ثبات', 'مراقبة النقطة العمياء', 'تحذير مغادرة المسار', 'فرامل طوارئ', 'مثبت سرعة متكيف', 'إنذار'] },
  { title: 'الخارج', items: ['جنط ألمنيوم', 'أضواء LED', 'أضواء زينون', 'ضباب أمامي', 'سبويلر', 'خطاف سحب', 'زجاج معتم'] },
];

export const DEFAULT_CAR_SETTINGS: CarSettings = {
  showroomName: '',
  currency: '$',
  whatsappNumber: '',
  phone: '',
  address: '',
  workingHours: '',
  showSold: false,
};

export const emptyCar = (currency: string): Car => ({
  id: '',
  stockNumber: '',
  brand: '',
  model: '',
  trim: '',
  year: new Date().getFullYear(),
  condition: 'used',
  bodyType: '',
  fuel: 'بنزين',
  transmission: 'أوتوماتيك',
  drive: '',
  engineCc: 0,
  horsepower: 0,
  mileage: 0,
  color: '',
  interiorColor: '',
  doors: 4,
  seats: 5,
  specs: '',
  owners: 0,
  paint: 'original',
  accidents: 'none',
  conditionNotes: '',
  features: [],
  description: '',
  images: [],
  galleryLayout: 'top-main',
  price: 0,
  oldPrice: 0,
  currency,
  showPrice: true,
  negotiable: false,
  badge: '',
  purchasePrice: 0,
  purchaseDate: '',
  purchaseFrom: '',
  vin: '',
  internalNotes: '',
  status: 'available',
  published: true,
  featured: false,
  createdAt: '',
  updatedAt: '',
});

const num = (v: unknown, fallback = 0) => (typeof v === 'number' && isFinite(v) ? v : fallback);
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const oneOf = <T extends string>(v: unknown, ids: readonly T[], fallback: T): T => (ids.includes(v as T) ? (v as T) : fallback);

export const normalizeCar = (raw: any, currency: string): Car => {
  const base = emptyCar(currency);
  return {
    ...base,
    ...raw,
    id: str(raw?.id) || newId('car'),
    year: num(raw?.year, base.year),
    engineCc: num(raw?.engineCc),
    horsepower: num(raw?.horsepower),
    mileage: num(raw?.mileage),
    doors: num(raw?.doors, base.doors),
    seats: num(raw?.seats, base.seats),
    owners: num(raw?.owners),
    price: num(raw?.price),
    oldPrice: num(raw?.oldPrice),
    purchasePrice: num(raw?.purchasePrice),
    condition: oneOf(raw?.condition, ['new', 'used'] as const, 'used'),
    paint: oneOf(raw?.paint, ['original', 'partial', 'full'] as const, 'original'),
    accidents: oneOf(raw?.accidents, ['none', 'minor', 'major'] as const, 'none'),
    status: oneOf(raw?.status, ['available', 'reserved', 'preparing', 'sold'] as const, 'available'),
    features: Array.isArray(raw?.features) ? raw.features.filter((f: unknown) => typeof f === 'string') : [],
    images: Array.isArray(raw?.images) ? raw.images.filter((f: unknown) => typeof f === 'string' && f).slice(0, MAX_CAR_IMAGES) : [],
    currency: str(raw?.currency) || currency,
    showPrice: raw?.showPrice !== false,
    negotiable: !!raw?.negotiable,
    published: raw?.published !== false,
    featured: !!raw?.featured,
  };
};

export const createEmptyCarAdmin = (): CarAdminData => ({ cars: [], settings: { ...DEFAULT_CAR_SETTINGS } });

export const normalizeCarAdmin = (raw: any): CarAdminData => {
  const settings: CarSettings = { ...DEFAULT_CAR_SETTINGS, ...(raw?.settings || {}) };
  return {
    settings,
    cars: Array.isArray(raw?.cars) ? raw.cars.map((c: unknown) => normalizeCar(c, settings.currency)) : [],
  };
};

// The next free stock number: A-0001, A-0002...
export const nextStockNumber = (cars: Car[]) => {
  const max = cars.reduce((m, c) => {
    const n = parseInt((c.stockNumber.match(/(\d+)\s*$/) || [])[1] || '0', 10);
    return Math.max(m, n);
  }, 0);
  return `A-${String(max + 1).padStart(4, '0')}`;
};

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

// A new showroom starts with four example cars so its pages are not empty; the owner edits or
// deletes them in the admin window.
export const exampleCars = (): Car[] => {
  const now = new Date().toISOString();
  const make = (n: number, fields: Partial<Car>): Car => ({
    ...emptyCar('$'),
    id: newId('car'),
    stockNumber: `A-${String(n).padStart(4, '0')}`,
    createdAt: now,
    updatedAt: now,
    ...fields,
  });
  return [
    make(1, {
      brand: 'بي إم دبليو', model: 'الفئة 3', trim: '320i M Sport', year: 2019, bodyType: 'سيدان', fuel: 'بنزين', transmission: 'أوتوماتيك', drive: 'دفع خلفي',
      engineCc: 2000, horsepower: 184, mileage: 64000, color: 'رمادي', interiorColor: 'أسود', specs: 'أوروبي', owners: 1,
      features: ['مكيف أوتوماتيك', 'مقاعد جلد', 'شاشة', 'نظام ملاحة', 'كاميرا خلفية', 'حساسات ركن', 'أضواء LED', 'جنط ألمنيوم'],
      description: 'سيارة نظيفة جدًا بصيانة دورية كاملة، مالك واحد، فحص كامل متاح عند المعاينة.',
      images: [unsplash('1555215695-3004980ad54e')], price: 24500, badge: 'فحص كامل', featured: true, purchasePrice: 21800,
    }),
    make(2, {
      brand: 'مرسيدس', model: 'C 200', trim: 'AMG Line', year: 2018, bodyType: 'سيدان', fuel: 'بنزين', transmission: 'أوتوماتيك', drive: 'دفع خلفي',
      engineCc: 2000, horsepower: 184, mileage: 78000, color: 'أسود', interiorColor: 'بيج', specs: 'خليجي', owners: 2,
      features: ['مكيف أوتوماتيك', 'فتحة سقف', 'مقاعد جلد', 'مقاعد كهربائية', 'شاشة', 'كاميرا خلفية', 'أضواء LED'],
      description: 'مرسيدس C 200 بحالة ممتازة، دهان أصلي، صيانة وكالة.',
      images: [unsplash('1618843479313-40f8afb4b4d8')], price: 27900, oldPrice: 29500, badge: 'عرض خاص', featured: true, purchasePrice: 25000,
    }),
    make(3, {
      brand: 'أودي', model: 'A6', trim: '45 TFSI quattro', year: 2017, bodyType: 'سيدان', fuel: 'بنزين', transmission: 'أوتوماتيك', drive: 'دفع رباعي',
      engineCc: 2000, horsepower: 252, mileage: 91000, color: 'رمادي', interiorColor: 'أسود', specs: 'أوروبي', owners: 2, paint: 'partial',
      features: ['مكيف أوتوماتيك', 'سقف بانورامي', 'مقاعد جلد', 'تدفئة مقاعد', 'نظام ملاحة', 'حساسات ركن', 'مثبت سرعة'],
      description: 'أودي A6 دفع رباعي، رش جزئي على الباب الخلفي، محرك وجير بحالة ممتازة.',
      images: [unsplash('1603584173870-7f23fdae1b7a')], price: 21000, negotiable: true, purchasePrice: 18500,
    }),
    make(4, {
      brand: 'فولكس فاغن', model: 'غولف', trim: 'GTI', year: 2020, bodyType: 'هاتشباك', fuel: 'بنزين', transmission: 'أوتوماتيك', drive: 'دفع أمامي',
      engineCc: 2000, horsepower: 245, mileage: 38000, color: 'أبيض', interiorColor: 'أسود', specs: 'أوروبي', owners: 1,
      features: ['مكيف أوتوماتيك', 'شاشة', 'Apple CarPlay', 'Android Auto', 'كاميرا خلفية', 'أضواء LED', 'جنط ألمنيوم'],
      description: 'غولف GTI رياضية بممشى قليل، مالك أول، بحالة الوكالة.',
      images: [unsplash('1541899481282-d53bffe3c35d')], price: 26500, badge: 'وصل حديثًا', featured: true, purchasePrice: 23900,
    }),
  ];
};

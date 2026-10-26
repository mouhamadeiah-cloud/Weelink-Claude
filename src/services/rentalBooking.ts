// Renting a unit (Eyad, 25 Oct, step 2 of «تأجير»): a car, a machine, a chalet or a hall is booked by the
// day, by the hour, or for one of its periods («صباحية»، «مسائية»), with or without a driver, with the
// schedule's extras («الخدمات المرافقة»), at the unit's price or a special one (by date, by hours, by
// weekday), after the visitor accepts the page's terms. It is the rental «إقامة» schedule's engine with more
// rules: the units are the schedule's rooms (a rental project fills them from its warehouse), the days
// taken are the room's nights, and the hours taken are its half-hour slots:
//   bookingRooms/{owner}_{project}_{schedule}_{room}  { nights: ["yyyy-mm-dd"], slots: ["yyyy-mm-dd@min"] }
// A day taken by a day booking has no free hours, and a day with an hour booked can't be rented whole.
// The pure rules live here, used by the page (to show the price and what is free) and by /api/booking.
import type { StayRoom } from './stayBooking';
import { addDays, nightsBetween, normalizeRooms } from './stayBooking';

export type RentBy = 'day' | 'hour' | 'period';
export type DriverMode = 'none' | 'with' | 'without' | 'both';
export type ExtraPer = 'unit' | 'once';
export type SpecialKind = 'dates' | 'hours' | 'days';

export interface RentalPeriod {
  id: string;
  name: string; // «صباحية»
  start: number; // minutes from midnight
  end: number;
  price: number;
}

// A special price (Eyad): for dates (Eid), for hours of the day (evenings), or for weekdays (the weekend).
// It takes the place of the day price or the hour price (`for`). The most exact one wins: dates, then hours, then weekdays.
export interface SpecialPrice {
  id: string;
  kind: SpecialKind;
  for: 'day' | 'hour';
  days: string[]; // kind 'days': WEEK_DAYS ids
  from: string; // kind 'dates': yyyy-mm-dd; kind 'hours': HH:MM
  to: string;
  price: number;
}

// What the rental schedule keeps about each unit, on its room.
export interface RentalUnit {
  item: string; // the warehouse car or item it stands for ('' = added by hand)
  byDay: boolean;
  byHour: boolean;
  dayPrice: number;
  hourPrice: number;
  fromPrice: number; // the warehouse price the day price was last taken from
  currency: string;
  minHours: number;
  maxHours: number;
  periods: RentalPeriod[];
  driver: DriverMode;
  driverDay: number;
  driverHour: number;
  prices: SpecialPrice[];
}

export interface RentalExtra {
  id: string;
  name: string; // «كرسي أطفال»
  price: number;
  per: ExtraPer; // per day or hour of the booking, or once
  units: string[]; // only these units; [] = all
}

export const WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
export const SLOT = 30; // minutes

const num = (v: unknown, max = 100000000) => Math.min(max, Math.max(0, Math.round((Number(v) || 0) * 100) / 100));
const int = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : '');
const isId = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9]{1,20}$/.test(v);
const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isTime = (v: unknown): v is string => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export const minOf = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
export const timeOf = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export const newRentalId = (p = 'x') => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// The unit of a warehouse car or item: its room id is made from the item's id.
export const unitIdOf = (itemId: string) => `u${itemId.toLowerCase().replace(/[^a-z0-9]/g, '')}`.slice(0, 20);

export const normalizeUnit = (r: any): RentalUnit => {
  const byDay = r?.byDay !== false;
  const byHour = r?.byHour === true;
  const minHours = int(r?.minHours, 1, 24, 1);
  const seen = new Set<string>();
  return {
    item: typeof r?.item === 'string' ? r.item.slice(0, 80) : '',
    // A unit is always rented some way: by the day when nothing else is on.
    byDay: byDay || (!byHour && !(Array.isArray(r?.periods) && r.periods.length)),
    byHour,
    dayPrice: num(r?.dayPrice),
    hourPrice: num(r?.hourPrice),
    fromPrice: num(r?.fromPrice),
    currency: str(r?.currency, 12),
    minHours,
    maxHours: Math.max(minHours, int(r?.maxHours, 1, 24, 12)),
    periods: (Array.isArray(r?.periods) ? r.periods : [])
      .slice(0, 8)
      .map((p: any) => ({ id: isId(p?.id) ? p.id : '', name: str(p?.name, 40), start: int(p?.start, 0, 1439, 600), end: int(p?.end, 1, 1440, 900), price: num(p?.price) }))
      .filter((p: RentalPeriod) => p.id && p.name && p.end > p.start && !seen.has(p.id) && !!seen.add(p.id)),
    driver: r?.driver === 'with' || r?.driver === 'without' || r?.driver === 'both' ? r.driver : 'none',
    driverDay: num(r?.driverDay),
    driverHour: num(r?.driverHour),
    prices: (Array.isArray(r?.prices) ? r.prices : [])
      .slice(0, 20)
      .map((p: any): SpecialPrice => {
        const kind: SpecialKind = p?.kind === 'hours' ? 'hours' : p?.kind === 'days' ? 'days' : 'dates';
        const good = kind === 'dates' ? isDate : kind === 'hours' ? isTime : () => true;
        return {
          id: isId(p?.id) ? p.id : '',
          kind,
          for: kind === 'hours' ? 'hour' : p?.for === 'hour' ? 'hour' : 'day',
          days: Array.isArray(p?.days) ? WEEK.filter((d) => p.days.includes(d)) : [],
          from: good(p?.from) ? p.from : '',
          to: good(p?.to) ? p.to : '',
          price: num(p?.price),
        };
      })
      .filter((p: SpecialPrice) => p.id && (p.kind === 'days' ? p.days.length > 0 : !!p.from && !!p.to && p.from <= p.to)),
  };
};

export const normalizeExtras = (raw: unknown): RentalExtra[] => {
  const seen = new Set<string>();
  return (Array.isArray(raw) ? raw : [])
    .slice(0, 30)
    .map((x: any) => ({
      id: isId(x?.id) ? x.id : '',
      name: str(x?.name, 60),
      price: num(x?.price),
      per: (x?.per === 'once' ? 'once' : 'unit') as ExtraPer,
      units: Array.isArray(x?.units) ? x.units.filter(isId).slice(0, 500) : [],
    }))
    .filter((x: RentalExtra) => x.id && x.name && !seen.has(x.id) && !!seen.add(x.id));
};

// The rental part of a room as the schedule saves it.
export const unitOf = (room: StayRoom & Partial<RentalUnit>): RentalUnit => normalizeUnit(room);

// A rental schedule's units: its rooms with their rental settings (a Pro rental has many).
export const MAX_UNITS = 500;
export const normalizeRentalRooms = (raw: unknown) => normalizeRooms(raw, MAX_UNITS, normalizeUnit) as (StayRoom & RentalUnit)[];

// The terms («الشروط») a visitor accepts before booking. A default text for each kind of rental; the
// owner changes it in «إعدادات الحجز» and can go back to it.
export const DEFAULT_TERMS: Record<'cars' | 'equipment' | 'halls' | 'other', string> = {
  cars: [
    '1. يستلم المستأجر السيارة بحالة جيدة ويعيدها بنفس الحالة وفي الموعد المتفق عليه.',
    '2. السائق يجب أن يحمل رخصة قيادة سارية، ولا يقود السيارة غير المستأجر أو من يوافق عليه المؤجّر.',
    '3. المخالفات المرورية وأي ضرر يحدث خلال مدة الإيجار على المستأجر.',
    '4. التأخير في التسليم يُحسب بسعر ساعة أو يوم إضافي.',
    '5. الوقود: تُعاد السيارة بنفس مستوى الوقود عند الاستلام.',
    '6. الإلغاء قبل 24 ساعة من الاستلام مجاني، وبعدها يحق للمؤجّر الاحتفاظ بالعربون.',
  ].join('\n'),
  equipment: [
    '1. يستلم المستأجر المعدات بحالة سليمة ويستعملها فيما صُنعت له فقط.',
    '2. أي عطل أو ضرر أو فقدان خلال مدة الإيجار على المستأجر.',
    '3. التأخير في الإعادة يُحسب بسعر ساعة أو يوم إضافي.',
    '4. لا يحق للمستأجر تأجير المعدات لغيره.',
    '5. الإلغاء قبل 24 ساعة من الاستلام مجاني، وبعدها يحق للمؤجّر الاحتفاظ بالعربون.',
  ].join('\n'),
  halls: [
    '1. تُستعمل الصالة للمناسبة المذكورة وفي الوقت المحجوز فقط.',
    '2. يلتزم المستأجر بعدد الضيوف المتفق عليه وبأنظمة الصالة.',
    '3. أي ضرر في الصالة أو محتوياتها على المستأجر.',
    '4. تجاوز الوقت المحجوز يُحسب بسعر ساعة إضافية.',
    '5. الإلغاء قبل 7 أيام من الموعد مجاني، وبعدها يحق للمؤجّر الاحتفاظ بالعربون.',
  ].join('\n'),
  other: [
    '1. يستلم المستأجر الغرض بحالة جيدة ويعيده بنفس الحالة وفي الموعد المتفق عليه.',
    '2. أي ضرر أو فقدان خلال مدة الإيجار على المستأجر.',
    '3. التأخير في الإعادة يُحسب بسعر ساعة أو يوم إضافي.',
    '4. الإلغاء قبل 24 ساعة من الموعد مجاني، وبعدها يحق للمؤجّر الاحتفاظ بالعربون.',
  ].join('\n'),
};

// The default terms for what a rental rents («شو بتأجّر؟»).
export const defaultTermsFor = (category: string | null | undefined): string =>
  !category || category === 'سيارات' ? DEFAULT_TERMS.cars : category === 'معدات وآليات' ? DEFAULT_TERMS.equipment : category === 'صالات' ? DEFAULT_TERMS.halls : DEFAULT_TERMS.other;

export const MAX_TERMS = 5000;
export const normalizeTerms = (v: unknown) => (typeof v === 'string' ? v.replace(/\r/g, '').replace(/[\u0000-\u0009\u000b-\u001f]/g, ' ').slice(0, MAX_TERMS) : '');

// ---- What is taken ----

export interface UnitTaken {
  nights: string[];
  slots: string[]; // "yyyy-mm-dd@min", one per half hour
}

export const slotsOf = (date: string, start: number, end: number): string[] => {
  const out: string[] = [];
  for (let m = Math.floor(start / SLOT) * SLOT; m < end && out.length < 48; m += SLOT) out.push(`${date}@${m}`);
  return out;
};

// Free for whole days: none of the days is taken, and no hour of them is.
export const daysFree = (t: UnitTaken | undefined, nights: string[]) =>
  !t || !nights.some((n) => t.nights.includes(n) || t.slots.some((s) => s.startsWith(`${n}@`)));

// Free for some hours of a day: the day is not rented whole, and none of the half hours is taken.
export const slotsFree = (t: UnitTaken | undefined, slots: string[]) =>
  !t || !slots.some((s) => t.nights.includes(s.slice(0, 10)) || t.slots.includes(s));

// ---- The price ----

export interface RentWish {
  by: RentBy;
  date: string; // the day it starts
  checkOut?: string; // by: 'day', the day it is given back
  start?: number; // by: 'hour', minutes from midnight
  hours?: number; // by: 'hour'
  period?: string; // by: 'period'
  driver?: boolean;
  extras?: string[];
}

export interface QuoteLine {
  label: string;
  amount: number;
}

export interface Quote {
  lines: QuoteLine[];
  total: number;
  currency: string;
  nights: string[]; // by: 'day'
  slots: string[]; // by: 'hour' or 'period'
  count: number; // the days or hours (1 for a period), for the per-unit extras
  slot: string; // as the booking shows it
}

const weekdayOf = (date: string) => WEEK[new Date(`${date}T12:00:00Z`).getUTCDay()];
const DAY_AR: Record<string, string> = { sunday: 'الأحد', monday: 'الإثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت' };
export const dayNameAr = (d: string) => DAY_AR[d] || d;

// The price of one day, or of the hour starting at `min` on that day: the most exact special price, or the unit's.
export const priceAt = (u: RentalUnit, date: string, min?: number): { price: number; special: SpecialPrice | null } => {
  const want = min === undefined ? 'day' : 'hour';
  const rules = u.prices.filter((p) => p.for === want);
  const hit =
    rules.find((p) => p.kind === 'dates' && date >= p.from && date <= p.to) ||
    (min !== undefined ? rules.find((p) => p.kind === 'hours' && min >= minOf(p.from) && min < (minOf(p.to) || 1440)) : undefined) ||
    rules.find((p) => p.kind === 'days' && p.days.includes(weekdayOf(date)));
  return { price: hit ? hit.price : want === 'day' ? u.dayPrice : u.hourPrice, special: hit || null };
};

const fmt = (n: number) => String(Math.round(n * 100) / 100);
const words = (n: number, one: string, two: string, many: string) => (n === 1 ? one : n === 2 ? two : `${n} ${many}`);

const specialName = (p: SpecialPrice) =>
  p.kind === 'dates' ? `من ${p.from} إلى ${p.to}` : p.kind === 'hours' ? `من ${p.from} إلى ${p.to}` : p.days.map(dayNameAr).join(' و');

// The price of a wish, line by line, and what it takes. null when the unit can't be rented so.
export const quote = (u: RentalUnit, extras: RentalExtra[], unitId: string, w: RentWish, opts: { minDays?: number; maxDays?: number; workStart?: number; workEnd?: number } = {}): Quote | null => {
  if (!isDate(w.date)) return null;
  const lines: QuoteLine[] = [];
  let nights: string[] = [];
  let slots: string[] = [];
  let count = 1;
  let slot = '';
  let driverPrice = 0;
  if (w.by === 'day') {
    if (!u.byDay || !w.checkOut) return null;
    nights = nightsBetween(w.date, w.checkOut);
    if (nights.length < (opts.minDays || 1) || nights.length > (opts.maxDays || 90)) return null;
    // Group the days by their price: «3 أيام × 50» and «يوم الجمعة × 70».
    const groups = new Map<string, { n: number; price: number; special: SpecialPrice | null }>();
    for (const d of nights) {
      const { price, special } = priceAt(u, d);
      const key = `${special?.id || ''}|${price}`;
      const g = groups.get(key) || { n: 0, price, special };
      g.n++;
      groups.set(key, g);
    }
    for (const g of groups.values())
      lines.push({ label: `${words(g.n, 'يوم', 'يومان', 'أيام')} × ${fmt(g.price)}${g.special ? ` (${specialName(g.special)})` : ''}`, amount: g.n * g.price });
    count = nights.length;
    driverPrice = u.driverDay * count;
    slot = `حتى ${w.checkOut} · ${words(count, 'يوم', 'يومان', 'أيام')}`;
  } else if (w.by === 'hour') {
    const hours = Math.round(Number(w.hours));
    const start = Math.round(Number(w.start));
    if (!u.byHour || !Number.isInteger(hours) || hours < u.minHours || hours > u.maxHours || !Number.isInteger(start) || start < 0 || start % SLOT) return null;
    const end = start + hours * 60;
    if (end > 1440) return null;
    if (opts.workStart !== undefined && start < opts.workStart) return null;
    if (opts.workEnd !== undefined && opts.workEnd > (opts.workStart || 0) && end > opts.workEnd) return null;
    slots = slotsOf(w.date, start, end);
    const groups = new Map<string, { n: number; price: number; special: SpecialPrice | null }>();
    for (let h = 0; h < hours; h++) {
      const { price, special } = priceAt(u, w.date, start + h * 60);
      const key = `${special?.id || ''}|${price}`;
      const g = groups.get(key) || { n: 0, price, special };
      g.n++;
      groups.set(key, g);
    }
    for (const g of groups.values())
      lines.push({ label: `${words(g.n, 'ساعة', 'ساعتان', 'ساعات')} × ${fmt(g.price)}${g.special ? ` (${specialName(g.special)})` : ''}`, amount: g.n * g.price });
    count = hours;
    driverPrice = u.driverHour * hours;
    slot = `${timeOf(start)} - ${timeOf(end)} · ${words(hours, 'ساعة', 'ساعتان', 'ساعات')}`;
  } else {
    const p = u.periods.find((x) => x.id === w.period);
    if (!p) return null;
    slots = slotsOf(w.date, p.start, p.end);
    lines.push({ label: `${p.name} (${timeOf(p.start)} - ${timeOf(p.end)})`, amount: p.price });
    driverPrice = u.driverHour * Math.ceil((p.end - p.start) / 60);
    slot = `${p.name} · ${timeOf(p.start)} - ${timeOf(p.end)}`;
  }
  const withDriver = (u.driver === 'with') || (u.driver === 'both' && w.driver === true);
  if (withDriver && driverPrice > 0) lines.push({ label: 'السائق', amount: driverPrice });
  for (const id of w.extras || []) {
    const x = extras.find((e) => e.id === id && (e.units.length === 0 || e.units.includes(unitId)));
    if (!x) continue;
    const n = x.per === 'unit' ? count : 1;
    lines.push({ label: n > 1 ? `${x.name} × ${n}` : x.name, amount: x.price * n });
  }
  const total = Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
  return { lines: lines.map((l) => ({ ...l, amount: Math.round(l.amount * 100) / 100 })), total, currency: u.currency, nights, slots, count, slot };
};

// The extras a unit offers.
export const extrasFor = (extras: RentalExtra[], unitId: string) => extras.filter((x) => x.units.length === 0 || x.units.includes(unitId));

// The start times of an hourly rental on a day: every hour from the opening, as long as `hours` fit before closing.
export const hourStarts = (workStart: number, workEnd: number, hours: number) => {
  const out: number[] = [];
  const close = workEnd > workStart ? workEnd : 1440;
  for (let m = workStart; m + hours * 60 <= close; m += 60) out.push(m);
  return out;
};

// ---- The units of a rental project, from its warehouse ----

export interface WarehouseUnit {
  item: string;
  name: string;
  photo: string;
  price: number;
  currency: string;
}

// The schedule's rooms after the warehouse changed: one per car or item, in the warehouse's order, each
// keeping its rental settings; a new one is rented by the day at its warehouse price. When the warehouse
// price changes, the day price follows it. Rooms added by hand stay.
export const mergeUnits = (rooms: (StayRoom & Partial<RentalUnit>)[], items: WarehouseUnit[]): (StayRoom & RentalUnit)[] => {
  const byItem = new Map(rooms.filter((r) => r.item).map((r) => [r.item!, r]));
  const fromWarehouse = items.map((it) => {
    const old = byItem.get(it.item);
    const u = normalizeUnit(old || { byDay: true, dayPrice: it.price, fromPrice: it.price });
    const repriced = !old || u.fromPrice !== it.price;
    return {
      id: old?.id || unitIdOf(it.item),
      name: it.name.slice(0, 60) || 'بدون اسم',
      capacity: 1,
      price: '',
      photo: /^https?:\/\//.test(it.photo) ? it.photo.slice(0, 1000) : '',
      ...u,
      item: it.item,
      currency: it.currency || u.currency,
      dayPrice: repriced ? it.price : u.dayPrice,
      fromPrice: it.price,
    };
  });
  const byHand = rooms.filter((r) => !r.item).map((r) => ({ ...r, ...normalizeUnit(r) }));
  return [...fromWarehouse, ...byHand].map((r) => ({ ...r, price: r.dayPrice ? `${fmt(r.dayPrice)}${r.currency ? ` ${r.currency}` : ''} / يوم` : r.price }));
};

// The day after a stay of `n` days from `date`.
export const dayAfter = (date: string, n: number) => addDays(date, n);

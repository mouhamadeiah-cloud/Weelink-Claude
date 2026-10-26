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
// per: each day, hour or night · once · each person each night · each person once (hotels and halls)
export type ExtraPer = 'unit' | 'once' | 'person' | 'personOnce';
export type SpecialKind = 'dates' | 'hours' | 'days';

// A period (Eyad, 26 Oct): hours of a day («صباحية»: time), a number of days («أسبوع»، «شهر»، «سنة»: length, from the day
// the visitor picks), or fixed dates («عيد الأضحى»: dates, from the day it starts to the day it is given back).
export type PeriodKind = 'time' | 'length' | 'dates';
export interface RentalPeriod {
  id: string;
  name: string; // «صباحية»
  kind?: PeriodKind; // missing = 'time'
  start: number; // time: minutes from midnight
  end: number;
  days?: number; // length: the days it lasts
  from?: string; // dates: yyyy-mm-dd, the day it starts
  to?: string; // dates: the day it is given back
  price: number;
}
export const periodKind = (p: RentalPeriod): PeriodKind => p.kind || 'time';
// The nights (days) a length or dates period takes when it starts on `date`; [] for a time period or a wrong date.
export const periodNights = (p: RentalPeriod, date: string): string[] => {
  const kind = periodKind(p);
  if (kind === 'time') return [];
  if (kind === 'dates') return date === p.from && p.from && p.to ? nightsBetween(p.from, p.to) : [];
  return isDate(date) ? nightsBetween(date, addDays(date, p.days || 1)) : [];
};

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

// When a unit can be rented (Eyad, 26 Oct): rules «متاح» or «غير متاح» for dates, hours of the day or weekdays. «غير متاح» always
// blocks. When there are «متاح» rules of a kind (dates, weekdays, hours), the rental must be inside one of them.
export interface AvailRule {
  id: string;
  allow: boolean;
  kind: SpecialKind;
  days: string[]; // kind 'days': WEEK ids
  from: string; // kind 'dates': yyyy-mm-dd; kind 'hours': HH:MM
  to: string;
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
  avail: AvailRule[];
  copies: number; // identical copies of the unit (5 tents): each one is booked on its own, up to this many at once
  perPerson: boolean; // the price (day, hour, period, special) is for one person: it is multiplied by the guests (halls, villas, rooms)
  maxGuests: number; // the most people in one booking (a room for 2, a villa for 6); 0 = no limit
}

export interface RentalExtra {
  id: string;
  name: string; // «كرسي أطفال»
  price: number;
  per: ExtraPer; // per day or hour of the booking, or once
  units: string[]; // only these units; [] = all (NO_UNIT = none)
  note?: string; // what it includes, shown behind a «؟» to the visitor and in the contract
  prices?: Record<string, number>; // a price of its own for some units (set while the item is entered); the others pay `price`
}
// What an extra costs on one unit.
export const extraPriceFor = (x: RentalExtra, unitId: string) => (x.prices && typeof x.prices[unitId] === 'number' ? x.prices[unitId] : x.price);

// The unit id of an extra that no unit offers (a [] list means every unit).
export const NO_UNIT = 'none';

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

export const MAX_COPIES = 100;
// One way to rent (Eyad, 26 Oct): a unit rented by several ways at once becomes a day rental, the first way.
export const singleWay = <T extends RentalUnit>(u: T): T => {
  const ways = (u.byDay ? 1 : 0) + (u.byHour ? 1 : 0) + (u.periods.length > 0 ? 1 : 0);
  return ways > 1 ? { ...u, byDay: true, byHour: false, periods: [] } : u;
};

export const normalizeAvail = (raw: unknown): AvailRule[] => {
  const seen = new Set<string>();
  return (Array.isArray(raw) ? raw : [])
    .slice(0, 20)
    .map((p: any): AvailRule => {
      const kind: SpecialKind = p?.kind === 'hours' ? 'hours' : p?.kind === 'days' ? 'days' : 'dates';
      const good = kind === 'dates' ? isDate : kind === 'hours' ? isTime : () => true;
      return {
        id: isId(p?.id) ? p.id : '',
        allow: p?.allow !== false,
        kind,
        days: Array.isArray(p?.days) ? WEEK.filter((d) => p.days.includes(d)) : [],
        from: good(p?.from) ? p.from : '',
        to: good(p?.to) ? p.to : '',
      };
    })
    .filter((p: AvailRule) => p.id && !seen.has(p.id) && !!seen.add(p.id) && (p.kind === 'days' ? p.days.length > 0 : !!p.from && !!p.to && (p.kind === 'hours' ? p.from !== p.to : p.from <= p.to)));
};

export const normalizeUnit = (r: any): RentalUnit => {
  const byDay = r?.byDay !== false;
  const byHour = r?.byHour === true;
  const minHours = int(r?.minHours, 1, 24, 1);
  const seen = new Set<string>();
  return {
    item: typeof r?.item === 'string' ? r.item.slice(0, 80) : '',
    copies: int(r?.copies, 1, MAX_COPIES, 1),
    perPerson: r?.perPerson === true,
    maxGuests: int(r?.maxGuests, 0, 500, 0),
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
      .map((p: any): RentalPeriod => {
        const kind: PeriodKind = p?.kind === 'length' || p?.kind === 'dates' ? p.kind : 'time';
        return {
          id: isId(p?.id) ? p.id : '', name: str(p?.name, 40),
          ...(kind === 'time' ? {} : { kind }),
          start: int(p?.start, 0, 1439, 600), end: int(p?.end, 1, 1440, 900),
          ...(kind === 'length' ? { days: int(p?.days, 1, 365, 7) } : {}),
          ...(kind === 'dates' ? { from: isDate(p?.from) ? p.from : '', to: isDate(p?.to) ? p.to : '' } : {}),
          price: num(p?.price),
        };
      })
      .filter((p: RentalPeriod) => p.id && p.name && (periodKind(p) === 'time' ? p.end > p.start : periodKind(p) === 'length' || (!!p.from && !!p.to && p.to > p.from)) && !seen.has(p.id) && !!seen.add(p.id)),
    driver: r?.driver === 'with' || r?.driver === 'without' || r?.driver === 'both' ? r.driver : 'none',
    driverDay: num(r?.driverDay),
    driverHour: num(r?.driverHour),
    avail: normalizeAvail(r?.avail),
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
      per: (x?.per === 'once' || x?.per === 'person' || x?.per === 'personOnce' ? x.per : 'unit') as ExtraPer,
      units: Array.isArray(x?.units) ? x.units.filter(isId).slice(0, 500) : [],
      note: str(x?.note, 200),
      prices: Object.fromEntries((Object.entries(x?.prices && typeof x.prices === 'object' ? x.prices : {}) as [string, unknown][]).filter(([k, v]) => isId(k) && typeof v === 'number' && v >= 0 && v < 1e9).slice(0, 500)) as Record<string, number>,
    }))
    .filter((x: RentalExtra) => x.id && x.name && !seen.has(x.id) && !!seen.add(x.id));
};

// The rental part of a room as the schedule saves it.
export const unitOf = (room: StayRoom & Partial<RentalUnit>): RentalUnit => normalizeUnit(room);

// A rental schedule's units: its rooms with their rental settings (a Pro rental has many).
// A hotel's room keeps only what prices a night: the room type it is of, the type's price per night
// and its special prices by date or weekday (hotelTypes.ts fills them; /api/booking prices with them).
export const normalizeHotelRoom = (r: any) => {
  const u = normalizeUnit(r);
  return { item: u.item, dayPrice: u.dayPrice, currency: u.currency, prices: u.prices.filter((p) => p.for === 'day' && p.kind !== 'hours') };
};
export const normalizeHotelRooms = (raw: unknown) => normalizeRooms(raw, 300, normalizeHotelRoom) as (StayRoom & ReturnType<typeof normalizeHotelRoom>)[];

export const MAX_UNITS = 500;
export const normalizeRentalRooms = (raw: unknown) => normalizeRooms(raw, MAX_UNITS, normalizeUnit) as (StayRoom & RentalUnit)[];

// The terms («الشروط») a visitor accepts before booking. A default text for each kind of rental; the
// owner changes it in «إعدادات الحجز» and can go back to it.
export const DEFAULT_TERMS: Record<'cars' | 'equipment' | 'halls' | 'other' | 'hotel', string> = {
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
  hotel: [
    '1. موعد الوصول من الساعة 2 ظهراً والمغادرة قبل الساعة 12 ظهراً، إلا إذا اتفقنا على غير ذلك.',
    '2. يُبرز النزيل هويته عند الوصول، ولا يزيد عدد الأشخاص في الغرفة عن العدد المحجوز.',
    '3. أي ضرر أو فقدان في الغرفة أو محتوياتها على النزيل.',
    '4. التدخين ممنوع داخل الغرف، والهدوء مطلوب بعد منتصف الليل.',
    '5. الإلغاء قبل 48 ساعة من الوصول مجاني، وبعدها يحق للفندق الاحتفاظ بالعربون.',
    '6. الفندق غير مسؤول عن الأغراض الثمينة غير المودعة عند الاستقبال.',
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
const oneDaysFree = (t: UnitTaken | undefined, nights: string[]) =>
  !t || !nights.some((n) => t.nights.includes(n) || t.slots.some((s) => s.startsWith(`${n}@`)));
// `t` may be the taken times of every copy of a unit: free when any copy is.
export const daysFree = (t: UnitTaken | UnitTaken[] | undefined, nights: string[]) => (Array.isArray(t) ? t.length === 0 || t.some((x) => oneDaysFree(x, nights)) : oneDaysFree(t, nights));

// Free for some hours of a day: the day is not rented whole, and none of the half hours is taken.
const oneSlotsFree = (t: UnitTaken | undefined, slots: string[]) =>
  !t || !slots.some((s) => t.nights.includes(s.slice(0, 10)) || t.slots.includes(s));
export const slotsFree = (t: UnitTaken | UnitTaken[] | undefined, slots: string[]) => (Array.isArray(t) ? t.length === 0 || t.some((x) => oneSlotsFree(x, slots)) : oneSlotsFree(t, slots));

// The booking document of copy `k` (1-based) of a unit: the first copy is the unit's own, so bookings made before copies existed stay.
export const copyIdOf = (unitId: string, k: number) => (k <= 1 ? unitId : `${unitId.slice(0, 20 - String(k).length - 1)}k${k}`);

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
  guests?: number; // people, for the extras priced per person (a hotel stay)
}

export interface QuoteLine {
  label: string;
  amount: number;
  note?: string; // an extra's description
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

const ruleOnDay = (r: AvailRule, date: string) => (r.kind === 'dates' ? date >= r.from && date <= r.to : r.kind === 'days' ? r.days.includes(weekdayOf(date)) : false);
/** Can the unit be rented on this day (the dates and weekdays rules)? */
export const dayAvailable = (u: RentalUnit, date: string): boolean => {
  const rules = u.avail.filter((r) => r.kind !== 'hours');
  if (rules.some((r) => !r.allow && ruleOnDay(r, date))) return false;
  return (['dates', 'days'] as const).every((kind) => {
    const allow = rules.filter((r) => r.allow && r.kind === kind);
    return allow.length === 0 || allow.some((r) => ruleOnDay(r, date));
  });
};
/** Can the unit be rented from minute `start` to `end` of a day (the hours rules)? */
export const hoursAvailable = (u: RentalUnit, start: number, end: number): boolean => {
  const rules = u.avail.filter((r) => r.kind === 'hours').map((r) => ({ allow: r.allow, from: minOf(r.from), to: minOf(r.to) > minOf(r.from) ? minOf(r.to) : 1440 }));
  if (rules.some((r) => !r.allow && start < r.to && end > r.from)) return false;
  const allow = rules.filter((r) => r.allow);
  return allow.length === 0 || allow.some((r) => start >= r.from && end <= r.to);
};

const fmt = (n: number) => String(Math.round(n * 100) / 100);
const words = (n: number, one: string, two: string, many: string) => (n === 1 ? one : n === 2 ? two : `${n} ${many}`);

const specialName = (p: SpecialPrice) =>
  p.kind === 'dates' ? `من ${p.from} إلى ${p.to}` : p.kind === 'hours' ? `من ${p.from} إلى ${p.to}` : p.days.map(dayNameAr).join(' و');

// The price of a wish, line by line, and what it takes. null when the unit can't be rented so.
export const quote = (u: RentalUnit, extras: RentalExtra[], unitId: string, w: RentWish, opts: { minDays?: number; maxDays?: number; workStart?: number; workEnd?: number; night?: boolean } = {}): Quote | null => {
  if (!isDate(w.date)) return null;
  let lines: QuoteLine[] = [];
  let nights: string[] = [];
  let slots: string[] = [];
  let count = 1;
  let slot = '';
  let driverPrice = 0;
  if (w.by === 'day') {
    if (!u.byDay || !w.checkOut) return null;
    nights = nightsBetween(w.date, w.checkOut);
    if (nights.length < (opts.minDays || 1) || nights.length > (opts.maxDays || 90)) return null;
    if (nights.some((d) => !dayAvailable(u, d))) return null;
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
      lines.push({ label: `${opts.night ? words(g.n, 'ليلة', 'ليلتان', 'ليالٍ') : words(g.n, 'يوم', 'يومان', 'أيام')} × ${fmt(g.price)}${g.special ? ` (${specialName(g.special)})` : ''}`, amount: g.n * g.price });
    count = nights.length;
    driverPrice = u.driverDay * count;
    slot = `حتى ${w.checkOut} · ${opts.night ? words(count, 'ليلة', 'ليلتان', 'ليالٍ') : words(count, 'يوم', 'يومان', 'أيام')}`;
  } else if (w.by === 'hour') {
    const hours = Math.round(Number(w.hours));
    const start = Math.round(Number(w.start));
    if (!u.byHour || !Number.isInteger(hours) || hours < u.minHours || hours > u.maxHours || !Number.isInteger(start) || start < 0 || start % SLOT) return null;
    const end = start + hours * 60;
    if (end > 1440) return null;
    if (opts.workStart !== undefined && start < opts.workStart) return null;
    if (opts.workEnd !== undefined && opts.workEnd > (opts.workStart || 0) && end > opts.workEnd) return null;
    if (!dayAvailable(u, w.date) || !hoursAvailable(u, start, end)) return null;
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
    if (periodKind(p) !== 'time') {
      // A number of days or fixed dates: taken as days, at the period's price.
      nights = periodNights(p, w.date);
      if (nights.length === 0 || nights.some((d) => !dayAvailable(u, d))) return null;
      lines.push({ label: `${p.name} (${words(nights.length, 'يوم', 'يومان', 'أيام')})`, amount: p.price });
      count = nights.length;
      driverPrice = u.driverDay * count;
      slot = `${p.name} · حتى ${addDays(nights[nights.length - 1], 1)}`;
    } else {
      if (!dayAvailable(u, w.date) || !hoursAvailable(u, p.start, p.end)) return null;
      slots = slotsOf(w.date, p.start, p.end);
      lines.push({ label: `${p.name} (${timeOf(p.start)} - ${timeOf(p.end)})`, amount: p.price });
      driverPrice = u.driverHour * Math.ceil((p.end - p.start) / 60);
      slot = `${p.name} · ${timeOf(p.start)} - ${timeOf(p.end)}`;
    }
  }
  // People (Eyad, 26 Oct): a unit has a most (a room for 2), and may be priced for one person, so every price line times the guests.
  const guests = Math.max(1, Math.round(Number(w.guests)) || 1);
  if (u.maxGuests > 0 && guests > u.maxGuests) return null;
  if (u.perPerson && guests > 1) lines = lines.map((l) => ({ ...l, label: `${l.label} × ${words(guests, 'شخص', 'شخصان', 'أشخاص')}`, amount: l.amount * guests }));
  const withDriver = (u.driver === 'with') || (u.driver === 'both' && w.driver === true);
  if (withDriver && driverPrice > 0) lines.push({ label: 'السائق', amount: driverPrice });
  for (const id of w.extras || []) {
    const x = extras.find((e) => e.id === id && (e.units.length === 0 || e.units.includes(unitId)));
    if (!x) continue;
    const n = x.per === 'unit' ? count : x.per === 'person' ? count * guests : x.per === 'personOnce' ? guests : 1;
    lines.push({ label: n > 1 ? `${x.name} × ${n}` : x.name, amount: extraPriceFor(x, unitId) * n, ...(x.note ? { note: x.note } : {}) });
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
  copies?: number; // identical copies in the warehouse (a rental item's «عدد النسخ»)
  maxGuests?: number; // the most people in one booking (an estate item's «العدد الأقصى للأشخاص»)
}

// The schedule's rooms after the warehouse changed: one per car or item, in the warehouse's order, each
// keeping its rental settings; a new one is rented by the day at its warehouse price. When the warehouse
// price changes, the day price follows it. Rooms added by hand stay.
export const mergeUnits = (rooms: (StayRoom & Partial<RentalUnit>)[], items: WarehouseUnit[]): (StayRoom & RentalUnit)[] => {
  const byItem = new Map(rooms.filter((r) => r.item).map((r) => [r.item!, r]));
  const fromWarehouse = items.map((it) => {
    const old = byItem.get(it.item);
    const u = singleWay(normalizeUnit(old || { byDay: true, dayPrice: it.price, fromPrice: it.price }));
    const repriced = !old || u.fromPrice !== it.price;
    // The item's price is the price of the way it is rented by: the day, or the hour.
    const hourOnly = u.byHour && !u.byDay && u.periods.length === 0;
    return {
      id: old?.id || unitIdOf(it.item),
      name: it.name.slice(0, 60) || 'بدون اسم',
      capacity: 1,
      price: '',
      photo: /^https?:\/\//.test(it.photo) ? it.photo.slice(0, 1000) : '',
      ...u,
      item: it.item,
      currency: it.currency || u.currency,
      dayPrice: repriced && !hourOnly ? it.price : u.dayPrice,
      hourPrice: repriced && hourOnly ? it.price : u.hourPrice,
      fromPrice: it.price,
      copies: it.copies ? Math.min(MAX_COPIES, Math.max(1, Math.round(it.copies))) : 1,
      maxGuests: it.maxGuests ? Math.min(500, Math.max(0, Math.round(it.maxGuests))) : 0,
    };
  });
  const byHand = rooms.filter((r) => !r.item).map((r) => ({ ...r, ...normalizeUnit(r) }));
  return [...fromWarehouse, ...byHand].map((r) => ({ ...r, price: r.dayPrice ? `${fmt(r.dayPrice)}${r.currency ? ` ${r.currency}` : ''} / يوم` : r.price }));
};

// The day after a stay of `n` days from `date`.
export const dayAfter = (date: string, n: number) => addDays(date, n);

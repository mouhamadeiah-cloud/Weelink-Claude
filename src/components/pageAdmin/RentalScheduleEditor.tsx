// The rental part of «إعدادات الحجز» (Eyad, 25 Oct, step 2 of «تأجير»): how each unit is rented (by the
// day, by the hour, for periods, with or without a driver, special prices), the extras («الخدمات
// المرافقة») and the terms the visitor accepts before booking. A rental project's units come from its
// warehouse (rentalUnits.ts); another page adds them here by hand. See services/rentalBooking.ts.
import React from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import type { BookingSchedule } from '../../services/bookingSettings';
import type { StayRoom } from '../../services/stayBooking';
import { newRoomId } from '../../services/stayBooking';
import {
  DEFAULT_TERMS, WEEK, dayNameAr, minOf, newRentalId, normalizeUnit, timeOf,
  type DriverMode, type RentalExtra, type RentalPeriod, type RentalUnit, type SpecialPrice,
} from '../../services/rentalBooking';
import { ImagePicker } from '../restaurant/tabs/shared';
import { Field, GhostButton, inputClass, inputFitClass, textareaClass, Toggle } from '../shop/adminUi';

type Unit = StayRoom & RentalUnit;

const chip = (on: boolean) => `h-9 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${on ? 'bg-brand border-brand text-white' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`;
const money = (v: string) => Math.max(0, Number(v) || 0);

const NumberIn: React.FC<{ value: number; onChange: (n: number) => void; unit: string; w?: string; max?: number }> = ({ value, onChange, unit, w = 'w-28', max }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500">
    <input type="number" min={0} max={max} className={`${inputFitClass} ${w}`} value={value || ''} placeholder="0" onChange={(e) => onChange(max ? Math.min(max, money(e.target.value)) : money(e.target.value))} /> {unit}
  </span>
);

const TimeIn: React.FC<{ value: number; onChange: (m: number) => void }> = ({ value, onChange }) => (
  <input type="time" dir="ltr" className={`${inputFitClass} w-32`} value={timeOf(value % 1440)} onChange={(e) => e.target.value && onChange(minOf(e.target.value))} />
);

const DRIVERS: [DriverMode, string][] = [['none', 'بدون سائق'], ['with', 'مع سائق دائماً'], ['both', 'الزبون بيختار']];
const TERMS_KINDS: [keyof typeof DEFAULT_TERMS, string][] = [['cars', 'سيارات'], ['equipment', 'معدات'], ['halls', 'صالات'], ['other', 'أغراض أخرى']];
export const HOTEL_TERMS_KINDS: [keyof typeof DEFAULT_TERMS, string][] = [['hotel', 'فندق']];

// «أسعار خاصة»: prices by weekday, dates or hours that replace the unit's own (a hotel's room type uses it for nights).
export const SpecialPrices: React.FC<{ prices: SpecialPrice[]; onChange: (prices: SpecialPrice[]) => void; currency: string; byDay: boolean; byHour: boolean; night?: boolean }> = ({ prices, onChange, currency, byDay, byHour, night }) => {
  const u = { prices, currency, byDay, byHour };
  const set = (patch: { prices: SpecialPrice[] }) => onChange(patch.prices);
  const setPrice = (i: number, patch: Partial<SpecialPrice>) => onChange(prices.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
      <Field label="أسعار خاصة" hint="مثلاً الجمعة والسبت بسعر، أو أيام العيد، أو المساء للملاعب. إذا انطبق أكتر من سعر: التواريخ أولاً، بعدين الساعات، بعدين الأيام">
        <div className="space-y-2">
          {u.prices.map((p, i) => (
            <div key={p.id} className="rounded-xl border border-neutral-200 p-2 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {([['days', 'أيام الأسبوع'], ['dates', 'تواريخ'], ['hours', 'ساعات']] as [SpecialPrice['kind'], string][]).filter(([kind]) => !(night && kind === 'hours')).map(([kind, label]) => (
                  <button key={kind} type="button" className={chip(p.kind === kind)} onClick={() => setPrice(i, { kind, for: kind === 'hours' ? 'hour' : p.for, from: '', to: '' })}>{label}</button>
                ))}
                <button type="button" aria-label="حذف" className="text-[#E03131] cursor-pointer mr-auto" onClick={() => set({ prices: u.prices.filter((_, j) => j !== i) })}><Trash2 size={15} /></button>
              </div>
              {p.kind === 'days' && (
                <div className="flex flex-wrap gap-1">
                  {WEEK.map((d) => <button key={d} type="button" className={chip(p.days.includes(d))} onClick={() => setPrice(i, { days: p.days.includes(d) ? p.days.filter((x) => x !== d) : WEEK.filter((x) => x === d || p.days.includes(x)) })}>{dayNameAr(d)}</button>)}
                </div>
              )}
              {p.kind === 'dates' && (
                <div className="flex flex-wrap items-center gap-2" dir="ltr">
                  <input type="date" className={`${inputFitClass} w-40`} value={p.from} onChange={(e) => setPrice(i, { from: e.target.value, to: p.to && p.to >= e.target.value ? p.to : e.target.value })} />
                  <span className="text-neutral-400">–</span>
                  <input type="date" min={p.from} className={`${inputFitClass} w-40`} value={p.to} onChange={(e) => setPrice(i, { to: e.target.value })} />
                </div>
              )}
              {p.kind === 'hours' && (
                <div className="flex flex-wrap items-center gap-2" dir="ltr">
                  <input type="time" className={`${inputFitClass} w-28`} value={p.from} onChange={(e) => setPrice(i, { from: e.target.value })} />
                  <span className="text-neutral-400">–</span>
                  <input type="time" className={`${inputFitClass} w-28`} value={p.to} onChange={(e) => setPrice(i, { to: e.target.value })} />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {p.kind !== 'hours' && u.byDay && u.byHour && (
                  <>
                    <button type="button" className={chip(p.for === 'day')} onClick={() => setPrice(i, { for: 'day' })}>بدل سعر اليوم</button>
                    <button type="button" className={chip(p.for === 'hour')} onClick={() => setPrice(i, { for: 'hour' })}>بدل سعر الساعة</button>
                  </>
                )}
                <NumberIn value={p.price} onChange={(price) => setPrice(i, { price })} unit={`${u.currency} ${p.for === 'hour' ? 'للساعة' : night ? 'لليلة' : 'لليوم'}`.trim()} w="w-24" />
              </div>
            </div>
          ))}
          {u.prices.length < 20 && (
            <GhostButton onClick={() => set({ prices: [...u.prices, { id: newRentalId('s'), kind: 'days', for: u.byDay ? 'day' : 'hour', days: ['friday', 'saturday'], from: '', to: '', price: 0 }] })}>
              <span className="inline-flex items-center gap-1"><Plus size={13} /> أضف سعر خاص</span>
            </GhostButton>
          )}
        </div>
      </Field>
  );
};

const UnitEditor: React.FC<{ unit: Unit; set: (patch: Partial<Unit>) => void; remove?: () => void; fromWarehouse: boolean }> = ({ unit: u, set, remove, fromWarehouse }) => {
  const cur = u.currency ? ` ${u.currency}` : '';
  const setPeriod = (i: number, patch: Partial<RentalPeriod>) => set({ periods: u.periods.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const setPrice = (i: number, patch: Partial<SpecialPrice>) => set({ prices: u.prices.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const ways = [u.byDay && 'باليوم', u.byHour && 'بالساعة', u.periods.length > 0 && 'بالفترة'].filter(Boolean).join('، ');
  return (
    <details className="group rounded-xl border border-neutral-200 bg-white">
      <summary className="flex items-center gap-3 p-2.5 cursor-pointer list-none">
        <div className="w-12 h-9 rounded-lg bg-neutral-100 overflow-hidden shrink-0">{u.photo && <img src={u.photo} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black text-ink truncate">{u.name || 'وحدة بدون اسم'}</div>
          <div className="text-xs text-neutral-400 font-bold truncate">
            {ways}{u.byDay && u.dayPrice ? ` · ${u.dayPrice}${cur} لليوم` : ''}{u.byHour && u.hourPrice ? ` · ${u.hourPrice}${cur} للساعة` : ''}{u.driver !== 'none' ? ' · سائق' : ''}{u.prices.length ? ` · ${u.prices.length} سعر خاص` : ''}
          </div>
        </div>
        <ChevronDown size={16} className="text-neutral-400 transition group-open:rotate-180" />
      </summary>
      <div className="p-3 pt-0 space-y-3 border-t border-neutral-100">
        {!fromWarehouse && (
          <div className="grid grid-cols-[1fr_auto] gap-2 items-center pt-3">
            <input className={inputClass} placeholder="اسم الوحدة، مثلاً: كيا سيراتو 2020" value={u.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} />
            {remove && <button type="button" aria-label="حذف" className="text-[#E03131] cursor-pointer" onClick={remove}><Trash2 size={15} /></button>}
            <div className="col-span-full"><ImagePicker value={u.photo || ''} onChange={(photo) => set({ photo })} /></div>
          </div>
        )}
        {fromWarehouse && <div className="pt-3 text-xs text-neutral-400 font-bold">الاسم والصورة من المستودع. سعر اليوم بيتبع سعر المستودع لما يتغير هناك.</div>}

        <Field label="طريقة التأجير" hint="بتقدر تشغّل أكتر من طريقة، والزبون بيختار">
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={chip(u.byDay)} onClick={() => set({ byDay: !u.byDay || (!u.byHour && !u.periods.length) })}>باليوم</button>
            <button type="button" className={chip(u.byHour)} onClick={() => set({ byHour: !u.byHour, byDay: u.byHour && !u.periods.length ? true : u.byDay })}>بالساعة</button>
          </div>
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          {u.byDay && <Field label="سعر اليوم"><NumberIn value={u.dayPrice} onChange={(dayPrice) => set({ dayPrice })} unit={u.currency || 'لليوم'} /></Field>}
          {u.byHour && <Field label="سعر الساعة"><NumberIn value={u.hourPrice} onChange={(hourPrice) => set({ hourPrice })} unit={u.currency || 'للساعة'} /></Field>}
          {u.byHour && (
            <Field label="عدد الساعات بالحجز">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500">
                من <input type="number" min={1} max={24} className={`${inputFitClass} w-16`} value={u.minHours} onChange={(e) => set({ minHours: Math.min(24, Math.max(1, Number(e.target.value) || 1)) })} />
                لـ <input type="number" min={1} max={24} className={`${inputFitClass} w-16`} value={u.maxHours} onChange={(e) => set({ maxHours: Math.min(24, Math.max(1, Number(e.target.value) || 1)) })} /> ساعة
              </span>
            </Field>
          )}
        </div>

        <Field label="الفترات" hint="للصالات مثلاً: صباحية، مسائية، يوم كامل. كل فترة بسعرها">
          <div className="space-y-2">
            {u.periods.map((p, i) => (
              <div key={p.id} className="flex flex-wrap items-center gap-2">
                <input className={`${inputFitClass} w-36`} placeholder="صباحية" value={p.name} maxLength={40} onChange={(e) => setPeriod(i, { name: e.target.value })} />
                <TimeIn value={p.start} onChange={(start) => setPeriod(i, { start })} />
                <span className="text-neutral-400">–</span>
                <TimeIn value={p.end} onChange={(end) => setPeriod(i, { end: end || 1440 })} />
                <NumberIn value={p.price} onChange={(price) => setPeriod(i, { price })} unit={u.currency} w="w-24" />
                <button type="button" aria-label="حذف" className="text-[#E03131] cursor-pointer" onClick={() => set({ periods: u.periods.filter((_, j) => j !== i) })}><Trash2 size={15} /></button>
              </div>
            ))}
            {u.periods.length < 8 && (
              <GhostButton onClick={() => set({ periods: [...u.periods, { id: newRentalId('p'), name: '', start: 600, end: 900, price: 0 }] })}><span className="inline-flex items-center gap-1"><Plus size={13} /> أضف فترة</span></GhostButton>
            )}
          </div>
        </Field>

        <Field label="السائق">
          <div className="flex flex-wrap items-center gap-1.5">
            {DRIVERS.map(([id, label]) => <button key={id} type="button" className={chip(u.driver === id)} onClick={() => set({ driver: id })}>{label}</button>)}
          </div>
          {u.driver !== 'none' && (
            <div className="flex flex-wrap gap-3 pt-1">
              {u.byDay && <NumberIn value={u.driverDay} onChange={(driverDay) => set({ driverDay })} unit={`${u.currency} لليوم`.trim()} w="w-24" />}
              {(u.byHour || u.periods.length > 0) && <NumberIn value={u.driverHour} onChange={(driverHour) => set({ driverHour })} unit={`${u.currency} للساعة`.trim()} w="w-24" />}
            </div>
          )}
        </Field>

        <SpecialPrices prices={u.prices} onChange={(prices) => set({ prices })} currency={u.currency} byDay={u.byDay} byHour={u.byHour} />
      </div>
    </details>
  );
};

export const ExtrasEditor: React.FC<{ extras: RentalExtra[]; units: Unit[]; onChange: (extras: RentalExtra[]) => void }> = ({ extras, units, onChange }) => {
  const set = (i: number, patch: Partial<RentalExtra>) => onChange(extras.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className="space-y-2">
      {extras.map((x, i) => (
        <div key={x.id} className="rounded-xl border border-neutral-200 p-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input className={`${inputFitClass} flex-1 min-w-[140px]`} placeholder="كرسي أطفال، توصيل للعنوان، ضيافة…" value={x.name} maxLength={60} onChange={(e) => set(i, { name: e.target.value })} />
            <NumberIn value={x.price} onChange={(price) => set(i, { price })} unit="" w="w-24" />
            <button type="button" className={chip(x.per === 'unit')} onClick={() => set(i, { per: 'unit' })}>لكل يوم أو ساعة</button>
            <button type="button" className={chip(x.per === 'once')} onClick={() => set(i, { per: 'once' })}>مرة وحدة</button>
            <button type="button" aria-label="حذف" className="text-[#E03131] cursor-pointer" onClick={() => onChange(extras.filter((_, j) => j !== i))}><Trash2 size={15} /></button>
          </div>
          {units.length > 1 && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-xs font-bold text-neutral-400 ml-1">متاحة لـ:</span>
              <button type="button" className={chip(x.units.length === 0)} onClick={() => set(i, { units: [] })}>الكل</button>
              {units.map((u) => (
                <button key={u.id} type="button" className={chip(x.units.includes(u.id))} onClick={() => set(i, { units: x.units.includes(u.id) ? x.units.filter((id) => id !== u.id) : [...x.units, u.id] })}>{u.name}</button>
              ))}
            </div>
          )}
        </div>
      ))}
      {extras.length < 30 && (
        <GhostButton onClick={() => onChange([...extras, { id: newRentalId('e'), name: '', price: 0, per: 'unit', units: [] }])}><span className="inline-flex items-center gap-1"><Plus size={13} /> أضف خدمة</span></GhostButton>
      )}
    </div>
  );
};

interface RentalScheduleEditorProps {
  schedule: BookingSchedule;
  change: (patch: Partial<BookingSchedule>) => void;
  // A rental project: the units are its warehouse's cars and items, kept in step by its admin.
  fromWarehouse: boolean;
}

// «الموافقة على الشروط»: the terms text the visitor accepts before booking (a rental's or a hotel's).
export const TermsBox: React.FC<{ schedule: BookingSchedule; change: (patch: Partial<BookingSchedule>) => void; guess: keyof typeof DEFAULT_TERMS; kinds: [keyof typeof DEFAULT_TERMS, string][] }> = ({ schedule: s, change, guess, kinds }) => (
      <div className="space-y-2 rounded-2xl border border-neutral-200 p-3">
        <Toggle checked={s.termsOn} onChange={(termsOn) => change({ termsOn, terms: termsOn && !s.terms.trim() ? DEFAULT_TERMS[guess] : s.terms })} label="الموافقة على الشروط قبل الحجز" />
        <div className="text-xs text-neutral-400 font-bold">الزبون بيقرأ الشروط وبيضغط «أوافق» قبل ما يحجز. بينحفظ مع الحجز النص اللي وافق عليه ووقت موافقته، وبيوصله بالإيميل.</div>
        {s.termsOn && (
          <>
            <textarea className={`${textareaClass} min-h-[180px]`} value={s.terms} maxLength={5000} onChange={(e) => change({ terms: e.target.value })} />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-neutral-400 ml-1">رجّع النص الجاهز:</span>
              {kinds.map(([kind, label]) => (
                <GhostButton key={kind} onClick={() => (!s.terms.trim() || window.confirm('تبديل نص الشروط بالنص الجاهز؟')) && change({ terms: DEFAULT_TERMS[kind] })}>{label}</GhostButton>
              ))}
            </div>
          </>
        )}
      </div>
);

export const RentalScheduleEditor: React.FC<RentalScheduleEditorProps> = ({ schedule: s, change, fromWarehouse }) => {
  const units = s.rooms.map((r) => ({ ...r, ...normalizeUnit(r) })) as Unit[];
  const setUnit = (i: number, patch: Partial<Unit>) => change({ rooms: units.map((u, j) => (j === i ? { ...u, ...patch } : u)) });
  const hourly = units.some((u) => u.byHour);
  // The ready terms to start with, from what is rented (the owner picks another below).
  const guess: keyof typeof DEFAULT_TERMS = units.length && units.every((u) => u.item.startsWith('car')) ? 'cars' : units.some((u) => /صال|قاع|ملعب/.test(u.name)) ? 'halls' : 'other';
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-xs font-bold text-neutral-500">
          {fromWarehouse ? 'العناصر والسيارات الظاهرة بالمستودع' : 'الوحدات اللي بيقدر الزبون يأجرها'}: {units.length}. اضغط على وحدة لتحدد كيف بتتأجر وسعرها.
        </div>
        {units.length === 0 && fromWarehouse && <div className="text-xs font-bold text-[#A34A00]">لسا ما في عناصر ظاهرة. أضف سيارة أو عنصر من الإدارة، وبيظهر هون لحاله.</div>}
        {units.map((u, i) => (
          <UnitEditor key={u.id} unit={u} fromWarehouse={fromWarehouse && !!u.item} set={(patch) => setUnit(i, patch)} remove={u.item ? undefined : () => change({ rooms: units.filter((_, j) => j !== i) })} />
        ))}
        {!fromWarehouse && (
          <GhostButton onClick={() => change({ rooms: [...units, { id: newRoomId(), name: '', capacity: 1, price: '', photo: '', ...normalizeUnit({}) }] })}>
            <span className="inline-flex items-center gap-1"><Plus size={13} /> أضف وحدة</span>
          </GhostButton>
        )}
      </div>

      {hourly && (
        <Field label="ساعات التأجير بالساعة" hint="الحجز بالساعة بيكون ضمن هالساعات">
          <div className="flex items-center gap-2" dir="ltr">
            <input type="time" className={`${inputFitClass} w-32`} value={s.workStart} onChange={(e) => change({ workStart: e.target.value })} />
            <span className="text-neutral-400">–</span>
            <input type="time" className={`${inputFitClass} w-32`} value={s.workEnd} onChange={(e) => change({ workEnd: e.target.value })} />
          </div>
        </Field>
      )}

      <Field label="الخدمات المرافقة" hint="الزبون بيختارها وقت الحجز وبتنضاف للمجموع والعربون">
        <ExtrasEditor extras={s.extras} units={units} onChange={(extras) => change({ extras })} />
      </Field>

      <TermsBox schedule={s} change={change} guess={guess} kinds={TERMS_KINDS} />
    </div>
  );
};

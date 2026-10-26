// «طريقة التأجير» in the price step of the item entry (Eyad, 26 Oct): one way, by the day, the hour or a period (fixed dates, a
// number of days, hours of the day), with when it is available and the special prices. The choice is kept with the entry and
// written to the page's rental schedule when the item is saved, so a new item (not in the warehouse yet) is covered too.
import React, { useContext, useEffect, useRef, useState } from 'react';
import { BookingPageContext } from '../../services/bookings';
import { newRentalSchedule, saveBookingSettings, useBookingSettings } from '../../services/bookingSettings';
import { minOf, newRentalId, normalizeRentalRooms, normalizeUnit, unitIdOf, timeOf, unitOf, type RentalPeriod, type RentalUnit } from '../../services/rentalBooking';
import { Trash2 } from 'lucide-react';
import { AvailabilityEditor, SpecialPrices, chip } from '../pageAdmin/RentalScheduleEditor';
import { inputFitClass } from '../shop/adminUi';

type Room = { id: string; item?: string };

export type RentMode = 'day' | 'hour' | 'period';
/** The one way a unit is rented by (a unit with several ways counts as the day). */
export const modeOf = (u: RentalUnit): RentMode => (!u.byDay && !u.byHour ? 'period' : u.byHour && !u.byDay && u.periods.length === 0 ? 'hour' : 'day');

/** The rental settings of one item: the draft being edited, and `commit` to write it when the item is saved. */
export const useItemUnit = (itemId: string, price: number, currency: string) => {
  const page = useContext(BookingPageContext);
  const settings = useBookingSettings(page?.owner, page?.project);
  const [draft, setDraft] = useState<RentalUnit | null>(null);
  const latest = useRef(settings);
  latest.current = settings;
  // Another item starts from its own settings.
  useEffect(() => setDraft(null), [itemId]);
  const list = settings?.schedules || [];
  const current = list.find((s) => s.type === 'stay' && s.rental);
  const existing = (current?.rooms as Room[] | undefined)?.find((r) => r.item === itemId);
  const unit: RentalUnit = draft || (existing ? unitOf(existing as never) : normalizeUnit({ byDay: true, dayPrice: price, fromPrice: price, currency }));

  const commit = async (name: string) => {
    const now = latest.current;
    if (!page || now === undefined) return;
    const schedules = now?.schedules || [];
    const base = schedules.find((s) => s.type === 'stay' && s.rental) || newRentalSchedule();
    const rooms = base.rooms as unknown as (Room & Record<string, unknown>)[];
    const old = rooms.find((r) => r.item === itemId);
    // The item's price is the price of the hour when it is rented by the hour.
    const target = draft || (old ? unitOf(old as never) : null);
    if (!target) return;
    const hourly = modeOf(target) === 'hour';
    if (!draft && !(hourly && target.hourPrice !== price)) return;
    const unitNow = hourly ? { ...target, hourPrice: price } : target;
    // A new item rents by the day at its price; an old one keeps the price the schedule has (the warehouse sync follows the item).
    const merged = { ...(old || { id: unitIdOf(itemId), name: name.slice(0, 60) || 'بدون اسم', capacity: 1, price: '', photo: '' }), ...unitNow, item: itemId, ...(old ? {} : { dayPrice: price, fromPrice: price, currency }) };
    const next = { ...base, rooms: normalizeRentalRooms(old ? rooms.map((r) => (r === old ? merged : r)) : [...rooms, merged]) };
    await saveBookingSettings(page.owner, page.project, {
      schedules: schedules.some((s) => s.id === base.id) ? schedules.map((s) => (s.id === base.id ? next : s)) : [...schedules, next],
      ...(now?.payments ? { payments: now.payments } : {}),
    });
  };
  return { ready: !!page && settings !== undefined, unit, change: (patch: Partial<RentalUnit>) => setDraft({ ...unit, ...patch }), commit };
};

// The rental part of the item's price step: the way it is rented by, when it is available, the special prices. Laid out in
// rows, not tables. The item's own price field above it is the price of the day, the hour or the period.
const row = 'flex flex-wrap items-center gap-2';
const label = 'text-xs font-bold text-neutral-500';

export const RentalPriceBlock: React.FC<{ item: ReturnType<typeof useItemUnit>; price: number; currency: string }> = ({ item, price, currency }) => {
  if (!item.ready) return <p className="text-xs text-neutral-400">جارٍ التحميل…</p>;
  const u = item.unit;
  const set = item.change;
  const mode = modeOf(u);
  const setMode = (m: RentMode) => {
    if (m === mode) return;
    set(m === 'day' ? { byDay: true, byHour: false, periods: [] } : m === 'hour' ? { byDay: false, byHour: true, periods: [], hourPrice: price } : { byDay: false, byHour: false, periods: [] });
  };
  const setPeriod = (i: number, patch: Partial<RentalPeriod>) => set({ periods: u.periods.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const addPeriod = (kind: 'time' | 'length' | 'dates') =>
    set({ periods: [...u.periods, { id: newRentalId('p'), name: '', ...(kind === 'time' ? {} : { kind }), start: 600, end: 900, ...(kind === 'length' ? { days: 7 } : {}), ...(kind === 'dates' ? { from: '', to: '' } : {}), price }] });
  const KIND: Record<string, string> = { time: 'ساعات', length: 'عدد أيام', dates: 'تواريخ' };
  return (
    <div className="space-y-3">
      <div className={row}>
        <span className={label}>طريقة التأجير:</span>
        {([['day', 'يوم'], ['hour', 'ساعة'], ['period', 'فترة']] as [RentMode, string][]).map(([m, text]) => (
          <button key={m} type="button" className={chip(mode === m)} onClick={() => setMode(m)}>{text}</button>
        ))}
        <span className="text-xs text-neutral-400">
          {mode === 'day' ? 'السعر أعلاه هو سعر اليوم.' : mode === 'hour' ? 'السعر أعلاه هو سعر الساعة.' : 'لكل فترة سعرها.'}
        </span>
      </div>

      {mode === 'hour' && (
        <div className={`${row} ${label}`}>
          <span>عدد الساعات بالحجز: من</span>
          <input type="number" min={1} max={24} className={`${inputFitClass} w-16`} value={u.minHours} onChange={(e) => set({ minHours: Math.min(24, Math.max(1, Number(e.target.value) || 1)) })} />
          <span>لـ</span>
          <input type="number" min={1} max={24} className={`${inputFitClass} w-16`} value={u.maxHours} onChange={(e) => set({ maxHours: Math.min(24, Math.max(1, Number(e.target.value) || 1)) })} />
          <span>ساعة</span>
        </div>
      )}

      {mode === 'period' && (
        <div className="space-y-1">
          {u.periods.map((p, i) => {
            const kind = p.kind || 'time';
            return (
              <div key={p.id} className={`${row} py-2 border-b border-neutral-100`}>
                <span className="h-9 px-3 rounded-xl bg-neutral-100 text-xs font-bold text-neutral-600 flex items-center">{KIND[kind]}</span>
                <input className={`${inputFitClass} w-32`} placeholder={kind === 'time' ? 'صباحية' : kind === 'length' ? 'أسبوع' : 'عطلة العيد'} value={p.name} maxLength={40} onChange={(e) => setPeriod(i, { name: e.target.value })} />
                {kind === 'time' && (
                  <span className="contents" dir="ltr">
                    <input type="time" className={`${inputFitClass} w-28`} value={timeOf(p.start % 1440)} onChange={(e) => e.target.value && setPeriod(i, { start: minOf(e.target.value) })} />
                    <span className="text-neutral-400">–</span>
                    <input type="time" className={`${inputFitClass} w-28`} value={timeOf(p.end % 1440)} onChange={(e) => setPeriod(i, { end: minOf(e.target.value) || 1440 })} />
                  </span>
                )}
                {kind === 'length' && (
                  <>
                    {([['أسبوع', 7], ['شهر', 30], ['سنة', 365]] as [string, number][]).map(([n, d]) => <button key={n} type="button" className={chip(p.days === d)} onClick={() => setPeriod(i, { days: d, name: p.name || n })}>{n}</button>)}
                    <input type="number" min={1} max={365} className={`${inputFitClass} w-20`} value={p.days || ''} onChange={(e) => setPeriod(i, { days: Math.min(365, Math.max(1, Number(e.target.value) || 1)) })} />
                    <span className={label}>يوم</span>
                  </>
                )}
                {kind === 'dates' && (
                  <span className="contents" dir="ltr">
                    <input type="date" className={`${inputFitClass} w-40`} value={p.from || ''} onChange={(e) => setPeriod(i, { from: e.target.value })} />
                    <span className="text-neutral-400">إلى</span>
                    <input type="date" className={`${inputFitClass} w-40`} min={p.from || undefined} value={p.to || ''} onChange={(e) => setPeriod(i, { to: e.target.value })} />
                  </span>
                )}
                <input type="number" min={0} className={`${inputFitClass} w-24`} placeholder="السعر" value={p.price || ''} onChange={(e) => setPeriod(i, { price: Math.max(0, Number(e.target.value) || 0) })} />
                <span className={label}>{currency}</span>
                <button type="button" aria-label="حذف" className="text-[#E03131] cursor-pointer mr-auto" onClick={() => set({ periods: u.periods.filter((_, j) => j !== i) })}><Trash2 size={15} /></button>
              </div>
            );
          })}
          {u.periods.length < 8 && (
            <div className={row}>
              <span className={label}>أضف فترة:</span>
              {(['dates', 'length', 'time'] as const).map((k) => <button key={k} type="button" className={chip(false)} onClick={() => addPeriod(k)}>+ {KIND[k]}</button>)}
            </div>
          )}
        </div>
      )}

      <AvailabilityEditor rules={u.avail} onChange={(avail) => set({ avail })} />
      {mode !== 'period' && <SpecialPrices prices={u.prices} onChange={(prices) => set({ prices })} currency={currency} byDay={mode === 'day'} byHour={mode === 'hour'} />}
    </div>
  );
};

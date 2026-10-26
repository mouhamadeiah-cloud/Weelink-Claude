// «طريقة التأجير», the stage of the item entry before the price (Eyad, 26 Oct): by the hour, the day, periods (hours, a week,
// a month, a year, fixed dates), all of them together if wanted, with the special prices. The choice is kept with the entry and
// written to the page's rental schedule when the item is saved, so a new item (not in the warehouse yet) is covered too.
import React, { useContext, useEffect, useRef, useState } from 'react';
import { BookingPageContext } from '../../services/bookings';
import { newRentalSchedule, saveBookingSettings, useBookingSettings } from '../../services/bookingSettings';
import { normalizeRentalRooms, normalizeUnit, unitIdOf, unitOf, type RentalUnit } from '../../services/rentalBooking';
import { AvailabilityEditor, NumberIn, PeriodsEditor, SpecialPrices, chip } from '../pageAdmin/RentalScheduleEditor';
import { inputFitClass } from '../shop/adminUi';

type Room = { id: string; item?: string };

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
    if (!page || !draft || now === undefined) return;
    const schedules = now?.schedules || [];
    const base = schedules.find((s) => s.type === 'stay' && s.rental) || newRentalSchedule();
    const rooms = base.rooms as unknown as (Room & Record<string, unknown>)[];
    const old = rooms.find((r) => r.item === itemId);
    // A new item rents by the day at its price; an old one keeps the price the schedule has (the warehouse sync follows the item).
    const merged = { ...(old || { id: unitIdOf(itemId), name: name.slice(0, 60) || 'بدون اسم', capacity: 1, price: '', photo: '' }), ...draft, item: itemId, ...(old ? {} : { dayPrice: price, fromPrice: price, currency }) };
    const next = { ...base, rooms: normalizeRentalRooms(old ? rooms.map((r) => (r === old ? merged : r)) : [...rooms, merged]) };
    await saveBookingSettings(page.owner, page.project, {
      schedules: schedules.some((s) => s.id === base.id) ? schedules.map((s) => (s.id === base.id ? next : s)) : [...schedules, next],
      ...(now?.payments ? { payments: now.payments } : {}),
    });
  };
  return { ready: !!page && settings !== undefined, unit, change: (patch: Partial<RentalUnit>) => setDraft({ ...unit, ...patch }), commit };
};

// The rental part of the item's price step (Eyad, 26 Oct): the day price, the hour price and the periods side by side,
// then when it can be rented, then the special prices. The day price is the item's own price.
export const RentalPriceBlock: React.FC<{ item: ReturnType<typeof useItemUnit>; dayPrice: number; onDayPrice: (n: number) => void; currency: string }> = ({ item, dayPrice, onDayPrice, currency }) => {
  if (!item.ready) return <p className="text-xs text-neutral-400">جارٍ التحميل…</p>;
  const u = item.unit;
  const set = item.change;
  // One way at least: the day when nothing else is on.
  const noOther = (day: boolean, hour: boolean) => !day && !hour && u.periods.length === 0;
  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-200 p-3 space-y-2">
          <button type="button" className={chip(u.byDay)} onClick={() => set({ byDay: !u.byDay || noOther(false, u.byHour) })}>باليوم</button>
          {u.byDay && <div><div className="text-xs font-bold text-neutral-500 mb-1">سعر اليوم</div><NumberIn value={dayPrice} onChange={onDayPrice} unit={currency} /></div>}
        </div>
        <div className="rounded-xl border border-neutral-200 p-3 space-y-2">
          <button type="button" className={chip(u.byHour)} onClick={() => set({ byHour: !u.byHour, byDay: u.byHour && !u.periods.length ? true : u.byDay })}>بالساعة</button>
          {u.byHour && (
            <>
              <div><div className="text-xs font-bold text-neutral-500 mb-1">سعر الساعة</div><NumberIn value={u.hourPrice} onChange={(hourPrice) => set({ hourPrice })} unit={currency} /></div>
              <div className="text-xs font-bold text-neutral-500 space-y-1">
                <div>عدد الساعات بالحجز</div>
                <span className="inline-flex items-center gap-1.5">
                  من <input type="number" min={1} max={24} className={`${inputFitClass} w-16`} value={u.minHours} onChange={(e) => set({ minHours: Math.min(24, Math.max(1, Number(e.target.value) || 1)) })} />
                  لـ <input type="number" min={1} max={24} className={`${inputFitClass} w-16`} value={u.maxHours} onChange={(e) => set({ maxHours: Math.min(24, Math.max(1, Number(e.target.value) || 1)) })} />
                </span>
              </div>
            </>
          )}
        </div>
        <div className="rounded-xl border border-neutral-200 p-3">
          <PeriodsEditor unit={{ periods: u.periods, currency }} set={(patch) => set({ ...patch, ...(patch.periods && patch.periods.length === 0 && !u.byHour ? { byDay: true } : {}) })} />
        </div>
      </div>
      <AvailabilityEditor rules={u.avail} onChange={(avail) => set({ avail })} />
      <SpecialPrices prices={u.prices} onChange={(prices) => set({ prices })} currency={currency} byDay={u.byDay} byHour={u.byHour} />
    </div>
  );
};

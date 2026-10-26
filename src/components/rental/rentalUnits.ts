// A rental project's units for booking: every shown car and item of its warehouse is a unit of the page's
// rental schedule («إعدادات الحجز»), kept in step by the admin (rentalBooking.ts mergeUnits). The owner
// sets how each one is rented (day, hour, period, driver, special prices) in «إعدادات الحجز».
import { useContext, useEffect, useMemo } from 'react';
import { BookingPageContext } from '../../services/bookings';
import { newRentalSchedule, saveBookingSettings, useBookingSettings, type BookingSettings } from '../../services/bookingSettings';
import { mergeUnits, normalizeRentalRooms, type WarehouseUnit } from '../../services/rentalBooking';
import { carTitle } from '../cars/carModel';
import type { RentalAdminData } from './rentalTypes';

export const warehouseUnits = (d: RentalAdminData): WarehouseUnit[] => [
  ...d.cars.cars
    .filter((c) => c.published && c.status !== 'sold')
    .map((c) => ({ item: c.id, name: `${carTitle(c)}${c.year ? ` ${c.year}` : ''}`, photo: c.images[0] || '', price: c.price || 0, currency: c.currency || '' })),
  ...d.shop.products.filter((p) => p.published).map((p) => ({ item: p.id, name: p.name, photo: p.images[0] || '', price: p.price || 0, currency: p.currency || '' })),
];

// The page's rental schedule with the warehouse's units: null when nothing changes.
export const syncedSettings = (settings: BookingSettings | null, units: WarehouseUnit[]): BookingSettings | null => {
  const list = settings?.schedules || [];
  const current = list.find((s) => s.type === 'stay' && s.rental);
  if (!current && units.length === 0) return null;
  const base = current || newRentalSchedule();
  const rooms = normalizeRentalRooms(mergeUnits(base.rooms, units));
  if (current && JSON.stringify(rooms) === JSON.stringify(current.rooms)) return null;
  const next = { ...base, rooms };
  return { schedules: current ? list.map((s) => (s.id === current.id ? next : s)) : [...list, next], ...(settings?.payments ? { payments: settings.payments } : {}) };
};

// Kept in step while the owner's admin is open: a moment after the warehouse changes.
export const useRentalUnitsSync = (data: RentalAdminData) => {
  const page = useContext(BookingPageContext);
  const settings = useBookingSettings(page?.owner, page?.project);
  const units = useMemo(() => warehouseUnits(data), [data.cars.cars, data.shop.products]);
  useEffect(() => {
    if (!page || settings === undefined) return;
    const next = syncedSettings(settings, units);
    if (!next) return;
    const t = window.setTimeout(() => saveBookingSettings(page.owner, page.project, next).catch((e) => console.warn('Could not update the rental units:', e)), 1200);
    return () => window.clearTimeout(t);
  }, [page?.owner, page?.project, settings, units]);
};

// A hotel's rooms for booking: every open room of the hotel is a room of the page's room stay schedule
// («إعدادات الحجز»), kept in step by the admin. The owner sets the rest of the stay (nights, hours,
// deposit) in «إعدادات الحجز»; the rooms themselves come from «الطوابق والغرف».
import { useContext, useEffect, useMemo } from 'react';
import { BookingPageContext } from '../../services/bookings';
import { newStaySchedule, saveBookingSettings, useBookingSettings, type BookingSettings } from '../../services/bookingSettings';
import { stayRoomsOf, type HotelAdminData } from './hotelTypes';

// The page's room stay schedule with the hotel's rooms: null when nothing changes.
export const syncedHotelSettings = (settings: BookingSettings | null, rooms: ReturnType<typeof stayRoomsOf>): BookingSettings | null => {
  const list = settings?.schedules || [];
  const current = list.find((s) => s.type === 'stay' && !s.rental);
  if (!current && rooms.length === 0) return null;
  const base = current || newStaySchedule();
  if (current && JSON.stringify(rooms) === JSON.stringify(current.rooms)) return null;
  const next = { ...base, rooms };
  return { schedules: current ? list.map((s) => (s.id === current.id ? next : s)) : [...list, next], ...(settings?.payments ? { payments: settings.payments } : {}) };
};

// Kept in step while the owner's admin is open: a moment after the rooms change.
export const useHotelRoomsSync = (data: HotelAdminData) => {
  const page = useContext(BookingPageContext);
  const settings = useBookingSettings(page?.owner, page?.project);
  const rooms = useMemo(() => stayRoomsOf(data), [data.rooms, data.floors, data.capacity, data.shop.products]);
  useEffect(() => {
    if (!page || settings === undefined) return;
    const next = syncedHotelSettings(settings, rooms);
    if (!next) return;
    const t = window.setTimeout(() => saveBookingSettings(page.owner, page.project, next).catch((e) => console.warn('Could not update the hotel rooms:', e)), 1200);
    return () => window.clearTimeout(t);
  }, [page?.owner, page?.project, settings, rooms]);
};

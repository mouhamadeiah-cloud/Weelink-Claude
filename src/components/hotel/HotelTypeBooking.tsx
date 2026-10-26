// «احجز إقامتك» on a room type's card (Eyad, 25 Oct, step 5 of «فندق»): the page's room stay booking
// (StayBookingWidget) limited to the rooms of this type. The visitor picks the nights and the guests,
// ticks the extras, accepts the terms, and the server gives them a free room of the type at its price.
import React, { useContext, useMemo, useState } from 'react';
import { BedDouble } from 'lucide-react';
import type { CanvasElement } from '../../types';
import { BookingPageContext } from '../../services/bookings';
import { useBookingSettings } from '../../services/bookingSettings';
import { StayBookingWidget } from '../StayBookingWidget';

// Does the page's stay schedule have rooms of this type? Then the card offers the booking.
export const useHotelTypeRooms = (typeId: string) => {
  const page = useContext(BookingPageContext);
  const settings = useBookingSettings(page?.owner, page?.project);
  return useMemo(() => {
    const schedule = settings?.schedules.find((s) => s.type === 'stay' && !s.rental) || null;
    return schedule ? schedule.rooms.filter((r) => (r as any).item === typeId).length : 0;
  }, [settings, typeId]);
};

export const HotelTypeBooking: React.FC<{ typeId: string; accent: string }> = ({ typeId, accent }) => {
  const rooms = useHotelTypeRooms(typeId);
  const [open, setOpen] = useState(false);
  const elem = useMemo(() => ({ id: `hotel-book-${typeId}`, type: 'calendar', calendarBookingType: 'stay', calendarAccentColor: accent, width: 560, height: 640, styles: { backgroundColor: '#ffffff' }, content: 'احجز إقامتك' }) as unknown as CanvasElement, [typeId, accent]);
  if (rooms === 0) return null;
  return (
    <div className="space-y-2">
      {!open && (
        <button type="button" onClick={() => setOpen(true)} className="w-full h-12 rounded-full text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer" style={{ backgroundColor: accent }}>
          <BedDouble size={18} /> احجز إقامتك
        </button>
      )}
      {open && <div className="h-[640px] max-h-[80vh]"><StayBookingWidget elem={elem} only={typeId} /></div>}
    </div>
  );
};

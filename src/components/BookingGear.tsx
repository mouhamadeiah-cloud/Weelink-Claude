// The owner's way from a booking element to «إعدادات الحجز» in the admin. Only the owner sees it (the
// context is null on the published page for visitors).
import React, { useContext } from 'react';
import { BookingSettingsOpenContext } from '../services/bookingSettings';

export const BookingGear: React.FC<{ scheduleId: string }> = ({ scheduleId }) => {
  const openSettings = useContext(BookingSettingsOpenContext);
  if (!openSettings) return null;
  return (
    <button
      type="button"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); openSettings(scheduleId); }}
      className="absolute top-3 left-3 z-10 h-7 px-2 rounded-lg bg-ink/85 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm hover:bg-ink cursor-pointer"
      title="إعدادات الحجز بالإدارة"
    >
      <span aria-hidden>⚙</span> إعدادات الحجز
    </button>
  );
};

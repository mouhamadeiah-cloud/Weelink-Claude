// In the editor, under a booking element's look settings: which schedule it books with, and the way
// to «إعدادات الحجز» in the admin, where the days, hours, length and confirmation now live.
import React, { useContext } from 'react';
import { BookingPageContext } from '../../services/bookings';
import { BookingSettingsOpenContext, scheduleFor, useBookingSettings } from '../../services/bookingSettings';

export const BookingSettingsLink: React.FC<{ elementScheduleId?: string; onPick: (id: string | undefined) => void }> = ({ elementScheduleId, onPick }) => {
  const page = useContext(BookingPageContext);
  const open = useContext(BookingSettingsOpenContext);
  const settings = useBookingSettings(page?.owner, page?.project);
  const list = settings?.schedules || [];
  const current = scheduleFor(settings ?? null, elementScheduleId);

  return (
    <div className="space-y-2 border-t border-blue-100/50 pt-2">
      <span className="text-xs font-bold text-neutral-800 block">أيام الدوام والساعات والمدة والتأكيد:</span>
      <p className="text-xs text-neutral-500 leading-relaxed">هالإعدادات صارت بالإدارة، مكان واحد لكل حجوزاتك. هون بتضبط الشكل والتسميات بس.</p>
      {list.length > 1 && (
        <label className="block space-y-1">
          <span className="text-xs text-neutral-500">الجدول اللي بيحجز عليه هالعنصر:</span>
          <select
            value={current?.id || ''}
            onChange={(e) => onPick(e.target.value === list[0].id ? undefined : e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white rounded-xl border border-neutral-300 text-xs font-semibold focus:outline-none"
          >
            {list.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      )}
      <button
        type="button"
        disabled={!open}
        onClick={() => open?.(current?.id)}
        className="w-full h-9 rounded-xl bg-ink text-white text-xs font-bold cursor-pointer disabled:opacity-40"
      >
        ⚙ افتح إعدادات الحجز بالإدارة
      </button>
    </div>
  );
};

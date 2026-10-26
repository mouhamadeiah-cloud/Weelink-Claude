// «جدول الغرف»: the hotel's rooms against the next days. A filled cell is a night a guest has the room
// (amber while the booking waits for the owner, blue once confirmed); the name shows on hover. Closed
// rooms are greyed. Read from the page's bookings (the room the server gave each stay).
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, EmptyState } from '../shop/adminUi';
import { Booking, BookingPageContext, dayKey, watchBookings } from '../../services/bookings';
import { addDays } from '../../services/stayBooking';
import type { HotelAdminData } from './hotelTypes';

const DAYS = 14;
const WEEK = ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

export const HotelGridTab: React.FC<{ data: HotelAdminData }> = ({ data }) => {
  const page = useContext(BookingPageContext);
  const [rows, setRows] = useState<Booking[] | null>(null);
  const [from, setFrom] = useState(() => dayKey(new Date()));

  useEffect(() => {
    if (!page) return;
    return watchBookings(page.owner, page.project, setRows, () => setRows([]));
  }, [page?.owner, page?.project]);

  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(from, i)), [from]);
  // room id → night → the booking that holds it
  const held = useMemo(() => {
    const m = new Map<string, Map<string, Booking>>();
    for (const b of rows || []) {
      if (!b.roomId || !b.checkOut || b.status === 'cancelled' || b.rental) continue;
      const mine = m.get(b.roomId) || new Map<string, Booking>();
      for (let d = b.date; d < b.checkOut; d = addDays(d, 1)) mine.set(d, b);
      m.set(b.roomId, mine);
    }
    return m;
  }, [rows]);

  const floorName = (id: string) => data.floors.find((f) => f.id === id)?.name || (data.floors.length ? 'بدون طابق' : 'الغرف');
  const groups = [...data.floors.map((f) => f.id), ''].map((id) => ({ id, rooms: data.rooms.filter((r) => r.floor === id) })).filter((g) => g.rooms.length > 0);
  const typeName = (id: string) => data.shop.products.find((p) => p.id === id)?.name || '';

  if (data.rooms.length === 0) return <Card title="جدول الغرف"><EmptyState text="أضف غرفاً من «الطوابق والغرف» لتظهر هون." /></Card>;

  return (
    <Card
      title="جدول الغرف"
      actions={
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setFrom(addDays(from, -DAYS))} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center cursor-pointer" aria-label="السابق"><ChevronRight size={16} /></button>
          <button type="button" onClick={() => setFrom(dayKey(new Date()))} className="h-8 px-2 rounded-lg hover:bg-neutral-100 text-xs font-bold cursor-pointer">اليوم</button>
          <button type="button" onClick={() => setFrom(addDays(from, DAYS))} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center cursor-pointer" aria-label="التالي"><ChevronLeft size={16} /></button>
        </div>
      }
    >
      {rows === null && <div className="text-xs font-bold text-neutral-400">جاري التحميل…</div>}
      <div className="overflow-x-auto" dir="rtl">
        <table className="text-xs border-separate border-spacing-0.5">
          <thead>
            <tr>
              <th className="sticky right-0 bg-white text-right font-bold text-neutral-500 pr-1 min-w-[7rem]"> </th>
              {days.map((d) => (
                <th key={d} className="font-bold text-neutral-500 w-9 text-center leading-tight">
                  <div>{Number(d.slice(8))}</div>
                  <div className="text-[9px] text-neutral-400">{WEEK[new Date(`${d}T12:00:00`).getDay()]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <React.Fragment key={g.id || 'none'}>
                <tr><td colSpan={DAYS + 1} className="pt-2 text-[11px] font-black text-neutral-500">{floorName(g.id)}</td></tr>
                {g.rooms.map((r) => (
                  <tr key={r.id}>
                    <td className="sticky right-0 bg-white pr-1 font-bold text-ink whitespace-nowrap">
                      {r.number} <span className="text-[10px] text-neutral-400 font-normal">{typeName(r.type)}</span>
                    </td>
                    {days.map((d) => {
                      const b = held.get(r.id)?.get(d);
                      return (
                        <td key={d} title={b ? `${b.name} · ${b.phone}` : r.closed ? 'خارج الخدمة' : ''}
                          className={`h-7 rounded ${b ? (b.status === 'new' ? 'bg-amber-300' : 'bg-brand') : r.closed ? 'bg-neutral-200' : 'bg-neutral-100'}`} />
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-neutral-500">
        <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded bg-neutral-100 border border-neutral-200" /> فاضية</span>
        <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded bg-amber-300" /> بانتظار التأكيد</span>
        <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded bg-brand" /> مؤكدة</span>
        <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded bg-neutral-200" /> خارج الخدمة</span>
      </div>
    </Card>
  );
};

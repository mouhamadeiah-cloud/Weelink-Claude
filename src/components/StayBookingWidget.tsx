// The «حجز غرف» element of a hotel or chalet page (Eyad, 25 Oct): the visitor picks the check-in and
// check-out dates and the number of guests, and the server gives them a free room for those nights.
// The rooms and the rules come from the page's «إعدادات الحجز» (a «إقامة» schedule).
import React, { useContext, useEffect, useMemo, useState } from 'react';
import type { CanvasElement } from '../types';
import { BookingPageContext, createBooking, dayKey, readRoomNights } from '../services/bookings';
import { newStaySchedule, scheduleFor, useBookingSettings } from '../services/bookingSettings';
import { addDays, chooseRoom, isRoomFree, maxGuests, nightsBetween, type RoomNights } from '../services/stayBooking';
import { useCustomerPrefill } from './customers/customerSession';

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const isDark = (bg: string) => {
  if (!bg.startsWith('#')) return false;
  const h = bg.length === 4 ? bg.slice(1).split('').map((c) => c + c).join('') : bg.slice(1);
  if (h.length !== 6) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return r * 0.299 + g * 0.587 + b * 0.114 < 140;
};

const label = (d: string) => `${Number(d.slice(8))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;

export const StayBookingWidget: React.FC<{ elem: CanvasElement }> = ({ elem }) => {
  const bookingPage = useContext(BookingPageContext);
  const live = !!bookingPage?.live;
  const settings = useBookingSettings(bookingPage?.owner, bookingPage?.project);
  const schedule = useMemo(() => scheduleFor(settings ?? null, elem.calendarScheduleId, 'stay') || newStaySchedule(), [settings, elem.calendarScheduleId]);
  const rooms = schedule.rooms;
  const accent = elem.calendarAccentColor || '#0071e3';
  const title = elem.calendarTitle || elem.content || 'احجز غرفتك';
  const bg = elem.styles.backgroundColor || '#ffffff';
  const dark = isDark(bg);
  const text = dark ? 'text-white' : 'text-neutral-800';
  const sub = dark ? 'text-white/80' : 'text-neutral-600';
  const field = `w-full rounded-lg border px-2.5 py-1.5 text-[11px] outline-none ${dark ? 'bg-white/10 border-white/25 text-white placeholder:text-white/50' : 'bg-white border-neutral-200 text-neutral-800'}`;

  const todayKey = dayKey(new Date());
  const lastKey = addDays(todayKey, schedule.daysAhead);
  const [month, setMonth] = useState(() => ({ y: new Date().getFullYear(), m: new Date().getMonth() }));
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [roomPick, setRoomPick] = useState('');
  const [occupancy, setOccupancy] = useState<RoomNights>({});
  const [tick, setTick] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [desc, setDesc] = useState('');
  useCustomerPrefill((c) => {
    setName((v) => v || c.name);
    setPhone((v) => v || c.phone);
    setEmail((v) => v || c.email);
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ room: string; status: string } | null>(null);

  const cap = Math.max(1, maxGuests(rooms));
  const guestCount = Math.min(guests, cap);
  const roomsKey = rooms.map((r) => r.id).join();

  // The nights already taken, room by room (on the published page).
  useEffect(() => {
    if (!live || !bookingPage || rooms.length === 0) return setOccupancy({});
    let alive = true;
    Promise.all(rooms.map((r) => readRoomNights(bookingPage.owner, bookingPage.project, schedule.id, r.id).then((n) => [r.id, n] as const)))
      .then((rows) => alive && setOccupancy(Object.fromEntries(rows)))
      .catch(() => alive && setOccupancy({}));
    return () => { alive = false; };
  }, [live, bookingPage?.owner, bookingPage?.project, schedule.id, roomsKey, tick]);

  const wishRoom = schedule.roomChoice === 'room' && rooms.some((r) => r.id === roomPick) ? roomPick : '';
  const roomFor = (nights: string[]) => (nights.length ? chooseRoom(rooms, occupancy, { guests: guestCount, nights, roomId: wishRoom || undefined }) : null);
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : [];
  const chosen = nights.length ? roomFor(nights) : null;
  const freeRooms = nights.length ? rooms.filter((r) => r.capacity >= guestCount && isRoomFree(occupancy[r.id], nights)) : [];

  // A date can start a stay when the first night has a room; end one when the stay is allowed and has a room.
  const canStart = (d: string) => d >= todayKey && d <= lastKey && !!roomFor([d]);
  const canEnd = (d: string) => {
    if (!checkIn || d <= checkIn) return false;
    const n = nightsBetween(checkIn, d);
    return n.length >= schedule.minNights && n.length <= schedule.maxNights && !!roomFor(n);
  };
  const pick = (d: string) => {
    setError('');
    if (!checkIn || checkOut) { setCheckIn(d); setCheckOut(''); return; }
    if (d <= checkIn) { setCheckIn(d); return; }
    if (canEnd(d)) setCheckOut(d);
  };

  const first = new Date(month.y, month.m, 1);
  const total = new Date(month.y, month.m + 1, 0).getDate();
  const cells = [...Array.from({ length: first.getDay() }, () => 0), ...Array.from({ length: total }, (_, i) => i + 1)];
  const keyOf = (n: number) => dayKey(new Date(month.y, month.m, n));
  const prevOk = month.y > new Date().getFullYear() || month.m > new Date().getMonth();
  const nextOk = new Date(month.y, month.m + 1, 1) <= new Date(lastKey);
  const step = (delta: number) => setMonth(({ y, m }) => { const d = new Date(y, m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!checkIn || !checkOut || !chosen) return setError('اختر تاريخ الوصول والمغادرة.');
    if (name.trim().length < 2 || phone.replace(/\D/g, '').length < 6) return setError('اكتب اسمك ورقم هاتفك (6 أرقام على الأقل).');
    if (live && !email.trim()) return setError('اكتب إيميلك ليوصلك تأكيد الحجز والتذكير.');
    if (!live || !bookingPage) return setDone({ room: chosen.name, status: 'new' });
    setSaving(true);
    const out = await createBooking({
      owner: bookingPage.owner, project: bookingPage.project, schedule: schedule.id, pageName: bookingPage.pageName,
      date: checkIn, startMin: 0, slot: `${nights.length}`, meetingType: '', checkOut, partySize: guestCount, room: wishRoom || undefined,
      name, phone, email, address: '', desc, needsConfirmation: schedule.needsConfirmation,
    } as any);
    setSaving(false);
    if ('error' in out) {
      if (out.error === 'taken') { setError('انحجزت الغرفة قبل لحظات. اختر تواريخ أو غرفة غيرها.'); setTick((n) => n + 1); setCheckOut(''); }
      else if (out.error === 'bad_email') setError('تأكد من الإيميل.');
      else if (out.error === 'no_rooms' || out.error === 'bad_schedule') setError('الحجز غير جاهز بعد: المالك لازم يضيف الغرف من «إعدادات الحجز».');
      else setError(`ما قدرنا نحفظ الحجز. جرّب مرة ثانية. (رمز: ${out.error})`);
      return;
    }
    setDone({ room: out.roomName || chosen.name, status: out.status });
    setTick((n) => n + 1);
  };

  const shell = 'w-full h-full rounded-2xl border p-4 flex flex-col text-right select-none overflow-y-auto';
  const shellStyle = { backgroundColor: bg, borderColor: dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.09)' };

  if (done) {
    return (
      <div className={`${shell} items-center justify-center text-center`} dir="rtl" style={shellStyle}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold mb-2" style={{ backgroundColor: accent }}>✓</div>
        <h4 className={`text-xs font-bold mb-1 ${text}`}>{done.status === 'confirmed' ? 'تم حجز غرفتك!' : 'وصل طلب الحجز!'}</h4>
        <p className={`text-[10px] max-w-xs leading-relaxed mb-3 ${sub}`}>
          شكراً <b>{name}</b>. {done.room} من <b>{label(checkIn)}</b> إلى <b>{label(checkOut)}</b> ({nights.length} {nights.length === 1 ? 'ليلة' : 'ليالٍ'}).
          {done.status !== 'confirmed' ? ' رح يوصلك إيميل لما يتأكد الحجز.' : ''}
        </p>
        <button type="button" onClick={() => { setDone(null); setCheckIn(''); setCheckOut(''); setName(''); setPhone(''); setEmail(''); setDesc(''); }} className="px-3.5 py-1.5 text-white rounded-lg text-[10px] font-bold cursor-pointer" style={{ backgroundColor: accent }}>حجز جديد</button>
      </div>
    );
  }

  return (
    <div className={shell} dir="rtl" style={shellStyle}>
      <div className="w-full h-1.5 shrink-0 rounded-t-xl mb-3" style={{ backgroundColor: accent }} />
      <div className="flex items-center gap-2.5 border-b pb-2.5 mb-3 shrink-0" style={{ borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)' }}>
        <div className="w-9 h-9 rounded-xl text-white flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: accent }}>🛏️</div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-black leading-snug ${text}`}>{title}</h3>
          <p className={`text-[10px] ${sub}`}>اختر تاريخ الوصول والمغادرة وعدد الضيوف</p>
        </div>
        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-lg ${schedule.needsConfirmation ? 'text-amber-800 bg-amber-50 border border-amber-200' : 'text-emerald-700 bg-emerald-50 border border-emerald-200'}`}>
          {schedule.needsConfirmation ? '⏳ تأكيد مطلوب' : '⚡ تأكيد فوري'}
        </span>
      </div>

      {rooms.length === 0 ? (
        <div className={`text-[11px] font-bold text-center py-8 ${sub}`}>لسا ما انضافت غرف. أضفها من «إعدادات الحجز» بالإدارة.</div>
      ) : (
        <form onSubmit={submit} className={`flex-1 min-h-0 ${!elem.width || elem.width >= 520 ? 'grid md:grid-cols-2 gap-4' : 'space-y-4'}`}>
          <div className={`rounded-2xl p-3 border space-y-2 ${dark ? 'bg-white/5 border-white/10' : 'bg-neutral-50/80 border-neutral-200/80'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10.5px] font-bold ${text}`}>{MONTHS[month.m]} {month.y}</span>
              <div className="flex gap-1">
                <button type="button" disabled={!prevOk} onClick={() => step(-1)} className={`w-6 h-6 rounded-md text-[10px] disabled:opacity-30 cursor-pointer ${text}`}>▶</button>
                <button type="button" disabled={!nextOk} onClick={() => step(1)} className={`w-6 h-6 rounded-md text-[10px] disabled:opacity-30 cursor-pointer ${text}`}>◀</button>
              </div>
            </div>
            <div className={`grid grid-cols-7 gap-1 text-center text-[9px] font-bold ${sub}`}>
              {['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'].map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((n, i) => {
                if (!n) return <div key={`e${i}`} />;
                const k = keyOf(n);
                const selecting = !!checkIn && !checkOut;
                const ok = selecting ? canEnd(k) || canStart(k) : canStart(k);
                const edge = k === checkIn || k === checkOut;
                const inside = !!checkIn && !!checkOut && k > checkIn && k < checkOut;
                return (
                  <button key={k} type="button" disabled={!ok && !edge} onClick={() => pick(k)}
                    className={`h-7 rounded-md text-[10px] font-bold cursor-pointer disabled:cursor-default disabled:opacity-30 ${edge ? 'text-white' : inside ? 'bg-black/10' : dark ? 'text-white/90 bg-white/5' : 'text-neutral-700 bg-white border border-neutral-200'}`}
                    style={edge ? { backgroundColor: accent } : undefined}>{n}</button>
                );
              })}
            </div>
            <div className={`text-[10px] font-bold ${sub}`}>
              {!checkIn ? 'اختر تاريخ الوصول' : !checkOut ? 'اختر تاريخ المغادرة' : `${label(checkIn)} ← ${label(checkOut)} · ${nights.length} ${nights.length === 1 ? 'ليلة' : 'ليالٍ'}`}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-[10.5px] font-bold ${text}`}>عدد الضيوف</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setGuests(Math.max(1, guestCount - 1)); setCheckOut(''); }} className={`w-6 h-6 rounded-md border text-xs font-bold cursor-pointer ${text}`}>−</button>
                <span className={`text-xs font-black w-5 text-center ${text}`}>{guestCount}</span>
                <button type="button" onClick={() => { setGuests(Math.min(cap, guestCount + 1)); setCheckOut(''); }} className={`w-6 h-6 rounded-md border text-xs font-bold cursor-pointer ${text}`}>+</button>
              </div>
            </div>
            {schedule.roomChoice === 'room' && (
              <div className="flex flex-wrap gap-1">
                {(nights.length ? freeRooms : rooms.filter((r) => r.capacity >= guestCount)).map((r) => (
                  <button key={r.id} type="button" onClick={() => setRoomPick(wishRoom === r.id ? '' : r.id)}
                    className={`px-2 h-7 rounded-lg border text-[10px] font-bold cursor-pointer ${wishRoom === r.id ? 'text-white' : text}`} style={wishRoom === r.id ? { backgroundColor: accent, borderColor: accent } : undefined}>
                    {r.name}{r.price ? ` · ${r.price}` : ''}
                  </button>
                ))}
              </div>
            )}
            {chosen && (
              <div className={`text-[10px] font-bold rounded-lg px-2.5 py-1.5 ${dark ? 'bg-white/10 text-white' : 'bg-neutral-50 text-neutral-700 border border-neutral-100'}`}>
                🛏️ {chosen.name} · تتسع {chosen.capacity}{chosen.price ? ` · ${chosen.price}` : ''}
              </div>
            )}
            <input className={field} placeholder="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={field} dir="ltr" placeholder="05xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className={field} dir="ltr" type="email" placeholder="name@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <textarea className={`${field} h-14 resize-none`} placeholder="ملاحظات (اختياري)" value={desc} onChange={(e) => setDesc(e.target.value)} />
            {error && <div className="text-[10px] font-bold text-red-600">{error}</div>}
            <button type="submit" disabled={saving} className="w-full py-2 rounded-xl text-white text-[11px] font-bold cursor-pointer disabled:opacity-60" style={{ backgroundColor: accent }}>
              {saving ? 'جاري الحجز…' : 'تأكيد حجز الغرفة'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

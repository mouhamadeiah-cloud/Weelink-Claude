// The «حجز مقاعد» element of a course, trip or event page (Eyad, 25 Oct): the visitor picks one of the
// upcoming sessions, the number of seats, and the server gives them the seats if they are still free.
// The sessions and the rules come from the page's «إعدادات الحجز» (a «مقاعد» schedule).
import React, { useContext, useEffect, useMemo, useState } from 'react';
import type { CanvasElement } from '../types';
import { BookingPageContext, createBooking, dayKey, readSessionTaken } from '../services/bookings';
import { newSeatsSchedule, scheduleFor, useBookingSettings } from '../services/bookingSettings';
import { dayPlus, openSessions, seatsLeft } from '../services/seatBooking';
import { timeLabel } from '../services/bookingGrid';
import { useCustomerPrefill } from './customers/customerSession';

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const label = (d: string) => `${Number(d.slice(8))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;

const isDark = (bg: string) => {
  if (!bg.startsWith('#')) return false;
  const h = bg.length === 4 ? bg.slice(1).split('').map((c) => c + c).join('') : bg.slice(1);
  if (h.length !== 6) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return r * 0.299 + g * 0.587 + b * 0.114 < 140;
};

export const SeatBookingWidget: React.FC<{ elem: CanvasElement }> = ({ elem }) => {
  const bookingPage = useContext(BookingPageContext);
  const live = !!bookingPage?.live;
  const settings = useBookingSettings(bookingPage?.owner, bookingPage?.project);
  const schedule = useMemo(() => scheduleFor(settings ?? null, elem.calendarScheduleId, 'seats') || newSeatsSchedule(), [settings, elem.calendarScheduleId]);
  const accent = elem.calendarAccentColor || '#0071e3';
  const title = elem.calendarTitle || elem.content || 'احجز مقعدك';
  const bg = elem.styles.backgroundColor || '#ffffff';
  const dark = isDark(bg);
  const text = dark ? 'text-white' : 'text-neutral-800';
  const sub = dark ? 'text-white/80' : 'text-neutral-600';
  const field = `w-full rounded-lg border px-2.5 py-1.5 text-[11px] outline-none ${dark ? 'bg-white/10 border-white/25 text-white placeholder:text-white/50' : 'bg-white border-neutral-200 text-neutral-800'}`;

  const today = dayKey(new Date());
  const sessions = useMemo(() => openSessions(schedule.sessions, today, dayPlus(today, schedule.daysAhead)), [schedule.sessions, schedule.daysAhead, today]);
  const sessionsKey = sessions.map((s) => s.id).join();
  const [taken, setTaken] = useState<Record<string, number>>({});
  const [tick, setTick] = useState(0);
  const [pick, setPick] = useState('');
  const [seats, setSeats] = useState(1);
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
  const [done, setDone] = useState<{ session: string; seats: number; status: string } | null>(null);

  // The seats already booked, session by session (on the published page).
  useEffect(() => {
    if (!live || !bookingPage || sessions.length === 0) return setTaken({});
    let alive = true;
    Promise.all(sessions.map((s) => readSessionTaken(bookingPage.owner, bookingPage.project, schedule.id, s.id).then((n) => [s.id, n] as const)))
      .then((rows) => alive && setTaken(Object.fromEntries(rows)))
      .catch(() => alive && setTaken({}));
    return () => { alive = false; };
  }, [live, bookingPage?.owner, bookingPage?.project, schedule.id, sessionsKey, tick]);

  const chosen = sessions.find((s) => s.id === pick) || null;
  const left = chosen ? seatsLeft(chosen, taken[chosen.id]) : 0;
  const most = Math.max(1, Math.min(schedule.maxSeatsPerBooking, left));
  const count = Math.min(seats, most);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!chosen) return setError('اختر الجلسة اللي بدك تحجز فيها.');
    if (left < 1) return setError('هالجلسة اكتملت.');
    if (name.trim().length < 2 || phone.replace(/\D/g, '').length < 6) return setError('اكتب اسمك ورقم هاتفك (6 أرقام على الأقل).');
    if (live && !email.trim()) return setError('اكتب إيميلك ليوصلك تأكيد الحجز والتذكير.');
    if (!live || !bookingPage) return setDone({ session: chosen.name, seats: count, status: 'new' });
    setSaving(true);
    const out = await createBooking({
      owner: bookingPage.owner, project: bookingPage.project, schedule: schedule.id, pageName: bookingPage.pageName,
      date: chosen.date, startMin: chosen.startMin, slot: chosen.name, meetingType: '', partySize: count, session: chosen.id,
      name, phone, email, address: '', desc, needsConfirmation: schedule.needsConfirmation,
    } as any);
    setSaving(false);
    if ('error' in out) {
      if (out.error === 'taken') { setError('انحجزت المقاعد قبل لحظات. جرّب عدداً أقل أو جلسة ثانية.'); setTick((n) => n + 1); }
      else if (out.error === 'bad_email') setError('تأكد من الإيميل.');
      else if (out.error === 'bad_session' || out.error === 'bad_date') { setError('هالجلسة ما عادت متاحة.'); setTick((n) => n + 1); setPick(''); }
      else if (out.error === 'bad_schedule') setError('الحجز غير جاهز بعد: المالك لازم يضيف الجلسات من «إعدادات الحجز».');
      else setError(`ما قدرنا نحفظ الحجز. جرّب مرة ثانية. (رمز: ${out.error})`);
      return;
    }
    setDone({ session: chosen.name, seats: count, status: out.status });
    setTick((n) => n + 1);
  };

  const shell = 'w-full h-full rounded-2xl border p-4 flex flex-col text-right select-none overflow-y-auto';
  const shellStyle = { backgroundColor: bg, borderColor: dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.09)' };

  if (done) {
    return (
      <div className={`${shell} items-center justify-center text-center`} dir="rtl" style={shellStyle}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold mb-2" style={{ backgroundColor: accent }}>✓</div>
        <h4 className={`text-xs font-bold mb-1 ${text}`}>{done.status === 'confirmed' ? 'تم حجز مقاعدك!' : 'وصل طلب الحجز!'}</h4>
        <p className={`text-[10px] max-w-xs leading-relaxed mb-3 ${sub}`}>
          شكراً <b>{name}</b>. {done.seats} {done.seats === 1 ? 'مقعد' : 'مقاعد'} في <b>{done.session}</b>.
          {done.status !== 'confirmed' ? ' رح يوصلك إيميل لما يتأكد الحجز.' : ''}
        </p>
        <button type="button" onClick={() => { setDone(null); setPick(''); setSeats(1); setName(''); setPhone(''); setEmail(''); setDesc(''); }} className="px-3.5 py-1.5 text-white rounded-lg text-[10px] font-bold cursor-pointer" style={{ backgroundColor: accent }}>حجز جديد</button>
      </div>
    );
  }

  return (
    <div className={shell} dir="rtl" style={shellStyle}>
      <div className="w-full h-1.5 shrink-0 rounded-t-xl mb-3" style={{ backgroundColor: accent }} />
      <div className="flex items-center gap-2.5 border-b pb-2.5 mb-3 shrink-0" style={{ borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)' }}>
        <div className="w-9 h-9 rounded-xl text-white flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: accent }}>🎟️</div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-black leading-snug ${text}`}>{title}</h3>
          <p className={`text-[10px] ${sub}`}>اختر الجلسة وعدد المقاعد</p>
        </div>
        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-lg ${schedule.needsConfirmation ? 'text-amber-800 bg-amber-50 border border-amber-200' : 'text-emerald-700 bg-emerald-50 border border-emerald-200'}`}>
          {schedule.needsConfirmation ? '⏳ تأكيد مطلوب' : '⚡ تأكيد فوري'}
        </span>
      </div>

      {sessions.length === 0 ? (
        <div className={`text-[11px] font-bold text-center py-8 ${sub}`}>{schedule.sessions.length === 0 ? 'لسا ما انضافت جلسات. أضفها من «إعدادات الحجز» بالإدارة.' : 'ما في جلسات قادمة حالياً.'}</div>
      ) : (
        <form onSubmit={submit} className={`flex-1 min-h-0 ${!elem.width || elem.width >= 520 ? 'grid md:grid-cols-2 gap-4' : 'space-y-4'}`}>
          <div className="space-y-1.5 overflow-y-auto">
            {sessions.map((s) => {
              const rest = seatsLeft(s, taken[s.id]);
              const on = s.id === pick;
              return (
                <button key={s.id} type="button" disabled={rest < 1} onClick={() => { setPick(s.id); setSeats(1); setError(''); }}
                  className={`w-full text-right rounded-xl border p-2.5 cursor-pointer disabled:cursor-default disabled:opacity-40 ${on ? 'text-white' : dark ? 'bg-white/5 border-white/15 text-white' : 'bg-white border-neutral-200 text-neutral-800'}`}
                  style={on ? { backgroundColor: accent, borderColor: accent } : undefined}>
                  <div className="text-[11px] font-black">{s.name}{s.price ? ` · ${s.price}` : ''}</div>
                  <div className={`text-[10px] font-bold ${on ? 'text-white/85' : sub}`}>{label(s.date)} · {timeLabel(s.startMin)}</div>
                  <div className={`text-[10px] font-bold ${on ? 'text-white/85' : rest <= 3 ? 'text-red-600' : sub}`}>{rest < 1 ? 'اكتملت المقاعد' : live ? `باقي ${rest} ${rest === 1 ? 'مقعد' : 'مقاعد'}` : `${s.seats} مقعد`}</div>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-[10.5px] font-bold ${text}`}>عدد المقاعد</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setSeats(Math.max(1, count - 1))} className={`w-6 h-6 rounded-md border text-xs font-bold cursor-pointer ${text}`}>−</button>
                <span className={`text-xs font-black w-5 text-center ${text}`}>{count}</span>
                <button type="button" onClick={() => setSeats(Math.min(most, count + 1))} className={`w-6 h-6 rounded-md border text-xs font-bold cursor-pointer ${text}`}>+</button>
              </div>
            </div>
            <input className={field} placeholder="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={field} dir="ltr" placeholder="05xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className={field} dir="ltr" type="email" placeholder="name@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <textarea className={`${field} h-14 resize-none`} placeholder="ملاحظات (اختياري)" value={desc} onChange={(e) => setDesc(e.target.value)} />
            {error && <div className="text-[10px] font-bold text-red-600">{error}</div>}
            <button type="submit" disabled={saving} className="w-full py-2 rounded-xl text-white text-[11px] font-bold cursor-pointer disabled:opacity-60" style={{ backgroundColor: accent }}>
              {saving ? 'جاري الحجز…' : 'تأكيد حجز المقاعد'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// «إعدادات الحجز» in every admin (Eyad, 24 Oct): how the business takes bookings, in one place for
// all its booking elements. Each schedule (جدول) has a type (an appointment now; tables later), the
// working days and hours, the break, the length of a booking, the confirmation, the ways to meet,
// and how far ahead and how soon a visitor may book. See services/bookingSettings.ts.
import React, { useContext, useEffect, useRef, useState } from 'react';
import { CalendarCog, Check, Plus, Trash2 } from 'lucide-react';
import {
  BookingLegacyContext, BookingSchedule, BookingSettingsFocusContext, BookingSettings, MAX_SCHEDULES, MEETING_TYPES, SlotInterval, WEEK_DAYS,
  SpecialistMode, TableChoice, RoomChoice, newSchedule, newSeatsSchedule, newStaySchedule, newTableSchedule, newScheduleId, normalizeSchedule, saveBookingSettings, useBookingSettings,
} from '../../services/bookingSettings';
import { BookingPageContext } from '../../services/bookings';
import { useTeam } from '../../services/team';
import { newRoomId } from '../../services/stayBooking';
import { usableWallets, type BookingPayments, type DepositType } from '../../services/bookingDeposit';
import { BookingPaymentsEditor } from './BookingPaymentsEditor';
import { MAX_SESSION_SEATS, dayPlus, newSessionId, type SeatSession } from '../../services/seatBooking';
import { useRestaurantTables } from '../../services/tableBookingData';
import type { ProjectKey } from '../../utils/projectKeys';
import { Field, GhostButton, inputClass, inputFitClass, PrimaryButton, Toggle } from '../shop/adminUi';

const DAY_NAMES: Record<string, string> = { sunday: 'الأحد', monday: 'الإثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت' };
const MEETING_NAMES: Record<string, string> = { personal: 'حضور شخصي', phone: 'مكالمة هاتفية', whatsapp: 'فيديو واتساب' };
const INTERVALS: { id: SlotInterval; label: string }[] = [
  { id: '10', label: '10 دقائق' },
  { id: '15', label: '15 دقيقة' },
  { id: '30', label: '30 دقيقة' },
  { id: '60', label: 'ساعة' },
  { id: 'day', label: 'موعد واحد باليوم' },
  { id: 'manual', label: 'مدة أخرى' },
];

interface BookingSettingsSectionProps {
  owner: string;
  project: ProjectKey;
  // The schedule to show first (the gear of a booking element opens its own).
  focus?: { schedule: string; n: number } | null;
}

// The last gear ask shown: the admin opened another way later doesn't jump to the settings again.
let shownFocus = 0;

const same = (a: BookingSchedule, b: BookingSchedule) => JSON.stringify(a) === JSON.stringify(b);

export const BookingSettingsSection: React.FC<BookingSettingsSectionProps> = ({ owner, project, focus }) => {
  const settings = useBookingSettings(owner, project);
  const team = useTeam(owner);
  const bookable = team.people.filter((p) => p.takesBookings && p.name);
  const legacy = useContext(BookingLegacyContext);
  const [activeId, setActiveId] = useState('main');
  const [draft, setDraft] = useState<BookingSchedule | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const migrated = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focus || focus.n <= shownFocus) return;
    shownFocus = focus.n;
    setActiveId(focus.schedule);
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focus?.n]);

  // A page made before 24 Oct: its element's settings become the page's first schedule, once.
  useEffect(() => {
    if (settings !== null || !legacy || migrated.current) return;
    migrated.current = true;
    saveBookingSettings(owner, project, { schedules: [normalizeSchedule(legacy, 'main')] })
      .then(() => setNote({ ok: true, text: 'نقلنا إعدادات جدولك من الصفحة لهون. من هلأ بتعدّلها من الإدارة.' }))
      .catch(() => { migrated.current = false; });
  }, [settings, legacy, owner, project]);

  const isRestaurant = project === 'restaurant' || project.startsWith('restaurant-');
  const tableHalls = useRestaurantTables(isRestaurant ? owner : null, project);
  const list: BookingSchedule[] = settings?.schedules || [newSchedule('main', 'المواعيد')];
  // A table element asks for 'table' before the restaurant has saved such a schedule: shown as a new one.
  const unsaved = activeId === 'table' && !list.some((s) => s.id === 'table') ? newTableSchedule() : activeId === 'stay' && !list.some((s) => s.id === 'stay') ? newStaySchedule() : activeId === 'seats' && !list.some((s) => s.id === 'seats') ? newSeatsSchedule() : null;
  const saved = unsaved || list.find((s) => s.id === activeId) || list[0];
  const current = draft && draft.id === saved.id ? draft : saved;
  const dirty = !settings || !!unsaved || !same(current, saved);

  useEffect(() => setDraft(null), [saved.id]);

  const change = (patch: Partial<BookingSchedule>) => {
    setNote(null);
    setDraft({ ...current, ...patch });
  };

  const write = async (next: BookingSettings, okText: string) => {
    setBusy(true);
    setNote(null);
    try {
      await saveBookingSettings(owner, project, next);
      setDraft(null);
      setNote({ ok: true, text: okText });
    } catch (e) {
      console.warn('Could not save the booking settings:', e);
      setNote({ ok: false, text: 'ما قدرنا نحفظ. تأكد من الإنترنت، وإنك صاحب الصفحة أو من فريق إدارتها.' });
    }
    setBusy(false);
  };

  const savePayments = async (payments: BookingPayments) => {
    try {
      await saveBookingSettings(owner, project, { schedules: list, payments });
      return true;
    } catch (e) {
      console.warn('Could not save the payment accounts:', e);
      return false;
    }
  };

  const save = () => {
    if (current.depositOn) {
      if (current.depositValue <= 0) return setNote({ ok: false, text: 'اكتب قيمة العربون.' });
      if (usableWallets(settings?.payments).length === 0) return setNote({ ok: false, text: 'فعّل حساب محفظة واحد على الأقل (تحت، في «حسابات الدفع للعربون») قبل ما تشغّل العربون.' });
    }
    if (current.type === 'seats') {
      if (current.sessions.length === 0) return setNote({ ok: false, text: 'أضف جلسة وحدة على الأقل.' });
      if (current.sessions.some((x) => !x.name.trim() || !x.date)) return setNote({ ok: false, text: 'اكتب اسماً وتاريخاً لكل جلسة.' });
      const exists = list.some((s) => s.id === current.id);
      return write({ schedules: !settings ? [current] : exists ? list.map((s) => (s.id === current.id ? current : s)) : [...list, current] }, 'انحفظت الإعدادات، والصفحة صارت تحجز فيها.');
    }
    if (current.type === 'stay') {
      if (current.rooms.length === 0) return setNote({ ok: false, text: 'أضف غرفة وحدة على الأقل.' });
      if (current.rooms.some((r) => !r.name.trim())) return setNote({ ok: false, text: 'اكتب اسماً لكل غرفة.' });
      if (current.minNights > current.maxNights) return setNote({ ok: false, text: 'أقل عدد ليالٍ لازم يكون أقل من أكثر عدد.' });
      const exists = list.some((s) => s.id === current.id);
      return write({ schedules: !settings ? [current] : exists ? list.map((s) => (s.id === current.id ? current : s)) : [...list, current] }, 'انحفظت الإعدادات، والصفحة صارت تحجز فيها.');
    }
    if (current.workStart >= current.workEnd) return setNote({ ok: false, text: 'نهاية الدوام لازم تكون بعد بدايته.' });
    if (current.breakStart && current.breakEnd && current.breakStart >= current.breakEnd) return setNote({ ok: false, text: 'نهاية الاستراحة لازم تكون بعد بدايتها.' });
    if (current.workingDays.length === 0) return setNote({ ok: false, text: 'اختر يوم عمل واحد على الأقل.' });
    if (current.type === 'table' && (current.partyMax < 1 || current.durationMinutes < 15)) return setNote({ ok: false, text: 'تأكد من مدة الحجز وأكبر عدد أشخاص.' });
    const exists = list.some((s) => s.id === current.id);
    const schedules = !settings ? [current] : exists ? list.map((s) => (s.id === current.id ? current : s)) : [...list, current];
    write({ schedules }, 'انحفظت الإعدادات، والصفحة صارت تحجز فيها.');
  };

  const addSchedule = () => {
    if (!settings || list.length >= MAX_SCHEDULES) return;
    const s = newSchedule(newScheduleId(), `جدول ${list.length + 1}`);
    write({ schedules: [...list, s] }, 'انضاف جدول جديد. اختاره لعنصر الحجز من المحرر.').then(() => setActiveId(s.id));
  };

  const removeSchedule = () => {
    if (!settings || current.id === 'main') return;
    if (!window.confirm(`حذف جدول «${saved.name}»؟ عناصر الحجز اللي بتستعمله بترجع للجدول الأول.`)) return;
    write({ schedules: list.filter((s) => s.id !== current.id) }, 'انحذف الجدول.').then(() => setActiveId('main'));
  };

  const toggleDay = (d: string) =>
    change({ workingDays: current.workingDays.includes(d) ? current.workingDays.filter((x) => x !== d) : WEEK_DAYS.filter((x) => x === d || current.workingDays.includes(x)) });
  const toggleMeeting = (m: string) => {
    const has = current.meetingTypes.includes(m);
    if (has && current.meetingTypes.length === 1) return;
    change({ meetingTypes: has ? current.meetingTypes.filter((x) => x !== m) : MEETING_TYPES.filter((x) => x === m || current.meetingTypes.includes(x)) });
  };
  const hasBreak = !!current.breakStart;

  const chip = (on: boolean) => `h-9 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${on ? 'bg-brand border-brand text-white' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`;

  const body = (
    <div className="space-y-4">
      {settings && (
        <div className="flex flex-wrap items-center gap-2">
          {list.map((s) => (
            <button key={s.id} type="button" onClick={() => setActiveId(s.id)} className={chip(s.id === current.id)}>{s.name}</button>
          ))}
          {list.length < MAX_SCHEDULES && (
            <button type="button" onClick={addSchedule} disabled={busy} className="h-9 px-3 rounded-xl border border-dashed border-neutral-300 text-xs font-bold text-neutral-500 hover:bg-neutral-50 inline-flex items-center gap-1 cursor-pointer">
              <Plus size={13} /> جدول جديد
            </button>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="اسم الجدول" hint="للتفريق بين الجداول، مثلاً «عيادة الأسنان» أو «الاستشارات»">
          <input className={inputClass} value={current.name} maxLength={60} onChange={(e) => change({ name: e.target.value })} />
        </Field>
        <Field label="نوع الحجز">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(current.type === 'appointment')} onClick={() => change({ type: 'appointment' })}>موعد</button>
            <button type="button" className={chip(current.type === 'stay')} onClick={() => change({ type: 'stay', specialists: 'none', meetingTypes: ['personal'], breakStart: '', breakEnd: '' })}>إقامة (غرف)</button>
            <button type="button" className={chip(current.type === 'seats')} onClick={() => change({ type: 'seats', specialists: 'none', meetingTypes: ['personal'], breakStart: '', breakEnd: '' })}>مقاعد (دورات/رحلات)</button>
            {isRestaurant && (
              <button type="button" className={chip(current.type === 'table')} onClick={() => change({ type: 'table', meetingTypes: ['personal'], specialists: 'none', interval: current.interval === 'day' ? '30' : current.interval })}>طاولة</button>
            )}
          </div>
        </Field>
      </div>

      {current.type !== 'stay' && current.type !== 'seats' && <Field label="أيام العمل">
        <div className="flex flex-wrap gap-1.5">
          {WEEK_DAYS.map((d) => (
            <button key={d} type="button" onClick={() => toggleDay(d)} className={chip(current.workingDays.includes(d))}>{DAY_NAMES[d]}</button>
          ))}
        </div>
      </Field>}

      {current.type !== 'stay' && current.type !== 'seats' && <div className="grid sm:grid-cols-2 gap-3">
        <Field label="ساعات الدوام">
          <div className="flex items-center gap-2" dir="ltr">
            <input type="time" className={`${inputFitClass} w-32`} value={current.workStart} onChange={(e) => change({ workStart: e.target.value })} />
            <span className="text-neutral-400">–</span>
            <input type="time" className={`${inputFitClass} w-32`} value={current.workEnd} onChange={(e) => change({ workEnd: e.target.value })} />
          </div>
        </Field>
        <Field label="الاستراحة">
          <Toggle checked={hasBreak} onChange={(v) => change(v ? { breakStart: '12:00', breakEnd: '13:00' } : { breakStart: '', breakEnd: '' })} label={hasBreak ? 'في استراحة' : 'بدون استراحة'} />
          {hasBreak && (
            <div className="flex items-center gap-2" dir="ltr">
              <input type="time" className={`${inputFitClass} w-32`} value={current.breakStart} onChange={(e) => change({ breakStart: e.target.value })} />
              <span className="text-neutral-400">–</span>
              <input type="time" className={`${inputFitClass} w-32`} value={current.breakEnd} onChange={(e) => change({ breakEnd: e.target.value })} />
            </div>
          )}
        </Field>
      </div>}

      {current.type === 'stay' && (
        <div className="space-y-3 rounded-2xl border border-neutral-200 p-3">
          <div className="text-xs font-bold text-neutral-500">الغرف اللي بيقدر الزبون يحجزها: {current.rooms.length}</div>
          {current.rooms.map((r, i) => (
            <div key={r.id} className="grid grid-cols-[1fr_90px_1fr_auto] gap-2 items-center">
              <input className={inputFitClass} placeholder="اسم الغرفة، مثلاً: غرفة 101" value={r.name} maxLength={60} onChange={(e) => change({ rooms: current.rooms.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
              <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-500">
                <input type="number" min={1} max={20} className={`${inputFitClass} w-14`} value={r.capacity} onChange={(e) => change({ rooms: current.rooms.map((x, j) => (j === i ? { ...x, capacity: Math.min(20, Math.max(1, Number(e.target.value) || 1)) } : x)) })} /> شخص
              </span>
              <input className={inputFitClass} placeholder="السعر (اختياري): 50$ / ليلة" value={r.price} maxLength={40} onChange={(e) => change({ rooms: current.rooms.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)) })} />
              <button type="button" aria-label="حذف الغرفة" className="text-[#E03131] cursor-pointer" onClick={() => change({ rooms: current.rooms.filter((_, j) => j !== i) })}><Trash2 size={15} /></button>
            </div>
          ))}
          <GhostButton onClick={() => change({ rooms: [...current.rooms, { id: newRoomId(), name: '', capacity: 2, price: '' }] })}><span className="inline-flex items-center gap-1"><Plus size={13} /> أضف غرفة</span></GhostButton>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="أقل عدد ليالٍ">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500">
                <input type="number" min={1} max={30} className={`${inputFitClass} w-24`} value={current.minNights} onChange={(e) => change({ minNights: Math.max(1, Number(e.target.value) || 1) })} /> ليلة
              </span>
            </Field>
            <Field label="أكثر عدد ليالٍ">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500">
                <input type="number" min={1} max={90} className={`${inputFitClass} w-24`} value={current.maxNights} onChange={(e) => change({ maxNights: Math.max(1, Number(e.target.value) || 1) })} /> ليلة
              </span>
            </Field>
          </div>
          <Field label="اختيار الغرفة" hint="بالتلقائي بتنعطى أصغر غرفة فاضية بتكفي عدد الضيوف">
            <div className="flex flex-wrap gap-1.5">
              {([['auto', 'تلقائي'], ['room', 'الزبون بيختار الغرفة']] as [RoomChoice, string][]).map(([id, label]) => (
                <button key={id} type="button" onClick={() => change({ roomChoice: id })} className={chip(current.roomChoice === id)}>{label}</button>
              ))}
            </div>
          </Field>
        </div>
      )}

      {current.type === 'seats' && (
        <div className="space-y-3 rounded-2xl border border-neutral-200 p-3">
          <div className="text-xs font-bold text-neutral-500">الجلسات اللي بيقدر الزبون يحجز فيها: {current.sessions.length}. اختر لكل وحدة منها «جلسة واحدة» أو «كورس» (من تاريخ لتاريخ). الحجز بيسكّر مع بداية الجلسة أو الكورس.</div>
          {current.sessions.map((x, i) => {
            const set = (patch: Partial<SeatSession>) => change({ sessions: current.sessions.map((y, j) => (j === i ? { ...y, ...patch } : y)) });
            const course = !!x.endDate;
            return (
              <div key={x.id} className="rounded-xl border border-neutral-200 p-2.5 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className={chip(!course)} onClick={() => set({ endDate: '' })}>جلسة واحدة</button>
                  <button type="button" className={chip(course)} onClick={() => set({ endDate: course ? x.endDate : dayPlus(x.date || new Date().toISOString().slice(0, 10), 7) })}>كورس (من تاريخ لتاريخ)</button>
                  <button type="button" aria-label="حذف" className="text-[#E03131] cursor-pointer mr-auto" onClick={() => change({ sessions: current.sessions.filter((_, j) => j !== i) })}><Trash2 size={15} /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_1fr_100px_1fr] gap-2 items-center">
                  <input className={`${inputFitClass} col-span-2 sm:col-span-1`} placeholder={course ? 'اسم الكورس، مثلاً: كورس الخياطة' : 'اسم الجلسة، مثلاً: رحلة الشاطئ'} value={x.name} maxLength={80} onChange={(e) => set({ name: e.target.value })} />
                  <label className="text-[10px] font-bold text-neutral-400">{course ? 'يبدأ' : 'التاريخ'}
                    <input type="date" dir="ltr" className={inputFitClass} value={x.date} onChange={(e) => set({ date: e.target.value, endDate: course && x.endDate <= e.target.value ? dayPlus(e.target.value, 7) : x.endDate })} />
                  </label>
                  {course ? (
                    <label className="text-[10px] font-bold text-neutral-400">ينتهي
                      <input type="date" dir="ltr" min={dayPlus(x.date, 1)} className={inputFitClass} value={x.endDate} onChange={(e) => set({ endDate: e.target.value > x.date ? e.target.value : dayPlus(x.date, 1) })} />
                    </label>
                  ) : <span />}
                  <label className="text-[10px] font-bold text-neutral-400">{course ? 'وقت اليوم' : 'الوقت'}
                    <input type="time" dir="ltr" className={inputFitClass} value={`${String(Math.floor(x.startMin / 60)).padStart(2, '0')}:${String(x.startMin % 60).padStart(2, '0')}`} onChange={(e) => { const [h, m] = e.target.value.split(':').map(Number); if (!Number.isNaN(h)) set({ startMin: h * 60 + (m || 0) }); }} />
                  </label>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-500">
                    <input type="number" min={1} max={MAX_SESSION_SEATS} className={`${inputFitClass} w-16`} value={x.seats} onChange={(e) => set({ seats: Math.min(MAX_SESSION_SEATS, Math.max(1, Number(e.target.value) || 1)) })} /> مقعد
                  </span>
                  <input className={`${inputFitClass} col-span-2 sm:col-span-5`} placeholder="السعر (اختياري): 25$ للشخص" value={x.price} maxLength={40} onChange={(e) => set({ price: e.target.value })} />
                </div>
              </div>
            );
          })}
          <GhostButton onClick={() => change({ sessions: [...current.sessions, { id: newSessionId(), name: '', endDate: '', date: new Date().toISOString().slice(0, 10), startMin: 600, seats: 10, price: '' }] })}><span className="inline-flex items-center gap-1"><Plus size={13} /> أضف جلسة</span></GhostButton>
          <Field label="أكثر عدد مقاعد بالحجز الواحد" hint="كم مقعد بيقدر الزبون يحجز بمرة وحدة">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500">
              <input type="number" min={1} max={50} className={`${inputFitClass} w-24`} value={current.maxSeatsPerBooking} onChange={(e) => change({ maxSeatsPerBooking: Math.min(50, Math.max(1, Number(e.target.value) || 1)) })} /> مقعد
            </span>
          </Field>
        </div>
      )}

      {current.type === 'table' && (
        <div className="space-y-3 rounded-2xl border border-neutral-200 p-3">
          <div className="text-xs font-bold text-neutral-500">الطاولات من «الصالات والطاولات»: {tableHalls.length} طاولة، {tableHalls.reduce((n, t) => n + t.seats, 0)} مقعد</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="مدة حجز الطاولة" hint="الطاولة بتنحجز للحزب هالمدة، وأوقات الحجز بتتوزع على هالمدة (مثلاً 90 دقيقة: 12:00، 1:30، 3:00)">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500">
                <input type="number" min={15} max={480} className={`${inputFitClass} w-24`} value={current.durationMinutes} onChange={(e) => change({ durationMinutes: Number(e.target.value) || 90 })} /> دقيقة
              </span>
            </Field>
            <Field label="أكبر عدد أشخاص أونلاين" hint="الأكبر بيتواصلوا معك مباشرة">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500">
                <input type="number" min={1} max={50} className={`${inputFitClass} w-24`} value={current.partyMax} onChange={(e) => change({ partyMax: Number(e.target.value) || 1 })} /> شخص
              </span>
            </Field>
          </div>
          <Field label="اختيار الطاولة" hint="بالتلقائي بتنعطى أصغر طاولة فاضية بتكفي عددهم">
            <div className="flex flex-wrap gap-1.5">
              {([['auto', 'تلقائي'], ['hall', 'الزبون بيختار الصالة'], ['table', 'الزبون بيختار الطاولة']] as [TableChoice, string][]).map(([id, label]) => (
                <button key={id} type="button" onClick={() => change({ tableChoice: id })} className={chip(current.tableChoice === id)}>{label}</button>
              ))}
            </div>
          </Field>
          {tableHalls.length === 0 && <div className="text-xs font-bold text-[#A34A00]">لسا ما في طاولات. أضفها من «الصالات والطاولات» وانشر الموقع، وبعدها بيقدر الزبون يحجز.</div>}
        </div>
      )}

      {current.type === 'appointment' && <Field label="مدة الموعد">
        <div className="flex flex-wrap items-center gap-1.5">
          {INTERVALS.filter((i) => current.type !== 'table' || i.id !== 'day').map((i) => (
            <button key={i.id} type="button" onClick={() => change({ interval: i.id })} className={chip(current.interval === i.id)}>{i.label}</button>
          ))}
          {current.interval === 'manual' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500">
              <input type="number" min={5} max={480} className={`${inputFitClass} w-20`} value={current.intervalMinutes} onChange={(e) => change({ intervalMinutes: Number(e.target.value) || 30 })} /> دقيقة
            </span>
          )}
        </div>
      </Field>}

      {current.type === 'appointment' && <Field
        label="الحجز مع مختص"
        hint={bookable.length ? `المختصين: ${bookable.map((p) => p.name).join('، ')}. كل واحد إلو أوقاته ولما يحجزه زبون بيوصله إيميل.` : 'أضف أشخاص من «فريق العمل» وفعّل «يستقبل حجوزات» عندهم، وبيظهروا هون.'}
      >
        <div className="flex flex-wrap gap-1.5">
          {([['none', 'بدون مختصين'], ['choose', 'الزبون بيختار'], ['first', 'أول مختص فاضي']] as [SpecialistMode, string][]).map(([id, label]) => (
            <button key={id} type="button" onClick={() => change({ specialists: id })} className={chip(current.specialists === id)}>{label}</button>
          ))}
        </div>
      </Field>}

      {current.type === 'appointment' && <Field label="طريقة اللقاء" hint="الزبون بيختار وحدة منها وقت الحجز">
        <div className="flex flex-wrap gap-1.5">
          {MEETING_TYPES.map((m) => (
            <button key={m} type="button" onClick={() => toggleMeeting(m)} className={chip(current.meetingTypes.includes(m))}>{MEETING_NAMES[m]}</button>
          ))}
        </div>
      </Field>}

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="الحجز لقدّام" hint="لكم يوم لقدّام بيقدر الزبون يحجز">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500">
            <input type="number" min={1} max={365} className={`${inputFitClass} w-24`} value={current.daysAhead} onChange={(e) => change({ daysAhead: Number(e.target.value) || 1 })} /> يوم
          </span>
        </Field>
        {current.type !== 'stay' && current.type !== 'seats' && <Field label="أقل وقت قبل الموعد" hint="مثلاً 2: ما حدا بيحجز موعد بعد أقل من ساعتين">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500">
            <input type="number" min={0} max={168} className={`${inputFitClass} w-24`} value={current.minNoticeHours} onChange={(e) => change({ minNoticeHours: Number(e.target.value) || 0 })} /> ساعة
          </span>
        </Field>}
      </div>

      <div className="space-y-3 rounded-2xl border border-neutral-200 p-3">
        <Toggle checked={current.depositOn} onChange={(depositOn) => change({ depositOn })} label="طلب عربون" />
        {current.depositOn && (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              {([['fixed', 'مبلغ ثابت'], ['percent', 'نسبة من السعر']] as [DepositType, string][]).map(([id, label]) => {
                const canPercent = current.type === 'seats' || current.type === 'stay';
                return <button key={id} type="button" disabled={id === 'percent' && !canPercent} onClick={() => change({ depositType: id })} className={`${chip(current.depositType === id)} disabled:opacity-40 disabled:cursor-default`}>{label}</button>;
              })}
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500">
                <input type="number" min={0} className={`${inputFitClass} w-28`} value={current.depositValue} onChange={(e) => change({ depositValue: Math.max(0, Number(e.target.value) || 0) })} /> {current.depositType === 'percent' ? '%' : 'للحجز الواحد'}
              </span>
            </div>
            <div className="text-xs text-neutral-400 font-bold">
              {current.type === 'seats' || current.type === 'stay'
                ? 'النسبة بتنحسب من السعر اللي كاتبه بالجلسة أو الغرفة (لازم يبدأ برقم، مثلاً «25$ للشخص») × المقاعد أو الليالي.'
                : 'المواعيد والطاولات ما إلها سعر، فالعربون مبلغ ثابت.'}
              {' '}الحجز بيضل «بانتظار العربون» لحد ما تأكده، وبيتحرر تلقائياً بعد 24 ساعة إذا ما تأكد.
            </div>
          </>
        )}
      </div>

      <BookingPaymentsEditor payments={settings?.payments} canSave={!!settings} onSave={savePayments} />

      <div className="rounded-2xl bg-neutral-50 p-3">
        <Toggle checked={current.needsConfirmation} onChange={(needsConfirmation) => change({ needsConfirmation })} label="الحجز بيحتاج تأكيدك" />
        <div className="text-xs text-neutral-400 font-bold">{current.needsConfirmation ? 'الحجز بيوصلك «بانتظار تأكيدك»، والزبون بيوصله إيميل لما تأكده.' : 'الحجز بيتأكد لحاله فوراً.'}</div>
      </div>

      {note && <div className={`text-xs font-bold ${note.ok ? 'text-[#2B8A3E]' : 'text-[#E03131]'}`}>{note.ok && <Check size={13} className="inline ml-1" />}{note.text}</div>}
      <div className="flex flex-wrap gap-2">
        <PrimaryButton onClick={save} disabled={busy || !dirty}>{busy ? 'جاري الحفظ…' : 'احفظ الإعدادات'}</PrimaryButton>
        {dirty && settings && <GhostButton onClick={() => { setDraft(null); setNote(null); }}>تراجع</GhostButton>}
        {settings && current.id !== 'main' && (
          <GhostButton className="text-[#E03131] mr-auto" onClick={removeSchedule} disabled={busy}>
            <span className="inline-flex items-center gap-1"><Trash2 size={13} /> حذف الجدول</span>
          </GhostButton>
        )}
      </div>
    </div>
  );

  const intro = 'هون بتحدد كيف بتستقبل الحجوزات: الأيام والساعات ومدة الموعد والتأكيد. كل عناصر «حجز مواعيد» بصفحتك بتشتغل بهالإعدادات، والمحرر بيضبط شكلها بس.';

  return (
    <section ref={rootRef} className={`rounded-2xl bg-white border border-neutral-200 p-4 space-y-3 scroll-mt-4`}>
      <div className="flex items-center gap-2 text-xs font-bold text-neutral-500"><CalendarCog size={15} /> إعدادات الحجز</div>
      <p className="text-xs text-neutral-500 leading-relaxed">{intro}</p>
      {settings === undefined ? <div className="text-xs text-neutral-400">…</div> : body}
    </section>
  );
};

// «إعدادات الحجز» as a tab of the shop, car showroom and restaurant admins.
export const BookingSettingsTab: React.FC<unknown> = () => {
  const page = useContext(BookingPageContext);
  const focus = useContext(BookingSettingsFocusContext);
  return page ? <BookingSettingsSection owner={page.owner} project={page.project} focus={focus} /> : null;
};

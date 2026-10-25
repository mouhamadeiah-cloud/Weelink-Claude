// «الجدول» in the admin's appointments: the day as a grid. Rows are the restaurant's tables or the team's
// people; the day's times run across. A booking is a coloured block with the customer's name (click it for the
// details, confirm or cancel); a free cell books directly for a customer who called or walked in.
import React, { useMemo, useState } from 'react';
import { CalendarCheck2, CalendarX2, ChevronLeft, ChevronRight, Loader2, Phone, X } from 'lucide-react';
import { Booking, BookingStatus, createOwnerBooking, dayKey } from '../../services/bookings';
import { BookingSchedule, scheduleFor, useBookingSettings } from '../../services/bookingSettings';
import { useRestaurantTables } from '../../services/tableBookingData';
import { stepOf } from '../../services/tableBooking';
import { useTeam } from '../../services/team';
import { personWorks } from '../../services/teamHours';
import { blockOf, bookingsOfDay, colorOf, gridSlots, slotText, timeLabel } from '../../services/bookingGrid';
import type { ProjectKey } from '../../utils/projectKeys';

const STATUS_LABEL: Record<BookingStatus, string> = { new: 'بانتظار التأكيد', confirmed: 'مؤكد', done: 'منجز', cancelled: 'ملغى' };
const failText: Record<string, string> = { taken: 'هذا الوقت صار محجوزًا.', bad_party: 'عدد الأشخاص أكبر من المسموح.', signed_out: 'سجّل الدخول من جديد.', offline: 'تأكد من الإنترنت.' };

interface Resource { id: string; name: string; note: string; color: string; works?: (date: string, startMin: number) => boolean; seats?: number }

interface Props {
  owner: string;
  project: ProjectKey;
  rows: Booking[];
  busy: string;
  onAct: (b: Booking, status: Exclude<BookingStatus, 'new'>) => void;
}

const shiftDay = (date: string, by: number) => {
  const [y, m, d] = date.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + by));
};

export const BookingGrid: React.FC<Props> = ({ owner, project, rows, busy, onAct }) => {
  const settings = useBookingSettings(owner, project);
  const team = useTeam(owner).people;
  const isRestaurant = project.startsWith('restaurant');
  const tables = useRestaurantTables(isRestaurant ? owner : null, project);
  const [date, setDate] = useState(dayKey(new Date()));
  const [scheduleId, setScheduleId] = useState('');
  const [personFilter, setPersonFilter] = useState('');
  const [open, setOpen] = useState<Booking | null>(null);
  const [cell, setCell] = useState<{ res: Resource; start: number } | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', party: 2 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const schedules = (settings?.schedules || []).filter((s) => s.type !== 'stay' && s.type !== 'seats');
  const schedule: BookingSchedule | undefined = schedules.find((s) => s.id === scheduleId) || scheduleFor(settings || null, undefined, isRestaurant ? 'table' : undefined) || schedules[0];
  const isTable = schedule?.type === 'table';
  const step = schedule ? (isTable ? Math.max(15, schedule.durationMinutes || 90) : stepOf(schedule.interval, schedule.intervalMinutes)) : 60;
  const duration = isTable ? step : step;
  const slots = useMemo(() => (schedule ? gridSlots(schedule.workStart, schedule.workEnd, step) : []), [schedule, step]);

  const resources: Resource[] = useMemo(() => {
    if (!schedule) return [];
    if (isTable) return tables.map((t, i) => ({ id: t.id, name: t.name, note: `${t.seats} مقاعد${t.hallName ? ` · ${t.hallName}` : ''}`, color: colorOf(i), seats: t.seats }));
    const people = team.filter((p) => p.takesBookings);
    if (schedule.specialists !== 'none' && people.length) return people.map((p, i) => ({ id: p.id, name: p.name, note: p.role, color: colorOf(i), works: (d: string, m: number) => personWorks(p, d, m) }));
    return [{ id: '', name: 'المواعيد', note: '', color: colorOf(0) }];
  }, [schedule, isTable, tables, team]);

  const shown = personFilter ? resources.filter((r) => r.id === personFilter) : resources;
  const day = useMemo(() => bookingsOfDay(rows, date, schedule?.id || 'main', (b) => (isTable ? b.tableId || '' : b.person || '')), [rows, date, schedule, isTable]);

  if (settings === undefined) return <Loader2 size={20} className="animate-spin text-neutral-400" />;
  if (!schedule) return <div className="rounded-xl bg-bg p-4 text-xs text-neutral-500 leading-relaxed">أضف إعدادات الحجز أولًا (من «إعدادات الحجز») ليظهر الجدول.</div>;
  if (isTable && tables.length === 0) return <div className="rounded-xl bg-bg p-4 text-xs text-neutral-500 leading-relaxed">أضف طاولات من «الصالات والطاولات» وانشر الموقع ليظهر جدول الطاولات.</div>;

  const startCell = (res: Resource, start: number) => {
    setCell({ res, start });
    setForm({ name: '', phone: '', party: Math.min(2, res.seats || 2) });
    setError('');
  };
  const save = async () => {
    if (!cell) return;
    setSaving(true);
    setError('');
    const out = await createOwnerBooking({
      owner, project, schedule: schedule.id, date, startMin: cell.start, slot: slotText(cell.start, duration),
      name: form.name, phone: form.phone,
      ...(isTable ? { tableId: cell.res.id, partySize: form.party } : cell.res.id ? { person: cell.res.id } : {}),
    });
    setSaving(false);
    if ('error' in out) setError(failText[out.error] || 'ما زبط الحجز. جرّب مرة ثانية.');
    else setCell(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-label="اليوم السابق" onClick={() => setDate(shiftDay(date, -1))} className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center cursor-pointer"><ChevronRight size={16} /></button>
        <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="h-8 px-2 rounded-lg border border-neutral-200 text-xs font-bold" />
        <button type="button" aria-label="اليوم التالي" onClick={() => setDate(shiftDay(date, 1))} className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center cursor-pointer"><ChevronLeft size={16} /></button>
        <button type="button" onClick={() => setDate(dayKey(new Date()))} className="h-8 px-3 rounded-lg bg-bg text-xs font-bold cursor-pointer">اليوم</button>
        {schedules.length > 1 && (
          <select value={schedule.id} onChange={(e) => { setScheduleId(e.target.value); setPersonFilter(''); }} className="h-8 px-2 rounded-lg border border-neutral-200 text-xs font-bold bg-white">
            {schedules.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        {resources.length > 1 && (
          <select value={personFilter} onChange={(e) => setPersonFilter(e.target.value)} className="h-8 px-2 rounded-lg border border-neutral-200 text-xs font-bold bg-white">
            <option value="">{isTable ? 'كل الطاولات' : 'كل العاملين'}</option>
            {resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        )}
      </div>

      {slots.length === 0 ? (
        <div className="text-xs text-neutral-500">ضبط أوقات الدوام في «إعدادات الحجز» ليظهر الجدول.</div>
      ) : (
        <div className="overflow-x-auto pb-1">
          <div className="grid gap-px bg-neutral-200 rounded-xl overflow-hidden border border-neutral-200" style={{ gridTemplateColumns: `120px repeat(${slots.length}, minmax(56px, 1fr))`, minWidth: 120 + slots.length * 60 }}>
            <div className="bg-bg" />
            {slots.map((s) => <div key={s} className="bg-bg text-[11px] font-bold text-neutral-500 text-center py-1.5" dir="rtl">{timeLabel(s)}</div>)}
            {shown.map((r, ri) => {
              const mine = day[r.id] || [];
              return (
                <React.Fragment key={r.id || 'all'}>
                  <div className="bg-white p-2 flex flex-col justify-center" style={{ gridRow: ri + 2, gridColumn: 1, borderRight: `4px solid ${r.color}` }}>
                    <div className="text-xs font-black text-ink truncate">{r.name}</div>
                    {r.note && <div className="text-[11px] text-neutral-500 truncate">{r.note}</div>}
                  </div>
                  {slots.map((s, si) => {
                    const covered = mine.some((b) => { const bl = blockOf(slots, step, b.startMin, b.durationMin || duration); return bl && si >= bl.from && si < bl.from + bl.span; });
                    if (covered) return <div key={s} className="bg-white" style={{ gridRow: ri + 2, gridColumn: si + 2 }} />;
                    const off = r.works ? !r.works(date, s) : false;
                    return (
                      <button key={s} type="button" disabled={off} aria-label={`احجز ${r.name} ${timeLabel(s)}`} onClick={() => startCell(r, s)} style={{ gridRow: ri + 2, gridColumn: si + 2 }}
                        className={`min-h-[44px] ${off ? 'bg-neutral-100 cursor-not-allowed' : 'bg-white hover:bg-brand/10 cursor-pointer'}`} />
                    );
                  })}
                  {mine.map((b) => {
                    const bl = blockOf(slots, step, b.startMin, b.durationMin || duration);
                    if (!bl) return null;
                    return (
                      <button key={b.id} type="button" onClick={() => setOpen(b)} style={{ gridRow: ri + 2, gridColumn: `${bl.from + 2} / span ${bl.span}`, background: r.color, opacity: b.status === 'new' ? 0.7 : 1 }}
                        className="m-0.5 rounded-lg text-white text-[11px] font-black px-1.5 py-1 text-right overflow-hidden cursor-pointer border-2 border-transparent hover:border-ink">
                        <div className="truncate">{b.name}</div>
                        {b.partySize ? <div className="font-bold opacity-90">{b.partySize} أشخاص</div> : null}
                        {b.status === 'new' && <div className="font-bold opacity-90">بانتظار</div>}
                      </button>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
      <div className="text-[11px] text-neutral-400">انقر خانة فارغة لتحجز لزبون اتصل أو حضر، أو انقر حجزًا لتفاصيله.</div>

      {open && (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2"><div className="flex-1 text-sm font-black">{open.name}</div><button type="button" aria-label="إغلاق" onClick={() => setOpen(null)} className="cursor-pointer"><X size={16} /></button></div>
            <div className="text-xs font-bold text-neutral-600">{open.date} · {open.slot} · {STATUS_LABEL[open.status]}</div>
            {open.tableName && <div className="text-xs font-bold text-brand">🍽️ {open.partySize} أشخاص · {open.tableName}</div>}
            {open.personName && <div className="text-xs font-bold text-brand">مع {open.personName}</div>}
            {open.phone && <a href={`tel:${open.phone}`} className="text-xs font-bold text-neutral-600 flex items-center gap-1" dir="ltr"><Phone size={12} />{open.phone}</a>}
            {open.desc && <div className="text-xs text-neutral-600">{open.desc}</div>}
            {(open.status === 'new' || open.status === 'confirmed') && (
              <div className="flex gap-1.5 pt-1">
                {busy === open.id ? <Loader2 size={18} className="animate-spin text-neutral-400 m-2" /> : (
                  <>
                    {open.status === 'new' && <button type="button" onClick={() => { onAct(open, 'confirmed'); setOpen(null); }} className="h-8 px-3 rounded-lg bg-brand text-white text-xs font-bold flex items-center gap-1 cursor-pointer"><CalendarCheck2 size={14} /> تأكيد</button>}
                    <button type="button" onClick={() => { onAct(open, 'cancelled'); setOpen(null); }} className="h-8 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold flex items-center gap-1 cursor-pointer"><CalendarX2 size={14} /> إلغاء</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {cell && (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4" onClick={() => !saving && setCell(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2"><div className="flex-1 text-sm font-black">حجز جديد · {cell.res.name}</div><button type="button" aria-label="إغلاق" onClick={() => setCell(null)} className="cursor-pointer"><X size={16} /></button></div>
            <div className="text-xs font-bold text-neutral-600">{date} · {slotText(cell.start, duration)}</div>
            <input className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-sm" placeholder="اسم الزبون" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-sm" placeholder="الهاتف (اختياري)" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            {isTable && (
              <label className="flex items-center gap-2 text-xs font-bold text-neutral-600">عدد الأشخاص
                <input className="w-16 h-8 px-2 rounded-lg border border-neutral-200 text-sm" type="number" min={1} max={cell.res.seats || 50} value={form.party} onChange={(e) => setForm({ ...form, party: Math.max(1, Math.min(cell.res.seats || 50, parseInt(e.target.value, 10) || 1)) })} />
              </label>
            )}
            {error && <div className="text-xs font-bold text-red-600">{error}</div>}
            <button type="button" disabled={saving || form.name.trim().length < 2} onClick={save} className="h-9 w-full rounded-lg bg-brand text-white text-xs font-bold disabled:opacity-50 cursor-pointer">{saving ? 'جارٍ الحجز…' : 'احجز وأكّد'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

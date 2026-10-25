// A team person's shift rota: a cycle of one or two weeks, each day with one shift (more can be added),
// and dates that differ from the cycle (a day off, or other hours). See services/teamHours.ts.
import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DAYS, MAX_SHIFTS, type Shift, type WorkRota } from '../../services/teamHours';
import { inputClass } from '../shop/adminUi';

const DAY_NAMES: Record<string, string> = { sunday: 'الأحد', monday: 'الإثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت' };
const DEFAULT_SHIFT: Shift = { start: '09:00', end: '17:00' };
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// A new rota from the person's simple days and hours (or 9–17 on weekdays when they have none).
export const rotaFrom = (days: string[], start: string, end: string): WorkRota => {
  const shift = { start: start || DEFAULT_SHIFT.start, end: end && end > (start || DEFAULT_SHIFT.start) ? end : DEFAULT_SHIFT.end };
  const on = days.length ? days : ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
  return { weeks: 1, anchor: today(), plan: [Object.fromEntries(DAYS.map((d) => [d, on.includes(d) ? [shift] : []]))], exceptions: {} };
};

const ShiftsRow: React.FC<{ shifts: Shift[]; onChange: (s: Shift[]) => void }> = ({ shifts, onChange }) => (
  <div className="flex flex-wrap items-center gap-2" dir="ltr">
    {shifts.map((s, i) => (
      <span key={i} className="inline-flex items-center gap-1">
        <input type="time" className={`${inputClass} w-28`} value={s.start} onChange={(e) => onChange(shifts.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} />
        <span className="text-neutral-400">–</span>
        <input type="time" className={`${inputClass} w-28`} value={s.end} onChange={(e) => onChange(shifts.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} />
        {shifts.length > 1 && <button type="button" aria-label="احذف الوردية" className="text-neutral-400 hover:text-[#E03131] cursor-pointer" onClick={() => onChange(shifts.filter((_, j) => j !== i))}><Trash2 size={13} /></button>}
      </span>
    ))}
    {shifts.length < MAX_SHIFTS && (
      <button type="button" className="text-xs font-bold text-brand inline-flex items-center gap-0.5 cursor-pointer" dir="rtl" onClick={() => onChange([...shifts, { start: shifts.length ? shifts[shifts.length - 1].end : '16:00', end: '20:00' }])}>
        <Plus size={12} /> وردية
      </button>
    )}
  </div>
);

export const PersonRotaEditor: React.FC<{ rota: WorkRota; onChange: (r: WorkRota) => void }> = ({ rota, onChange }) => {
  const [week, setWeek] = useState(0);
  const [newDate, setNewDate] = useState('');
  const current = rota.plan[Math.min(week, rota.weeks - 1)];
  const setDay = (day: string, shifts: Shift[]) => onChange({ ...rota, plan: rota.plan.map((p, i) => (i === Math.min(week, rota.weeks - 1) ? { ...p, [day]: shifts } : p)) });
  const setWeeks = (weeks: 1 | 2) => {
    setWeek(0);
    onChange({ ...rota, weeks, plan: weeks === 1 ? rota.plan.slice(0, 1) : [...rota.plan, rota.plan[0]].slice(0, 2) });
  };
  const exceptions = Object.entries(rota.exceptions).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-neutral-600">
        <span>الدورة:</span>
        {([1, 2] as const).map((w) => (
          <button key={w} type="button" onClick={() => setWeeks(w)} className={`h-8 px-3 rounded-xl border cursor-pointer ${rota.weeks === w ? 'bg-brand border-brand text-white' : 'bg-white border-neutral-200'}`}>{w === 1 ? 'أسبوع' : 'أسبوعان'}</button>
        ))}
        {rota.weeks === 2 && (
          <span className="inline-flex items-center gap-1 mr-2">
            {[0, 1].map((i) => <button key={i} type="button" onClick={() => setWeek(i)} className={`h-8 px-3 rounded-xl border cursor-pointer ${week === i ? 'bg-ink border-ink text-white' : 'bg-white border-neutral-200'}`}>الأسبوع {i + 1}</button>)}
          </span>
        )}
      </div>
      {rota.weeks === 2 && (
        <label className="flex flex-wrap items-center gap-2 text-xs font-bold text-neutral-500">
          الأسبوع الأول يبدأ في الأسبوع الذي فيه
          <input type="date" className={`${inputClass} w-40`} value={rota.anchor} onChange={(e) => e.target.value && onChange({ ...rota, anchor: e.target.value })} />
        </label>
      )}
      <div className="space-y-1.5">
        {DAYS.map((d) => {
          const shifts = current[d] || [];
          const on = shifts.length > 0;
          return (
            <div key={d} className="flex flex-wrap items-center gap-2">
              <label className="w-24 flex items-center gap-1.5 text-xs font-bold text-ink cursor-pointer">
                <input type="checkbox" checked={on} onChange={(e) => setDay(d, e.target.checked ? [DEFAULT_SHIFT] : [])} />
                {DAY_NAMES[d]}
              </label>
              {on ? <ShiftsRow shifts={shifts} onChange={(s) => setDay(d, s)} /> : <span className="text-xs text-neutral-400">إجازة</span>}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-white border border-neutral-200 p-2 space-y-2">
        <div className="text-xs font-black text-ink">أيام استثنائية</div>
        {exceptions.map(([date, shifts]) => (
          <div key={date} className="flex flex-wrap items-center gap-2">
            <span className="w-28 text-xs font-bold text-neutral-600" dir="ltr">{date}</span>
            <label className="flex items-center gap-1 text-xs font-bold cursor-pointer">
              <input type="checkbox" checked={shifts.length === 0} onChange={(e) => onChange({ ...rota, exceptions: { ...rota.exceptions, [date]: e.target.checked ? [] : [DEFAULT_SHIFT] } })} /> إجازة
            </label>
            {shifts.length > 0 && <ShiftsRow shifts={shifts} onChange={(s) => onChange({ ...rota, exceptions: { ...rota.exceptions, [date]: s } })} />}
            <button type="button" aria-label="احذف اليوم" className="mr-auto text-neutral-400 hover:text-[#E03131] cursor-pointer" onClick={() => onChange({ ...rota, exceptions: Object.fromEntries(exceptions.filter(([d]) => d !== date)) })}><Trash2 size={13} /></button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" className={`${inputClass} w-40`} value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          <button type="button" disabled={!newDate || !!rota.exceptions[newDate]} onClick={() => { onChange({ ...rota, exceptions: { ...rota.exceptions, [newDate]: [] } }); setNewDate(''); }} className="h-9 px-3 rounded-xl bg-bg text-xs font-bold disabled:opacity-40 cursor-pointer">أضف يومًا (إجازة)</button>
        </div>
      </div>
    </div>
  );
};

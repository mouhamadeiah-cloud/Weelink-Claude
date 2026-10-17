// The page's appointments in its admin: the new ones waiting for the owner, the coming ones, and
// the past ones (kept 3 months). Confirming or cancelling emails the customer (/api/booking).
import React, { useEffect, useState } from 'react';
import { CalendarCheck2, CalendarDays, CalendarX2, Check, Loader2, Mail, MessageCircle, Phone } from 'lucide-react';
import { Booking, BookingStatus, dayKey, setBookingStatus, watchBookings } from '../../services/bookings';
import type { ProjectKey } from '../../utils/projectKeys';

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const dateLabel = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return `${DAYS[new Date(y, m - 1, d).getDay()]} ${d} ${MONTHS[m - 1]}`;
};
const MEETING: Record<string, string> = { personal: 'حضور شخصي', phone: 'مكالمة هاتفية', whatsapp: 'فيديو واتساب' };
const STATUS: Record<BookingStatus, { label: string; cls: string }> = {
  new: { label: 'بانتظار تأكيدك', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  confirmed: { label: 'مؤكد', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  done: { label: 'منجز', cls: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
  cancelled: { label: 'ملغى', cls: 'bg-red-50 text-red-600 border-red-200' },
};

type View = 'new' | 'upcoming' | 'past';

interface BookingsSectionProps {
  owner: string;
  project: ProjectKey;
  // Where the bookings come from and go to (Firebase and /api/booking).
  watch?: typeof watchBookings;
  changeStatus?: typeof setBookingStatus;
}

export const BookingsSection: React.FC<BookingsSectionProps> = ({ owner, project, watch = watchBookings, changeStatus = setBookingStatus }) => {
  const [rows, setRows] = useState<Booking[] | null | 'error'>(null);
  const [view, setView] = useState<View>('new');
  const [busy, setBusy] = useState('');
  const [failed, setFailed] = useState('');

  useEffect(() => {
    setRows(null);
    return watch(owner, project, setRows, () => setRows('error'));
  }, [owner, project]);

  const today = dayKey(new Date());
  const list = Array.isArray(rows) ? rows : [];
  const isPast = (b: Booking) => b.date < today || b.status === 'done' || b.status === 'cancelled';
  const groups: Record<View, Booking[]> = {
    new: list.filter((b) => !isPast(b) && b.status === 'new'),
    upcoming: list.filter((b) => !isPast(b) && b.status === 'confirmed'),
    past: list.filter(isPast).reverse(),
  };

  const act = async (b: Booking, status: Exclude<BookingStatus, 'new'>) => {
    if (status === 'cancelled' && !window.confirm(`إلغاء موعد ${b.name}؟ رح يوصله إيميل بالإلغاء.`)) return;
    setBusy(b.id);
    setFailed('');
    try {
      await changeStatus(owner, b.id, status);
    } catch {
      setFailed(b.id);
    }
    setBusy('');
  };

  const tabs: { id: View; label: string }[] = [
    { id: 'new', label: 'الجديدة' },
    { id: 'upcoming', label: 'القادمة' },
    { id: 'past', label: 'السابقة' },
  ];

  return (
    <section className="rounded-2xl bg-white border border-neutral-200 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 ml-auto"><CalendarDays size={15} /> المواعيد</div>
        <div className="flex gap-1 bg-bg rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setView(t.id)}
              className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${view === t.id ? 'bg-white text-ink shadow-sm' : 'text-neutral-500'}`}
            >
              {t.label}
              {groups[t.id].length > 0 && t.id !== 'past' && (
                <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-xs flex items-center justify-center ${t.id === 'new' ? 'bg-[#ff3b30] text-white' : 'bg-neutral-200 text-neutral-600'}`}>{groups[t.id].length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {rows === null ? (
        <Loader2 size={20} className="animate-spin text-neutral-400" />
      ) : rows === 'error' ? (
        <div className="text-xs text-neutral-500">ما قدرنا نقرأ المواعيد هلق. جرّب بعد شوي.</div>
      ) : groups[view].length === 0 ? (
        <div className="rounded-xl bg-bg p-4 text-xs text-neutral-500 leading-relaxed">
          {view === 'new'
            ? list.length === 0
              ? 'ما في مواعيد بعد. أضف «حجز مواعيد» لصفحتك من «إضافة»، وبيوصلك إيميل مع كل حجز جديد.'
              : 'ما في مواعيد جديدة بانتظارك.'
            : view === 'upcoming'
              ? 'ما في مواعيد قادمة مؤكدة.'
              : 'المواعيد اللي مضت بتضل هون 3 أشهر.'}
        </div>
      ) : (
        <ul className="space-y-2">
          {groups[view].map((b) => {
            const phoneDigits = b.phone.replace(/[^\d+]/g, '');
            return (
              <li key={b.id} className="rounded-xl border border-neutral-200 p-3 flex flex-wrap gap-3 items-start">
                <div className="w-24 shrink-0 rounded-lg bg-bg py-2 text-center">
                  <div className="text-xs font-black text-brand leading-tight">{dateLabel(b.date)}</div>
                  <div className="text-xs font-bold text-neutral-600 mt-1" dir="rtl">{b.slot}</div>
                </div>
                <div className="flex-1 min-w-[180px] space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-ink">{b.name}</span>
                    <span className={`text-xs font-bold border rounded-full px-2 py-0.5 ${STATUS[b.status]?.cls || ''}`}>{STATUS[b.status]?.label || b.status}</span>
                    <span className="text-xs font-bold text-neutral-500">{MEETING[b.meetingType] || ''}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold">
                    {b.phone && <a href={`tel:${phoneDigits}`} className="text-neutral-600 flex items-center gap-1" dir="ltr"><Phone size={12} />{b.phone}</a>}
                    {b.phone && <a href={`https://wa.me/${phoneDigits.replace(/^\+/, '')}`} target="_blank" rel="noreferrer" className="text-emerald-700 flex items-center gap-1"><MessageCircle size={12} />واتساب</a>}
                    {b.email && <a href={`mailto:${b.email}`} className="text-neutral-600 flex items-center gap-1" dir="ltr"><Mail size={12} />{b.email}</a>}
                  </div>
                  {b.address && <div className="text-xs text-neutral-500">{b.address}</div>}
                  {b.desc && <div className="text-xs text-neutral-600 leading-relaxed">{b.desc}</div>}
                  {failed === b.id && <div className="text-xs font-bold text-red-600">ما زبط. تأكد من الإنترنت وجرّب مرة ثانية.</div>}
                </div>
                {!isPast(b) && (
                  <div className="flex gap-1.5 shrink-0">
                    {busy === b.id ? (
                      <Loader2 size={18} className="animate-spin text-neutral-400 m-2" />
                    ) : (
                      <>
                        {b.status === 'new' && (
                          <button type="button" onClick={() => act(b, 'confirmed')} className="h-8 px-3 rounded-lg bg-brand text-white text-xs font-bold flex items-center gap-1 cursor-pointer">
                            <CalendarCheck2 size={14} /> تأكيد
                          </button>
                        )}
                        {b.status === 'confirmed' && (
                          <button type="button" onClick={() => act(b, 'done')} className="h-8 px-3 rounded-lg bg-ink text-white text-xs font-bold flex items-center gap-1 cursor-pointer">
                            <Check size={14} /> منجز
                          </button>
                        )}
                        <button type="button" onClick={() => act(b, 'cancelled')} className="h-8 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold flex items-center gap-1 cursor-pointer">
                          <CalendarX2 size={14} /> إلغاء
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

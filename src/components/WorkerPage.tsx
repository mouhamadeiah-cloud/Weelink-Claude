// The worker's page (/?worker=<owner>): a team person types their secret code and sees their own bookings,
// read-only, in their colour. «تم» marks one as done. The code stays in this tab only.
import React, { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, LogOut } from 'lucide-react';
import { WorkerView, loadWorkerView, markWorkerDone } from '../services/workerApi';

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const dayLabel = (date: string, today: string) => {
  if (date === today) return 'اليوم';
  const [y, m, d] = date.split('-').map(Number);
  return `${DAYS[new Date(y, m - 1, d).getDay()]} ${d} ${MONTHS[m - 1]}`;
};
const errors: Record<string, string> = {
  wrong_pin: 'الرمز غير صحيح.',
  locked: 'محاولات كثيرة خاطئة. جرّب بعد ربع ساعة.',
  offline: 'تأكد من الإنترنت.',
  too_early: 'هذا الموعد لسا ما حان.',
};
const KEY = 'weelink-worker-pin';
const keep = (v: string) => { try { v ? sessionStorage.setItem(KEY, v) : sessionStorage.removeItem(KEY); } catch { /* private window */ } };
const kept = () => { try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; } };

export const WorkerPage: React.FC<{ owner: string }> = ({ owner }) => {
  const [pin, setPin] = useState(kept());
  const [typed, setTyped] = useState('');
  const [view, setView] = useState<WorkerView | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (code: string) => {
    const out = await loadWorkerView(owner, code);
    if ('error' in out) {
      setError(errors[out.error] || 'ما زبط. جرّب مرة ثانية.');
      if (out.error === 'wrong_pin' || out.error === 'locked') { keep(''); setPin(''); setView(null); }
      return;
    }
    setError('');
    setView(out.view);
  }, [owner]);

  useEffect(() => {
    if (!pin) return;
    load(pin);
    const t = window.setInterval(() => load(pin), 60000);
    return () => window.clearInterval(t);
  }, [pin, load]);

  const enter = async () => {
    if (!/^\d{6}$/.test(typed)) return setError('الرمز 6 أرقام.');
    setBusy(true);
    keep(typed);
    setPin(typed);
    setTyped('');
    setBusy(false);
  };
  const done = async (id: string) => {
    setBusy(true);
    const err = await markWorkerDone(owner, pin, id);
    if (err) setError(errors[err] || 'ما زبط. جرّب مرة ثانية.');
    else await load(pin);
    setBusy(false);
  };

  if (!pin || !view) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-xs rounded-3xl bg-white p-6 space-y-4 text-center shadow-sm">
          <div className="text-lg font-black">مواعيدي</div>
          {pin && !error ? <Loader2 className="animate-spin mx-auto text-neutral-400" /> : (
            <>
              <input inputMode="numeric" autoFocus type="password" maxLength={6} dir="ltr" placeholder="الرمز السري" value={typed} onChange={(e) => setTyped(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && enter()}
                className="w-full h-12 rounded-2xl border border-neutral-200 text-center text-xl tracking-[0.4em] font-black" />
              <button type="button" disabled={busy || typed.length !== 6} onClick={enter} className="w-full h-11 rounded-2xl bg-[#0071e3] text-white font-bold disabled:opacity-50 cursor-pointer">دخول</button>
            </>
          )}
          {error && <div className="text-xs font-bold text-red-600">{error}</div>}
        </div>
      </div>
    );
  }

  const days = [...new Set(view.bookings.map((b) => b.date))];
  return (
    <div className="min-h-screen bg-[#f5f5f7]" dir="rtl">
      <header className="px-4 py-4 text-white flex items-center gap-3" style={{ background: view.person.color }}>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-black truncate">{view.person.name}</div>
          {view.person.role && <div className="text-xs font-bold opacity-90 truncate">{view.person.role}</div>}
        </div>
        <button type="button" aria-label="خروج" onClick={() => { keep(''); setPin(''); setView(null); }} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center cursor-pointer"><LogOut size={18} /></button>
      </header>
      <main className="max-w-md mx-auto p-3 space-y-4">
        {error && <div className="text-xs font-bold text-red-600">{error}</div>}
        {view.shifts.length > 0 && (
          <section className="rounded-2xl bg-white p-3 space-y-1.5">
            <div className="text-xs font-black text-neutral-500">دوامي (أسبوعان)</div>
            {view.shifts.map((x) => (
              <div key={x.date} className="flex items-center gap-2 text-xs font-bold">
                <span className="w-32 text-neutral-600">{dayLabel(x.date, view.today)}</span>
                {x.shifts.length ? <span dir="ltr" className="text-ink">{x.shifts.map((sh) => `${sh.start}–${sh.end}`).join('  ·  ')}</span> : <span className="text-neutral-400">إجازة</span>}
              </div>
            ))}
          </section>
        )}
        {days.length === 0 && <div className="rounded-2xl bg-white p-6 text-center text-sm font-bold text-neutral-500">ما في مواعيد قادمة عندك.</div>}
        {days.map((d) => (
          <section key={d} className="space-y-2">
            <div className="text-xs font-black text-neutral-500">{dayLabel(d, view.today)}</div>
            {view.bookings.filter((b) => b.date === d).map((b) => (
              <div key={b.id} className="rounded-2xl bg-white p-3 flex items-center gap-3" style={{ borderRight: `5px solid ${view.person.color}` }}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black">{b.name}</div>
                  <div className="text-xs font-bold text-neutral-600" dir="rtl">{b.slot}</div>
                  {b.desc && <div className="text-xs text-neutral-500 mt-0.5">{b.desc}</div>}
                  {b.status === 'new' && <div className="text-[11px] font-bold text-amber-700 mt-0.5">بانتظار تأكيد الإدارة</div>}
                </div>
                {b.status === 'done' ? (
                  <span className="text-xs font-black text-emerald-700 inline-flex items-center gap-1"><Check size={14} /> تم</span>
                ) : b.date <= view.today ? (
                  <button type="button" disabled={busy} onClick={() => done(b.id)} className="h-9 px-4 rounded-xl text-white text-xs font-black cursor-pointer disabled:opacity-50" style={{ background: view.person.color }}>تم</button>
                ) : null}
              </div>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
};

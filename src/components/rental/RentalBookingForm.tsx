// Booking a rental's car or item from its page (Eyad, 25 Oct, step 2 of «تأجير»): by the day, by the hour
// or for a period, with the driver and the extras, the price line by line, the terms to accept, and the
// deposit. It books the unit the page's rental schedule keeps for this car or item (rentalUnits.ts), on
// the same engine and the same customer and deposit fields as the «حجز» elements (StayBookingWidget).
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { BookingPageContext, createBooking, dayKey, readUnitTaken } from '../../services/bookings';
import { useBookingSettings } from '../../services/bookingSettings';
import { addDays, nightsBetween } from '../../services/stayBooking';
import { ExtraHelp } from '../ExtraHelp';
import { DEFAULT_TERMS, copyIdOf, daysFree, extrasFor, hourStarts, minOf, normalizeRentalRooms, quote, slotsFree, slotsOf, timeOf, type RentBy, type UnitTaken } from '../../services/rentalBooking';
import { depositAmount, normalizeRule } from '../../services/bookingDeposit';
import { DepositPay, EMPTY_DEPOSIT, depositPayload, depositProblem, type DepositDraft } from '../DepositPay';
import { useAccountCard, useCustomerSession } from '../customers/customerSession';
import { AccountSignup, CustomerFields, EMPTY_CUSTOMER, customerProblem, type CustomerDraft } from '../BookingCustomerForm';

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const label = (d: string) => `${Number(d.slice(8))} ${MONTHS[Number(d.slice(5, 7)) - 1]}`;
const money = (n: number, cur: string) => `${Math.round(n * 100) / 100}${cur ? ` ${cur}` : ''}`;

// The page's rental unit for a warehouse car or item; null when there is none (the page then asks to rent instead).
export const useRentalUnit = (itemId: string) => {
  const page = useContext(BookingPageContext);
  const settings = useBookingSettings(page?.owner, page?.project);
  return useMemo(() => {
    const schedule = settings?.schedules.find((s) => s.type === 'stay' && s.rental) || null;
    const unit = schedule ? normalizeRentalRooms(schedule.rooms).find((r) => r.item === itemId) || null : null;
    return schedule && unit ? { schedule, unit, payments: settings?.payments } : null;
  }, [settings, itemId]);
};

type Found = NonNullable<ReturnType<typeof useRentalUnit>>;

export const RentalBookingForm: React.FC<{ itemId: string; accent: string; onClose?: () => void }> = ({ itemId, accent, onClose }) => {
  const found = useRentalUnit(itemId);
  return found ? <RentalBookingView found={found} accent={accent} onClose={onClose} /> : null;
};

export const RentalBookingView: React.FC<{ found: Found; accent: string; onClose?: () => void }> = ({ found, accent, onClose }) => {
  const page = useContext(BookingPageContext);
  const live = !!page?.live;
  const signedIn = !!useCustomerSession() || !!useAccountCard();

  const [by, setBy] = useState<RentBy | ''>('');
  const [month, setMonth] = useState(() => ({ y: new Date().getFullYear(), m: new Date().getMonth() }));
  const [date, setDate] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [hours, setHours] = useState(0);
  const [start, setStart] = useState<number | null>(null);
  const [period, setPeriod] = useState('');
  const [driver, setDriver] = useState(false);
  const [extras, setExtras] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [taken, setTaken] = useState<UnitTaken[]>([]); // one per copy of the unit
  const [tick, setTick] = useState(0);
  const [customer, setCustomer] = useState<CustomerDraft>(EMPTY_CUSTOMER);
  const [deposit, setDeposit] = useState<DepositDraft>(EMPTY_DEPOSIT);
  const [signup, setSignup] = useState<CustomerDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ status: string; slot: string } | null>(null);

  const { unit, schedule } = found;
  useEffect(() => {
    if (!live || !page) return;
    let alive = true;
    Promise.all(Array.from({ length: unit.copies }, (_, i) => readUnitTaken(page.owner, page.project, schedule.id, copyIdOf(unit.id, i + 1)))).then((t) => alive && setTaken(t)).catch(() => {});
    return () => { alive = false; };
  }, [live, page?.owner, page?.project, schedule.id, unit.id, unit.copies, tick]);

  const ways: { id: RentBy; label: string }[] = [
    ...(unit.byDay ? [{ id: 'day' as const, label: 'باليوم' }] : []),
    ...(unit.byHour ? [{ id: 'hour' as const, label: 'بالساعة' }] : []),
    ...(unit.periods.length ? [{ id: 'period' as const, label: 'بالفترة' }] : []),
  ];
  const mode: RentBy = by && ways.some((w) => w.id === by) ? by : ways[0].id;
  const hourCount = Math.min(unit.maxHours, Math.max(unit.minHours, hours || unit.minHours));
  const workStart = minOf(schedule.workStart);
  const workEnd = minOf(schedule.workEnd);
  const cur = unit.currency;
  const offered = extrasFor(schedule.extras, unit.id);

  const todayKey = dayKey(new Date());
  const lastKey = addDays(todayKey, schedule.daysAhead);
  const inRange = (d: string) => d >= todayKey && d <= lastKey;
  const freeStarts = (d: string) => hourStarts(workStart, workEnd, hourCount).filter((m) => slotsFree(taken, slotsOf(d, m, m + hourCount * 60)));
  const dayOk = (d: string) => {
    if (!inRange(d)) return false;
    if (mode === 'day') return daysFree(taken, [d]);
    if (mode === 'hour') return freeStarts(d).length > 0;
    return unit.periods.some((p) => slotsFree(taken, slotsOf(d, p.start, p.end)));
  };
  const canEnd = (d: string) => {
    if (!date || d <= date) return false;
    const n = nightsBetween(date, d);
    return n.length >= schedule.minNights && n.length <= schedule.maxNights && daysFree(taken, n);
  };
  const reset = () => { setDate(''); setCheckOut(''); setStart(null); setPeriod(''); setError(''); };
  const pick = (d: string) => {
    setError('');
    if (mode !== 'day') { setDate(d); setStart(null); setPeriod(''); return; }
    if (!date || checkOut) { setDate(d); setCheckOut(''); return; }
    if (d <= date) { setDate(d); return; }
    if (canEnd(d)) setCheckOut(d);
  };

  const q = date ? quote(unit, schedule.extras, unit.id, { by: mode, date, checkOut: checkOut || undefined, start: start ?? undefined, hours: hourCount, period, driver, extras }, { minDays: schedule.minNights, maxDays: schedule.maxNights, workStart, workEnd }) : null;
  const amount = q ? depositAmount(normalizeRule(schedule, true), q.total || null) : 0;

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
    if (!q) return setError(mode === 'day' ? 'اختر تاريخ الاستلام والتسليم.' : mode === 'hour' ? 'اختر اليوم وساعة البداية.' : 'اختر اليوم والفترة.');
    if (schedule.termsOn && !accepted) return setError('لازم توافق على الشروط لتكمل الحجز.');
    const personal = customerProblem(customer, live, signedIn);
    if (personal) return setError(personal);
    if (live && amount > 0) {
      const problem = depositProblem(deposit, found.payments);
      if (problem) return setError(problem);
    }
    if (!live || !page) return setDone({ status: 'new', slot: q.slot });
    setSaving(true);
    const out = await createBooking({
      owner: page.owner, project: page.project, schedule: schedule.id, pageName: page.pageName,
      date, startMin: 0, slot: q.slot.slice(0, 40), meetingType: '', room: unit.id,
      ...(mode === 'day' ? { checkOut } : {}),
      rent: { by: mode, start: start ?? undefined, hours: hourCount, period, driver, extras },
      acceptTerms: accepted,
      name: customer.name, phone: customer.phone, email: customer.email, address: customer.address, desc: customer.desc,
      needsConfirmation: schedule.needsConfirmation, deposit: depositPayload(deposit, amount),
    } as any);
    setSaving(false);
    if ('error' in out) {
      if (out.error === 'taken') { setError('انحجز هالوقت قبل لحظات. اختر وقت تاني.'); setTick((n) => n + 1); reset(); }
      else if (out.error === 'deposit_required') setError('لازم تدفع العربون وتكتب رقم العملية.');
      else if (out.error === 'terms_required') setError('لازم توافق على الشروط لتكمل الحجز.');
      else if (out.error === 'bad_email') setError('تأكد من الإيميل.');
      else if (out.error === 'bad_rent' || out.error === 'no_rooms' || out.error === 'bad_schedule') setError('تغيّرت إعدادات الإيجار. حدّث الصفحة وجرّب مرة ثانية.');
      else setError(`ما قدرنا نحفظ الحجز. جرّب مرة ثانية. (رمز: ${out.error})`);
      return;
    }
    setSignup(customer.register && !signedIn ? customer : null);
    setDone({ status: out.deposit ? 'deposit' : out.status, slot: q.slot });
    setTick((n) => n + 1);
  };

  const chip = (on: boolean) => `h-10 px-3 rounded-xl border text-xs font-bold cursor-pointer disabled:opacity-30 disabled:cursor-default ${on ? 'text-white' : 'bg-white text-neutral-700 border-neutral-200'}`;
  const on = (v: boolean) => (v ? { backgroundColor: accent, borderColor: accent } : undefined);

  if (done) {
    return (
      <div className="rounded-2xl border border-neutral-200 p-4 text-center space-y-2">
        <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: accent }}>✓</div>
        <h4 className="font-black">{done.status === 'confirmed' ? 'تم حجزك!' : done.status === 'deposit' ? 'بانتظار تأكيد العربون' : 'وصل طلب الحجز!'}</h4>
        <p className="text-xs text-neutral-500 leading-relaxed">
          شكراً <b>{customer.name}</b>. {unit.name} · {label(date)} · {done.slot}.
          {done.status === 'deposit' ? ' رح نراجع التحويل ويوصلك إيميل لما يتأكد العربون. إذا ما انتأكد خلال 24 ساعة بيتحرر الحجز.' : done.status !== 'confirmed' ? ' رح يوصلك إيميل لما يتأكد الحجز.' : ''}
        </p>
        {signup && live && page && <AccountSignup draft={signup} owner={page.owner} project={page.project} pageName={page.pageName} accent={accent} dark={false} />}
        {onClose && <button type="button" onClick={onClose} className="h-10 px-4 rounded-full text-white text-xs font-bold cursor-pointer" style={{ backgroundColor: accent }}>تم</button>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-neutral-200 p-3 sm:p-4 space-y-3 text-right">
      <div className="flex items-center gap-2 font-black"><CalendarCheck size={18} style={{ color: accent }} /> احجز {unit.name}</div>
      {ways.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {ways.map((w) => <button key={w.id} type="button" onClick={() => { setBy(w.id); reset(); }} className={chip(mode === w.id)} style={on(mode === w.id)}>{w.label}</button>)}
        </div>
      )}
      <div className="text-xs text-neutral-500 font-bold">
        {mode === 'day' && unit.dayPrice > 0 && `${money(unit.dayPrice, cur)} لليوم`}
        {mode === 'hour' && unit.hourPrice > 0 && `${money(unit.hourPrice, cur)} للساعة`}
        {mode === 'period' && unit.periods.map((p) => `${p.name}: ${money(p.price, cur)}`).join(' · ')}
        {unit.prices.length > 0 && ' · في أسعار خاصة لبعض الأيام'}
      </div>

      <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">{MONTHS[month.m]} {month.y}</span>
          <div className="flex gap-1">
            <button type="button" disabled={!prevOk} onClick={() => step(-1)} className="w-8 h-8 rounded-lg disabled:opacity-30 cursor-pointer flex items-center justify-center" aria-label="الشهر السابق"><ChevronRight size={16} /></button>
            <button type="button" disabled={!nextOk} onClick={() => step(1)} className="w-8 h-8 rounded-lg disabled:opacity-30 cursor-pointer flex items-center justify-center" aria-label="الشهر التالي"><ChevronLeft size={16} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-neutral-400">
          {['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((n, i) => {
            if (!n) return <div key={`e${i}`} />;
            const k = keyOf(n);
            const ok = mode === 'day' && date && !checkOut ? canEnd(k) || dayOk(k) : dayOk(k);
            const edge = k === date || k === checkOut;
            const inside = !!date && !!checkOut && k > date && k < checkOut;
            return (
              <button key={k} type="button" disabled={!ok && !edge} onClick={() => pick(k)}
                className={`h-9 rounded-lg text-xs font-bold cursor-pointer disabled:cursor-default disabled:opacity-30 ${edge ? 'text-white' : inside ? 'bg-black/10' : 'bg-white border border-neutral-200 text-neutral-700'}`}
                style={edge ? { backgroundColor: accent } : undefined}>{n}</button>
            );
          })}
        </div>
        <div className="text-xs font-bold text-neutral-500">
          {mode === 'day'
            ? !date ? 'اختر تاريخ الاستلام' : !checkOut ? 'اختر تاريخ التسليم' : `${label(date)} ← ${label(checkOut)}`
            : !date ? 'اختر اليوم' : label(date)}
        </div>
      </div>

      {mode === 'hour' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">عدد الساعات</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { setHours(Math.max(unit.minHours, hourCount - 1)); setStart(null); }} className="w-8 h-8 rounded-lg border font-bold cursor-pointer">−</button>
              <span className="font-black w-6 text-center">{hourCount}</span>
              <button type="button" onClick={() => { setHours(Math.min(unit.maxHours, hourCount + 1)); setStart(null); }} className="w-8 h-8 rounded-lg border font-bold cursor-pointer">+</button>
            </div>
          </div>
          {date && (
            <div className="flex flex-wrap gap-1.5">
              {hourStarts(workStart, workEnd, hourCount).map((m) => {
                const free = slotsFree(taken, slotsOf(date, m, m + hourCount * 60));
                return <button key={m} type="button" disabled={!free} onClick={() => setStart(m)} className={chip(start === m)} style={on(start === m)} dir="ltr">{timeOf(m)}</button>;
              })}
            </div>
          )}
        </div>
      )}

      {mode === 'period' && date && (
        <div className="flex flex-wrap gap-1.5">
          {unit.periods.map((p) => {
            const free = slotsFree(taken, slotsOf(date, p.start, p.end));
            return <button key={p.id} type="button" disabled={!free} onClick={() => setPeriod(p.id)} className={chip(period === p.id)} style={on(period === p.id)}>{p.name} · {timeOf(p.start)}–{timeOf(p.end)}</button>;
          })}
        </div>
      )}

      {unit.driver === 'with' && <div className="text-xs font-bold text-neutral-500">الإيجار مع سائق.</div>}
      {unit.driver === 'both' && (
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setDriver(false)} className={chip(!driver)} style={on(!driver)}>بدون سائق</button>
          <button type="button" onClick={() => setDriver(true)} className={chip(driver)} style={on(driver)}>مع سائق</button>
        </div>
      )}

      {offered.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-sm font-bold">الخدمات المرافقة</div>
          {offered.map((x) => (
            <label key={x.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={extras.includes(x.id)} onChange={(e) => setExtras(e.target.checked ? [...extras, x.id] : extras.filter((id) => id !== x.id))} />
              <span className="flex-1">{x.name} <ExtraHelp note={x.note} /></span>
              <span className="text-xs font-bold text-neutral-500">{money(x.price, cur)}{x.per === 'unit' ? (mode === 'day' ? ' لليوم' : mode === 'hour' ? ' للساعة' : '') : ''}</span>
            </label>
          ))}
        </div>
      )}

      {q && (
        <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3 space-y-1 text-sm">
          {q.lines.map((l, i) => <div key={i} className="flex justify-between gap-2"><span className="text-neutral-600">{l.label}</span><span className="font-bold">{money(l.amount, cur)}</span></div>)}
          <div className="flex justify-between gap-2 pt-1 border-t border-neutral-200 font-black"><span>المجموع</span><span style={{ color: accent }}>{money(q.total, cur)}</span></div>
        </div>
      )}

      {amount > 0 && <DepositPay payments={found.payments} amount={amount} accent={accent} dark={false} value={deposit} onChange={setDeposit} />}
      <CustomerFields draft={customer} onChange={setCustomer} dark={false} accent={accent} />

      {schedule.termsOn && (
        <div className="space-y-1.5">
          <label className="flex items-start gap-2 text-sm font-bold cursor-pointer">
            <input type="checkbox" className="mt-1" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <span>قرأت الشروط وأوافق عليها</span>
          </label>
          <button type="button" onClick={() => setShowTerms((v) => !v)} className="text-xs font-bold underline cursor-pointer" style={{ color: accent }}>{showTerms ? 'إخفاء الشروط' : 'اقرأ الشروط'}</button>
          {showTerms && <div className="max-h-48 overflow-y-auto rounded-xl border border-neutral-200 p-3 text-xs leading-relaxed text-neutral-600 whitespace-pre-line">{schedule.terms || DEFAULT_TERMS.other}</div>}
        </div>
      )}

      {error && <div className="text-xs font-bold text-red-600">{error}</div>}
      <button type="submit" disabled={saving} className="w-full h-12 rounded-full text-white text-sm font-bold cursor-pointer disabled:opacity-60" style={{ backgroundColor: accent }}>
        {saving ? 'جاري الحجز…' : 'تأكيد الحجز'}
      </button>
    </form>
  );
};

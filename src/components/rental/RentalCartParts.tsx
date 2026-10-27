// The rental's cart page, built like the shop's (Eyad, 26 Oct): the cart summary on the right (the 'cart' element) and the booking
// card on the left (the 'checkout' element), two elements that share the cart (rentalCart.tsx). The summary lists each car or
// item with its price, the dates it is rented for, its driver and services, and the totals; the card takes the visitor's details
// and the deposit, and its button books everything at once, all or nothing (api/booking.ts).
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { CalendarCheck, ClipboardList, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCarData } from '../cars/store/CarDataContext';
import { useShopData } from '../shop/store/ShopDataContext';
import { BookingPageContext, createBooking, dayKey, readUnitTaken } from '../../services/bookings';
import { addDays, nightsBetween } from '../../services/stayBooking';
import { ExtraHelp } from '../ExtraHelp';
import {
  DEFAULT_TERMS, copyIdOf, dayAvailable, daysFree, extraPriceFor, extrasFor, hoursAvailable, hourStarts, minOf, periodKind, periodNights, quote, slotsFree, slotsOf, timeOf, type Quote, type RentBy, type RentalUnit, type UnitTaken,
} from '../../services/rentalBooking';
import type { StayRoom } from '../../services/stayBooking';
import { depositAmount, normalizeRule } from '../../services/bookingDeposit';
import { DepositPay, EMPTY_DEPOSIT, depositPayload, depositProblem, type DepositDraft } from '../DepositPay';
import { useAccountCard, useCustomerSession } from '../customers/customerSession';
import { AccountSignup, CustomerFields, EMPTY_CUSTOMER, customerProblem, type CustomerDraft } from '../BookingCustomerForm';
import { Root, Section, fieldClass, stop, type PartProps } from '../shop/store/CheckoutView';
import { lookVars } from '../shop/store/checkoutStore';
import { useRentalUnits } from './RentalBookingForm';
import { useRentalCart, type RentLine } from './rentalCart';
import { RentalCompare } from './RentalCompare';

type Unit = StayRoom & RentalUnit;

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const label = (d: string) => `${Number(d.slice(8))} ${MONTHS[Number(d.slice(5, 7)) - 1]}`;
const money = (n: number, cur: string) => `${Math.round(n * 100) / 100}${cur ? ` ${cur}` : ''}`;
const WAY_LABEL: Record<RentBy, string> = { day: 'باليوم', hour: 'بالساعة', period: 'بالفترة' };

interface Row {
  line: RentLine;
  unit: Unit;
  ways: RentBy[];
  mode: RentBy;
  hours: number;
  q: Quote | null; // one copy of it, for the dates set
  total: number; // all its copies
}

// People in one booking of a unit: at least 1, at most the unit's most (when it has one).
const guestsOf = (unit: Unit, n: number) => Math.max(1, unit.maxGuests > 0 ? Math.min(n, unit.maxGuests) : n);

// The cart, its units and the totals, the same in the summary and the booking card.
const useRentalCheckout = () => {
  const cart = useRentalCart();
  const found = useRentalUnits(cart.ids);
  const schedule = found?.schedule;
  const rows: Row[] = useMemo(() => {
    if (!found) return [];
    const { schedule: s } = found;
    return cart.lines.flatMap((line): Row[] => {
      const unit = found.units.find((u) => u.item === line.id);
      if (!unit) return [];
      const ways: RentBy[] = [...(unit.byDay ? ['day' as const] : []), ...(unit.byHour ? ['hour' as const] : []), ...(unit.periods.length ? ['period' as const] : [])];
      const mode = line.by && ways.includes(line.by) ? line.by : ways[0] || 'day';
      const hours = Math.min(Math.max(unit.minHours, unit.maxHours), Math.max(unit.minHours, line.hours || unit.minHours));
      const q = line.date
        ? quote(unit, s.extras, unit.id, { by: mode, date: line.date, checkOut: line.checkOut || undefined, start: line.start ?? undefined, hours, period: line.period, driver: line.driver, extras: line.extras, guests: guestsOf(unit, line.guests) }, { minDays: s.minNights, maxDays: s.maxNights, workStart: minOf(s.workStart), workEnd: minOf(s.workEnd) })
        : null;
      return [{ line, unit, ways, mode, hours, q, total: q ? q.total * line.qty : 0 }];
    });
  }, [found, cart.lines]);
  const booked = rows.filter((r) => r.line.on);
  const ready = booked.length > 0 && booked.every((r) => !!r.q);
  const total = booked.reduce((n, r) => n + r.total, 0);
  const currency = rows[0]?.unit.currency || '';
  const amount = schedule && ready ? depositAmount(normalizeRule(schedule, true), total || null) : 0;
  return { cart, found, schedule, rows, booked, ready, total, currency, amount };
};

// The times already taken, per unit (one per copy of it): what the dates are checked against.
const useTaken = (units: Unit[], scheduleId: string | undefined) => {
  const page = useContext(BookingPageContext);
  const [taken, setTaken] = useState<Record<string, UnitTaken[]>>({});
  const key = units.map((u) => `${u.id}:${u.copies}`).join('|');
  useEffect(() => {
    if (!page?.live || !scheduleId) return;
    let alive = true;
    Promise.all(units.map((u) => Promise.all(Array.from({ length: u.copies }, (_, i) => readUnitTaken(page.owner, page.project, scheduleId, copyIdOf(u.id, i + 1))))))
      .then((all) => alive && setTaken(Object.fromEntries(units.map((u, i) => [u.id, all[i]]))))
      .catch(() => {});
    return () => { alive = false; };
  }, [page?.live, page?.owner, page?.project, scheduleId, key]);
  return taken;
};

// How many copies of the unit are free for the dates of the line.
const freeCopies = (row: Row, taken: UnitTaken[] | undefined) => {
  if (!row.q || !taken) return row.unit.copies;
  const { nights, slots } = row.q;
  return taken.filter((t) => (nights.length ? daysFree(t, nights) : slotsFree(t, slots))).length;
};

const Icon: React.FC<{ title: string; onClick: () => void; on?: boolean; danger?: boolean; disabled?: boolean; children: React.ReactNode }> = ({ title, onClick, on, danger, disabled, children }) => (
  <button
    type="button" title={title} aria-label={title} onClick={onClick} disabled={disabled}
    className={`w-7 h-7 flex items-center justify-center rounded-full cursor-pointer disabled:opacity-30 disabled:cursor-default ${danger ? 'text-(--muted) hover:text-red-500' : on ? 'text-white bg-(--accent)' : 'text-(--muted) hover:bg-neutral-100'}`}
  >
    {children}
  </button>
);

const chip = (on: boolean) => `h-8 px-3 rounded-full border text-xs font-bold cursor-pointer ${on ? 'text-white bg-(--accent) border-(--accent)' : 'bg-white text-neutral-700 border-neutral-200'}`;
const smallField = `${fieldClass} h-9 text-xs`;

const LineRow: React.FC<{ row: Row; schedule: NonNullable<ReturnType<typeof useRentalCheckout>['schedule']>; taken: UnitTaken[] | undefined; update: (patch: Partial<RentLine>) => void; remove: () => void }> = ({ row, schedule, taken, update, remove }) => {
  const { line, unit, ways, mode, hours, q } = row;
  // The photo comes from the warehouse itself (the schedule keeps only web links).
  const carData = useCarData();
  const shopData = useShopData();
  const photo = carData?.cars.find((c) => c.id === unit.id || c.id === line.id)?.images[0] || shopData?.products.find((x) => x.id === unit.id || x.id === line.id)?.images[0] || unit.photo;
  const today = dayKey(new Date());
  const last = addDays(today, schedule.daysAhead);
  const offered = extrasFor(schedule.extras, unit.id);
  const free = freeCopies(row, taken);
  const most = Math.max(1, q ? Math.min(unit.copies, free) : unit.copies);
  const workStart = minOf(schedule.workStart);
  const workEnd = minOf(schedule.workEnd);
  const cur = unit.currency;
  const price = (mode === 'day' && unit.dayPrice > 0 ? `${money(unit.dayPrice, cur)} لليوم` : mode === 'hour' && unit.hourPrice > 0 ? `${money(unit.hourPrice, cur)} للساعة` : mode === 'period' ? unit.periods.map((p) => `${p.name}: ${money(p.price, cur)}`).join(' · ') : '') + (unit.perPerson ? ' للشخص' : '');
  const guests = guestsOf(unit, line.guests);
  const peopleOn = unit.perPerson || unit.maxGuests > 0;
  // The first day the unit can't be rented (its availability rules).
  const chosen = unit.periods.find((x) => x.id === line.period);
  const days = !line.date ? [] : mode === 'day' ? (line.checkOut ? nightsBetween(line.date, line.checkOut) : []) : mode === 'period' && chosen && periodKind(chosen) !== 'time' ? periodNights(chosen, line.date) : [line.date];
  const closed = days.find((d) => !dayAvailable(unit, d)) || '';
  const missing = !line.date ? 'اختر تاريخ الاستلام' : mode === 'day' && !line.checkOut ? 'اختر تاريخ التسليم' : mode === 'hour' && line.start === null ? 'اختر ساعة البداية' : mode === 'period' && !line.period ? 'اختر الفترة' : closed ? `غير متاح بتاريخ ${label(closed)}. اختر تاريخاً آخر.` : !q ? 'تحقق من التواريخ (أقل أو أكثر من المدة المسموحة)' : '';
  const unavailable = !!q && free < line.qty;

  return (
    <div className={`py-3 space-y-2.5 ${line.on ? '' : 'opacity-50'}`}>
      <div className="flex items-center gap-3">
        {photo ? <img src={photo} alt="" referrerPolicy="no-referrer" className="w-14 h-14 rounded-xl object-cover bg-neutral-100 shrink-0" /> : <div className="w-14 h-14 rounded-xl bg-neutral-100 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{unit.name}</div>
          {price && <div className="text-xs text-(--muted)">{price}</div>}
          <div className="mt-1 flex items-center gap-1">
            <Icon title={line.on ? 'مضاف للحجز' : 'أضف للحجز'} on={line.on} onClick={() => update({ on: !line.on })}><CalendarCheck size={14} /></Icon>
            <Icon title="حذف من السلة" danger onClick={remove}><Trash2 size={14} /></Icon>
            {unit.copies > 1 && (
              <span className="inline-flex items-center gap-0.5 border border-black/[0.08] rounded-full px-0.5 bg-white text-[#2A1F1A]">
                <button type="button" aria-label="زيادة" disabled={line.qty >= most} onClick={() => update({ qty: line.qty + 1 })} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-neutral-100 cursor-pointer disabled:opacity-30"><Plus size={12} /></button>
                <span className="w-5 text-center text-xs font-bold">{line.qty}</span>
                <button type="button" aria-label="إنقاص" disabled={line.qty <= 1} onClick={() => update({ qty: line.qty - 1 })} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-neutral-100 cursor-pointer disabled:opacity-30"><Minus size={12} /></button>
              </span>
            )}
          </div>
        </div>
        <div className="font-bold text-sm text-(--accent) shrink-0">{q ? money(row.total, cur) : ''}</div>
      </div>

      {peopleOn && (
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="text-(--muted)">عدد الأشخاص{unit.maxGuests > 0 ? ` (حتى ${unit.maxGuests})` : ''}</span>
          <button type="button" aria-label="إنقاص" disabled={guests <= 1} onClick={() => update({ guests: guests - 1 })} className="w-7 h-7 rounded-lg border cursor-pointer disabled:opacity-40">−</button>
          <span className="w-6 text-center">{guests}</span>
          <button type="button" aria-label="زيادة" disabled={unit.maxGuests > 0 && guests >= unit.maxGuests} onClick={() => update({ guests: guests + 1 })} className="w-7 h-7 rounded-lg border cursor-pointer disabled:opacity-40">+</button>
        </div>
      )}

      {ways.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {ways.map((w) => <button key={w} type="button" onClick={() => update({ by: w, checkOut: '', start: null, period: '' })} className={chip(mode === w)}>{WAY_LABEL[w]}</button>)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1 text-[11px] font-bold text-(--muted)">
          <span>{mode === 'day' || (mode === 'period' && unit.periods.some((x) => x.kind === 'length')) ? 'تاريخ الاستلام' : 'اليوم'}</span>
          <input type="date" dir="ltr" className={smallField} min={today} max={last} value={line.date} onChange={(e) => update({ date: e.target.value, checkOut: mode === 'day' && line.checkOut <= e.target.value ? '' : line.checkOut, start: null, period: '' })} disabled={mode === 'period' && unit.periods.find((x) => x.id === line.period)?.kind === 'dates'} />
        </label>
        {mode === 'day' && (
          <label className="space-y-1 text-[11px] font-bold text-(--muted)">
            <span>تاريخ التسليم</span>
            <input type="date" dir="ltr" className={smallField} min={line.date ? addDays(line.date, 1) : today} max={last} value={line.checkOut} disabled={!line.date} onChange={(e) => update({ checkOut: e.target.value })} />
          </label>
        )}
        {mode === 'hour' && (
          <label className="space-y-1 text-[11px] font-bold text-(--muted)">
            <span>ساعة البداية</span>
            <select className={smallField} value={line.start ?? ''} disabled={!line.date} onChange={(e) => update({ start: e.target.value === '' ? null : Number(e.target.value) })}>
              <option value="">— اختر —</option>
              {hourStarts(workStart, workEnd, hours).filter((m) => hoursAvailable(unit, m, m + hours * 60)).map((m) => <option key={m} value={m}>{timeOf(m)}</option>)}
            </select>
          </label>
        )}
        {mode === 'period' && (
          <label className="space-y-1 text-[11px] font-bold text-(--muted)">
            <span>الفترة</span>
            <select className={smallField} value={line.period} onChange={(e) => { const p = unit.periods.find((x) => x.id === e.target.value); update({ period: e.target.value, ...(p && periodKind(p) === 'dates' ? { date: p.from || '' } : {}) }); }}>
              <option value="">— اختر —</option>
              {unit.periods.map((p) => {
                const kind = periodKind(p);
                const day = kind === 'dates' ? p.from || '' : line.date;
                const busy = (kind === 'time' && !hoursAvailable(unit, p.start, p.end)) || (!!day && !!taken && !taken.some((t) => (kind === 'time' ? slotsFree(t, slotsOf(day, p.start, p.end)) : daysFree(t, periodNights(p, day)))));
                return <option key={p.id} value={p.id} disabled={busy}>{p.name} · {kind === 'time' ? `${timeOf(p.start)}–${timeOf(p.end)}` : kind === 'length' ? `${p.days} يوم` : `${label(p.from || '')} – ${label(p.to || '')}`}</option>;
              })}
            </select>
          </label>
        )}
      </div>
      {mode === 'hour' && (
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="text-(--muted)">عدد الساعات</span>
          <button type="button" aria-label="إنقاص" onClick={() => update({ hours: Math.max(unit.minHours, hours - 1), start: null })} className="w-7 h-7 rounded-lg border cursor-pointer">−</button>
          <span className="w-5 text-center">{hours}</span>
          <button type="button" aria-label="زيادة" onClick={() => update({ hours: Math.min(unit.maxHours, hours + 1), start: null })} className="w-7 h-7 rounded-lg border cursor-pointer">+</button>
        </div>
      )}

      {(unit.driver !== 'none' || offered.length > 0) && (
        <div className="space-y-2 rounded-xl bg-(--soft) p-3">
          <div className="text-xs font-bold">الخدمات الإضافية</div>
          {unit.driver === 'with' && <div className="text-xs font-bold text-(--muted)">الإيجار مع سائق.</div>}
          {unit.driver === 'both' && (
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => update({ driver: false })} className={chip(!line.driver)}>بدون سائق</button>
              <button type="button" onClick={() => update({ driver: true })} className={chip(line.driver)}>مع سائق</button>
            </div>
          )}
          {offered.map((x) => (
            <label key={x.id} className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={line.extras.includes(x.id)} onChange={(e) => update({ extras: e.target.checked ? [...line.extras, x.id] : line.extras.filter((id) => id !== x.id) })} />
              <span className="flex-1">{x.name} <ExtraHelp note={x.note} /></span>
              <span className="font-bold text-(--muted)">{money(extraPriceFor(x, unit.id), unit.currency)}{x.per === 'unit' ? (mode === 'day' ? ' لليوم' : mode === 'hour' ? ' للساعة' : '') : ''}</span>
            </label>
          ))}
        </div>
      )}

      {line.on && missing && <div className="text-xs font-bold text-(--muted)">{missing}</div>}
      {line.on && unavailable && <div className="text-xs font-bold text-red-600">{free === 0 ? 'محجوز في هذه الفترة. اختر تاريخاً آخر.' : `المتاح في هذه الفترة ${free} فقط.`}</div>}
      {line.on && q && (
        <div className="text-[11px] text-(--muted) space-y-0.5">
          {q.lines.map((l, i) => <div key={i} className="flex justify-between gap-2"><span>{l.label}{line.qty > 1 ? ` × ${line.qty}` : ''}</span><span>{money(l.amount * line.qty, cur)}</span></div>)}
        </div>
      )}
    </div>
  );
};

// The cart summary: the cars and items with their dates, services and prices, and the totals.
export const RentalCartSummary: React.FC<PartProps> = ({ look, isPreviewActive }) => {
  const { cart, found, schedule, rows, booked, total, currency, amount } = useRentalCheckout();
  const taken = useTaken(found?.units || [], schedule?.id);
  return (
    <Root look={look} isPreviewActive={isPreviewActive} className="flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-(--line)">
        <div className="flex items-center gap-2 font-bold text-lg">
          <ShoppingCart size={20} className="text-(--accent)" />
          <span>سلة الحجز{rows.length > 0 ? ` (${rows.length})` : ''}</span>
        </div>
        {rows.length > 0 && (
          <div className="flex items-center gap-4">
            <RentalCompare rows={rows} extras={schedule?.extras || []} look={look} only={cart.only} remove={cart.remove} />
            <button type="button" onClick={cart.clear} className="text-xs text-(--muted) hover:text-red-500 cursor-pointer">إفراغ السلة</button>
          </div>
        )}
      </div>
      {rows.length === 0 || !schedule ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6 py-10">
          <ShoppingCart size={44} className="text-(--line)" />
          <span className="text-base font-semibold">سلة الحجز فارغة</span>
          <span className="text-sm text-(--muted)">{isPreviewActive ? 'اضغط «أضف للسلة» على أي عنصر لتحجز عدة عناصر معاً.' : 'ستظهر هنا العناصر التي يضيفها الزائر. جرّبها من وضع المعاينة.'}</span>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto px-6 divide-y divide-(--line)" onWheel={stop}>
          {rows.map((row) => (
            <LineRow key={row.line.id} row={row} schedule={schedule} taken={taken[row.unit.id]} update={(patch) => cart.update(row.line.id, patch)} remove={() => cart.remove(row.line.id)} />
          ))}
        </div>
      )}
      {rows.length > 0 && (
        <div className="px-6 py-4 border-t border-(--line) space-y-2 text-sm">
          {booked.map((r) => (
            <div key={r.line.id} className="flex items-center justify-between text-(--muted)">
              <span>{r.unit.name}{r.line.qty > 1 ? ` × ${r.line.qty}` : ''}</span>
              <span className="font-semibold">{r.q ? money(r.total, currency) : '—'}</span>
            </div>
          ))}
          {amount > 0 && (
            <div className="flex items-center justify-between text-(--muted)">
              <span>العربون (يُدفع الآن)</span>
              <span className="font-semibold">{money(amount, currency)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-(--line)">
            <span className="font-bold">{look.text('totalLabel')}</span>
            <span className="text-xl font-bold">{money(total, currency)}</span>
          </div>
        </div>
      )}
    </Root>
  );
};

// The booking card: the visitor's details, the deposit, the terms, and the button that books the whole cart.
export const RentalCheckoutForm: React.FC<PartProps> = ({ look, isPreviewActive }) => {
  const page = useContext(BookingPageContext);
  const live = !!page?.live;
  const signedIn = !!useCustomerSession() || !!useAccountCard();
  const { cart, found, schedule, booked, ready, total, currency, amount } = useRentalCheckout();
  const [customer, setCustomer] = useState<CustomerDraft>(EMPTY_CUSTOMER);
  const [deposit, setDeposit] = useState<DepositDraft>(EMPTY_DEPOSIT);
  const [accepted, setAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [signup, setSignup] = useState<CustomerDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ status: string; names: string } | null>(null);
  const accent = look.accent;

  if (done) {
    return (
      <Root look={look} isPreviewActive={isPreviewActive}>
        <div className="h-full overflow-y-auto px-6 py-8 flex flex-col items-center justify-center gap-3 text-center" onWheel={stop}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold bg-(--accent)">✓</div>
          <h3 className="font-bold text-lg">{done.status === 'confirmed' ? 'تم حجزك!' : done.status === 'deposit' ? 'بانتظار تأكيد العربون' : 'وصل طلب الحجز!'}</h3>
          <p className="text-sm text-(--muted) leading-relaxed">
            شكراً <b>{customer.name}</b>. {done.names}.
            {done.status === 'deposit' ? ' سنراجع التحويل ويصلك إيميل عند تأكيد العربون. إذا لم يتأكد خلال 24 ساعة يتحرر الحجز.' : done.status !== 'confirmed' ? ' سيصلك إيميل عند تأكيد الحجز.' : ''}
          </p>
          {signup && live && page && <AccountSignup draft={signup} owner={page.owner} project={page.project} pageName={page.pageName} accent={accent} dark={false} />}
          <button type="button" onClick={() => { setDone(null); setCustomer(EMPTY_CUSTOMER); setDeposit(EMPTY_DEPOSIT); setAccepted(false); }} className="h-11 px-6 rounded-full text-white text-sm font-bold cursor-pointer bg-(--accent)">حجز جديد</button>
        </div>
      </Root>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!schedule || booked.length === 0) return setError('السلة فارغة.');
    if (!ready) return setError('أكمل تواريخ كل عنصر في السلة.');
    if (schedule.termsOn && !accepted) return setError('لازم توافق على الشروط لتكمل الحجز.');
    const personal = customerProblem(customer, live, signedIn);
    if (personal) return setError(personal);
    if (live && amount > 0) {
      const problem = depositProblem(deposit, found?.payments);
      if (problem) return setError(problem);
    }
    const names = booked.map((r) => `${r.unit.name}${r.line.qty > 1 ? ` × ${r.line.qty}` : ''} · ${label(r.line.date)}`).join('، ');
    if (!live || !page) return setDone({ status: 'new', names });
    setSaving(true);
    const soonest = booked.map((r) => r.line.date).sort()[0];
    const out = await createBooking({
      owner: page.owner, project: page.project, schedule: schedule.id, pageName: page.pageName,
      date: soonest, startMin: 0, slot: `${booked.length} ${booked.length === 1 ? 'عنصر' : 'عناصر'}`, meetingType: '', room: booked[0].unit.id,
      rent: {
        by: booked[0].mode,
        items: booked.map((r) => ({
          room: r.unit.id, qty: r.line.qty, by: r.mode, date: r.line.date,
          ...(r.mode === 'day' ? { checkOut: r.line.checkOut } : {}),
          ...(r.mode === 'hour' ? { start: r.line.start ?? undefined, hours: r.hours } : {}),
          ...(r.mode === 'period' ? { period: r.line.period } : {}),
          driver: r.line.driver, extras: r.line.extras, guests: guestsOf(r.unit, r.line.guests),
        })),
      },
      acceptTerms: accepted,
      name: customer.name, phone: customer.phone, email: customer.email, address: customer.address, desc: customer.desc,
      needsConfirmation: schedule.needsConfirmation, deposit: depositPayload(deposit, amount),
    } as any);
    setSaving(false);
    if ('error' in out) {
      if (out.error === 'taken') setError('انحجز أحد العناصر في هذه الفترة قبل لحظات. غيّر التواريخ وجرّب مرة ثانية.');
      else if (out.error === 'deposit_required') setError('لازم تدفع العربون وتكتب رقم العملية.');
      else if (out.error === 'terms_required') setError('لازم توافق على الشروط لتكمل الحجز.');
      else if (out.error === 'bad_email') setError('تأكد من الإيميل.');
      else if (out.error === 'bad_rent' || out.error === 'no_rooms' || out.error === 'bad_schedule' || out.error === 'bad_date') setError('تغيّرت إعدادات الإيجار أو التواريخ. حدّث الصفحة وجرّب مرة ثانية.');
      else setError(`ما قدرنا نحفظ الحجز. جرّب مرة ثانية. (رمز: ${out.error})`);
      return;
    }
    setSignup(customer.register && !signedIn ? customer : null);
    cart.clear();
    setDone({ status: out.deposit ? 'deposit' : out.status, names });
  };

  return (
    <Root look={look} isPreviewActive={isPreviewActive}>
      <form onSubmit={submit} className="h-full overflow-y-auto px-6 py-5 space-y-6" onWheel={stop} style={lookVars(look)}>
        <div className="flex items-center gap-2 font-bold text-lg">
          <ClipboardList size={20} className="text-(--accent)" />
          <span>إتمام الحجز</span>
        </div>
        <Section n={1} title="بياناتك">
          <CustomerFields draft={customer} onChange={setCustomer} dark={false} accent={accent} />
        </Section>
        {amount > 0 && (
          <Section n={2} title="العربون">
            <DepositPay payments={found?.payments} amount={amount} accent={accent} dark={false} value={deposit} onChange={setDeposit} />
          </Section>
        )}
        {schedule?.termsOn && (
          <div className="space-y-1.5">
            <label className="flex items-start gap-2 text-sm font-bold cursor-pointer">
              <input type="checkbox" className="mt-1" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              <span>قرأت الشروط وأوافق عليها</span>
            </label>
            <button type="button" onClick={() => setShowTerms((v) => !v)} className="text-xs font-bold underline cursor-pointer text-(--accent)">{showTerms ? 'إخفاء الشروط' : 'اقرأ الشروط'}</button>
            {showTerms && <div className="max-h-48 overflow-y-auto rounded-xl border border-(--line) p-3 text-xs leading-relaxed text-(--muted) whitespace-pre-line">{schedule.terms || DEFAULT_TERMS.other}</div>}
          </div>
        )}
        {error && <div className="text-xs font-bold text-red-600">{error}</div>}
        <button type="submit" disabled={saving} className="w-full h-12 rounded-full text-white text-sm font-bold cursor-pointer disabled:opacity-60 bg-(--accent)">
          {saving ? 'جاري الحجز…' : `احجز${ready ? ` · ${money(total, currency)}` : ''}`}
        </button>
      </form>
    </Root>
  );
};

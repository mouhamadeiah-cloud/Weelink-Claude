// A car's money file, floating over the admin window: what the car cost (purchase and expenses),
// «تم البيع» with the buyer and what he paid, later payments of the rest, and the car's profit.
// Every amount paid through the cash box or the bank is booked in the accounts as it is entered.
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, BadgeCheck, Undo2, Wallet, CalendarClock, FileText } from 'lucide-react';
import { CarAdminData, CarDocType, CAR_DOC_TYPES, EXPENSE_CATEGORIES, MONEY_ACCOUNTS, MoneyAccount } from '../carTypes';
import { carSubtitle, carTitle } from '../carModel';
import {
  accountLabel, addCarExpense, addSalePayment, carCost, carExpensesTotal, carProfit, emptyCustomer, removeCarExpense,
  removeSalePayment, salePaid, saleRemaining, saveCustomer, sellCar, todayKey, undoSale, CustomerDraft, reserveCar, cancelReservation,
} from '../carMoney';
import { Card, Field, inputClass, inputFitClass, PrimaryButton, GhostButton, formatDate } from '../../shop/adminUi';
import { CustomerFields, Segmented, money } from './moneyUi';

interface Props {
  data: CarAdminData;
  update: (fn: (d: CarAdminData) => CarAdminData) => void;
  carId: string;
  onClose: () => void;
  initial?: 'sale' | 'reserve';
  onNewDocument?: (type: CarDocType, carId: string) => void;
  onOpenDocument?: (docId: string) => void;
}

const num = (v: string) => {
  const n = parseFloat(v.replace(/,/g, ''));
  return isFinite(n) && n > 0 ? n : 0;
};
const dateText = (d: string) => (d ? formatDate(`${d}T12:00:00`) : '');

const Row: React.FC<{ label: string; value: string; strong?: boolean; color?: string }> = ({ label, value, strong, color }) => (
  <div className={`flex justify-between gap-3 py-1.5 text-xs ${strong ? 'border-t border-neutral-200 mt-1 pt-2.5' : ''}`}>
    <span className={strong ? 'font-black text-[#1d1d1f]' : 'font-bold text-neutral-500'}>{label}</span>
    <span className={`font-black ${strong ? 'text-sm' : ''}`} style={{ color }}>{value}</span>
  </div>
);

export const CarMoneyDialog: React.FC<Props> = ({ data, update, carId, onClose, initial = 'sale', onNewDocument, onOpenDocument }) => {
  const car = data.cars.find((c) => c.id === carId);
  const cur = car?.currency || data.settings.currency;
  const m = (n: number) => money(n, cur);

  // Expense form.
  const [exp, setExp] = useState({ category: EXPENSE_CATEGORIES[0], amount: '', date: todayKey(), account: 'cash' as MoneyAccount | 'none', note: '' });
  const [expError, setExpError] = useState('');
  // Sale form.
  // A reserved car starts the sale with its customer and with the deposit taken off what is due today.
  const held = car?.reservation;
  const [sale, setSale] = useState({
    price: car?.price ? String(car.price) : '',
    date: todayKey(),
    paid: car?.price ? String(Math.max(0, car.price - (held?.deposit || 0))) : '',
    account: 'cash' as MoneyAccount,
    note: '',
  });
  const [buyerMode, setBuyerMode] = useState<'existing' | 'new'>(held?.customerId || data.customers.length ? 'existing' : 'new');
  const [buyerId, setBuyerId] = useState(held?.customerId || '');
  // Reservation form.
  const [reserving, setReserving] = useState(initial === 'reserve' && !held);
  const [res, setRes] = useState({ deposit: '', date: todayKey(), account: 'cash' as MoneyAccount, note: '' });
  const [refundAccount, setRefundAccount] = useState<MoneyAccount>(held?.account || 'cash');
  const [buyer, setBuyer] = useState<CustomerDraft>(emptyCustomer());
  const [saleError, setSaleError] = useState('');
  // Payment form.
  const [pay, setPay] = useState({ amount: '', date: todayKey(), account: 'cash' as MoneyAccount, note: '' });

  // Once the car is reserved here, the sale starts from that customer and the deposit.
  const heldKey = held ? `${held.customerId}|${held.deposit}` : '';
  useEffect(() => {
    if (!held) return;
    setBuyerMode('existing');
    setBuyerId(held.customerId);
    setSale((s) => ({ ...s, paid: car?.price ? String(Math.max(0, car.price - held.deposit)) : s.paid }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heldKey]);

  useEffect(() => {
    // A document opened from here sits on top and handles Escape itself.
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('[data-car-doc-editor]')) { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  if (!car) return null;
  const sold = !!car.sale;
  const remaining = saleRemaining(car);
  const buyerOf = car.sale ? data.customers.find((c) => c.id === car.sale!.customerId) : undefined;

  const addExpense = () => {
    const amount = num(exp.amount);
    if (!amount) return setExpError('اكتب مبلغًا أكبر من صفر.');
    setExpError('');
    update((d) => addCarExpense(d, car.id, { category: exp.category, amount, date: exp.date || todayKey(), account: exp.account, note: exp.note.trim() }));
    setExp({ ...exp, amount: '', note: '' });
  };

  const deposit = car.reservation?.deposit || 0;
  const heldBy = car.reservation ? data.customers.find((c) => c.id === car.reservation!.customerId) : undefined;

  // The chosen customer: a saved one, or the new one typed in the form (saved first).
  const withBuyer = (d: CarAdminData, role: 'buyer' | 'interested'): { data: CarAdminData; id: string } => {
    if (buyerMode === 'existing') return { data: d, id: buyerId };
    return saveCustomer(d, { ...buyer, name: buyer.name.trim(), roles: [role] });
  };
  const buyerMissing = () => (buyerMode === 'new' ? !buyer.name.trim() : !buyerId);

  const confirmSale = () => {
    const price = num(sale.price);
    if (!price) return setSaleError('اكتب سعر البيع.');
    if (price < deposit) return setSaleError('سعر البيع أقل من العربون المدفوع.');
    const paid = Math.min(num(sale.paid), price - deposit);
    if (buyerMissing()) return setSaleError('اكتب اسم المشتري أو اختر زبونًا محفوظًا.');
    setSaleError('');
    update((d) => {
      const b = withBuyer(d, 'buyer');
      return sellCar(b.data, car.id, { date: sale.date || todayKey(), price, customerId: b.id, note: sale.note.trim(), paidNow: paid, account: sale.account });
    });
  };

  const confirmReserve = () => {
    if (buyerMissing()) return setSaleError('اكتب اسم الزبون أو اختر زبونًا محفوظًا.');
    setSaleError('');
    update((d) => {
      const b = withBuyer(d, 'interested');
      return reserveCar(b.data, car.id, { date: res.date || todayKey(), customerId: b.id, deposit: num(res.deposit), account: res.account, note: res.note.trim() });
    });
    setReserving(false);
  };

  const endReservation = (refund: boolean) => {
    const msg = deposit > 0
      ? refund ? `إلغاء الحجز وإرجاع العربون (${m(deposit)}) للزبون من ${accountLabel(refundAccount)}؟` : `إلغاء الحجز وإبقاء العربون (${m(deposit)}) للمعرض؟`
      : 'إلغاء الحجز؟';
    if (!window.confirm(msg)) return;
    update((d) => cancelReservation(d, car.id, refund, refundAccount));
  };

  const buyerPicker = (label: string) => (
    <Field label={label}>
      <div className="space-y-3">
        <Segmented label={label} options={[{ id: 'existing' as const, label: 'زبون محفوظ' }, { id: 'new' as const, label: 'زبون جديد' }]} value={buyerMode} onChange={setBuyerMode} />
        {buyerMode === 'existing' ? (
          <select className={inputClass} value={buyerId} onChange={(e) => setBuyerId(e.target.value)} aria-label="اختر الزبون">
            <option value="">اختر الزبون</option>
            {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}
          </select>
        ) : (
          <CustomerFields value={buyer} onChange={setBuyer} compact />
        )}
      </div>
    </Field>
  );

  const addPayment = () => {
    const amount = Math.min(num(pay.amount), remaining);
    if (!amount) return;
    update((d) => addSalePayment(d, car.id, { amount, date: pay.date || todayKey(), account: pay.account, note: pay.note.trim() }));
    setPay({ ...pay, amount: '', note: '' });
  };

  const cancelSale = () => {
    if (!window.confirm(car.sale?.payments.some((p) => p.fromDeposit) ? 'إلغاء البيع؟ تعود السيارة «محجوزة» ويبقى عربونها، وتُحذف باقي دفعات البيع من الحسابات.' : 'إلغاء البيع؟ تعود السيارة «متاحة» وتُحذف دفعات بيعها من الحسابات.')) return;
    update((d) => undoSale(d, car.id));
  };

  const accountOptions = MONEY_ACCOUNTS.map((a) => ({ id: a.id, label: a.label }));

  return createPortal(
    <div className="fixed inset-0 z-[1000002] bg-black/30 flex items-center justify-center p-2 sm:p-6" onMouseDown={onClose}>
      <div dir="rtl" className="w-full max-w-4xl max-h-full bg-[#f5f5f7] rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden text-right font-sans" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="الملف المالي للسيارة">
        <header className="flex items-center gap-3 px-4 sm:px-6 h-16 bg-white border-b border-neutral-200 shrink-0">
          <div className="w-12 h-9 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
            {car.images[0] && <img src={car.images[0]} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-[#1d1d1f] truncate">{carTitle(car)} · {carSubtitle(car)}</div>
            <div className="text-[10px] text-neutral-400 font-bold">{car.stockNumber} · الملف المالي</div>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-neutral-100 text-neutral-500 flex items-center justify-center cursor-pointer" aria-label="إغلاق"><X size={18} /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6 grid lg:grid-cols-[1fr_280px] gap-4 items-start">
          <div className="space-y-4 min-w-0">
            {/* The sale */}
            {!sold && car.reservation && (
              <Card title="محجوزة">
                <div className="grid sm:grid-cols-3 gap-2">
                  <div className="rounded-xl bg-[#f5f5f7] p-3"><div className="text-[10px] font-bold text-neutral-400">محجوزة لـ</div><div className="text-sm font-black truncate">{heldBy?.name || '—'}</div></div>
                  <div className="rounded-xl bg-[#f5f5f7] p-3"><div className="text-[10px] font-bold text-neutral-400">العربون</div><div className="text-sm font-black text-[#34a853]">{m(deposit)}</div></div>
                  <div className="rounded-xl bg-[#f5f5f7] p-3"><div className="text-[10px] font-bold text-neutral-400">تاريخ الحجز</div><div className="text-sm font-black">{dateText(car.reservation.date)}</div></div>
                </div>
                {car.reservation.note && <div className="text-xs text-neutral-600">{car.reservation.note}</div>}
                <div className="flex flex-wrap items-end gap-2">
                  {deposit > 0 && <Field label="الإرجاع من"><Segmented label="الإرجاع من" options={accountOptions} value={refundAccount} onChange={setRefundAccount} /></Field>}
                  <GhostButton onClick={() => endReservation(true)} className="h-10">{deposit > 0 ? 'إلغاء الحجز وإرجاع العربون' : 'إلغاء الحجز'}</GhostButton>
                  {deposit > 0 && <GhostButton onClick={() => endReservation(false)} className="h-10">إلغاء الحجز وبقاء العربون للمعرض</GhostButton>}
                </div>
              </Card>
            )}
            {!sold && reserving && !car.reservation ? (
              <Card title="حجز بعربون" actions={<GhostButton onClick={() => setReserving(false)}>بيع مباشرة بدل الحجز</GhostButton>}>
                <div className="grid sm:grid-cols-3 gap-3">
                  <Field label={`العربون (${cur})`} hint="اتركه فارغًا لحجز بدون عربون"><input className={inputClass} dir="ltr" inputMode="decimal" value={res.deposit} onChange={(e) => setRes({ ...res, deposit: e.target.value })} /></Field>
                  <Field label="تاريخ الحجز"><input type="date" className={inputClass} value={res.date} onChange={(e) => setRes({ ...res, date: e.target.value })} /></Field>
                  <Field label="استلمنا العربون في"><Segmented label="استلمنا العربون في" options={accountOptions} value={res.account} onChange={(account) => setRes({ ...res, account })} /></Field>
                </div>
                {buyerPicker('الزبون')}
                <Field label="ملاحظة"><input className={inputClass} value={res.note} placeholder="مثال: الحجز حتى نهاية الأسبوع" onChange={(e) => setRes({ ...res, note: e.target.value })} /></Field>
                {saleError && <div className="text-[11px] text-red-600 font-bold">{saleError}</div>}
                <PrimaryButton onClick={confirmReserve} className="w-full h-11 flex items-center justify-center gap-1.5 !bg-[#f29900] hover:!bg-[#d98900]"><CalendarClock size={16} /> تأكيد الحجز</PrimaryButton>
              </Card>
            ) : !sold ? (
              <Card title="تم البيع" actions={!car.reservation && <GhostButton onClick={() => setReserving(true)} className="flex items-center gap-1"><CalendarClock size={13} /> حجز بعربون</GhostButton>}>
                <div className="grid sm:grid-cols-3 gap-3">
                  <Field label={`سعر البيع (${cur})`}><input className={inputClass} dir="ltr" inputMode="decimal" value={sale.price} onChange={(e) => setSale({ ...sale, price: e.target.value })} /></Field>
                  <Field label="تاريخ البيع"><input type="date" className={inputClass} value={sale.date} onChange={(e) => setSale({ ...sale, date: e.target.value })} /></Field>
                  <Field label={`المدفوع اليوم (${cur})`} hint={deposit > 0 ? `بعد العربون ${m(deposit)}؛ الباقي يبقى دينًا على المشتري` : 'الباقي يبقى دينًا على المشتري'}><input className={inputClass} dir="ltr" inputMode="decimal" value={sale.paid} onChange={(e) => setSale({ ...sale, paid: e.target.value })} /></Field>
                </div>
                <Field label="استلمنا المبلغ في"><Segmented label="استلمنا المبلغ في" options={accountOptions} value={sale.account} onChange={(account) => setSale({ ...sale, account })} /></Field>
                {buyerPicker('المشتري')}
                <Field label="ملاحظة"><input className={inputClass} value={sale.note} placeholder="مثال: البيع مع نقل الملكية" onChange={(e) => setSale({ ...sale, note: e.target.value })} /></Field>
                {saleError && <div className="text-[11px] text-red-600 font-bold">{saleError}</div>}
                <PrimaryButton onClick={confirmSale} className="w-full h-11 flex items-center justify-center gap-1.5 !bg-[#34a853] hover:!bg-[#2d9047]"><BadgeCheck size={16} /> تأكيد البيع</PrimaryButton>
              </Card>
            ) : (
              <Card
                title="البيع"
                actions={<GhostButton onClick={cancelSale} className="flex items-center gap-1 text-red-500"><Undo2 size={13} /> إلغاء البيع</GhostButton>}
              >
                <div className="grid sm:grid-cols-3 gap-2">
                  <div className="rounded-xl bg-[#f5f5f7] p-3"><div className="text-[10px] font-bold text-neutral-400">سعر البيع</div><div className="text-sm font-black">{m(car.sale!.price)}</div></div>
                  <div className="rounded-xl bg-[#f5f5f7] p-3"><div className="text-[10px] font-bold text-neutral-400">المدفوع</div><div className="text-sm font-black text-[#34a853]">{m(salePaid(car))}</div></div>
                  <div className="rounded-xl bg-[#f5f5f7] p-3"><div className="text-[10px] font-bold text-neutral-400">المتبقي على المشتري</div><div className={`text-sm font-black ${remaining > 0 ? 'text-[#f29900]' : 'text-neutral-400'}`}>{m(remaining)}</div></div>
                </div>
                <div className="text-xs text-neutral-600">
                  بيعت في {dateText(car.sale!.date)}{buyerOf ? <> إلى <b className="text-[#1d1d1f]">{buyerOf.name}</b>{buyerOf.phone ? ` · ${buyerOf.phone}` : ''}</> : ''}{car.sale!.note ? ` · ${car.sale!.note}` : ''}
                </div>
                <div className="space-y-1.5">
                  {car.sale!.payments.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg border border-neutral-100 bg-[#fbfbfd] text-xs">
                      <span className="flex-1 font-bold">{p.fromDeposit ? 'العربون' : i === 0 ? 'دفعة البيع' : `دفعة ${i + 1}`}{p.note && !p.fromDeposit ? ` · ${p.note}` : ''}</span>
                      <span className="text-neutral-400">{dateText(p.date)} · {accountLabel(p.account)}</span>
                      <span className="font-black text-[#34a853]">{m(p.amount)}</span>
                      <button type="button" onClick={() => update((d) => removeSalePayment(d, car.id, p.id))} aria-label="حذف الدفعة" className="text-neutral-300 hover:text-red-500 cursor-pointer"><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
                {remaining > 0 && (
                  <div className="flex flex-wrap items-end gap-2 pt-1">
                    <Field label={`دفعة جديدة (${cur})`}><input className={`${inputFitClass} w-32`} dir="ltr" inputMode="decimal" value={pay.amount} placeholder={String(remaining)} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
                    <Field label="التاريخ"><input type="date" className={`${inputFitClass} w-40`} value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} /></Field>
                    <Field label="في"><Segmented label="الدفعة في" options={accountOptions} value={pay.account} onChange={(account) => setPay({ ...pay, account })} /></Field>
                    <PrimaryButton onClick={addPayment} className="flex items-center gap-1"><Plus size={14} /> تسجيل الدفعة</PrimaryButton>
                  </div>
                )}
              </Card>
            )}

            {/* Expenses */}
            <Card title={`مصاريف السيارة (${car.expenses.length})`}>
              <div className="flex flex-wrap gap-1.5">
                {EXPENSE_CATEGORIES.map((c) => (
                  <button key={c} type="button" onClick={() => setExp({ ...exp, category: c })} aria-pressed={exp.category === c}
                    className={`h-8 px-3 rounded-full border text-[11px] font-bold cursor-pointer ${exp.category === c ? 'border-[#0071e3] bg-blue-50 text-[#0071e3]' : 'border-neutral-200 bg-white text-neutral-600'}`}>{c}</button>
                ))}
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <Field label={`المبلغ (${cur})`}><input className={`${inputFitClass} w-28`} dir="ltr" inputMode="decimal" value={exp.amount} onChange={(e) => setExp({ ...exp, amount: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addExpense()} /></Field>
                <Field label="التاريخ"><input type="date" className={`${inputFitClass} w-40`} value={exp.date} onChange={(e) => setExp({ ...exp, date: e.target.value })} /></Field>
                <div className="flex-1 min-w-[140px]"><Field label="ملاحظة"><input className={inputClass} value={exp.note} placeholder="مثال: تبديل فحمات" onChange={(e) => setExp({ ...exp, note: e.target.value })} /></Field></div>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-2">
                <Field label="دُفع من">
                  <Segmented label="دُفع من" options={[...accountOptions, { id: 'none' as const, label: 'بدون تسجيل' }]} value={exp.account} onChange={(account) => setExp({ ...exp, account })} />
                </Field>
                <PrimaryButton onClick={addExpense} className="flex items-center gap-1"><Plus size={14} /> إضافة مصروف</PrimaryButton>
              </div>
              {expError && <div className="text-[11px] text-red-600 font-bold">{expError}</div>}
              {car.expenses.length > 0 && (
                <div className="space-y-1.5">
                  {car.expenses.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg border border-neutral-100 bg-[#fbfbfd] text-xs">
                      <span className="flex-1 min-w-0 truncate font-bold">{e.category}{e.note ? ` · ${e.note}` : ''}</span>
                      <span className="text-neutral-400 shrink-0">{dateText(e.date)} · {accountLabel(e.account)}</span>
                      <span className="font-black text-[#f29900] shrink-0">{m(e.amount)}</span>
                      <button type="button" onClick={() => update((d) => removeCarExpense(d, car.id, e.id))} aria-label="حذف المصروف" className="text-neutral-300 hover:text-red-500 cursor-pointer"><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-0 space-y-3">
            <Card title="حساب السيارة">
              <div>
                <Row label="سعر الشراء" value={m(car.purchasePrice)} />
                <Row label="المصاريف" value={m(carExpensesTotal(car))} />
                <Row label="الكلفة الكلية" value={m(carCost(car))} strong />
                {sold ? (
                  <>
                    <Row label="سعر البيع" value={m(car.sale!.price)} />
                    <Row label="الربح" value={m(carProfit(car))} strong color={carProfit(car) >= 0 ? '#34a853' : '#ff3b30'} />
                  </>
                ) : (
                  <>
                    <Row label="السعر المعروض" value={car.price ? m(car.price) : '—'} />
                    <Row label="الربح المتوقع" value={car.price ? m(car.price - carCost(car)) : '—'} strong color="#34a853" />
                  </>
                )}
              </div>
            </Card>
            {onNewDocument && (
              <Card title="الأوراق">
                <div className="space-y-1.5">
                  {CAR_DOC_TYPES.map((t) => (
                    <button key={t.id} type="button" onClick={() => onNewDocument(t.id, car.id)} className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-bold flex items-center gap-2 cursor-pointer">
                      <Plus size={14} className="text-[#0071e3]" />
                      <span className="flex-1 text-right">{t.label}</span>
                    </button>
                  ))}
                  {data.documents.filter((x) => x.carId === car.id).map((x) => (
                    <button key={x.id} type="button" onClick={() => onOpenDocument?.(x.id)} className="w-full h-9 px-3 rounded-xl bg-white/60 hover:bg-white text-[11px] font-bold text-neutral-600 flex items-center gap-2 cursor-pointer">
                      <FileText size={13} className="text-neutral-400" />
                      <span className="flex-1 text-right truncate">{CAR_DOC_TYPES.find((t) => t.id === x.type)!.label}</span>
                      <span dir="ltr" className="text-neutral-400">{x.number}</span>
                      <span className={x.showroomSignature && x.customerSignature ? 'text-[#1e7a34]' : 'text-[#b06f00]'}>{x.showroomSignature && x.customerSignature ? 'موقّعة' : 'غير موقّعة'}</span>
                    </button>
                  ))}
                </div>
              </Card>
            )}
            <p className="text-[10px] text-neutral-400 leading-relaxed flex gap-1.5">
              <Wallet size={13} className="shrink-0" />
              <span>
                ما يُدفع من الصندوق أو البنك يُسجَّل في «الحسابات» تلقائيًا. سعر الشراء {car.purchaseAccount === 'none' ? 'غير مسجل في الحسابات؛ اختر من أين دُفع في «إضافة سيارة ← السعر والشراء».' : `مسجل من ${accountLabel(car.purchaseAccount)}.`}
              </span>
            </p>
          </aside>
        </div>
      </div>
    </div>,
    document.body
  );
};

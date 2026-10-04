// A car's money file, floating over the admin window: what the car cost (purchase and expenses),
// «تم البيع» with the buyer and what he paid, later payments of the rest, and the car's profit.
// Every amount paid through the cash box or the bank is booked in the accounts as it is entered.
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, BadgeCheck, Undo2, Wallet } from 'lucide-react';
import { CarAdminData, EXPENSE_CATEGORIES, MONEY_ACCOUNTS, MoneyAccount } from '../carTypes';
import { carSubtitle, carTitle } from '../carModel';
import {
  accountLabel, addCarExpense, addSalePayment, carCost, carExpensesTotal, carProfit, emptyCustomer, removeCarExpense,
  removeSalePayment, salePaid, saleRemaining, saveCustomer, sellCar, todayKey, undoSale, CustomerDraft,
} from '../carMoney';
import { Card, Field, inputClass, inputFitClass, PrimaryButton, GhostButton, formatDate } from '../../shop/adminUi';
import { CustomerFields, Segmented, money } from './moneyUi';

interface Props {
  data: CarAdminData;
  update: (fn: (d: CarAdminData) => CarAdminData) => void;
  carId: string;
  onClose: () => void;
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

export const CarMoneyDialog: React.FC<Props> = ({ data, update, carId, onClose }) => {
  const car = data.cars.find((c) => c.id === carId);
  const cur = car?.currency || data.settings.currency;
  const m = (n: number) => money(n, cur);

  // Expense form.
  const [exp, setExp] = useState({ category: EXPENSE_CATEGORIES[0], amount: '', date: todayKey(), account: 'cash' as MoneyAccount | 'none', note: '' });
  const [expError, setExpError] = useState('');
  // Sale form.
  const [sale, setSale] = useState({ price: car?.price ? String(car.price) : '', date: todayKey(), paid: car?.price ? String(car.price) : '', account: 'cash' as MoneyAccount, note: '' });
  const [buyerMode, setBuyerMode] = useState<'existing' | 'new'>(data.customers.length ? 'existing' : 'new');
  const [buyerId, setBuyerId] = useState('');
  const [buyer, setBuyer] = useState<CustomerDraft>(emptyCustomer());
  const [saleError, setSaleError] = useState('');
  // Payment form.
  const [pay, setPay] = useState({ amount: '', date: todayKey(), account: 'cash' as MoneyAccount, note: '' });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
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

  const confirmSale = () => {
    const price = num(sale.price);
    if (!price) return setSaleError('اكتب سعر البيع.');
    const paid = Math.min(num(sale.paid), price);
    if (buyerMode === 'new' && !buyer.name.trim()) return setSaleError('اكتب اسم المشتري أو اختر زبونًا محفوظًا.');
    if (buyerMode === 'existing' && !buyerId) return setSaleError('اختر المشتري.');
    setSaleError('');
    update((d) => {
      let next = d;
      let customerId = buyerId;
      if (buyerMode === 'new') {
        const saved = saveCustomer(next, { ...buyer, name: buyer.name.trim(), roles: ['buyer'] });
        next = saved.data;
        customerId = saved.id;
      }
      return sellCar(next, car.id, { date: sale.date || todayKey(), price, customerId, note: sale.note.trim(), paidNow: paid, account: sale.account });
    });
  };

  const addPayment = () => {
    const amount = Math.min(num(pay.amount), remaining);
    if (!amount) return;
    update((d) => addSalePayment(d, car.id, { amount, date: pay.date || todayKey(), account: pay.account, note: pay.note.trim() }));
    setPay({ ...pay, amount: '', note: '' });
  };

  const cancelSale = () => {
    if (!window.confirm('إلغاء البيع؟ تعود السيارة «متاحة» وتُحذف دفعات بيعها من الحسابات.')) return;
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
            {!sold ? (
              <Card title="تم البيع">
                <div className="grid sm:grid-cols-3 gap-3">
                  <Field label={`سعر البيع (${cur})`}><input className={inputClass} dir="ltr" inputMode="decimal" value={sale.price} onChange={(e) => setSale({ ...sale, price: e.target.value })} /></Field>
                  <Field label="تاريخ البيع"><input type="date" className={inputClass} value={sale.date} onChange={(e) => setSale({ ...sale, date: e.target.value })} /></Field>
                  <Field label={`المدفوع اليوم (${cur})`} hint="الباقي يبقى دينًا على المشتري"><input className={inputClass} dir="ltr" inputMode="decimal" value={sale.paid} onChange={(e) => setSale({ ...sale, paid: e.target.value })} /></Field>
                </div>
                <Field label="استلمنا المبلغ في"><Segmented label="استلمنا المبلغ في" options={accountOptions} value={sale.account} onChange={(account) => setSale({ ...sale, account })} /></Field>
                <Field label="المشتري">
                  <div className="space-y-3">
                    <Segmented label="المشتري" options={[{ id: 'existing' as const, label: 'زبون محفوظ' }, { id: 'new' as const, label: 'زبون جديد' }]} value={buyerMode} onChange={setBuyerMode} />
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
                      <span className="flex-1 font-bold">{i === 0 ? 'دفعة البيع' : `دفعة ${i + 1}`}{p.note ? ` · ${p.note}` : ''}</span>
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

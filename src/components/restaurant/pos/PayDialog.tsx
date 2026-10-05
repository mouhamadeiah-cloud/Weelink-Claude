// الدفع: the whole bill, some of its dishes (each guest pays what he ate), an amount, or the bill split
// equally between several people. The method is picked (cash, Sham Cash...), and for cash the
// money handed over gives the change. Dishes not yet sent go to the kitchen with the payment.
import React, { useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { PAYMENT_METHODS } from '../restaurantTypes';
import { CASH, Tab, tabTotals, unsentItems } from '../staffTypes';
import { formatMoney } from '../../shop/adminUi';
import { Modal, BigButton } from './posUi';

type Mode = 'all' | 'items' | 'amount' | 'split';

const MODES: { id: Mode; label: string }[] = [
  { id: 'all', label: 'كامل الفاتورة' },
  { id: 'items', label: 'بالأصناف' },
  { id: 'amount', label: 'مبلغ' },
  { id: 'split', label: 'تقسيم بالتساوي' },
];

const parse = (v: string) => {
  const n = parseFloat(v.replace(/[,\s]/g, ''));
  return isFinite(n) && n > 0 ? n : 0;
};

export interface PayRequest {
  amount: number;
  method: string;
  note: string;
  items?: Record<string, number>;
  given: number; // cash handed over (0 = exact)
}

export const PayDialog: React.FC<{ tab: Tab; currency: string; busy: boolean; onPay: (r: PayRequest) => void; onClose: () => void }> = ({ tab, currency, busy, onPay, onClose }) => {
  const { due, total, paid } = tabTotals(tab);
  const [mode, setMode] = useState<Mode>('all');
  const [method, setMethod] = useState(CASH);
  const [amountText, setAmountText] = useState('');
  const [givenText, setGivenText] = useState('');
  const [people, setPeople] = useState(2);
  const [sel, setSel] = useState<Record<string, number>>({});
  const open = useMemo(() => tab.items.filter((i) => !i.voided && i.qty - i.paidQty > 0), [tab.items]);
  const money = (n: number) => formatMoney(n, currency);

  const itemsAmount = open.reduce((s, i) => s + (sel[i.id] || 0) * i.unitPrice, 0);
  const amount = Math.min(due, Math.round((mode === 'all' ? due : mode === 'items' ? itemsAmount : mode === 'amount' ? parse(amountText) : due / people) * 100) / 100);
  const given = method === CASH ? parse(givenText) : 0;
  const change = given > amount ? Math.round((given - amount) * 100) / 100 : 0;
  const unsent = unsentItems(tab).length;
  const note = mode === 'items' ? 'بالأصناف' : mode === 'split' ? `حصة من ${people}` : mode === 'amount' ? 'دفعة جزئية' : '';

  const setQty = (id: string, max: number, d: number) => setSel((s) => ({ ...s, [id]: Math.max(0, Math.min(max, (s[id] || 0) + d)) }));

  return (
    <Modal
      title={`الدفع · المتبقي ${money(due)}`}
      onClose={onClose}
      wide
      footer={
        <BigButton tone="green" className="w-full h-14 text-base" disabled={busy || amount <= 0 || (method === CASH && given > 0 && given < amount)} onClick={() => onPay({ amount, method, note, items: mode === 'items' ? sel : undefined, given })}>
          {amount >= due ? 'تحصيل وإغلاق الطاولة' : 'تحصيل'} {money(amount)}
        </BigButton>
      }
    >
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-2xl bg-neutral-50"><div className="text-[11px] font-bold text-neutral-400">الإجمالي</div><div className="font-black">{money(total)}</div></div>
        <div className="p-2 rounded-2xl bg-neutral-50"><div className="text-[11px] font-bold text-neutral-400">مدفوع</div><div className="font-black text-[#2F9E44]">{money(paid)}</div></div>
        <div className="p-2 rounded-2xl bg-[#FFF4E6]"><div className="text-[11px] font-bold text-[#A34A00]">المتبقي</div><div className="font-black text-[#E8590C]">{money(due)}</div></div>
      </div>

      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button key={m.id} type="button" onClick={() => setMode(m.id)} className={`h-11 px-4 rounded-2xl text-sm font-black cursor-pointer ${mode === m.id ? 'bg-[#1d1d1f] text-white' : 'bg-neutral-100 text-neutral-600'}`}>{m.label}</button>
        ))}
      </div>

      {mode === 'items' && (
        <div className="space-y-1.5">
          {open.length === 0 && <div className="text-sm text-neutral-400 font-bold">كل الأصناف مدفوعة.</div>}
          {open.map((i) => {
            const left = i.qty - i.paidQty;
            const n = sel[i.id] || 0;
            return (
              <div key={i.id} className={`flex items-center gap-2 p-2 rounded-2xl border ${n ? 'border-[#2F9E44] bg-[#EBFBEE]' : 'border-neutral-200'}`}>
                <button type="button" onClick={() => setSel((s) => ({ ...s, [i.id]: n ? 0 : left }))} className="flex-1 min-w-0 text-right cursor-pointer">
                  <div className="text-sm font-black truncate">{i.name}</div>
                  <div className="text-[11px] font-bold text-neutral-400">{money(i.unitPrice)} · باقٍ {left}</div>
                </button>
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="إنقاص" onClick={() => setQty(i.id, left, -1)} className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center cursor-pointer"><Minus size={14} /></button>
                  <span className="w-6 text-center font-black">{n}</span>
                  <button type="button" aria-label="زيادة" onClick={() => setQty(i.id, left, 1)} className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center cursor-pointer"><Plus size={14} /></button>
                </div>
              </div>
            );
          })}
          {tabTotals(tab).discount > 0 && <div className="text-[11px] font-bold text-neutral-400">الخصم يُحسب على آخر دفعة.</div>}
        </div>
      )}

      {mode === 'amount' && (
        <input autoFocus className="w-full h-14 px-4 rounded-2xl border border-neutral-200 text-2xl font-black outline-none focus:border-neutral-400" dir="ltr" inputMode="decimal" placeholder="0" value={amountText} onChange={(e) => setAmountText(e.target.value)} />
      )}

      {mode === 'split' && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-black">عدد الأشخاص</span>
          <div className="flex items-center gap-1 rounded-2xl bg-neutral-100 p-1">
            <button type="button" aria-label="إنقاص" onClick={() => setPeople((p) => Math.max(2, p - 1))} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center cursor-pointer"><Minus size={16} /></button>
            <span className="w-8 text-center font-black text-lg">{people}</span>
            <button type="button" aria-label="زيادة" onClick={() => setPeople((p) => Math.min(30, p + 1))} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center cursor-pointer"><Plus size={16} /></button>
          </div>
          <span className="text-sm font-bold text-neutral-500">كل شخص {money(Math.round((due / people) * 100) / 100)}</span>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-sm font-black">طريقة الدفع</div>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((m) => (
            <button key={m} type="button" onClick={() => setMethod(m)} className={`h-11 px-4 rounded-2xl text-sm font-bold border cursor-pointer ${method === m ? 'bg-[#2F9E44] border-[#2F9E44] text-white' : 'bg-white border-neutral-200 text-neutral-600'}`}>{m}</button>
          ))}
        </div>
      </div>

      {method === CASH && amount > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-black">المبلغ المستلم</label>
          <input className="w-40 h-12 px-3 rounded-2xl border border-neutral-200 text-lg font-black outline-none focus:border-neutral-400" dir="ltr" inputMode="decimal" placeholder={String(amount)} value={givenText} onChange={(e) => setGivenText(e.target.value)} />
          {change > 0 && <span className="h-12 px-4 rounded-2xl bg-[#FFF9DB] text-[#8a6d00] text-base font-black inline-flex items-center">الباقي للزبون {money(change)}</span>}
          {given > 0 && given < amount && <span className="text-sm font-bold text-[#E03131]">المبلغ أقل من المطلوب</span>}
        </div>
      )}

      {unsent > 0 && <div className="text-xs font-bold text-[#E8590C]">{unsent} من الأصناف لم تُرسل للمطبخ بعد، وتُرسل مع الدفع.</div>}
    </Modal>
  );
};

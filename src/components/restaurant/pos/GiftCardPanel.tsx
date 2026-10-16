// The cashier's fixed catalog «بطاقة رصيد»: ready amounts the owner set, or any amount typed by hand.
// Picking one puts a card on the bill (its number is booked at once, the card starts working when the
// bill is paid).
import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { GiftCardSettings } from '../giftCardLogic';
import { formatMoney } from '../../shop/adminUi';
import { BigButton } from './posUi';

export const GiftCardPanel: React.FC<{ settings: GiftCardSettings; currency: string; busy: boolean; onAdd: (amount: number) => void }> = ({ settings, currency, busy, onAdd }) => {
  const [text, setText] = useState('');
  const n = Math.round((parseFloat(text.replace(/[,\s]/g, '')) || 0) * 100) / 100;
  return (
    <div className="flex-1 overflow-y-auto p-3 pt-0 bg-[#f5f5f7] space-y-3">
      <div className="flex items-center gap-2 text-sm font-black text-neutral-600"><CreditCard size={16} /> اختر مبلغ البطاقة</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
        {settings.amounts.map((a) => (
          <button key={a} type="button" disabled={busy} onClick={() => onAdd(a)} className="min-h-[72px] p-3 rounded-2xl bg-white border border-neutral-200 text-base font-black cursor-pointer active:scale-[0.97] transition disabled:opacity-40">
            {formatMoney(a, currency)}
          </button>
        ))}
      </div>
      {settings.amounts.length === 0 && !settings.custom && <div className="py-6 text-center text-sm font-bold text-neutral-400">لم يحدد المطعم مبالغ جاهزة.</div>}
      {settings.custom && (
        <div className="p-3 rounded-2xl bg-white border border-neutral-200 space-y-2">
          <div className="text-xs font-black text-neutral-500">مبلغ آخر</div>
          <div className="flex gap-2">
            <input dir="ltr" inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} placeholder="0" className="flex-1 min-w-0 h-12 px-3 rounded-2xl border border-neutral-200 text-lg font-black outline-none focus:border-neutral-400" />
            <BigButton tone="dark" className="h-12 px-5" disabled={busy || n <= 0} onClick={() => { onAdd(n); setText(''); }}>إضافة</BigButton>
          </div>
        </div>
      )}
    </div>
  );
};

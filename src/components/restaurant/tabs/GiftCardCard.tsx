// «بطاقة رصيد» in the catalogs: the owner turns the fixed catalog on, sets the ready amounts, whether the
// cashier may type another amount, and when a sold card expires (a year, six months, never, or a number
// of days, months or years).
import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { EXPIRY_UNITS, ExpiryUnit, GiftCardSettings, expiryPreset } from '../giftCardLogic';
import { Card, Field, Toggle } from '../../shop/adminUi';
import { formatMoney } from '../../shop/adminUi';
import { parseAmount } from './shared';

const PRESETS: { id: 'year' | 'six' | 'never' | 'custom'; label: string }[] = [
  { id: 'year', label: 'سنة' },
  { id: 'six', label: '6 أشهر' },
  { id: 'never', label: 'دائمًا' },
  { id: 'custom', label: 'مخصص' },
];

export const GiftCardCard: React.FC<{ value: GiftCardSettings; currency: string; onChange: (v: GiftCardSettings) => void }> = ({ value, currency, onChange }) => {
  const [text, setText] = useState('');
  const [customOn, setCustomOn] = useState(false);
  const preset = customOn ? 'custom' : expiryPreset(value.expiry);
  const set = (p: Partial<GiftCardSettings>) => onChange({ ...value, ...p });
  const addAmount = () => {
    const n = parseAmount(text);
    if (n > 0 && !value.amounts.includes(n)) set({ amounts: [...value.amounts, n].sort((a, b) => a - b).slice(0, 12) });
    setText('');
  };
  const pick = (id: (typeof PRESETS)[number]['id']) => {
    setCustomOn(id === 'custom');
    if (id === 'year') set({ expiry: { never: false, n: 1, unit: 'year' } });
    else if (id === 'six') set({ expiry: { never: false, n: 6, unit: 'month' } });
    else if (id === 'never') set({ expiry: { ...value.expiry, never: true } });
    else set({ expiry: { never: false, n: value.expiry.n, unit: value.expiry.unit } });
  };
  return (
    <Card title="بطاقة رصيد">
      <Toggle label="تفعيل كاتالوك «بطاقة رصيد» على الكاشير" checked={value.enabled} onChange={(enabled) => set({ enabled })} />
      {value.enabled && (
        <div className="space-y-4">
          <Field label="المبالغ الجاهزة" hint="تظهر للكاشير كأزرار. يُباع كل مبلغ كبطاقة برقم فريد يُطبع مع الفاتورة.">
            <div className="flex flex-wrap items-center gap-2">
              {value.amounts.map((a) => (
                <span key={a} className="h-9 pl-2 pr-3 rounded-full bg-neutral-100 text-sm font-black inline-flex items-center gap-1.5">
                  {formatMoney(a, currency)}
                  <button type="button" aria-label="حذف" onClick={() => set({ amounts: value.amounts.filter((x) => x !== a) })} className="w-6 h-6 rounded-full hover:bg-neutral-200 flex items-center justify-center cursor-pointer"><X size={12} /></button>
                </span>
              ))}
              <span className="inline-flex items-center gap-1">
                <input dir="ltr" inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addAmount()} placeholder="مبلغ جديد" className="w-32 h-9 px-3 rounded-xl border border-neutral-200 text-sm font-bold outline-none" />
                <button type="button" aria-label="إضافة مبلغ" onClick={addAmount} className="w-9 h-9 rounded-xl bg-[#1d1d1f] text-white flex items-center justify-center cursor-pointer"><Plus size={16} /></button>
              </span>
            </div>
          </Field>
          <Toggle label="يمكن للكاشير كتابة مبلغ آخر يدويًا" checked={value.custom} onChange={(custom) => set({ custom })} />
          <Field label="انتهاء صلاحية البطاقة" hint="يُحسب من يوم بيعها.">
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((p) => (
                <button key={p.id} type="button" onClick={() => pick(p.id)} className={`h-10 px-4 rounded-xl text-sm font-black cursor-pointer ${preset === p.id ? 'bg-[#1d1d1f] text-white' : 'bg-neutral-100 text-neutral-600'}`}>{p.label}</button>
              ))}
              {preset === 'custom' && (
                <span className="inline-flex items-center gap-2">
                  <input type="number" min={1} max={999} dir="ltr" value={value.expiry.n} onChange={(e) => set({ expiry: { ...value.expiry, never: false, n: Math.max(1, Math.min(999, Math.floor(Number(e.target.value)) || 1)) } })} className="w-20 h-10 px-3 rounded-xl border border-neutral-200 text-sm font-black outline-none" />
                  <select value={value.expiry.unit} onChange={(e) => set({ expiry: { ...value.expiry, never: false, unit: e.target.value as ExpiryUnit } })} className="h-10 px-3 rounded-xl border border-neutral-200 bg-white text-sm font-bold">
                    {EXPIRY_UNITS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
                  </select>
                </span>
              )}
            </div>
          </Field>
        </div>
      )}
    </Card>
  );
};

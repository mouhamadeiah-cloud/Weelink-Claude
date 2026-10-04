// Small controls shared by the showroom's money screens: a segmented choice, the customer form and
// money text that keeps a minus sign in front of its digits in right-to-left text.
import React from 'react';
import { CarCustomer, CUSTOMER_ROLES, CustomerRole } from '../carTypes';
import { CustomerDraft } from '../carMoney';
import { Field, inputClass, textareaClass, formatMoney } from '../../shop/adminUi';
import { SYRIAN_GOVERNORATES } from '../../shop/shopTypes';

export const money = (n: number, currency: string) => (n < 0 ? `⁦-${formatMoney(-n, '').trim()}⁩ ${currency}` : formatMoney(n, currency));

export function Segmented<T extends string>({ options, value, onChange, label }: { options: { id: T; label: string }[]; value: T; onChange: (id: T) => void; label: string }) {
  return (
    <div className="inline-flex flex-wrap p-1 rounded-xl bg-neutral-100 gap-0.5" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`h-8 px-3 rounded-lg text-[11px] font-bold transition cursor-pointer ${value === o.id ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-neutral-500'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const CustomerFields: React.FC<{ value: CustomerDraft; onChange: (v: CustomerDraft) => void; compact?: boolean }> = ({ value, onChange, compact }) => {
  const set = (changes: Partial<CustomerDraft>) => onChange({ ...value, ...changes });
  const toggleRole = (r: CustomerRole) => set({ roles: value.roles.includes(r) ? value.roles.filter((x) => x !== r) : [...value.roles, r] });
  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="الاسم الكامل *"><input className={inputClass} value={value.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="رقم الهاتف / واتساب"><input className={inputClass} dir="ltr" value={value.phone} placeholder="0991234567" onChange={(e) => set({ phone: e.target.value })} /></Field>
        <Field label="المحافظة">
          <select className={inputClass} value={value.city} onChange={(e) => set({ city: e.target.value })}>
            <option value="">اختر</option>
            {SYRIAN_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="الرقم الوطني"><input className={inputClass} dir="ltr" value={value.idNumber} onChange={(e) => set({ idNumber: e.target.value })} /></Field>
        {!compact && <Field label="العنوان"><input className={inputClass} value={value.address} onChange={(e) => set({ address: e.target.value })} /></Field>}
      </div>
      {!compact && (
        <>
          <Field label="الصفة">
            <div className="flex gap-1.5">
              {CUSTOMER_ROLES.map((r) => (
                <button key={r.id} type="button" aria-pressed={value.roles.includes(r.id)} onClick={() => toggleRole(r.id)}
                  className={`h-9 px-3 rounded-xl border text-xs font-bold cursor-pointer ${value.roles.includes(r.id) ? 'border-[#0071e3] bg-blue-50 text-[#0071e3]' : 'border-neutral-200 bg-white text-neutral-600'}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="ملاحظات"><textarea className={textareaClass} value={value.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
        </>
      )}
    </div>
  );
};

// A phone number as a wa.me link (Syrian 09… numbers become 9639…).
export const customerWhatsapp = (c: Pick<CarCustomer, 'phone'>) => {
  let d = c.phone.replace(/[^\d]/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = `963${d.slice(1)}`;
  return d ? `https://wa.me/${d}` : '';
};

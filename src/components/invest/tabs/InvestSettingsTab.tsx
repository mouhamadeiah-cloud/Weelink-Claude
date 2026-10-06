// إعدادات الشركة: the company's name, currency and contact numbers (used by the WhatsApp and call
// buttons on every project's page), whether visitors can send investment requests, whether completed
// projects stay on the site, and the note shown under every project.
import React from 'react';
import { InvestSettings, INVEST_CURRENCIES } from '../investTypes';
import { Card, Field, inputClass, textareaClass, Toggle } from '../../shop/adminUi';
import { InvestTabProps } from './ProjectEditor';

export const InvestSettingsTab: React.FC<InvestTabProps> = ({ data, update }) => {
  const s = data.settings;
  const set = (changes: Partial<InvestSettings>) => update((d) => ({ ...d, settings: { ...d.settings, ...changes } }));
  return (
    <div className="space-y-4 max-w-2xl">
      <Card title="الشركة">
        <Field label="اسم الشركة"><input className={inputClass} value={s.companyName} placeholder="مثال: شركة الشام للاستثمار" onChange={(e) => set({ companyName: e.target.value })} /></Field>
        <Field label="العملة الافتراضية" hint="عملة المشاريع الجديدة؛ لكل مشروع أن يختار عملته">
          <div className="flex gap-1.5">
            {INVEST_CURRENCIES.map((c) => (
              <button key={c} type="button" onClick={() => set({ currency: c })} className={`h-10 min-w-[56px] px-3 rounded-xl border text-sm font-bold cursor-pointer ${s.currency === c ? 'border-[#0071e3] bg-blue-50 text-[#0071e3]' : 'border-neutral-200 bg-white text-neutral-600'}`}>
                {c}
              </button>
            ))}
          </div>
        </Field>
        <div className="rounded-xl border border-neutral-200 px-3 py-1.5">
          <Toggle checked={s.showCompleted} onChange={(showCompleted) => set({ showCompleted })} label="إبقاء المشاريع المنجزة ظاهرة كأعمال سابقة" />
        </div>
      </Card>
      <Card title="التواصل">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="رقم واتساب" hint="مع رمز الدولة بدون + أو أصفار، مثل 963991234567"><input className={inputClass} dir="ltr" value={s.whatsappNumber} onChange={(e) => set({ whatsappNumber: e.target.value.replace(/[^\d]/g, '') })} /></Field>
          <Field label="رقم الهاتف"><input className={inputClass} dir="ltr" value={s.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
          <Field label="البريد الإلكتروني"><input className={inputClass} dir="ltr" value={s.email} onChange={(e) => set({ email: e.target.value })} /></Field>
          <Field label="العنوان"><input className={inputClass} value={s.address} onChange={(e) => set({ address: e.target.value })} /></Field>
        </div>
        <div className="rounded-xl border border-neutral-200 px-3 py-1.5">
          <Toggle checked={s.acceptRequests} onChange={(acceptRequests) => set({ acceptRequests })} label="إظهار «أرغب بالاستثمار» في صفحة كل مشروع مفتوح" />
        </div>
      </Card>
      <Card title="تنويه للمستثمرين">
        <Field label="نص التنويه" hint="يظهر أسفل صفحة كل مشروع">
          <textarea className={`${textareaClass} min-h-[100px]`} value={s.disclaimer} onChange={(e) => set({ disclaimer: e.target.value })} />
        </Field>
      </Card>
    </div>
  );
};

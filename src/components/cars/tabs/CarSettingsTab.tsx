// إعدادات المعرض: the showroom's name, currency and contact numbers (used by the WhatsApp and call
// buttons on every car's page), and whether sold cars stay visible.
import React from 'react';
import { CarSettings, CAR_CURRENCIES } from '../carTypes';
import { Card, Field, inputClass, Toggle } from '../../shop/adminUi';
import { CarTabProps } from './CarEditor';

export const CarSettingsTab: React.FC<CarTabProps> = ({ data, update }) => {
  const s = data.settings;
  const set = (changes: Partial<CarSettings>) => update((d) => ({ ...d, settings: { ...d.settings, ...changes } }));
  return (
    <div className="space-y-4 max-w-2xl">
      <Card title="المعرض">
        <Field label="اسم المعرض"><input className={inputClass} value={s.showroomName} placeholder="مثال: معرض الشام للسيارات" onChange={(e) => set({ showroomName: e.target.value })} /></Field>
        <Field label="العملة الافتراضية" hint="عملة السيارات الجديدة؛ لكل سيارة أن تختار عملتها">
          <div className="flex gap-1.5">
            {CAR_CURRENCIES.map((c) => (
              <button key={c} type="button" onClick={() => set({ currency: c })} className={`h-10 min-w-[56px] px-3 rounded-xl border text-sm font-bold cursor-pointer ${s.currency === c ? 'border-[#0071e3] bg-blue-50 text-[#0071e3]' : 'border-neutral-200 bg-white text-neutral-600'}`}>
                {c}
              </button>
            ))}
          </div>
        </Field>
        <div className="rounded-xl border border-neutral-200 px-3 py-1.5">
          <Toggle checked={s.showSold} onChange={(showSold) => set({ showSold })} label="إبقاء السيارات المباعة ظاهرة مع شارة «مباعة»" />
        </div>
      </Card>
      <Card title="التواصل">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="رقم واتساب" hint="مع رمز الدولة بدون + أو أصفار، مثل 963991234567"><input className={inputClass} dir="ltr" value={s.whatsappNumber} onChange={(e) => set({ whatsappNumber: e.target.value.replace(/[^\d]/g, '') })} /></Field>
          <Field label="رقم الهاتف"><input className={inputClass} dir="ltr" value={s.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
          <Field label="العنوان"><input className={inputClass} value={s.address} onChange={(e) => set({ address: e.target.value })} /></Field>
          <Field label="أوقات الدوام"><input className={inputClass} value={s.workingHours} placeholder="يوميًا من 9 صباحًا حتى 9 مساءً" onChange={(e) => set({ workingHours: e.target.value })} /></Field>
        </div>
        <p className="text-[11px] text-neutral-400 leading-relaxed">يستخدم زرّا «استفسر عبر واتساب» و«اتصل بنا» في صفحة كل سيارة هذين الرقمين، وترسل رسالة واتساب اسم السيارة ورقمها تلقائيًا.</p>
      </Card>
    </div>
  );
};

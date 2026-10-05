// إعدادات المطعم: name, currency and contact details, and how the website takes orders (on/off,
// delivery, pickup, delivery fee, minimum order and a note above the order form).
import React from 'react';
import { RestaurantSettings } from '../restaurantTypes';
import { Card, Field, inputClass, inputFitClass, textareaClass, Toggle } from '../../shop/adminUi';
import { RestaurantTabProps, parseAmount } from './shared';

export const RestaurantSettingsTab: React.FC<RestaurantTabProps> = ({ data, update }) => {
  const s = data.settings;
  const set = (p: Partial<RestaurantSettings>) => update((d) => ({ ...d, settings: { ...d.settings, ...p } }));
  return (
    <div className="space-y-4">
      <Card title="المطعم">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="اسم المطعم"><input className={inputClass} value={s.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="العملة"><input className={inputClass} value={s.currency} onChange={(e) => set({ currency: e.target.value })} placeholder="ل.س" /></Field>
          <Field label="رقم واتساب لاستقبال الطلبات" hint="مع رمز الدولة، مثلاً 963991234567"><input className={inputClass} dir="ltr" inputMode="tel" value={s.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} /></Field>
          <Field label="رقم الهاتف"><input className={inputClass} dir="ltr" inputMode="tel" value={s.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
          <Field label="العنوان"><input className={inputClass} value={s.address} onChange={(e) => set({ address: e.target.value })} /></Field>
          <Field label="أوقات العمل"><input className={inputClass} value={s.hours} onChange={(e) => set({ hours: e.target.value })} /></Field>
        </div>
      </Card>
      <Card title="الكاشير والنادل">
        <Toggle label="الزبون يدفع عند أي عامل (إذا أوقفته: فقط عند من فتح الطاولة، أو المدير)" checked={s.payAnyWorker} onChange={(payAnyWorker) => set({ payAnyWorker })} />
        <Field label="قفل شاشة الكاشير والتابلت تلقائيًا" hint="بعد هذه المدة بدون استعمال يُطلب الرقم السري من جديد، مفيد إذا تشارك عدة عمال جهازًا واحدًا.">
          <select className="h-10 px-3 rounded-xl border border-neutral-200 bg-white text-sm font-bold" value={s.autoLockMinutes} onChange={(e) => set({ autoLockMinutes: Number(e.target.value) })}>
            {[0, 1, 2, 5, 10].map((m) => <option key={m} value={m}>{m ? `بعد ${m} دقيقة` : 'بدون قفل تلقائي'}</option>)}
          </select>
        </Field>
      </Card>
      <Card title="شاشة الانتظار">
        <Field label="الطلبات التي تظهر على شاشة الانتظار" hint="تعرض أرقام الطلبات قيد التحضير، وتنقلها إلى «جاهز للاستلام» عندما يجهّزها المطبخ.">
          <select className="h-10 px-3 rounded-xl border border-neutral-200 bg-white text-sm font-bold" value={s.boardShows} onChange={(e) => set({ boardShows: e.target.value === 'all' ? 'all' : 'takeaway' })}>
            <option value="takeaway">طلبات السفري والاستلام فقط</option>
            <option value="all">كل الطلبات (مع الطاولات والتوصيل)</option>
          </select>
        </Field>
      </Card>
      <Card title="الطلب أونلاين">
        <Toggle label="استقبال الطلبات من الموقع" checked={s.acceptOrders} onChange={(acceptOrders) => set({ acceptOrders })} />
        <Toggle label="إرسال نسخة من الطلب على واتساب أيضًا" checked={s.whatsappCopy} onChange={(whatsappCopy) => set({ whatsappCopy })} />
        <Toggle label="توصيل" checked={s.delivery} onChange={(delivery) => set({ delivery, ...(!delivery && !s.pickup ? { pickup: true } : {}) })} />
        <Toggle label="استلام من المطعم" checked={s.pickup} onChange={(pickup) => set({ pickup, ...(!pickup && !s.delivery ? { delivery: true } : {}) })} />
        <div className="flex flex-wrap gap-3">
          <Field label={`رسوم التوصيل (${s.currency})`} hint="0 = توصيل مجاني"><input className={`${inputFitClass} w-40`} dir="ltr" inputMode="decimal" value={s.deliveryFee || ''} placeholder="0" onChange={(e) => set({ deliveryFee: parseAmount(e.target.value) })} /></Field>
          <Field label={`الحد الأدنى للطلب (${s.currency})`} hint="0 = بلا حد"><input className={`${inputFitClass} w-40`} dir="ltr" inputMode="decimal" value={s.minOrder || ''} placeholder="0" onChange={(e) => set({ minOrder: parseAmount(e.target.value) })} /></Field>
        </div>
        <Field label="ملاحظة فوق نموذج الطلب (اختيارية)"><textarea className={textareaClass} placeholder="مثلاً: نوصل داخل المزة والمالكي فقط" value={s.orderNote} onChange={(e) => set({ orderNote: e.target.value })} /></Field>
      </Card>
    </div>
  );
};

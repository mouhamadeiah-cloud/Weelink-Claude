// الإعدادات: sender email and message templates, WhatsApp, payment methods and delivery.
import React from 'react';
import { Mail, MessageCircle, CreditCard, Truck, Store } from 'lucide-react';
import { ShopSettings, DeliveryFeeMode } from '../shopTypes';
import { Card, Field, inputClass, textareaClass, Toggle } from '../adminUi';
import { AdminTabProps } from './tabProps';

const FEE_MODES: { id: DeliveryFeeMode; label: string; hint: string }[] = [
  { id: 'highest', label: 'أعلى أجرة توصيل', hint: 'طلب الزبون الواحد يدفع أجرة توصيل واحدة: الأعلى بين منتجاته.' },
  { id: 'sum', label: 'مجموع أجور التوصيل', hint: 'تُجمع أجرة توصيل كل منتج في الطلب.' },
];

export const SettingsTab: React.FC<AdminTabProps> = ({ data, update }) => {
  const s = data.settings;
  const set = (patch: Partial<ShopSettings>) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  const setPay = (patch: Partial<ShopSettings['payments']>) => set({ payments: { ...s.payments, ...patch } });
  const setDelivery = (patch: Partial<ShopSettings['delivery']>) => set({ delivery: { ...s.delivery, ...patch } });

  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <Card title="المتجر">
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <Field label="اسم المتجر"><input className={inputClass} value={s.storeName} onChange={(e) => set({ storeName: e.target.value })} /></Field>
          <Field label="العملة"><input className={inputClass} value={s.currency} onChange={(e) => set({ currency: e.target.value })} /></Field>
        </div>
      </Card>

      <Card title="التواصل" actions={<MessageCircle size={16} className="text-[#34c759]" />}>
        <Field label="رقم الواتساب للتواصل" hint="بالصيغة الدولية، مثال: 963912345678">
          <input className={inputClass} value={s.whatsappNumber} onChange={(e) => set({ whatsappNumber: e.target.value })} dir="ltr" inputMode="tel" />
        </Field>
      </Card>

      <Card title="البريد الإلكتروني" actions={<Mail size={16} className="text-[#0071e3]" />}>
        <Field label="البريد الذي تُرسل منه رسائل التأكيد والعروض">
          <input className={inputClass} type="email" value={s.senderEmail} onChange={(e) => set({ senderEmail: e.target.value })} dir="ltr" placeholder="shop@example.com" />
        </Field>
        <Field label="رسالة تأكيد الطلب" hint="يُستبدل {رقم_الطلب} برقم الطلب.">
          <textarea className={textareaClass} value={s.orderConfirmationMessage} onChange={(e) => set({ orderConfirmationMessage: e.target.value })} />
        </Field>
        <Field label="رسالة العروض">
          <textarea className={textareaClass} value={s.offersMessage} onChange={(e) => set({ offersMessage: e.target.value })} />
        </Field>
        <p className="text-[10px] text-amber-600 font-bold leading-relaxed">
          الإرسال الفعلي للرسائل يحتاج ربط خدمة بريد بخادم، وسيُضاف لاحقاً. تُحفظ الرسائل هنا جاهزة لذلك.
        </p>
      </Card>

      <Card title="وسائل الدفع" actions={<CreditCard size={16} className="text-[#5e5ce6]" />}>
        <Toggle label="الدفع نقداً (كاش)" checked={s.payments.cash} onChange={(cash) => setPay({ cash })} />
        <div className="border-t border-neutral-100" />
        <Toggle label="شام كاش" checked={s.payments.shamCash} onChange={(shamCash) => setPay({ shamCash })} />
        {s.payments.shamCash && (
          <Field label="رقم حساب شام كاش"><input className={inputClass} value={s.payments.shamCashAccount} onChange={(e) => setPay({ shamCashAccount: e.target.value })} dir="ltr" /></Field>
        )}
        <div className="border-t border-neutral-100" />
        <Toggle label="سيريتل كاش" checked={s.payments.syriatelCash} onChange={(syriatelCash) => setPay({ syriatelCash })} />
        {s.payments.syriatelCash && (
          <Field label="رقم سيريتل كاش"><input className={inputClass} value={s.payments.syriatelCashNumber} onChange={(e) => setPay({ syriatelCashNumber: e.target.value })} dir="ltr" inputMode="tel" /></Field>
        )}
        <div className="border-t border-neutral-100" />
        <Toggle label="مخدّم دفع إلكتروني" checked={s.payments.gateway} onChange={(gateway) => setPay({ gateway })} />
        {s.payments.gateway && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="اسم المخدّم"><input className={inputClass} value={s.payments.gatewayProvider} onChange={(e) => setPay({ gatewayProvider: e.target.value })} placeholder="مثال: Stripe" /></Field>
              <Field label="رقم التاجر (Merchant ID)"><input className={inputClass} value={s.payments.gatewayMerchantId} onChange={(e) => setPay({ gatewayMerchantId: e.target.value })} dir="ltr" /></Field>
            </div>
            <p className="text-[10px] text-amber-600 font-bold leading-relaxed">
              سجّل حساباً لدى المخدّم أولاً. الربط الفعلي واستقبال الدفعات يحتاج خادماً وسيُضاف لاحقاً. لا تضع هنا مفاتيح سرية.
            </p>
          </>
        )}
      </Card>

      <Card title="التوصيل والاستلام" actions={<Truck size={16} className="text-[#ff9f0a]" />}>
        <Toggle label="التوصيل" checked={s.delivery.delivery} onChange={(delivery) => setDelivery({ delivery })} />
        {s.delivery.delivery && (
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <Field label={`أجرة التوصيل (${s.currency})`}>
              <input className={inputClass} type="number" min="0" value={s.delivery.deliveryFee || ''} onChange={(e) => setDelivery({ deliveryFee: Math.max(0, parseFloat(e.target.value) || 0) })} />
            </Field>
            <Field label="مناطق التوصيل"><input className={inputClass} value={s.delivery.deliveryAreas} onChange={(e) => setDelivery({ deliveryAreas: e.target.value })} placeholder="مثال: دمشق وريفها" /></Field>
          </div>
        )}
        {s.delivery.delivery && (
          <div className="space-y-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
            <div className="text-xs font-bold text-neutral-600">حساب أجرة التوصيل في السلة</div>
            <div className="grid sm:grid-cols-2 gap-2" role="radiogroup" aria-label="حساب أجرة التوصيل">
              {FEE_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={s.delivery.feeMode === m.id}
                  onClick={() => setDelivery({ feeMode: m.id })}
                  className={`text-right p-2.5 rounded-xl border transition cursor-pointer ${s.delivery.feeMode === m.id ? 'border-[#0071e3] bg-blue-50' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}
                >
                  <div className={`text-xs font-bold ${s.delivery.feeMode === m.id ? 'text-[#0071e3]' : 'text-[#1d1d1f]'}`}>{m.label}</div>
                  <div className="text-[10px] text-neutral-500 leading-relaxed mt-0.5">{m.hint}</div>
                </button>
              ))}
            </div>
            <Toggle label="توصيل مجاني عند الوصول لمبلغ معيّن" checked={s.delivery.freeEnabled} onChange={(freeEnabled) => setDelivery({ freeEnabled })} />
            {s.delivery.freeEnabled && (
              <Field label={`التوصيل مجاني عندما يبلغ مجموع المشتريات (${s.currency})`} hint="تُظهر السلة للزبون كم بقي له حتى يحصل على التوصيل المجاني.">
                <input className={`${inputClass} max-w-[200px]`} type="number" min="0" value={s.delivery.freeFrom || ''} onChange={(e) => setDelivery({ freeFrom: Math.max(0, parseFloat(e.target.value) || 0) })} />
              </Field>
            )}
          </div>
        )}
        <div className="border-t border-neutral-100" />
        <Toggle label="الاستلام من المتجر" checked={s.delivery.pickup} onChange={(pickup) => setDelivery({ pickup })} />
        {s.delivery.pickup && (
          <Field label="عنوان المتجر">
            <div className="relative">
              <Store size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input className={`${inputClass} pr-8`} value={s.delivery.storeAddress} onChange={(e) => setDelivery({ storeAddress: e.target.value })} />
            </div>
          </Field>
        )}
      </Card>
    </div>
  );
};

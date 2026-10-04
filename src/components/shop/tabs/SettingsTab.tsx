// الإعدادات: one group at a time, in order: general, the three e-wallets, delivery, notifications
// and the Sham Cash API link. Orders waiting for a payment check are handled on the orders page.
import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Store, Trash2 } from 'lucide-react';
import { ShopSettings, DeliveryFeeMode, WalletId, WalletSettings, WALLETS } from '../shopTypes';
import { Card, Field, inputClass, textareaClass, Toggle, PrimaryButton, GhostButton, uploadImageFile } from '../adminUi';
import { AdminTabProps } from './tabProps';

const FEE_MODES: { id: DeliveryFeeMode; label: string; hint: string }[] = [
  { id: 'highest', label: 'أكبر قيمة توصيل لعنصر', hint: 'طلب الزبون الواحد يدفع أجرة توصيل واحدة: الأعلى بين منتجاته.' },
  { id: 'sum', label: 'جمع كل أجور التوصيل', hint: 'تُجمع أجرة توصيل كل منتج في الطلب.' },
];

const MAIN_CURRENCIES = ['ل.س', '$', 'ل.ت'];
const CURRENCY_LABELS: Record<string, string> = { 'ل.س': 'ليرة سورية (ل.س)', $: 'دولار ($)', 'ل.ت': 'ليرة تركية (ل.ت)' };

const STEPS = ['عام', ...WALLETS.map((w) => w.label), 'التوصيل', 'الإشعارات', 'الربط API'];

const WalletStep: React.FC<{
  id: WalletId;
  wallet: WalletSettings;
  walletsEnabled: boolean;
  currency: string;
  onChange: (patch: Partial<WalletSettings>) => void;
}> = ({ id, wallet, walletsEnabled, currency, onChange }) => {
  const meta = WALLETS.find((w) => w.id === id)!;
  const [uploading, setUploading] = useState(false);

  const pickQr = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const url = await uploadImageFile(file);
    setUploading(false);
    if (url) onChange({ qrImage: url });
  };

  return (
    <Card title={meta.label}>
      {!walletsEnabled && (
        <p className="text-[11px] text-amber-600 font-bold">المحافظ الإلكترونية معطّلة في «عام»، فلن تظهر هذه المحفظة للزبون حتى تفعّلها هناك.</p>
      )}
      <Toggle label={`تفعيل ${meta.label}`} checked={wallet.enabled} onChange={(enabled) => onChange({ enabled })} />
      {wallet.enabled && (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={meta.accountLabel}>
              <input className={inputClass} value={wallet.account} onChange={(e) => onChange({ account: e.target.value })} dir="ltr" inputMode={meta.phone ? 'tel' : 'text'} />
            </Field>
            <Field label="اسم صاحب الحساب">
              <input className={inputClass} value={wallet.holderName} onChange={(e) => onChange({ holderName: e.target.value })} />
            </Field>
          </div>
          <Field label="صورة QR" hint="يمسحها الزبون من تطبيق المحفظة ليحوّل المبلغ.">
            <div className="flex items-center gap-3">
              {wallet.qrImage ? (
                <img src={wallet.qrImage} alt="QR" className="w-24 h-24 rounded-xl border border-neutral-200 object-contain bg-white" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-24 h-24 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center text-neutral-300"><ImagePlus size={22} /></div>
              )}
              <label className="h-9 px-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                {wallet.qrImage ? 'تغيير الصورة' : 'رفع صورة'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { pickQr(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              {wallet.qrImage && (
                <GhostButton onClick={() => onChange({ qrImage: '' })} aria-label="حذف صورة QR"><Trash2 size={13} /></GhostButton>
              )}
            </div>
          </Field>
          <div className="grid sm:grid-cols-[150px_1fr_1fr] gap-3">
            <Field label="نوع الرسوم الإضافية">
              <select className={inputClass} value={wallet.feeType} onChange={(e) => onChange({ feeType: e.target.value as WalletSettings['feeType'] })}>
                <option value="fixed">مبلغ ثابت</option>
                <option value="percent">نسبة مئوية</option>
              </select>
            </Field>
            <Field label={wallet.feeType === 'percent' ? 'الرسوم (%)' : `الرسوم (${currency})`} hint="تُضاف إلى المبلغ المطلوب. 0 = بدون رسوم.">
              <input className={inputClass} type="number" min="0" value={wallet.feeValue || ''} onChange={(e) => onChange({ feeValue: Math.max(0, parseFloat(e.target.value) || 0) })} />
            </Field>
            <Field label={`حد أدنى للطلب (${currency})`} hint="0 = بدون حد أدنى.">
              <input className={inputClass} type="number" min="0" value={wallet.minOrder || ''} onChange={(e) => onChange({ minOrder: Math.max(0, parseFloat(e.target.value) || 0) })} />
            </Field>
          </div>
          <Field label="تعليمات التحويل" hint="تظهر للزبون خطوةً بخطوة. اكتب كل خطوة في سطر.">
            <textarea className={textareaClass} value={wallet.instructions} onChange={(e) => onChange({ instructions: e.target.value })} placeholder={'افتح تطبيق المحفظة\nاختر «تحويل»\nأدخل الرقم والمبلغ ثم أكّد'} />
          </Field>
        </>
      )}
    </Card>
  );
};

export const SettingsTab: React.FC<AdminTabProps> = ({ data, update }) => {
  const [step, setStep] = useState(1);
  const s = data.settings;
  const set = (patch: Partial<ShopSettings>) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  const setPay = (patch: Partial<ShopSettings['payments']>) =>
    update((d) => ({ ...d, settings: { ...d.settings, payments: { ...d.settings.payments, ...patch } } }));
  const setWallet = (id: WalletId, patch: Partial<WalletSettings>) =>
    update((d) => {
      const p = d.settings.payments;
      return { ...d, settings: { ...d.settings, payments: { ...p, wallets: { ...p.wallets, [id]: { ...p.wallets[id], ...patch } } } } };
    });
  const setDelivery = (patch: Partial<ShopSettings['delivery']>) => set({ delivery: { ...s.delivery, ...patch } });
  const setNotify = (patch: Partial<ShopSettings['notifications']>) => set({ notifications: { ...s.notifications, ...patch } });
  const currencies = MAIN_CURRENCIES.includes(s.currency) ? MAIN_CURRENCIES : [s.currency, ...MAIN_CURRENCIES];
  const walletStep = step >= 2 && step < 2 + WALLETS.length ? WALLETS[step - 2] : null;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            {i > 0 && <ArrowLeft size={12} className="text-neutral-300" />}
            <button
              type="button"
              onClick={() => setStep(i + 1)}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-[11px] font-bold transition cursor-pointer ${step === i + 1 ? 'bg-[#1d1d1f] text-white' : step > i + 1 ? 'bg-white text-[#1d1d1f] border border-neutral-200' : 'bg-white text-neutral-400 border border-neutral-200'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === i + 1 ? 'bg-white text-[#1d1d1f]' : 'bg-neutral-100'}`}>{i + 1}</span>
              {label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <Card title="عام">
          <div className="grid grid-cols-[1fr_170px] gap-3">
            <Field label="اسم المتجر"><input className={inputClass} value={s.storeName} onChange={(e) => set({ storeName: e.target.value })} /></Field>
            <Field label="العملة">
              <select className={inputClass} value={s.currency} onChange={(e) => set({ currency: e.target.value })}>
                {currencies.map((c) => <option key={c} value={c}>{CURRENCY_LABELS[c] || c}</option>)}
              </select>
            </Field>
          </div>
          <Toggle label="تفعيل الدفع عند الاستلام" checked={s.payments.cash} onChange={(cash) => setPay({ cash })} />
          <Toggle label="تفعيل المحافظ الإلكترونية" checked={s.payments.walletsEnabled} onChange={(walletsEnabled) => setPay({ walletsEnabled })} />
          {s.payments.walletsEnabled && (
            <p className="text-[11px] text-neutral-500 leading-relaxed">اضبط كل محفظة في الخطوات التالية: سيريتل كاش، شام كاش، MTN كاش.</p>
          )}
          {!s.payments.cash && !s.payments.walletsEnabled && (
            <p className="text-[11px] text-amber-600 font-bold">فعّل وسيلة دفع واحدة على الأقل، وإلا يُعرض الدفع عند الاستلام.</p>
          )}
        </Card>
      )}

      {walletStep && (
        <WalletStep
          key={walletStep.id}
          id={walletStep.id}
          wallet={s.payments.wallets[walletStep.id]}
          walletsEnabled={s.payments.walletsEnabled}
          currency={s.currency}
          onChange={(patch) => setWallet(walletStep.id, patch)}
        />
      )}

      {step === 2 + WALLETS.length && (
        <Card title="التوصيل والاستلام">
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
              <div className="text-xs font-bold text-neutral-600">وضع تسعير التوصيل</div>
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
      )}

      {step === 3 + WALLETS.length && (
        <Card title="الإشعارات">
          <Toggle label="بريد تأكيد الطلب" checked={s.notifications.emailConfirmation} onChange={(emailConfirmation) => setNotify({ emailConfirmation })} />
          {s.notifications.emailConfirmation && (
            <>
              <Field label="البريد الذي يُرد عليه الزبون">
                <input className={inputClass} type="email" value={s.senderEmail} onChange={(e) => set({ senderEmail: e.target.value })} dir="ltr" placeholder="shop@example.com" />
              </Field>
              <Field label="قالب البريد" hint="يُستبدل {رقم_الطلب} برقم الطلب. يُستخدم القالب نفسه لرسالة واتساب.">
                <textarea className={textareaClass} value={s.orderConfirmationMessage} onChange={(e) => set({ orderConfirmationMessage: e.target.value })} />
              </Field>
              <p className="text-[10px] text-amber-600 font-bold leading-relaxed">
                الإرسال الفعلي للبريد يبدأ بعد ربط نطاق (Domain) خاص بالمنصة في خدمة البريد. القالب محفوظ وجاهز لذلك.
              </p>
            </>
          )}
          <div className="border-t border-neutral-100" />
          <Toggle label="تفعيل إشعار واتساب" checked={s.notifications.whatsappNotify} onChange={(whatsappNotify) => setNotify({ whatsappNotify })} />
          <Field label="رقم واتساب المتجر" hint="بالصيغة الدولية، مثال: 963912345678. يظهر في الطلبات زر يفتح واتساب برسالة التأكيد إلى رقم الزبون.">
            <input className={inputClass} value={s.whatsappNumber} onChange={(e) => set({ whatsappNumber: e.target.value })} dir="ltr" inputMode="tel" />
          </Field>
          <div className="border-t border-neutral-100" />
          <Field label="رسالة العروض">
            <textarea className={textareaClass} value={s.offersMessage} onChange={(e) => set({ offersMessage: e.target.value })} />
          </Field>
        </Card>
      )}

      {step === STEPS.length && (
        <Card title="الربط API (شام كاش)">
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100">
            <span className="text-xs font-bold text-neutral-600">حالة الربط</span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-500">
              <span className="w-2 h-2 rounded-full bg-neutral-400" /> غير متصل
            </span>
          </div>
          <Field label="مفتاح شام كاش (API Key)" hint="لا يُحفظ المفتاح هنا، لأن بيانات المتجر تُقرأ من صفحة المتجر. سيُحفظ على الخادم عند بناء الربط.">
            <input className={`${inputClass} bg-neutral-50`} disabled placeholder="يُضاف عند تفعيل الربط" dir="ltr" />
          </Field>
          <Field label="Webhook URL" hint="الرابط الذي يرسل إليه شام كاش إشعار الدفع.">
            <input className={inputClass} value={s.api.webhookUrl} onChange={(e) => set({ api: { ...s.api, webhookUrl: e.target.value } })} dir="ltr" placeholder="https://" />
          </Field>
          <p className="text-[10px] text-amber-600 font-bold leading-relaxed">
            حتى يتم الربط، يؤكد التاجر الدفعات يدوياً من صفحة الطلبات: «بانتظار تأكيد الدفع».
          </p>
        </Card>
      )}

      <div className="flex items-center gap-2">
        {step > 1 && (
          <GhostButton onClick={() => setStep(step - 1)} className="h-11 flex items-center gap-1"><ArrowRight size={13} /> رجوع</GhostButton>
        )}
        {step < STEPS.length && (
          <PrimaryButton onClick={() => setStep(step + 1)} className="flex-1 h-11 flex items-center justify-center gap-1.5">
            التالي: {STEPS[step]} <ArrowLeft size={14} />
          </PrimaryButton>
        )}
      </div>
    </div>
  );
};

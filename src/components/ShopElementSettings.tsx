// Settings for shop elements, shown at the top of the link panel: the product an
// "أضف إلى السلة" button adds (name, price, currency, photo), or the WhatsApp number a cart
// element sends finished orders to, or how a store products element lays out its products and a
// store search bar looks. Renders nothing for any other element.

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import type { CanvasElement, ShopLayout, ShopCardAnimation, ShopSearchStyle } from '../types';
import { CHECKOUT_TEXTS, CheckoutTextKey } from './shop/store/checkoutStore';

interface ShopElementSettingsProps {
  element: CanvasElement;
  onUpdateElement: (updates: Partial<CanvasElement>) => void;
}

const inputClass =
  'w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-[#B4532A] text-right';

const LAYOUTS: { id: ShopLayout; label: string }[] = [
  { id: 'grid', label: 'شبكة' },
  { id: 'zigzag', label: 'زجزاج' },
  { id: 'wide', label: 'بطاقة عرضية' },
  { id: 'small', label: 'بطاقات صغيرة' },
  { id: 'large', label: 'بطاقات كبيرة' },
  { id: 'marquee', label: 'شريط متحرك' },
  { id: 'spotlight', label: 'بطاقات بحركة' },
];

// Shared by the shop, the car showroom and the restaurant menu elements (same card animations).
export const CARD_ANIMATIONS: { id: ShopCardAnimation; label: string }[] = [
  { id: 'none', label: 'بدون' },
  { id: 'float', label: 'طفو' },
  { id: 'pulse', label: 'نبض' },
  { id: 'swing', label: 'تأرجح' },
  { id: 'shake', label: 'اهتزاز' },
  { id: 'shine', label: 'لمعة' },
];

const SEARCH_STYLES: { id: ShopSearchStyle; label: string }[] = [
  { id: 'minimal', label: 'بسيط' },
  { id: 'pill', label: 'بارز' },
  { id: 'glass', label: 'زجاجي' },
];

function Choices<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (id: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer transition ${
            value === o.id ? 'bg-[#B4532A] border-[#B4532A] text-white' : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[11px] font-bold text-neutral-600 pt-1">{children}</div>
);

const CART_TEXT_KEYS: { key: CheckoutTextKey; label: string }[] = [
  { key: 'summaryTitle', label: 'عنوان السلة' },
  { key: 'empty', label: 'نص السلة الفارغة' },
  { key: 'totalLabel', label: 'نص الإجمالي' },
];
const FORM_TEXT_KEYS: { key: CheckoutTextKey; label: string }[] = [
  { key: 'formTitle', label: 'عنوان البطاقة' },
  { key: 'details', label: 'عنوان البيانات' },
  { key: 'receive', label: 'عنوان الاستلام' },
  { key: 'payment', label: 'عنوان الدفع' },
  { key: 'submit', label: 'زر تأكيد الطلب' },
  { key: 'thanks', label: 'كلمة الشكر بعد الطلب' },
];

// The look and texts of the Online Shop's cart summary and order card. Background, border,
// corners, font and text colour are the element's own (format, colour and font panels).
const CheckoutLookSettings: React.FC<ShopElementSettingsProps & { keys: typeof CART_TEXT_KEYS; title: string }> = ({ element, onUpdateElement, keys, title }) => {
  const accent = element.shopAccent || element.styles.color || '#B4532A';
  const setText = (key: CheckoutTextKey, value: string) => {
    const next = { ...(element.shopTexts || {}), [key]: value };
    if (!value) delete next[key];
    onUpdateElement({ shopTexts: next });
  };
  return (
    <div className="space-y-2 p-3 rounded-2xl border border-[#B4532A]/20 bg-[#B4532A]/[0.04]" dir="rtl">
      <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
        <ShoppingBag size={14} className="text-[#B4532A]" />
        <span>{title}</span>
      </div>
      <label className="flex items-center justify-between gap-2 text-[11px] font-bold text-neutral-600">
        <span>لون الأزرار والأسعار</span>
        <input
          type="color"
          value={accent}
          // The first accent change moves a pre-accent cart's colour out of its text colour.
          onChange={(e) => onUpdateElement(element.shopAccent ? { shopAccent: e.target.value } : { shopAccent: e.target.value, styles: { ...element.styles, color: '#2A1F1A' } })}
          className="w-8 h-7 rounded-md border border-neutral-200 cursor-pointer bg-white"
          aria-label="لون الأزرار والأسعار"
        />
      </label>
      {keys.map(({ key, label }) => (
        <div key={key}>
          <Label>{label}</Label>
          <input className={inputClass} placeholder={CHECKOUT_TEXTS[key]} value={element.shopTexts?.[key] || ''} onChange={(e) => setText(key, e.target.value)} />
        </div>
      ))}
      <p className="text-[10px] text-neutral-500 leading-relaxed">
        الخلفية والإطار والزوايا ونوع الخط ولون النص تتغير من أدوات التنسيق مثل أي عنصر.
      </p>
    </div>
  );
};

export const ShopElementSettings: React.FC<ShopElementSettingsProps> = ({ element, onUpdateElement }) => {
  const product = element.cartProduct;

  if (element.type === 'checkout') {
    return <CheckoutLookSettings element={element} onUpdateElement={onUpdateElement} keys={FORM_TEXT_KEYS} title="بطاقة الطلب" />;
  }

  if (element.type === 'cart' && element.cartSplit) {
    return <CheckoutLookSettings element={element} onUpdateElement={onUpdateElement} keys={CART_TEXT_KEYS} title="ملخص السلة" />;
  }

  if (element.type === 'cart') {
    return (
      <div className="space-y-2 p-3 rounded-2xl border border-[#B4532A]/20 bg-[#B4532A]/[0.04]" dir="rtl">
        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
          <ShoppingBag size={14} className="text-[#B4532A]" />
          <span>رقم واتساب لاستقبال الطلبات</span>
        </div>
        <input
          className={inputClass}
          dir="ltr"
          placeholder="963991234567"
          value={element.cartWhatsapp || ''}
          onChange={(e) => onUpdateElement({ cartWhatsapp: e.target.value })}
        />
        <p className="text-[10px] text-neutral-500 leading-relaxed">
          اكتب الرقم مع رمز الدولة بدون + أو أصفار في البداية. زر «إرسال الطلب» يرسل كل محتوى السلة إلى هذا الرقم.
        </p>
      </div>
    );
  }

  if (element.type === 'shopProducts') {
    const layout = element.shopLayout || 'grid';
    return (
      <div className="space-y-2 p-3 rounded-2xl border border-[#B4532A]/20 bg-[#B4532A]/[0.04]" dir="rtl">
        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
          <ShoppingBag size={14} className="text-[#B4532A]" />
          <span>عرض منتجات المتجر</span>
        </div>
        <Label>المنتجات المعروضة</Label>
        <Choices
          options={[{ id: 'all', label: 'كل المنتجات' }, { id: 'featured', label: 'العروض المميزة فقط' }]}
          value={element.shopSource || 'all'}
          onChange={(id) => onUpdateElement({ shopSource: id as 'all' | 'featured' })}
        />
        <Label>طريقة العرض</Label>
        <Choices options={LAYOUTS} value={layout} onChange={(id) => onUpdateElement({ shopLayout: id })} />
        {layout === 'marquee' ? (
          <>
            <Label>سرعة الشريط: دورة كل {element.shopSpeed || 30} ثانية</Label>
            <input
              type="range"
              min={8}
              max={90}
              value={element.shopSpeed || 30}
              onChange={(e) => onUpdateElement({ shopSpeed: Number(e.target.value) })}
              className="w-full accent-[#B4532A]"
              dir="ltr"
            />
          </>
        ) : (
          <>
            <Label>حركة البطاقات</Label>
            <Choices
              options={CARD_ANIMATIONS}
              value={element.shopCardAnimation || (layout === 'spotlight' ? 'float' : 'none')}
              onChange={(id) => onUpdateElement({ shopCardAnimation: id })}
            />
          </>
        )}
        <Label>عدد المنتجات في الصفحة الواحدة (حتى 30)</Label>
        <input
          className={inputClass}
          type="number"
          min={0}
          placeholder="20"
          max={30}
          value={element.shopLimit || ''}
          onChange={(e) => onUpdateElement({ shopLimit: Math.min(30, Math.max(0, parseInt(e.target.value, 10) || 0)) || undefined })}
        />
        <p className="text-[10px] text-neutral-500 leading-relaxed">إذا زادت المنتجات عن هذا العدد تظهر أسهم «التالي» و«السابق» تحت البطاقات، ويستطيع الزبون اختيار عرض 20 أو 30 منتجًا. في الصفحة المنشورة تتمدد الشريحة لتتسع لكل البطاقات.</p>
      </div>
    );
  }

  if (element.type === 'shopSearch') {
    return (
      <div className="space-y-2 p-3 rounded-2xl border border-[#B4532A]/20 bg-[#B4532A]/[0.04]" dir="rtl">
        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
          <ShoppingBag size={14} className="text-[#B4532A]" />
          <span>شريط البحث في المتجر</span>
        </div>
        <Label>الشكل</Label>
        <Choices options={SEARCH_STYLES} value={element.shopSearchStyle || 'pill'} onChange={(id) => onUpdateElement({ shopSearchStyle: id })} />
        <Label>النص داخل الشريط</Label>
        <input className={inputClass} value={element.content} onChange={(e) => onUpdateElement({ content: e.target.value })} />
      </div>
    );
  }

  if (!product) return null;

  const update = (changes: Partial<typeof product>) => onUpdateElement({ cartProduct: { ...product, ...changes } });

  return (
    <div className="space-y-2 p-3 rounded-2xl border border-[#B4532A]/20 bg-[#B4532A]/[0.04]" dir="rtl">
      <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
        <ShoppingBag size={14} className="text-[#B4532A]" />
        <span>المنتج الذي يضيفه هذا الزر إلى السلة</span>
      </div>
      <input className={inputClass} placeholder="اسم المنتج" value={product.name} onChange={(e) => update({ name: e.target.value })} />
      <div className="flex gap-2">
        <input
          className={inputClass}
          type="number"
          min={0}
          placeholder="السعر"
          value={Number.isFinite(product.price) ? product.price : ''}
          onChange={(e) => update({ price: parseFloat(e.target.value) || 0 })}
        />
        <input className={`${inputClass} w-24`} placeholder="العملة" value={product.currency} onChange={(e) => update({ currency: e.target.value })} />
      </div>
      <input
        className={inputClass}
        dir="ltr"
        placeholder="رابط صورة المنتج (اختياري)"
        value={product.image || ''}
        onChange={(e) => update({ image: e.target.value || undefined })}
      />
      <p className="text-[10px] text-neutral-500 leading-relaxed">
        إذا غيّرت اسم المنتج أو سعره في البطاقة، غيّره هنا أيضًا ليظهر صحيحًا في السلة.
      </p>
    </div>
  );
};

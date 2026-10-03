// Settings for shop elements, shown at the top of the link panel: the product an
// "أضف إلى السلة" button adds (name, price, currency, photo), or the WhatsApp number a cart
// element sends finished orders to. Renders nothing for any other element.

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import type { CanvasElement } from '../types';

interface ShopElementSettingsProps {
  element: CanvasElement;
  onUpdateElement: (updates: Partial<CanvasElement>) => void;
}

const inputClass =
  'w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-[#B4532A] text-right';

export const ShopElementSettings: React.FC<ShopElementSettingsProps> = ({ element, onUpdateElement }) => {
  const product = element.cartProduct;

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

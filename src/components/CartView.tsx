// The 'cart' canvas element: lists what the visitor added with "أضف إلى السلة" buttons, lets
// them change quantities, and sends the whole order to the shop's WhatsApp in one message. In an
// Online Shop project it is the checkout page instead (CheckoutView).
// Controls only respond in preview / on the live site; in the editor the element stays draggable.

import React from 'react';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import type { CanvasElement } from '../types';
import { useCart, setCartQty, clearCart, cartTotal, formatPrice, buildWhatsappOrderUrl } from '../utils/cartStore';
import { useShopData } from './shop/store/ShopDataContext';
import { CartSummary, CheckoutForm, CheckoutView } from './shop/store/CheckoutView';
import { checkoutLook } from './shop/store/checkoutStore';

interface CartViewProps {
  elem: CanvasElement;
  isPreviewActive: boolean;
}

export const CartView: React.FC<CartViewProps> = ({ elem, isPreviewActive }) => {
  const items = useCart();
  const accent = elem.styles.color || '#B4532A';
  const currency = items[0]?.currency || '';
  const phone = elem.cartWhatsapp || '';
  const shop = useShopData();
  const total = cartTotal(items);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  // In an Online Shop the cart page is the checkout page: the cart summary beside the order card
  // (a 'checkout' element), or both in this element for carts made before the order card.
  if (shop) {
    const look = checkoutLook(elem);
    return elem.cartSplit ? <CartSummary look={look} isPreviewActive={isPreviewActive} /> : <CheckoutView look={look} isPreviewActive={isPreviewActive} />;
  }

  return (
    <div
      dir="rtl"
      className="w-full h-full bg-white rounded-3xl border border-black/[0.06] flex flex-col overflow-hidden font-['IBM_Plex_Sans_Arabic',sans-serif]"
      style={{ pointerEvents: isPreviewActive ? 'auto' : 'none' }}
      onClick={stop}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
        <div className="flex items-center gap-2 text-[#2A1F1A] font-bold text-lg">
          <ShoppingBag size={20} style={{ color: accent }} />
          <span>سلة المشتريات</span>
        </div>
        {items.length > 0 && (
          <button type="button" onClick={clearCart} className="text-xs text-neutral-400 hover:text-red-500 cursor-pointer">
            إفراغ السلة
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6">
          <ShoppingBag size={44} className="text-neutral-200" />
          <span className="text-base font-semibold text-neutral-600">سلتك فارغة</span>
          <span className="text-sm text-neutral-400">
            {isPreviewActive
              ? 'اضغط «أضف إلى السلة» تحت أي منتج ليظهر هنا.'
              : 'ستظهر هنا المنتجات التي يضيفها الزائر. جرّبها من وضع المعاينة.'}
          </span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 divide-y divide-black/[0.05]" onWheel={stop}>
          {items.map((item) => (
            <div key={item.key} className="flex items-center gap-4 py-3">
              {item.image ? (
                <img src={item.image} alt="" referrerPolicy="no-referrer" className="w-16 h-16 rounded-xl object-cover bg-neutral-100 shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-neutral-100 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#2A1F1A] truncate">{item.name}</div>
                <div className="text-sm text-neutral-500">{formatPrice(item.price, item.currency)}</div>
              </div>
              <div className="flex items-center gap-1 border border-black/[0.08] rounded-full px-1 py-0.5">
                <button type="button" aria-label="زيادة" onClick={() => setCartQty(item.key, item.qty + 1)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100 cursor-pointer">
                  <Plus size={14} />
                </button>
                <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                <button type="button" aria-label="إنقاص" onClick={() => setCartQty(item.key, item.qty - 1)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100 cursor-pointer">
                  <Minus size={14} />
                </button>
              </div>
              <div className="w-24 text-left font-bold" style={{ color: accent }}>
                {formatPrice(item.price * item.qty, item.currency)}
              </div>
              <button type="button" aria-label="حذف" onClick={() => setCartQty(item.key, 0)} className="text-neutral-300 hover:text-red-500 cursor-pointer">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="px-6 py-4 border-t border-black/[0.06] bg-[#FBF6EF] flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-neutral-500">المجموع</div>
          <div className="text-xl font-bold text-[#2A1F1A]">{formatPrice(total, currency)}</div>
        </div>
        <button
          type="button"
          disabled={items.length === 0 || !phone}
          onClick={() => window.open(buildWhatsappOrderUrl(items, phone), '_blank', 'noopener,noreferrer')}
          className="px-6 py-3 rounded-full text-white font-semibold text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          style={{ backgroundColor: accent }}
        >
          إرسال الطلب عبر واتساب
        </button>
      </div>
    </div>
  );
};

// The 'checkout' element: the Online Shop's order card (the visitor's details and payment).
export const CheckoutFormCard: React.FC<CartViewProps> = ({ elem, isPreviewActive }) => {
  const shop = useShopData();
  if (!shop) {
    return (
      <div dir="rtl" className="w-full h-full rounded-3xl border border-dashed border-black/[0.15] flex items-center justify-center p-6 text-center text-sm text-neutral-500">
        بطاقة الطلب تعمل في مشروع المتجر الإلكتروني فقط.
      </div>
    );
  }
  return <CheckoutForm look={checkoutLook(elem)} isPreviewActive={isPreviewActive} />;
};

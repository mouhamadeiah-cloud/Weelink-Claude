// The 'cart' canvas element: lists what the visitor added with "أضف إلى السلة" buttons, lets
// them change quantities, and sends the whole order to the shop's WhatsApp in one message. In an
// online shop it also adds the delivery fee (store settings) and shows how much is left to buy
// for free delivery.
// Controls only respond in preview / on the live site; in the editor the element stays draggable.

import React from 'react';
import { Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react';
import type { CanvasElement } from '../types';
import { useCart, setCartQty, clearCart, cartTotal, formatPrice, buildWhatsappOrderUrl } from '../utils/cartStore';
import { useShopData } from './shop/store/ShopDataContext';
import { deliveryQuote } from './shop/productModel';

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
  // Delivery only applies in an online shop that delivers.
  const quote = shop?.settings.delivery.delivery && items.length ? deliveryQuote(items, shop.products, shop.settings) : null;
  const total = cartTotal(items) + (quote?.fee || 0);
  const freeProgress = quote && quote.freeFrom > 0 ? Math.min(1, quote.subtotal / quote.freeFrom) : 0;

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

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

      {quote && (
        <div className="px-6 py-3 border-t border-black/[0.06] space-y-2 text-sm">
          <div className="flex items-center justify-between text-neutral-600">
            <span>المنتجات</span>
            <span className="font-semibold">{formatPrice(quote.subtotal, currency)}</span>
          </div>
          <div className="flex items-center justify-between text-neutral-600">
            <span className="flex items-center gap-1.5"><Truck size={15} /> التوصيل</span>
            <span className={`font-semibold ${quote.fee === 0 ? 'text-[#34a853]' : ''}`}>{quote.fee > 0 ? formatPrice(quote.fee, currency) : 'مجاني'}</span>
          </div>
          {quote.freeFrom > 0 && (
            <div className="space-y-1">
              <div className={`text-xs font-semibold ${quote.remaining > 0 ? 'text-[#5A4C42]' : 'text-[#34a853]'}`}>
                {quote.remaining > 0
                  ? `أضف ${formatPrice(quote.remaining, currency)} إلى مشترياتك لتحصل على توصيل مجاني`
                  : '🎉 حصلت على توصيل مجاني'}
              </div>
              <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${freeProgress * 100}%`, backgroundColor: quote.remaining > 0 ? accent : '#34a853' }} />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="px-6 py-4 border-t border-black/[0.06] bg-[#FBF6EF] flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-neutral-500">{quote ? 'المجموع مع التوصيل' : 'المجموع'}</div>
          <div className="text-xl font-bold text-[#2A1F1A]">{formatPrice(total, currency)}</div>
        </div>
        <button
          type="button"
          disabled={items.length === 0 || !phone}
          onClick={() => window.open(buildWhatsappOrderUrl(items, phone, quote ? quote.fee : null), '_blank', 'noopener,noreferrer')}
          className="px-6 py-3 rounded-full text-white font-semibold text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          style={{ backgroundColor: accent }}
        >
          إرسال الطلب عبر واتساب
        </button>
      </div>
    </div>
  );
};

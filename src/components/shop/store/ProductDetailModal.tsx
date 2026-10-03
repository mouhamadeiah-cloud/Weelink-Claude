// The full product card that floats over the store page when a product is clicked: gallery in
// the chosen layout, prices and quantity tiers, option pickers that only offer combinations in
// stock, quantity and add to cart, delivery price, specs and the description.
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus, Plus, ShoppingBag, Truck, Check } from 'lucide-react';
import { ShopProduct, ShopSettings } from '../shopTypes';
import { badgeText, descriptionHtml, discountPercent, findVariant, stockOptions, totalStock, unitPriceFor } from '../productModel';
import { addToCart, formatPrice } from '../../../utils/cartStore';
import { ProductGallery } from './ProductGallery';

interface ProductDetailModalProps {
  product: ShopProduct;
  settings: ShopSettings;
  accent: string;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product: p, settings, accent, onClose }) => {
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const stockOpts = stockOptions(p.options);
  // Options the customer chooses from; single-value descriptive options are shown as specs.
  const choosable = p.options.filter((o) => o.values.length > 1 || (o.affectsStock && o.values.length > 0));
  const specs = p.options.filter((o) => !choosable.includes(o) && o.values.length === 1);

  // A stock value is available when some in-stock combination has it and matches the other picks.
  const isAvailable = (optionId: string, label: string) => {
    const k = stockOpts.findIndex((o) => o.id === optionId);
    if (k < 0) return true;
    return p.variants.some((v) =>
      v.stock > 0 && v.values[k] === label && stockOpts.every((o, j) => j === k || !picked[o.id] || v.values[j] === picked[o.id])
    );
  };

  const variant = stockOpts.length && stockOpts.every((o) => picked[o.id])
    ? findVariant(p, stockOpts.map((o) => picked[o.id]))
    : undefined;
  const available = stockOpts.length ? (variant?.stock ?? 0) : totalStock(p);
  const allPicked = choosable.every((o) => picked[o.id]);
  const soldOut = totalStock(p) <= 0;
  const unit = unitPriceFor(p, qty, variant);
  const pct = discountPercent(p);
  const badge = badgeText(p);
  const delivery = p.deliveryPrice ?? settings.delivery.deliveryFee;

  useEffect(() => { setQty((q) => Math.max(1, Math.min(q, available || 1))); }, [available]);

  const html = useMemo(() => descriptionHtml(p.description), [p.description]);

  const add = () => {
    if (!allPicked || available <= 0 || qty > available) return;
    const chosen = choosable.map((o) => picked[o.id]).join(' / ');
    addToCart({ name: chosen ? `${p.name} (${chosen})` : p.name, price: unit, currency: p.currency, image: p.images[0] }, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[2000000] bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6" onMouseDown={onClose}>
      <div
        dir="rtl"
        className="relative w-full max-w-4xl max-h-full overflow-y-auto bg-white rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.35)] text-right font-['IBM_Plex_Sans_Arabic',sans-serif]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-white/90 shadow text-neutral-600 hover:text-black flex items-center justify-center cursor-pointer" aria-label="إغلاق">
          <X size={18} />
        </button>
        <div className="grid md:grid-cols-2 gap-5 p-4 sm:p-6">
          <ProductGallery
            images={p.images}
            layout={p.galleryLayout}
            badge={badge ? (
              <span dir="rtl" className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow" style={{ backgroundColor: soldOut ? '#6e6e73' : p.badge === 'discount' ? '#ff3b30' : '#2A1F1A' }}>{badge}</span>
            ) : undefined}
          />

          <div className="flex flex-col gap-4 min-w-0">
            <div>
              <h2 className="text-2xl font-bold text-[#2A1F1A] leading-snug font-['El_Messiri',sans-serif]">{p.name}</h2>
              {p.shortDescription && <p className="text-sm text-[#8A7B70] mt-1">{p.shortDescription}</p>}
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl font-black" style={{ color: accent }}>{formatPrice(unit, p.currency)}</span>
              {p.oldPrice > p.price && <span className="text-base text-[#8A7B70] line-through">{formatPrice(p.oldPrice + (variant?.priceDelta || 0), p.currency)}</span>}
              {pct > 0 && <span className="text-xs font-bold text-white bg-[#ff3b30] px-2 py-0.5 rounded-full">-{pct}%</span>}
            </div>

            {p.tiers.length > 0 && (
              <div className="rounded-2xl bg-[#FBF6EF] p-3 space-y-1">
                {p.tiers.map((t) => (
                  <div key={t.minQty} className={`text-xs flex justify-between ${qty >= t.minQty ? 'font-bold text-[#2A1F1A]' : 'text-[#5A4C42]'}`}>
                    <span>عند شراء {t.minQty} أو أكثر</span>
                    <span>{formatPrice(t.price + (variant?.priceDelta || 0), p.currency)} للقطعة</span>
                  </div>
                ))}
              </div>
            )}

            {choosable.map((o) => (
              <div key={o.id} className="space-y-1.5">
                <div className="text-xs font-bold text-[#5A4C42]">{o.name}{picked[o.id] ? `: ${picked[o.id]}` : ''}</div>
                <div className="flex flex-wrap gap-2">
                  {o.values.map((v) => {
                    const ok = isAvailable(o.id, v.label);
                    const on = picked[o.id] === v.label;
                    const toggle = () => setPicked((prev) => ({ ...prev, [o.id]: on ? '' : v.label }));
                    return o.kind === 'color' && v.color ? (
                      <button
                        key={v.label}
                        type="button"
                        title={ok ? v.label : `${v.label} (غير متوفر)`}
                        aria-label={v.label}
                        disabled={!ok}
                        onClick={toggle}
                        className={`relative w-9 h-9 rounded-full border-2 transition cursor-pointer disabled:cursor-not-allowed ${on ? 'scale-110' : ''} ${ok ? '' : 'opacity-30'}`}
                        style={{ backgroundColor: v.color, borderColor: on ? accent : 'rgba(0,0,0,0.12)', boxShadow: on ? `0 0 0 2px #fff inset` : undefined }}
                      >
                        {!ok && <span className="absolute inset-0 flex items-center justify-center"><span className="w-full h-0.5 bg-black/60 rotate-45" /></span>}
                      </button>
                    ) : (
                      <button
                        key={v.label}
                        type="button"
                        disabled={!ok}
                        onClick={toggle}
                        className={`min-w-[44px] h-9 px-3 rounded-xl border text-sm font-bold transition cursor-pointer disabled:cursor-not-allowed disabled:line-through disabled:opacity-35 ${on ? 'text-white' : 'bg-white text-[#2A1F1A] border-black/10 hover:border-black/30'}`}
                        style={on ? { backgroundColor: accent, borderColor: accent } : undefined}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-full border border-black/10">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center cursor-pointer" aria-label="إنقاص"><Minus size={15} /></button>
                <span className="w-8 text-center font-bold">{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(Math.max(available, 1), q + 1))} className="w-10 h-10 flex items-center justify-center cursor-pointer" aria-label="زيادة"><Plus size={15} /></button>
              </div>
              <button
                type="button"
                onClick={add}
                disabled={soldOut || !allPicked || available <= 0}
                className="flex-1 h-12 rounded-full text-white font-bold flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{ backgroundColor: accent }}
              >
                {added ? <><Check size={18} /> تمت الإضافة إلى السلة</> : <><ShoppingBag size={18} /> {soldOut ? 'نفد من المخزون' : !allPicked ? 'اختر المواصفات أولاً' : available <= 0 ? 'غير متوفر' : 'أضف إلى السلة'}</>}
              </button>
            </div>
            {allPicked && available > 0 && available <= 3 && <div className="text-xs font-bold text-[#ff9500]">بقي {available} فقط</div>}

            {settings.delivery.delivery && (
              <div className="flex items-center gap-2 text-xs text-[#5A4C42]">
                <Truck size={15} /> التوصيل: {delivery > 0 ? formatPrice(delivery, p.currency) : 'مجاني'}
              </div>
            )}

            {specs.length > 0 && (
              <div className="rounded-2xl border border-black/[0.06] divide-y divide-black/[0.05]">
                {specs.map((o) => (
                  <div key={o.id} className="flex justify-between gap-3 px-3 py-2 text-xs">
                    <span className="text-[#8A7B70]">{o.name}</span>
                    <span className="font-bold text-[#2A1F1A]">{o.values[0].label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {html && (
          <div className="px-4 sm:px-6 pb-6">
            <div className="border-t border-black/[0.06] pt-4">
              <div className="text-sm font-bold text-[#2A1F1A] mb-2">تفاصيل المنتج</div>
              <div className="product-rich-text text-sm text-[#5A4C42] leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

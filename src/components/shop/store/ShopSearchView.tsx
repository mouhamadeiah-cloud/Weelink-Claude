// The 'shopSearch' canvas element: a search bar over the store's published products. Typing lists
// the matching products under the bar; picking one opens its floating card, as on the products
// page. The element's text is the bar's placeholder and shopSearchStyle its look.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, ImageOff } from 'lucide-react';
import type { CanvasElement } from '../../../types';
import { useShopData } from './ShopDataContext';
import { ProductDetailModal } from './ProductDetailModal';
import { formatPrice } from '../../../utils/cartStore';

interface ShopSearchViewProps {
  elem: CanvasElement;
  isPreviewActive: boolean;
}

const normalize = (s: string) => s.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim();

export const ShopSearchView: React.FC<ShopSearchViewProps> = ({ elem, isPreviewActive }) => {
  const admin = useShopData();
  const accent = elem.styles.color || '#B4532A';
  const look = elem.shopSearchStyle || 'pill';
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const barRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const products = useMemo(() => (admin?.products || []).filter((p) => p.published), [admin]);
  const q = normalize(query);
  const matches = q
    ? products.filter((p) => [p.name, p.shortDescription, p.sku].some((f) => f && normalize(f).includes(q))).slice(0, 8)
    : [];
  const showList = isPreviewActive && focused && q.length > 0;

  // The result list floats over the page under the bar, so it follows the bar while open.
  useLayoutEffect(() => {
    if (!showList) return;
    const place = () => barRef.current && setRect(barRef.current.getBoundingClientRect());
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [showList]);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const open = products.find((p) => p.id === openId);
  const related = open ? open.relatedIds.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p) : [];
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const bar =
    look === 'minimal'
      ? { className: 'bg-transparent border-b-2 rounded-none', style: { borderColor: accent }, text: '#2A1F1A' }
      : look === 'glass'
        ? { className: 'bg-white/20 backdrop-blur-md border border-white/50 rounded-full', style: {}, text: '#FFFFFF' }
        : { className: 'bg-white border border-black/[0.06] rounded-full', style: {}, text: '#2A1F1A' };

  return (
    <div
      ref={barRef}
      dir="rtl"
      className={`w-full h-full flex items-center gap-3 font-['IBM_Plex_Sans_Arabic',sans-serif] ${look === 'minimal' ? 'px-1' : 'pr-5 pl-1.5'} ${bar.className}`}
      style={{ ...bar.style, pointerEvents: isPreviewActive ? 'auto' : 'none' }}
      onClick={stop}
    >
      <Search size={20} style={{ color: look === 'glass' ? '#FFFFFF' : accent }} className="shrink-0" />
      <input
        type="text"
        inputMode="search"
        aria-label="ابحث في المتجر"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 150)}
        placeholder={elem.content || 'ابحث عن منتج...'}
        className={`flex-1 min-w-0 h-full bg-transparent outline-none text-base ${look === 'glass' ? 'placeholder:text-white/80' : 'placeholder:text-[#8A7B70]'}`}
        style={{ color: bar.text }}
      />
      {look === 'pill' && (
        <span className="shrink-0 h-[calc(100%-12px)] px-6 rounded-full text-white text-sm font-bold flex items-center" style={{ backgroundColor: accent }}>
          بحث
        </span>
      )}

      {showList && rect && createPortal(
        <div
          dir="rtl"
          className="fixed z-[2000000] bg-white rounded-2xl border border-black/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.18)] overflow-hidden font-['IBM_Plex_Sans_Arabic',sans-serif]"
          style={{ top: rect.bottom + 8, left: rect.left, width: rect.width }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {matches.length === 0 ? (
            <div className="px-4 py-3 text-sm text-[#8A7B70]">لا توجد منتجات مطابقة</div>
          ) : (
            matches.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setOpenId(p.id); setFocused(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-right hover:bg-black/[0.04] cursor-pointer"
              >
                <span className="w-11 h-11 rounded-xl overflow-hidden bg-neutral-100 shrink-0 flex items-center justify-center text-neutral-300">
                  {p.images[0] ? <img src={p.images[0]} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <ImageOff size={18} />}
                </span>
                <span className="flex-1 min-w-0 text-sm font-bold text-[#2A1F1A] truncate">{p.name}</span>
                <span className="text-sm font-black shrink-0" style={{ color: accent }}>{formatPrice(p.price, p.currency)}</span>
              </button>
            ))
          )}
        </div>,
        document.body
      )}

      {open && admin && isPreviewActive && (
        <ProductDetailModal
          key={open.id}
          product={open}
          settings={admin.settings}
          accent={accent}
          related={related}
          onOpenRelated={setOpenId}
          onClose={() => setOpenId(null)}
          onAdded={(name) => {
            setToast(name);
            window.clearTimeout(toastTimer.current);
            toastTimer.current = window.setTimeout(() => setToast(null), 2000);
          }}
        />
      )}

      {toast && isPreviewActive && createPortal(
        <div dir="rtl" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000001] bg-[#2A1F1A] text-white text-sm font-semibold px-5 py-3 rounded-full shadow-lg pointer-events-none">
          ✓ أُضيف «{toast}» إلى السلة
        </div>,
        document.body
      )}
    </div>
  );
};

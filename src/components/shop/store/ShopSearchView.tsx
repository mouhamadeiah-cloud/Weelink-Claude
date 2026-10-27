// The 'shopSearch' canvas element: a search bar over the store's published products. Typing lists
// the first matches under the bar (picking one opens its floating card); pressing Enter or «بحث»
// shows every match in the store's product slide, opening the store page when this page has none.
// The element's text is the bar's placeholder and shopSearchStyle its look. «بحث متقدم» opens the
// filters window (catalog, price, people, kind of food, options...) over the same results; a bar
// made for the menu (shopSearchKind) looks through the restaurant's dishes instead.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, ImageOff, SlidersHorizontal } from 'lucide-react';
import type { CanvasElement } from '../../../types';
import { useShopData } from './ShopDataContext';
import { ProductDetailModal } from './ProductDetailModal';
import { formatPrice } from '../../../utils/cartStore';
import { matchesSearch, setShopSearch, setShopFilters, useShopSearch } from './shopSearchStore';
import { ItemAdvancedSearch } from './ItemAdvancedSearch';
import { useItemSearch } from './useItemSearch';
import { hasItemFilters } from './itemSearch';

interface ShopSearchViewProps {
  elem: CanvasElement;
  isPreviewActive: boolean;
  onOpenStore?: () => void; // opens the page holding the store's product slide
}

export const ShopSearchView: React.FC<ShopSearchViewProps> = ({ elem, isPreviewActive, onOpenStore }) => {
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

  const source = useItemSearch(elem);
  const isMenu = source.kind === 'menu';
  const { filters } = useShopSearch();
  const [advanced, setAdvanced] = useState(false);
  const products = useMemo(() => (admin?.products || []).filter((p) => p.published), [admin]);
  const q = query.trim();
  const allMatches = q ? source.rows.filter((r) => matchesSearch(r.texts, q)) : [];
  const matches = allMatches.slice(0, 6);
  const showList = isPreviewActive && focused && q.length > 0;

  // Shows every match in the store's main product slide, opening its page when it is elsewhere.
  const submit = () => {
    if (!q || !isPreviewActive) return;
    setShopSearch(q);
    setFocused(false);
    if (!document.querySelector('[data-shop-products="search"], [data-menu-list="search"]')) onOpenStore?.();
  };

  // The filters window's choices: shown in the store's main list like a typed search.
  const applyFilters = (f: typeof filters) => {
    setShopFilters(f);
    setAdvanced(false);
    if (!document.querySelector('[data-shop-products="search"], [data-menu-list="search"]')) onOpenStore?.();
  };

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

  const open = isMenu ? undefined : products.find((p) => p.id === openId);
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
        aria-label={isMenu ? 'ابحث في المنيو' : 'ابحث في المتجر'}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 150)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
        placeholder={elem.content || (isMenu ? 'ابحث عن طبق...' : 'ابحث عن منتج...')}
        className={`flex-1 min-w-0 h-full bg-transparent outline-none text-base ${look === 'glass' ? 'placeholder:text-white/80' : 'placeholder:text-[#8A7B70]'}`}
        style={{ color: bar.text }}
      />
      {isPreviewActive && (
        <button
          type="button"
          onClick={() => setAdvanced(true)}
          aria-label="بحث متقدم"
          className="shrink-0 h-9 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer border"
          style={{ borderColor: look === 'glass' ? 'rgba(255,255,255,0.6)' : `${accent}55`, color: look === 'glass' ? '#FFFFFF' : accent, backgroundColor: hasItemFilters(filters) ? `${accent}22` : 'transparent' }}
        >
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">متقدم</span>
        </button>
      )}
      {look === 'pill' && (
        <button type="button" onClick={submit} className="shrink-0 h-[calc(100%-12px)] px-6 rounded-full text-white text-sm font-bold flex items-center cursor-pointer" style={{ backgroundColor: accent }}>
          بحث
        </button>
      )}

      {showList && rect && createPortal(
        <div
          dir="rtl"
          className="fixed z-[2000000] bg-white rounded-2xl border border-black/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.18)] overflow-hidden font-['IBM_Plex_Sans_Arabic',sans-serif]"
          style={{ top: rect.bottom + 8, left: rect.left, width: rect.width }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {matches.length === 0 ? (
            <div className="px-4 py-3 text-sm text-[#8A7B70]">{isMenu ? 'لا توجد أطباق مطابقة' : 'لا توجد منتجات مطابقة'}</div>
          ) : (
            matches.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { if (isMenu) { setShopSearch(p.name); setFocused(false); if (!document.querySelector('[data-menu-list="search"]')) onOpenStore?.(); } else { setOpenId(p.id); setFocused(false); } }}
                className="w-full flex items-center gap-3 px-3 py-2 text-right hover:bg-black/[0.04] cursor-pointer"
              >
                <span className="w-11 h-11 rounded-xl overflow-hidden bg-neutral-100 shrink-0 flex items-center justify-center text-neutral-300">
                  {p.image ? <img src={p.image} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <ImageOff size={18} />}
                </span>
                <span className="flex-1 min-w-0 text-sm font-bold text-[#2A1F1A] truncate">{p.name}</span>
                <span className="text-sm font-black shrink-0" style={{ color: accent }}>{formatPrice(p.price, p.currency || source.currency)}</span>
              </button>
            ))
          )}
          {allMatches.length > 0 && (
            <button
              type="button"
              onClick={submit}
              className="w-full px-4 py-2.5 text-sm font-bold text-center border-t border-black/[0.06] hover:bg-black/[0.04] cursor-pointer"
              style={{ color: accent }}
            >
              {isMenu ? 'عرض كل النتائج في المنيو' : 'عرض كل النتائج في المتجر'} ({allMatches.length})
            </button>
          )}
        </div>,
        document.body
      )}

      {advanced && isPreviewActive && (
        <ItemAdvancedSearch
          items={source.items}
          groups={source.groups}
          groupTitle={source.groupTitle}
          noun={source.noun}
          currency={source.currency}
          initial={filters}
          accent={accent}
          font="'IBM Plex Sans Arabic', sans-serif"
          matches={(it) => matchesSearch(it.texts, q)}
          onApply={applyFilters}
          onClose={() => setAdvanced(false)}
        />
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

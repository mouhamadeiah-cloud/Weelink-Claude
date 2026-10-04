// The 'carSearch' canvas element: a search bar over the showroom's published cars (brand, model,
// year, body type, colour). Typing lists the first matches under the bar (picking one opens its
// page); pressing Enter or «بحث» shows every match in the showroom's car list, opening the
// showroom page when this page has none. The element's text is the placeholder and
// shopSearchStyle its look, as with the store's search bar. «بحث متقدم» beside it opens the
// advanced search (brand, model, year, price, km, fuel, gearbox, colour...).
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, ImageOff, SlidersHorizontal } from 'lucide-react';
import type { CanvasElement } from '../../../types';
import { useCarData } from './CarDataContext';
import { CarDetailModal } from './CarDetailModal';
import { carPriceLabel, carSubtitle, carTitle } from '../carModel';
import { matchesSearch, setShopSearch, bumpShopReveal } from '../../shop/store/shopSearchStore';
import { CarAdvancedSearch } from './CarAdvancedSearch';
import { carFilterChips, CarFilters, setCarFilters, useCarFilters } from './carFilterStore';

interface CarSearchViewProps {
  elem: CanvasElement;
  isPreviewActive: boolean;
  onOpenShowroom?: () => void;
}

export const CarSearchView: React.FC<CarSearchViewProps> = ({ elem, isPreviewActive, onOpenShowroom }) => {
  const admin = useCarData();
  const accent = elem.styles.color || '#C8102E';
  const font = `${elem.styles.fontFamily ? `${elem.styles.fontFamily}, ` : ''}'IBM Plex Sans Arabic', sans-serif`;
  const look = elem.shopSearchStyle || 'pill';
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const filters = useCarFilters();
  const filterCount = carFilterChips(filters).length;
  const barRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const cars = useMemo(() => (admin?.cars || []).filter((c) => c.published && (c.status !== 'sold' || admin?.settings.showSold)), [admin]);
  const q = query.trim();
  const allMatches = q ? cars.filter((c) => matchesSearch([c.brand, c.model, c.trim, String(c.year), c.bodyType, c.color, c.stockNumber], q)) : [];
  const matches = allMatches.slice(0, 6);
  const showList = isPreviewActive && focused && q.length > 0;

  const submit = () => {
    if (!q || !isPreviewActive) return;
    setShopSearch(q);
    setFocused(false);
    if (!document.querySelector('[data-car-listings="search"]')) onOpenShowroom?.();
  };

  const applyAdvanced = (f: CarFilters) => {
    setCarFilters(f);
    setAdvanced(false);
    setShopSearch(q);
    bumpShopReveal();
    if (!document.querySelector('[data-car-listings="search"]')) onOpenShowroom?.();
  };

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

  const open = cars.find((c) => c.id === openId);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const bar =
    look === 'minimal'
      ? { className: 'bg-transparent border-b-2 rounded-none', style: { borderColor: accent }, text: '#1d1d1f' }
      : look === 'glass'
        ? { className: 'bg-white/20 backdrop-blur-md border border-white/50 rounded-full', style: {}, text: '#FFFFFF' }
        : { className: 'bg-white border border-black/[0.06] rounded-full', style: {}, text: '#1d1d1f' };

  return (
    <div
      ref={barRef}
      dir="rtl"
      className={`w-full h-full flex items-center gap-3 ${look === 'minimal' ? 'px-1' : 'pr-5 pl-1.5'} ${bar.className}`}
      style={{ ...bar.style, fontFamily: font, pointerEvents: isPreviewActive ? 'auto' : 'none' }}
      onClick={stop}
    >
      <Search size={20} style={{ color: look === 'glass' ? '#FFFFFF' : accent }} className="shrink-0" />
      <input
        type="text"
        inputMode="search"
        aria-label="ابحث عن سيارة"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 150)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
        placeholder={elem.content || 'ابحث بالماركة أو الموديل أو السنة...'}
        className={`flex-1 min-w-0 h-full bg-transparent outline-none text-base ${look === 'glass' ? 'placeholder:text-white/80' : 'placeholder:text-neutral-400'}`}
        style={{ color: bar.text }}
      />
      <button
        type="button"
        onClick={() => isPreviewActive && setAdvanced(true)}
        aria-label="بحث متقدم"
        title="بحث متقدم"
        className={`relative shrink-0 h-[calc(100%-12px)] aspect-square max-h-11 rounded-full flex items-center justify-center cursor-pointer ${look === 'glass' ? 'bg-white/20 text-white' : 'bg-black/[0.05]'}`}
        style={look === 'glass' ? undefined : { color: accent }}
      >
        <SlidersHorizontal size={18} />
        {filterCount > 0 && <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: accent }}>{filterCount}</span>}
      </button>
      {look === 'pill' && (
        <button type="button" onClick={submit} className="shrink-0 h-[calc(100%-12px)] px-6 rounded-full text-white text-sm font-bold flex items-center cursor-pointer" style={{ backgroundColor: accent }}>
          بحث
        </button>
      )}

      {showList && rect && createPortal(
        <div
          dir="rtl"
          className="fixed z-[2000000] bg-white rounded-2xl border border-black/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.18)] overflow-hidden"
          style={{ top: rect.bottom + 8, left: rect.left, width: rect.width, fontFamily: font }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {matches.length === 0 ? (
            <div className="px-4 py-3 text-sm text-neutral-500">لا توجد سيارات مطابقة</div>
          ) : (
            matches.map((c) => (
              <button key={c.id} type="button" onClick={() => { setOpenId(c.id); setFocused(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-right hover:bg-black/[0.04] cursor-pointer">
                <span className="w-14 h-11 rounded-xl overflow-hidden bg-neutral-100 shrink-0 flex items-center justify-center text-neutral-300">
                  {c.images[0] ? <img src={c.images[0]} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <ImageOff size={18} />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-[#1d1d1f] truncate">{carTitle(c)}</span>
                  <span className="block text-xs text-neutral-500">{carSubtitle(c)}</span>
                </span>
                <span className="text-sm font-black shrink-0" style={{ color: accent }}>{carPriceLabel(c)}</span>
              </button>
            ))
          )}
          {allMatches.length > 0 && (
            <button type="button" onClick={submit} className="w-full px-4 py-2.5 text-sm font-bold text-center border-t border-black/[0.06] hover:bg-black/[0.04] cursor-pointer" style={{ color: accent }}>
              عرض كل النتائج في المعرض ({allMatches.length})
            </button>
          )}
        </div>,
        document.body
      )}

      {advanced && isPreviewActive && (
        <CarAdvancedSearch cars={cars} initial={filters} accent={accent} font={font} onApply={applyAdvanced} onClose={() => setAdvanced(false)} />
      )}

      {open && admin && isPreviewActive && (
        <CarDetailModal key={open.id} car={open} settings={admin.settings} accent={accent} font={font} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
};

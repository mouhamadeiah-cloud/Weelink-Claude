// The 'carListings' canvas element: the showroom's cars, filled live from the cars published in the
// admin window (ترس الإدارة ← إضافة سيارة). Clicking a car in preview / on the live site opens its
// full page floating over the showroom. carLayout picks the cards (grid, wide rows, large photos or
// a running strip), carLimit how many fit on one page, carFilters adds a brand / body / sort bar,
// and the card colours and corners are the element's own. The showroom's main list also shows the
// results of the search bar and of the advanced search. On the live page the slide grows to fit its cards (onGrow).
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CarFront, ChevronLeft, ChevronRight, X, SlidersHorizontal } from 'lucide-react';
import type { CanvasElement } from '../../../types';
import { useCarData } from './CarDataContext';
import { CarCard, CarWide, CarLarge, CarChip, CarLook } from './CarCard';
import { CarDetailModal } from './CarDetailModal';
import { carTitle } from '../carModel';
import { useShopSearch, clearShopSearch, matchesSearch, takeReveal, bumpShopReveal } from '../../shop/store/shopSearchStore';
import { CarAdvancedSearch } from './CarAdvancedSearch';
import { carFilterChips, carMatchesFilters, clearCarFilters, CarFilters, setCarFilters, useCarFilters, withoutChip } from './carFilterStore';

export const MAX_CARS_PER_PAGE = 30;
const CARD_WIDTH: Record<string, number> = { grid: 290, large: 400 };
const CHIP_MIN = 240;
const CHIP_GAP = 16;

type Sort = 'new' | 'price-asc' | 'price-desc' | 'year';
const SORTS: { id: Sort; label: string }[] = [
  { id: 'new', label: 'الأحدث إضافة' },
  { id: 'price-asc', label: 'السعر: من الأقل' },
  { id: 'price-desc', label: 'السعر: من الأعلى' },
  { id: 'year', label: 'سنة الصنع: الأحدث' },
];

interface CarListingsViewProps {
  elem: CanvasElement;
  isPreviewActive: boolean;
  onGrow?: (extra: number) => void;
  boxHeight?: number;
  showsSearch?: boolean;
}

export const carLookOf = (elem: CanvasElement): CarLook => ({
  accent: elem.styles.color || '#C8102E',
  cardBg: elem.carCardBg || '#FFFFFF',
  text: elem.carCardText || '#1d1d1f',
  radius: elem.carCardRadius ?? 22,
  font: `${elem.styles.fontFamily ? `${elem.styles.fontFamily}, ` : ''}'IBM Plex Sans Arabic', sans-serif`,
});

export const CarListingsView: React.FC<CarListingsViewProps> = ({ elem, isPreviewActive, onGrow, boxHeight, showsSearch }) => {
  const admin = useCarData();
  const look = carLookOf(elem);
  const layout = elem.carLayout || 'grid';
  const marquee = layout === 'marquee';
  const featuredOnly = elem.carSource === 'featured';
  const [openId, setOpenId] = useState<string | null>(null);
  const [brand, setBrand] = useState('');
  const [body, setBody] = useState('');
  const [sort, setSort] = useState<Sort>('new');

  const cars = useMemo(
    () =>
      (admin?.cars || []).filter(
        (c) => c.published && (c.status !== 'sold' || admin?.settings.showSold) && (!featuredOnly || c.featured)
      ),
    [admin, featuredOnly]
  );
  const brands = useMemo(() => [...new Set(cars.map((c) => c.brand).filter(Boolean))], [cars]);
  const bodies = useMemo(() => [...new Set(cars.map((c) => c.bodyType).filter(Boolean))], [cars]);

  const { query, reveal } = useShopSearch();
  const advFilters = useCarFilters();
  const chips = showsSearch && !marquee ? carFilterChips(advFilters) : [];
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const textSearch = !!showsSearch && !marquee && !!query;
  const searching = textSearch || chips.length > 0;
  const filtered = useMemo(() => {
    let list = cars.filter((c) => (!brand || c.brand === brand) && (!body || c.bodyType === body));
    if (textSearch) list = list.filter((c) => matchesSearch([c.brand, c.model, c.trim, String(c.year), c.bodyType, c.color, c.stockNumber], query));
    if (chips.length) list = list.filter((c) => carMatchesFilters(c, advFilters));
    const sorted = [...list];
    if (sort === 'price-asc') sorted.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
    else if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    else if (sort === 'year') sorted.sort((a, b) => b.year - a.year);
    else sorted.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    // Sold cars, when shown, come last.
    return sorted.sort((a, b) => Number(a.status === 'sold') - Number(b.status === 'sold'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cars, brand, body, sort, textSearch, query, advFilters, chips.length]);

  const pageSize = Math.min(MAX_CARS_PER_PAGE, elem.carLimit && elem.carLimit > 0 ? elem.carLimit : 9);
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const list = marquee ? cars.slice(0, MAX_CARS_PER_PAGE) : filtered.slice(current * pageSize, current * pageSize + pageSize);
  useEffect(() => setPage(0), [brand, body, sort, query, advFilters]);

  const showFilters = !!elem.carFilters && !marquee && cars.length > 0;
  const open = (admin?.cars || []).find((c) => c.id === openId && c.published);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  // Live page: the cards are laid out at their natural height and the slide grows to fit them.
  const grows = isPreviewActive && !marquee;
  const box = boxHeight ?? elem.height;
  const contentRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!onGrow) return;
    const node = contentRef.current;
    if (!grows || !node) {
      onGrow(0);
      return;
    }
    const measure = () => onGrow(Math.max(0, Math.ceil(node.offsetHeight - box)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [grows, onGrow, box]);
  useEffect(() => () => onGrow?.(0), [onGrow]);

  // A new search: the showroom's list scrolls into view, with its heading.
  useEffect(() => {
    if (!isPreviewActive || !searching || !reveal) return;
    const t = window.setTimeout(() => {
      const node = contentRef.current;
      if (node && takeReveal(reveal)) (node.closest('[id^="slide-container-"]') || node).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(t);
  }, [reveal, searching, isPreviewActive]);

  // Running strip: few cars widen so one round covers the strip and the loop never shows a gap.
  const stripRef = useRef<HTMLDivElement>(null);
  const [stripWidth, setStripWidth] = useState(0);
  useLayoutEffect(() => {
    const node = stripRef.current;
    if (!marquee || !node) return;
    const measure = () => setStripWidth(node.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [marquee, list.length]);
  const chipWidth = list.length ? Math.max(CHIP_MIN, stripWidth / list.length - CHIP_GAP) : CHIP_MIN;

  const goTo = (n: number) => {
    setPage(n);
    window.requestAnimationFrame(() => {
      const slide = contentRef.current?.closest('[id^="slide-container-"]');
      if (slide && slide.getBoundingClientRect().top < 0) slide.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const selectClass = 'h-10 px-3 rounded-full border border-black/10 bg-white text-sm font-semibold text-[#1d1d1f] outline-none cursor-pointer';

  return (
    <div
      dir="rtl"
      className={`w-full h-full ${grows ? '' : 'overflow-hidden'}`}
      style={{ pointerEvents: isPreviewActive ? 'auto' : 'none', fontFamily: look.font }}
      onClick={stop}
    >
      <div
        ref={contentRef}
        data-car-listings={showsSearch ? 'search' : marquee ? 'strip' : 'list'}
        className="w-full flex flex-col gap-4"
        style={grows ? { minHeight: box } : { height: '100%' }}
      >
        {advancedOpen && (
          <CarAdvancedSearch cars={cars} initial={advFilters} accent={look.accent} font={look.font}
            onApply={(f: CarFilters) => { setCarFilters(f); setAdvancedOpen(false); bumpShopReveal(); }} onClose={() => setAdvancedOpen(false)} />
        )}
        {showFilters && (
          <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
            <select className={selectClass} value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="الماركة">
              <option value="">كل الماركات</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            {bodies.length > 1 && (
              <select className={selectClass} value={body} onChange={(e) => setBody(e.target.value)} aria-label="نوع الهيكل">
                <option value="">كل الأنواع</option>
                {bodies.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
            <select className={selectClass} value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="الترتيب">
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            {showsSearch && (
              <button type="button" onClick={() => setAdvancedOpen(true)} className={`${selectClass} inline-flex items-center gap-1.5`} style={chips.length ? { borderColor: look.accent, color: look.accent } : undefined}>
                <SlidersHorizontal size={15} /> بحث متقدم{chips.length ? ` (${chips.length})` : ''}
              </button>
            )}
            <span className="text-sm font-bold opacity-60 px-2">{filtered.length} سيارة</span>
          </div>
        )}

        {searching && (
          <div className="flex flex-wrap items-center justify-center gap-2 shrink-0 text-sm">
            <span className="font-bold">{textSearch ? `نتائج البحث عن «${query}»` : 'نتائج البحث'}: {filtered.length} سيارة</span>
            {chips.map((c) => (
              <button key={c.key} type="button" onClick={() => setCarFilters(withoutChip(advFilters, c.key))} aria-label={`إزالة ${c.label}`}
                className="h-8 px-3 rounded-full text-xs font-bold inline-flex items-center gap-1 cursor-pointer text-white" style={{ backgroundColor: look.accent }}>
                {c.label} <X size={12} />
              </button>
            ))}
            <button type="button" onClick={() => { clearShopSearch(); clearCarFilters(); }} className="h-8 px-3 rounded-full border border-black/10 bg-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer text-[#1d1d1f]">
              <X size={13} /> مسح البحث
            </button>
          </div>
        )}

        {list.length === 0 ? (
          <div
            className={`flex-1 flex items-center justify-center gap-2 text-center rounded-3xl border-2 border-dashed border-current/20 px-6 ${elem.height < 200 ? 'text-sm' : 'flex-col py-10'}`}
            style={{ color: marquee ? '#fff' : '#5a5a5f' }}
          >
            <CarFront size={elem.height < 200 ? 20 : 44} className="opacity-40 shrink-0" />
            <span className="font-bold">
              {searching ? 'لا توجد سيارات مطابقة لبحثك' : featuredOnly ? 'لا توجد سيارات مميزة بعد' : 'لا توجد سيارات معروضة بعد'}
            </span>
            {elem.height >= 200 && !searching && (
              <span className="text-sm opacity-70 max-w-md">
                {featuredOnly ? 'فعّل «سيارة مميزة» عند إدخال السيارة لتظهر هنا.' : 'افتح ترس الإدارة في أسفل الصفحة، ثم «إضافة سيارة»، لتظهر السيارة هنا.'}
              </span>
            )}
          </div>
        ) : marquee ? (
          <div ref={stripRef} className="shop-marquee flex-1 min-h-0 overflow-hidden" dir="ltr">
            <div className="shop-marquee-track h-full flex w-max" style={{ '--shop-speed': `${elem.carSpeed || 35}s` } as React.CSSProperties}>
              {[0, 1].map((copy) => (
                <div key={copy} className="h-full flex" aria-hidden={copy === 1}>
                  {list.map((c) => (
                    <div key={c.id} className="h-full shrink-0" style={{ width: chipWidth + CHIP_GAP, paddingInline: CHIP_GAP / 2 }}>
                      <CarChip car={c} look={look} onOpen={() => setOpenId(c.id)} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={grows ? 'pb-2 pt-2' : 'flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-2 pt-2'}>
            <div className={layout === 'wide' ? 'flex flex-col gap-5 max-w-[980px] mx-auto' : 'flex flex-wrap justify-center items-stretch gap-5'}>
              {list.map((c) => {
                const show = () => setOpenId(c.id);
                return (
                  <div key={c.id} data-car-id={c.id} title={carTitle(c)} className="flex" style={layout === 'wide' ? undefined : { width: CARD_WIDTH[layout] || CARD_WIDTH.grid, maxWidth: '100%' }}>
                    {layout === 'wide' ? <CarWide car={c} look={look} onOpen={show} /> : layout === 'large' ? <CarLarge car={c} look={look} onOpen={show} /> : <CarCard car={c} look={look} onOpen={show} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!marquee && pageCount > 1 && (
          <div className="flex items-center justify-center gap-3 shrink-0 pb-1">
            <button type="button" aria-label="الصفحة السابقة" disabled={current === 0} onClick={() => goTo(current - 1)} className="w-10 h-10 rounded-full border border-black/10 bg-white flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-default" style={{ color: look.accent }}>
              <ChevronRight size={20} />
            </button>
            <span className="text-sm font-bold">صفحة {current + 1} من {pageCount}</span>
            <button type="button" aria-label="الصفحة التالية" disabled={current >= pageCount - 1} onClick={() => goTo(current + 1)} className="w-10 h-10 rounded-full border border-black/10 bg-white flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-default" style={{ color: look.accent }}>
              <ChevronLeft size={20} />
            </button>
          </div>
        )}
      </div>

      {open && admin && isPreviewActive && (
        <CarDetailModal key={open.id} car={open} settings={admin.settings} accent={look.accent} font={look.font} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
};

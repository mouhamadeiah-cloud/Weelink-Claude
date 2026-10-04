// The 'shopProducts' canvas element: the store page's product grid, filled from the products the
// owner exported to the store (لوحة الإدارة ← إضافة منتج ← تصدير إلى المتجر). Clicking a product
// in preview / on the live site opens its full card floating over the page. The element's
// shopLayout picks how the products are laid out (grid, zigzag, wide, small or large cards, a
// running strip or animated cards) and shopLimit how many fit on one page (30 at most); the
// visitor can switch to 20 or 30 per page and move between pages with the arrows under the cards.
// On the live page the slide grows to fit its cards (onGrow). A search from the store's search bar
// filters the store's main product slide to every matching product.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PackageOpen, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { CanvasElement } from '../../../types';
import { useShopData, useShopUpdate } from './ShopDataContext';
import { recordVisit } from '../orderModel';
import { ProductCard, ProductSlide, ProductZigzag, ProductWide, ProductMini, ProductChip, cardWidth } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { useShopSearch, clearShopSearch, matchesSearch, takeReveal } from './shopSearchStore';

// Card width of each layout for a product at the default size (50%); a product's card size
// (25 / 50 / 100%) scales it. Cards wrap in rows centred in the slide, and the cards of a row
// share one height whatever their text.
const BASE_WIDTH: Record<string, number> = { grid: 130, spotlight: 135, large: 200, small: 85, wide: 270 };

export const MAX_PAGE_SIZE = 30;
const PAGE_SIZES = [20, 30];
const CHIP_MIN = 200;
const CHIP_GAP = 16;

interface ShopProductsViewProps {
  elem: CanvasElement;
  isPreviewActive: boolean;
  onGrow?: (extra: number) => void; // live page: how much taller than the element the cards are
  boxHeight?: number; // the element's own height, before it grew
  showsSearch?: boolean; // the store's main product slide, which lists the results of a store search
}

export const ShopProductsView: React.FC<ShopProductsViewProps> = ({ elem, isPreviewActive, onGrow, boxHeight, showsSearch }) => {
  const admin = useShopData();
  const [catalog, setCatalog] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const accent = elem.styles.color || '#B4532A';
  const gridRef = useRef<HTMLDivElement>(null);
  // Adding to the cart keeps the customer in the store: a short confirmation instead.
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const showAdded = (name: string) => {
    setToast(name);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2000);
  };
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  // Counts one store visit per browser session (shown in الحسابات ← الإحصائيات).
  const updateShop = useShopUpdate();
  useEffect(() => {
    if (isPreviewActive && updateShop) recordVisit(updateShop);
  }, [isPreviewActive, updateShop]);

  // The «عروض مميزة» slides list only the products marked as featured in the product editor.
  const featuredOnly = elem.shopSource === 'featured';
  const products = useMemo(
    () => (admin?.products || []).filter((p) => p.published && (!featuredOnly || p.featured)),
    [admin, featuredOnly]
  );
  // Main catalogs that hold at least one shown product (directly or through a sub catalog).
  const tabs = useMemo(() => {
    const cats = admin?.catalogs || [];
    return cats
      .filter((c) => !c.parentId)
      .map((c) => ({ ...c, ids: [c.id, ...cats.filter((s) => s.parentId === c.id).map((s) => s.id)] }))
      .filter((c) => products.some((p) => p.catalogIds.some((id) => c.ids.includes(id))));
  }, [admin, products]);

  const layout = elem.shopLayout || 'grid';
  const marquee = layout === 'marquee';
  const cardAnim = elem.shopCardAnimation || (layout === 'spotlight' ? 'float' : 'none');
  const { query, reveal } = useShopSearch();
  const searching = !!showsSearch && !marquee && !!query;
  const active = tabs.find((t) => t.id === catalog);
  const inCatalog = active ? products.filter((p) => p.catalogIds.some((id) => active.ids.includes(id))) : products;
  const filtered = searching ? inCatalog.filter((p) => matchesSearch([p.name, p.shortDescription, p.sku], query)) : inCatalog;

  // Pages: the slide's own size (shopLimit, 20 by default) or the visitor's choice of 20 / 30.
  const baseSize = Math.min(MAX_PAGE_SIZE, elem.shopLimit && elem.shopLimit > 0 ? elem.shopLimit : 20);
  const [sizeChoice, setSizeChoice] = useState<number | null>(null);
  const pageSize = sizeChoice ?? baseSize;
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const list = marquee ? products.slice(0, MAX_PAGE_SIZE) : filtered.slice(current * pageSize, current * pageSize + pageSize);
  const showSizes = !marquee && baseSize >= 20 && filtered.length > 20;
  useEffect(() => setPage(0), [catalog, query, pageSize]);

  // Catalog tabs only where there is room for them.
  const showTabs = tabs.length > 1 && !marquee && elem.height >= 300;
  const open = (admin?.products || []).find((p) => p.id === openId && p.published);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const published = (admin?.products || []).filter((p) => p.published);
  const related = open ? open.relatedIds.map((id) => published.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p) : [];

  // A related product: scroll the store to its card behind the overlay and open its card.
  const openRelated = (id: string) => {
    setOpenId(id);
    window.requestAnimationFrame(() => {
      gridRef.current?.querySelector(`[data-product-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

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

  // A new search: the store's product slide scrolls into view, with its heading.
  useEffect(() => {
    if (!isPreviewActive || !searching || !reveal) return;
    const t = window.setTimeout(() => {
      const node = contentRef.current;
      if (node && takeReveal(reveal)) {
        (node.closest('[id^="slide-container-"]') || node).scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
    return () => window.clearTimeout(t);
  }, [reveal, searching, isPreviewActive]);

  // Running strip: when the products are too few to fill the strip, each chip widens so one round
  // covers the strip's width and the loop never shows a gap.
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

  // Another page of cards: when the slide's top has scrolled away, bring it back into view.
  const goTo = (n: number) => {
    setPage(n);
    window.requestAnimationFrame(() => {
      const slide = contentRef.current?.closest('[id^="slide-container-"]');
      if (slide && slide.getBoundingClientRect().top < 0) slide.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const pill = (activeNow: boolean) =>
    activeNow ? { backgroundColor: accent, borderColor: accent, color: '#fff' } : { backgroundColor: '#fff', borderColor: 'rgba(0,0,0,0.08)', color: '#5A4C42' };

  return (
    <div
      dir="rtl"
      className={`w-full h-full font-['IBM_Plex_Sans_Arabic',sans-serif] ${grows ? '' : 'overflow-hidden'}`}
      style={{ pointerEvents: isPreviewActive ? 'auto' : 'none' }}
      onClick={stop}
    >
      <div
        ref={contentRef}
        data-shop-products={showsSearch ? 'search' : marquee ? 'strip' : 'list'}
        className="w-full flex flex-col gap-4"
        style={grows ? { minHeight: box } : { height: '100%' }}
      >
      {showTabs && (
        <div className="flex flex-wrap justify-center gap-2 shrink-0">
          {[{ id: 'all', name: 'الكل' }, ...tabs].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setCatalog(t.id)}
              className="h-9 px-4 rounded-full text-sm font-bold border transition cursor-pointer"
              style={pill(catalog === t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {(searching || showSizes) && (
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 text-sm text-[#5A4C42]">
          {searching ? (
            <div className="flex items-center gap-2">
              <span className="font-bold">
                نتائج البحث عن «{query}»: {filtered.length} منتج
              </span>
              <button
                type="button"
                onClick={clearShopSearch}
                className="h-8 px-3 rounded-full border border-black/10 bg-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer hover:bg-black/[0.03]"
              >
                <X size={13} /> مسح البحث
              </button>
            </div>
          ) : <span />}
          {showSizes && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#8A7B70]">عرض</span>
              {PAGE_SIZES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSizeChoice(n)}
                  className="h-8 min-w-[40px] px-2 rounded-full text-xs font-bold border cursor-pointer"
                  style={pill(pageSize === n)}
                >
                  {n}
                </button>
              ))}
              <span className="text-xs text-[#8A7B70]">منتجًا</span>
            </div>
          )}
        </div>
      )}

      {list.length === 0 ? (
        searching && products.length > 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center rounded-3xl border-2 border-dashed border-black/10 bg-white/60 px-6 py-10">
            <span className="text-base font-bold text-[#5A4C42]">لا توجد منتجات مطابقة لبحثك</span>
            <span className="text-sm text-[#8A7B70]">جرّب كلمة أخرى أو امسح البحث لعرض كل المنتجات.</span>
          </div>
        ) : featuredOnly ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-center rounded-2xl border-2 border-dashed border-current/20 text-sm font-bold opacity-70 px-4" style={{ color: marquee ? '#fff' : '#5A4C42' }}>
            <PackageOpen size={20} className="shrink-0" />
            لا توجد عروض مميزة بعد: فعّل «عروض مميزة» عند إدخال المنتج.
          </div>
        ) : elem.height < 200 ? (
          <div className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-current/20 text-sm font-bold opacity-70" style={{ color: marquee ? '#fff' : '#5A4C42' }}>
            <PackageOpen size={20} />
            لا توجد منتجات معروضة بعد
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center rounded-3xl border-2 border-dashed border-black/10 bg-white/60 px-6">
            <PackageOpen size={44} className="text-black/15" />
            <span className="text-base font-bold text-[#5A4C42]">لا توجد منتجات معروضة بعد</span>
            <span className="text-sm text-[#8A7B70] max-w-md">
              افتح ترس الإدارة في أسفل الصفحة، ثم «إضافة منتج»، واضغط «تصدير إلى المتجر» ليظهر المنتج هنا.
            </span>
          </div>
        )
      ) : marquee ? (
        // Running strip: one round of chips at least as wide as the strip, twice in a row, moved by
        // half the track so the loop is seamless.
        <div ref={stripRef} className="shop-marquee flex-1 min-h-0 overflow-hidden" dir="ltr">
          <div
            className="shop-marquee-track h-full flex w-max"
            style={{ '--shop-speed': `${elem.shopSpeed || 30}s` } as React.CSSProperties}
          >
            {[0, 1].map((copy) => (
              <div key={copy} className="h-full flex" aria-hidden={copy === 1}>
                {list.map((p) => (
                  <div key={p.id} className="h-full shrink-0" style={{ width: chipWidth + CHIP_GAP, paddingInline: CHIP_GAP / 2 }}>
                    <ProductChip product={p} accent={accent} onOpen={() => setOpenId(p.id)} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          ref={gridRef}
          className={grows ? 'pb-2 pt-3' : 'flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-2 pt-3'}
        >
          <div className={layout === 'zigzag' ? 'flex flex-col gap-8 max-w-[560px] mx-auto' : 'flex flex-wrap justify-center items-stretch gap-4'}>
            {list.map((p, i) => {
              const show = () => setOpenId(p.id);
              const full = layout === 'grid' && p.display === 'slide';
              const width = cardWidth(p, BASE_WIDTH[layout] || BASE_WIDTH.grid);
              const card =
                layout === 'zigzag' ? <ProductZigzag product={p} accent={accent} onOpen={show} flip={i % 2 === 1} />
                : layout === 'wide' ? <ProductWide product={p} accent={accent} onOpen={show} />
                : layout === 'small' ? <ProductMini product={p} accent={accent} onOpen={show} />
                : full ? <ProductSlide product={p} accent={accent} onOpen={show} />
                : <ProductCard product={p} accent={accent} onOpen={show} width={width} />;
              return (
                <div
                  key={p.id}
                  data-product-id={p.id}
                  className={`flex ${cardAnim !== 'none' ? `shop-anim-${cardAnim}` : ''}`}
                  style={{
                    ...(layout === 'zigzag' ? {} : full ? { flexBasis: '100%' } : { width, maxWidth: '100%' }),
                    ...(cardAnim !== 'none' ? { animationDelay: `${(i % 4) * 0.35}s` } : {}),
                  }}
                >
                  {card}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!marquee && pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 shrink-0 pb-1">
          <button
            type="button"
            aria-label="الصفحة السابقة"
            disabled={current === 0}
            onClick={() => goTo(current - 1)}
            className="w-10 h-10 rounded-full border border-black/10 bg-white flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-default hover:bg-black/[0.03]"
            style={{ color: accent }}
          >
            <ChevronRight size={20} />
          </button>
          <span className="text-sm font-bold text-[#5A4C42]">صفحة {current + 1} من {pageCount}</span>
          <button
            type="button"
            aria-label="الصفحة التالية"
            disabled={current >= pageCount - 1}
            onClick={() => goTo(current + 1)}
            className="w-10 h-10 rounded-full border border-black/10 bg-white flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-default hover:bg-black/[0.03]"
            style={{ color: accent }}
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      )}
      </div>

      {open && admin && isPreviewActive && (
        <ProductDetailModal
          key={open.id}
          product={open}
          settings={admin.settings}
          accent={accent}
          related={related}
          onOpenRelated={openRelated}
          onClose={() => setOpenId(null)}
          onAdded={showAdded}
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

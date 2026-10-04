// The 'shopProducts' canvas element: the store page's product grid, filled from the products the
// owner exported to the store (لوحة الإدارة ← إضافة منتج ← تصدير إلى المتجر). Clicking a product
// in preview / on the live site opens its full card floating over the page. The element's
// shopLayout picks how the products are laid out (grid, zigzag, wide, small or large cards, a
// running strip or animated cards) and shopLimit how many are shown.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PackageOpen } from 'lucide-react';
import type { CanvasElement } from '../../../types';
import { useShopData, useShopUpdate } from './ShopDataContext';
import { recordVisit } from '../orderModel';
import { ProductCard, ProductSlide, ProductZigzag, ProductWide, ProductMini, ProductChip } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';

// Narrowest column of each grid layout.
const COLUMN: Partial<Record<string, number>> = { grid: 210, wide: 420, small: 130, large: 320, spotlight: 220 };
// Small cards keep their size and gather in the middle when there are only a few.
const columns = (layout: string) =>
  layout === 'small' ? 'repeat(auto-fit, minmax(130px, 170px))' : `repeat(auto-fill, minmax(${COLUMN[layout] || 210}px, 1fr))`;

interface ShopProductsViewProps {
  elem: CanvasElement;
  isPreviewActive: boolean;
}

export const ShopProductsView: React.FC<ShopProductsViewProps> = ({ elem, isPreviewActive }) => {
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

  const products = useMemo(() => (admin?.products || []).filter((p) => p.published), [admin]);
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
  const active = tabs.find((t) => t.id === catalog);
  const filtered = active ? products.filter((p) => p.catalogIds.some((id) => active.ids.includes(id))) : products;
  const list = elem.shopLimit && elem.shopLimit > 0 ? filtered.slice(0, elem.shopLimit) : filtered;
  // Catalog tabs only where there is room for them.
  const showTabs = tabs.length > 1 && !marquee && elem.height >= 300;
  const open = products.find((p) => p.id === openId);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const related = open ? open.relatedIds.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p) : [];

  // A related product: scroll the store to its card behind the overlay and open its card.
  const openRelated = (id: string) => {
    setCatalog('all');
    setOpenId(id);
    window.requestAnimationFrame(() => {
      gridRef.current?.querySelector(`[data-product-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  return (
    <div
      dir="rtl"
      className="w-full h-full flex flex-col gap-4 font-['IBM_Plex_Sans_Arabic',sans-serif]"
      style={{ pointerEvents: isPreviewActive ? 'auto' : 'none' }}
      onClick={stop}
    >
      {showTabs && (
        <div className="flex flex-wrap justify-center gap-2 shrink-0">
          {[{ id: 'all', name: 'الكل' }, ...tabs].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setCatalog(t.id)}
              className="h-9 px-4 rounded-full text-sm font-bold border transition cursor-pointer"
              style={catalog === t.id ? { backgroundColor: accent, borderColor: accent, color: '#fff' } : { backgroundColor: '#fff', borderColor: 'rgba(0,0,0,0.08)', color: '#5A4C42' }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        elem.height < 200 ? (
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
        // Running strip: the list twice in a row, moved by half its width so it loops seamlessly.
        <div className="shop-marquee flex-1 min-h-0 overflow-hidden" dir="ltr">
          <div
            className="shop-marquee-track h-full flex w-max"
            style={{ '--shop-speed': `${elem.shopSpeed || 30}s` } as React.CSSProperties}
          >
            {[0, 1].map((copy) => (
              <div key={copy} className="h-full flex gap-4 pr-4" aria-hidden={copy === 1}>
                {list.map((p) => <ProductChip key={p.id} product={p} accent={accent} onOpen={() => setOpenId(p.id)} />)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div ref={gridRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-2 pt-3" onWheel={isPreviewActive ? stop : undefined}>
          <div className={layout === 'zigzag' ? 'flex flex-col gap-10' : 'grid gap-5'} style={layout === 'zigzag' ? undefined : { gridTemplateColumns: columns(layout), justifyContent: 'center' }}>
            {list.map((p, i) => {
              const show = () => setOpenId(p.id);
              const card =
                layout === 'zigzag' ? <ProductZigzag product={p} accent={accent} onOpen={show} flip={i % 2 === 1} />
                : layout === 'wide' ? <ProductWide product={p} accent={accent} onOpen={show} />
                : layout === 'small' ? <ProductMini product={p} accent={accent} onOpen={show} />
                : layout === 'grid' && p.display === 'slide' ? <ProductSlide product={p} accent={accent} onOpen={show} />
                : <ProductCard product={p} accent={accent} onOpen={show} />;
              const wide = layout === 'grid' && p.display === 'slide';
              return (
                <div
                  key={p.id}
                  data-product-id={p.id}
                  className={`${wide ? 'col-span-full' : 'flex'} ${cardAnim !== 'none' ? `shop-anim-${cardAnim}` : ''}`}
                  style={cardAnim !== 'none' ? { animationDelay: `${(i % 4) * 0.35}s` } : undefined}
                >
                  {card}
                </div>
              );
            })}
          </div>
        </div>
      )}

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

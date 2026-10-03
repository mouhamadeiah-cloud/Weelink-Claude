// The 'shopProducts' canvas element: the store page's product grid, filled from the products the
// owner exported to the store (لوحة الإدارة ← إضافة منتج ← تصدير إلى المتجر). Clicking a product
// in preview / on the live site opens its full card floating over the page.
import React, { useMemo, useRef, useState } from 'react';
import { PackageOpen } from 'lucide-react';
import type { CanvasElement } from '../../../types';
import { useShopData } from './ShopDataContext';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';

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

  const products = useMemo(() => (admin?.products || []).filter((p) => p.published), [admin]);
  // Main catalogs that hold at least one shown product (directly or through a sub catalog).
  const tabs = useMemo(() => {
    const cats = admin?.catalogs || [];
    return cats
      .filter((c) => !c.parentId)
      .map((c) => ({ ...c, ids: [c.id, ...cats.filter((s) => s.parentId === c.id).map((s) => s.id)] }))
      .filter((c) => products.some((p) => p.catalogIds.some((id) => c.ids.includes(id))));
  }, [admin, products]);

  const active = tabs.find((t) => t.id === catalog);
  const list = active ? products.filter((p) => p.catalogIds.some((id) => active.ids.includes(id))) : products;
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
      {tabs.length > 1 && (
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
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center rounded-3xl border-2 border-dashed border-black/10 bg-white/60 px-6">
          <PackageOpen size={44} className="text-black/15" />
          <span className="text-base font-bold text-[#5A4C42]">لا توجد منتجات معروضة بعد</span>
          <span className="text-sm text-[#8A7B70] max-w-md">
            افتح ترس الإدارة في أسفل الصفحة، ثم «إضافة منتج»، واضغط «تصدير إلى المتجر» ليظهر المنتج هنا.
          </span>
        </div>
      ) : (
        <div ref={gridRef} className="flex-1 min-h-0 overflow-y-auto pb-2" onWheel={isPreviewActive ? stop : undefined}>
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
            {list.map((p) => (
              <div key={p.id} data-product-id={p.id} className="flex">
                <ProductCard product={p} accent={accent} onOpen={() => setOpenId(p.id)} />
              </div>
            ))}
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
        />
      )}
    </div>
  );
};

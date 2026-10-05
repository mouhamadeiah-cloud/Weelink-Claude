// The 'menuList' canvas element: the restaurant's menu, filled live from the dishes in the admin
// window (ترس الإدارة ← الأطباق). menuSource picks every dish, the featured ones or one catalog;
// menuTabs adds the catalogs as tabs above the dishes; menuLayout picks the cards (grid, menu rows
// or large photos); the card colours and corners are the element's own. In preview / on the live
// site a dish opens its window (ingredients, extras, note, quantity), and on the live page the
// slide grows to fit all the dishes (onGrow).
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Plus, ImageOff, UtensilsCrossed, CheckCircle2 } from 'lucide-react';
import type { CanvasElement } from '../../../types';
import { useRestaurantData } from './RestaurantDataContext';
import { DishModal, MenuLook } from './DishModal';
import { Dish, DISH_BADGES, MenuCategory, dishSubCatalogs } from '../restaurantTypes';
import { addMenuLine } from '../menuCartStore';
import { formatMoney } from '../../shop/adminUi';

interface MenuViewProps {
  elem: CanvasElement;
  isPreviewActive: boolean;
  onGrow?: (extra: number) => void;
  boxHeight?: number;
}

export const menuLookOf = (elem: CanvasElement): MenuLook => ({
  accent: elem.styles.color || '#B5562B',
  cardBg: elem.menuCardBg || '#FFFFFF',
  text: elem.menuCardText || '#2B2118',
  radius: elem.menuCardRadius ?? 20,
  font: `${elem.styles.fontFamily ? `${elem.styles.fontFamily}, ` : ''}'IBM Plex Sans Arabic', sans-serif`,
});

interface CardProps {
  dish: Dish;
  look: MenuLook;
  currency: string;
  onOpen: () => void;
  onAdd: () => void;
}

const Badge: React.FC<{ dish: Dish }> = ({ dish }) => {
  const b = DISH_BADGES.find((x) => x.id === dish.badge && x.id);
  return b ? <span className="px-2.5 h-6 rounded-full text-white text-[11px] font-bold inline-flex items-center" style={{ backgroundColor: b.color }}>{b.label}</span> : null;
};

const Price: React.FC<{ dish: Dish; look: MenuLook; currency: string }> = ({ dish, look, currency }) => (
  <span className="inline-flex items-baseline gap-2">
    <span className="font-black" style={{ color: look.accent }}>{formatMoney(dish.price, currency)}</span>
    {dish.oldPrice > dish.price && <span className="text-xs opacity-45 line-through">{formatMoney(dish.oldPrice, currency)}</span>}
  </span>
);

const AddButton: React.FC<{ dish: Dish; look: MenuLook; onAdd: () => void }> = ({ dish, look, onAdd }) =>
  dish.available ? (
    <button
      type="button"
      aria-label={`أضف ${dish.name}`}
      onClick={(e) => { e.stopPropagation(); onAdd(); }}
      className="w-10 h-10 shrink-0 rounded-full text-white flex items-center justify-center cursor-pointer shadow-md active:scale-90 transition"
      style={{ backgroundColor: look.accent }}
    >
      <Plus size={20} />
    </button>
  ) : (
    <span className="px-3 h-8 shrink-0 rounded-full bg-black/[0.06] text-xs font-bold inline-flex items-center opacity-70">نفد اليوم</span>
  );

const Photo: React.FC<{ dish: Dish; className?: string }> = ({ dish, className = '' }) =>
  dish.image ? (
    <img src={dish.image} alt={dish.name} referrerPolicy="no-referrer" loading="lazy" className={`w-full h-full object-cover ${className}`} />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-black/[0.05] text-black/20"><ImageOff size={28} /></div>
  );

const GridCard: React.FC<CardProps> = ({ dish, look, currency, onOpen, onAdd }) => (
  <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    className={`flex flex-col overflow-hidden cursor-pointer shadow-[0_6px_24px_rgba(0,0,0,0.07)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition ${dish.available ? '' : 'opacity-70'}`}
    style={{ background: look.cardBg, color: look.text, borderRadius: look.radius }}>
    <div className="relative aspect-[4/3] overflow-hidden">
      <Photo dish={dish} className="hover:scale-105 transition duration-500" />
      <div className="absolute top-3 right-3"><Badge dish={dish} /></div>
    </div>
    <div className="flex-1 p-4 flex flex-col gap-1.5">
      <div className="font-black text-[17px] leading-snug">{dish.name}</div>
      {dish.description && <p className="text-[13px] opacity-60 leading-relaxed line-clamp-2">{dish.description}</p>}
      <div className="mt-auto pt-2 flex items-center justify-between gap-2">
        <Price dish={dish} look={look} currency={currency} />
        <AddButton dish={dish} look={look} onAdd={onAdd} />
      </div>
    </div>
  </div>
);

const RowCard: React.FC<CardProps> = ({ dish, look, currency, onOpen, onAdd }) => (
  <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    className={`flex items-stretch gap-4 p-3 cursor-pointer shadow-[0_4px_18px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.1)] transition ${dish.available ? '' : 'opacity-70'}`}
    style={{ background: look.cardBg, color: look.text, borderRadius: look.radius }}>
    <div className="flex-1 min-w-0 flex flex-col gap-1 py-1">
      <div className="flex items-center gap-2 flex-wrap"><span className="font-black text-[16px]">{dish.name}</span><Badge dish={dish} /></div>
      {dish.description && <p className="text-[13px] opacity-60 leading-relaxed line-clamp-2">{dish.description}</p>}
      <div className="mt-auto pt-1"><Price dish={dish} look={look} currency={currency} /></div>
    </div>
    <div className="relative w-28 h-28 shrink-0 overflow-hidden" style={{ borderRadius: Math.max(0, look.radius - 6) }}>
      <Photo dish={dish} />
      <div className="absolute bottom-1.5 left-1.5"><AddButton dish={dish} look={look} onAdd={onAdd} /></div>
    </div>
  </div>
);

const LargeCard: React.FC<CardProps> = ({ dish, look, currency, onOpen, onAdd }) => (
  <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    className={`relative overflow-hidden cursor-pointer aspect-[16/11] group ${dish.available ? '' : 'opacity-70'}`}
    style={{ borderRadius: look.radius }}>
    <Photo dish={dish} className="group-hover:scale-105 transition duration-700" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
    <div className="absolute top-4 right-4"><Badge dish={dish} /></div>
    <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between gap-3 text-white">
      <div className="min-w-0 space-y-1">
        <div className="font-black text-2xl leading-snug">{dish.name}</div>
        {dish.description && <p className="text-sm text-white/75 line-clamp-1">{dish.description}</p>}
        <div className="text-lg font-black">{formatMoney(dish.price, currency)}</div>
      </div>
      <AddButton dish={dish} look={look} onAdd={onAdd} />
    </div>
  </div>
);

const CARD_MIN: Record<string, number> = { grid: 250, list: 420, large: 420 };

export const MenuView: React.FC<MenuViewProps> = ({ elem, isPreviewActive, onGrow, boxHeight }) => {
  const data = useRestaurantData();
  const look = menuLookOf(elem);
  const layout = elem.menuLayout || 'grid';
  const source = elem.menuSource || 'all';
  const [tab, setTab] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const categories: MenuCategory[] = useMemo(() => (data?.categories || []).filter((c) => !c.hidden && c.name.trim()), [data]);
  const dishes = useMemo(() => {
    const visible = new Set(categories.map((c) => c.id));
    const all = (data?.dishes || []).filter((d) => d.published && d.name.trim() && visible.has(d.categoryId));
    if (source === 'featured') return all.filter((d) => d.featured);
    if (source === 'category') return all.filter((d) => d.categoryId === elem.menuCategoryId);
    return all;
  }, [data, categories, source, elem.menuCategoryId]);
  const limited = elem.menuLimit ? dishes.slice(0, elem.menuLimit) : dishes;
  const usedCats = categories.filter((c) => limited.some((d) => d.categoryId === c.id));
  const showTabs = elem.menuTabs !== false && source === 'all' && usedCats.length > 1;
  useEffect(() => {
    if (tab !== 'all' && !usedCats.some((c) => c.id === tab)) setTab('all');
  }, [tab, usedCats]);

  // With tabs on «الكل», the dishes are grouped under their catalogs' names.
  const sections: { cat: MenuCategory | null; dishes: Dish[] }[] = showTabs
    ? tab === 'all'
      ? usedCats.map((c) => ({ cat: c, dishes: limited.filter((d) => d.categoryId === c.id) }))
      : [{ cat: null, dishes: limited.filter((d) => d.categoryId === tab) }]
    : [{ cat: null, dishes: limited }];

  const grows = isPreviewActive;
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

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const open = data?.dishes.find((d) => d.id === openId);
  const currency = data?.settings.currency || 'ل.س';

  const quickAdd = (dish: Dish) => {
    if (!data || !isPreviewActive) return;
    if (!data.settings.acceptOrders || dishSubCatalogs(dish, data.subCatalogs).length > 0) {
      setOpenId(dish.id);
      return;
    }
    addMenuLine({ dishId: dish.id, name: dish.name, image: dish.image, unitPrice: dish.price, qty: 1, removed: [], extras: [], notes: '' });
    setToast(dish.name);
  };

  const Card = layout === 'list' ? RowCard : layout === 'large' ? LargeCard : GridCard;

  return (
    <div
      dir="rtl"
      className={`w-full h-full ${grows ? '' : 'overflow-hidden'}`}
      style={{ pointerEvents: isPreviewActive ? 'auto' : 'none', fontFamily: look.font }}
      onClick={stop}
    >
      <div ref={contentRef} data-menu-list className="w-full flex flex-col gap-6" style={grows ? { minHeight: box } : { height: '100%' }}>
        {showTabs && (
          <div className="flex gap-2 overflow-x-auto pb-1 justify-center flex-wrap">
            {[{ id: 'all', name: 'الكل', icon: '🍽️' }, ...usedCats].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setTab(c.id)}
                className={`h-11 px-5 rounded-full text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition border ${tab === c.id ? 'text-white border-transparent shadow-md' : 'bg-white border-black/10 text-[#2B2118] hover:border-black/20'}`}
                style={tab === c.id ? { backgroundColor: look.accent } : undefined}
              >
                {c.icon && <span>{c.icon}</span>}
                {c.name}
              </button>
            ))}
          </div>
        )}

        {limited.length === 0 ? (
          <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center gap-3 text-center rounded-3xl border-2 border-dashed border-black/10 bg-white/60 p-8">
            <UtensilsCrossed size={40} style={{ color: look.accent }} />
            <div className="font-black text-lg text-[#2B2118]">لا توجد أطباق هنا بعد</div>
            <p className="text-sm text-black/50 max-w-sm leading-relaxed">أضف أقسام المنيو والأطباق من ترس الإدارة أسفل الشاشة، وستظهر هنا مباشرة.</p>
          </div>
        ) : (
          sections.map(({ cat, dishes: list }) => (
            <section key={cat?.id || 'all'} className="space-y-4">
              {cat && (
                <h3 className="text-2xl font-black flex items-center gap-2" style={{ color: look.text }}>
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.name}
                </h3>
              )}
              <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_MIN[layout] || 250}px, 1fr))` }}>
                {list.map((d) => (
                  <Card key={d.id} dish={d} look={look} currency={currency} onOpen={() => isPreviewActive && setOpenId(d.id)} onAdd={() => quickAdd(d)} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {open && data && isPreviewActive && <DishModal dish={open} data={data} look={look} onClose={() => setOpenId(null)} onAdded={setToast} />}
      {toast && isPreviewActive && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000001] px-5 h-12 rounded-full bg-[#1d1d1f] text-white text-sm font-bold flex items-center gap-2 shadow-xl" dir="rtl" style={{ fontFamily: look.font }}>
          <CheckCircle2 size={18} className="text-[#34c759]" />
          أُضيف «{toast}» إلى طلبك
        </div>
      )}
    </div>
  );
};

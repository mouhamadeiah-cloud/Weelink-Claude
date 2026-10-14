// One card in the ready-slide picker, the same for every slide category: the slide's name in the
// colour of what it does (a moving strip, the order cart, a product list...), its real height, and a
// drawing of the slide at its real proportions on the 1280-wide canvas. Shop, showroom and menu
// elements are the real store views filled with example data and stock photos, so the user sees
// how the slide will look on the page before adding it.
import React, { useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { getGlowShadowStyle } from '../../types';
import { ShopDataContext, ShopUpdateContext } from '../shop/store/ShopDataContext';
import { CarDataContext, CarRequestContext } from '../cars/store/CarDataContext';
import { RestaurantDataContext, RestaurantOrderContext } from '../restaurant/store/RestaurantDataContext';
import { ShopProductsView } from '../shop/store/ShopProductsView';
import { ShopSearchView } from '../shop/store/ShopSearchView';
import { CarListingsView } from '../cars/store/CarListingsView';
import { CarSearchView } from '../cars/store/CarSearchView';
import { MenuView } from '../restaurant/store/MenuView';
import { MenuCartView } from '../restaurant/store/MenuCartView';
import { CartView, CheckoutFormCard } from '../CartView';
import { demoShopAdmin, demoCarAdmin, demoRestaurantAdmin } from './slidePreviewDemo';

const CANVAS_WIDTH = 1280;
// Taller slides are cut here (with a fade); the height label still gives the real height.
const MAX_PREVIEW_HEIGHT = 1100;

export interface SlidePayload {
  name: string;
  height: number;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundOpacity?: number;
  elements: any[];
}

// What a slide does, with the colour its name and tag are drawn in.
export const SLIDE_KINDS = {
  moving: { label: 'شريط متحرك', color: '#7c3aed', bg: '#f3e8ff' },
  textStrip: { label: 'شريط نص متحرك', color: '#c026d3', bg: '#fae8ff' },
  shake: { label: 'حركة اهتزاز', color: '#ea580c', bg: '#ffedd5' },
  order: { label: 'سلة وطلب', color: '#16a34a', bg: '#dcfce7' },
  search: { label: 'بحث', color: '#0284c7', bg: '#e0f2fe' },
  listing: { label: 'عرض العناصر', color: '#b45309', bg: '#fef3c7' },
  hero: { label: 'واجهة', color: '#e11d48', bg: '#ffe4e6' },
  contact: { label: 'تواصل وحجز', color: '#0d9488', bg: '#ccfbf1' },
  offer: { label: 'أسعار وعروض', color: '#d97706', bg: '#fef3c7' },
  media: { label: 'صور وفيديو', color: '#4f46e5', bg: '#e0e7ff' },
  info: { label: 'محتوى تعريفي', color: '#475569', bg: '#f1f5f9' },
} as const;

export type SlideKind = keyof typeof SLIDE_KINDS;

const CATEGORY_KINDS: Record<string, SlideKind> = {
  intro: 'hero',
  contact: 'contact',
  booking: 'contact',
  map: 'contact',
  prices: 'offer',
  special_offer: 'offer',
  gallery: 'media',
  video: 'media',
  projects: 'media',
};

const LISTS = ['shopProducts', 'carListings', 'menuList'];

export const slideKindOf = (payload: SlidePayload, categoryId: string, index: number): SlideKind => {
  const els = payload.elements || [];
  const lists = els.filter((e) => LISTS.includes(e.type));
  if (lists.some((e) => e.shopLayout === 'marquee' || e.carLayout === 'marquee' || e.menuLayout === 'marquee')) return 'moving';
  if (els.some((e) => e.type === 'paragraph' && /^marquee/.test(e.styles?.animation || ''))) return 'textStrip';
  if (lists.some((e) => e.shopCardAnimation && e.shopCardAnimation !== 'none')) return 'shake';
  if (els.some((e) => ['cart', 'checkout', 'menuCart'].includes(e.type))) return 'order';
  if (els.some((e) => ['shopSearch', 'carSearch'].includes(e.type))) return 'search';
  if (lists.length) return 'listing';
  if (els.some((e) => e.type === 'input')) return 'contact';
  if (['shop', 'cars', 'restaurant'].includes(categoryId) && index === 0) return 'hero';
  return CATEGORY_KINDS[categoryId] || 'info';
};

const heightLabel = (h: number) =>
  h <= 120 ? 'شريط ضيق' : h <= 420 ? 'شريحة منخفضة' : h <= 800 ? 'شريحة متوسطة' : 'شريحة طويلة';

const ANIM_DEFAULT = (anim: string) =>
  anim === 'spin-slow' ? 10 : /^marquee/.test(anim) ? 12 : ['fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'scale-up', 'scale-down'].includes(anim) ? 1.2 : 2;

// The element's own animation, as the canvas plays it (hover animations are left out).
const animationOf = (el: any): React.CSSProperties => {
  const anim = el.styles?.animation;
  if (!anim || anim === 'none' || el.styles?.animationTrigger === 'hover') return {};
  const loop = el.styles?.animationTrigger === 'loop';
  return {
    animationName: anim,
    animationDuration: `${el.styles?.animationDuration || ANIM_DEFAULT(anim)}s`,
    animationIterationCount: loop ? 'infinite' : '1',
    animationTimingFunction: /^marquee/.test(anim) ? 'linear' : 'ease-out',
    animationFillMode: loop ? 'none' : 'forwards',
  };
};

const imageOf = (el: any): string | undefined =>
  el.imageUrl || (typeof el.content === 'string' && /^(https?:|data:)/.test(el.content) ? el.content : undefined);

// A menu slide showing one section has no section chosen yet; the preview shows the drinks.
const withDemoSection = (el: any) => {
  if (el.type !== 'menuList' || el.menuSource !== 'category' || el.menuCategoryId) return el;
  const cats = demoRestaurantAdmin().categories;
  return { ...el, menuCategoryId: (cats.find((c) => c.id === 'cat-drinks') || cats[0])?.id };
};

const LiveElement: React.FC<{ el: any }> = ({ el: raw }) => {
  const el = withDemoSection(raw);
  const box = el.height;
  switch (el.type) {
    case 'shopProducts':
      return <ShopProductsView elem={el} isPreviewActive={false} boxHeight={box} />;
    case 'carListings':
      return <CarListingsView elem={el} isPreviewActive={false} boxHeight={box} />;
    case 'menuList':
      return <MenuView elem={el} isPreviewActive={false} boxHeight={box} />;
    case 'shopSearch':
      return <ShopSearchView elem={el} isPreviewActive={false} />;
    case 'carSearch':
      return <CarSearchView elem={el} isPreviewActive={false} />;
    case 'menuCart':
      return <MenuCartView elem={el} isPreviewActive={false} />;
    case 'cart':
      return <CartView elem={el} isPreviewActive={false} />;
    case 'checkout':
      return <CheckoutFormCard elem={el} isPreviewActive={false} />;
    default:
      return null;
  }
};

const LIVE_TYPES = ['shopProducts', 'carListings', 'menuList', 'shopSearch', 'carSearch', 'menuCart', 'cart', 'checkout'];

const StaticBody: React.FC<{ el: any }> = ({ el }) => {
  const s = el.styles || {};
  const gradientText = typeof s.color === 'string' && s.color.includes('gradient');
  const textStyle: React.CSSProperties = gradientText
    ? { backgroundImage: s.color, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block', width: '100%' }
    : {};
  switch (el.type) {
    case 'heading':
      return <h2 className="font-bold tracking-tight px-2 leading-tight" style={textStyle}>{el.content}</h2>;
    case 'paragraph':
      return s.listStyle === 'bullet' || s.listStyle === 'numeric' ? (
        <div className="px-2 leading-relaxed space-y-1">
          {String(el.content || '').split('\n').map((line: string, i: number) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[#0071e3] shrink-0 font-bold">{s.listStyle === 'bullet' ? '•' : `${i + 1}.`}</span>
              <span>{line.replace(/^[•\-\d+.]\s*/, '')}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-2 leading-relaxed" style={textStyle}>{el.content}</p>
      );
    case 'button':
      return (
        <div className="w-full h-full flex items-center justify-center px-4 font-semibold text-sm">
          <span style={textStyle}>{el.content}</span>
        </div>
      );
    case 'image': {
      const src = imageOf(el);
      return (
        <div className={`w-full h-full overflow-hidden rounded-xl relative ${s.objectFit === 'contain' ? '' : 'bg-neutral-100'}`}>
          {src ? (
            <img src={src} alt="" referrerPolicy="no-referrer" loading="lazy" className={`w-full h-full ${s.objectFit === 'contain' ? 'object-contain' : 'object-cover'}`} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🖼️</div>
          )}
          {s.imageTintColor && (
            <div className="absolute inset-0" style={{ backgroundColor: s.imageTintColor, opacity: (s.imageTintOpacity ?? 50) / 100, mixBlendMode: (s.imageTintBlendMode || 'multiply') as any }} />
          )}
        </div>
      );
    }
    case 'icon':
      if (typeof el.content === 'string' && el.content.startsWith('iconify:')) {
        return (
          <div className="w-full h-full flex items-center justify-center p-1">
            <Icon icon={el.content.replace('iconify:', '')} className="w-full h-full" style={{ color: s.color || '#0071e3' }} />
          </div>
        );
      }
      return <div className="w-full h-full flex items-center justify-center text-4xl">{el.content}</div>;
    case 'badge':
      return (
        <div className="w-full h-full flex items-center justify-center text-center px-1 leading-none">
          <span style={{ fontSize: s.fontSize ? `${s.fontSize}px` : '16px', fontWeight: s.fontWeight || 'bold', ...textStyle }}>{el.content}</span>
        </div>
      );
    case 'shape':
      if (typeof el.content === 'string' && el.content.startsWith('line-')) {
        return <div className="w-full my-auto" style={{ height: 3, background: s.backgroundColor || s.color || '#0071e3' }} />;
      }
      return <div className="w-full h-full flex items-center justify-center text-center p-2 leading-none">{el.content}</div>;
    case 'divider':
      return <div className="w-full h-px bg-black/[0.12] my-auto" />;
    case 'input':
      return (
        <div className="w-full h-full px-3.5 flex items-center bg-white/95 border border-neutral-300 rounded-xl text-neutral-400">
          {el.content}
        </div>
      );
    case 'lottie':
      return <div className="w-full h-full rounded-xl bg-neutral-100 flex items-center justify-center text-6xl">✨</div>;
    case 'video':
      return <div className="w-full h-full rounded-xl bg-neutral-900 flex items-center justify-center text-white text-6xl">▶</div>;
    case 'map':
      return <div className="w-full h-full rounded-xl bg-[#e5efe0] flex items-center justify-center text-6xl">📍</div>;
    case 'table':
      return (
        <div className="w-full h-full p-3 grid grid-rows-4 gap-2">
          {[0, 1, 2, 3].map((r) => <div key={r} className="rounded-md" style={{ background: r === 0 ? '#0071e3' : 'rgba(0,0,0,0.06)' }} />)}
        </div>
      );
    default:
      return <div className="w-full h-full flex items-center justify-center px-2">{typeof el.content === 'string' ? el.content : ''}</div>;
  }
};

const PreviewElement: React.FC<{ el: any; z: number }> = ({ el, z }) => {
  const s = el.styles || {};
  const live = LIVE_TYPES.includes(el.type);
  const bg = s.backgroundColor && s.backgroundColor !== 'transparent' ? s.backgroundColor : undefined;
  const hasBg = !live && el.type !== 'image' && !(el.type === 'shape' && String(el.content || '').startsWith('line-')) && (bg || s.backgroundImage);
  return (
    <div
      className="absolute"
      style={{
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        zIndex: z,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        filter: el.clipPath ? 'drop-shadow(0px 8px 20px rgba(0,0,0,0.14))' : undefined,
        ...animationOf(el),
      }}
    >
      <div
        className="relative w-full h-full overflow-hidden flex flex-col justify-center"
        style={{
          borderRadius: el.clipPath ? undefined : typeof s.borderRadius === 'string' ? s.borderRadius : `${s.borderRadius || 0}px`,
          borderWidth: el.clipPath ? undefined : `${s.borderWidth || 0}px`,
          borderColor: s.borderColor || 'transparent',
          borderStyle: s.borderStyle || 'solid',
          boxShadow: el.clipPath ? undefined : getGlowShadowStyle(s.glowIntensity, s.glowColor, s.glowPosition, false),
          clipPath: el.clipPath ? (el.clipPath.startsWith('polygon') ? el.clipPath : `url(#${el.clipPath})`) : undefined,
        }}
      >
        {hasBg && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: bg?.includes('gradient') ? undefined : bg,
              backgroundImage: s.backgroundImage ? `url("${s.backgroundImage}")` : bg?.includes('gradient') ? bg : undefined,
              backgroundSize: s.backgroundSize || 'cover',
              backgroundPosition: 'center',
              opacity: s.backgroundOpacity ?? 1,
              borderRadius: 'inherit',
            }}
          />
        )}
        <div
          className="relative z-10 w-full h-full flex flex-col justify-center"
          style={{
            opacity: s.contentOpacity ?? s.opacity ?? 1,
            color: s.color?.includes?.('gradient') ? 'transparent' : s.color || '#1d1d1f',
            textAlign: s.textAlign || 'right',
            fontSize: `${s.fontSize || 16}px`,
            fontWeight: s.fontWeight || 'normal',
            fontStyle: s.fontStyle || 'normal',
            fontFamily: s.fontFamily || undefined,
          }}
        >
          {live ? <LiveElement el={el} /> : <StaticBody el={el} />}
        </div>
      </div>
    </div>
  );
};

interface Props {
  payload: SlidePayload;
  categoryId: string;
  index: number;
  onAdd: () => void;
}

export const SlideTemplatePreview: React.FC<Props> = ({ payload, categoryId, index, onAdd }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(300);
  useLayoutEffect(() => {
    const node = boxRef.current;
    if (!node) return;
    const measure = () => setWidth(node.clientWidth || 300);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const kind = SLIDE_KINDS[slideKindOf(payload, categoryId, index)];
  const realHeight = payload.height || 580;
  const shownHeight = Math.min(realHeight, MAX_PREVIEW_HEIGHT);
  const scale = width / CANVAS_WIDTH;
  const bg = payload.backgroundColor || '#ffffff';

  return (
    <div
      onClick={onAdd}
      className="w-full bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs group cursor-pointer hover:shadow-md transition-all relative"
      style={{ ['--kind' as any]: kind.color }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = kind.color)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
    >
      <div className="px-2.5 py-2 border-b border-neutral-100 flex items-center gap-2" style={{ background: kind.bg }}>
        <span className="w-1.5 self-stretch rounded-full shrink-0" style={{ background: kind.color }} />
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-black leading-tight truncate" style={{ color: kind.color }}>
            {payload.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold text-neutral-500">
            <span className="px-1.5 py-px rounded-full text-white" style={{ background: kind.color }}>{kind.label}</span>
            <span>
              {heightLabel(realHeight)} · ارتفاع {realHeight}px
            </span>
          </div>
        </div>
      </div>

      <div ref={boxRef} className="w-full relative overflow-hidden" style={{ height: Math.max(8, Math.round(shownHeight * scale)), background: bg }}>
        {payload.backgroundImage && (
          <div
            className="absolute inset-0"
            style={{ backgroundImage: `url(${payload.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: payload.backgroundOpacity ?? 1 }}
          />
        )}
        <div
          className="absolute top-0 left-0 origin-top-left pointer-events-none select-none"
          style={{ width: CANVAS_WIDTH, height: realHeight, transform: `scale(${scale})` }}
        >
          <ShopUpdateContext.Provider value={null}>
            <ShopDataContext.Provider value={demoShopAdmin()}>
              <CarRequestContext.Provider value={null}>
                <CarDataContext.Provider value={demoCarAdmin()}>
                  <RestaurantOrderContext.Provider value={null}>
                    <RestaurantDataContext.Provider value={demoRestaurantAdmin()}>
                      {(payload.elements || []).map((el, i) => <PreviewElement key={i} el={el} z={(i + 1) * 10} />)}
                    </RestaurantDataContext.Provider>
                  </RestaurantOrderContext.Provider>
                </CarDataContext.Provider>
              </CarRequestContext.Provider>
            </ShopDataContext.Provider>
          </ShopUpdateContext.Provider>
        </div>
        {realHeight > MAX_PREVIEW_HEIGHT && (
          <div className="absolute inset-x-0 bottom-0 h-10 flex items-end justify-center pb-1 text-[10px] font-bold text-neutral-600" style={{ background: `linear-gradient(to bottom, transparent, ${bg.includes('gradient') ? '#ffffff' : bg})` }}>
            تتابع الشريحة للأسفل
          </div>
        )}
        <div className="absolute inset-0 bg-neutral-950/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 z-[999]">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg" style={{ background: kind.color }}>
            ＋
          </div>
          {shownHeight * scale > 40 && <span className="text-[10px] font-bold">انقر لإضافة الشريحة</span>}
        </div>
      </div>
    </div>
  );
};

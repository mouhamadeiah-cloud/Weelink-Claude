// «عروض مميزة» in a paid page (Eyad, 26 Oct): a slide of live cards that shows what the owner marked
// «مميز» in the warehouse: the cars, the products, the room types, the dishes, or a rental's cars and items.
// A paid shop, car showroom, rental, hotel or restaurant gets it once, after the hero of its main page,
// unless a slide already shows featured cards. The owner may remove it and it stays removed
// (page.featuredSuggested). The free page has none.
import type { CanvasElement, Page, Slide } from '../types';

export type FeaturedKind = 'cars' | 'items' | 'dishes';

const isFeaturedLive = (e: CanvasElement) =>
  (e.type === 'carListings' && e.carSource === 'featured') || (e.type === 'shopProducts' && e.shopSource === 'featured') || (e.type === 'menuList' && e.menuSource === 'featured');

const LIVE: Record<FeaturedKind, CanvasElement['type']> = { cars: 'carListings', items: 'shopProducts', dishes: 'menuList' };

/** True when a slide of these pages already shows featured cards. */
export const hasFeaturedCards = (pages: Page[], elements: CanvasElement[]) => {
  const slideIds = new Set(pages.flatMap((p) => p.slides.map((s) => s.id)));
  return elements.some((e) => isFeaturedLive(e) && slideIds.has(e.slideId));
};

/** The page, other than the main one, that lists everything of these kinds: where «عرض الكل» goes. */
export const listPageOf = (pages: Page[], elements: CanvasElement[], kinds: FeaturedKind[]) => {
  const types = kinds.map((k) => LIVE[k]);
  return pages.slice(1).find((p) => {
    const slides = new Set(p.slides.map((s) => s.id));
    return elements.some((e) => slides.has(e.slideId) && types.includes(e.type) && !isFeaturedLive(e));
  })?.id;
};

export interface FeaturedSlide {
  slide: Slide;
  elements: CanvasElement[];
}

const TITLES: Record<string, string> = { cars: 'سيارات مميزة', items: 'عروض مميزة', dishes: 'أطباق مميزة' };

/** The slide: a heading, the featured cards of each kind (one under the other), and «عرض الكل» when there is a list page. */
export const featuredSlide = (opts: { kinds: FeaturedKind[]; listPageId?: string; stamp: number; title?: string }): FeaturedSlide => {
  const { stamp } = opts;
  const kinds = opts.kinds.length ? opts.kinds : (['cars'] as FeaturedKind[]);
  const slideId = `slide-featured-${stamp}`;
  const mk = (suffix: string, type: CanvasElement['type'], y: number, height: number, content: string, styles: CanvasElement['styles'], extra: Partial<CanvasElement> = {}): CanvasElement =>
    ({ id: `el-${stamp}-${suffix}`, name: type, type, x: 90, y, width: 1100, height, content, slideId, styles, ...extra });
  const title = opts.title || (kinds.length === 1 ? TITLES[kinds[0]] : TITLES.items);
  const list: CanvasElement[] = [
    mk('fh', 'heading', 40, 56, title, { fontSize: 34, fontWeight: 'bold', color: '#1d1d1f', textAlign: 'center' }, { name: 'عنوان العروض المميزة' }),
    mk('fp', 'paragraph', 100, 30, 'اخترناها لك من أفضل ما عندنا', { fontSize: 16, color: '#6e6e73', textAlign: 'center' }, { name: 'وصف العروض المميزة' }),
  ];
  let y = 150;
  for (const kind of kinds) {
    if (kind === 'cars') list.push(mk('fc', 'carListings', y, 400, '', { color: '#C8102E' }, { name: 'سيارات مميزة', carLayout: 'grid', carLimit: 3, carSource: 'featured' }));
    else if (kind === 'items') list.push(mk('fi', 'shopProducts', y, 400, '', {}, { name: 'عروض مميزة', shopLayout: 'grid', shopLimit: 4, shopSource: 'featured' }));
    else list.push(mk('fd', 'menuList', y, 400, '', { color: '#C8102E' }, { name: 'أطباق مميزة', menuLayout: 'grid', menuSource: 'featured', menuLimit: 3 }));
    y += 420;
  }
  if (opts.listPageId) {
    list.push(mk('fb', 'button', y, 50, 'عرض الكل', { backgroundColor: 'transparent', color: '#1d1d1f', borderColor: '#1d1d1f', borderWidth: 1, fontSize: 16, fontWeight: '600', borderRadius: 9999, textAlign: 'center' }, { x: 530, width: 220, linkType: 'page', linkTargetId: opts.listPageId, linkUrl: `#page-${opts.listPageId}` }));
    y += 70;
  }
  return { slide: { id: slideId, name: 'عروض مميزة', height: y + 30, backgroundColor: '#f5f5f7' }, elements: list };
};

/** The pages with the slide put after the main page's first (the hero), or at its end when it has one slide. */
export const withFeaturedSlide = (pages: Page[], slide: Slide): Page[] =>
  pages.map((p, i) => {
    if (i !== 0) return p;
    const at = p.slides.length > 1 ? 1 : p.slides.length;
    return { ...p, featuredSuggested: true, slides: [...p.slides.slice(0, at), slide, ...p.slides.slice(at)] };
  });

/**
 * A rental lists cars and items, but the slide it already has may show only one kind (the car template's shows
 * cars): this adds the missing kind's featured cards under the slide's existing ones. Null when nothing is missing.
 */
export const withFeaturedKind = (pages: Page[], elements: CanvasElement[], kind: 'cars' | 'items', stamp: number): CanvasElement[] | null => {
  const type = LIVE[kind];
  const slideIds = new Set(pages.flatMap((p) => p.slides.map((s) => s.id)));
  if (elements.some((e) => e.type === type && isFeaturedLive(e) && slideIds.has(e.slideId))) return null;
  const host = elements.find((e) => isFeaturedLive(e) && slideIds.has(e.slideId));
  if (!host) return null;
  const inSlide = elements.filter((e) => e.slideId === host.slideId && isFeaturedLive(e));
  const y = Math.max(...inSlide.map((e) => e.y + e.height)) + 20;
  const added: CanvasElement = kind === 'cars'
    ? { id: `el-${stamp}-fc`, name: 'سيارات مميزة', type, x: host.x, y, width: host.width, height: 400, content: '', slideId: host.slideId, styles: { color: '#C8102E' }, carLayout: 'grid', carLimit: 3, carSource: 'featured' }
    : { id: `el-${stamp}-fi`, name: 'عروض مميزة', type, x: host.x, y, width: host.width, height: 400, content: '', slideId: host.slideId, styles: {}, shopLayout: 'grid', shopLimit: 4, shopSource: 'featured' };
  // What sat below the cards (the «عرض الكل» button) moves down to make room.
  return [...elements.map((e) => (e.slideId === host.slideId && e.y >= y - 20 && !isFeaturedLive(e) ? { ...e, y: e.y + 420 } : e)), added];
};

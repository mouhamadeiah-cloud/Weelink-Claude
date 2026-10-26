// A rental lists cars and items in one «عروض مميزة» slide (Eyad, 26 Oct): the slide the page already has may show
// only one kind (the car template's shows cars), so the missing kind's featured cards are added under it.
import type { CanvasElement, Page } from '../types';

const isFeaturedLive = (e: CanvasElement) =>
  (e.type === 'carListings' && e.carSource === 'featured') || (e.type === 'shopProducts' && e.shopSource === 'featured') || (e.type === 'menuList' && e.menuSource === 'featured');

const LIVE = { cars: 'carListings', items: 'shopProducts' } as const;

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

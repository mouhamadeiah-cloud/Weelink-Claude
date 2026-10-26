// A rental's cart page (Eyad, 26 Oct): «السلة» like the shop's, a page holding the 'cart' element, which in a rental books
// what the visitor added (rental/rentalCart.tsx). New rentals get it with the template; rentals made before it get it once.
import type { CanvasElement, Page } from '../types';
import { typeSize } from './pageLooks';

export const RENTAL_CART_PAGE = 'rental-page-cart';
const SLIDE = 'rental-cart-slide';

const hasCart = (pages: Page[], elements: CanvasElement[]) => {
  const slideIds = new Set(pages.flatMap((p) => p.slides.map((s) => s.id)));
  return elements.some((e) => e.type === 'cart' && slideIds.has(e.slideId));
};

/** The page, its slide and its elements, ready to append; null when the rental already has a cart or has no page to copy the navbar from. */
export const rentalCartPage = (pages: Page[], elements: CanvasElement[], stamp: number): { pages: Page[]; elements: CanvasElement[] } | null => {
  if (!pages[0] || hasCart(pages, elements) || pages.some((p) => p.id === RENTAL_CART_PAGE)) return null;
  const accent = '#C8102E';
  const page: Page = {
    ...pages[0],
    id: RENTAL_CART_PAGE,
    name: 'السلة',
    slug: '/cart',
    slides: [{ id: SLIDE, name: 'السلة', height: 1280, backgroundColor: '#FFFFFF', dividerShape: 'straight' }],
  };
  const base = { x: 0, content: '', slideId: SLIDE, styles: {} };
  return {
    pages: [...pages, page],
    elements: [
      ...elements,
      { ...base, id: `el-${stamp}-rc-h`, name: 'عنوان', type: 'heading', y: 50, width: 1280, height: 50, content: 'سلة الحجز', styles: { fontSize: typeSize(34), fontWeight: 'bold', color: '#121316', textAlign: 'center' } } as unknown as CanvasElement,
      { ...base, id: `el-${stamp}-rc`, name: 'سلة الحجز', type: 'cart', x: 190, y: 130, width: 900, height: 1080, styles: { color: accent } } as unknown as CanvasElement,
    ],
  };
};

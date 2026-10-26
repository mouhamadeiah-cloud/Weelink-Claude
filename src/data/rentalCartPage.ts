// A rental's cart page (Eyad, 26 Oct): «السلة» built like the shop's: the cart summary on the right and the booking card on
// the left, two elements ('cart' and 'checkout') that in a rental book what the visitor added (rental/RentalCartParts.tsx).
// New rentals get it with the template; rentals made before it get it once, and the first version (one 'cart' element) is split.
import type { CanvasElement, Page } from '../types';
import { typeSize } from './pageLooks';

export const RENTAL_CART_PAGE = 'rental-page-cart';
const SLIDE = 'rental-cart-slide';
const ACCENT = '#C8102E';
const INK = '#121316';
const SLIDE_HEIGHT = 1180;
const SUMMARY = { x: 650, y: 140, width: 540, height: 960 };
const FORM = { x: 90, y: 140, width: 530, height: 960 };
const cardStyles = { color: INK, backgroundColor: '#FFFFFF', borderRadius: 24, borderColor: 'rgba(18,19,22,0.08)', borderWidth: 1 };

const hasCart = (pages: Page[], elements: CanvasElement[]) => {
  const slideIds = new Set(pages.flatMap((p) => p.slides.map((s) => s.id)));
  return elements.some((e) => e.type === 'cart' && slideIds.has(e.slideId));
};

const checkout = (slideId: string, id: string): CanvasElement =>
  ({ id, name: 'بطاقة الحجز', type: 'checkout', ...FORM, content: '', slideId, styles: cardStyles, shopAccent: ACCENT }) as unknown as CanvasElement;

/**
 * The page with its heading, summary and booking card for a rental that has no cart; a cart made as one element is split into the two.
 * Null when the rental already has the page as it should be (or has no page to copy the navbar from).
 */
export const withRentalCart = (pages: Page[], elements: CanvasElement[], stamp: number): { pages: Page[]; elements: CanvasElement[] } | null => {
  if (!pages[0]) return null;
  const old = elements.find((e) => e.type === 'cart' && !e.cartSplit && e.slideId === SLIDE);
  if (old) {
    return {
      pages: pages.map((p) => ({ ...p, slides: p.slides.map((s) => (s.id === SLIDE ? { ...s, height: SLIDE_HEIGHT } : s)) })),
      elements: [
        ...elements.map((e) => (e.id === old.id ? { ...e, ...SUMMARY, styles: cardStyles, cartSplit: true, shopAccent: ACCENT } : e)),
        ...(elements.some((e) => e.type === 'checkout' && e.slideId === SLIDE) ? [] : [checkout(SLIDE, `el-${stamp}-rc-f`)]),
      ],
    };
  }
  if (hasCart(pages, elements) || pages.some((p) => p.id === RENTAL_CART_PAGE)) return null;
  const page: Page = { ...pages[0], id: RENTAL_CART_PAGE, name: 'السلة', slug: '/cart', slides: [{ id: SLIDE, name: 'السلة', height: SLIDE_HEIGHT, backgroundColor: '#FFFFFF', dividerShape: 'straight' }] };
  return {
    pages: [...pages, page],
    elements: [
      ...elements,
      { id: `el-${stamp}-rc-h`, name: 'عنوان', type: 'heading', x: 0, y: 50, width: 1280, height: 50, content: 'سلة الحجز', slideId: SLIDE, styles: { fontSize: typeSize(34), fontWeight: 'bold', color: INK, textAlign: 'center' } } as unknown as CanvasElement,
      { id: `el-${stamp}-rc`, name: 'سلة الحجز', type: 'cart', ...SUMMARY, content: '', slideId: SLIDE, styles: cardStyles, cartSplit: true, shopAccent: ACCENT } as unknown as CanvasElement,
      checkout(SLIDE, `el-${stamp}-rc-f`),
    ],
  };
};

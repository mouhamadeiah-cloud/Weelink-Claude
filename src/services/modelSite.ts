// The site «ابن صفحتي» builds: exactly the pages of the page model, in its order and under its names (Eyad, 29 Oct: the model is the
// only source, no page or slide of the old ready-made sites stays). Every page starts empty and is built from its sections; the cart is
// the one page the system draws itself (locked, in the model's place for it).
import type { CanvasElement, Page } from '../types';
import type { ProjectType } from '../components/shop/shopTypes';
import type { PageRole } from '../data/pageModels';
import { getRestaurantTemplate, REST_PAGE_IDS } from '../data/restaurantTemplate';
import { getOnlineShopTemplate } from '../data/onlineShopTemplate';
import { CAR_PAGE_IDS } from '../data/carShowroomTemplate';
import { RENTAL_CART_PAGE, withRentalCart } from '../data/rentalCartPage';

/** A page of the model as the server names it: its id, name, and what it is to a store. */
export interface SitePage { id: string; name: string; system?: 'cart'; role?: PageRole }

// The id a page takes by its role: the editor's own slides of a menu, a shop or a showroom open these pages (their «شوف المنيو»,
// «كل المنتجات», «كل السيارات» buttons), so the page of the model that shows the live list answers them.
const ROLE_IDS: Partial<Record<PageRole, string>> = { menu: REST_PAGE_IDS.menu, products: 'shop-page-products', cars: CAR_PAGE_IDS.showroom, contact: 'page-contact' };
const CART_IDS: Partial<Record<ProjectType, string>> = { restaurant: REST_PAGE_IDS.cart, shop: 'shop-page-cart', rental: RENTAL_CART_PAGE, hotel: RENTAL_CART_PAGE };

/** The system's cart page of a site (its slides and elements), with the site's navbar. Null for a site with no cart. */
export const cartPage = (project: ProjectType, navbar: Page['navbar'], stamp: number): { page: Page; elements: CanvasElement[] } | null => {
  const id = CART_IDS[project];
  if (!id) return null;
  if (project === 'rental' || project === 'hotel') {
    const base: Page = { id: 'page-base', name: '', slug: '/', navbar, slides: [] };
    const added = withRentalCart([base], [], stamp);
    const page = added?.pages.find((p) => p.id === id);
    return page && added ? { page: { ...page, navbar }, elements: added.elements } : null;
  }
  const t = project === 'restaurant' ? getRestaurantTemplate() : getOnlineShopTemplate({ liveProducts: true });
  const page = t.pages.find((p) => p.id === id);
  if (!page) return null;
  const slides = new Set(page.slides.map((s) => s.id));
  return { page: { ...page, navbar }, elements: t.elements.filter((e) => slides.has(e.slideId)) };
};

/**
 * The empty site of the model: one page for each of its pages, each with one blank slide to be built into, and the cart drawn. A page
 * with a role takes that role's id (the links of the editor's own slides find it); the first page is the site's home.
 */
export const modelSkeleton = (project: ProjectType, site: SitePage[], navbar: Page['navbar'], stamp: number) => {
  const pages: Page[] = [];
  let elements: CanvasElement[] = [];
  const used = new Set<string>();
  let cartId: string | undefined;
  site.forEach((m, i) => {
    if (m.system === 'cart') {
      const cart = cartPage(project, navbar, stamp);
      if (cart && !used.has(cart.page.id)) {
        used.add(cart.page.id);
        cartId = cart.page.id;
        pages.push({ ...cart.page, name: m.name || cart.page.name });
        elements = [...elements, ...cart.elements];
      }
      return;
    }
    const byRole = m.role ? ROLE_IDS[m.role] : undefined;
    const id = byRole && !used.has(byRole) ? byRole : `page-ai-${stamp.toString(36)}-${i}`;
    used.add(id);
    pages.push({ id, name: m.name, slug: pages.length ? `/${id}` : '/', navbar, slides: [{ id: `${id}-blank`, name: 'شريحة فارغة', height: 560, backgroundColor: '#ffffff' }] });
  });
  return { pages, elements, cartId };
};

// The editor's own ready slides of the categories that show live data: the search bars, the featured cards and the shop's, showroom's
// and menu's slides. The page model picks among them as among the admin's (Eyad, 29 Oct: one engine, the model the only source): each
// has an id (`code:{category}:{index}`), the admin ticks the ones a section may use, and the builder takes the first that fits the site.
import { FIXED_READY_CATEGORIES } from './readyCategories';
import { getSlideTemplatePayload, readySlideKinds, slideTemplateCount } from './slideTemplates';
import { autoSlots } from './autoSlots';
import { slideEligibility } from './aiSlots';
import type { SiteKind } from './siteKinds';

export const CODE_CATEGORIES = FIXED_READY_CATEGORIES;
export const isCodeSlide = (id: string) => id.startsWith('code:');

// The live lists a store's main section shows, and the carts.
const LIST_TYPES = ['shopProducts', 'carListings', 'menuList'];
const CART_TYPES = ['cart', 'checkout', 'menuCart'];

/**
 * What a slide is in its category: `main` shows the live list (the menu, the products, the cars), `front` opens the page (a title and no
 * list or cart), `other` is any other (a running text, a cart, why us…).
 */
export type SlideRole = 'front' | 'main' | 'other';
export const roleOf = (elements: { type: string; aiSlot?: string }[]): SlideRole => {
  if (elements.some((e) => LIST_TYPES.includes(e.type))) return 'main';
  if (elements.some((e) => CART_TYPES.includes(e.type))) return 'other';
  return elements.some((e) => e.aiSlot === 'title') ? 'front' : 'other';
};

export interface CodeSlide {
  id: string;
  category: string;
  name: string;
  eligible: boolean;
  role: SlideRole;
  kinds?: SiteKind[]; // a search or featured slide is for these sites only
}

const payloadOf = (category: string, index: number) => getSlideTemplatePayload(category, index, '') as Record<string, any> & { elements: any[] };

const lists = new Map<string, CodeSlide[]>();
/** A code category's slides in the editor's order. */
export const codeSlides = (category: string): CodeSlide[] => {
  if (!CODE_CATEGORIES.includes(category)) return [];
  if (!lists.has(category)) {
    lists.set(category, Array.from({ length: slideTemplateCount(category) }, (_, index) => {
      const p = payloadOf(category, index);
      const elements = autoSlots(p.elements);
      const kinds = readySlideKinds(category, index);
      return { id: `code:${category}:${index}`, category, name: String(p.name || ''), eligible: slideEligibility(elements).eligible, role: roleOf(elements), ...(kinds ? { kinds } : {}) };
    }));
  }
  return lists.get(category)!;
};

/** A code slide as the builder takes it (the slide and its elements), or null for an id that is not one. */
export const codeSlide = (id: string): { slide: Record<string, any>; elements: any[]; name: string } | null => {
  const m = /^code:([a-z_]+):(\d{1,3})$/.exec(id);
  if (!m || !CODE_CATEGORIES.includes(m[1]) || +m[2] >= slideTemplateCount(m[1])) return null;
  const { elements, ...slide } = JSON.parse(JSON.stringify(payloadOf(m[1], +m[2])));
  return { slide, elements: autoSlots(elements), name: String(slide.name || '') };
};

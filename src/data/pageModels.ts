// The models of a page («النماذج», docs/READY_SLIDES_PLAN.md step 4): for each kind of page the sections it is made of, in order.
// A section names a ready-slide category; the builder takes the first of that category's slides that fits it (in the admin's order, among
// the ones he ticked for it) and the AI writes its texts. The model is the only source of the site (Eyad, 29 Oct).
// The free page is the base every other model starts from. These are the defaults; the admin's changes (pageModels/{id}) replace them.
import { READY_SLIDE_CATEGORIES } from './readyCategories';

// always: in every page of this model · if: only when the owner gave what it needs · ask: the owner ticks it in the questions
export type SectionMode = 'always' | 'if' | 'ask';
export type SectionNeed = 'services' | 'priced' | 'photos';
export const SECTION_MODES: SectionMode[] = ['always', 'if', 'ask'];
export const SECTION_NEEDS: SectionNeed[] = ['services', 'priced', 'photos'];

export interface ModelSection {
  id: string; // `${category}` or `${category}:${part}`, unique inside a model
  category: string; // a ready-slide category (or 'ratings', the browser's own box)
  part?: 'front' | 'main' | 'priceList'; // inside the shop, showroom and menu categories: their front slide, or their live section
  mode: SectionMode;
  need?: SectionNeed; // with mode 'if'
  defaultOn?: boolean; // with mode 'ask': ticked from the start
  slides?: string[]; // the ready slides this section may use (readySlides ids, `code:…` for the editor's own); none listed = any that fits
}

// A page of the site a model builds: its name (the navbar link) and its sections. `sections` of a model is its first page, the one the
// builder still builds alone; `pages` is what the admin shapes (a model saved before pages existed is one page, «الرئيسية»).
// A system page is part of the model but not built from it: its place is in the model and nothing in it can be changed (the cart of a
// restaurant, shop, rental or hotel; Eyad, 28 Oct: the model is the only source of the site, the cart the one fixed exception).
export type SystemPage = 'cart';
export interface ModelPage { id: string; name: string; sections: ModelSection[]; system?: SystemPage }
export interface PageModel { id: string; name: string; sections: ModelSection[]; pages?: ModelPage[] }

// The sites the slides of a store's category are for: a showroom's are cars (sold or rented), a shop's are things (sold, rented, or the
// rooms and halls of a stay), a restaurant's its menu. A model may hold both a showroom's and a shop's sections (a rental model, for the
// rentals of cars and of things): each site is built from the ones of its own kind only (Eyad, 29 Oct: no section is swapped by the code).
const CATEGORY_KINDS: Record<string, string[]> = { cars: ['cars', 'rental-cars'], shop: ['shop', 'rental-items', 'hotel'], restaurant: ['restaurant'] };
/** Whether a section of the model is built (and asked about) for this kind of site. */
export const fitsKind = (s: Pick<ModelSection, 'category'>, kind: string | undefined) => !kind || !CATEGORY_KINDS[s.category] || CATEGORY_KINDS[s.category].includes(kind);
/** The model's pages with only the sections for this kind of site. */
export const pagesForKind = <P extends Pick<ModelPage, 'sections'>>(pages: P[], kind: string | undefined): P[] => pages.map((p) => ({ ...p, sections: p.sections.filter((s) => fitsKind(s, kind)) }));

/** What a page of the model is to the store it is built in: its cart, the page of its live list (menu, products, cars), or its contact page. */
export type PageRole = 'cart' | 'menu' | 'products' | 'cars' | 'contact';
const LIVE_ROLE: Record<string, PageRole> = { restaurant: 'menu', shop: 'products', cars: 'cars' };
export const pageRole = (p: Pick<ModelPage, 'name' | 'sections' | 'system'>, kind?: string): PageRole | undefined => {
  if (p.system === 'cart') return 'cart';
  const live = p.sections.find((s) => s.part === 'main' && LIVE_ROLE[s.category] && fitsKind(s, kind));
  if (live) return LIVE_ROLE[live.category];
  if (/^\s*(تواصل معنا|تواصل|اتصل بنا)\s*$/.test(p.name) || (p.sections.some((s) => s.category === 'contact') && p.sections.every((s) => s.category === 'contact' || s.category === 'privacy'))) return 'contact';
  return undefined;
};

// Categories a model may use besides the editor's ready-slide categories.
export const EXTRA_MODEL_CATEGORIES = [{ id: 'ratings', name: 'التقييمات' }];
export const MODEL_CATEGORIES = [...READY_SLIDE_CATEGORIES.map((c) => ({ id: c.id, name: c.name })), ...EXTRA_MODEL_CATEGORIES];
export const MAX_MODEL_SECTIONS = 24;
export const MAX_MODEL_PAGES = 12;
export const MAIN_PAGE_NAME = 'الرئيسية';

export const PART_LABEL: Record<string, string> = { front: 'الواجهة', main: 'القسم الحي', priceList: 'قائمة الأسعار' };
/** A section's name, as the admin, the AI and the build's report read it. */
export const sectionName = (s: Pick<ModelSection, 'category' | 'part'>) => `${MODEL_CATEGORIES.find((c) => c.id === s.category)?.name || s.category}${s.part ? ` · ${PART_LABEL[s.part]}` : ''}`;
/** The section that opens a page: it takes the page's name as its title and the owner's big photo. */
export const opensPage = (sectionId: string) => sectionId === 'intro' || sectionId.endsWith(':front');

/** What the builder knows of a ready slide to say if it can build a section: its role in a store's category, the sites it is for. */
export interface SlideFit { id: string; role?: 'front' | 'main' | 'other'; kinds?: string[] }
/** A front or live (main) part takes only a slide of that role; a search or featured slide is only for its sites. */
export const slideFits = (slide: SlideFit, section: Pick<ModelSection, 'part'>, kinds?: string[]) =>
  ((section.part !== 'front' && section.part !== 'main') || !slide.role || slide.role === section.part) && (!slide.kinds || !kinds || slide.kinds.some((k) => kinds.includes(k)));

const sec = (category: string, mode: SectionMode, o: Partial<ModelSection> = {}): ModelSection => ({ id: o.part ? `${category}:${o.part}` : category, category, mode, ...o });

const intro = sec('intro', 'always');
const about = sec('about', 'always');
const services = sec('services', 'if', { need: 'services' });
const prices = sec('prices', 'if', { need: 'priced' });
const gallery = sec('gallery', 'if', { need: 'photos' });
const features = sec('features', 'ask');
const ratings = sec('ratings', 'ask');
const contact = sec('contact', 'always');
const privacy = sec('privacy', 'ask', { defaultOn: true });
const booking = sec('booking', 'ask');
const team = sec('team', 'ask');
const projects = sec('projects', 'ask');
const video = sec('video', 'ask');

// The free page: the base of all.
const FREE = [intro, about, services, prices, gallery, features, ratings, contact, privacy];
// A free restaurant, shop or showroom: the base with the type's front slide and a price list the owner types by hand (no live items).
// A rental has both the showroom's slides (a rental of cars) and the shop's (a rental of things; fitsKind keeps the site's own), a hotel
// the shop's (its cards are the room types).
type ModelType = 'restaurant' | 'shop' | 'cars' | 'rental' | 'hotel';
const SLIDES_OF: Record<ModelType, ('restaurant' | 'shop' | 'cars')[]> = { restaurant: ['restaurant'], shop: ['shop'], cars: ['cars'], rental: ['cars', 'shop'], hotel: ['shop'] };
const fronts = (kind: ModelType) => SLIDES_OF[kind].map((type) => sec(type, 'always', { part: 'front' }));
const mains = (kind: ModelType) => SLIDES_OF[kind].map((type) => sec(type, 'always', { part: 'main' }));
const freeOf = (kind: ModelType) => [...fronts(kind), about, sec('table', 'always', { part: 'priceList' }), gallery, features, ratings, contact, privacy];
// A paid one: the front slide and the live section of its type.
const paidOf = (kind: ModelType) => [...fronts(kind), ...mains(kind), about, gallery, features, ratings, contact, privacy];
const proOf = (kind: ModelType) => [...fronts(kind), ...mains(kind), about, gallery, features, team, video, ratings, contact, privacy];

export const DEFAULT_MODELS: PageModel[] = [
  { id: 'page-free', name: 'تعريفية مجانية', sections: FREE },
  { id: 'page-pro', name: 'تعريفية برو', sections: [intro, about, services, prices, gallery, features, team, projects, video, booking, ratings, contact, privacy] },
  { id: 'restaurant-free', name: 'مطعم مجاني', sections: freeOf('restaurant') },
  { id: 'restaurant', name: 'مطعم 30 و60', sections: paidOf('restaurant') },
  { id: 'restaurant-pro', name: 'مطعم برو', sections: proOf('restaurant') },
  { id: 'shop-free', name: 'متجر مجاني', sections: freeOf('shop') },
  { id: 'shop', name: 'متجر 30 و60', sections: paidOf('shop') },
  { id: 'shop-pro', name: 'متجر برو', sections: proOf('shop') },
  { id: 'cars-free', name: 'سيارات مجاني', sections: freeOf('cars') },
  { id: 'cars', name: 'سيارات 30 و60', sections: paidOf('cars') },
  { id: 'cars-pro', name: 'سيارات برو', sections: proOf('cars') },
  { id: 'rental-free', name: 'تأجير مجاني', sections: freeOf('rental') },
  { id: 'rental', name: 'تأجير 30 و60', sections: paidOf('rental') },
  { id: 'rental-pro', name: 'تأجير برو', sections: proOf('rental') },
  { id: 'hotel-free', name: 'فنادق ومساحات مجاني', sections: freeOf('hotel') },
  { id: 'hotel', name: 'فنادق ومساحات 30 و60', sections: paidOf('hotel') },
  { id: 'hotel-pro', name: 'فنادق ومساحات برو', sections: proOf('hotel') },
];

export const MODEL_IDS = DEFAULT_MODELS.map((m) => m.id);

// The sites that sell or rent through a cart (the paid restaurant, shop, rental and hotel ones): their model holds the locked cart page.
export const CART_MODELS = ['restaurant', 'restaurant-pro', 'shop', 'shop-pro', 'rental', 'rental-pro', 'hotel', 'hotel-pro'];
export const SYSTEM_PAGES: Record<SystemPage, { name: string; note: string }> = {
  cart: { name: 'السلة', note: 'صفحة السلة وإتمام الطلب ثابتة من النظام: ما بتنبني بالذكاء ولا تتعدّل، بس فيك تغيّر مكانها بين الصفحات.' },
};

/** The pages of a model with its system pages as they must be: the cart in a cart model (added at the end when missing, never first), none elsewhere. */
export const withSystemPages = (modelId: string, pages: ModelPage[]): ModelPage[] => {
  const content = pages.filter((p) => !p.system);
  if (!CART_MODELS.includes(modelId)) return content;
  const at = pages.findIndex((p) => p.system === 'cart');
  const cart: ModelPage = { id: 'cart', name: SYSTEM_PAGES.cart.name, sections: [], system: 'cart' };
  if (at <= 0) return [...content, cart];
  return pages.filter((p) => !p.system || p.system === 'cart').map((p) => (p.system ? cart : p));
};

/**
 * What stops a model from being saved: a page with no section, or a section with no ready slide to be built from. `eligible` lists a
 * category's slides that are ready to build with; `kinds` are the sites the model builds (a search or featured slide must be for one).
 */
export interface ModelProblem { page: string; section?: string; why: string }
export const modelProblems = (pages: ModelPage[], eligible: (category: string) => SlideFit[], kinds?: string[]): ModelProblem[] => {
  const out: ModelProblem[] = [];
  for (const p of pages) {
    if (p.system) continue;
    if (!p.sections.length) out.push({ page: p.id, why: 'الصفحة فارغة: أضف لها قسماً واحداً على الأقل.' });
    for (const s of p.sections) {
      // The ratings box is the browser's own: it has no ready slide.
      if (s.category === 'ratings') continue;
      const all = eligible(s.category).filter((x) => slideFits(x, s, kinds)).map((x) => x.id);
      const allowed = s.slides?.length ? all.filter((id) => s.slides!.includes(id)) : all;
      if (!allowed.length) out.push({ page: p.id, section: s.id, why: all.length ? 'ولا شريحة من المعلَّمة صالحة للبناء.' : 'لا شريحة جاهزة صالحة في تصنيفه لهذا النوع من المواقع. أضف واحدة من «الشرائح الجاهزة».' });
    }
  }
  return out;
};

// The model a package builds from: 30 and 60 share one (they differ only in limits).
export const modelOf = (planId: string): string => {
  if (planId === 'page-pro') return 'page-pro';
  const [type, tier] = planId.split('-');
  if (!['restaurant', 'shop', 'cars', 'rental', 'hotel'].includes(type)) return 'page-free';
  return tier === 'free' ? `${type}-free` : tier === 'pro' ? `${type}-pro` : type;
};

// A model as saved by the admin, cleaned: unknown categories, modes and needs are dropped; duplicates keep the first.
export const cleanSections = (raw: unknown): ModelSection[] | null => {
  if (!Array.isArray(raw)) return null;
  const known = new Set(MODEL_CATEGORIES.map((c) => c.id));
  const seen = new Set<string>();
  const out: ModelSection[] = [];
  for (const r of raw.slice(0, MAX_MODEL_SECTIONS)) {
    const category = String(r?.category || '');
    const part = r?.part === 'front' || r?.part === 'main' || r?.part === 'priceList' ? r.part : undefined;
    const mode = SECTION_MODES.includes(r?.mode) ? (r.mode as SectionMode) : null;
    const slides = Array.isArray(r?.slides) ? [...new Set<string>(r.slides.map((x: unknown) => String(x).slice(0, 128)).filter(Boolean))].slice(0, 200) : [];
    if (!known.has(category) || !mode) continue;
    const s = sec(category, mode, {
      ...(part ? { part } : {}),
      ...(mode === 'if' ? { need: SECTION_NEEDS.includes(r?.need) ? (r.need as SectionNeed) : 'services' } : {}),
      ...(mode === 'ask' && r?.defaultOn === true ? { defaultOn: true } : {}),
      ...(slides.length ? { slides } : {}),
    });
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    out.push(s);
  }
  return out.length ? out : null;
};

/** The pages of a model: its saved pages, or the sections as one page. */
export const pagesOf = (m: Pick<PageModel, 'sections' | 'pages'> & { id?: string }): ModelPage[] => {
  const pages = m.pages?.length ? m.pages : [{ id: 'home', name: MAIN_PAGE_NAME, sections: m.sections }];
  return m.id ? withSystemPages(m.id, pages) : pages;
};

// Pages as saved by the admin, cleaned: each page has a name and its cleaned sections; a page with no section is dropped, ids are made unique.
export const cleanPages = (raw: unknown): ModelPage[] | null => {
  if (!Array.isArray(raw)) return null;
  const used = new Set<string>();
  const out: ModelPage[] = [];
  for (const r of raw.slice(0, MAX_MODEL_PAGES + 1)) {
    if (r?.system === 'cart') {
      if (!used.has('cart')) out.push({ id: 'cart', name: SYSTEM_PAGES.cart.name, sections: [], system: 'cart' });
      used.add('cart');
      continue;
    }
    const sections = cleanSections(r?.sections);
    if (!sections) continue;
    let id = String(r?.id || '').replace(/[^\w-]/g, '').slice(0, 24) || `p${out.length + 1}`;
    while (used.has(id)) id += 'x';
    used.add(id);
    out.push({ id, name: String(r?.name || '').trim().slice(0, 40) || (out.length ? `صفحة ${out.length + 1}` : MAIN_PAGE_NAME), sections });
  }
  return out.some((p) => !p.system) ? out : null;
};

// The models of a page («النماذج», docs/READY_SLIDES_PLAN.md step 4): for each kind of page the sections it is made of, in order.
// A section names a ready-slide category; the builder (step 4c) picks one of that category's slides at random and the AI writes its texts.
// The free page is the base every other model starts from. These are the defaults; the admin's changes (pageModels/{id}) replace them.
import { READY_SLIDE_CATEGORIES } from './readyCategories';

// always: in every page of this model · if: only when the owner gave what it needs · ask: the owner ticks it in the questions
export type SectionMode = 'always' | 'if' | 'ask';
export type SectionNeed = 'services' | 'priced' | 'photos';
export const SECTION_MODES: SectionMode[] = ['always', 'if', 'ask'];
export const SECTION_NEEDS: SectionNeed[] = ['services', 'priced', 'photos'];

export interface ModelSection {
  id: string; // `${category}` or `${category}:${part}`, unique inside a model
  category: string; // a ready-slide category (or 'ratings', whose slides come later)
  part?: 'front' | 'main' | 'priceList'; // inside the shop, showroom and menu categories: their front slide, or their live section
  mode: SectionMode;
  need?: SectionNeed; // with mode 'if'
  defaultOn?: boolean; // with mode 'ask': ticked from the start
  slides?: string[]; // the ready slides (readySlides ids) this section may use; none listed = any slide of its category
}

// A page of the site a model builds: its name (the navbar link) and its sections. `sections` of a model is its first page, the one the
// builder still builds alone; `pages` is what the admin shapes (a model saved before pages existed is one page, «الرئيسية»).
export interface ModelPage { id: string; name: string; sections: ModelSection[] }
export interface PageModel { id: string; name: string; sections: ModelSection[]; pages?: ModelPage[] }

// Categories a model may use besides the editor's ready-slide categories.
export const EXTRA_MODEL_CATEGORIES = [{ id: 'ratings', name: 'التقييمات' }];
export const MODEL_CATEGORIES = [...READY_SLIDE_CATEGORIES.map((c) => ({ id: c.id, name: c.name })), ...EXTRA_MODEL_CATEGORIES];
export const MAX_MODEL_SECTIONS = 24;
export const MAX_MODEL_PAGES = 12;
export const MAIN_PAGE_NAME = 'الرئيسية';

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
// A rental builds from the showroom's slides (its cards are the units for rent) and a hotel from the shop's (its cards are the room types).
type ModelType = 'restaurant' | 'shop' | 'cars' | 'rental' | 'hotel';
const SLIDES_OF: Record<ModelType, 'restaurant' | 'shop' | 'cars'> = { restaurant: 'restaurant', shop: 'shop', cars: 'cars', rental: 'cars', hotel: 'shop' };
const freeOf = (kind: ModelType) => { const type = SLIDES_OF[kind]; return [sec(type, 'always', { part: 'front' }), about, sec('table', 'always', { part: 'priceList' }), gallery, features, ratings, contact, privacy]; };
// A paid one: the front slide and the live section of its type.
const paidOf = (kind: ModelType) => { const type = SLIDES_OF[kind]; return [sec(type, 'always', { part: 'front' }), sec(type, 'always', { part: 'main' }), about, gallery, features, ratings, contact, privacy]; };
const proOf = (kind: ModelType) => { const type = SLIDES_OF[kind]; return [sec(type, 'always', { part: 'front' }), sec(type, 'always', { part: 'main' }), about, gallery, features, team, video, ratings, contact, privacy]; };

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
export const pagesOf = (m: Pick<PageModel, 'sections' | 'pages'>): ModelPage[] => (m.pages?.length ? m.pages : [{ id: 'home', name: MAIN_PAGE_NAME, sections: m.sections }]);

// Pages as saved by the admin, cleaned: each page has a name and its cleaned sections; a page with no section is dropped, ids are made unique.
export const cleanPages = (raw: unknown): ModelPage[] | null => {
  if (!Array.isArray(raw)) return null;
  const used = new Set<string>();
  const out: ModelPage[] = [];
  for (const r of raw.slice(0, MAX_MODEL_PAGES)) {
    const sections = cleanSections(r?.sections);
    if (!sections) continue;
    let id = String(r?.id || '').replace(/[^\w-]/g, '').slice(0, 24) || `p${out.length + 1}`;
    while (used.has(id)) id += 'x';
    used.add(id);
    out.push({ id, name: String(r?.name || '').trim().slice(0, 40) || (out.length ? `صفحة ${out.length + 1}` : MAIN_PAGE_NAME), sections });
  }
  return out.length ? out : null;
};

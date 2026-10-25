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
}

export interface PageModel { id: string; name: string; sections: ModelSection[] }

// Categories a model may use besides the editor's ready-slide categories.
export const EXTRA_MODEL_CATEGORIES = [{ id: 'ratings', name: 'التقييمات' }];
export const MODEL_CATEGORIES = [...READY_SLIDE_CATEGORIES.map((c) => ({ id: c.id, name: c.name })), ...EXTRA_MODEL_CATEGORIES];
export const MAX_MODEL_SECTIONS = 24;

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
const freeOf = (type: 'restaurant' | 'shop' | 'cars') => [sec(type, 'always', { part: 'front' }), about, sec('table', 'always', { part: 'priceList' }), gallery, features, ratings, contact, privacy];
// A paid one: the front slide and the live section of its type.
const paidOf = (type: 'restaurant' | 'shop' | 'cars') => [sec(type, 'always', { part: 'front' }), sec(type, 'always', { part: 'main' }), about, gallery, features, ratings, contact, privacy];
const proOf = (type: 'restaurant' | 'shop' | 'cars') => [sec(type, 'always', { part: 'front' }), sec(type, 'always', { part: 'main' }), about, gallery, features, team, video, ratings, contact, privacy];

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
];

export const MODEL_IDS = DEFAULT_MODELS.map((m) => m.id);

// The model a package builds from: 30 and 60 share one (they differ only in limits).
export const modelOf = (planId: string): string => {
  if (planId === 'page-pro') return 'page-pro';
  const [type, tier] = planId.split('-');
  if (!['restaurant', 'shop', 'cars'].includes(type)) return 'page-free';
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
    if (!known.has(category) || !mode) continue;
    const s = sec(category, mode, {
      ...(part ? { part } : {}),
      ...(mode === 'if' ? { need: SECTION_NEEDS.includes(r?.need) ? (r.need as SectionNeed) : 'services' } : {}),
      ...(mode === 'ask' && r?.defaultOn === true ? { defaultOn: true } : {}),
    });
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    out.push(s);
  }
  return out.length ? out : null;
};

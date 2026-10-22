// «ابن صفحتي», the new way (docs/READY_SLIDES_PLAN.md step 4c): the server, not the AI, decides which sections a page has and which ready
// slide each one uses. The sections come from the page's model (src/data/pageModels.ts), narrowed by what the owner gave (services,
// prices, photos) and ticked; each section takes a slide at random from the slides of its category, the code's own and the gallery's
// that the admin keeps as ready slides (server/readySlides.ts). The AI then only writes the texts of these slides.
import { describe } from '../src/data/aiSlots.js';
import { MODEL_CATEGORIES, type ModelSection } from '../src/data/pageModels.js';
import { FIXED_READY_CATEGORIES } from '../src/data/readyCategories.js';
import { readyPool } from './readySlides.js';

export interface TemplateSpec { name: string; slots: Record<string, { kind: 'text' | 'button' | 'image'; max?: number }>; lists: Record<string, { count: number; fields: Record<string, number | 'icon'> }> }
export interface CodeSection { id: string; name: string; required: boolean; place: 'first' | 'last' | 'any'; templates: string[] }
export interface GallerySlideData { slide: any; elements: any[]; name: string }
export interface GalleryPool {
  ids: (category: string) => string[];
  useGallery: (category: string) => boolean;
  load: (id: string) => Promise<GallerySlideData | null>;
}

export interface OwnerFacts { services: boolean; priced: boolean; photos: boolean; ticked?: string[] }

/** The sections of a model this owner gets: «دائماً» always, «إذا توفّر» when the owner gave what it needs, «يختاره الزبون» when ticked. */
export const sectionsFor = (model: ModelSection[], o: OwnerFacts): ModelSection[] =>
  model.filter((s) => (s.mode === 'always' ? true : s.mode === 'if' ? !!o[s.need || 'services'] : o.ticked ? o.ticked.includes(s.id) : !!s.defaultOn));

/** The name the plan and the builder know a model section by (the code's ready-slide sections have their own ids). */
export const planSectionId = (s: ModelSection) => (s.part === 'front' ? 'intro' : s.part === 'main' ? 'featured' : s.category === 'features' ? 'why' : s.category);

const placeOf = (id: string, index: number): CodeSection['place'] => (index === 0 ? 'first' : id === 'contact' || id === 'privacy' ? 'last' : 'any');
const nameOf = (s: ModelSection) => MODEL_CATEGORIES.find((c) => c.id === s.category)?.name || s.category;

// How many photos a gallery slide holds: its photo frames, or what the photo-gallery block takes.
export const photoCapacity = (template: string, spec?: TemplateSpec) => {
  // The photo-gallery block takes up to fifteen (the package's gallery cuts the owner's list); frames hold what they have.
  if (/^gallery\.block\d+$/.test(template)) return 15;
  return Object.keys(spec?.slots || {}).filter((k) => /^photos\.\d+$/.test(k)).length;
};

const shuffled = <T,>(list: T[], rng: () => number) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export interface Picked {
  pool: CodeSection[]; // one section per model section, each with the one template chosen
  templates: Record<string, TemplateSpec>; // the specs of the gallery slides chosen (keys `g:{id}`)
  extra: Record<string, GallerySlideData>; // their slides, for the browser to build from
}

/** One ready slide for each section, at random; a slide used in the owner's last build is left for last. */
export const pickSections = async (o: { sections: ModelSection[]; codeSections: CodeSection[]; gallery: GalleryPool; rng?: () => number; avoid?: Set<string>; photos?: number; specs?: Record<string, TemplateSpec> }): Promise<Picked> => {
  const rng = o.rng || Math.random;
  const avoid = o.avoid || new Set<string>();
  const out: Picked = { pool: [], templates: {}, extra: {} };
  const taken = new Set<string>();
  for (const s of o.sections) {
    const id = planSectionId(s);
    if (out.pool.some((p) => p.id === id)) continue;
    const code = o.codeSections.find((c) => c.id === id);
    // The gallery section takes only slides that can hold all of the owner's photos (frames are fixed in number; the viewer slides hold 5 or 15).
    const holds = (template: string, spec?: TemplateSpec) => id !== 'gallery' || !o.photos || photoCapacity(template, spec || o.specs?.[template]) >= o.photos;
    const fromCode = (code?.templates || []).filter((t) => holds(t)).map((t) => ({ template: t }));
    const fromGallery = o.gallery.ids(s.category).map((g) => ({ template: `g:${g}`, gallery: g }));
    // A category switched to the gallery uses only gallery slides, while it has one the AI can fill.
    const order = (list: { template: string; gallery?: string }[]) => {
      const mix = shuffled(list.filter((c) => !taken.has(c.template)), rng);
      return [...mix.filter((c) => !avoid.has(c.template)), ...mix.filter((c) => avoid.has(c.template))];
    };
    const tries = o.gallery.useGallery(s.category) ? [order(fromGallery), order(fromCode)] : [order([...fromCode, ...fromGallery])];
    let chosen: { template: string; spec?: TemplateSpec; data?: GallerySlideData } | null = null;
    for (const list of tries) {
      for (const c of list) {
        if (!c.gallery) { chosen = { template: c.template }; break; }
        const data = await o.gallery.load(c.gallery);
        if (!data) continue;
        const spec = describe({ name: data.name, elements: data.elements, backgroundImage: data.slide?.backgroundImage, backgroundVideo: data.slide?.backgroundVideo }) as TemplateSpec;
        if (!holds(c.template, spec)) continue;
        chosen = { template: c.template, data, spec };
        break;
      }
      if (chosen) break;
    }
    if (!chosen) continue; // nothing to build this section from yet (e.g. the ratings)
    taken.add(chosen.template);
    if (chosen.data && chosen.spec) {
      out.templates[chosen.template] = chosen.spec;
      out.extra[chosen.template] = chosen.data;
    }
    out.pool.push({ id, name: code?.name || nameOf(s), required: s.mode === 'always', place: placeOf(id, out.pool.length), templates: [chosen.template] });
  }
  return out;
};

/** The pool over the database: the admin's ready slides by category (only those whose slots are complete), read when one is picked. */
export const galleryPool = async (db: { collection: (n: string) => any }): Promise<GalleryPool> => {
  const byCategory = await readyPool(db);
  return {
    // The fixed categories (shop, showroom, menu) read live data: only the code's slides are used.
    ids: (c) => (FIXED_READY_CATEGORIES.includes(c) ? [] : (byCategory.get(c) || []).sort((a, b) => a.order - b.order).map((r) => r.id)),
    useGallery: (c) => !FIXED_READY_CATEGORIES.includes(c) && (byCategory.get(c) || []).length > 0,
    load: async (id) => {
      const snap = await db.collection('readySlides').doc(id).get();
      const g = snap.exists ? snap.data() : null;
      if (!g || !g.slide || g.eligible !== true || !Array.isArray(g.elements)) return null;
      return { slide: g.slide, elements: g.elements, name: String(g.name || '') };
    },
  };
};

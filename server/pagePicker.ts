// «ابن صفحتي»: the server, not the AI, decides which sections a page has and which ready slide each one uses (Eyad, 29 Oct: the page
// model is the only source, one engine for every section). The sections come from the page's model (src/data/pageModels.ts), narrowed by
// what the owner gave (services, prices, photos) and ticked; each section takes the first slide of its category in the admin's order that
// fits it (the ones he allowed for it, when he chose some): the admin's ready slides, or the editor's own for the categories that show live
// data (search, featured, the shop's, showroom's and menu's), those only when made for the site's kind. Wee AI's questions are asked for the
// very slide that is built (src/data/slideParts.ts), and the AI then only fills in its parts (server/formBuild.ts).
import { describe } from '../src/data/aiSlots.js';
import { sectionName, slideFits, type ModelSection, type SlideFit } from '../src/data/pageModels.js';
import { CODE_CATEGORIES, codeSlide, codeSlides } from '../src/data/codeReady.js';
import type { SiteKind } from '../src/data/siteKinds.js';
import { readyPool } from './readySlides.js';

export interface GallerySlideData { slide: any; elements: any[]; name: string }
/** The ready slides of each category (eligible ones only, in order), and a slide by its id. */
export interface SlidePool {
  ids: (category: string) => SlideFit[];
  load: (id: string) => Promise<GallerySlideData | null>;
}

export interface OwnerFacts { services: boolean; priced: boolean; photos: boolean; ticked?: string[] }

/** The sections of a model this owner gets: «دائماً» always, «إذا توفّر» when the owner gave what it needs, «يختاره الزبون» when ticked. */
export const sectionsFor = (model: ModelSection[], o: OwnerFacts): ModelSection[] =>
  model.filter((s) => (s.mode === 'always' ? true : s.mode === 'if' ? !!o[s.need || 'services'] : o.ticked ? o.ticked.includes(s.id) : !!s.defaultOn));

// How many photos a slide holds: its photo frames, or what the photo-gallery element takes (the package's gallery cuts the owner's list).
export const photoCapacity = (data: GallerySlideData) => {
  if (data.elements.some((e) => e?.type === 'gallery')) return 15;
  const spec = describe({ name: data.name, elements: data.elements, backgroundImage: data.slide?.backgroundImage, backgroundVideo: data.slide?.backgroundVideo });
  return Object.keys(spec.slots).filter((k) => /^photos\.\d+$/.test(k)).length;
};

export interface PickedSection { id: string; name: string; template: string }
export interface Picked {
  pool: PickedSection[]; // one per model section that found its slide, in the model's order
  extra: Record<string, GallerySlideData>; // the slides, by template id (`g:{id}` the admin's, `code:…` the editor's own)
  skipped: string[]; // the names of the model's sections that found no slide: not built, and named in the report
}

/** One ready slide for each section: the first free one that fits, in the admin's order (never at random: the slide the questions were asked for is the one built). */
export const pickSections = async (o: { sections: ModelSection[]; pool: SlidePool; kind: SiteKind; photos?: number }): Promise<Picked> => {
  const out: Picked = { pool: [], extra: {}, skipped: [] };
  const taken = new Set<string>();
  for (const s of o.sections) {
    // The ratings box is drawn by the browser itself (it has no ready slide).
    if (s.category === 'ratings' || out.pool.some((p) => p.id === s.id)) continue;
    const fits = o.pool.ids(s.category).filter((x) => slideFits(x, s, [o.kind])).map((x) => x.id);
    // Slides the admin allowed for this section (the ones that still work); none left of them = the category as a whole.
    const allowed = s.slides?.length ? fits.filter((id) => s.slides!.includes(id)) : [];
    let chosen: { id: string; data: GallerySlideData } | null = null;
    for (const id of (allowed.length ? allowed : fits).filter((x) => !taken.has(x))) {
      const data = await o.pool.load(id);
      if (!data) continue;
      // The gallery takes only a slide that can hold all of the owner's photos.
      if (s.category === 'gallery' && o.photos && photoCapacity(data) < o.photos) continue;
      chosen = { id, data };
      break;
    }
    if (!chosen) {
      out.skipped.push(sectionName(s));
      continue;
    }
    taken.add(chosen.id);
    const template = chosen.id.startsWith('code:') ? chosen.id : `g:${chosen.id}`;
    out.extra[template] = chosen.data;
    out.pool.push({ id: s.id, name: sectionName(s), template });
  }
  return out;
};

/** The pool over the database: the admin's ready slides by category (only those whose slots are complete), and the editor's own. */
export const slidePool = async (db: { collection: (n: string) => any }): Promise<SlidePool> => {
  const byCategory = await readyPool(db);
  return {
    ids: (c) => (CODE_CATEGORIES.includes(c)
      ? codeSlides(c).filter((x) => x.eligible)
      : (byCategory.get(c) || []).sort((a, b) => a.order - b.order).map((r) => ({ id: r.id }))),
    load: async (id) => {
      if (id.startsWith('code:')) return codeSlide(id);
      const snap = await db.collection('readySlides').doc(id).get();
      const g = snap.exists ? snap.data() : null;
      if (!g || !g.slide || g.eligible !== true || !Array.isArray(g.elements)) return null;
      return { slide: g.slide, elements: g.elements, name: String(g.name || '') };
    },
  };
};

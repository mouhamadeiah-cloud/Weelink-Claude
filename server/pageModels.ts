// The models of a page, as the admin shaped them (pageModels/{id} = { sections }) over the defaults in src/data/pageModels.ts.
// Server only: the builder (api/build-page.ts) reads them; nothing in the browser does.
import { DEFAULT_MODELS, MODEL_IDS, PageModel, cleanPages, cleanSections, pagesOf } from '../src/data/pageModels.js';

type Db = { collection: (name: string) => any };

export const readModels = async (db: Db): Promise<(PageModel & { custom: boolean })[]> => {
  const snap = await db.collection('pageModels').get();
  const saved = new Map<string, any>(snap.docs.map((d: any) => [d.id, d.data()]));
  return DEFAULT_MODELS.map((m) => {
    const doc = saved.get(m.id);
    // A model saved before pages existed has only `sections`: it is one page.
    const pages = cleanPages(doc?.pages) || (cleanSections(doc?.sections) ? cleanPages([{ sections: doc.sections }]) : null);
    return pages ? { ...m, pages, sections: pages[0].sections, custom: true } : { ...m, pages: pagesOf(m), custom: false };
  });
};

// `raw` is the pages, or (older callers) one list of sections, saved as the single page «الرئيسية».
export const saveModel = async (db: Db, id: string, raw: unknown, by: string): Promise<{ ok: true; pages: NonNullable<PageModel['pages']> } | { error: 'bad_model' | 'bad_sections' }> => {
  if (!MODEL_IDS.includes(id)) return { error: 'bad_model' };
  const pages = cleanPages(Array.isArray(raw) && raw.some((r: any) => r && typeof r === 'object' && Array.isArray(r.sections)) ? raw : [{ sections: raw }]);
  if (!pages) return { error: 'bad_sections' };
  await db.collection('pageModels').doc(id).set({ pages, sections: pages[0].sections, changedAt: Date.now(), changedBy: by });
  return { ok: true, pages };
};

// Back to the default model.
export const resetModel = async (db: Db, id: string): Promise<{ ok: true } | { error: 'bad_model' }> => {
  if (!MODEL_IDS.includes(id)) return { error: 'bad_model' };
  const ref = db.collection('pageModels').doc(id);
  if ((await ref.get()).exists) await ref.delete();
  return { ok: true };
};

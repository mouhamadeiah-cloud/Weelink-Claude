// The models of a page, as the admin shaped them (pageModels/{id} = { sections }) over the defaults in src/data/pageModels.ts.
// Server only: the builder (api/build-page.ts) reads them; nothing in the browser does.
import { DEFAULT_MODELS, MODEL_IDS, PageModel, cleanSections } from '../src/data/pageModels.js';

type Db = { collection: (name: string) => any };

export const readModels = async (db: Db): Promise<(PageModel & { custom: boolean })[]> => {
  const snap = await db.collection('pageModels').get();
  const saved = new Map<string, any>(snap.docs.map((d: any) => [d.id, d.data()]));
  return DEFAULT_MODELS.map((m) => {
    const sections = cleanSections(saved.get(m.id)?.sections);
    return { ...m, sections: sections || m.sections, custom: !!sections };
  });
};

export const saveModel = async (db: Db, id: string, rawSections: unknown, by: string): Promise<{ ok: true; sections: PageModel['sections'] } | { error: 'bad_model' | 'bad_sections' }> => {
  if (!MODEL_IDS.includes(id)) return { error: 'bad_model' };
  const sections = cleanSections(rawSections);
  if (!sections) return { error: 'bad_sections' };
  await db.collection('pageModels').doc(id).set({ sections, changedAt: Date.now(), changedBy: by });
  return { ok: true, sections };
};

// Back to the default model.
export const resetModel = async (db: Db, id: string): Promise<{ ok: true } | { error: 'bad_model' }> => {
  if (!MODEL_IDS.includes(id)) return { error: 'bad_model' };
  const ref = db.collection('pageModels').doc(id);
  if ((await ref.get()).exists) await ref.delete();
  return { ok: true };
};

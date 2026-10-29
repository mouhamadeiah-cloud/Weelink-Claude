// The model Wee AI's questions follow: the sections of the page model of the chosen package (the admin's, else the default), so a
// section the admin adds, or a package that opens one, changes the questions. Falls back to the default model when the server is out of reach.
import { DEFAULT_MODELS, ModelPage, ModelSection, forRentalOf, modelOf, pagesOf } from '../data/pageModels';
import { ReadyEntry, partsOf, slideParts } from '../data/slideParts';
import { readySlidesOf } from './readySlides';
import { CODE_CATEGORIES, codeSlide, codeSlides } from '../data/codeReady';
import { siteKindsOfModel } from '../data/siteKinds';

// `parts`: by section id, the places on the slide the section is built from (src/data/slideParts.ts); a section left out asks everything.
export interface QuestionModel { id: string; name: string; sections: ModelSection[]; pages: ModelPage[]; parts?: Record<string, string[]> }

const PARTS_WAIT_MS = 6000;
const MODEL_WAIT_MS = 8000;

// The admin's ready slides of a category, or the editor's own for the categories that show live data.
const readEntries = async (category: string): Promise<ReadyEntry[]> =>
  CODE_CATEGORIES.includes(category)
    ? codeSlides(category).map((x) => ({ ...x, parts: slideParts(codeSlide(x.id)!) }))
    : readySlidesOf(category).then((list) => list.map((g) => ({ id: g.id, eligible: g.eligible, parts: slideParts(g) })));

// Read with a limit: without the slides every question is asked, as before.
const withParts = async (m: QuestionModel): Promise<QuestionModel> => {
  const parts = await Promise.race([partsOf(m.pages, readEntries, siteKindsOfModel(m.id)).catch(() => undefined), new Promise<undefined>((r) => setTimeout(() => r(undefined), PARTS_WAIT_MS))]);
  return parts ? { ...m, parts } : m;
};

const defaultModel = (planId: string): QuestionModel => {
  const d = DEFAULT_MODELS.find((m) => m.id === modelOf(planId)) || DEFAULT_MODELS[0];
  const pages = pagesOf(d);
  return { id: d.id, name: d.name, sections: pages[0].sections, pages };
};

export const loadQuestionModel = async (planId: string): Promise<QuestionModel> => {
  try {
    // A server that does not answer must not hold the questions forever: after a while the default model asks them.
    const stop = new AbortController();
    const timer = setTimeout(() => stop.abort(), MODEL_WAIT_MS);
    const res = await fetch('/api/build-page', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'model', plan: planId }), signal: stop.signal }).finally(() => clearTimeout(timer));
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data?.model?.pages) && data.model.pages.length) return withParts({ id: String(data.model.id), name: String(data.model.name), sections: data.model.pages[0].sections, pages: data.model.pages });
  } catch {
    // offline or the server is down: the default model asks the same questions
  }
  return withParts(defaultModel(planId));
};

/** A rental of things other than cars is asked in the shop's words (its sections are the shop's). */
export const forCategory = (model: QuestionModel, kind: string | undefined, category: string | undefined): QuestionModel =>
  kind === 'rental' ? { ...model, pages: model.pages.map((p) => ({ ...p, sections: forRentalOf(p.sections, category) })) } : model;

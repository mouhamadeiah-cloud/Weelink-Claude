// The model Wee AI's questions follow: the sections of the page model of the chosen package (the admin's, else the default), so a
// section the admin adds, or a package that opens one, changes the questions. Falls back to the default model when the server is out of reach.
import { DEFAULT_MODELS, ModelPage, ModelSection, forRentalOf, modelOf, pagesOf } from '../data/pageModels';

export interface QuestionModel { id: string; name: string; sections: ModelSection[]; pages: ModelPage[] }

const defaultModel = (planId: string): QuestionModel => {
  const d = DEFAULT_MODELS.find((m) => m.id === modelOf(planId)) || DEFAULT_MODELS[0];
  const pages = pagesOf(d);
  return { id: d.id, name: d.name, sections: pages[0].sections, pages };
};

export const loadQuestionModel = async (planId: string): Promise<QuestionModel> => {
  try {
    const res = await fetch('/api/build-page', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'model', plan: planId }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data?.model?.pages) && data.model.pages.length) return { id: String(data.model.id), name: String(data.model.name), sections: data.model.pages[0].sections, pages: data.model.pages };
  } catch {
    // offline or the server is down: the default model asks the same questions
  }
  return defaultModel(planId);
};

/** A rental of things other than cars is asked in the shop's words (its sections are the shop's). */
export const forCategory = (model: QuestionModel, kind: string | undefined, category: string | undefined): QuestionModel =>
  kind === 'rental' ? { ...model, pages: model.pages.map((p) => ({ ...p, sections: forRentalOf(p.sections, category) })) } : model;

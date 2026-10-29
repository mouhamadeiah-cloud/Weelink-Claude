// What a section's slide has room for (Eyad, 28 Oct: «كل سؤال مربوط بمكان بشريحة القسم»). Each model section is built from one ready
// slide, the first free one of its category in the admin's order (server/pagePicker.ts picks it the same way), and Wee AI asks only the
// questions whose answer has a place on that slide: no place, no question.
import { slideFits, type ModelPage, type ModelSection, type SlideFit } from './pageModels';

/** The places of a slide: its AI slots with their numbers as N (points.N.title), plus what the builder fills by element (video, calendar…). */
export const slideParts = (s: { slide?: { backgroundImage?: string; backgroundVideo?: string } | null; elements: { type: string; aiSlot?: string }[] }): string[] => {
  const out = new Set<string>();
  for (const e of s.elements || []) {
    if (e.aiSlot) out.add(String(e.aiSlot).replace(/\.\d+/g, '.N'));
    if (['video', 'calendar', 'table', 'map', 'gallery'].includes(e.type)) out.add(e.type);
  }
  if (s.slide?.backgroundImage || s.slide?.backgroundVideo) out.add('background');
  return [...out].sort();
};

export interface ReadyEntry extends SlideFit { eligible: boolean; parts: string[] }

/**
 * The slide a section is built from, as the builder picks it: among the category's eligible slides that fit the section and the site's
 * kinds, in the admin's order (only those the admin allowed for the section, while any of them is left), the first one no earlier
 * section of the page took. Undefined when the category has none (the section is not built then).
 */
export const slideOfSection = (section: Pick<ModelSection, 'slides' | 'part'>, list: ReadyEntry[], taken: Set<string>, kinds?: string[]): ReadyEntry | undefined => {
  const eligible = list.filter((r) => r.eligible && slideFits(r, section, kinds));
  const allowed = section.slides?.length ? eligible.filter((r) => section.slides!.includes(r.id)) : [];
  return (allowed.length ? allowed : eligible).find((r) => !taken.has(r.id));
};

/** Has the slide a place that matches? */
export const hasPart = (parts: string[], re: RegExp) => parts.some((p) => re.test(p));

const sectionId = (s: ModelSection) => (s.part ? `${s.category}:${s.part}` : s.category);

/** The places on the slide of every section of the model, page by page as the builder picks them (a section in two pages: its first). */
export const partsOf = async (pages: ModelPage[], read: (category: string) => Promise<ReadyEntry[]>, kinds?: string[]): Promise<Record<string, string[]>> => {
  const cats = [...new Set(pages.flatMap((p) => p.sections.map((s) => s.category)).filter((c) => c !== 'ratings'))];
  const lists = new Map(await Promise.all(cats.map(async (c) => [c, await read(c).catch(() => [] as ReadyEntry[])] as const)));
  const out: Record<string, string[]> = {};
  for (const page of pages) {
    const taken = new Set<string>();
    for (const s of page.sections) {
      const slide = lists.has(s.category) ? slideOfSection(s, lists.get(s.category)!, taken, kinds) : undefined;
      if (!slide) continue;
      taken.add(slide.id);
      out[sectionId(s)] ??= slide.parts;
    }
  }
  return out;
};


// «تعليم الخانات»: the admin says which texts, buttons and photos of a gallery slide the AI may fill (element.aiSlot), so the slide can be
// picked by the page builder (docs/READY_SLIDES_PLAN.md, step 4b). The slide itself stays the designer's: only aiSlot on its elements
// changes, and the slot rules are the ones the code's ready slides follow (src/data/aiSlots.ts).
import { SLOT_NAMES, isSlotName, slideEligibility, slotKindOf, type Eligibility } from '../src/data/aiSlots.js';

type Db = { collection: (name: string) => any };

export const slotsOf = (elements: any[]) => (Array.isArray(elements) ? elements : []).map((e) => ({ id: String(e?.id || ''), type: String(e?.type || ''), aiSlot: typeof e?.aiSlot === 'string' ? e.aiSlot : '' }));

// The slots as they stand, and whether the slide can be used.
export const slotStatus = (elements: any[]): Eligibility => slideEligibility(slotsOf(elements));

// marks: element id → slot name ('' takes the mark off). Names must fit the element (a button takes button slots...).
export const markSlots = async (db: Db, galleryId: string, marks: unknown, by: string): Promise<{ ok: true } & Eligibility | { error: 'not_found' | 'not_a_slide' | 'bad_marks'; detail?: string }> => {
  const ref = db.collection('gallerySlides').doc(galleryId);
  const snap = await ref.get();
  if (!snap.exists) return { error: 'not_found' };
  const doc = snap.data() || {};
  if (doc.kind === 'page') return { error: 'not_a_slide' };
  if (!marks || typeof marks !== 'object' || Array.isArray(marks)) return { error: 'bad_marks' };
  const elements: any[] = Array.isArray(doc.elements) ? doc.elements : [];
  const byId = new Map(elements.map((e) => [String(e?.id || ''), e]));
  for (const [id, raw] of Object.entries(marks as Record<string, unknown>)) {
    const el = byId.get(id);
    const name = typeof raw === 'string' ? raw.trim() : '';
    if (!el) return { error: 'bad_marks', detail: `عنصر غير موجود: ${id}` };
    if (!name) continue;
    const kind = slotKindOf(String(el.type));
    if (!kind) return { error: 'bad_marks', detail: `هذا العنصر لا يحمل خانة (${el.type})` };
    if (!isSlotName(name)) return { error: 'bad_marks', detail: `خانة غير معروفة: ${name}` };
    const allowedSingle = SLOT_NAMES[kind];
    const indexed = /\./.test(name);
    const fits = kind === 'map' || kind === 'form' || kind === 'gallery'
      ? allowedSingle.includes(name)
      : indexed ? (kind === 'image' ? /^photos\./.test(name) : kind === 'text' ? !/^photos\./.test(name) : /^(chips|points|items|packages)\./.test(name)) : allowedSingle.includes(name);
    if (!fits) return { error: 'bad_marks', detail: `الخانة ${name} لا تناسب عنصراً من نوع ${el.type}` };
  }
  const next = elements.map((e) => {
    const id = String(e?.id || '');
    if (!(id in (marks as object))) return e;
    const name = String((marks as Record<string, unknown>)[id] || '').trim();
    const { aiSlot: _drop, ...rest } = e;
    return name ? { ...rest, aiSlot: name } : rest;
  });
  const status = slideEligibility(slotsOf(next));
  // The slide itself is not touched: an aiTemplate on it would make the page looks restyle it as one of the code's designs.
  await ref.update({ elements: next, slotsMarkedBy: by, slotsMarkedAt: Date.now() });
  return { ok: true, ...status };
};

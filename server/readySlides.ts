// The editor's ready slides (Eyad, 22 Oct): they belong to the admin alone. readySlides/{id} holds the slide itself (slide + elements),
// its ready category and its place in it. The admin makes one in the editor, edits it there, copies a gallery slide into the list,
// moves, reorders or deletes it; nothing waits for a review. Every save finds the AI slots of the slide (src/data/autoSlots.ts), so the
// page builder can use it at once. Written by the server only (the rules give everyone read).
// A document of the earlier way (only a category, an order and a gallery id) has no `slide` and is ignored.
import { GALLERY_READY_CATEGORIES } from '../src/data/readyCategories.js';
import { autoSlots } from '../src/data/autoSlots.js';
import { slideEligibility } from '../src/data/aiSlots.js';
import { checkDesign } from './galleryEdit.js';

const READY_IDS = GALLERY_READY_CATEGORIES.map((c) => c.id);
const ID_MAX = 128;

type Db = { collection: (name: string) => any };
type Err = { error: 'not_found' | 'bad_category' | 'not_a_slide' | 'bad_request' | 'too_many_elements' | 'too_big' | 'html_not_allowed' | 'unsafe_link' | 'bad_name'; kinds?: string[] };

// The list is read without the slides themselves (a ready slide holds all its elements), so moving, deleting and the overview stay light.
// A document of the earlier way (only a category and an order) has no `eligible` and is ignored.
const isNew = (d: any) => typeof d.data()?.category === 'string' && typeof d.data()?.eligible === 'boolean';
const LIST_FIELDS = ['category', 'order', 'name', 'eligible', 'slotCount', 'problems', 'from'];
const readyDocs = async (db: Db): Promise<any[]> => (await db.collection('readySlides').select(...LIST_FIELDS).get()).docs.filter(isNew) as any[];

const summary = (d: any) => {
  const x = d.data();
  return {
    id: String(d.id), category: String(x.category || ''), order: Number(x.order) || 0, name: String(x.name || ''),
    eligible: x.eligible === true, slots: Number(x.slotCount) || 0, problems: Array.isArray(x.problems) ? x.problems.map(String) : [],
    from: String(x.from || ''),
  };
};

// The slide as the page builder reads it, with its slots found again and counted.
const prepared = (elements: any[]) => {
  const next = autoSlots(elements);
  const status = slideEligibility(next);
  return { elements: next, eligible: status.eligible, slotCount: status.slots, problems: status.problems };
};

const nextOrder = (rows: { category: string; order: number }[], category: string) => Math.max(0, ...rows.filter((r) => r.category === category).map((r) => r.order)) + 1;

/** Saves a ready slide: a new one when `id` is empty. */
export const readySave = async (
  db: Db,
  id: string | null,
  input: { page?: any; elements?: any[]; name?: unknown; category?: unknown },
  by: string
): Promise<{ ok: true; id: string; category: string; eligible: boolean; slots: number; problems: string[] } | Err> => {
  if (id && id.length > ID_MAX) return { error: 'not_found' };
  const old = id ? (await db.collection('readySlides').doc(id).get()).data() : undefined;
  if (id && !(old && old.slide)) return { error: 'not_found' };
  const category = input.category !== undefined ? String(input.category) : String(old?.category || '');
  if (!READY_IDS.includes(category)) return { error: 'bad_category' };
  // The ready slides carry example phone numbers and addresses (the contact slides), so the admin's own may keep them.
  const checked = checkDesign({ kind: 'slide', page: input.page, elements: input.elements, name: input.name ?? old?.name ?? 'شريحة جاهزة' }, { allowContact: true });
  if ('error' in checked) return checked as Err;
  const rows = (await readyDocs(db)).map(summary);
  const made = prepared(checked.elements);
  const now = Date.now();
  const fields = {
    slide: checked.slide, elements: made.elements, name: checked.name || 'شريحة جاهزة', category,
    eligible: made.eligible, slotCount: made.slotCount, problems: made.problems, updatedAt: now, updatedBy: by,
  };
  const ref = db.collection('readySlides').doc(id || undefined);
  if (old) {
    const order = old.category === category ? Number(old.order) || 1 : nextOrder(rows.filter((r) => r.id !== id), category);
    await ref.update({ ...fields, order });
  } else {
    await ref.set({ ...fields, order: nextOrder(rows, category), createdAt: now, createdBy: by });
  }
  return { ok: true, id: ref.id, category, eligible: made.eligible, slots: made.slotCount, problems: made.problems };
};

/** A gallery slide copied into a ready category (the gallery keeps its own). */
export const readyFromGallery = async (db: Db, galleryId: string, category: string, by: string) => {
  if (!galleryId || galleryId.length > ID_MAX) return { error: 'not_found' as const };
  const snap = await db.collection('gallerySlides').doc(galleryId).get();
  const g = snap.data() as Record<string, any> | undefined;
  if (!g) return { error: 'not_found' as const };
  if (g.kind === 'page') return { error: 'not_a_slide' as const };
  const r = await readySave(db, null, { page: { slides: [g.slide] }, elements: g.elements, name: g.name, category }, by);
  if ('error' in r) return r;
  await db.collection('readySlides').doc(r.id).update({ from: galleryId });
  return r;
};

export const readyGet = async (db: Db, id: string) => {
  if (!id || id.length > ID_MAX) return null;
  const snap = await db.collection('readySlides').doc(id).get();
  const x = snap.data();
  return x?.slide ? { id, name: String(x.name || ''), category: String(x.category || ''), slide: x.slide, elements: Array.isArray(x.elements) ? x.elements : [] } : null;
};

export const readyRemove = async (db: Db, id: string): Promise<{ ok: true } | { error: 'not_found' }> => {
  const ref = db.collection('readySlides').doc(id);
  if (!(await ref.get()).exists) return { error: 'not_found' };
  await ref.delete();
  return { ok: true };
};

// Where each gallery slide was copied to: gallery id → category.
export const readyMap = async (db: Db): Promise<Record<string, string>> =>
  Object.fromEntries((await readyDocs(db)).map(summary).filter((r) => r.from).map((r) => [r.from, r.category]));

// Writes 1..n as the order of a category's slides, in the order given.
const renumber = async (db: Db, ids: string[]) => {
  const batch = (db as any).batch();
  ids.forEach((id, i) => batch.update(db.collection('readySlides').doc(id), { order: i + 1 }));
  if (ids.length) await batch.commit();
};

/** One step up or down inside its category; at the end of the list nothing moves. */
export const readyMove = async (db: Db, id: string, dir: 'up' | 'down'): Promise<{ ok: true; order: number } | { error: 'not_found' }> => {
  const rows = (await readyDocs(db)).map(summary);
  const mine = rows.find((r) => r.id === id);
  if (!mine) return { error: 'not_found' };
  const ids = rows.filter((r) => r.category === mine.category).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)).map((r) => r.id);
  const at = ids.indexOf(id);
  const to = dir === 'up' ? at - 1 : at + 1;
  if (to >= 0 && to < ids.length) [ids[at], ids[to]] = [ids[to], ids[at]];
  await renumber(db, ids);
  return { ok: true, order: ids.indexOf(id) + 1 };
};

/** A slide moved to another category, at the end of it. */
export const readySetCategory = async (db: Db, id: string, category: string): Promise<{ ok: true } | { error: 'not_found' | 'bad_category' }> => {
  if (!READY_IDS.includes(category)) return { error: 'bad_category' };
  const rows = (await readyDocs(db)).map(summary);
  const mine = rows.find((r) => r.id === id);
  if (!mine) return { error: 'not_found' };
  if (mine.category === category) return { ok: true };
  await db.collection('readySlides').doc(id).update({ category, order: nextOrder(rows, category), updatedAt: Date.now() });
  return { ok: true };
};

/** Every category with its slides in order (the slides' preview loads on its own). */
export const readyOverview = async (db: Db) => {
  const rows = (await readyDocs(db)).map(summary);
  return GALLERY_READY_CATEGORIES.map((c) => ({
    id: c.id, name: c.name, icon: c.icon,
    items: rows.filter((r) => r.category === c.id).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)),
  }));
};

/** The slides the page builder may use for a category: those whose slots are complete. */
export const readyPool = async (db: Db) => {
  const byCategory = new Map<string, { id: string; order: number }[]>();
  for (const d of await readyDocs(db)) {
    const x = d.data();
    if (x.eligible !== true) continue;
    const c = String(x.category || '');
    byCategory.set(c, [...(byCategory.get(c) || []), { id: String(d.id), order: Number(x.order) || 0 }]);
  }
  return byCategory;
};

/**
 * The first time the admin opens the ready slides, the code's own ready slides (src/data/galleryReady/ready.json) become the admin's:
 * copied once into readySlides, after which the editor's panel shows only the admin's list for these categories (readyConfig/imported).
 * A slide the code already marked keeps its marks; the others get theirs found. Safe to run twice.
 */
export const readyImportOnce = async (db: Db, by: string): Promise<{ imported: number }> => {
  const flag = db.collection('readyConfig').doc('imported');
  if ((await flag.get()).exists) return { imported: 0 };
  const items = ((await import('../src/data/galleryReady/ready.json', { with: { type: 'json' } })).default as unknown) as { key: string; readyCategory: string; index: number; name: string; slide: any; elements: any[] }[];
  const have = new Set((await readyDocs(db)).map((d: any) => String(d.id)));
  const now = Date.now();
  let imported = 0;
  for (let i = 0; i < items.length; i += 25) {
    const batch = (db as any).batch();
    for (const it of items.slice(i, i + 25)) {
      const id = `code-${it.key}`;
      if (have.has(id) || !READY_IDS.includes(it.readyCategory)) continue;
      const made = prepared(it.elements);
      batch.set(db.collection('readySlides').doc(id), {
        slide: it.slide, elements: made.elements, name: String(it.name || '').slice(0, 60) || 'شريحة جاهزة', category: it.readyCategory, order: (Number(it.index) || 0) + 1,
        eligible: made.eligible, slotCount: made.slotCount, problems: made.problems, source: 'code', createdAt: now, createdBy: by, updatedAt: now, updatedBy: by,
      });
      imported += 1;
    }
    await batch.commit();
  }
  await flag.set({ at: now, by, imported });
  return { imported };
};

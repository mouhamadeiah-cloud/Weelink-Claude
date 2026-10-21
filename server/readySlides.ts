// The editor's ready slides, from the gallery (Eyad, 21 Oct): the admin adds an approved gallery slide to one of the
// ready-slide categories. readySlides/{galleryId} holds only where it goes and in what order; the slide itself stays in
// gallerySlides, so the gallery is the one place designs live. Written by the server only (the rules give everyone read).
import { GALLERY_READY_CATEGORIES } from '../src/data/readyCategories.js';

const READY_IDS = GALLERY_READY_CATEGORIES.map((c) => c.id);
const ID_MAX = 128;

type Db = { collection: (name: string) => any };

// Adds an approved slide to a ready category, at the end of it; the same slide added again only moves to the new category.
export const addReady = async (db: Db, galleryId: string, category: string, by: string): Promise<{ ok: true; category: string; order: number } | { error: 'not_found' | 'not_a_slide' | 'not_approved' | 'bad_category' }> => {
  if (!galleryId || galleryId.length > ID_MAX) return { error: 'not_found' };
  if (!READY_IDS.includes(category)) return { error: 'bad_category' };
  const snap = await db.collection('gallerySlides').doc(galleryId).get();
  if (!snap.exists) return { error: 'not_found' };
  const g = snap.data() || {};
  if (g.kind === 'page') return { error: 'not_a_slide' };
  if (g.status !== 'approved') return { error: 'not_approved' };
  const all = await db.collection('readySlides').get();
  const rows: { id: string; category: string; order: number }[] = all.docs.map((d: any) => ({ id: d.id, category: String(d.data().category || ''), order: Number(d.data().order) || 0 }));
  const mine = rows.find((r) => r.id === galleryId);
  const order = mine && mine.category === category ? mine.order : Math.max(0, ...rows.filter((r) => r.category === category).map((r) => r.order)) + 1;
  await db.collection('readySlides').doc(galleryId).set({ category, order, galleryId, name: String(g.name || '').slice(0, 60), addedAt: Date.now(), addedBy: by });
  return { ok: true, category, order };
};

export const removeReady = async (db: Db, galleryId: string): Promise<{ ok: true } | { error: 'not_found' }> => {
  const ref = db.collection('readySlides').doc(galleryId);
  if (!(await ref.get()).exists) return { error: 'not_found' };
  await ref.delete();
  return { ok: true };
};

// Where each gallery slide stands in the ready slides: id → category.
export const readyMap = async (db: Db): Promise<Record<string, string>> => {
  const all = await db.collection('readySlides').get();
  return Object.fromEntries(all.docs.map((d: any) => [d.id, String(d.data().category || '')]));
};

// A design taken out of the gallery leaves the ready slides with it.
export const dropReadyFor = async (db: Db, galleryId: string) => {
  const ref = db.collection('readySlides').doc(galleryId);
  if ((await ref.get()).exists) await ref.delete();
};

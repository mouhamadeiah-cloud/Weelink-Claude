// The editor's ready slides, from the gallery (Eyad, 21 Oct): the admin adds an approved gallery slide to one of the
// ready-slide categories. readySlides/{galleryId} holds only where it goes and in what order; the slide itself stays in
// gallerySlides, so the gallery is the one place designs live. Written by the server only (the rules give everyone read).
import { GALLERY_READY_CATEGORIES } from '../src/data/readyCategories.js';
import { OFFICIAL_UID } from './gallerySeed.js';
import { slotStatus } from './slotMarks.js';

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

type Row = { id: string; category: string; order: number };
const readyRows = async (db: Db): Promise<Row[]> => {
  const all = await db.collection('readySlides').get();
  return all.docs.map((d: any) => ({ id: d.id, category: String(d.data().category || ''), order: Number(d.data().order) || 0 }));
};

// Writes 1..n as the order of a category's slides, in the order given.
const renumber = async (db: Db, ids: string[]) => {
  const batch = (db as any).batch();
  ids.forEach((id, i) => batch.update(db.collection('readySlides').doc(id), { order: i + 1 }));
  if (ids.length) await batch.commit();
};

// One step up or down inside its category («أعلى» / «أسفل»); at the end of the list nothing moves.
export const moveReady = async (db: Db, galleryId: string, dir: 'up' | 'down'): Promise<{ ok: true; order: number } | { error: 'not_found' }> => {
  const rows = await readyRows(db);
  const mine = rows.find((r) => r.id === galleryId);
  if (!mine) return { error: 'not_found' };
  const ids = rows.filter((r) => r.category === mine.category).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)).map((r) => r.id);
  const at = ids.indexOf(galleryId);
  const to = dir === 'up' ? at - 1 : at + 1;
  if (to >= 0 && to < ids.length) [ids[at], ids[to]] = [ids[to], ids[at]];
  await renumber(db, ids);
  return { ok: true, order: ids.indexOf(galleryId) + 1 };
};

// «اعتماد المنسوخة»: the approved slides copied from the code (server/readyCopy.ts) take the ready category and place they came
// from. Slides already in the ready list are left where the admin put them.
export const adoptSeeded = async (db: Db, by: string): Promise<{ adopted: number; categories: number }> => {
  const [snap, rows] = await Promise.all([db.collection('gallerySlides').where('designerUid', '==', OFFICIAL_UID).get(), readyRows(db)]);
  const have = new Set(rows.map((r) => r.id));
  const found: { id: string; name: string; category: string; index: number }[] = [];
  for (const d of snap.docs) {
    const x = d.data();
    const from = x.seededFrom;
    if (!from || x.status !== 'approved' || x.kind === 'page' || have.has(d.id) || !READY_IDS.includes(String(from.category))) continue;
    found.push({ id: d.id, name: String(x.name || '').slice(0, 60), category: String(from.category), index: Number(from.index) || 0 });
  }
  const touched = new Set(found.map((f) => f.category));
  const now = Date.now();
  const batch = (db as any).batch();
  // After the slides that are already there; the original order is kept among themselves.
  const next: Record<string, number> = {};
  for (const c of touched) next[c] = Math.max(0, ...rows.filter((r) => r.category === c).map((r) => r.order));
  for (const f of found.sort((a, b) => a.category.localeCompare(b.category) || a.index - b.index)) {
    batch.set(db.collection('readySlides').doc(f.id), { category: f.category, order: ++next[f.category], galleryId: f.id, name: f.name, addedAt: now, addedBy: by });
  }
  if (found.length) await batch.commit();
  return { adopted: found.length, categories: touched.size };
};

// «استعمل شرائح المعرض بدل شرائح الكود» for one category. Switching it on needs at least one approved slide in the category,
// so the editor's panel is never left empty.
export const setUseGallery = async (db: Db, category: string, on: boolean, by: string): Promise<{ ok: true; useGallery: boolean } | { error: 'bad_category' | 'empty' }> => {
  if (!READY_IDS.includes(category)) return { error: 'bad_category' };
  if (on) {
    const ids = (await readyRows(db)).filter((r) => r.category === category).map((r) => r.id);
    const docs = await Promise.all(ids.map((id) => db.collection('gallerySlides').doc(id).get()));
    if (!docs.some((d: any) => d.exists && d.data().status === 'approved')) return { error: 'empty' };
  }
  await db.collection('readyConfig').doc(category).set({ useGallery: on, changedAt: Date.now(), changedBy: by });
  return { ok: true, useGallery: on };
};

// What the admin screen shows: every category with its switch and its slides in order (names only; the cards load their own preview).
export const readyOverview = async (db: Db) => {
  const [rows, cfg] = await Promise.all([readyRows(db), db.collection('readyConfig').get()]);
  // Only the ready slides are read (with their elements, to tell which are marked for the AI), not the whole gallery.
  const docs = await Promise.all(rows.map((r) => db.collection('gallerySlides').doc(r.id).get()));
  const info = new Map<string, any>();
  docs.forEach((d: any) => { if (d.exists && d.data().status === 'approved') info.set(d.id, d.data()); });
  const on = new Set<string>(cfg.docs.filter((d: any) => d.data().useGallery === true).map((d: any) => d.id));
  return GALLERY_READY_CATEGORIES.map((c) => ({
    id: c.id, name: c.name, icon: c.icon, useGallery: on.has(c.id),
    items: rows.filter((r) => r.category === c.id).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)).map((r) => {
      const g = info.get(r.id);
      const { eligible, slots, problems } = g ? slotStatus(g.elements) : { eligible: false, slots: 0, problems: [] as string[] };
      return { id: r.id, name: String(g?.name || ''), designerName: String(g?.designerName || ''), official: g?.official === true, approved: !!g, eligible, slots, problems };
    }),
  }));
};

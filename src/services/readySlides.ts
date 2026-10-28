// The editor's ready slides (server/readySlides.ts): the admin's own list, one category at a time. Everyone reads it; only the admin
// site writes it. The list is small and the same for everyone, so a category is read once for a few minutes.
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { deserializeElements } from '../utils/elementStorage';
import type { GallerySlide } from './galleryView';

const KEEP_MS = 3 * 60_000;
const byCategory = new Map<string, { at: number; list: Promise<ReadySlide[]> }>();

export type ReadySlide = GallerySlide & { eligible: boolean };

const toSlide = (id: string, x: any): ReadySlide => ({
  eligible: x.eligible === true,
  id,
  kind: 'slide',
  page: null,
  name: String(x.name || ''),
  category: String(x.category || ''),
  designerUid: '',
  designerName: 'Weelink',
  official: true,
  designer: { completed: 0, ratingCount: 0, ratingSum: 0, verified: false, average: 0 },
  likes: 0,
  dislikes: 0,
  uses: 0,
  at: Number(x.updatedAt) || 0,
  slide: x.slide || {},
  elements: deserializeElements(Array.isArray(x.elements) ? x.elements : []),
});

/** The ready slides of a category, in the admin's order. */
export const readySlidesOf = (category: string): Promise<ReadySlide[]> => {
  const hit = byCategory.get(category);
  if (hit && Date.now() - hit.at < KEEP_MS) return hit.list;
  const list = getDocs(query(collection(db, 'readySlides'), where('category', '==', category))).then((snap) =>
    snap.docs
      .filter((d) => d.data().slide)
      .sort((a, b) => (Number(a.data().order) || 0) - (Number(b.data().order) || 0))
      .map((d) => toSlide(d.id, d.data()))
  );
  list.catch(() => byCategory.delete(category));
  byCategory.set(category, { at: Date.now(), list });
  return list;
};

let importedCache: { at: number; value: Promise<boolean> } | null = null;

/** The code's own ready slides were copied into the admin's list (the admin opened the ready slides once): the list replaces them. */
export const readyListTakenOver = (): Promise<boolean> => {
  if (!importedCache || Date.now() - importedCache.at > KEEP_MS) {
    const value = getDoc(doc(db, 'readyConfig', 'imported')).then((s) => s.exists());
    value.catch(() => { importedCache = null; });
    importedCache = { at: Date.now(), value };
  }
  return importedCache.value;
};

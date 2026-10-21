// The editor's ready slides that come from the gallery (server/readySlides.ts): for a category, its gallery slides in the
// admin's order. The ready list is small and the same for everyone, so it is read once for a few minutes.
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

let cache: { at: number; map: Promise<Record<string, string[]>> } | null = null;

// category id → gallery slide ids, in order
export const readyByCategory = (): Promise<Record<string, string[]>> => {
  if (!cache || Date.now() - cache.at > 5 * 60_000) {
    const map = getDocs(collection(db, 'readySlides')).then((snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, category: String(d.data().category || ''), order: Number(d.data().order) || 0 }));
      const out: Record<string, string[]> = {};
      for (const r of rows.sort((a, b) => a.order - b.order)) (out[r.category] ||= []).push(r.id);
      return out;
    });
    map.catch(() => { cache = null; });
    cache = { at: Date.now(), map };
  }
  return cache.map;
};

let cfgCache: { at: number; set: Promise<Set<string>> } | null = null;

// The categories whose slides come from the gallery instead of the code (readyConfig/{category}.useGallery).
export const galleryOnlyCategories = (): Promise<Set<string>> => {
  if (!cfgCache || Date.now() - cfgCache.at > 5 * 60_000) {
    const set = getDocs(collection(db, 'readyConfig')).then((snap) => new Set(snap.docs.filter((d) => d.data().useGallery === true).map((d) => d.id)));
    set.catch(() => { cfgCache = null; });
    cfgCache = { at: Date.now(), set };
  }
  return cfgCache.set;
};

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

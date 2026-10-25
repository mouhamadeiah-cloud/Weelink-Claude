// Pixabay's photos, illustrations, vectors, 3D and videos, read through our own function (api/photos.ts, which holds the key).
// Pixabay asks that a page showing its results says they come from Pixabay and links to it, and that files are not hotlinked
// for good: the editor copies a picked image into our store (hostRemoteImage) and a published page reads videos through /media.
import type { GalleryImageItem } from '../data/graphicsPresets';

export type PixabayType = 'photo' | 'illustration' | 'vector' | '3d' | 'video';

export interface PixabayItem extends GalleryImageItem {
  source: 'pixabay';
  kind: PixabayType;
  pageUrl: string;
  videoUrl?: string;
  duration?: number;
}

export interface PixabayResult {
  items: PixabayItem[];
  totalPages: number;
  total: number;
  page: number;
  error?: string;
}

const cache = new Map<string, { at: number; value: PixabayResult }>();
const CACHE_MS = 10 * 60 * 1000;

export const PIXABAY_URL = 'https://pixabay.com/?utm_source=weelink&utm_medium=referral';

export async function fetchPixabay(o: { type: PixabayType; query?: string; category?: string; page?: number; perPage?: number }): Promise<PixabayResult> {
  const { type, query = '', category = 'all', page = 1, perPage = 9 } = o;
  const key = `${type}|${category}|${query.trim().toLowerCase()}|${page}|${perPage}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  try {
    const params = new URLSearchParams({ src: 'pixabay', type, q: query.trim(), category, page: String(page), perPage: String(perPage) });
    const res = await fetch(`/api/photos?${params}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data.items)) {
      const value: PixabayResult = { items: data.items, totalPages: data.totalPages || 1, total: data.total || 0, page };
      cache.set(key, { at: Date.now(), value });
      return value;
    }
    return { items: [], totalPages: 1, total: 0, page, error: data.error || 'pixabay_failed' };
  } catch {
    return { items: [], totalPages: 1, total: 0, page, error: 'offline' };
  }
}

// Why Pixabay shows nothing, in words the owner can act on.
export const pixabayErrorText = (error?: string) =>
  error === 'not_configured'
    ? 'مكتبة Pixabay غير مفعّلة بعد على الخادم (المفتاح PIXABAY_API_KEY).'
    : error === 'bad_key'
      ? 'Pixabay رفض المفتاح. تأكد من PIXABAY_API_KEY.'
      : error === 'rate_limited'
        ? 'وصلنا للحد المسموح من طلبات Pixabay، جرّب بعد دقيقة.'
        : 'Pixabay لم يرد هذه المرة. جرّب بعد قليل.';

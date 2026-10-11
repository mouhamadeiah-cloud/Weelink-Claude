// What Weelink's home page remembers on this device, so a returning visitor starts where they
// usually go: the pages they opened lately, which of the four searches they use most, and the
// governorate they picked. Kept per account (or 'guest') in localStorage; nothing here leaves the
// browser, and every read survives a blocked or empty storage.
import type { ProjectType } from '../components/shop/shopTypes';

export type Intent = 'food' | 'shop' | 'pros' | 'cars';

export interface RecentPage {
  kind: ProjectType;
  name: string; // the published page's name, or the restaurant owner's uid
  title: string;
  url: string;
  at: number;
}

const MAX_RECENT = 8;
const who = (uid: string | null | undefined) => uid || 'guest';

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the home page just forgets */
  }
};

export const listRecent = (uid?: string | null): RecentPage[] => {
  const list = read<RecentPage[]>(`weelink_recent_${who(uid)}`, []);
  return Array.isArray(list) ? list.filter((p) => p && typeof p.url === 'string' && typeof p.title === 'string') : [];
};

export const recordVisit = (uid: string | null | undefined, page: Omit<RecentPage, 'at'>) => {
  const rest = listRecent(uid).filter((p) => p.url !== page.url);
  write(`weelink_recent_${who(uid)}`, [{ ...page, at: Date.now() }, ...rest].slice(0, MAX_RECENT));
};

const intentKey = (uid?: string | null) => `weelink_intents_${who(uid)}`;

export const bumpIntent = (uid: string | null | undefined, intent: Intent) => {
  const counts = read<Partial<Record<Intent, number>>>(intentKey(uid), {});
  write(intentKey(uid), { ...counts, [intent]: (counts[intent] || 0) + 1 });
};

// The search this person uses most, once they used it at least twice.
export const favoriteIntent = (uid?: string | null): Intent | null => {
  const counts = read<Partial<Record<Intent, number>>>(intentKey(uid), {});
  const best = (Object.entries(counts) as [Intent, number][]).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] >= 2 ? best[0] : null;
};

export const readHomePlace = (): string => read<string>('weelink_home_place', '');
export const saveHomePlace = (governorate: string) => write('weelink_home_place', governorate);

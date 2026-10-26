// What kind of business a page is, as three levels of names: catalog → sub-catalog → items.
//   'shop'        Eyad's store categories (src/data/shopCategories.json, from onlineshops.json)
//   'restaurant'  Eyad's restaurant categories (src/data/restaurantCategories.json), two levels
//   'cars'        kinds of car showroom and their makes (src/data/carCategories.json), two levels
//   'rental'      what is rented and its kinds (src/data/rentalCategories.json), two levels
//   'hotel'       the kind of place and its class (src/data/hotelCategories.json), two levels
//   'jobs'        the occupations (src/data/occupations.json) for free pages and other trades
// The owner picks them in Wee AI; on «نشر» they become the page's first search keywords, and the
// home page's searches filter by them. Each list loads only when it is needed.
import { useEffect, useState } from 'react';
import type { ProjectType } from '../components/shop/shopTypes';

export type CategorySource = 'shop' | 'restaurant' | 'cars' | 'rental' | 'hotel' | 'jobs';

export interface CategoryNode {
  name: string;
  subs: { name: string; items: string[] }[];
}

export const categorySourceOf = (kind: ProjectType | undefined): CategorySource =>
  kind === 'shop' ? 'shop' : kind === 'restaurant' ? 'restaurant' : kind === 'cars' ? 'cars' : kind === 'rental' ? 'rental' : kind === 'hotel' ? 'hotel' : 'jobs';

const loaders: Record<CategorySource, () => Promise<CategoryNode[]>> = {
  shop: () => import('../data/shopCategories.json').then((m) => (m.default || m) as unknown as CategoryNode[]),
  restaurant: () =>
    import('../data/restaurantCategories.json').then((m) =>
      ((m.default || m) as unknown as { name: string; subs: string[] }[]).map((c) => ({ name: c.name, subs: c.subs.map((s) => ({ name: s, items: [] })) }))
    ),
  cars: () =>
    import('../data/carCategories.json').then((m) =>
      ((m.default || m) as unknown as { name: string; subs: string[] }[]).map((c) => ({ name: c.name, subs: c.subs.map((s) => ({ name: s, items: [] })) }))
    ),
  rental: () =>
    import('../data/rentalCategories.json').then((m) =>
      ((m.default || m) as unknown as { name: string; subs: string[] }[]).map((c) => ({ name: c.name, subs: c.subs.map((s) => ({ name: s, items: [] })) }))
    ),
  hotel: () =>
    import('../data/hotelCategories.json').then((m) =>
      ((m.default || m) as unknown as { name: string; subs: string[] }[]).map((c) => ({ name: c.name, subs: c.subs.map((s) => ({ name: s, items: [] })) }))
    ),
  jobs: () =>
    import('../data/occupations.json').then((m) =>
      ((m.default || m) as unknown as { name: string; subs: { name: string; jobs: string[] }[] }[]).map((c) => ({
        name: c.name,
        subs: c.subs.map((s) => ({ name: s.name, items: s.jobs })),
      }))
    ),
};

const cache: Partial<Record<CategorySource, Promise<CategoryNode[]>>> = {};
export const loadCategories = (source: CategorySource) =>
  (cache[source] ||= loaders[source]().catch((err) => {
    delete cache[source];
    throw err;
  }));

export const useCategories = (source: CategorySource, enabled = true) => {
  const [list, setList] = useState<CategoryNode[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    setList(null);
    loadCategories(source).then((l) => alive && setList(l)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [source, enabled]);
  return list;
};

// A category name as a search keyword: the same spelling on «نشر» and in the home page's filters
// (commas would split it, and keywords are at most 40 characters).
export const categoryKeyword = (name: string) =>
  name.replace(/[،,]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 40);

// The page's catalog, sub-catalog and specialty as keywords, first in the list, then the owner's own
// (15 at most in all).
export const withCategoryKeywords = (catalog: { category?: string; subCategory?: string; specialty?: string } | null | undefined, own: string[]) => {
  const cats = [catalog?.category, catalog?.subCategory, catalog?.specialty].map((c) => categoryKeyword(c || '')).filter(Boolean);
  return Array.from(new Set([...cats, ...own])).slice(0, 15);
};

// The pages Weelink's home page finds: every published page has a siteNames doc (its name, kind,
// title, description and keywords; see services/sites.ts), which anyone may list. A restaurant's
// offers come from its live menu (restaurants/{uid}). Places (governorate, city) are not in these
// docs yet; the directory with locations is a later step of the site plan.
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { searchSites, siteFallbackUrl } from './sites';
import { categoryKeyword } from '../utils/businessCategories';
import { loadPublishedRestaurant, restaurantSiteUrl } from '../components/restaurant/restaurantCloud';
import type { ProjectType } from '../components/shop/shopTypes';
import type { Intent } from './homeActivity';

export interface DirectoryEntry {
  name: string;
  owner: string;
  project: ProjectType;
  title: string;
  description: string;
}

export interface DishOffer {
  restaurant: string;
  restaurantUrl: string;
  dish: string;
  price: number;
  oldPrice: number;
  currency: string;
  image: string;
}

// Which kind of page answers each of the home page's four searches (technicians and other
// professionals have the free page).
export const INTENT_KIND: Record<Intent, ProjectType> = { food: 'restaurant', shop: 'shop', pros: 'page', cars: 'cars' };

const toEntry = (name: string, d: any): DirectoryEntry => ({
  name,
  owner: typeof d?.owner === 'string' ? d.owner : '',
  project: d?.project,
  title: typeof d?.title === 'string' && d.title.trim() ? d.title.trim() : name,
  description: typeof d?.description === 'string' ? d.description : '',
});

export const entryUrl = (e: DirectoryEntry) => (e.project === 'restaurant' ? restaurantSiteUrl(e.owner) : siteFallbackUrl(e.name));

export const listByKind = async (kind: ProjectType, n = 24): Promise<DirectoryEntry[]> => {
  const snap = await getDocs(query(collection(db, 'siteNames'), where('project', '==', kind), limit(n)));
  return snap.docs.map((d) => toEntry(d.id, d.data()));
};

// The pages of one kind filed under a category: on «نشر» a page's catalog names become its first
// keywords (see withCategoryKeywords), so this is a keyword search kept to that kind.
export const listByCategory = async (kind: ProjectType, name: string): Promise<DirectoryEntry[]> => {
  const k = categoryKeyword(name);
  if (!k) return [];
  const snap = await getDocs(query(collection(db, 'siteNames'), where('keywords', 'array-contains', k), limit(50)));
  return snap.docs.filter((d) => d.data()?.project === kind).map((d) => toEntry(d.id, d.data()));
};

// The pages whose keywords hold any of the first three words typed.
const searchDirectory = async (text: string): Promise<DirectoryEntry[]> => {
  const words = Array.from(new Set(text.trim().split(/\s+/).filter((w) => w.length > 1))).slice(0, 3);
  const all = [text.trim(), ...words];
  const found = await Promise.all(all.map((w) => searchSites(w).catch(() => [])));
  const seen = new Map<string, DirectoryEntry>();
  for (const list of found) for (const s of list) if (!seen.has(s.name)) seen.set(s.name, toEntry(s.name, s));
  return Array.from(seen.values());
};

// Dishes on offer (a struck-through old price or the «عرض» badge) at the first few restaurants.
export const restaurantOffers = async (restaurants: DirectoryEntry[], max = 8): Promise<DishOffer[]> => {
  const menus = await Promise.all(restaurants.slice(0, 6).map((r) => loadPublishedRestaurant(r.owner).then((m) => ({ r, m })).catch(() => null)));
  const offers: DishOffer[] = [];
  for (const item of menus) {
    if (!item?.m) continue;
    const { settings, dishes } = item.m.admin;
    for (const d of dishes) {
      if (!d.published || !d.available) continue;
      if (!(d.oldPrice > d.price || d.badge === 'offer')) continue;
      offers.push({
        restaurant: settings.name || item.r.title,
        restaurantUrl: restaurantSiteUrl(item.r.owner),
        dish: d.name,
        price: d.price,
        oldPrice: d.oldPrice,
        currency: settings.currency,
        image: d.image,
      });
    }
  }
  return offers.slice(0, max);
};

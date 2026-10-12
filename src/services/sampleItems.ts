// A new shop or restaurant opens with ten example items from the kind of business its owner chose
// in Wee AI, so its pages are not empty. The answers are read from this device
// (weelink_chat_progress_{uid}, also where guest answers land after signing up), the names come
// from src/data/sampleItems.ts and the shop lists, and the photos from Unsplash via /api/photos.
import { loadCategories } from '../utils/businessCategories';
import { RESTAURANT_DEFAULT_SUB, RESTAURANT_SAMPLES, SAMPLE_NOTE, SAMPLE_PRICES, SHOP_PHOTO_SEARCH } from '../data/sampleItems';
import { ShopAdminData, ShopCatalog, newId, normalizeProduct } from '../components/shop/shopTypes';
import { Dish, FOOD_PHOTOS, RestaurantAdminData, emptyDish, exampleRestaurantAdmin, foodPhoto } from '../components/restaurant/restaurantTypes';
import { trackUnsplashDownload } from './unsplashService';
import type { ProjectType } from '../components/shop/shopTypes';

interface CatalogAnswer {
  category?: string;
  subCategory?: string;
  specialty?: string;
}

// The work step's answer, when it was given for this kind of page.
export const readCatalogAnswer = (uid: string, kind: ProjectType): CatalogAnswer | null => {
  try {
    const data = JSON.parse(localStorage.getItem(`weelink_chat_progress_${uid}`) || 'null');
    if (!data?.catalogInfo?.category || (data.pageKind || 'page') !== kind) return null;
    return data.catalogInfo;
  } catch {
    return null;
  }
};

// Up to ten Unsplash photos for an English search; none when the search is not reachable.
const samplePhotos = async (search: string): Promise<string[]> => {
  try {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(`/api/photos?${new URLSearchParams({ q: search, perPage: '10' })}`, { signal: ctrl.signal });
    window.clearTimeout(timer);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !Array.isArray(data.items)) return [];
    data.items.forEach((p: any) => p.unsplashId && trackUnsplashDownload(undefined, p.unsplashId));
    return data.items.map((p: any) => p.fullUrl).filter(Boolean);
  } catch {
    return [];
  }
};

// Ten products: the chosen section's items first (the specialty before them), then the other
// sections of the same store type, each filed under its section.
export const sampleShopAdmin = async (answer: CatalogAnswer, base: ShopAdminData): Promise<ShopAdminData | null> => {
  const list = await loadCategories('shop').catch(() => []);
  const cat = list.find((c) => c.name === answer.category);
  if (!cat) return null;
  const chosen = cat.subs.find((s) => s.name === answer.subCategory) || null;
  const subs = chosen ? [chosen, ...cat.subs.filter((s) => s !== chosen)] : cat.subs;

  const picks: { name: string; sub: string }[] = [];
  const add = (name: string, sub: string) => {
    if (name && picks.length < 10 && !picks.some((p) => p.name === name)) picks.push({ name, sub });
  };
  if (chosen && answer.specialty) add(answer.specialty, chosen.name);
  for (const s of subs) {
    if (s.items.length) s.items.forEach((i) => add(i, s.name));
    else add(s.name, s.name);
  }
  if (!picks.length) return null;

  const now = new Date().toISOString();
  const main: ShopCatalog = { id: newId('cat'), name: cat.name, parentId: null, images: [], createdAt: now };
  const subCatalogs = new Map<string, ShopCatalog>();
  const subOf = (name: string) => {
    if (!subCatalogs.has(name)) subCatalogs.set(name, { id: newId('cat'), name, parentId: main.id, images: [], createdAt: now });
    return subCatalogs.get(name)!;
  };
  const photos = await samplePhotos(SHOP_PHOTO_SEARCH[cat.name] || 'shop products');
  const currency = base.settings.currency;
  const products = picks.map((p, i) =>
    normalizeProduct(
      {
        id: newId('prd'),
        name: p.name,
        shortDescription: SAMPLE_NOTE,
        price: SAMPLE_PRICES[i % SAMPLE_PRICES.length],
        stock: 10,
        images: photos[i] ? [photos[i]] : [],
        featured: i < 4,
        catalogIds: [main.id, subOf(p.sub).id],
        createdAt: new Date(Date.now() - i * 60000).toISOString(),
      },
      currency
    )
  );
  return { ...base, catalogs: [main, ...subCatalogs.values()], products };
};

// Ten dishes of the chosen kind, in one menu section, on the example restaurant (halls, settings).
export const sampleRestaurantAdmin = async (answer: CatalogAnswer): Promise<RestaurantAdminData | null> => {
  const sub = RESTAURANT_SAMPLES[answer.subCategory || ''] ? answer.subCategory! : RESTAURANT_DEFAULT_SUB[answer.category || ''];
  const sample = sub ? RESTAURANT_SAMPLES[sub] : null;
  if (!sample) return null;
  const base = exampleRestaurantAdmin();
  const categoryId = 'cat-sample';
  const photos = await samplePhotos(sample.search);
  const dishes: Dish[] = sample.dishes.map(([name, price], i) => ({
    ...emptyDish(categoryId),
    id: `dish-sample-${i + 1}`,
    name,
    description: SAMPLE_NOTE,
    price,
    image: photos[i] || foodPhoto(FOOD_PHOTOS.plates),
    featured: i < 4,
    badge: i === 0 ? 'popular' : '',
    createdAt: new Date(Date.now() - i * 60000).toISOString(),
  }));
  return {
    ...base,
    categories: [{ id: categoryId, name: sub.startsWith('مطعم') ? 'أطباقنا' : sub, icon: '🍽️', image: '', hidden: false, stationId: 'st-kitchen' }],
    subCatalogs: [],
    dishes,
  };
};

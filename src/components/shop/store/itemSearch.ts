// One advanced search for everything a page lists as cards: a shop's or rental's products and a
// restaurant's dishes (a hotel's rooms are products with a guest limit). The page's data is turned
// into plain search items, so the filters, their chips and the sorting are written once and every
// choice in the window offers only what the page really has.
import type { ShopCatalog, ShopProduct } from '../shopTypes';
import { PRODUCT_BADGES } from '../shopTypes';
import { DISH_BADGES } from '../../restaurant/restaurantTypes';
import type { Dish, MenuCategory } from '../../restaurant/restaurantTypes';

export interface SearchItem {
  id: string;
  texts: (string | undefined)[]; // what a typed word is looked for in
  group: string[]; // catalog ids it sits in, parents included
  price: number;
  oldPrice: number;
  featured: boolean;
  available: boolean;
  badge: string; // badge id, '' = none
  options: Record<string, string[]>; // option name -> the choices it offers (colours, sizes...)
  kind: string; // a dish's kind of food, '' elsewhere
  guests: number; // most people it takes (a hotel's room), 0 = not set
  created: string;
}

export type ItemSort = '' | 'priceAsc' | 'priceDesc' | 'newest';

export interface ItemFilters {
  group: string;
  priceFrom: string;
  priceTo: string;
  onSale: boolean;
  featured: boolean;
  available: boolean;
  badge: string;
  kind: string;
  guests: string; // people the visitor comes with: only items that take at least this many
  options: Record<string, string>;
  sort: ItemSort;
}

export const EMPTY_ITEM_FILTERS: ItemFilters = {
  group: '', priceFrom: '', priceTo: '', onSale: false, featured: false, available: false, badge: '', kind: '', guests: '', options: {}, sort: '',
};

export const SORTS: { id: ItemSort; label: string }[] = [
  { id: '', label: 'الافتراضي' },
  { id: 'priceAsc', label: 'الأرخص أولاً' },
  { id: 'priceDesc', label: 'الأغلى أولاً' },
  { id: 'newest', label: 'الأحدث' },
];

export const itemFromProduct = (p: ShopProduct, catalogs: ShopCatalog[]): SearchItem => {
  const parents = p.catalogIds.map((id) => catalogs.find((c) => c.id === id)?.parentId).filter((id): id is string => !!id);
  return {
    id: p.id,
    texts: [p.name, p.shortDescription, p.sku],
    group: [...new Set([...p.catalogIds, ...parents])],
    price: p.price,
    oldPrice: p.oldPrice,
    featured: p.featured,
    available: !p.inWarehouse || p.stock > 0,
    badge: p.badge,
    options: Object.fromEntries(p.options.filter((o) => o.name.trim() && o.values.length).map((o) => [o.name.trim(), o.values.map((v) => v.label).filter(Boolean)])),
    kind: '',
    guests: p.maxGuests || 0,
    created: p.createdAt,
  };
};

export const itemFromDish = (d: Dish, categories: MenuCategory[]): SearchItem => ({
  id: d.id,
  texts: [d.name, d.description, d.cuisine, categories.find((c) => c.id === d.categoryId)?.name],
  group: [d.categoryId],
  price: d.price,
  oldPrice: d.oldPrice,
  featured: d.featured,
  available: d.available,
  badge: d.badge,
  options: {},
  kind: d.cuisine,
  guests: 0,
  created: d.createdAt,
});

const num = (v: string) => {
  const n = parseFloat(v.replace(/[,\s]/g, ''));
  return isFinite(n) ? n : null;
};

export const itemMatches = (it: SearchItem, f: ItemFilters) => {
  const from = num(f.priceFrom);
  const to = num(f.priceTo);
  const guests = num(f.guests);
  return (
    (!f.group || it.group.includes(f.group)) &&
    (from === null || it.price >= from) &&
    (to === null || it.price <= to) &&
    (!f.onSale || it.oldPrice > it.price) &&
    (!f.featured || it.featured) &&
    (!f.available || it.available) &&
    (!f.badge || it.badge === f.badge) &&
    (!f.kind || it.kind === f.kind) &&
    (guests === null || it.guests >= guests) &&
    Object.entries(f.options).every(([name, value]) => !value || (it.options[name] || []).includes(value))
  );
};

// The matches in the order the visitor asked for (the page's own order when none).
export const sortItems = <T extends { id: string }>(list: T[], items: Map<string, SearchItem>, sort: ItemSort): T[] => {
  if (!sort) return list;
  const at = (x: T) => items.get(x.id);
  const key = (x: T) => (sort === 'newest' ? at(x)?.created || '' : at(x)?.price || 0);
  const out = [...list];
  out.sort((a, b) => {
    const ka = key(a), kb = key(b);
    if (sort === 'priceAsc') return (ka as number) - (kb as number);
    if (sort === 'priceDesc') return (kb as number) - (ka as number);
    return String(kb).localeCompare(String(ka));
  });
  return out;
};

export interface ItemChip {
  key: string;
  label: string;
}

const badgeLabel = (id: string) => [...PRODUCT_BADGES, ...DISH_BADGES].find((b) => b.id === id)?.label || id;

// Short labels of what is asked for, shown above the results (each one removable).
export const itemFilterChips = (f: ItemFilters, groupName: (id: string) => string): ItemChip[] => {
  const out: ItemChip[] = [];
  if (f.group) out.push({ key: 'group', label: groupName(f.group) });
  if (f.priceFrom || f.priceTo) out.push({ key: 'price', label: `السعر ${f.priceFrom && f.priceTo ? `${f.priceFrom} - ${f.priceTo}` : f.priceFrom ? `من ${f.priceFrom}` : `حتى ${f.priceTo}`}` });
  if (f.guests) out.push({ key: 'guests', label: `${f.guests} أشخاص فأكثر` });
  if (f.kind) out.push({ key: 'kind', label: f.kind });
  if (f.badge) out.push({ key: 'badge', label: badgeLabel(f.badge) });
  Object.entries(f.options).forEach(([name, value]) => { if (value) out.push({ key: `option:${name}`, label: `${name}: ${value}` }); });
  if (f.onSale) out.push({ key: 'onSale', label: 'عليه خصم' });
  if (f.featured) out.push({ key: 'featured', label: 'مميز' });
  if (f.available) out.push({ key: 'available', label: 'المتوفر فقط' });
  if (f.sort) out.push({ key: 'sort', label: SORTS.find((s) => s.id === f.sort)?.label || '' });
  return out;
};

export const withoutItemChip = (f: ItemFilters, key: string): ItemFilters => {
  if (key === 'price') return { ...f, priceFrom: '', priceTo: '' };
  if (key.startsWith('option:')) return { ...f, options: { ...f.options, [key.slice(7)]: '' } };
  if (key === 'onSale' || key === 'featured' || key === 'available') return { ...f, [key]: false };
  if (key === 'sort') return { ...f, sort: '' };
  return { ...f, [key]: '' };
};

// Filters that narrow the list, not just reorder it.
export const hasItemFilters = (f: ItemFilters) => itemFilterChips(f, (id) => id).length > 0;

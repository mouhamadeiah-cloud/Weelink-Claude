// The items a page's search looks through, as plain search items: the shop's (and a rental's or
// hotel's) published products, or the restaurant's published dishes. A search bar says which one it
// is for (shopSearchKind); without it the page's own data decides.
import { useMemo } from 'react';
import type { CanvasElement } from '../../../types';
import { useShopData } from './ShopDataContext';
import { useRestaurantData } from '../../restaurant/store/RestaurantDataContext';
import { SearchItem, itemFromDish, itemFromProduct } from './itemSearch';
import type { SearchNoun } from './ItemAdvancedSearch';

export type SearchKind = 'shop' | 'menu';

export interface ItemRow {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  texts: (string | undefined)[];
}

export interface ItemSearchSource {
  kind: SearchKind;
  rows: ItemRow[];
  items: SearchItem[];
  byId: Map<string, SearchItem>;
  groups: { id: string; name: string }[];
  groupTitle: string;
  noun: SearchNoun;
  currency: string;
}

const PRODUCT_NOUN: SearchNoun = { one: 'منتج', two: 'منتجين', few: 'منتجات', many: 'منتج' };
const DISH_NOUN: SearchNoun = { one: 'طبق', two: 'طبقين', few: 'أطباق', many: 'طبق' };

export const useItemSearch = (elem?: CanvasElement): ItemSearchSource => {
  const shop = useShopData();
  const menu = useRestaurantData();
  const kind: SearchKind = elem?.shopSearchKind ?? (menu && menu.dishes.length > 0 && !(shop && shop.products.length > 0) ? 'menu' : 'shop');

  return useMemo<ItemSearchSource>(() => {
    if (kind === 'menu') {
      const categories = (menu?.categories || []).filter((c) => !c.hidden && c.name.trim());
      const visible = new Set(categories.map((c) => c.id));
      const dishes = (menu?.dishes || []).filter((d) => d.published && d.name.trim() && visible.has(d.categoryId));
      const items = dishes.map((d) => itemFromDish(d, categories));
      return {
        kind,
        rows: dishes.map((d, i) => ({ id: d.id, name: d.name, price: d.price, currency: menu?.settings.currency || '', image: d.image, texts: items[i].texts })),
        items,
        byId: new Map(items.map((it) => [it.id, it])),
        groups: categories.map((c) => ({ id: c.id, name: c.name })),
        groupTitle: 'القسم',
        noun: DISH_NOUN,
        currency: menu?.settings.currency || '',
      };
    }
    const catalogs = shop?.catalogs || [];
    const products = (shop?.products || []).filter((p) => p.published);
    const items = products.map((p) => itemFromProduct(p, catalogs));
    return {
      kind,
      rows: products.map((p, i) => ({ id: p.id, name: p.name, price: p.price, currency: p.currency, image: p.images[0] || '', texts: items[i].texts })),
      items,
      byId: new Map(items.map((it) => [it.id, it])),
      groups: catalogs.filter((c) => !c.parentId).map((c) => ({ id: c.id, name: c.name })),
      groupTitle: 'التصنيف',
      noun: PRODUCT_NOUN,
      currency: products.find((p) => p.price > 0)?.currency || '',
    };
  }, [kind, shop, menu]);
};

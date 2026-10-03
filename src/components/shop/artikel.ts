// The product catalogue from artikel.json: main catalogs → sub catalogs → common product names.
// Loaded on demand so the editor bundle does not carry it.
import { ProductOption, OptionValue, newId } from './shopTypes';

export interface ArtikelItem { id: number; name_ar: string; name_en: string; keywords: string[] }
export interface ArtikelSub { id: number; slug: string; name_ar: string; name_en: string; keywords: string[]; items: ArtikelItem[] }
export interface ArtikelCatalog { id: number; slug: string; name_ar: string; name_en: string; keywords: string[]; subcategories: ArtikelSub[] }

let cache: Promise<ArtikelCatalog[]> | null = null;

export const loadArtikel = (): Promise<ArtikelCatalog[]> => {
  if (!cache) {
    cache = import('../../data/artikel.json').then((m: any) => (m.default || m).catalogs as ArtikelCatalog[]);
  }
  return cache;
};

export interface ArtikelHit {
  catalog: ArtikelCatalog;
  sub: ArtikelSub;
  item: ArtikelItem | null;
}

// Arabic-insensitive matching: ignore diacritics, alef/ya/ta-marbuta variants and case.
export const normalizeSearch = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();

const matches = (q: string, texts: string[]) => texts.some((t) => normalizeSearch(t).includes(q));

// Products first (most specific), then sub catalogs.
export const searchArtikel = (catalogs: ArtikelCatalog[], query: string, limit = 8): ArtikelHit[] => {
  const q = normalizeSearch(query);
  if (q.length < 2) return [];
  const items: ArtikelHit[] = [];
  const subs: ArtikelHit[] = [];
  for (const catalog of catalogs) {
    for (const sub of catalog.subcategories) {
      for (const item of sub.items) {
        if (matches(q, [item.name_ar, item.name_en, ...item.keywords])) items.push({ catalog, sub, item });
      }
      if (matches(q, [sub.name_ar, sub.name_en, ...sub.keywords])) subs.push({ catalog, sub, item: null });
    }
  }
  return [...items, ...subs].slice(0, limit);
};

// ---- Standard specs suggested for a kind of product ----

const vals = (labels: string[]): OptionValue[] => labels.map((label) => ({ label }));

export const COLOR_PALETTE: OptionValue[] = [
  { label: 'أسود', color: '#1d1d1f' },
  { label: 'أبيض', color: '#ffffff' },
  { label: 'رمادي', color: '#8e8e93' },
  { label: 'أحمر', color: '#ff3b30' },
  { label: 'أزرق', color: '#0071e3' },
  { label: 'كحلي', color: '#1c2a4a' },
  { label: 'أخضر', color: '#34c759' },
  { label: 'أصفر', color: '#ffcc00' },
  { label: 'برتقالي', color: '#ff9500' },
  { label: 'وردي', color: '#ff6fae' },
  { label: 'بنفسجي', color: '#8e44ad' },
  { label: 'بني', color: '#8b5a2b' },
  { label: 'بيج', color: '#e8d8bd' },
  { label: 'ذهبي', color: '#d4af37' },
  { label: 'فضي', color: '#c0c0c0' },
];

export interface SpecPreset {
  key: string;
  name: string;
  kind: ProductOption['kind'];
  values: OptionValue[];
  affectsStock: boolean;
}

export const SPEC_PRESETS: Record<string, SpecPreset> = {
  size: { key: 'size', name: 'المقاس', kind: 'size', values: vals(['XS', 'S', 'M', 'L', 'XL', 'XXL']), affectsStock: true },
  shoeSize: { key: 'shoeSize', name: 'المقاس', kind: 'size', values: vals(['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46']), affectsStock: true },
  color: { key: 'color', name: 'اللون', kind: 'color', values: [], affectsStock: true },
  capacity: { key: 'capacity', name: 'السعة', kind: 'text', values: vals(['64GB', '128GB', '256GB', '512GB', '1TB']), affectsStock: true },
  weight: { key: 'weight', name: 'الوزن', kind: 'text', values: vals(['250 غ', '500 غ', '1 كغ']), affectsStock: true },
  volume: { key: 'volume', name: 'الحجم', kind: 'text', values: vals(['50 مل', '100 مل', '200 مل']), affectsStock: true },
  length: { key: 'length', name: 'الطول', kind: 'text', values: [], affectsStock: false },
  width: { key: 'width', name: 'العرض', kind: 'text', values: [], affectsStock: false },
  height: { key: 'height', name: 'الارتفاع', kind: 'text', values: [], affectsStock: false },
  material: { key: 'material', name: 'الخامة', kind: 'text', values: [], affectsStock: false },
};

const CLOTHING_SUBS = ['mens-fashion', 'womens-fashion', 'kids-clothing', 'traditional-fashion', 'workwear', 'sportswear', 'kids-clothing-toys', 'pet-clothing'];
const CAPACITY_SUBS = ['mobile-phones', 'computers-laptops', 'tablets-ereaders', 'storage-solutions'];
const FURNITURE_SUBS = ['furniture', 'kids-furniture', 'nursery-furniture', 'home-decor', 'bedding-bath', 'luggage'];
const VOLUME_SUBS = ['fragrances', 'skincare', 'hair-care', 'oils-fluids', 'beverages'];

// Preset keys suggested for a catalog/sub-catalog (by artikel.json slug).
export const suggestedPresets = (catalogSlug?: string, subSlug?: string): string[] => {
  if (subSlug === 'shoes') return ['shoeSize', 'color'];
  if (subSlug && CLOTHING_SUBS.includes(subSlug)) return ['size', 'color', 'material'];
  if (subSlug && CAPACITY_SUBS.includes(subSlug)) return ['capacity', 'color'];
  if (subSlug && FURNITURE_SUBS.includes(subSlug)) return ['color', 'length', 'width', 'height', 'material'];
  if (subSlug && VOLUME_SUBS.includes(subSlug)) return ['volume'];
  if (catalogSlug === 'food-beverages' || catalogSlug === 'pet-supplies') return ['weight'];
  if (catalogSlug === 'fashion') return ['size', 'color'];
  if (catalogSlug === 'jewelry-watches') return ['color', 'material'];
  if (catalogSlug === 'digital-products' || catalogSlug === 'digital-services') return [];
  return ['color', 'length', 'width', 'height'];
};

export const optionFromPreset = (key: string): ProductOption => {
  const p = SPEC_PRESETS[key];
  return { id: newId('opt'), name: p.name, kind: p.kind, values: p.values.map((v) => ({ ...v })), affectsStock: p.affectsStock };
};

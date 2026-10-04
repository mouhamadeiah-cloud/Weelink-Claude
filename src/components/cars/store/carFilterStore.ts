// The visitor's advanced car search (brand, model, year, price, km, fuel, gearbox, colour...),
// shared between the search bars, the advanced search window and the showroom's car list. Kept in
// memory for the visit only, like the text search.
import { useSyncExternalStore } from 'react';
import type { Car } from '../carTypes';

export interface CarFilters {
  brand: string;
  model: string;
  yearFrom: string;
  yearTo: string;
  priceFrom: string;
  priceTo: string;
  kmFrom: string;
  kmTo: string;
  fuel: string;
  transmission: string;
  body: string;
  color: string;
  condition: '' | 'new' | 'used';
  drive: string;
  specs: string;
  maxOwners: string;
  noAccidents: boolean;
  originalPaint: boolean;
}

export const EMPTY_CAR_FILTERS: CarFilters = {
  brand: '', model: '', yearFrom: '', yearTo: '', priceFrom: '', priceTo: '', kmFrom: '', kmTo: '',
  fuel: '', transmission: '', body: '', color: '', condition: '', drive: '', specs: '', maxOwners: '',
  noAccidents: false, originalPaint: false,
};

let filters: CarFilters = EMPTY_CAR_FILTERS;
const listeners = new Set<() => void>();

export const setCarFilters = (f: CarFilters) => {
  filters = f;
  listeners.forEach((l) => l());
};
export const clearCarFilters = () => setCarFilters(EMPTY_CAR_FILTERS);

export const useCarFilters = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => filters,
    () => filters
  );

const num = (v: string) => {
  const n = parseFloat(v.replace(/[,\s]/g, ''));
  return isFinite(n) ? n : null;
};

export const carMatchesFilters = (c: Car, f: CarFilters) => {
  const between = (value: number, from: string, to: string) => {
    const a = num(from), b = num(to);
    return (a === null || value >= a) && (b === null || value <= b);
  };
  return (
    (!f.brand || c.brand === f.brand) &&
    (!f.model || c.model === f.model) &&
    between(c.year, f.yearFrom, f.yearTo) &&
    // A car without a shown price only matches when no price range is asked for.
    ((!f.priceFrom && !f.priceTo) || (c.showPrice && c.price > 0 && between(c.price, f.priceFrom, f.priceTo))) &&
    between(c.condition === 'new' ? 0 : c.mileage, f.kmFrom, f.kmTo) &&
    (!f.fuel || c.fuel === f.fuel) &&
    (!f.transmission || c.transmission === f.transmission) &&
    (!f.body || c.bodyType === f.body) &&
    (!f.color || c.color === f.color) &&
    (!f.condition || c.condition === f.condition) &&
    (!f.drive || c.drive === f.drive) &&
    (!f.specs || c.specs === f.specs) &&
    (num(f.maxOwners) === null || (c.owners || 0) <= num(f.maxOwners)!) &&
    (!f.noAccidents || c.accidents === 'none') &&
    (!f.originalPaint || c.paint === 'original')
  );
};

// Short labels of what is asked for, shown above the results.
export const carFilterChips = (f: CarFilters): { key: keyof CarFilters | 'year' | 'price' | 'km'; label: string }[] => {
  const range = (from: string, to: string, unit = '') =>
    from && to ? `${from} - ${to}${unit}` : from ? `من ${from}${unit}` : `حتى ${to}${unit}`;
  const out: { key: keyof CarFilters | 'year' | 'price' | 'km'; label: string }[] = [];
  if (f.brand) out.push({ key: 'brand', label: f.brand });
  if (f.model) out.push({ key: 'model', label: f.model });
  if (f.yearFrom || f.yearTo) out.push({ key: 'year', label: `سنة ${range(f.yearFrom, f.yearTo)}` });
  if (f.priceFrom || f.priceTo) out.push({ key: 'price', label: `السعر ${range(f.priceFrom, f.priceTo)}` });
  if (f.kmFrom || f.kmTo) out.push({ key: 'km', label: `${range(f.kmFrom, f.kmTo, ' كم')}` });
  if (f.condition) out.push({ key: 'condition', label: f.condition === 'new' ? 'جديدة' : 'مستعملة' });
  (['fuel', 'transmission', 'body', 'color', 'drive', 'specs'] as const).forEach((k) => { if (f[k]) out.push({ key: k, label: f[k] }); });
  if (f.maxOwners) out.push({ key: 'maxOwners', label: f.maxOwners === '1' ? 'مالك واحد' : `حتى ${f.maxOwners} ملاك` });
  if (f.noAccidents) out.push({ key: 'noAccidents', label: 'بدون حوادث' });
  if (f.originalPaint) out.push({ key: 'originalPaint', label: 'دهان أصلي' });
  return out;
};

export const withoutChip = (f: CarFilters, key: string): CarFilters => {
  if (key === 'year') return { ...f, yearFrom: '', yearTo: '' };
  if (key === 'price') return { ...f, priceFrom: '', priceTo: '' };
  if (key === 'km') return { ...f, kmFrom: '', kmTo: '' };
  if (key === 'brand') return { ...f, brand: '', model: '' };
  if (key === 'noAccidents' || key === 'originalPaint') return { ...f, [key]: false };
  return { ...f, [key]: '' };
};

export const hasCarFilters = (f: CarFilters) => carFilterChips(f).length > 0;

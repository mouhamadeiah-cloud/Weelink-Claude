// The lists behind the owner's details in Wee AI: Syria's 14 governorates with their cities, villages
// and neighbourhoods (src/data/syria, one file per governorate), and the catalog of occupations
// (src/data/occupations.json: catalog → sub-catalog → occupations). The governorate is always one
// of the 14; every other field suggests from the lists and still takes any typed text. The files
// load only when their step opens.
import { useEffect, useState } from 'react';
import { normalizeArabic } from '../components/ui/ComboInput';

export { SYRIAN_GOVERNORATES } from './governorates';
import { SYRIAN_GOVERNORATES } from './governorates';

// A governorate: its cities (each with its neighbourhoods, when the list has real ones) and its
// countryside: districts (المنطقة) → sub-districts (الناحية) → villages. Every list is sorted
// alphabetically ignoring a leading «ال». 'urban' (دمشق) has cities only.
export interface GovernoratePlaces {
  governorate: string;
  type: 'urban' | 'mixed';
  cities: { name: string; areas: string[] }[];
  districts: { name: string; subdistricts: { name: string; villages: string[] }[] }[];
}

interface OccupationCatalog {
  name: string;
  subs: { name: string; jobs: string[] }[];
}

const governorateFiles = import.meta.glob<GovernoratePlaces>('../data/syria/*.json', { import: 'default' });

const loadGovernorate = (name: string): Promise<GovernoratePlaces | null> => {
  const n = SYRIAN_GOVERNORATES.indexOf(name) + 1;
  const load = n > 0 ? governorateFiles[`../data/syria/${String(n).padStart(2, '0')}.json`] : undefined;
  return load ? load() : Promise.resolve(null);
};

let occupations: Promise<OccupationCatalog[]> | null = null;
const loadOccupations = () =>
  (occupations ||= import('../data/occupations.json')
    .then((m) => m.default as OccupationCatalog[])
    .catch((err) => {
      occupations = null;
      throw err;
    }));

export const useGovernoratePlaces = (governorate: string) => {
  const [places, setPlaces] = useState<GovernoratePlaces | null>(null);
  useEffect(() => {
    let alive = true;
    setPlaces(null);
    loadGovernorate(governorate).then((p) => alive && setPlaces(p)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [governorate]);
  return places;
};

const useOccupations = (enabled = true) => {
  const [list, setList] = useState<OccupationCatalog[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    loadOccupations().then((l) => alive && setList(l)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [enabled]);
  return list;
};

// The neighbourhoods of a city of the governorate (none for a typed city).
export const areasOf = (places: GovernoratePlaces | null, city: string) =>
  places?.cities.find((c) => c.name === city.trim())?.areas || [];

// The sub-districts of a district; with no district chosen, all of the governorate's.
export const subdistrictsOf = (places: GovernoratePlaces | null, district: string) => {
  const d = places?.districts.find((d) => d.name === district.trim());
  return d ? d.subdistricts : (places?.districts || []).flatMap((d) => d.subdistricts);
};

// The villages of a sub-district; with none chosen, all villages of the district (or governorate).
export const villagesOf = (places: GovernoratePlaces | null, district: string, subdistrict: string) => {
  const subs = subdistrictsOf(places, district);
  const sub = subs.find((s) => s.name === subdistrict.trim());
  return sub ? sub.villages : subs.flatMap((s) => s.villages);
};

// The district and sub-district a sub-district or village name belongs to, so picking a village
// first fills the two fields above it.
export const findSubdistrict = (places: GovernoratePlaces | null, subdistrict: string) => {
  for (const d of places?.districts || []) {
    const s = d.subdistricts.find((s) => s.name === subdistrict);
    if (s) return { district: d.name, subdistrict: s.name };
  }
  return null;
};

export const findVillage = (places: GovernoratePlaces | null, village: string, district = '', subdistrict = '') => {
  for (const d of places?.districts || []) {
    if (district && d.name !== district) continue;
    for (const s of d.subdistricts) {
      if (subdistrict && s.name !== subdistrict) continue;
      if (s.villages.includes(village)) return { district: d.name, subdistrict: s.name, village };
    }
  }
  return null;
};

// --- Filling the address from a point on the map -------------------------------------------------

// What /api/geocode returns for a point (OpenStreetMap's names, most local first).
export interface GeocodedPoint {
  governorate: string;
  places: string[];
  neighbourhood: string;
  road: string;
  houseNumber: string;
}

// Map names often carry a word like «محافظة» or «ناحية» in front, and spell hamza and ة freely.
const placeKey = (s: string) =>
  normalizeArabic(s)
    .replace(/^(محافظه|منطقه|ناحيه|مدينه|قريه|بلده|حي|مركز)\s+/, '')
    .replace(/^ال/, '')
    .replace(/\s+/g, ' ');

const findName = (list: string[], name: string) => {
  const k = placeKey(name);
  return k ? list.find((n) => placeKey(n) === k) : undefined;
};

// Rough centres of the 14 governorates, where the map opens when the device's location is unknown.
export const GOVERNORATE_CENTERS: Record<string, [number, number]> = {
  'دمشق': [33.5138, 36.2765], 'ريف دمشق': [33.52, 36.45], 'حلب': [36.2021, 37.1343], 'حمص': [34.7324, 36.7137],
  'حماة': [35.1318, 36.7578], 'اللاذقية': [35.5317, 35.7915], 'طرطوس': [34.889, 35.8866], 'إدلب': [35.9306, 36.6339],
  'درعا': [32.6189, 36.1021], 'السويداء': [32.7089, 36.5695], 'القنيطرة': [33.1259, 35.8244], 'دير الزور': [35.3359, 40.1408],
  'الرقة': [35.9528, 39.0079], 'الحسكة': [36.5024, 40.7477],
};

// The address fields for a geocoded point, preferring the lists' spelling of each name (the
// neighbourhood falls back to the map's own name). Returns null when the point is outside Syria's
// 14 governorates.
export const addressFromPoint = async (point: GeocodedPoint) => {
  const governorate = findName(SYRIAN_GOVERNORATES, point.governorate);
  if (!governorate) return null;
  const places = await loadGovernorate(governorate).catch(() => null);
  const street = [point.road, point.houseNumber].filter(Boolean).join(' ');
  const empty = { governorate, placeType: 'city' as 'city' | 'rural', city: '', area: '', district: '', subdistrict: '', village: '', street };
  if (!places) return empty;

  const cityNames = places.cities.map((c) => c.name);
  const villages = places.districts.flatMap((d) => d.subdistricts.flatMap((s) => s.villages));
  const names = [point.neighbourhood, ...point.places].filter(Boolean);
  for (const name of point.places) {
    const city = findName(cityNames, name);
    if (city) {
      const areas = areasOf(places, city);
      const area = names.map((n) => findName(areas, n)).find(Boolean) || point.neighbourhood;
      return { ...empty, city, area };
    }
    if (places.type === 'urban') continue;
    const village = findName(villages, name);
    if (village) return { ...empty, placeType: 'rural' as const, ...findVillage(places, village)! };
  }
  // No city or village matched: the district (منطقة) or sub-district alone still narrows it down.
  if (places.type !== 'urban') {
    for (const name of point.places) {
      const sub = findName(subdistrictsOf(places, '').map((s) => s.name), name);
      if (sub) return { ...empty, placeType: 'rural' as const, ...findSubdistrict(places, sub)! };
      const district = findName(places.districts.map((d) => d.name), name);
      if (district) return { ...empty, placeType: 'rural' as const, district };
    }
  }
  return empty;
};

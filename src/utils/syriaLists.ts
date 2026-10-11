// The lists behind the owner's details in Wee AI: Syria's 14 governorates with their cities, villages
// and neighbourhoods (src/data/syria, one file per governorate), and the catalog of occupations
// (src/data/occupations.json: catalog → sub-catalog → occupations). The governorate is always one
// of the 14; every other field suggests from the lists and still takes any typed text. The files
// load only when their step opens.
import { useEffect, useState } from 'react';

export const SYRIAN_GOVERNORATES = [
  'دمشق', 'ريف دمشق', 'حلب', 'حمص', 'حماة', 'اللاذقية', 'طرطوس', 'إدلب', 'درعا', 'السويداء', 'القنيطرة', 'دير الزور', 'الرقة', 'الحسكة',
];

export interface GovernoratePlaces {
  governorate: string;
  cities: { name: string; areas: string[] }[];
  villages: { name: string; where: string }[]; // where: «الناحية · المنطقة»
}

export interface OccupationCatalog {
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

export const useOccupations = (enabled = true) => {
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

// The neighbourhoods of a city of the governorate (none for a village or a typed place).
export const areasOf = (places: GovernoratePlaces | null, city: string) =>
  places?.cities.find((c) => c.name === city.trim())?.areas || [];

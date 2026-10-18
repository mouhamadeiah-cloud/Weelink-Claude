// Where a published page is (Eyad, 18 Oct): the public part of the address its owner gave Wee AI
// (platform_directory/{uid}.addressInfo, owner-only, one per account), copied onto the published site
// when it is published, so Weelink's search pages can filter by governorate, city, neighbourhood or
// village and sort by distance. Nothing private: no phone, no details line, no personal name.
import { SYRIAN_GOVERNORATES } from '../utils/governorates';

export interface PublicPlace {
  governorate: string;
  placeType: 'city' | 'rural';
  city: string;
  area: string;
  district: string;
  subdistrict: string;
  village: string;
  street: string;
  lat: number | null;
  lng: number | null;
}

const str = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const coord = (v: unknown, lo: number, hi: number) => (typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : null);

// null when the owner gave no governorate of the 14.
export const placeFromAddress = (raw: any): PublicPlace | null => {
  const governorate = str(raw?.governorate);
  if (!SYRIAN_GOVERNORATES.includes(governorate)) return null;
  const rural = raw?.placeType === 'rural';
  const lat = coord(raw?.coordinates?.lat, -90, 90);
  const lng = coord(raw?.coordinates?.lng, -180, 180);
  return {
    governorate,
    placeType: rural ? 'rural' : 'city',
    city: rural ? '' : str(raw?.city),
    area: rural ? '' : str(raw?.area),
    district: rural ? str(raw?.district) : '',
    subdistrict: rural ? str(raw?.subdistrict) : '',
    village: rural ? str(raw?.village) : '',
    street: str(raw?.street, 200),
    lat: lat !== null && lng !== null ? lat : null,
    lng: lat !== null && lng !== null ? lng : null,
  };
};

// «اللاذقية، الرمل، شارع…» for a card.
export const placeLabel = (p: PublicPlace | null | undefined) =>
  p ? [p.governorate, p.city || p.village, p.area, p.street].filter(Boolean).join('، ') : '';

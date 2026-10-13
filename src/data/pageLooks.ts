// The 12 page looks («ستايل الصفحة») Eyad approved on 2026-10-13: two fonts and one palette each.
// A look restyles every page of the site at once (utils/applyPageLook); the editor shows each one
// as the specimen card of the approval page, filled with the owner's own name, texts and prices.

import type { Look } from './weeSlideTemplates';
import type { BuildKind } from '../services/pageBuilder';

export interface PageLook extends Look {
  id: string;
  name: string;
  forWho: string; // the trades it suits, shown under its name
  headWeight: number;
  radius: number; // buttons and cards, px (9999 = round)
  price: string; // prices and the eyebrow: the accent, lightened on dark pages
}

export const PAGE_LOOKS: PageLook[] = [
  { id: 'clear', name: 'واضح', forWho: 'أطباء، مدرّسين، فنيين، خدمات', bg: '#FFFFFF', card: '#F4F6F9', line: '#E2E5EA', ink: '#141A24', muted: '#5B6575', accent: '#1D5BD8', soft: '#E8EFFC', price: '#1D5BD8', head: 'IBM Plex Sans Arabic', body: 'IBM Plex Sans Arabic', headWeight: 700, radius: 10 },
  { id: 'luxe', name: 'فخم داكن', forWho: 'محامين، استشارات، مجوهرات، عطور', bg: '#0B111C', card: '#141D2E', line: '#22304A', ink: '#E7ECF3', muted: '#9AA6B8', accent: '#C9A24A', soft: '#1E1F21', price: '#C9A24A', head: 'Amiri', body: 'IBM Plex Sans Arabic', headWeight: 700, radius: 4 },
  { id: 'homey', name: 'بيتي دافي', forWho: 'مطاعم، مطابخ بيتية، حلويات، أفران', bg: '#FDF8F4', card: '#FFFFFF', line: '#EFDCCB', ink: '#3F261B', muted: '#7A5D50', accent: '#9A3412', soft: '#F6E6DC', price: '#9A3412', head: 'El Messiri', body: 'Tajawal', headWeight: 700, radius: 9999 },
  { id: 'fresh', name: 'منعش', forWho: 'فنانين، صالونات تجميل، أطفال، تصوير', bg: '#F1FAF8', card: '#FFFFFF', line: '#BFE7DF', ink: '#134E4A', muted: '#4B7A76', accent: '#0D9488', soft: '#DDF4EF', price: '#0D9488', head: 'Alexandria', body: 'Almarai', headWeight: 600, radius: 9999 },
  { id: 'bold', name: 'قوي', forWho: 'سيارات، نوادي رياضة، ورشات صيانة', bg: '#111214', card: '#1C1D21', line: '#2C2D33', ink: '#F4F4F5', muted: '#A1A1AA', accent: '#E11D2E', soft: '#2A1416', price: '#EF3340', head: 'Alexandria', body: 'Cairo', headWeight: 800, radius: 4 },
  { id: 'market', name: 'سوق', forWho: 'متاجر، ماركت، ألبسة، إلكترونيات', bg: '#FFFFFF', card: '#F4F7F1', line: '#DDE6D8', ink: '#18221A', muted: '#5C6B5E', accent: '#2F7D32', soft: '#E6F0E3', price: '#2F7D32', head: 'Readex Pro', body: 'IBM Plex Sans Arabic', headWeight: 700, radius: 10 },
  { id: 'heritage', name: 'تراثي', forWho: 'حلويات، عطارة، صابون غار، تحف', bg: '#F5EFE3', card: '#FBF7EE', line: '#E3D6BD', ink: '#2B2117', muted: '#6B5A47', accent: '#1E5B4A', soft: '#E2E4D6', price: '#1E5B4A', head: 'Aref Ruqaa', body: 'Noto Naskh Arabic', headWeight: 700, radius: 6 },
  { id: 'medical', name: 'طبي نظيف', forWho: 'صيدليات، مخابر، عيادات، علاج فيزيائي', bg: '#F4FBFC', card: '#FFFFFF', line: '#D3EAEE', ink: '#0F2F3A', muted: '#4D6670', accent: '#0E7490', soft: '#DCEFF3', price: '#0E7490', head: 'Noto Kufi Arabic', body: 'IBM Plex Sans Arabic', headWeight: 700, radius: 10 },
  { id: 'soft', name: 'ناعم', forWho: 'صالونات، هدايا، ألعاب أطفال، ورد', bg: '#FFF6F8', card: '#FFFFFF', line: '#F3D9E1', ink: '#4A1D2C', muted: '#7D5563', accent: '#C2416B', soft: '#F8E1E8', price: '#C2416B', head: 'Lemonada', body: 'Tajawal', headWeight: 600, radius: 9999 },
  { id: 'mono', name: 'أبيض وأسود', forWho: 'ألبسة، مصورين، مهندسين، ديكور', bg: '#FFFFFF', card: '#F2F2F2', line: '#DDDDDD', ink: '#0A0A0A', muted: '#555555', accent: '#0A0A0A', soft: '#EDEDED', price: '#0A0A0A', head: 'Changa', body: 'IBM Plex Sans Arabic', headWeight: 700, radius: 0 },
  { id: 'gold', name: 'ذهبي فاتح', forWho: 'صالات أفراح، حفلات، مجوهرات، فنادق', bg: '#FBF8F1', card: '#FFFFFF', line: '#EADFC6', ink: '#2A2418', muted: '#6E6450', accent: '#A67C2E', soft: '#F2EADA', price: '#8F6A24', head: 'Reem Kufi', body: 'Almarai', headWeight: 700, radius: 4 },
  { id: 'tech', name: 'تقني', forWho: 'موبايلات، كمبيوتر، برمجة، شبكات', bg: '#0D1424', card: '#16213A', line: '#24324F', ink: '#E6ECF7', muted: '#9AA8C2', accent: '#4F8CFF', soft: '#16264A', price: '#7AA7FF', head: 'Kufam', body: 'IBM Plex Sans Arabic', headWeight: 700, radius: 10 },
];

export const pageLookById = (id: string | undefined) => PAGE_LOOKS.find((l) => l.id === id);

// The looks that suit each kind of page come first in the picker.
const FIRST_FOR: Record<BuildKind, string[]> = {
  restaurant: ['homey', 'luxe', 'market', 'heritage'],
  shop: ['market', 'clear', 'soft', 'gold'],
  cars: ['bold', 'luxe', 'tech', 'mono'],
  free: ['clear', 'fresh', 'medical', 'soft'],
};

export const looksFor = (kind: BuildKind): PageLook[] => {
  const first = FIRST_FOR[kind] || [];
  return [...first.map((id) => pageLookById(id)!), ...PAGE_LOOKS.filter((l) => !first.includes(l.id))];
};

export const suitsKind = (look: PageLook, kind: BuildKind) => (FIRST_FOR[kind] || []).includes(look.id);

// The looks' type scale on the 1280-wide canvas: hero, section title, card title, lead, text, small.
export const TYPE_SCALE = [64, 44, 28, 20, 17, 14];

/** The nearest size of the scale. */
export const typeSize = (size: number) => TYPE_SCALE.reduce((best, s) => (Math.abs(s - size) < Math.abs(best - size) ? s : best));

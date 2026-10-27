// «شرائح البحث» (Eyad, 27 Oct): one slim search slide for each of the five kinds of page (the restaurant's menu,
// the shop, the car showroom, a rental and a hotel), each on a colour of its own and holding only the search bar.
// The bar's «بحث متقدم» opens the filters window of its kind. A rental of cars uses the cars slide; any other
// rental uses the rental one (its items). Placed under the intro slide, so a visitor can search from the front page.
import { typeSize } from './pageLooks';

interface SearchSlide {
  label: string; // the kind of page
  background: string;
  accent: string;
  type: 'shopSearch' | 'carSearch';
  look: 'minimal' | 'pill' | 'glass';
  placeholder: string;
  kind?: 'menu'; // a shopSearch that looks through dishes
}

export const SEARCH_READY: SearchSlide[] = [
  { label: 'المطعم', background: '#FFE9D6', accent: '#D9480F', type: 'shopSearch', look: 'pill', placeholder: 'ابحث عن طبق أو مشروب...', kind: 'menu' },
  { label: 'المتجر', background: '#E3F0FF', accent: '#1C64C8', type: 'shopSearch', look: 'pill', placeholder: 'ابحث عن منتج...' },
  { label: 'السيارات', background: '#1E1E24', accent: '#E03131', type: 'carSearch', look: 'glass', placeholder: 'ابحث بالماركة أو الموديل أو السنة...' },
  { label: 'التأجير', background: '#E6F6EC', accent: '#2B8A3E', type: 'shopSearch', look: 'pill', placeholder: 'شو بدك تستأجر؟' },
  { label: 'الفنادق والمساحات', background: '#EDE7F6', accent: '#6741D9', type: 'shopSearch', look: 'pill', placeholder: 'شو بدك تحجز؟' },
];

export const searchReadySlide = (s: SearchSlide) => ({
  name: `بحث ${s.label}`,
  height: 110,
  backgroundColor: s.background,
  elements: [
    {
      type: s.type,
      name: s.type === 'carSearch' ? 'بحث عن سيارة' : s.kind === 'menu' ? 'بحث في المنيو' : 'بحث',
      x: 240,
      y: 25,
      width: 800,
      height: 60,
      content: s.placeholder,
      styles: { color: s.accent, fontSize: typeSize(16) },
      shopSearchStyle: s.look,
      ...(s.kind ? { shopSearchKind: s.kind } : {}),
    },
  ],
});

// 18. Clothes and shoes shop. Look «أبيض وأسود»; two tall editorial photos either side of the headline; a navbar with
// icon-only entries; a six-tile category grid; ratings. (No cart or product elements: it is a plain page.)
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('mono');
const k = new Kit(L);
const INK = '#0A0A0A';

const hero = [
  k.image({ x: 0, y: 0, width: 420, height: 720 }, 'women fashion editorial street', { borderWidth: 0 }),
  k.image({ x: 860, y: 0, width: 420, height: 720 }, 'sneakers shoes studio minimal', { borderWidth: 0, imageFilter: 'grayscale' }),
  k.shape({ x: 420, y: 0, width: 440, height: 720 }, { backgroundColor: 'rgba(255,255,255,0.9)' }, 'لوحة'),
  k.shape({ x: 420, y: 0, width: 4, height: 720 }, { backgroundColor: INK }, 'خط'),
  k.shape({ x: 856, y: 0, width: 4, height: 720 }, { backgroundColor: INK }, 'خط'),
  k.eyebrow({ x: 440, y: 170, width: 400, height: 26 }, 'مجموعة الموسم', { textAlign: 'center', color: INK, letterSpacing: 4 }),
  k.heading({ x: 440, y: 214, width: 400, height: 200 }, 'أناقة تمشي معك', 54, { textAlign: 'center', color: INK, animation: 'fade', animationTrigger: 'once' }),
  k.line({ x: 540, y: 440, width: 200, height: 3 }, 'line-double', INK),
  k.text({ x: 450, y: 470, width: 380, height: 60 }, 'ملابس وأحذية وإكسسوارات لكل يوم ولكل مناسبة.', 17, { textAlign: 'center' }),
  k.button({ x: 490, y: 560, width: 300, height: 56 }, 'تسوّق المجموعة', { slide: 2 }, { backgroundColor: INK, color: '#FFFFFF', borderRadius: 0, animation: 'pulse', animationTrigger: 'loop', animationDuration: 3 }),
];

const tiles = [
  k.heading({ x: 484, y: 70, width: 700, height: 64 }, 'تسوّق حسب القسم', 46),
  k.line({ x: 884, y: 150, width: 300, height: 3 }, 'line-gradient', INK),
  ...[['نسائي', 'women dresses fashion'], ['رجالي', 'men suits fashion'], ['أحذية', 'leather shoes collection'], ['رياضي', 'sportswear sneakers'], ['حقائب', 'handbags leather'], ['أطفال', 'kids clothes colorful']].flatMap(([name, q], i) => {
    const x = 840 - (i % 3) * 372;
    const y = 200 + Math.floor(i / 3) * 330;
    return [
      k.image({ x, y, width: 344, height: 300 }, q, { borderWidth: i % 2 ? 6 : 0, borderColor: INK, borderStyle: 'solid', imageFilter: i % 2 ? 'grayscale' : undefined, animation: 'scale-up', animationTrigger: 'hover' }),
      k.glass({ x: x + 20, y: y + 232, width: 304, height: 52 }, true, { borderRadius: 0, backgroundColor: 'rgba(10,10,10,0.7)' }),
      k.heading({ x: x + 30, y: y + 238, width: 284, height: 40 }, name, 24, { color: '#FFFFFF', textAlign: 'center' }),
    ];
  }),
];

const loved = [
  k.shape({ x: 0, y: 0, width: 1280, height: 720 }, { backgroundColor: INK }, 'خلفية'),
  k.heading({ x: 484, y: 70, width: 700, height: 64 }, 'ما يحبه زبائننا', 46, { color: '#FFFFFF', textEffect: 'outline-fill', textEffectColor: '#FFFFFF', textEffectIntensity: 40 }),
  k.ratings({ x: 96, y: 190, width: 560, height: 300 }, '#FACC15', { borderRadius: 0 }),
  ...[['mdi:truck-fast-outline', 'شحن سريع'], ['mdi:cached', 'استبدال خلال 14 يوماً'], ['mdi:ruler', 'مقاسات كاملة']].flatMap(([ic, t], i) => [
    k.icon({ x: 1140, y: 200 + i * 100, width: 44, height: 44 }, ic, '#FFFFFF'),
    k.text({ x: 700, y: 208 + i * 100, width: 420, height: 30 }, t, 22, { color: '#FFFFFF', fontWeight: 'bold' }),
    k.line({ x: 700, y: 262 + i * 100, width: 484, height: 2 }, 'line-dotted', 'rgba(255,255,255,0.4)'),
  ]),
  k.button({ x: 934, y: 560, width: 250, height: 60 }, 'ابدأ التسوق', undefined, { backgroundColor: '#FFFFFF', color: INK, borderRadius: 0 }),
];

const page: PageSpec = {
  key: 'fashion',
  name: 'متجر ملابس وأحذية',
  category: 'p-shop',
  look: L,
  navbar: { brand: 'مودا ستور', items: [{ label: 'الأقسام', slide: 2 }, { label: 'آراء الزبائن', slide: 3 }], cta: { label: 'تسوّق', slide: 2 }, bg: '#FFFFFF', text: '#0A0A0A', accent: '#0A0A0A', sticky: true, borderRadius: 0, borderColor: '#0A0A0A', borderWidth: 2,
    icons: { 'item-1': { icon: 'mdi:hanger', mode: 'icon' }, 'item-2': { icon: 'mdi:star-outline', mode: 'icon' } } },
  slides: [
    { name: 'المدخل', height: 720, bg: { image: 'clothing store interior fashion rack', fixed: true }, divider: 'straight', elements: hero },
    { name: 'الأقسام', height: 860, bg: { color: '#FFFFFF' }, divider: 'tilt-right', elements: tiles },
    { name: 'آراء الزبائن', height: 720, bg: { color: INK }, divider: 'straight', elements: loved },
  ],
};
export default page;

// 13. Grill and shawarma restaurant. Look «قوي»; a grilled-meat photo hero with a hexagon photo; a fire-gradient headline;
// a two-column price list with dotted leaders.
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('bold');
const k = new Kit(L);
const FIRE = '#F97316';
const RED = L.accent;

const hero = [
  k.shape({ x: 0, y: 0, width: 1280, height: 720 }, { backgroundColor: 'linear-gradient(270deg, rgba(17,18,20,0.9) 0%, rgba(17,18,20,0.55) 60%, rgba(17,18,20,0.35) 100%)' }, 'تعتيم'),
  k.shape({ x: 90, y: 150, width: 440, height: 440 }, { backgroundColor: 'transparent', borderWidth: 6, borderColor: FIRE, borderStyle: 'solid', borderRadius: 0, glowColor: FIRE, glowIntensity: 24 }, 'إطار'),
  k.image({ x: 104, y: 164, width: 412, height: 412 }, 'shawarma grill meat', { borderWidth: 0 }, { clipPath: 'clip-shape-geo-hexagon' }),
  k.badge({ x: 904, y: 160, width: 280, height: 38 }, 'مشاوي وشاورما على الفحم', { backgroundColor: FIRE, color: '#111214' }),
  k.heading({ x: 584, y: 214, width: 600, height: 170 }, 'نار وفحم ونكهة أصلية', 66, { color: '#FFFFFF', textEffect: 'gradient-move', textEffectColor: FIRE, textEffectColor2: '#FDE047', textEffectIntensity: 60, animation: 'slide-up', animationTrigger: 'once' }),
  k.text({ x: 644, y: 404, width: 540, height: 70 }, 'لحوم طازجة تُشوى أمامك وبهارات سرية من الشام.', 20, { color: 'rgba(255,255,255,0.9)' }),
  k.button({ x: 954, y: 520, width: 230, height: 58 }, 'اطلب توصيل', { slide: 3 }, { backgroundColor: FIRE, color: '#111214', borderRadius: 6, glowColor: FIRE, glowIntensity: 20, animation: 'pulse', animationTrigger: 'loop', animationDuration: 2 }),
  k.button({ x: 704, y: 520, width: 230, height: 58 }, 'القائمة', { slide: 2 }, { backgroundColor: 'transparent', color: '#FFFFFF', borderWidth: 2, borderColor: '#FFFFFF', borderStyle: 'solid', borderRadius: 6 }),
];

const rows: [string, string][] = [['شاورما دجاج', '3.5$'], ['شاورما لحمة', '4.5$'], ['مشاوي مشكلة', '12$'], ['كباب حلبي', '8$'], ['فروج مشوي', '9$'], ['حمص ومتبل', '2.5$']];
const menu = [
  k.shape({ x: 0, y: 0, width: 1280, height: 800 }, { backgroundColor: '#1C1D21' }, 'خلفية'),
  k.heading({ x: 484, y: 70, width: 700, height: 64 }, 'قائمة الشواء', 50, { color: '#FFFFFF', textEffect: 'stamp', textEffectColor: FIRE, textEffectIntensity: 40 }),
  k.line({ x: 884, y: 150, width: 300, height: 4 }, 'line-zigzag', FIRE),
  k.shape({ x: 639, y: 200, width: 2, height: 270 }, { backgroundColor: 'rgba(249,115,22,0.5)' }, 'فاصل'),
  ...rows.flatMap(([name, price], i) => {
    const x = i % 2 === 0 ? 704 : 96;
    const y = 200 + Math.floor(i / 2) * 96;
    return [
      k.text({ x: x + 130, y, width: 350, height: 40 }, name, 26, { color: '#FFFFFF', fontWeight: 'bold' }),
      k.text({ x, y, width: 110, height: 40 }, price, 26, { color: FIRE, fontWeight: 'bold', textAlign: 'left' }),
    ];
  }),
  k.gallery({ x: 96, y: 520, width: 1088, height: 240 }, 'top-main', ['grilled kebab skewers charcoal#0', 'grilled kebab skewers charcoal#1', 'grilled kebab skewers charcoal#2'], { borderRadius: 6 }, 8, 6),
];

const deliver = [
  k.shape({ x: 0, y: 0, width: 1280, height: 640 }, { backgroundColor: 'linear-gradient(135deg, #DC2626 0%, #F97316 100%)' }, 'خلفية'),
  k.shape({ x: 860, y: -140, width: 520, height: 520 }, { backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 9999 }, 'دائرة'),
  k.heading({ x: 484, y: 110, width: 700, height: 120 }, 'جوعان؟ نوصّلك سخن', 58, { color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.3)', textShadowIntensity: 12, textShadowPosition: 'bottom' }),
  k.text({ x: 584, y: 250, width: 600, height: 70 }, 'توصيل خلال 30 دقيقة داخل المدينة، وطلب مسبق للمناسبات والعزائم.', 20, { color: 'rgba(255,255,255,0.95)' }),
  ...[['mdi:moped-outline', '30 دقيقة'], ['mdi:fire', 'على الفحم'], ['mdi:food-turkey', 'عزائم']].flatMap(([ic, t], i) => [
    k.shape({ x: 940 - i * 280, y: 370, width: 244, height: 120 }, { backgroundColor: 'rgba(17,18,20,0.35)', borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', borderStyle: 'solid' }, 'إطار'),
    k.icon({ x: 1130 - i * 280, y: 396, width: 44, height: 44 }, ic, '#FFFFFF'),
    k.heading({ x: 960 - i * 280, y: 420, width: 150, height: 50 }, t, 26, { color: '#FFFFFF', textAlign: 'right' }),
  ]),
  k.button({ x: 934, y: 530, width: 250, height: 60 }, 'اطلب الآن', undefined, { backgroundColor: '#111214', color: '#FFFFFF', borderRadius: 6, glowColor: '#000000', glowIntensity: 14 }),
];

const page: PageSpec = {
  key: 'grill',
  name: 'مطعم مشاوي وشاورما',
  category: 'p-restaurant',
  look: L,
  navbar: { brand: 'مشاوي الفحام', items: [{ label: 'القائمة', slide: 2 }, { label: 'التوصيل', slide: 3 }], cta: { label: 'اطلب الآن', slide: 3 }, bg: '#111214', text: '#FFFFFF', accent: '#F97316', accentText: '#111214', sticky: true, borderRadius: 0, glow: { color: '#F97316', intensity: 10 } },
  slides: [
    { name: 'المدخل', height: 720, bg: { image: 'charcoal grill meat flames', fixed: true }, divider: 'zigzag', elements: hero },
    { name: 'القائمة', height: 800, bg: { color: '#1C1D21' }, divider: 'curve-down', elements: menu },
    { name: 'التوصيل', height: 640, bg: { color: '#DC2626' }, divider: 'straight', elements: deliver },
  ],
};
export default page;

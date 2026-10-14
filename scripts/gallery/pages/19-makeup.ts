// 19. Makeup shop. Look «ناعم»; a perfume-and-oils video hero; a navbar floating bottom-left; heart and capsule
// photo cuts; ratings.
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('soft');
const k = new Kit(L);
const A = L.accent;
const ROSE = '#F9A8D4';

const hero = [
  k.shape({ x: 0, y: 0, width: 1280, height: 720 }, { backgroundColor: 'linear-gradient(90deg, rgba(74,29,44,0.8) 0%, rgba(74,29,44,0.25) 100%)' }, 'تعتيم'),
  k.shape({ x: 120, y: 120, width: 360, height: 360 }, { backgroundColor: 'transparent', borderWidth: 3, borderColor: 'rgba(249,168,212,0.6)', borderStyle: 'solid', borderRadius: 9999, glowColor: ROSE, glowIntensity: 22 }, 'حلقة'),
  k.shape({ x: 190, y: 190, width: 220, height: 220 }, { backgroundColor: 'rgba(249,168,212,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', borderStyle: 'solid', borderRadius: 9999 }, 'حلقة'),
  k.badge({ x: 904, y: 180, width: 280, height: 38 }, 'مكياج وعناية وعطور', { backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderStyle: 'solid' }),
  k.heading({ x: 504, y: 234, width: 680, height: 150 }, 'أبرزي جمالك الطبيعي', 56, { color: '#FFFFFF', textEffect: 'shine', textEffectColor: '#FFFFFF', textEffectIntensity: 55, animation: 'slide-up', animationTrigger: 'once' }),
  k.text({ x: 604, y: 400, width: 580, height: 70 }, 'ماركات أصلية للمكياج والعناية بأسعار منافسة وشحن لكل المحافظات.', 19, { color: 'rgba(255,255,255,0.92)' }),
  k.button({ x: 964, y: 510, width: 220, height: 56 }, 'تسوّقي الآن', { slide: 2 }, { backgroundColor: ROSE, color: '#4A1D2C', glowColor: ROSE, glowIntensity: 20, animation: 'heartbeat', animationTrigger: 'loop', animationDuration: 2.8 }),
  k.button({ x: 734, y: 510, width: 210, height: 56 }, 'أكثر مبيعاً', { slide: 3 }, { backgroundColor: 'transparent', color: '#FFFFFF', borderWidth: 2, borderColor: '#FFFFFF', borderStyle: 'solid' }),
];

const items = [
  k.eyebrow({ x: 884, y: 70, width: 300, height: 24 }, 'منتجاتنا'),
  k.heading({ x: 384, y: 98, width: 800, height: 64 }, 'لكل لمسة أداتها', 34),
  ...[['أحمر شفاه', '12$', 'lipstick red makeup', 'clip-shape-geo-heart'], ['كريم أساس', '24$', 'foundation makeup bottle', 'clip-shape-geo-circle'], ['باليت ظلال', '28$', 'eyeshadow palette colorful', 'clip-shape-geo-capsule'], ['عطر زهري', '45$', 'perfume bottle pink', 'clip-shape-geo-hexagon']].flatMap(([name, price, q, clip], i) => {
    const x = 940 - i * 280;
    return [
      k.card({ x, y: 210, width: 244, height: 380 }, { borderRadius: 32, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#F3D9E1', glowColor: ROSE, glowIntensity: 10, glowPosition: 'bottom', animation: 'float', animationTrigger: 'hover' }),
      k.image({ x: x + 22, y: 232, width: 200, height: 200 }, q, { borderWidth: 0 }, { clipPath: clip }),
      k.heading({ x: x + 14, y: 452, width: 216, height: 38 }, name, 22, { textAlign: 'center' }),
      k.heading({ x: x + 14, y: 494, width: 216, height: 36 }, price, 26, { textAlign: 'center', color: A }),
      k.button({ x: x + 40, y: 538, width: 164, height: 38 }, 'أضيفي للسلة', { slide: 3 }, { fontSize: 14 }),
    ];
  }),
  k.gallery({ x: 96, y: 630, width: 1088, height: 280 }, 'left-thumbnails', ['makeup brushes flatlay', 'skincare products pink', 'beauty vanity table', 'lipstick collection'], { borderRadius: 28 }, 10, 22),
];

const loved = [
  k.shape({ x: 0, y: 0, width: 1280, height: 820 }, { backgroundColor: 'linear-gradient(160deg, #FFE4EC 0%, #F8E1E8 50%, #E9D5FF 100%)' }, 'خلفية'),
  k.shape({ x: 880, y: -100, width: 480, height: 480 }, { backgroundColor: 'rgba(194,65,107,0.10)', borderRadius: 9999 }, 'دائرة'),
  k.heading({ x: 384, y: 70, width: 800, height: 64 }, 'جميلات اخترننا', 36, { color: '#4A1D2C' }),
  k.ratings({ x: 664, y: 190, width: 520, height: 300 }, '#F59E0B', { borderRadius: 28 }),
  ...[['mdi:certificate-outline', 'منتجات أصلية 100%'], ['mdi:gift-outline', 'تغليف هدايا مجاني'], ['mdi:truck-fast-outline', 'شحن خلال 48 ساعة']].flatMap(([ic, t], i) => [
    k.shape({ x: 96, y: 190 + i * 104, width: 520, height: 84 }, { backgroundColor: '#FFFFFF', borderRadius: 42, borderWidth: 2, borderColor: '#F3D9E1', borderStyle: 'solid' }, 'شريط'),
    k.icon({ x: 548, y: 212 + i * 104, width: 40, height: 40 }, ic, A),
    k.text({ x: 130, y: 214 + i * 104, width: 390, height: 32 }, t, 20, { fontWeight: 'bold', color: '#4A1D2C' }),
  ]),
  k.button({ x: 934, y: 560, width: 250, height: 60 }, 'ابدئي التسوق', undefined, { glowColor: ROSE, glowIntensity: 18 }),
];

const page: PageSpec = {
  key: 'makeup',
  name: 'متجر مكياج وعناية',
  category: 'p-shop',
  look: L,
  navbar: { brand: 'بيوتي بوكس', items: [{ label: 'المنتجات', slide: 2 }, { label: 'آراء', slide: 3 }], cta: { label: 'تسوقي', slide: 2 }, bg: '#4A1D2C', text: '#FFFFFF', accent: ROSE, accentText: '#4A1D2C', sticky: true, posX: 4, posY: 96, width: 52, opacity: 0.92, borderRadius: 40, glow: { color: ROSE, intensity: 14 } },
  slides: [
    { name: 'المدخل', height: 720, bg: { video: '6707573' }, divider: 'clouds', elements: hero },
    { name: 'المنتجات', height: 940, bg: { color: L.bg }, divider: 'curve-down', elements: items },
    { name: 'آراء', height: 820, bg: { color: '#F8E1E8' }, divider: 'straight', innerGlow: { color: '#F9A8D4', intensity: 60, position: 'top' }, elements: loved },
  ],
};
export default page;

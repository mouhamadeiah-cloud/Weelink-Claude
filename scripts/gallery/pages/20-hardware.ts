// 20. Hand tools and building materials. Look «سوق»; a plain graphite hero with hazard stripes and a turning gear (no
// photo or video); a wide navbar with framed names; a wholesale price table.
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('market');
const k = new Kit(L);
const GRAPH = '#18221A';
const YELLOW = '#FACC15';
const GREEN = L.accent;

const hero = [
  k.shape({ x: 0, y: 640, width: 1280, height: 60 }, { backgroundColor: YELLOW }, 'شريط تحذير'),
  ...Array.from({ length: 9 }, (_, i) => k.shape({ x: -40 + i * 160, y: 640, width: 70, height: 60, rotation: 0 }, { backgroundColor: GRAPH, opacity: 0.95 }, 'شريط')),
  k.icon({ x: 120, y: 130, width: 340, height: 340 }, 'mdi:cog', 'rgba(250,204,21,0.9)', { animation: 'spin-slow', animationTrigger: 'loop', animationDuration: 24 }),
  k.icon({ x: 340, y: 330, width: 190, height: 190 }, 'mdi:cog-outline', 'rgba(255,255,255,0.6)', { animation: 'spin-slow', animationTrigger: 'loop', animationDuration: 16 }),
  k.badge({ x: 904, y: 150, width: 280, height: 38 }, 'عدد يدوية وكهربائية ومواد بناء', { backgroundColor: YELLOW, color: GRAPH, borderRadius: 4 }),
  k.heading({ x: 504, y: 206, width: 680, height: 160 }, 'كل ما يحتاجه ورشتك وبناؤك', 58, { color: '#FFFFFF', textEffect: 'shadow-hard', textEffectColor: YELLOW, textEffectIntensity: 45, animation: 'slide-up', animationTrigger: 'once' }),
  k.text({ x: 604, y: 392, width: 580, height: 70 }, 'جملة ومفرق: عدد، دهانات، سباكة، كهرباء، إسمنت وبلاط بأسعار الجملة.', 20, { color: 'rgba(255,255,255,0.9)' }),
  k.button({ x: 954, y: 500, width: 230, height: 58 }, 'اطلب عرض جملة', { slide: 3 }, { backgroundColor: YELLOW, color: GRAPH, borderRadius: 4, glowColor: YELLOW, glowIntensity: 16 }),
  k.button({ x: 704, y: 500, width: 230, height: 58 }, 'الأقسام', { slide: 2 }, { backgroundColor: 'transparent', color: '#FFFFFF', borderWidth: 3, borderColor: '#FFFFFF', borderStyle: 'solid', borderRadius: 4 }),
];

const sections = [
  k.eyebrow({ x: 884, y: 70, width: 300, height: 24 }, 'أقسامنا'),
  k.heading({ x: 484, y: 98, width: 700, height: 64 }, 'ابحث في قسمك', 46),
  k.line({ x: 884, y: 176, width: 300, height: 4 }, 'line-zigzag', YELLOW),
  ...[['mdi:hammer-wrench', 'عدد يدوية'], ['mdi:flash-outline', 'عدد كهربائية'], ['mdi:format-paint', 'دهانات'], ['mdi:pipe-wrench', 'سباكة'], ['mdi:lightbulb-outline', 'كهرباء'], ['mdi:wall', 'إسمنت وبلاط']].flatMap(([ic, name], i) => {
    const x = 840 - (i % 3) * 372;
    const y = 220 + Math.floor(i / 3) * 190;
    return [
      k.card({ x, y, width: 344, height: 160 }, { borderRadius: 4, borderWidth: i % 2 ? 2 : 5, borderColor: i % 2 ? L.line : YELLOW, borderStyle: 'solid', animation: 'float', animationTrigger: 'hover' }),
      k.shape({ x: x + 250, y: y + 24, width: 76, height: 76 }, { backgroundColor: GRAPH, borderRadius: 4 }, 'مربع'),
      k.icon({ x: x + 264, y: y + 38, width: 48, height: 48 }, ic, YELLOW),
      k.heading({ x: x + 20, y: y + 108, width: 304, height: 38 }, name, 24),
    ];
  }),
  k.gallery({ x: 96, y: 620, width: 1088, height: 260 }, 'right-thumbnails', ['hardware store tools wall', 'power tools workshop', 'building materials cement bricks', 'paint buckets colorful'], { borderRadius: 4 }, 8, 4),
];

const wholesale = [
  k.shape({ x: 0, y: 0, width: 1280, height: 760 }, { backgroundColor: GRAPH }, 'خلفية'),
  k.heading({ x: 484, y: 70, width: 700, height: 64 }, 'أسعار الجملة', 48, { color: '#FFFFFF' }),
  k.shape({ x: 884, y: 142, width: 300, height: 10 }, { backgroundColor: YELLOW }, 'شريط'),
  k.table({ x: 664, y: 190, width: 520, height: 330 }, [['الصنف', 'الوحدة', 'السعر'], ['إسمنت 50 كغ', 'كيس', '7.5$'], ['حديد تسليح 12 مم', 'طن', '690$'], ['دهان داخلي 18 ل', 'علبة', '38$'], ['أنبوب سباكة 1 إنش', 'متر', '1.8$'], ['بلاط سيراميك', 'متر مربع', '9$']], YELLOW, { borderRadius: 8 }),
  k.text({ x: 96, y: 200, width: 520, height: 120 }, 'الأسعار تقريبية وتتغير حسب الكمية. اطلب عرضاً مكتوباً لمشروعك.', 20, { color: '#E5E7EB' }),
  k.ratings({ x: 96, y: 330, width: 520, height: 280 }, YELLOW, { borderRadius: 8 }),
  k.button({ x: 934, y: 580, width: 250, height: 60 }, 'اطلب عرض سعر', undefined, { backgroundColor: YELLOW, color: GRAPH, borderRadius: 4, glowColor: YELLOW, glowIntensity: 18, animation: 'pulse', animationTrigger: 'loop', animationDuration: 2.4 }),
];

const page: PageSpec = {
  key: 'hardware',
  name: 'عدد صناعية ومواد بناء',
  category: 'p-shop',
  look: L,
  navbar: { brand: 'سوق العدّة', items: [{ label: 'الأقسام', slide: 2 }, { label: 'أسعار الجملة', slide: 3 }], cta: { label: 'اتصل بنا', slide: 3 }, bg: '#18221A', text: '#FFFFFF', accent: '#FACC15', accentText: '#18221A', sticky: true, borderRadius: 0, height: 72,
    itemsFrame: { bg: 'transparent', border: '#FACC15', borderWidth: 2, radius: 2 } },
  slides: [
    { name: 'المدخل', height: 700, bg: { color: GRAPH }, divider: 'tilt-right', elements: hero },
    { name: 'الأقسام', height: 920, bg: { color: '#FFFFFF' }, divider: 'straight', elements: sections },
    { name: 'الجملة', height: 760, bg: { color: GRAPH }, divider: 'straight', elements: wholesale },
  ],
};
export default page;

// 16. Car showroom B (premium and classic cars). Look «فخم داكن»; a night car photo hero; a slim icon-only navbar
// column; performance bars drawn with shapes; ratings.
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('luxe');
const k = new Kit(L);
const GOLD = L.accent;

// The navbar column (icons only, 90px) takes the right edge: content sits in x 70..1150.
const hero = [
  k.shape({ x: 0, y: 0, width: 1280, height: 740 }, { backgroundColor: 'linear-gradient(90deg, rgba(11,17,28,0.2) 0%, rgba(11,17,28,0.9) 100%)' }, 'تعتيم'),
  k.heading({ x: 40, y: 360, width: 700, height: 220 }, 'نخبة', 200, { color: 'transparent', textEffect: 'hollow', textEffectColor: GOLD, textEffectIntensity: 50, opacity: 0.55, textAlign: 'left' }),
  k.eyebrow({ x: 700, y: 170, width: 450, height: 26 }, 'سيارات فاخرة وكلاسيكية مختارة', { color: GOLD, letterSpacing: 3 }),
  k.heading({ x: 520, y: 210, width: 630, height: 160 }, 'القيادة كما يجب أن تكون', 62, { textEffect: 'gold', textEffectIntensity: 55, animation: 'fade', animationTrigger: 'once' }),
  k.text({ x: 600, y: 390, width: 550, height: 80 }, 'كل سيارة تُفحص وتُوثّق ويُسلَّم معها ملف كامل لتاريخها.', 20, { color: 'rgba(231,236,243,0.9)' }),
  k.button({ x: 930, y: 520, width: 220, height: 56 }, 'شاهد المجموعة', { slide: 2 }, { backgroundColor: GOLD, color: '#1A1405', glowColor: GOLD, glowIntensity: 18, borderRadius: 4 }),
  k.line({ x: 520, y: 640, width: 630, height: 2 }, 'line-gradient', GOLD),
];

const bar = (x: number, y: number, label: string, pct: number, value: string) => [
  k.text({ x: x + 270, y, width: 120, height: 26 }, label, 15, { color: L.muted }),
  k.shape({ x, y: y + 6, width: 250, height: 10 }, { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 9999 }, 'مقياس'),
  k.shape({ x: x + 250 - Math.round(250 * pct), y: y + 6, width: Math.round(250 * pct), height: 10 }, { backgroundColor: GOLD, borderRadius: 9999, glowColor: GOLD, glowIntensity: 8 }, 'مقياس'),
  k.text({ x: x - 4, y: y - 2, width: 80, height: 24 }, value, 14, { color: '#FFFFFF', fontWeight: 'bold', textAlign: 'left' }),
];

const collection = [
  k.heading({ x: 500, y: 70, width: 650, height: 64 }, 'مجموعة هذا الموسم', 46),
  k.line({ x: 850, y: 150, width: 300, height: 3 }, 'line-gradient', GOLD),
  k.card({ x: 70, y: 210, width: 1080, height: 300 }, { borderRadius: 6, borderWidth: 2, borderColor: rgba(GOLD, 0.5), borderStyle: 'solid', glowColor: GOLD, glowIntensity: 10, glowPosition: 'bottom' }, true),
  k.image({ x: 80, y: 220, width: 480, height: 280 }, 'luxury sports car night', { borderRadius: 4, animation: 'scale-up', animationTrigger: 'hover' }),
  k.heading({ x: 600, y: 232, width: 530, height: 44 }, 'كوبيه رياضية 2023', 30),
  ...bar(600, 300, 'القوة', 0.86, '580 حصان'),
  ...bar(600, 346, 'التسارع', 0.92, '3.4 ثانية'),
  ...bar(600, 392, 'الأمان', 0.78, '5 نجوم'),
  k.button({ x: 920, y: 440, width: 210, height: 48 }, 'اطلب ملف السيارة', { slide: 3 }, { borderRadius: 4, backgroundColor: GOLD, color: '#1A1405' }),
  k.card({ x: 70, y: 540, width: 1080, height: 300 }, { borderRadius: 6, borderWidth: 2, borderColor: rgba(GOLD, 0.5), borderStyle: 'solid' }, true),
  k.image({ x: 660, y: 550, width: 480, height: 280 }, 'classic vintage car restored', { borderRadius: 4, animation: 'scale-up', animationTrigger: 'hover' }),
  k.heading({ x: 100, y: 562, width: 520, height: 44 }, 'كلاسيكية مُرمَّمة 1968', 30),
  ...bar(100, 630, 'الأصالة', 0.95, 'أصلية'),
  ...bar(100, 676, 'الحالة', 0.88, 'ممتازة'),
  ...bar(100, 722, 'الندرة', 0.9, '500 قطعة'),
  k.button({ x: 100, y: 770, width: 210, height: 48 }, 'احجز معاينة', { slide: 3 }, { borderRadius: 4, backgroundColor: 'transparent', color: GOLD, borderWidth: 2, borderColor: GOLD, borderStyle: 'solid' }),
];

const visit = [
  k.shape({ x: 0, y: 0, width: 1280, height: 760 }, { backgroundColor: '#0F1726' }, 'خلفية'),
  k.heading({ x: 500, y: 70, width: 650, height: 64 }, 'معاينة خاصة بموعد', 46),
  k.text({ x: 580, y: 146, width: 570, height: 60 }, 'نفتح المعرض لك وحدك لتجربة السيارة بهدوء مع خبيرنا.', 19),
  k.ratings({ x: 70, y: 240, width: 540, height: 260 }, GOLD, { borderRadius: 6 }),
  k.gallery({ x: 70, y: 530, width: 540, height: 200 }, 'left-main-row', ['luxury car showroom dark', 'car interior leather', 'car wheel detail'], { borderRadius: 4 }, 8, 4),
  k.glass({ x: 650, y: 240, width: 500, height: 490 }, true, { borderRadius: 6, borderColor: rgba(GOLD, 0.5), glowColor: GOLD, glowIntensity: 10 }),
  ...[['mdi:calendar-check-outline', 'اختر موعداً يناسبك'], ['mdi:car-key', 'جرّب القيادة بصحبة خبير'], ['mdi:file-document-check-outline', 'ملف فحص وتاريخ كامل'], ['mdi:handshake-outline', 'تمويل وتبديل سيارتك']].flatMap(([ic, t], i) => [
    k.icon({ x: 1096, y: 276 + i * 84, width: 36, height: 36 }, ic, GOLD),
    k.text({ x: 690, y: 280 + i * 84, width: 390, height: 30 }, t, 19, { color: '#E7ECF3', fontWeight: 'bold' }),
  ]),
  k.button({ x: 900, y: 650, width: 230, height: 54 }, 'احجز معاينتك', undefined, { backgroundColor: GOLD, color: '#1A1405', borderRadius: 4 }),
];

const page: PageSpec = {
  key: 'cars-b',
  name: 'معرض سيارات فاخرة وكلاسيكية',
  category: 'p-cars',
  look: L,
  navbar: {
    brand: 'نخبة', items: [{ label: 'المجموعة', slide: 2 }, { label: 'معاينة', slide: 3 }], bg: '#0B111C', text: '#E7ECF3', accent: GOLD, accentText: '#1A1405', sticky: true, layout: 'vertical', sideWidth: 90,
    borderColor: 'rgba(201,162,74,0.4)', borderWidth: 1,
    icons: { 'item-1': { icon: 'mdi:car-sports', mode: 'icon' }, 'item-2': { icon: 'mdi:calendar-clock', mode: 'icon' } },
  },
  slides: [
    { name: 'المدخل', height: 740, bg: { image: 'luxury sports car dark studio night', fixed: true }, divider: 'curve-up', elements: hero },
    { name: 'المجموعة', height: 880, bg: { color: '#0F1726' }, divider: 'straight', elements: collection },
    { name: 'المعاينة', height: 760, bg: { color: '#0F1726' }, divider: 'straight', innerGlow: { color: '#C9A24A', intensity: 55, position: 'bottom' }, elements: visit },
  ],
};
export default page;

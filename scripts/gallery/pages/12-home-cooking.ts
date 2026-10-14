// 12. Home cooking restaurant. Look «بيتي دافي»; a food-prep video hero; a «today's menu» card; the ratings block.
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('homey');
const k = new Kit(L);
const A = L.accent;
const CREAM = '#FFF7ED';

const hero = [
  k.shape({ x: 0, y: 0, width: 1280, height: 700 }, { backgroundColor: 'linear-gradient(0deg, rgba(63,38,27,0.85) 0%, rgba(63,38,27,0.25) 70%, rgba(63,38,27,0.35) 100%)' }, 'تعتيم'),
  k.glass({ x: 96, y: 150, width: 380, height: 400 }, true, { backgroundColor: 'rgba(63,38,27,0.55)', borderRadius: 32, glowColor: '#F59E0B', glowIntensity: 12 }),
  k.badge({ x: 120, y: 174, width: 160, height: 34 }, 'قائمة اليوم', { backgroundColor: '#F59E0B', color: '#3F261B', animation: 'swing', animationTrigger: 'loop', animationDuration: 3 }),
  ...[['ورق عنب بالزيت', '6$'], ['كبة مقلية', '5$'], ['فتة مكدوس', '7$'], ['مجدرة بالبصل', '4$']].flatMap(([d, p], i) => [
    k.text({ x: 240, y: 234 + i * 70, width: 216, height: 30 }, d, 20, { color: CREAM, fontWeight: 'bold' }),
    k.text({ x: 120, y: 236 + i * 70, width: 70, height: 30 }, p, 20, { color: '#F59E0B', fontWeight: 'bold', textAlign: 'left' }),
    k.line({ x: 120, y: 270 + i * 70, width: 336, height: 2 }, 'line-dotted', 'rgba(255,247,237,0.45)'),
  ]),
  k.eyebrow({ x: 704, y: 380, width: 480, height: 26 }, 'طبخ بيتي بحب أمهات', { color: '#F59E0B' }),
  k.heading({ x: 544, y: 416, width: 640, height: 130 }, 'أكل مثل أكل الدار', 64, { color: CREAM, textEffect: 'shadow-soft', textEffectColor: '#000000', textEffectIntensity: 50, animation: 'fade', animationTrigger: 'once' }),
  k.button({ x: 954, y: 570, width: 230, height: 56 }, 'اطلب الآن', { slide: 3 }, { backgroundColor: '#F59E0B', color: '#3F261B' }),
  k.button({ x: 704, y: 570, width: 230, height: 56 }, 'أطباق الأسبوع', { slide: 2 }, { backgroundColor: 'transparent', color: CREAM, borderWidth: 2, borderColor: CREAM, borderStyle: 'solid' }),
];

const dishes = [
  k.eyebrow({ x: 884, y: 70, width: 300, height: 24 }, 'أطباقنا'),
  k.heading({ x: 484, y: 98, width: 700, height: 64 }, 'طبخة اليوم تنتظرك', 46),
  k.line({ x: 944, y: 176, width: 240, height: 4 }, 'line-wavy', A),
  ...[['محاشي مشكلة', '9$', 'stuffed vegetables dolma'], ['كبة لبنية', '8$', 'kibbeh yogurt soup'], ['شيش برك', '7$', 'shish barak dumplings'], ['منسف بيت', '12$', 'mansaf rice lamb']].flatMap(([name, price, q], i) => {
    const x = 940 - i * 280;
    return [
      k.card({ x, y: 210, width: 244, height: 360 }, { borderRadius: 40, borderWidth: 2, borderColor: '#EFDCCB', shadow: 'md', animation: 'slide-up', animationTrigger: 'once' }),
      k.image({ x: x + 10, y: 220, width: 224, height: 220 }, q, { borderRadius: 32, animation: 'scale-up', animationTrigger: 'hover' }),
      k.badge({ x: x + 150, y: 232, width: 76, height: 34 }, price, { backgroundColor: A, color: '#FFFFFF' }),
      k.heading({ x: x + 14, y: 462, width: 216, height: 40 }, name, 24, { textAlign: 'center' }),
      k.text({ x: x + 14, y: 508, width: 216, height: 40 }, 'تُحضّر طازجة يومياً', 15, { textAlign: 'center' }),
    ];
  }),
  k.gallery({ x: 96, y: 610, width: 1088, height: 300 }, 'right-thumbnails', ['home cooked meal table', 'arabic bread baking', 'cooking in pot', 'family dinner table'], { borderRadius: 32 }, 10, 28),
];

const order = [
  k.shape({ x: 0, y: 0, width: 1280, height: 760 }, { backgroundColor: '#F6E6DC' }, 'خلفية'),
  k.heading({ x: 484, y: 70, width: 700, height: 64 }, 'كيف تطلب؟', 46),
  ...[['mdi:silverware-fork-knife', 'اختر أطباقك'], ['mdi:clock-outline', 'حدّد وقت الاستلام'], ['mdi:moped-outline', 'استلم أو نوصّلك']].flatMap(([ic, t], i) => [
    k.shape({ x: 940 - i * 300, y: 170, width: 90, height: 90 }, { backgroundColor: A, borderRadius: 9999, glowColor: A, glowIntensity: 12 }, 'دائرة'),
    k.icon({ x: 962 - i * 300, y: 192, width: 46, height: 46 }, ic, '#FFFFFF'),
    k.text({ x: 800 - i * 300, y: 276, width: 290, height: 34 }, t, 20, { fontWeight: 'bold', color: '#3F261B', textAlign: 'center' }),
  ]),
  k.ratings({ x: 96, y: 360, width: 600, height: 280 }, '#F59E0B', { borderRadius: 28 }),
  k.text({ x: 724, y: 372, width: 460, height: 110 }, 'نطبخ كل يوم بحب. ورأيك يهمنا ويساعدنا نحسّن.', 20, { color: '#3F261B' }),
  k.button({ x: 934, y: 560, width: 250, height: 58 }, 'اطلب غداءك اليوم', undefined, { backgroundColor: A, color: '#FFFFFF', animation: 'pulse', animationTrigger: 'loop', animationDuration: 2.6 }),
];

const page: PageSpec = {
  key: 'home-cooking',
  name: 'مطعم طبخ منزلي',
  category: 'p-restaurant',
  look: L,
  navbar: { brand: 'مطبخ أم سامر', items: [{ label: 'أطباقنا', slide: 2 }, { label: 'كيف تطلب', slide: 3 }], cta: { label: 'اطلب الآن', slide: 3 }, bg: '#FDF8F4', text: '#3F261B', accent: '#9A3412', sticky: true, borderColor: '#EFDCCB', borderWidth: 1 },
  slides: [
    { name: 'المدخل', height: 700, bg: { video: '8480007' }, divider: 'double-wave', elements: hero },
    { name: 'أطباقنا', height: 940, bg: { color: L.bg }, divider: 'wave', elements: dishes },
    { name: 'الطلب', height: 760, bg: { color: '#F6E6DC' }, divider: 'straight', elements: order },
  ],
};
export default page;

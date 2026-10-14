// 15. Car showroom A (new cars). Look «قوي»; a showroom video hero under a clear glass navbar; car cards with
// spec rows; a financing slide.
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('bold');
const k = new Kit(L);
const RED = L.accent;

const hero = [
  k.shape({ x: 0, y: 0, width: 1280, height: 720 }, { backgroundColor: 'linear-gradient(180deg, rgba(17,18,20,0.55) 0%, rgba(17,18,20,0.2) 40%, rgba(17,18,20,0.88) 100%)' }, 'تعتيم'),
  k.eyebrow({ x: 784, y: 330, width: 400, height: 26 }, 'سيارات جديدة بوكالة وضمان', { color: '#FFFFFF', letterSpacing: 2 }),
  k.heading({ x: 284, y: 366, width: 900, height: 110 }, 'قُدها اليوم', 96, { color: '#FFFFFF', textEffect: 'shadow-3d', textEffectColor: RED, textEffectIntensity: 55, animation: 'slide-up', animationTrigger: 'once' }),
  k.text({ x: 544, y: 496, width: 640, height: 60 }, 'أحدث الموديلات بتقسيط مريح وتجربة قيادة مجانية.', 20, { color: 'rgba(255,255,255,0.9)' }),
  k.button({ x: 954, y: 590, width: 230, height: 56 }, 'جرّب قيادة', { slide: 3 }, { backgroundColor: RED, color: '#FFFFFF', borderRadius: 4, glowColor: RED, glowIntensity: 22 }),
  k.button({ x: 704, y: 590, width: 230, height: 56 }, 'سياراتنا', { slide: 2 }, { backgroundColor: 'rgba(255,255,255,0.12)', color: '#FFFFFF', borderWidth: 2, borderColor: '#FFFFFF', borderStyle: 'solid', borderRadius: 4 }),
];

const cars = [
  k.eyebrow({ x: 884, y: 70, width: 300, height: 24 }, 'وصلت حديثاً'),
  k.heading({ x: 484, y: 98, width: 700, height: 64 }, 'اختر سيارتك', 48, { color: '#FFFFFF' }),
  ...[['سيدان عائلية', '2025', '18,900$', 'family sedan car white'], ['SUV رياضية', '2025', '26,500$', 'sport suv car red'], ['كهربائية', '2025', '31,000$', 'electric car charging']].flatMap(([name, year, price, q], i) => {
    const x = 840 - i * 372;
    return [
      k.card({ x, y: 210, width: 344, height: 500 }, { backgroundColor: '#1C1D21', borderRadius: 6, borderWidth: i === 1 ? 3 : 1, borderColor: i === 1 ? RED : '#2C2D33', borderStyle: 'solid', glowColor: RED, glowIntensity: i === 1 ? 22 : 0, animation: 'slide-up', animationTrigger: 'once' }),
      k.image({ x: x + 10, y: 220, width: 324, height: 210 }, q, { borderRadius: 4, animation: 'scale-up', animationTrigger: 'hover' }),
      k.badge({ x: x + 24, y: 234, width: 76, height: 30 }, year, { backgroundColor: RED, color: '#FFFFFF', borderRadius: 4, fontSize: 13 }),
      k.heading({ x: x + 20, y: 448, width: 304, height: 40 }, name, 26, { color: '#FFFFFF' }),
      k.heading({ x: x + 20, y: 494, width: 304, height: 44 }, price, 32, { color: RED }),
      ...[['mdi:car-shift-pattern', 'أوتوماتيك'], ['mdi:gas-station-outline', 'بنزين'], ['mdi:shield-car', 'ضمان 3 سنوات']].flatMap(([ic, t], j) => [
        k.icon({ x: x + 271 - j * 112, y: 556, width: 26, height: 26 }, ic, '#A1A1AA'),
        k.text({ x: x + 229 - j * 112, y: 588, width: 110, height: 24 }, t, 13, { color: '#A1A1AA', textAlign: 'center' }),
      ]),
      k.button({ x: x + 20, y: 636, width: 304, height: 50 }, 'اطلب عرض سعر', { slide: 3 }, { backgroundColor: i === 1 ? RED : 'transparent', color: i === 1 ? '#FFFFFF' : RED, borderWidth: i === 1 ? 0 : 2, borderColor: RED, borderStyle: 'solid', borderRadius: 4 }),
    ];
  }),
];

const finance = [
  k.shape({ x: 0, y: 0, width: 1280, height: 720 }, { backgroundColor: '#111214' }, 'خلفية'),
  k.shape({ x: -100, y: 400, width: 1500, height: 150, rotation: -6 }, { backgroundColor: 'rgba(225,29,46,0.18)' }, 'شريط'),
  k.heading({ x: 484, y: 80, width: 700, height: 64 }, 'تقسيط يناسب ميزانيتك', 46, { color: '#FFFFFF' }),
  ...[['0%', 'مقدّم على الموديلات المختارة'], ['60', 'شهراً حداً أقصى للتقسيط'], ['24س', 'موافقة سريعة على الطلب']].flatMap(([n, t], i) => [
    k.shape({ x: 840 - i * 372, y: 190, width: 344, height: 190 }, { backgroundColor: '#1C1D21', borderRadius: 6, borderWidth: 2, borderColor: i === 0 ? RED : '#2C2D33', borderStyle: 'solid' }, 'إطار'),
    k.heading({ x: 860 - i * 372, y: 210, width: 304, height: 80 }, n, 64, { color: RED, textAlign: 'center' }),
    k.text({ x: 860 - i * 372, y: 304, width: 304, height: 56 }, t, 18, { color: '#F4F4F5', textAlign: 'center' }),
  ]),
  k.gallery({ x: 96, y: 430, width: 700, height: 240 }, 'left-main-row', ['car showroom interior', 'car keys handover', 'sports car headlight'], { borderRadius: 4 }, 8, 4),
  k.text({ x: 830, y: 440, width: 354, height: 80 }, 'نستلم سيارتك القديمة كدفعة أولى.', 20, { color: '#F4F4F5' }),
  k.button({ x: 934, y: 560, width: 250, height: 58 }, 'احجز تجربة قيادة', undefined, { backgroundColor: RED, color: '#FFFFFF', borderRadius: 4, glowColor: RED, glowIntensity: 20, animation: 'pulse', animationTrigger: 'loop', animationDuration: 2.5 }),
];

const page: PageSpec = {
  key: 'cars-a',
  name: 'معرض سيارات جديدة',
  category: 'p-cars',
  look: L,
  navbar: { brand: 'معرض الفارس للسيارات', items: [{ label: 'سياراتنا', slide: 2 }, { label: 'التقسيط', slide: 3 }], cta: { label: 'جرّب قيادة', slide: 3 }, bg: '#000000', text: '#FFFFFF', accent: '#E11D2E', sticky: true, opacity: 0.25, posY: 0.1 },
  slides: [
    { name: 'المدخل', height: 720, bg: { video: '14228182' }, divider: 'straight', elements: hero },
    { name: 'السيارات', height: 780, bg: { color: '#18191C' }, divider: 'clouds', elements: cars },
    { name: 'التقسيط', height: 720, bg: { color: '#111214' }, divider: 'straight', elements: finance },
  ],
};
export default page;

// 17. Car showroom C (used and economy cars). Look «واضح»; a bright street-of-cars photo hero; a tall plain navbar;
// filter chips and wide cards; a «sell your car» slide.
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('clear');
const k = new Kit(L);
const BLUE = L.accent;

const hero = [
  k.shape({ x: 0, y: 0, width: 1280, height: 700 }, { backgroundColor: 'linear-gradient(90deg, rgba(255,255,255,0.0) 0%, rgba(20,26,36,0.7) 100%)' }, 'تعتيم'),
  k.glass({ x: 640, y: 130, width: 544, height: 440 }, true, { backgroundColor: 'rgba(15,23,42,0.62)', borderRadius: 16 }),
  k.badge({ x: 880, y: 160, width: 280, height: 36 }, 'سيارات مستعملة مفحوصة', { backgroundColor: BLUE, color: '#FFFFFF', borderRadius: 6, animation: 'rubberband', animationTrigger: 'loop', animationDuration: 3.5 }),
  k.heading({ x: 664, y: 214, width: 496, height: 140 }, 'سيارة موثوقة بسعر عادل', 50, { color: '#FFFFFF', animation: 'slide-up', animationTrigger: 'once' }),
  k.text({ x: 664, y: 372, width: 496, height: 70 }, 'فحص شامل 150 نقطة، وملف تاريخ لكل سيارة، وضمان محرك وناقل.', 18, { color: 'rgba(255,255,255,0.9)' }),
  k.button({ x: 954, y: 478, width: 206, height: 54 }, 'تصفح السيارات', { slide: 2 }, { borderRadius: 6 }),
  k.button({ x: 730, y: 478, width: 206, height: 54 }, 'بِع سيارتك', { slide: 3 }, { backgroundColor: 'transparent', color: '#FFFFFF', borderWidth: 2, borderColor: '#FFFFFF', borderStyle: 'solid', borderRadius: 6 }),
];

const stock = [
  k.eyebrow({ x: 884, y: 70, width: 300, height: 24 }, 'متوفرة الآن'),
  k.heading({ x: 484, y: 98, width: 700, height: 64 }, 'اختر حسب ميزانيتك', 46),
  ...['الكل', 'اقتصادية', 'عائلية', 'SUV', 'كهربائية'].map((c, i) => k.badge({ x: 1064 - i * 132, y: 186, width: 118, height: 40 }, c, { backgroundColor: i === 0 ? BLUE : L.soft, color: i === 0 ? '#FFFFFF' : BLUE, borderRadius: 9999, fontSize: 15 })),
  ...[['كيا ريو 2019', '8,400$', 'kia rio hatchback'], ['هيونداي توسان 2018', '13,900$', 'hyundai tucson suv'], ['تويوتا كورولا 2020', '12,500$', 'toyota corolla sedan'], ['نيسان ليف 2019', '10,800$', 'nissan leaf electric car']].flatMap(([name, price, q], i) => {
    const x = i % 2 === 0 ? 644 : 96;
    const y = 260 + Math.floor(i / 2) * 250;
    return [
      k.card({ x, y, width: 540, height: 224 }, { borderRadius: 14, shadow: 'md', animation: 'slide-up', animationTrigger: 'once' }),
      k.image({ x: x + 10, y: y + 10, width: 220, height: 204 }, q, { borderRadius: 10, animation: 'scale-up', animationTrigger: 'hover' }),
      k.heading({ x: x + 250, y: y + 20, width: 280, height: 40 }, name, 24),
      k.heading({ x: x + 250, y: y + 66, width: 280, height: 44 }, price, 32, { color: BLUE }),
      k.text({ x: x + 250, y: y + 118, width: 280, height: 28 }, 'مفحوصة · ضمان 6 أشهر', 15),
      k.button({ x: x + 250, y: y + 160, width: 280, height: 44 }, 'احجز المعاينة', { slide: 3 }, { fontSize: 15, borderRadius: 8 }),
    ];
  }),
];

const sell = [
  k.shape({ x: 0, y: 0, width: 1280, height: 620 }, { backgroundColor: '#E8EFFC' }, 'خلفية'),
  k.heading({ x: 484, y: 70, width: 700, height: 64 }, 'بِع سيارتك بدقائق', 46),
  ...['أرسل بيانات سيارتك', 'نقدّر سعرها فوراً', 'نفحصها ونتفق', 'تستلم المبلغ'].flatMap((t, i) => {
    const x = 928 - i * 277;
    return [
      k.shape({ x, y: 190, width: 256, height: 180 }, { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 2, borderColor: BLUE, borderStyle: 'solid' }, 'خطوة'),
      k.shape({ x: x + 186, y: 202, width: 56, height: 56 }, { backgroundColor: BLUE, borderRadius: 9999 }, 'رقم'),
      k.heading({ x: x + 186, y: 210, width: 56, height: 40 }, `${i + 1}`, 28, { color: '#FFFFFF', textAlign: 'center' }),
      k.text({ x: x + 16, y: 290, width: 224, height: 60 }, t, 19, { color: L.ink, fontWeight: 'bold' }),
    ];
  }),
  k.gallery({ x: 96, y: 410, width: 700, height: 160 }, 'top-main', ['used car inspection checklist#0', 'used car inspection checklist#1', 'used car inspection checklist#2'], { borderRadius: 10 }, 8, 8),
  k.button({ x: 934, y: 470, width: 250, height: 58 }, 'قدّر سعر سيارتي', undefined, { borderRadius: 8, glowColor: BLUE, glowIntensity: 14 }),
];

const page: PageSpec = {
  key: 'cars-c',
  name: 'معرض سيارات مستعملة',
  category: 'p-cars',
  look: L,
  navbar: { brand: 'سيارات الثقة', items: [{ label: 'السيارات', slide: 2 }, { label: 'بع سيارتك', slide: 3 }], cta: { label: 'اتصل بنا', slide: 3 }, bg: '#FFFFFF', text: '#141A24', accent: '#1D5BD8', sticky: true, height: 84, borderColor: '#E2E5EA', borderWidth: 1, itemsAlign: 'left' },
  slides: [
    { name: 'المدخل', height: 700, bg: { image: 'used cars lot sunny street', fixed: false }, divider: 'wave', elements: hero },
    { name: 'السيارات', height: 800, bg: { color: '#FFFFFF' }, divider: 'asymmetric-wave', elements: stock },
    { name: 'بع سيارتك', height: 620, bg: { color: '#E8EFFC' }, divider: 'straight', elements: sell },
  ],
};
export default page;

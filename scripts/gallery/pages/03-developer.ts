// 3. Real-estate developer. Look «فخم داكن»; a vertical navbar column; metallic gold letters; arched photos.
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('luxe');
const k = new Kit(L);
const GOLD = L.accent;

// The navbar column takes the right 190px, so everything sits in x 70..1060.
const hero = [
  k.shape({ x: 0, y: 0, width: 1280, height: 740 }, { backgroundColor: 'linear-gradient(180deg, rgba(11,17,28,0.35) 0%, rgba(11,17,28,0.88) 100%)' }, 'تعتيم'),
  k.eyebrow({ x: 300, y: 150, width: 460, height: 26 }, 'تطوير عقاري فاخر', { textAlign: 'center', color: GOLD, letterSpacing: 4 }),
  k.heading({ x: 130, y: 190, width: 900, height: 120 }, 'مساكن تُبنى لتدوم', 84, { textAlign: 'center', textEffect: 'gold', textEffectIntensity: 60, animation: 'fade', animationTrigger: 'once' }),
  k.line({ x: 400, y: 330, width: 360, height: 3 }, 'line-glow', GOLD),
  k.text({ x: 260, y: 360, width: 640, height: 76 }, 'أبراج ومجمعات سكنية بتصميم عصري وموقع مميز وتسليم في الموعد.', 20, { textAlign: 'center', color: 'rgba(231,236,243,0.9)' }),
  k.button({ x: 438, y: 470, width: 200, height: 56 }, 'استعرض المشاريع', { slide: 2 }, { backgroundColor: GOLD, color: '#1A1405', glowColor: GOLD, glowIntensity: 16 }),
  k.button({ x: 654, y: 470, width: 200, height: 56 }, 'خطط الدفع', { slide: 3 }, { backgroundColor: 'transparent', color: GOLD, borderWidth: 2, borderColor: GOLD, borderStyle: 'solid' }),
  k.glass({ x: 96, y: 590, width: 964, height: 108 }, true, { borderColor: rgba(GOLD, 0.45), glowColor: GOLD, glowIntensity: 10, glowPosition: 'top' }),
  ...[['12', 'مشروعاً منجزاً'], ['3,400', 'وحدة سكنية'], ['98%', 'تسليم في الموعد'], ['25', 'عاماً من الثقة']].flatMap(([n, label], i) => {
    const x = 830 - i * 240;
    return [k.heading({ x, y: 604, width: 200, height: 46 }, n, 34, { textAlign: 'center', color: GOLD }), k.text({ x, y: 654, width: 200, height: 26 }, label, 15, { textAlign: 'center', color: 'rgba(231,236,243,0.8)' })];
  }),
];

const projects = [
  k.eyebrow({ x: 760, y: 80, width: 300, height: 24 }, 'محفظتنا'),
  k.heading({ x: 460, y: 108, width: 600, height: 64 }, 'مشاريع بهوية خاصة', 46),
  k.line({ x: 820, y: 186, width: 240, height: 3 }, 'line-gradient', GOLD),
  ...[['برج الياسمين', 'جاهز للتسليم', 'luxury residential tower exterior'], ['مجمّع الواحة', 'قيد الإنشاء', 'modern villa complex garden'], ['أبراج الشاطئ', 'قريباً', 'seaside apartments building']].flatMap(([name, status, q], i) => {
    const x = 760 - i * 332;
    return [
      k.card({ x: x - 8, y: 230, width: 316, height: 560 }, { backgroundColor: L.card, borderRadius: 160, borderWidth: 2, borderColor: rgba(GOLD, 0.6), borderStyle: 'solid', glowColor: GOLD, glowIntensity: 8, glowPosition: 'bottom' }),
      k.image({ x, y: 240, width: 300, height: 380 }, q, { borderWidth: 0 }, { clipPath: 'clip-shape-arch-classic' }),
      k.badge({ x: x + 80, y: 640, width: 140, height: 34 }, status, { backgroundColor: i === 0 ? '#14532D' : i === 1 ? '#78350F' : '#1E293B', color: '#FFFFFF' }),
      k.heading({ x: x + 20, y: 690, width: 260, height: 44 }, name, 28, { textAlign: 'center' }),
      k.text({ x: x + 20, y: 738, width: 260, height: 30 }, ['شقق من 2 إلى 4 غرف', 'فلل وتاون هاوس', 'شقق وبنتهاوس'][i], 15, { textAlign: 'center' }),
    ];
  }),
];

const plans = [
  k.eyebrow({ x: 760, y: 70, width: 300, height: 24 }, 'خطط الدفع'),
  k.heading({ x: 460, y: 98, width: 600, height: 64 }, 'اختر ما يناسبك', 46),
  ...[['دفعة واحدة', 'خصم 8%', 'عند التعاقد', ['تسجيل فوري للوحدة', 'أفضل سعر متاح', 'أولوية اختيار الطابق']], ['تقسيط مرن', '4 سنوات', 'دفعات ربع سنوية', ['دفعة أولى 20%', 'بدون فوائد', 'تسليم خلال 24 شهراً']], ['استثمار', 'عائد ثابت', 'إدارة وتأجير', ['إدارة كاملة للوحدة', 'عائد سنوي ثابت', 'خيار إعادة الشراء']]].flatMap(([name, price, period, features], i) =>
    k.plan({ x: 760 - i * 332, y: 190, width: 300, height: 440 }, { name: name as string, price: price as string, period: period as string, features: features as string[], featured: i === 1, cta: 'اطلب العرض', link: { slide: 3 }, accent: GOLD, bg: L.card })),
  k.ratings({ x: 96, y: 670, width: 964, height: 230 }, GOLD, { borderRadius: 20 }),
];

const page: PageSpec = {
  key: 'developer',
  name: 'مطور عقاري',
  category: 'p-business',
  look: L,
  navbar: { brand: 'ركائز للتطوير العقاري', items: [{ label: 'المشاريع', slide: 2 }, { label: 'خطط الدفع', slide: 3 }], cta: { label: 'احجز وحدتك', slide: 3 }, bg: '#0B111C', text: '#E7ECF3', accent: GOLD, accentText: '#1A1405', sticky: true, layout: 'vertical', sideWidth: 190, borderColor: 'rgba(201,162,74,0.35)', borderWidth: 1, glow: { color: GOLD, intensity: 10 } },
  slides: [
    { name: 'المدخل', height: 740, bg: { image: 'luxury residential building dusk skyline', fixed: true }, divider: 'curve-up', elements: hero },
    { name: 'المشاريع', height: 840, bg: { color: '#0F1726' }, divider: 'tilt-right', elements: projects },
    { name: 'خطط الدفع', height: 940, bg: { color: L.bg }, divider: 'straight', innerGlow: { color: GOLD, intensity: 40, position: 'top' }, elements: plans },
  ],
};
export default page;

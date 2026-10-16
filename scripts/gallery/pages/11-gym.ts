// 11. Gym. Look «قوي»; a plain dark hero (no photo or video) built from a tilted red band and giant outlined
// numerals; a hamburger navbar; plan cards.
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('bold');
const k = new Kit(L);
const RED = L.accent;

const hero = [
  k.shape({ x: -100, y: 360, width: 1500, height: 170, rotation: -7 }, { backgroundColor: RED, glowColor: RED, glowIntensity: 30, opacity: 0.95 }, 'شريط'),
  k.heading({ x: 80, y: 40, width: 760, height: 330 }, '24', 300, { color: 'transparent', textEffect: 'hollow-shadow', textEffectColor: '#FFFFFF', textEffectColor2: RED, textEffectIntensity: 60, textAlign: 'left', opacity: 0.5 }),
  k.badge({ x: 954, y: 130, width: 230, height: 38 }, 'نادي لياقة وكمال أجسام', { backgroundColor: 'transparent', color: '#FFFFFF', borderWidth: 2, borderColor: RED, borderStyle: 'solid', animation: 'shake', animationTrigger: 'hover' }),
  k.heading({ x: 504, y: 190, width: 680, height: 150 }, 'قوّتك تبدأ هنا', 84, { color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.7)', textShadowIntensity: 16, textShadowPosition: 'bottom', animation: 'slide-up', animationTrigger: 'once' }),
  k.heading({ x: 504, y: 396, width: 680, height: 80 }, 'تدريب شخصي، أجهزة حديثة، ومدربون معتمدون', 30, { color: '#FFFFFF' }),
  k.button({ x: 954, y: 570, width: 230, height: 58 }, 'جرّب يوماً مجاناً', { slide: 3 }, { backgroundColor: '#FFFFFF', color: '#111214', borderRadius: 4, animation: 'pulse', animationTrigger: 'loop', animationDuration: 2.4 }),
  k.button({ x: 704, y: 570, width: 230, height: 58 }, 'برامجنا', { slide: 2 }, { backgroundColor: 'transparent', color: '#FFFFFF', borderWidth: 3, borderColor: '#FFFFFF', borderStyle: 'solid', borderRadius: 4 }),
  k.line({ x: 96, y: 640, width: 1088, height: 3 }, 'line-gradient', RED),
];

const programs = [
  k.shape({ x: 0, y: 0, width: 1280, height: 780 }, { backgroundColor: '#18191C' }, 'خلفية'),
  k.eyebrow({ x: 884, y: 70, width: 300, height: 24 }, 'برامجنا'),
  k.heading({ x: 484, y: 98, width: 700, height: 64 }, 'اختر طريقة تدريبك', 48, { color: '#FFFFFF', textEffect: 'stamp', textEffectColor: RED, textEffectIntensity: 40 }),
  ...[['mdi:dumbbell', 'أثقال وبناء عضلي'], ['mdi:run-fast', 'كارديو وحرق دهون'], ['mdi:yoga', 'يوغا ومرونة'], ['mdi:boxing-glove', 'ملاكمة ودفاع']].flatMap(([ic, name], i) => {
    const x = 940 - i * 280;
    return [
      k.card({ x, y: 210, width: 244, height: 300 }, { backgroundColor: '#1C1D21', borderRadius: 4, borderWidth: i % 2 ? 2 : 4, borderColor: i === 0 ? RED : '#2C2D33', borderStyle: 'solid', glowColor: RED, glowIntensity: i === 0 ? 22 : 0, animation: 'slide-up', animationTrigger: 'once' }),
      k.icon({ x: x + 90, y: 244, width: 64, height: 64 }, ic, i === 0 ? RED : '#F4F4F5'),
      k.heading({ x: x + 14, y: 340, width: 216, height: 80 }, name, 24, { textAlign: 'center', color: '#FFFFFF' }),
      k.line({ x: x + 62, y: 440, width: 120, height: 3 }, 'line-gradient', RED),
      k.text({ x: x + 14, y: 462, width: 216, height: 34 }, ['3 مرات أسبوعياً', 'حصص جماعية', 'مع مدربة', 'للمبتدئين والمحترفين'][i], 15, { textAlign: 'center', color: '#A1A1AA' }),
    ];
  }),
  k.gallery({ x: 96, y: 550, width: 1088, height: 190 }, 'top-main', ['gym weights training#0', 'gym weights training#1', 'gym weights training#2'], { borderRadius: 4 }, 8, 4),
];

const plans = [
  k.shape({ x: 0, y: 0, width: 1280, height: 860 }, { backgroundColor: '#111214' }, 'خلفية'),
  k.shape({ x: -80, y: 540, width: 1500, height: 130, rotation: 6 }, { backgroundColor: 'rgba(225,29,46,0.14)' }, 'شريط'),
  k.heading({ x: 484, y: 70, width: 700, height: 64 }, 'اشتراكات بلا مفاجآت', 46, { color: '#FFFFFF' }),
  ...[['شهري', '30$', 'تجديد كل شهر', ['دخول كل الأجهزة', 'حصص جماعية', 'خزانة شخصية']], ['3 أشهر', '75$', 'وفّر 17%', ['كل ما في الشهري', 'جلسة تقييم لياقة', 'مشروب بروتين أسبوعي']], ['سنوي', '240$', 'وفّر 33%', ['كل ما سبق', 'تدريب شخصي شهري', 'ضيف مجاني كل شهر']]].flatMap(([name, price, period, features], i) =>
    k.plan({ x: 840 - i * 372, y: 180, width: 344, height: 450 }, { name: name as string, price: price as string, period: period as string, features: features as string[], featured: i === 1, cta: 'اشترك الآن', accent: RED, ink: '#FFFFFF', muted: '#A1A1AA', bg: '#1C1D21', link: { slide: 3 } })),
  k.heading({ x: 96, y: 690, width: 1088, height: 60 }, 'الدخول الأول مجاني، بلا بطاقة ولا التزام', 30, { color: '#FFFFFF', textAlign: 'center' }),
];

const page: PageSpec = {
  key: 'gym',
  name: 'نادي رياضي',
  category: 'p-business',
  look: L,
  navbar: { brand: 'نادي القمة', items: [{ label: 'برامجنا', slide: 2 }, { label: 'الاشتراكات', slide: 3 }], cta: { label: 'جرّب مجاناً', slide: 3 }, bg: '#111214', text: '#FFFFFF', accent: RED, sticky: true, layout: 'hamburger' },
  slides: [
    { name: 'المدخل', height: 700, bg: { color: '#111214' }, divider: 'straight', innerGlow: { color: '#E11D2E', intensity: 80, position: 'bottom' }, elements: hero },
    { name: 'البرامج', height: 780, bg: { color: '#18191C' }, divider: 'straight', elements: programs },
    { name: 'الاشتراكات', height: 860, bg: { color: '#111214' }, divider: 'straight', elements: plans },
  ],
};
export default page;

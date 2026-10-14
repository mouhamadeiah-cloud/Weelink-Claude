// 1. Doctor with a booking slide: a dental clinic. Look «طبي نظيف»; video hero; a glass navbar floating over the video.
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('medical');
const k = new Kit(L);
const TEAL = L.accent;

const hero = [
  k.shape({ x: 0, y: 0, width: 1280, height: 660 }, { backgroundColor: 'linear-gradient(270deg, rgba(5, 38, 50, 0.86) 0%, rgba(5, 38, 50, 0.55) 55%, rgba(5, 38, 50, 0.25) 100%)' }, 'تعتيم'),
  k.badge({ x: 904, y: 196, width: 280, height: 38 }, 'عيادة أسنان وتجميل', { backgroundColor: 'rgba(255,255,255,0.14)', color: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', borderStyle: 'solid', fontSize: 14, animation: 'fade', animationTrigger: 'once' }),
  k.heading({ x: 484, y: 244, width: 700, height: 96 }, 'ابتسامة تثق بها', 72, { color: '#FFFFFF', textEffect: 'soft-glow', textEffectColor: '#67E8F9', textEffectIntensity: 40, animation: 'slide-up', animationTrigger: 'once' }),
  k.text({ x: 604, y: 366, width: 580, height: 84 }, 'علاج وتجميل الأسنان بأجهزة حديثة وتعقيم كامل، ومواعيد دقيقة تحترم وقتك.', 19, { color: 'rgba(255,255,255,0.88)' }),
  k.button({ x: 994, y: 490, width: 190, height: 54 }, 'احجز موعدك', { slide: 3 }, { color: '#04222B', backgroundColor: '#67E8F9', glowColor: '#67E8F9', glowIntensity: 18 }),
  k.button({ x: 782, y: 490, width: 190, height: 54 }, 'خدماتنا', { slide: 2 }, { backgroundColor: 'transparent', color: '#FFFFFF', borderWidth: 2, borderColor: '#FFFFFF', borderStyle: 'solid' }),
  k.glass({ x: 96, y: 236, width: 330, height: 288 }, true, { glowColor: '#22D3EE', glowIntensity: 14, glowPosition: 'bottom' }),
  ...[['mdi:shield-check-outline', 'تعقيم كامل لكل جلسة'], ['mdi:tooth-outline', 'أجهزة تشخيص حديثة'], ['mdi:clock-check-outline', 'مواعيد بلا انتظار']].flatMap(([ic, label], i) => [
    k.icon({ x: 356, y: 268 + i * 84, width: 44, height: 44 }, ic, '#67E8F9'),
    k.text({ x: 130, y: 272 + i * 84, width: 212, height: 40 }, label, 16, { color: '#FFFFFF', fontWeight: 'bold' }),
    ...(i < 2 ? [k.line({ x: 130, y: 330 + i * 84, width: 270, height: 2 }, 'line-gradient', '#67E8F9')] : []),
  ]),
];

const services = [
  k.eyebrow({ x: 984, y: 80, width: 200, height: 24 }, 'ماذا نقدم'),
  k.heading({ x: 584, y: 110, width: 600, height: 64 }, 'خدمات تعتني بكل تفصيل', 44),
  k.line({ x: 1024, y: 186, width: 160, height: 4 }, 'line-wavy', TEAL),
  ...[
    ['mdi:tooth-outline', 'تقويم وتجميل', 'تقويم شفاف ومعدني، تبييض وقشور بنتائج طبيعية.'],
    ['mdi:medical-bag', 'علاج وحشوات', 'علاج الجذور والحشوات التجميلية بتخدير موضعي مريح.'],
    ['mdi:heart-pulse', 'زراعة وتركيبات', 'زراعة أسنان وتركيبات ثابتة تدوم سنوات طويلة.'],
  ].flatMap(([ic, title, body], i) => {
    const x = [840, 472, 104][i];
    return [
      k.card({ x, y: 236, width: 340, height: 300 }, { shadow: 'md', borderRadius: 24, animation: 'slide-up', animationTrigger: 'once' }),
      k.shape({ x: x + 240, y: 262, width: 76, height: 76 }, { backgroundColor: L.soft, borderRadius: 9999, borderWidth: 2, borderColor: TEAL, borderStyle: 'solid' }, 'دائرة'),
      k.icon({ x: x + 256, y: 278, width: 44, height: 44 }, ic, TEAL),
      k.heading({ x: x + 24, y: 360, width: 292, height: 40 }, title, 24),
      k.text({ x: x + 24, y: 408, width: 292, height: 90 }, body, 16),
    ];
  }),
  k.gallery({ x: 96, y: 580, width: 1088, height: 330 }, 'left-thumbnails', ['dental clinic modern interior', 'dentist treatment room', 'smiling patient dentist', 'dental equipment clean'], { borderRadius: 20, borderWidth: 4, borderColor: L.line, borderStyle: 'solid' }, 12, 16),
];

const booking = [
  k.shape({ x: 0, y: 0, width: 1280, height: 960 }, { backgroundColor: 'linear-gradient(135deg, #0E7490 0%, #164E63 100%)' }, 'خلفية'),
  k.shape({ x: -120, y: -140, width: 420, height: 420 }, { backgroundColor: 'rgba(103,232,249,0.12)', borderRadius: 9999 }, 'دائرة'),
  k.shape({ x: 980, y: 700, width: 360, height: 360 }, { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 9999, borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)', borderStyle: 'solid' }, 'دائرة'),
  k.eyebrow({ x: 884, y: 70, width: 300, height: 24 }, 'احجز بنفسك', { color: '#67E8F9' }),
  k.heading({ x: 584, y: 100, width: 600, height: 64 }, 'اختر يومك وموعدك', 44, { color: '#FFFFFF' }),
  k.text({ x: 604, y: 176, width: 580, height: 60 }, 'يصلك تأكيد الموعد قبل الجلسة، ويمكنك التعديل أو الإلغاء بسهولة.', 18, { color: 'rgba(255,255,255,0.85)' }),
  k.calendar({ x: 664, y: 260, width: 520, height: 660 }, '#0E7490', 'احجز موعداً في العيادة'),
  k.ratings({ x: 96, y: 260, width: 520, height: 250 }, '#F5B301', { borderRadius: 24 }),
  k.glass({ x: 96, y: 540, width: 520, height: 300 }, true, { glowColor: '#22D3EE', glowIntensity: 12, glowPosition: 'bottom' }),
  k.heading({ x: 130, y: 562, width: 452, height: 40 }, 'أوقات الدوام', 24, { color: '#FFFFFF' }),
  k.line({ x: 130, y: 614, width: 452, height: 2 }, 'line-dotted', '#67E8F9'),
  ...[['mdi:calendar-week', 'الأحد إلى الخميس'], ['mdi:clock-outline', 'من 9 صباحاً حتى 5 مساءً'], ['mdi:calendar-remove-outline', 'الجمعة والسبت عطلة']].flatMap(([ic, label], i) => [
    k.icon({ x: 538, y: 640 + i * 62, width: 40, height: 40 }, ic, '#67E8F9'),
    k.text({ x: 150, y: 646 + i * 62, width: 370, height: 30 }, label, 18, { color: '#FFFFFF' }),
  ]),
];

const page: PageSpec = {
  key: 'clinic',
  name: 'عيادة أسنان وتجميل',
  category: 'p-business',
  look: L,
  navbar: {
    brand: 'عيادة الدكتورة ليلى', items: [{ label: 'خدماتنا', slide: 2 }, { label: 'احجز موعد', slide: 3 }],
    cta: { label: 'احجز الآن', slide: 3 }, bg: '#06303C', text: '#FFFFFF', accent: '#67E8F9', accentText: '#04222B',
    sticky: true, posY: 3, width: 90, opacity: 0.55, borderRadius: 18, borderColor: 'rgba(255,255,255,0.25)', borderWidth: 1,
  },
  slides: [
    { name: 'المدخل', height: 660, bg: { video: '6755020', fixed: false }, divider: 'curve-down', elements: hero },
    { name: 'الخدمات', height: 960, bg: { color: L.bg }, divider: 'wave', elements: services },
    { name: 'الحجز', height: 960, bg: { color: '#0E7490' }, divider: 'straight', elements: booking },
  ],
};
export default page;

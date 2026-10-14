// 4. Language courses. Look «منعش»; the hero is a flowing multi-colour gradient (no photo); a navbar with icons beside
// each name; moving-gradient letters; level cards.
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('fresh');
const k = new Kit(L);
const WAVE = 'linear-gradient(135deg, #0D9488 0%, #22D3EE 28%, #818CF8 58%, #F472B6 100%)';

const hero = [
  k.shape({ x: -80, y: -60, width: 420, height: 420 }, { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 9999 }, 'دائرة'),
  k.shape({ x: 880, y: 360, width: 520, height: 520 }, { backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 9999, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)', borderStyle: 'solid' }, 'دائرة'),
  k.badge({ x: 904, y: 170, width: 280, height: 38 }, 'دورات لغات للصغار والكبار', { backgroundColor: 'rgba(255,255,255,0.22)', color: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderStyle: 'solid' }),
  k.heading({ x: 364, y: 230, width: 820, height: 110 }, 'تكلم لغة جديدة بثقة', 68, { color: '#FFFFFF', textEffect: 'gradient-move', textEffectColor: '#FFFFFF', textEffectColor2: '#FDE68A', textEffectIntensity: 55, textShadowColor: 'rgba(0,0,0,0.25)', textShadowIntensity: 12, textShadowPosition: 'bottom' }),
  k.text({ x: 584, y: 360, width: 600, height: 80 }, 'مدرّسون متخصصون، مجموعات صغيرة، ومحادثة حقيقية من أول حصة.', 20, { color: 'rgba(255,255,255,0.95)' }),
  k.button({ x: 964, y: 480, width: 220, height: 58 }, 'جرّب حصة مجانية', { slide: 3 }, { backgroundColor: '#FFFFFF', color: '#0F766E', glowColor: '#FFFFFF', glowIntensity: 18 }),
  k.button({ x: 730, y: 480, width: 210, height: 58 }, 'اختر لغتك', { slide: 2 }, { backgroundColor: 'transparent', color: '#FFFFFF', borderWidth: 2, borderColor: '#FFFFFF', borderStyle: 'solid' }),
  ...[['EN', 'إنكليزي'], ['DE', 'ألماني'], ['FR', 'فرنسي'], ['TR', 'تركي']].flatMap(([c, n], i) => [
    k.shape({ x: 96 + i * 110, y: 220 + (i % 2) * 90, width: 100, height: 100 }, { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 9999, borderWidth: 4, borderColor: '#FFFFFF', borderStyle: 'solid', glowColor: '#FFFFFF', glowIntensity: 10, animation: 'float', animationTrigger: 'loop', animationDuration: 3 + i }, 'علم'),
    k.heading({ x: 96 + i * 110, y: 248 + (i % 2) * 90, width: 100, height: 40 }, c, 28, { color: '#FFFFFF', textAlign: 'center' }),
    k.text({ x: 96 + i * 110, y: 326 + (i % 2) * 90, width: 100, height: 24 }, n, 13, { color: '#FFFFFF', textAlign: 'center', fontWeight: 'bold' }),
  ]),
];

const levels = [
  k.eyebrow({ x: 884, y: 76, width: 300, height: 24 }, 'مستويات واضحة'),
  k.heading({ x: 484, y: 104, width: 700, height: 64 }, 'من الصفر حتى الطلاقة', 46),
  k.line({ x: 944, y: 184, width: 240, height: 4 }, 'line-wavy', '#0D9488'),
  ...[['A1 · A2', 'مبتدئ', 'الأساسيات والمحادثة اليومية', '#0D9488'], ['B1 · B2', 'متوسط', 'قواعد أعمق وكتابة ونقاش', '#6366F1'], ['C1 · C2', 'متقدم', 'طلاقة وتحضير للاختبارات', '#EC4899']].map(([lv, name, desc, c], i) => {
    const x = 864 - i * 352;
    return [
      k.card({ x, y: 240, width: 320, height: 240 }, { borderRadius: 28, borderWidth: 3, borderColor: c, borderStyle: 'solid', shadow: 'md', animation: 'slide-up', animationTrigger: 'once' }),
      k.shape({ x: x + 180, y: 262, width: 120, height: 44 }, { backgroundColor: c, borderRadius: 9999 }, 'مستوى'),
      k.heading({ x: x + 180, y: 266, width: 120, height: 36 }, lv, 18, { color: '#FFFFFF', textAlign: 'center' }),
      k.heading({ x: x + 22, y: 326, width: 276, height: 44 }, name, 32, { color: c }),
      k.text({ x: x + 22, y: 380, width: 276, height: 70 }, desc, 17),
    ];
  }).flat(),
  k.gallery({ x: 96, y: 540, width: 1088, height: 330 }, 'right-thumbnails', ['language class students', 'teacher whiteboard classroom', 'students speaking group', 'books and notebooks learning'], {}, 10, 22),
];

const cta = [
  k.shape({ x: 0, y: 0, width: 1280, height: 640 }, { backgroundColor: WAVE }, 'خلفية'),
  k.shape({ x: 60, y: 380, width: 360, height: 360 }, { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 9999 }, 'دائرة'),
  k.heading({ x: 484, y: 120, width: 700, height: 120 }, 'ابدأ بحصة تجريبية مجانية', 56, { color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.25)', textShadowIntensity: 10, textShadowPosition: 'bottom' }),
  k.text({ x: 584, y: 260, width: 600, height: 80 }, 'نحدد مستواك في 20 دقيقة ونرشح لك المجموعة المناسبة وموعداً يناسبك.', 20, { color: 'rgba(255,255,255,0.95)' }),
  k.glass({ x: 664, y: 380, width: 520, height: 150 }, false, { backgroundColor: 'rgba(255,255,255,0.18)', glowColor: '#FFFFFF', glowIntensity: 12 }),
  ...[['mdi:account-group-outline', 'مجموعات من 6 طلاب'], ['mdi:video-outline', 'حضوري أو عبر الإنترنت'], ['mdi:certificate-outline', 'شهادة إتمام لكل مستوى']].map(([ic, t], i) => [
    k.icon({ x: 1130, y: 396 + i * 40, width: 28, height: 28 }, ic, '#FFFFFF'),
    k.text({ x: 690, y: 398 + i * 40, width: 420, height: 26 }, t, 17, { color: '#FFFFFF', fontWeight: 'bold' }),
  ]).flat(),
  k.button({ x: 934, y: 556, width: 250, height: 58 }, 'احجز حصتي المجانية', undefined, { backgroundColor: '#FFFFFF', color: '#0F766E', glowColor: '#FFFFFF', glowIntensity: 18 }),
];

const page: PageSpec = {
  key: 'languages',
  name: 'مركز دورات لغات',
  category: 'p-business',
  look: L,
  navbar: {
    brand: 'أكاديمية لسان', items: [{ label: 'المستويات', slide: 2 }, { label: 'حصة مجانية', slide: 3 }], cta: { label: 'سجّل الآن', slide: 3 },
    bg: '#FFFFFF', text: '#134E4A', accent: '#0D9488', sticky: true, borderRadius: 0, borderColor: '#BFE7DF', borderWidth: 1,
    icons: { 'item-1': { icon: 'mdi:stairs-up', mode: 'icon-text' }, 'item-2': { icon: 'mdi:gift-outline', mode: 'icon-text' } },
  },
  slides: [
    { name: 'المدخل', height: 680, bg: { color: WAVE }, divider: 'asymmetric-wave', elements: hero },
    { name: 'المستويات', height: 920, bg: { color: L.bg }, divider: 'double-wave', elements: levels },
    { name: 'حصة مجانية', height: 640, bg: { color: '#0D9488' }, divider: 'straight', elements: cta },
  ],
};
export default page;

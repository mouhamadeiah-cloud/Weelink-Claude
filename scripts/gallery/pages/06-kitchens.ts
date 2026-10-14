// 6. Kitchen installation. Look «بيتي دافي»; a kitchen photo hero with a frosted card; a narrow floating navbar;
// round photos in circles; a measuring-visit strip.
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('homey');
const k = new Kit(L);
const A = L.accent;

const hero = [
  k.shape({ x: 0, y: 0, width: 1280, height: 700 }, { backgroundColor: 'linear-gradient(90deg, rgba(63,38,27,0.05) 0%, rgba(63,38,27,0.55) 100%)' }, 'تعتيم'),
  k.glass({ x: 640, y: 190, width: 544, height: 400 }, true, { backgroundColor: 'rgba(63,38,27,0.50)', borderRadius: 36, glowColor: '#F59E0B', glowIntensity: 14, glowPosition: 'bottom' }),
  k.badge({ x: 906, y: 222, width: 250, height: 36 }, 'تركيب مطابخ بكل أنواعها', { backgroundColor: 'rgba(245,158,11,0.9)', color: '#3F261B' }),
  k.heading({ x: 672, y: 276, width: 484, height: 100 }, 'مطبخ أحلامك يبدأ هنا', 44, { color: '#FFF7ED', animation: 'fade', animationTrigger: 'once' }),
  k.text({ x: 672, y: 396, width: 484, height: 80 }, 'قياس مجاني، تصميم ثلاثي الأبعاد، وتركيب نظيف بضمان.', 19, { color: 'rgba(255,247,237,0.92)' }),
  k.button({ x: 946, y: 508, width: 210, height: 54 }, 'احجز زيارة قياس', { slide: 3 }, { backgroundColor: '#F59E0B', color: '#3F261B' }),
  k.shape({ x: 96, y: 540, width: 150, height: 6 }, { backgroundColor: '#F59E0B', borderRadius: 9999 }, 'شريط'),
];

const styles = [
  k.eyebrow({ x: 884, y: 70, width: 300, height: 24 }, 'أنماطنا'),
  k.heading({ x: 484, y: 98, width: 700, height: 64 }, 'أي مطبخ يشبهك؟', 46),
  k.line({ x: 944, y: 176, width: 240, height: 4 }, 'line-dotted', A),
  ...[['عصري', 'modern white kitchen cabinets'], ['كلاسيكي', 'classic wooden kitchen'], ['مفتوح', 'open plan kitchen island'], ['صغير ذكي', 'small kitchen design']].flatMap(([name, q], i) => {
    const x = 940 - i * 280;
    return [
      k.shape({ x: x - 10, y: 216, width: 264, height: 264 }, { backgroundColor: 'transparent', borderRadius: 9999, borderWidth: 4, borderColor: A, borderStyle: 'dashed', animation: 'spin-slow', animationTrigger: 'loop', animationDuration: 30 }, 'حلقة'),
      k.image({ x, y: 226, width: 244, height: 244 }, q, { borderWidth: 0 }, { clipPath: 'clip-shape-geo-circle' }),
      k.heading({ x, y: 496, width: 244, height: 40 }, name, 26, { textAlign: 'center', color: A }),
    ];
  }),
  k.gallery({ x: 96, y: 570, width: 1088, height: 330 }, 'top-main', ['kitchen installation worker#0', 'kitchen installation worker#1', 'kitchen installation worker#2', 'kitchen installation worker#3'], { borderRadius: 28 }, 10, 22),
];

const visit = [
  k.shape({ x: 0, y: 0, width: 1280, height: 720 }, { backgroundColor: '#F6E6DC' }, 'خلفية'),
  k.shape({ x: 900, y: -120, width: 460, height: 460 }, { backgroundColor: 'rgba(154,52,18,0.10)', borderRadius: 9999 }, 'دائرة'),
  k.heading({ x: 484, y: 80, width: 700, height: 64 }, 'من القياس إلى الطبخة الأولى', 44),
  ...['زيارة وقياس مجاني', 'تصميم 3D ومواد', 'تصنيع وتركيب', 'تسليم وضمان'].flatMap((t, i) => {
    const x = 928 - i * 277;
    return [
      k.card({ x, y: 190, width: 256, height: 230 }, { borderRadius: 40, borderWidth: 2, borderColor: '#EFDCCB', shadow: 'md', animation: 'slide-up', animationTrigger: 'once' }),
      k.shape({ x: x + 90, y: 212, width: 76, height: 76 }, { backgroundColor: A, borderRadius: 9999, glowColor: A, glowIntensity: 14 }, 'رقم'),
      k.heading({ x: x + 90, y: 226, width: 76, height: 48 }, `${i + 1}`, 36, { color: '#FFFFFF', textAlign: 'center' }),
      k.heading({ x: x + 14, y: 312, width: 228, height: 40 }, t, 22, { textAlign: 'center' }),
      k.text({ x: x + 14, y: 358, width: 228, height: 50 }, ['نأتي لمكانك بلا رسوم', 'ترى مطبخك قبل صنعه', 'فريق متخصص ونظيف', 'ضمان على الصناعة'][i], 15, { textAlign: 'center' }),
    ];
  }),
  k.glass({ x: 96, y: 480, width: 1088, height: 170 }, false, { backgroundColor: A, borderColor: A, borderRadius: 40 }),
  k.heading({ x: 520, y: 506, width: 640, height: 56 }, 'جاهزون نزور مطبخك هذا الأسبوع', 34, { color: '#FFFFFF' }),
  k.text({ x: 520, y: 568, width: 640, height: 50 }, 'اختر يوماً مناسباً ونأتيك بالمتر والعينات.', 18, { color: 'rgba(255,255,255,0.9)' }),
  k.button({ x: 120, y: 540, width: 260, height: 58 }, 'احجز موعد الزيارة', undefined, { backgroundColor: '#FFFFFF', color: A }),
];

const page: PageSpec = {
  key: 'kitchens',
  name: 'تركيب مطابخ',
  category: 'p-business',
  look: L,
  navbar: { brand: 'مطابخ دار الهنا', items: [{ label: 'أنماطنا', slide: 2 }, { label: 'الزيارة', slide: 3 }], cta: { label: 'اطلب عرضاً', slide: 3 }, bg: '#FFFFFF', text: '#3F261B', accent: '#9A3412', sticky: true, posY: 4, width: 70, opacity: 0.85, borderRadius: 40, borderColor: '#EFDCCB', borderWidth: 1, glow: { color: '#F59E0B', intensity: 8 } },
  slides: [
    { name: 'المدخل', height: 700, bg: { image: 'modern kitchen interior warm light', fixed: true }, divider: 'tilt-left', elements: hero },
    { name: 'أنماطنا', height: 960, bg: { color: L.bg }, divider: 'curve-up', elements: styles },
    { name: 'الزيارة', height: 720, bg: { color: '#F6E6DC' }, divider: 'straight', innerGlow: { color: '#F59E0B', intensity: 45, position: 'bottom' }, elements: visit },
  ],
};
export default page;

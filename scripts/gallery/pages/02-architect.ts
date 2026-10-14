// 2. Architect. Look «أبيض وأسود»; a photo hero held still while the page scrolls; a lone hamburger navbar;
// drafting-table lines, outlined letters and hard frames.
import { Kit, look, type PageSpec } from '../dsl';

const L = look('mono');
const k = new Kit(L);
const W = '#FFFFFF';

const hero = [
  k.shape({ x: 0, y: 0, width: 1280, height: 720 }, { backgroundColor: 'linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.78) 100%)' }, 'تعتيم'),
  k.heading({ x: 40, y: 300, width: 480, height: 230 }, 'عمارة', 190, { color: 'transparent', textEffect: 'hollow', textEffectColor: '#FFFFFF', textEffectIntensity: 55, opacity: 0.55, textAlign: 'left' }),
  k.shape({ x: 1120, y: 120, width: 2, height: 480 }, { backgroundColor: 'rgba(255,255,255,0.35)' }, 'خط'),
  k.shape({ x: 1180, y: 120, width: 1, height: 480 }, { backgroundColor: 'rgba(255,255,255,0.2)' }, 'خط'),
  k.eyebrow({ x: 720, y: 196, width: 360, height: 26 }, 'مكتب هندسي معماري', { color: '#FFFFFF', letterSpacing: 2 }),
  k.heading({ x: 520, y: 236, width: 560, height: 180 }, 'نصمّم المساحات التي نعيش فيها', 58, { color: W, textShadowColor: 'rgba(0,0,0,0.6)', textShadowIntensity: 14, textShadowPosition: 'bottom', animation: 'slide-up', animationTrigger: 'once' }),
  k.text({ x: 600, y: 430, width: 480, height: 80 }, 'عمارة سكنية وتجارية بخطوط نظيفة وتفاصيل مدروسة من الفكرة حتى التسليم.', 18, { color: 'rgba(255,255,255,0.85)' }),
  k.button({ x: 890, y: 540, width: 190, height: 54 }, 'شاهد مشاريعنا', { slide: 2 }, { backgroundColor: W, color: '#0A0A0A', borderRadius: 0 }),
  k.button({ x: 676, y: 540, width: 190, height: 54 }, 'ابدأ مشروعك', { slide: 3 }, { backgroundColor: 'transparent', color: W, borderWidth: 2, borderColor: W, borderStyle: 'solid', borderRadius: 0 }),
  ...[['+120', 'مشروع منجز'], ['15', 'سنة خبرة'], ['8', 'جوائز تصميم']].flatMap(([n, l], i) => [
    k.glass({ x: 96 + i * 185, y: 560, width: 170, height: 96 }, true, { borderRadius: 0, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }),
    k.heading({ x: 96 + i * 185, y: 568, width: 170, height: 48 }, n, 36, { color: W, textAlign: 'center' }),
    k.text({ x: 96 + i * 185, y: 616, width: 170, height: 28 }, l, 15, { color: 'rgba(255,255,255,0.8)', textAlign: 'center' }),
  ]),
];

const projects = [
  k.eyebrow({ x: 884, y: 70, width: 300, height: 24 }, 'أعمال مختارة', { color: '#0A0A0A' }),
  k.heading({ x: 584, y: 98, width: 600, height: 64 }, 'مشاريع تتحدث بنفسها', 46),
  k.line({ x: 864, y: 176, width: 320, height: 2 }, 'line-double', '#0A0A0A'),
  k.image({ x: 564, y: 230, width: 620, height: 470 }, 'modern architecture villa exterior', { borderWidth: 6, borderColor: '#0A0A0A', borderStyle: 'solid', animation: 'scale-up', animationTrigger: 'hover' }),
  k.badge({ x: 1050, y: 250, width: 110, height: 36 }, '01 · فيلا', { backgroundColor: '#0A0A0A', color: W, borderRadius: 0 }),
  k.image({ x: 96, y: 230, width: 440, height: 220 }, 'minimalist concrete building', { borderWidth: 3, borderColor: '#0A0A0A', borderStyle: 'solid', imageFilter: 'grayscale', animation: 'scale-up', animationTrigger: 'hover' }),
  k.image({ x: 96, y: 480, width: 440, height: 220 }, 'architect drawing blueprint desk', { borderWidth: 3, borderColor: '#0A0A0A', borderStyle: 'solid', imageFilter: 'grayscale', animation: 'scale-up', animationTrigger: 'hover' }),
  k.text({ x: 96, y: 716, width: 440, height: 26 }, '02 · مبنى تجاري      03 · مخططات', 15, { color: '#0A0A0A', fontWeight: 'bold' }),
  k.shape({ x: 78, y: 212, width: 40, height: 40 }, { backgroundColor: 'transparent', borderWidth: 3, borderColor: '#0A0A0A', borderStyle: 'solid', borderRadius: 0 }, 'مربع'),
  k.shape({ x: 1166, y: 686, width: 40, height: 40 }, { backgroundColor: '#0A0A0A', borderRadius: 9999 }, 'دائرة'),
];

const steps = [
  k.shape({ x: 0, y: 0, width: 1280, height: 760 }, { backgroundColor: '#0A0A0A' }, 'خلفية'),
  k.eyebrow({ x: 884, y: 80, width: 300, height: 24 }, 'كيف نعمل', { color: '#FFFFFF' }),
  k.heading({ x: 584, y: 108, width: 600, height: 64 }, 'من الفكرة إلى المفتاح', 46, { color: W, textEffect: 'outline-fill', textEffectColor: '#FFFFFF', textEffectIntensity: 40 }),
  k.line({ x: 130, y: 330, width: 1020, height: 2 }, 'line-dashed', 'rgba(255,255,255,0.6)'),
  ...['الفكرة والمخطط', 'التصميم ثلاثي الأبعاد', 'التراخيص والتنفيذ', 'التسليم والمتابعة'].flatMap((t, i) => {
    const x = 1044 - i * 300;
    return [
      k.shape({ x, y: 280, width: 100, height: 100 }, { backgroundColor: '#0A0A0A', borderWidth: 3, borderColor: W, borderStyle: 'solid', borderRadius: 9999, glowColor: '#FFFFFF', glowIntensity: 10 }, 'دائرة'),
      k.heading({ x, y: 304, width: 100, height: 50 }, `0${i + 1}`, 34, { color: W, textAlign: 'center' }),
      k.text({ x: x - 60, y: 410, width: 220, height: 30 }, t, 19, { color: W, textAlign: 'center', fontWeight: 'bold' }),
      k.text({ x: x - 60, y: 446, width: 220, height: 70 }, ['نستمع لاحتياجك ونرسم الأفكار الأولى.', 'مجسمات ومشاهد واقعية قبل البناء.', 'نتابع الموقع ونضبط الجودة والمواعيد.', 'تسليم مرتب مع ملف كامل للمشروع.'][i], 15, { color: 'rgba(255,255,255,0.7)', textAlign: 'center' }),
    ];
  }),
  k.gallery({ x: 96, y: 530, width: 700, height: 200 }, 'top-main', ['architecture model wood', 'building site crane sunset', 'interior design living room'], { borderRadius: 0 }, 8, 0),
  k.button({ x: 934, y: 590, width: 250, height: 58 }, 'احجز استشارة هندسية', { slide: 3 }, { backgroundColor: W, color: '#0A0A0A', borderRadius: 0 }),
];

const page: PageSpec = {
  key: 'architect',
  name: 'مكتب هندسة معمارية',
  category: 'p-business',
  look: L,
  navbar: { brand: 'مكتب أفق للعمارة', items: [{ label: 'المشاريع', slide: 2 }, { label: 'طريقة العمل', slide: 3 }], bg: '#0A0A0A', text: '#FFFFFF', accent: '#FFFFFF', accentText: '#0A0A0A', sticky: true, layout: 'hamburger' },
  slides: [
    { name: 'المدخل', height: 720, bg: { image: 'modern architecture building facade', fixed: true }, divider: 'slanted', elements: hero },
    { name: 'المشاريع', height: 780, bg: { color: '#FFFFFF' }, divider: 'triangle', elements: projects },
    { name: 'طريقة العمل', height: 760, bg: { color: '#0A0A0A' }, divider: 'straight', elements: steps },
  ],
};
export default page;

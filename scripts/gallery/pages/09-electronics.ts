// 9. Electronics repair. Look «تقني»; a processor video hero; a navbar column on the left; neon glows and
// device tiles; the ratings block.
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('tech');
const k = new Kit(L);
const A = L.accent;
const CYAN = '#22D3EE';

// The navbar column is on the left (posX 0): the content sits in x 250..1184.
const hero = [
  k.shape({ x: 0, y: 0, width: 1280, height: 700 }, { backgroundColor: 'linear-gradient(90deg, rgba(13,20,36,0.35) 0%, rgba(13,20,36,0.85) 100%)' }, 'تعتيم'),
  k.shape({ x: 250, y: 120, width: 934, height: 2 }, { backgroundColor: rgba(CYAN, 0.5) }, 'خط'),
  k.badge({ x: 904, y: 160, width: 280, height: 36 }, 'صيانة إلكترونيات خلال ساعات', { backgroundColor: rgba(CYAN, 0.12), color: CYAN, borderWidth: 1, borderColor: CYAN, borderStyle: 'solid' }),
  k.heading({ x: 384, y: 214, width: 800, height: 140 }, 'جهازك يعمل من جديد', 70, { color: '#FFFFFF', textEffect: 'neon', textEffectColor: CYAN, textEffectIntensity: 55, animation: 'fade', animationTrigger: 'once' }),
  k.text({ x: 504, y: 374, width: 680, height: 80 }, 'موبايلات وحواسيب وشاشات وأجهزة ألعاب. فحص مجاني وقطع أصلية وضمان على الإصلاح.', 20, { color: 'rgba(230,236,247,0.92)' }),
  k.button({ x: 954, y: 490, width: 230, height: 56 }, 'احجز فحصاً مجانياً', { slide: 3 }, { backgroundColor: CYAN, color: '#04222B', glowColor: CYAN, glowIntensity: 22, borderRadius: 6 }),
  k.button({ x: 704, y: 490, width: 230, height: 56 }, 'ماذا نصلح؟', { slide: 2 }, { backgroundColor: 'transparent', color: CYAN, borderWidth: 2, borderColor: CYAN, borderStyle: 'solid', borderRadius: 6 }),
  ...[['24h', 'متوسط الإصلاح'], ['90 يوماً', 'ضمان'], ['0', 'رسوم الفحص']].flatMap(([n, l], i) => [
    k.heading({ x: 1004 - i * 250, y: 590, width: 180, height: 44 }, n, 32, { color: CYAN, textAlign: 'center' }),
    k.text({ x: 1004 - i * 250, y: 636, width: 180, height: 26 }, l, 14, { textAlign: 'center' }),
  ]),
];

const devices = [
  k.eyebrow({ x: 884, y: 70, width: 300, height: 24 }, 'ماذا نصلح', { color: CYAN }),
  k.heading({ x: 484, y: 98, width: 700, height: 64 }, 'كل أجهزتك في مكان واحد', 44),
  ...[['mdi:cellphone', 'موبايلات'], ['mdi:laptop', 'لابتوب'], ['mdi:television', 'شاشات'], ['mdi:tablet', 'تابلت'], ['mdi:gamepad-variant-outline', 'ألعاب'], ['mdi:printer-outline', 'طابعات']].flatMap(([ic, name], i) => {
    const x = 944 - (i % 3) * 330 + 0;
    const y = 210 + Math.floor(i / 3) * 190;
    return [
      k.card({ x: x - 20, y, width: 300, height: 160 }, { borderRadius: 14, borderWidth: 2, borderColor: rgba(CYAN, 0.5), borderStyle: 'solid', glowColor: CYAN, glowIntensity: 10, animation: 'float', animationTrigger: 'hover' }),
      k.icon({ x: x + 190, y: y + 28, width: 64, height: 64 }, ic, CYAN),
      k.heading({ x: x - 4, y: y + 100, width: 268, height: 38 }, name, 24, { textAlign: 'center' }),
    ];
  }),
  k.gallery({ x: 250, y: 620, width: 934, height: 220 }, 'top-main', ['electronics repair bench soldering', 'smartphone screen repair', 'laptop motherboard repair'], { borderRadius: 14 }, 8, 10),
];

const track = [
  k.shape({ x: 0, y: 0, width: 1280, height: 780 }, { backgroundColor: '#0A1020' }, 'خلفية'),
  k.heading({ x: 484, y: 70, width: 700, height: 64 }, 'تابع إصلاحك خطوة بخطوة', 42, { textEffect: 'soft-glow', textEffectColor: CYAN, textEffectIntensity: 40 }),
  k.line({ x: 250, y: 232, width: 934, height: 2 }, 'line-dashed', rgba(CYAN, 0.6)),
  ...['استلام الجهاز', 'فحص وتشخيص', 'إصلاح', 'اختبار وتسليم'].flatMap((t, i) => {
    const x = 1100 - i * 262;
    return [
      k.shape({ x, y: 190, width: 84, height: 84 }, { backgroundColor: '#0D1424', borderRadius: 9999, borderWidth: 3, borderColor: CYAN, borderStyle: 'solid', glowColor: CYAN, glowIntensity: 14 }, 'عقدة'),
      k.heading({ x, y: 206, width: 84, height: 50 }, `${i + 1}`, 34, { color: CYAN, textAlign: 'center' }),
      k.text({ x: x - 50, y: 290, width: 184, height: 30 }, t, 17, { textAlign: 'center', color: '#E6ECF7', fontWeight: 'bold' }),
    ];
  }),
  k.ratings({ x: 250, y: 380, width: 520, height: 260 }, '#FBBF24', { borderRadius: 16 }),
  k.text({ x: 800, y: 390, width: 384, height: 110 }, 'عميل راضٍ هو أفضل إعلان لنا. قيّم تجربتك بعد الإصلاح.', 19, { color: 'rgba(230,236,247,0.9)' }),
  k.button({ x: 934, y: 560, width: 250, height: 58 }, 'احجز موعد استلام', undefined, { backgroundColor: CYAN, color: '#04222B', glowColor: CYAN, glowIntensity: 20, borderRadius: 6 }),
];

const page: PageSpec = {
  key: 'electronics',
  name: 'تصليح إلكترونيات',
  category: 'p-business',
  look: L,
  navbar: { brand: 'تك فيكس', items: [{ label: 'ماذا نصلح', slide: 2 }, { label: 'تتبع الإصلاح', slide: 3 }], cta: { label: 'فحص مجاني', slide: 3 }, bg: '#0A1020', text: '#E6ECF7', accent: '#22D3EE', accentText: '#04222B', sticky: true, layout: 'vertical', sideWidth: 200, posX: 0, borderColor: 'rgba(34,211,238,0.5)', borderWidth: 1, glow: { color: '#22D3EE', intensity: 12 } },
  slides: [
    { name: 'المدخل', height: 700, bg: { video: '15254965' }, divider: 'straight', elements: hero },
    { name: 'الأجهزة', height: 900, bg: { color: L.bg }, divider: 'slanted', elements: devices },
    { name: 'التتبع', height: 780, bg: { color: '#0A1020' }, divider: 'straight', innerGlow: { color: '#22D3EE', intensity: 60, position: 'bottom' }, elements: track },
  ],
};
export default page;

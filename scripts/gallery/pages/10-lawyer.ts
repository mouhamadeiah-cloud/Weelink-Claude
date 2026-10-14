// 10. Lawyer. Look «فخم داكن»; a law-books photo hero in a double gold frame; a classic navbar that scrolls away;
// practice areas in fine-lined boxes.
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('luxe');
const k = new Kit(L);
const GOLD = L.accent;

const hero = [
  k.shape({ x: 0, y: 0, width: 1280, height: 720 }, { backgroundColor: 'rgba(11,17,28,0.72)' }, 'تعتيم'),
  k.shape({ x: 150, y: 70, width: 980, height: 580 }, { backgroundColor: 'transparent', borderWidth: 3, borderColor: GOLD, borderStyle: 'solid', borderRadius: 0 }, 'إطار'),
  k.shape({ x: 168, y: 88, width: 944, height: 544 }, { backgroundColor: 'transparent', borderWidth: 1, borderColor: rgba(GOLD, 0.6), borderStyle: 'solid', borderRadius: 0 }, 'إطار داخلي'),
  k.icon({ x: 600, y: 120, width: 80, height: 80 }, 'mdi:scale-balance', GOLD),
  k.eyebrow({ x: 340, y: 214, width: 600, height: 26 }, 'مكتب محاماة واستشارات قانونية', { textAlign: 'center', color: GOLD, letterSpacing: 3 }),
  k.heading({ x: 240, y: 256, width: 800, height: 120 }, 'حقك أمانة بين أيدينا', 76, { textAlign: 'center', textEffect: 'gold', textEffectIntensity: 55 }),
  k.line({ x: 440, y: 396, width: 400, height: 3 }, 'line-double', GOLD),
  k.text({ x: 320, y: 426, width: 640, height: 70 }, 'قضايا مدنية وتجارية وأحوال شخصية بخبرة قانونية وسرية تامة.', 20, { textAlign: 'center', color: 'rgba(231,236,243,0.9)' }),
  k.button({ x: 440, y: 530, width: 200, height: 54 }, 'احجز استشارة', { slide: 3 }, { backgroundColor: GOLD, color: '#1A1405', borderRadius: 0 }),
  k.button({ x: 660, y: 530, width: 200, height: 54 }, 'مجالات عملنا', { slide: 2 }, { backgroundColor: 'transparent', color: GOLD, borderWidth: 2, borderColor: GOLD, borderStyle: 'solid', borderRadius: 0 }),
];

const areas = [
  k.eyebrow({ x: 884, y: 70, width: 300, height: 24 }, 'مجالات عملنا'),
  k.heading({ x: 484, y: 98, width: 700, height: 64 }, 'خبرة تغطي ما تحتاجه', 46),
  ...[['mdi:gavel', 'قضايا مدنية'], ['mdi:handshake-outline', 'عقود وتجارة'], ['mdi:home-city-outline', 'عقارات وملكية'], ['mdi:account-group-outline', 'أحوال شخصية'], ['mdi:file-document-outline', 'توثيق وتسجيل'], ['mdi:shield-account-outline', 'تحكيم وتسويات']].flatMap(([ic, name], i) => {
    const x = 840 - (i % 3) * 372;
    const y = 210 + Math.floor(i / 3) * 190;
    return [
      k.card({ x, y, width: 344, height: 160 }, { backgroundColor: L.card, borderRadius: 0, borderWidth: 1, borderColor: rgba(GOLD, 0.5), borderStyle: 'solid', animation: 'slide-up', animationTrigger: 'once' }),
      k.shape({ x: x + 270, y: y + 20, width: 56, height: 56 }, { backgroundColor: 'transparent', borderWidth: 2, borderColor: GOLD, borderStyle: 'solid', borderRadius: 0 }, 'مربع'),
      k.icon({ x: x + 280, y: y + 30, width: 36, height: 36 }, ic, GOLD),
      k.heading({ x: x + 20, y: y + 96, width: 304, height: 40 }, name, 26),
    ];
  }),
];

const consult = [
  k.shape({ x: 0, y: 0, width: 1280, height: 640 }, { backgroundColor: '#0F1726' }, 'خلفية'),
  k.gallery({ x: 96, y: 90, width: 540, height: 460 }, 'right-thumbnails', ['law office books desk', 'lawyer handshake client', 'courthouse columns', 'legal documents signing'], { borderRadius: 0, borderWidth: 2, borderColor: GOLD, borderStyle: 'solid' }, 8, 0),
  k.eyebrow({ x: 884, y: 100, width: 300, height: 24 }, 'استشارة سرية'),
  k.heading({ x: 664, y: 130, width: 520, height: 130 }, 'اعرض قضيتك على محامٍ مختص', 42),
  k.text({ x: 664, y: 280, width: 520, height: 100 }, 'جلسة أولى لفهم قضيتك وتقدير الموقف القانوني. نلتزم بالسرية الكاملة.', 19),
  k.button({ x: 934, y: 420, width: 250, height: 58 }, 'احجز جلسة استشارية', undefined, { backgroundColor: GOLD, color: '#1A1405', borderRadius: 0, glowColor: GOLD, glowIntensity: 16 }),
  k.line({ x: 664, y: 520, width: 520, height: 2 }, 'line-gradient', GOLD),
  k.text({ x: 664, y: 540, width: 520, height: 60 }, 'السبت إلى الخميس، من 10 صباحاً حتى 6 مساءً.', 17, { color: 'rgba(231,236,243,0.7)' }),
];

const page: PageSpec = {
  key: 'lawyer',
  name: 'مكتب محاماة',
  category: 'p-business',
  look: L,
  navbar: { brand: 'مكتب العدالة للمحاماة', items: [{ label: 'مجالات العمل', slide: 2 }, { label: 'استشارة', slide: 3 }], cta: { label: 'اتصل بنا', slide: 3 }, bg: '#0B111C', text: '#E7ECF3', accent: '#C9A24A', accentText: '#1A1405', sticky: false, borderColor: '#C9A24A', borderWidth: 1, borderRadius: 0, itemsAlign: 'right' },
  slides: [
    { name: 'المدخل', height: 720, bg: { image: 'law books library dark', fixed: true }, divider: 'straight', elements: hero },
    { name: 'المجالات', height: 640, bg: { color: '#0F1726' }, divider: 'straight', elements: areas },
    { name: 'الاستشارة', height: 640, bg: { color: '#0F1726' }, divider: 'straight', elements: consult },
  ],
};
export default page;

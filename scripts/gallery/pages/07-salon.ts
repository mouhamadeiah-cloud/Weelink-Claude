// 7. Women's hair and beauty salon. Look «ناعم»; a salon video hero; a floating navbar at the bottom of the screen;
// soft pink glows, capsule photos and a service menu with prices as text.
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('soft');
const k = new Kit(L);
const A = L.accent;
const ROSE = '#F9A8D4';

const hero = [
  k.shape({ x: 0, y: 0, width: 1280, height: 720 }, { backgroundColor: 'linear-gradient(180deg, rgba(74,29,44,0.30) 0%, rgba(74,29,44,0.78) 100%)' }, 'تعتيم'),
  k.badge({ x: 470, y: 190, width: 340, height: 38 }, 'صالون تجميل وشعر للسيدات', { backgroundColor: 'rgba(255,255,255,0.18)', color: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', borderStyle: 'solid' }),
  k.heading({ x: 170, y: 250, width: 940, height: 100 }, 'جمالك يستحق وقتاً خاصاً', 56, { textAlign: 'center', color: '#FFFFFF', textEffect: 'neon-pulse', textEffectColor: ROSE, textEffectIntensity: 45 }),
  k.text({ x: 300, y: 384, width: 680, height: 70 }, 'قص وصبغ وعناية بالبشرة ومكياج مناسبات بأيدٍ ماهرة وأجواء مريحة.', 20, { textAlign: 'center', color: 'rgba(255,255,255,0.92)' }),
  k.button({ x: 430, y: 490, width: 200, height: 56 }, 'احجزي موعدك', { slide: 3 }, { backgroundColor: ROSE, color: '#4A1D2C', glowColor: ROSE, glowIntensity: 20 }),
  k.button({ x: 650, y: 490, width: 200, height: 56 }, 'قائمة الخدمات', { slide: 2 }, { backgroundColor: 'transparent', color: '#FFFFFF', borderWidth: 2, borderColor: '#FFFFFF', borderStyle: 'solid' }),
];

const menu = [
  k.eyebrow({ x: 884, y: 70, width: 300, height: 24 }, 'خدماتنا'),
  k.heading({ x: 384, y: 98, width: 800, height: 64 }, 'كل ما تحتاجينه في مكان واحد', 32),
  ...[['mdi:content-cut', 'قص وتصفيف', 'من 15 دولاراً'], ['mdi:palette-outline', 'صبغة ومشاقر', 'من 35 دولاراً'], ['mdi:face-woman-shimmer-outline', 'عناية بالبشرة', 'من 25 دولاراً'], ['mdi:hand-heart-outline', 'أظافر ومكياج', 'من 20 دولاراً']].flatMap(([ic, name, price], i) => {
    const x = 940 - i * 280;
    return [
      k.card({ x, y: 210, width: 244, height: 250 }, { borderRadius: 122, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#F3D9E1', glowColor: ROSE, glowIntensity: 14, glowPosition: 'bottom', animation: 'float', animationTrigger: 'loop', animationDuration: 3.5 + i * 0.5 }),
      k.icon({ x: x + 90, y: 246, width: 64, height: 64 }, ic, A),
      k.heading({ x: x + 14, y: 330, width: 216, height: 38 }, name, 22, { textAlign: 'center' }),
      k.text({ x: x + 14, y: 376, width: 216, height: 30 }, price, 17, { textAlign: 'center', color: A, fontWeight: 'bold' }),
    ];
  }),
  ...[['hair salon styling', 0], ['bridal makeup artist', 1], ['nail art manicure', 2], ['hair color balayage', 3]].map(([q, i]) =>
    k.image({ x: 940 - (i as number) * 280, y: 500, width: 244, height: 330 }, q as string, { borderWidth: 4, borderColor: '#FFFFFF', borderStyle: 'solid', shadow: 'lg' }, { clipPath: 'clip-shape-geo-capsule' })),
];

const booking = [
  k.shape({ x: 0, y: 0, width: 1280, height: 1040 }, { backgroundColor: 'linear-gradient(160deg, #FFE4EC 0%, #F8E1E8 45%, #E9D5FF 100%)' }, 'خلفية'),
  k.shape({ x: -80, y: 460, width: 380, height: 380 }, { backgroundColor: 'rgba(194,65,107,0.10)', borderRadius: 9999 }, 'دائرة'),
  k.heading({ x: 484, y: 70, width: 700, height: 64 }, 'احجزي بكل سهولة', 46, { color: '#4A1D2C' }),
  k.text({ x: 584, y: 144, width: 600, height: 44 }, 'اختاري اليوم والساعة ويصلك تأكيد الموعد.', 18),
  k.calendar({ x: 664, y: 220, width: 520, height: 640 }, '#C2416B', 'احجزي موعدك في الصالون'),
  k.ratings({ x: 96, y: 220, width: 520, height: 250 }, '#F59E0B', { borderRadius: 24 }),
  k.glass({ x: 96, y: 500, width: 520, height: 230 }, false, { backgroundColor: 'rgba(255,255,255,0.65)', borderColor: '#F3D9E1', borderRadius: 24 }),
  k.heading({ x: 124, y: 520, width: 464, height: 38 }, 'مواعيدنا', 24),
  k.text({ x: 124, y: 568, width: 464, height: 130 }, 'يومياً من 10 صباحاً حتى 8 مساءً، والجمعة بالحجز المسبق. مواعيد العرائس تُحجز قبل أسبوعين.', 17),
];

const page: PageSpec = {
  key: 'salon',
  name: 'صالون تجميل وشعر للسيدات',
  category: 'p-business',
  look: L,
  navbar: { brand: 'صالون لمسة', items: [{ label: 'الخدمات', slide: 2 }, { label: 'الحجز', slide: 3 }], cta: { label: 'احجزي', slide: 3 }, bg: '#4A1D2C', text: '#FFFFFF', accent: ROSE, accentText: '#4A1D2C', sticky: true, posY: 96, width: 64, opacity: 0.9, borderRadius: 40, glow: { color: ROSE, intensity: 16 } },
  slides: [
    { name: 'المدخل', height: 720, bg: { video: '7253934' }, divider: 'wave', elements: hero },
    { name: 'الخدمات', height: 900, bg: { color: L.bg }, divider: 'curve-down', elements: menu },
    { name: 'الحجز', height: 1040, bg: { color: '#FFE4EC' }, divider: 'straight', elements: booking },
  ],
};
export default page;

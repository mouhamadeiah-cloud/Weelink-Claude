// 5. Carpenter. Look «تراثي»; a workshop video hero; a navbar with framed page names; wood-grain bands made
// of lines and shapes; before/after photos.
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('heritage');
const k = new Kit(L);
const WOOD = '#7C4A21';
const CREAM = '#FBF7EE';

const hero = [
  k.shape({ x: 0, y: 0, width: 1280, height: 700 }, { backgroundColor: 'linear-gradient(270deg, rgba(43,26,10,0.88) 0%, rgba(43,26,10,0.55) 60%, rgba(43,26,10,0.3) 100%)' }, 'تعتيم'),
  k.shape({ x: 96, y: 150, width: 6, height: 420 }, { backgroundColor: '#D4A056', glowColor: '#D4A056', glowIntensity: 12 }, 'شريط خشب'),
  k.eyebrow({ x: 804, y: 190, width: 380, height: 26 }, 'ورشة نجارة وديكور', { color: '#D4A056' }),
  k.heading({ x: 484, y: 230, width: 700, height: 210 }, 'نحوّل الخشب إلى قطع تعيش معك', 62, { color: CREAM, textEffect: 'shadow-long', textEffectColor: '#2B1A0A', textEffectIntensity: 45, animation: 'slide-up', animationTrigger: 'once' }),
  k.text({ x: 604, y: 460, width: 580, height: 80 }, 'مطابخ وأبواب وخزائن وغرف نوم بصناعة يدوية دقيقة وخشب مختار.', 19, { color: 'rgba(251,247,238,0.92)' }),
  k.button({ x: 954, y: 570, width: 230, height: 56 }, 'اطلب عرض سعر', { slide: 3 }, { backgroundColor: '#D4A056', color: '#2B1A0A', borderRadius: 6 }),
  k.button({ x: 704, y: 570, width: 230, height: 56 }, 'شاهد أعمالنا', { slide: 2 }, { backgroundColor: 'transparent', color: CREAM, borderWidth: 2, borderColor: '#D4A056', borderStyle: 'solid', borderRadius: 6 }),
];

const works = [
  k.line({ x: 0, y: 28, width: 1280, height: 6 }, 'line-3d', WOOD),
  k.eyebrow({ x: 884, y: 84, width: 300, height: 24 }, 'من ورشتنا'),
  k.heading({ x: 584, y: 112, width: 600, height: 64 }, 'أعمال صُنعت بإتقان', 46),
  k.line({ x: 884, y: 190, width: 300, height: 4 }, 'line-zigzag', WOOD),
  ...[['مطبخ خشب زان', 'solid wood kitchen cabinets'], ['خزانة غرفة نوم', 'wooden wardrobe bedroom'], ['باب خشبي منحوت', 'carved wooden door']].flatMap(([name, q], i) => {
    const x = 840 - i * 372;
    return [
      k.image({ x, y: 240, width: 344, height: 280 }, q, { borderWidth: 8, borderColor: WOOD, borderStyle: 'solid', borderRadius: 6, animation: 'scale-up', animationTrigger: 'hover' }),
      k.card({ x, y: 540, width: 344, height: 78 }, { backgroundColor: '#FFFFFF', borderRadius: 6, borderWidth: 2, borderColor: '#E3D6BD' }),
      k.heading({ x: x + 16, y: 560, width: 312, height: 40 }, name, 22, { color: L.accent }),
    ];
  }),
  k.gallery({ x: 96, y: 660, width: 1088, height: 340 }, 'left-main-row', ['woodworking workshop tools', 'carpenter sanding wood', 'wood planks stack', 'furniture finishing varnish'], { borderRadius: 8, borderWidth: 4, borderColor: '#E3D6BD', borderStyle: 'solid' }, 10, 8),
];

const quote = [
  k.shape({ x: 0, y: 0, width: 1280, height: 720 }, { backgroundColor: '#2B1A0A' }, 'خلفية'),
  k.line({ x: 0, y: 30, width: 1280, height: 6 }, 'line-3d', '#D4A056'),
  k.heading({ x: 584, y: 90, width: 600, height: 64 }, 'كيف نبدأ معك', 44, { color: CREAM, textEffect: 'gold', textEffectIntensity: 50 }),
  ...['نزور المكان ونقيس', 'نرسم ونتفق على الخشب', 'نصنع في الورشة', 'نركّب ونسلّم'].flatMap((t, i) => {
    const x = 928 - i * 277;
    return [
      k.shape({ x, y: 200, width: 256, height: 150 }, { backgroundColor: 'rgba(212,160,86,0.12)', borderWidth: 2, borderColor: 'rgba(212,160,86,0.7)', borderStyle: 'dashed', borderRadius: 8 }, 'إطار'),
      k.heading({ x: x + 140, y: 214, width: 100, height: 56 }, `0${i + 1}`, 44, { color: '#D4A056', textAlign: 'left' }),
      k.text({ x: x + 14, y: 282, width: 228, height: 54 }, t, 19, { color: CREAM, fontWeight: 'bold' }),
    ];
  }),
  k.ratings({ x: 96, y: 410, width: 600, height: 260 }, '#D4A056', { borderRadius: 12 }),
  k.text({ x: 724, y: 420, width: 460, height: 120 }, 'ارسم لنا فكرتك أو أرسل قياسات مكانك، ونعطيك عرض سعر واضح خلال يومين.', 20, { color: 'rgba(251,247,238,0.9)' }),
  k.button({ x: 934, y: 580, width: 250, height: 58 }, 'اطلب عرض سعر مجاني', undefined, { backgroundColor: '#D4A056', color: '#2B1A0A', borderRadius: 6, glowColor: '#D4A056', glowIntensity: 14 }),
];

const page: PageSpec = {
  key: 'carpenter',
  name: 'ورشة نجارة وديكور',
  category: 'p-business',
  look: L,
  navbar: {
    brand: 'نجارة الأصيل', items: [{ label: 'أعمالنا', slide: 2 }, { label: 'اطلب عرض', slide: 3 }], cta: { label: 'اتصل بنا', slide: 3 },
    bg: '#2B1A0A', text: '#FBF7EE', accent: '#D4A056', accentText: '#2B1A0A', sticky: true,
    itemsFrame: { bg: 'rgba(212,160,86,0.12)', border: '#D4A056', borderWidth: 1, radius: 4 }, itemsAlign: 'center',
  },
  slides: [
    { name: 'المدخل', height: 700, bg: { video: '4480575' }, divider: 'zigzag', elements: hero },
    { name: 'أعمالنا', height: 1040, bg: { color: L.bg }, divider: 'clouds', elements: works },
    { name: 'اطلب عرضاً', height: 720, bg: { color: '#2B1A0A' }, divider: 'straight', elements: quote },
  ],
};
export default page;

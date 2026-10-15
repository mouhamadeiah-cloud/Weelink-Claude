// 14. Upscale restaurant with advance booking. Look «ذهبي فاتح»; a dim dining-room photo hero in a thin frame; a narrow
// dark floating navbar; a tasting menu; the booking calendar and ratings.
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('gold');
const k = new Kit(L);
const GOLD = '#D4AF37';
const INK = '#14110C';

const hero = [
  k.shape({ x: 0, y: 0, width: 1280, height: 740 }, { backgroundColor: 'rgba(20,17,12,0.62)' }, 'تعتيم'),
  k.shape({ x: 60, y: 90, width: 1160, height: 600 }, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(212,175,55,0.7)', borderStyle: 'solid', borderRadius: 0 }, 'إطار'),
  k.eyebrow({ x: 440, y: 190, width: 400, height: 26 }, 'مطعم راقٍ · حجز مسبق', { textAlign: 'center', color: GOLD, letterSpacing: 5 }),
  k.heading({ x: 190, y: 236, width: 900, height: 130 }, 'أمسية لا تُنسى', 88, { textAlign: 'center', color: '#FFFFFF', textEffect: 'gold', textEffectIntensity: 55, animation: 'fade', animationTrigger: 'once' }),
  k.line({ x: 490, y: 396, width: 300, height: 3 }, 'line-glow', GOLD),
  k.text({ x: 340, y: 426, width: 600, height: 70 }, 'قائمة تذوق من 5 أطباق يعدّها الشيف أمامك، في أجواء هادئة وخدمة راقية.', 20, { textAlign: 'center', color: 'rgba(255,255,255,0.88)' }),
  k.button({ x: 540, y: 540, width: 200, height: 56 }, 'احجز طاولتك', { slide: 3 }, { backgroundColor: GOLD, color: INK, borderRadius: 0, glowColor: GOLD, glowIntensity: 16 }),
];

const tasting = [
  k.heading({ x: 384, y: 70, width: 800, height: 64 }, 'قائمة التذوق', 50),
  k.line({ x: 784, y: 150, width: 400, height: 3 }, 'line-double', GOLD),
  ...[['مقبلات', 'كرات الجبن الذهبية', 'فطر الغابة', 'mdi:leaf'], ['الطبق الرئيسي', 'فيليه مع صلصة النبيذ', 'سمك سلمون مشوي', 'mdi:silverware-fork-knife'], ['الحلوى', 'ملبن بالفستق', 'شوكولا داكنة', 'mdi:cake-variant-outline']].flatMap(([title, a, b, ic], i) => {
    const x = 840 - i * 372;
    return [
      k.card({ x, y: 210, width: 344, height: 300 }, { backgroundColor: '#FFFFFF', borderRadius: 0, borderWidth: 1, borderColor: '#EADFC6', shadow: 'md', animation: 'slide-up', animationTrigger: 'once' }),
      k.shape({ x: x + 14, y: 224, width: 316, height: 272 }, { backgroundColor: 'transparent', borderWidth: 1, borderColor: GOLD, borderStyle: 'solid', borderRadius: 0 }, 'إطار'),
      k.icon({ x: x + 150, y: 244, width: 44, height: 44 }, ic, GOLD),
      k.heading({ x: x + 24, y: 306, width: 296, height: 40 }, title, 28, { textAlign: 'center' }),
      k.text({ x: x + 24, y: 366, width: 296, height: 30 }, a, 18, { textAlign: 'center', color: INK }),
      k.text({ x: x + 24, y: 406, width: 296, height: 30 }, b, 18, { textAlign: 'center', color: INK }),
    ];
  }),
  ...['fine dining plated dish', 'elegant restaurant table candle', 'chef plating gourmet'].map((q, i) => k.image({ x: 840 - i * 372, y: 560, width: 344, height: 300 }, q, { borderWidth: 3, borderColor: GOLD, borderStyle: 'solid', animation: 'scale-up', animationTrigger: 'hover' })),
];

const booking = [
  k.shape({ x: 0, y: 0, width: 1280, height: 940 }, { backgroundColor: '#14110C' }, 'خلفية'),
  k.heading({ x: 484, y: 70, width: 700, height: 64 }, 'احجز طاولتك مسبقاً', 46, { color: '#F5D58A' }),
  k.text({ x: 584, y: 146, width: 600, height: 50 }, 'نستقبل الحجوزات حتى 60 يوماً مسبقاً، وتصلك رسالة تأكيد.', 18, { color: 'rgba(255,255,255,0.8)' }),
  k.calendar({ x: 664, y: 230, width: 520, height: 660 }, GOLD, 'حجز طاولة'),
  k.ratings({ x: 96, y: 230, width: 520, height: 250 }, GOLD, { borderRadius: 0 }),
  k.shape({ x: 96, y: 510, width: 520, height: 260 }, { backgroundColor: 'transparent', borderWidth: 1, borderColor: GOLD, borderStyle: 'solid', borderRadius: 0 }, 'إطار'),
  k.heading({ x: 120, y: 530, width: 472, height: 40 }, 'قبل أن تأتي', 26, { color: '#F5D58A' }),
  k.text({ x: 120, y: 584, width: 472, height: 170 }, 'اللباس أنيق غير رسمي. نحتفظ بالطاولة 15 دقيقة. للمجموعات الأكثر من 8 أشخاص يرجى الحجز قبل أسبوع.', 17, { color: 'rgba(255,255,255,0.82)' }),
];

const page: PageSpec = {
  key: 'fine-dining',
  name: 'مطعم راقٍ مع حجز مسبق',
  category: 'p-restaurant',
  look: L,
  navbar: { brand: 'مطعم ذهب', items: [{ label: 'قائمة التذوق', slide: 2 }, { label: 'الحجز', slide: 3 }], cta: { label: 'احجز', slide: 3 }, bg: '#14110C', text: '#F5D58A', accent: '#D4AF37', accentText: '#14110C', sticky: true, posY: 4, width: 60, opacity: 0.8, borderRadius: 2, borderColor: 'rgba(212,175,55,0.6)', borderWidth: 1 },
  slides: [
    { name: 'المدخل', height: 740, bg: { image: 'fine dining restaurant interior dark candlelight', fixed: true }, divider: 'straight', elements: hero },
    { name: 'قائمة التذوق', height: 900, bg: { color: L.bg }, divider: 'tilt-right', elements: tasting },
    { name: 'الحجز', height: 940, bg: { color: '#14110C' }, divider: 'straight', innerGlow: { color: '#D4AF37', intensity: 50, position: 'top' }, elements: booking },
  ],
};
export default page;

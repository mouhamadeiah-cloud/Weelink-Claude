// The 17 slide designs Eyad approved on 2026-10-12 for the free page (hero, about, prices,
// gallery, contact, terms) and for «ابن صفحتي». Each design has a fixed id (hero.cover, …) kept on
// the slide as aiTemplate, and every text, image or button the AI may fill carries its slot name
// in aiSlot. The designs come in the three example pages of the approval gallery, with their
// colours, fonts and editor effects: a home kitchen (warm light), a law office (very dark) and a
// painter (light turquoise). Coordinates are on the 1280-wide canvas.

import { groupTemplateCards } from '../utils/templateGroups';

type Box = { x: number; y: number; width: number; height: number };
type Styles = Record<string, unknown>;

export interface Look {
  bg: string;
  card: string;
  line: string;
  ink: string;
  muted: string;
  accent: string;
  soft: string; // the accent faintly over the background
  head: string; // heading font
  body: string; // text font
}

const KITCHEN: Look = { bg: '#FDF8F6', card: '#FFFFFF', line: '#EDD5BE', ink: '#44281D', muted: '#7A5D50', accent: '#9A3412', soft: '#F6E6DC', head: 'El Messiri', body: 'Tajawal' };
const LAW: Look = { bg: '#090D16', card: '#131B2E', line: '#1F2D4D', ink: '#E2E8F0', muted: '#94A3B8', accent: '#06B6D4', soft: '#0F2A3A', head: 'Amiri', body: 'IBM Plex Sans Arabic' };
const PAINTER: Look = { bg: '#F0FDFA', card: '#FFFFFF', line: '#99F6E4', ink: '#134E4A', muted: '#4B7A76', accent: '#0D9488', soft: '#DDF4EF', head: 'Alexandria', body: 'Almarai' };

// The three looks the designs come in, for recolouring a design to the owner's palette.
export const WEE_LOOKS = { kitchen: KITCHEN, law: LAW, painter: PAINTER };

const WHATSAPP_GREEN = '#1F9D55';
const GOLD = '#D4AF37';
const photo = (name: string) => `/Library/compressed/wee-${name}.jpg`;

const el = (type: string, name: string, box: Box, content: string, styles: Styles, extra: Record<string, unknown> = {}) => ({
  type,
  name,
  ...box,
  content,
  styles,
  ...extra,
});

const slot = (aiSlot: string) => ({ aiSlot });

const heading = (L: Look, box: Box, text: string, size: number, styles: Styles = {}, aiSlot?: string) =>
  el('heading', 'عنوان', box, text, { fontSize: size, fontWeight: 'bold', color: L.ink, fontFamily: L.head, textAlign: 'right', ...styles }, aiSlot ? slot(aiSlot) : {});

const text = (L: Look, box: Box, value: string, size = 17, styles: Styles = {}, aiSlot?: string) =>
  el('paragraph', 'نص', box, value, { fontSize: size, color: L.muted, fontFamily: L.body, textAlign: 'right', ...styles }, aiSlot ? slot(aiSlot) : {});

const eyebrow = (L: Look, box: Box, value: string, styles: Styles = {}) =>
  text(L, box, value, 14, { color: L.accent, fontWeight: 'bold', ...styles }, 'eyebrow');

const button = (L: Look, box: Box, label: string, styles: Styles = {}, aiSlot = 'cta') =>
  el('button', 'زر', box, label, {
    backgroundColor: L.accent, color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', borderRadius: 9999, textAlign: 'center', fontFamily: L.body, ...styles,
  }, slot(aiSlot));

// Shown only when the owner gave a WhatsApp number; the AI drops it otherwise.
const whatsapp = (L: Look, box: Box, styles: Styles = {}) =>
  el('button', 'زر واتساب', box, 'واتساب', {
    backgroundColor: WHATSAPP_GREEN, color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', borderRadius: 9999, textAlign: 'center', fontFamily: L.body, ...styles,
  }, slot('whatsapp'));

const image = (box: Box, url: string, styles: Styles = {}, extra: Record<string, unknown> = {}, aiSlot = 'image') =>
  el('image', 'صورة', box, url, { objectFit: 'cover', ...styles }, { imageUrl: url, ...slot(aiSlot), ...extra });

const shape = (name: string, box: Box, styles: Styles, extra: Record<string, unknown> = {}) => el('shape', name, box, '', styles, extra);

// A line drawn by the shape element: line-gradient, line-glow, line-wavy, line-dotted …
// Drawn inside the shape's 8px padding, so the box is at least 30 high, centred on the given line.
const line = (box: Box, kind: string, color: string) => {
  const height = Math.max(box.height, 30);
  return el('shape', 'خط فاصل', { ...box, y: box.y - (height - box.height) / 2, height }, kind, { backgroundColor: color });
};

const icon = (box: Box, name: string, color: string, styles: Styles = {}) => el('icon', 'أيقونة', box, `iconify:${name}`, { color, ...styles });

const caption = (L: Look, box: Box, value: string, aiSlot: string, styles: Styles = {}) =>
  text(L, box, value, 15, { color: '#FFFFFF', fontWeight: 'bold', textShadowIntensity: 12, textShadowColor: 'rgba(0,0,0,0.75)', textShadowPosition: 'bottom', ...styles }, aiSlot);

// Three cards from the right edge of a 1088-wide column starting at x 96.
const thirds = [840, 472, 104];

// Phone layout on the 360-wide phone canvas (20px side padding, 320 wide content). Every element
// of a design has one, so the editor keeps it instead of arranging the slide automatically.
// Large text shrinks like the automatic phone layout does.
const phoneFontScale = (fontSize: unknown) =>
  typeof fontSize !== 'number' || fontSize <= 18 ? 1 : Math.round(((18 + (fontSize - 18) * 0.6) / fontSize) * 100) / 100;

const on = <T extends { styles: Styles }>(e: T, x: number, y: number, width: number, height: number, fontScale = phoneFontScale(e.styles.fontSize)) =>
  ({ ...e, mobile: { x, y, width, height, fontScale } });

// Left out on phones (the dotted leader of a price row has no room there).
const offPhone = <T extends { styles: Styles }>(e: T) => on(e, 0, 0, 1, 1, 1);

export interface WeeSlide {
  aiTemplate: string;
  name: string;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  backgroundOpacity?: number;
  backgroundAttachment?: 'scroll' | 'fixed';
  dividerShape?: string;
  mobileHeight: number;
  elements: ReturnType<typeof el>[];
}

const L_ = LAW;
const K_ = KITCHEN;
const P_ = PAINTER;

const HERO: (() => WeeSlide)[] = [
  // hero.cover: the background (here a video) covers the slide, the text sits on a dark veil.
  () => ({
    aiTemplate: 'hero.cover',
    name: 'مدخل بصورة كاملة',
    height: 660,
    mobileHeight: 520,
    backgroundColor: L_.bg,
    backgroundImage: '/bg-videos/856662.jpg',
    backgroundVideo: '/bg-videos/856662.mp4',
    backgroundAttachment: 'fixed',
    elements: [
      on(shape('تعتيم', { x: 0, y: 0, width: 1280, height: 660 }, { backgroundColor: 'rgba(9,13,22,0.62)' }), 0, 0, 360, 520),
      on(eyebrow(L_, { x: 640, y: 196, width: 544, height: 28 }, 'محاماة واستشارات في دمشق'), 20, 110, 320, 28),
      on(heading(L_, { x: 560, y: 232, width: 624, height: 156 }, 'نحمي حقك بخبرة ووضوح', 60, {
        color: '#FFFFFF', textEffect: 'soft-glow', textEffectColor: L_.accent, textEffectIntensity: 45, animation: 'fade', animationTrigger: 'once',
      }, 'title'), 20, 142, 320, 150),
      on(text(L_, { x: 600, y: 396, width: 584, height: 66 }, 'قضايا مدنية وتجارية وعقارية، واستشارات قانونية بمواعيد مسبقة في مكتبنا بالمزة.', 19, { color: 'rgba(255,255,255,0.86)' }, 'sub'), 20, 300, 320, 104),
      on(button(L_, { x: 994, y: 486, width: 190, height: 54 }, 'احجز استشارة', { color: '#04121A' }), 186, 424, 154, 48),
      on(whatsapp(L_, { x: 790, y: 486, width: 190, height: 54 }), 20, 424, 154, 48),
    ],
  }),

  // hero.split: text on the right, a framed photo on the left over a faint fixed photo wash.
  () => ({
    aiTemplate: 'hero.split',
    name: 'مدخل نص وصورة',
    height: 620,
    mobileHeight: 740,
    backgroundColor: P_.bg,
    backgroundImage: photo('p5'),
    backgroundOpacity: 0.09,
    backgroundAttachment: 'fixed',
    elements: [
      on(eyebrow(P_, { x: 680, y: 132, width: 504, height: 28 }, 'دهان وديكور في حلب'), 20, 316, 320, 28),
      on(heading(P_, { x: 660, y: 166, width: 524, height: 144 }, 'بيتك بألوان جديدة خلال أيام', 54, {
        textEffect: 'gradient', textEffectColor: P_.accent, textEffectColor2: '#F59E0B',
      }, 'title'), 20, 348, 320, 150),
      on(text(P_, { x: 680, y: 318, width: 504, height: 62 }, 'دهان داخلي وخارجي، ورق جدران وجبصين، مع معاينة مجانية وألوان مضمونة.', 18, {}, 'sub'), 20, 504, 320, 96),
      ...['معاينة مجانية', 'ألوان مضمونة', 'تنظيف بعد الشغل'].map((chip, i) =>
        on(el('badge', 'نقطة قصيرة', { x: 1184 - 132 - i * 142, y: 396, width: 132, height: 34 }, chip, {
          backgroundColor: P_.card, color: P_.ink, borderColor: P_.line, borderWidth: 1, borderRadius: 9999, fontSize: 13, fontWeight: 'bold', fontFamily: P_.body,
        }, slot(`chips.${i}`)), 238 - i * 109, 612, 102, 32, 0.85)),
      on(button(P_, { x: 994, y: 452, width: 190, height: 54 }, 'اطلب معاينة'), 186, 662, 154, 48),
      on(whatsapp(P_, { x: 790, y: 452, width: 190, height: 54 }), 20, 662, 154, 48),
      on(shape('ظل الصورة', { x: 124, y: 104, width: 470, height: 470 }, { backgroundColor: 'rgba(13,148,136,0.16)', borderRadius: 28 }), 34, 44, 306, 250),
      on(image({ x: 96, y: 76, width: 470, height: 470 }, photo('p-hero'), {
        borderRadius: 28, borderWidth: 4, borderStyle: 'solid', borderColor: P_.card, glowIntensity: 26, glowColor: 'rgba(19,78,74,0.35)', glowPosition: 'bottom',
      }), 20, 30, 306, 250),
    ],
  }),

  // hero.band: a wide fixed photo on top and the headline card overlapping its lower edge.
  () => ({
    aiTemplate: 'hero.band',
    name: 'مدخل شريط صورة وبطاقة',
    height: 740,
    mobileHeight: 580,
    backgroundColor: K_.bg,
    backgroundImage: photo('k-hero'),
    backgroundAttachment: 'fixed',
    elements: [
      on(shape('أرضية تحت الصورة', { x: 0, y: 440, width: 1280, height: 300 }, { backgroundColor: K_.bg }), 0, 300, 360, 280),
      on(shape('بطاقة العنوان', { x: 210, y: 290, width: 860, height: 370 }, {
        backgroundColor: K_.card, borderColor: K_.line, borderWidth: 1, borderRadius: 24, shadow: 'apple',
      }), 16, 170, 328, 370),
      on(eyebrow(K_, { x: 250, y: 330, width: 780, height: 28 }, 'أكل بيتي في حمص', { textAlign: 'center' }), 36, 194, 288, 28),
      on(heading(K_, { x: 270, y: 364, width: 740, height: 128 }, 'طبخ بيتي متل طبخ الأم، بيوصل لبابك', 48, { textAlign: 'center' }, 'title'), 36, 226, 288, 120),
      on(text(K_, { x: 270, y: 498, width: 740, height: 32 }, 'وجبات يومية ومونة بيتية من مطبخنا في حي الوعر، بطلب مسبق قبل يوم.', 17, { textAlign: 'center' }, 'sub'), 36, 352, 288, 96),
      on(button(K_, { x: 648, y: 556, width: 190, height: 54 }, 'شوف الأسعار'), 182, 464, 142, 48),
      on(whatsapp(K_, { x: 442, y: 556, width: 190, height: 54 }), 36, 464, 142, 48),
    ],
  }),
];

const ABOUT: (() => WeeSlide)[] = [
  // about.story: a framed photo beside the story, three optional figures under it.
  () => ({
    aiTemplate: 'about.story',
    name: 'من نحن قصة وصورة',
    height: 640,
    mobileHeight: 840,
    backgroundColor: K_.card,
    dividerShape: 'wave',
    elements: [
      on(image({ x: 96, y: 80, width: 400, height: 480 }, photo('k2'), {
        borderRadius: 24, borderWidth: 6, borderStyle: 'double', borderColor: K_.accent, imageFilter: 'warm',
      }), 20, 40, 320, 260),
      on(eyebrow(K_, { x: 576, y: 140, width: 608, height: 26 }, 'من نحن'), 20, 324, 320, 26),
      on(heading(K_, { x: 576, y: 172, width: 608, height: 62 }, 'مطبخ صغير بنَفَس كبير', 44, {
        textEffect: 'marker', textEffectColor: 'rgba(154,52,18,0.3)',
      }, 'title'), 20, 354, 320, 110),
      on(text(K_, { x: 576, y: 248, width: 608, height: 128 }, 'بلّشت أم سليم تطبخ لجيرانها من سنين، وصار المطبخ اليوم يطبخ كل يوم لعائلات وموظفين بالحي. منستعمل خضرة السوق الطازة وزيت الزيتون البلدي، ومنطبخ بكميات صغيرة لحتى يضل الطعم متل البيت.', 17, {}, 'text'), 20, 470, 320, 210),
      on(el('divider', 'خط فاصل', { x: 576, y: 400, width: 608, height: 2 }, '', { borderColor: K_.line, borderWidth: 1 }), 20, 692, 320, 2),
      ...[['12', 'سنة طبخ'], ['40', 'وجبة يومياً'], ['3', 'أحياء منوصّلها']].flatMap(([n, label], i) => [
        on(heading(K_, { x: 1064 - i * 150, y: 420, width: 120, height: 52 }, n, 42, { color: K_.accent, fontFamily: K_.head, animation: 'slide-up', animationTrigger: 'once' }, `facts.${i}.number`), 240 - i * 110, 708, 100, 50),
        on(text(K_, { x: 1064 - i * 150, y: 474, width: 120, height: 26 }, label, 14, { color: K_.ink }, `facts.${i}.label`), 240 - i * 110, 758, 100, 26),
      ]),
    ],
  }),

  // about.quote: the owner's sentence, a short paragraph and the owner's name with a small photo.
  () => ({
    aiTemplate: 'about.quote',
    name: 'من نحن جملة صاحب العمل',
    height: 560,
    mobileHeight: 460,
    backgroundColor: L_.card,
    elements: [
      on(heading(L_, { x: 540, y: 50, width: 200, height: 90 }, '”', 120, { color: L_.accent, textAlign: 'center', fontFamily: 'Amiri' }), 120, 20, 120, 70),
      on(heading(L_, { x: 190, y: 140, width: 900, height: 110 }, 'الموكّل الذي يفهم قضيته يتخذ القرار الصحيح.', 36, {
        textAlign: 'center', animation: 'fade', animationTrigger: 'once', animationDuration: 1.6,
      }, 'quote'), 20, 96, 320, 110),
      on(text(L_, { x: 300, y: 266, width: 680, height: 64 }, 'يعمل الأستاذ سامر الحلبي في المحاماة منذ تخرجه من كلية الحقوق بجامعة دمشق، ويتابع القضايا من أول استشارة حتى صدور الحكم.', 16, { textAlign: 'center' }, 'text'), 20, 214, 320, 120),
      on(image({ x: 668, y: 362, width: 68, height: 68 }, photo('l4'), {
        borderRadius: 9999, borderWidth: 4, borderStyle: 'solid', borderColor: GOLD, imageFilter: 'grayscale', glowIntensity: 14, glowColor: 'rgba(212,175,55,0.45)', glowPosition: 'center',
      }, {}, 'avatar'), 245, 354, 68, 68),
      on(heading(L_, { x: 470, y: 366, width: 184, height: 30 }, 'سامر الحلبي', 18, { fontFamily: L_.body }, 'owner'), 47, 358, 184, 30),
      on(text(L_, { x: 470, y: 398, width: 184, height: 26 }, 'محامٍ أستاذ', 14, {}, 'role'), 47, 390, 184, 26),
    ],
  }),

  // about.points: a heading and three cards with an icon each.
  () => {
    const points = [
      ['mdi:star-outline', 'ألوان مضمونة', 'دهانات أصلية مع كفالة سنة على التقشير.'],
      ['mdi:clock-outline', 'بالموعد', 'منبلش ومنخلص بالتاريخ المتفق عليه.'],
      ['mdi:heart-outline', 'بيتك نظيف', 'منغطي العفش ومننظف بعد الشغل.'],
    ];
    return {
      aiTemplate: 'about.points',
      name: 'من نحن ثلاث نقاط',
      height: 540,
      mobileHeight: 830,
      backgroundColor: P_.soft,
      elements: [
        on(eyebrow(P_, { x: 96, y: 72, width: 1088, height: 26 }, 'من نحن'), 20, 40, 320, 26),
        on(heading(P_, { x: 96, y: 102, width: 1088, height: 58 }, 'شغل نظيف ومواعيد مضبوطة', 40, {}, 'title'), 20, 70, 320, 110),
        on(text(P_, { x: 96, y: 164, width: 1088, height: 30 }, 'من أكثر من عشرين سنة وأبو خالد عم يدهن بيوت حلب.', 17, {}, 'text'), 20, 184, 320, 70),
        ...points.flatMap(([ic, title, body], i) => {
          const x = thirds[i];
          const y = 270 + i * 176; // the card's top on phones
          return [
            on(shape('بطاقة', { x, y: 230, width: 336, height: 230 }, {
              backgroundColor: P_.card, borderColor: P_.line, borderWidth: 1, borderRadius: 20,
              glowIntensity: 22, glowColor: 'rgba(13,148,136,0.28)', glowPosition: 'bottom', innerGlowColor: P_.accent, innerGlowIntensity: 12, innerGlowPosition: 'top',
              animation: 'slide-up', animationTrigger: 'once',
            }), 20, y, 320, 156),
            on(shape('خلفية الأيقونة', { x: x + 258, y: 258, width: 48, height: 48 }, { backgroundColor: P_.soft, borderRadius: 14 }), 272, y + 20, 48, 48),
            on(icon({ x: x + 270, y: 270, width: 24, height: 24 }, ic, P_.accent, { animation: 'float', animationTrigger: 'loop' }), 284, y + 32, 24, 24),
            on(heading(P_, { x: x + 30, y: 324, width: 276, height: 34 }, title, 22, {}, `points.${i}.title`), 40, y + 26, 220, 36),
            on(text(P_, { x: x + 30, y: 362, width: 276, height: 64 }, body, 15, {}, `points.${i}.text`), 40, y + 76, 280, 66),
          ];
        }),
      ],
    };
  },
];

const KITCHEN_PRICES: [string, string, string][] = [
  ['كبة مشوية', 'بالدزينة، محشية لحمة وجوز', '85,000'],
  ['شيخ المحشي', 'صحن عائلي لأربعة أشخاص', '95,000'],
  ['فتة حمص', 'صحن كبير مع الخبز المحمص', '35,000'],
  ['مقلوبة', 'صينية لأربعة أشخاص', '110,000'],
  ['يبرق', 'كيلو، بالزيت أو باللحمة', '70,000'],
  ['مكدوس', 'كيلو، جوز وفليفلة', '60,000'],
  ['مربى مشمش', 'مرطبان نص كيلو', '25,000'],
  ['شوربة عدس', 'علبة لترين', '20,000'],
];

const PRICES: (() => WeeSlide)[] = [
  // prices.list: two columns like a menu, name … price with a line of dots and a small description.
  () => ({
    aiTemplate: 'prices.list',
    name: 'أسعار قائمة بنقاط',
    height: 640,
    mobileHeight: 960,
    backgroundColor: '#F8ECE6',
    elements: [
      on(heading(K_, { x: 96, y: 70, width: 1088, height: 60 }, 'الأسعار', 42, {}, 'title'), 20, 40, 320, 60),
      on(line({ x: 1024, y: 136, width: 160, height: 10 }, 'line-gradient', K_.accent), 200, 96, 140, 30),
      ...KITCHEN_PRICES.flatMap(([name, desc, price], i) => {
        const x = i < 4 ? 672 : 96;
        const y = 180 + (i % 4) * 86;
        const my = 146 + i * 92; // the row's top on phones
        return [
          on(heading(K_, { x: x + 332, y, width: 180, height: 30 }, name, 19, { fontFamily: K_.body }, `items.${i}.name`), 160, my, 180, 30),
          offPhone(line({ x: x + 156, y: y + 12, width: 170, height: 8 }, 'line-dotted', 'rgba(68,40,29,0.28)')),
          on(text(K_, { x, y, width: 150, height: 30 }, `${price} ل.س`, 17, { color: K_.accent, fontWeight: 'bold', textAlign: 'left' }, `items.${i}.price`), 20, my, 136, 30),
          on(text(K_, { x: x + 212, y: y + 32, width: 300, height: 24 }, desc, 14, {}, `items.${i}.desc`), 40, my + 34, 300, 26),
          on(el('divider', 'خط فاصل', { x, y: y + 66, width: 512, height: 2 }, '', { borderColor: K_.line, borderWidth: 1 }), 20, my + 72, 320, 2),
        ];
      }),
      on(text(K_, { x: 96, y: 540, width: 1088, height: 28 }, 'الأسعار بالليرة السورية وبتتغير حسب السوق.', 14, {}, 'note'), 20, 886, 320, 50),
    ],
  }),

  // prices.cards: three packages, the middle one stands out and floats.
  () => {
    const packages: [string, string, string, string[], boolean][] = [
      ['استشارة', '150,000', 'للجلسة', ['ساعة في المكتب', 'ملخص مكتوب', 'متابعة برسالة'], false],
      ['عقد', '400,000', 'للعقد', ['صياغة كاملة', 'مراجعتان', 'حضور التوقيع', 'نسخة إلكترونية'], true],
      ['شركة', '1,500,000', 'شهرياً', ['استشارات غير محدودة', 'مراجعة العقود', 'إنذارات', 'تمثيل أمام المحاكم'], false],
    ];
    // Phone: the cards one under the other, each as tall as its list.
    const cardHeight = (features: string[]) => 166 + features.length * 34;
    const tops = packages.reduce<number[]>((acc, p, i) => [...acc, i ? acc[i - 1] + cardHeight(packages[i - 1][3]) + 24 : 120], []);
    return {
      aiTemplate: 'prices.cards',
      name: 'أسعار ثلاث باقات',
      height: 680,
      mobileHeight: tops[2] + cardHeight(packages[2][3]) + 80,
      backgroundColor: '#0D1424',
      dividerShape: 'slanted',
      elements: [
        on(heading(L_, { x: 96, y: 70, width: 1088, height: 60 }, 'الأتعاب', 42, {}, 'title'), 20, 40, 320, 60),
        ...packages.flatMap(([name, price, unit, features, hot], i) => {
          const x = thirds[i];
          const my = tops[i];
          const card = hot
            ? { borderColor: L_.accent, borderWidth: 2, glowIntensity: 28, glowColor: 'rgba(6,182,212,0.55)', glowPosition: 'center', animation: 'float', animationTrigger: 'loop', animationDuration: 3.2 }
            : { borderColor: L_.line, borderWidth: 1 };
          return [
            on(shape('بطاقة باقة', { x, y: 170, width: 336, height: 420 }, { backgroundColor: L_.card, backgroundOpacity: 0.55, borderRadius: 24, ...card }), 20, my, 320, cardHeight(features)),
            ...(hot ? [on(el('badge', 'شارة', { x: x + 196, y: 196, width: 110, height: 28 }, 'الأكثر طلباً', { backgroundColor: L_.accent, color: '#04121A', borderRadius: 9999, fontSize: 12, fontWeight: 'bold', fontFamily: L_.body }), 40, my + 26, 110, 28)] : []),
            on(heading(L_, { x: x + 30, y: 232, width: 276, height: 36 }, name, 24, { fontFamily: L_.body }, `packages.${i}.name`), 40, my + 22, 280, 36),
            on(heading(L_, { x: x + 30, y: 274, width: 276, height: 50 }, price, 38, { color: L_.accent, fontFamily: L_.body }, `packages.${i}.price`), 40, my + 62, 280, 50),
            on(text(L_, { x: x + 30, y: 326, width: 276, height: 24 }, `ل.س ${unit}`, 14, {}, `packages.${i}.unit`), 40, my + 112, 280, 24),
            ...features.flatMap((f, j) => [
              on(icon({ x: x + 288, y: 374 + j * 36, width: 18, height: 18 }, 'mdi:check-circle-outline', L_.accent), 302, my + 152 + j * 34, 18, 18),
              on(text(L_, { x: x + 30, y: 368 + j * 36, width: 252, height: 30 }, f, 15, { color: L_.ink }, `packages.${i}.features.${j}`), 40, my + 146 + j * 34, 256, 30),
            ]),
          ];
        }),
      ],
    };
  },

  // prices.groups: the items in two groups with coloured headings.
  () => {
    const groups: [string, [string, string][]][] = [
      ['الدهان', [['دهان داخلي', '12,000'], ['دهان خارجي', '18,000'], ['معالجة رطوبة', '15,000'], ['دهان أبواب', '60,000']]],
      ['الديكور', [['ورق جدران', '25,000'], ['جبصين سقف', '45,000'], ['ديكور حجر', '70,000'], ['تنظيف بعد الشغل', '100,000']]],
    ];
    return {
      aiTemplate: 'prices.groups',
      name: 'أسعار مجموعتان',
      height: 640,
      mobileHeight: 850,
      backgroundColor: P_.card,
      elements: [
        on(shape('مثلث', { x: 90, y: 60, width: 140, height: 120 }, { backgroundColor: 'rgba(13,148,136,0.18)' }, { clipPath: 'clip-shape-geo-triangle' }), 20, 30, 76, 66),
        on(shape('معين', { x: 224, y: 96, width: 80, height: 80 }, { backgroundColor: 'transparent', borderColor: 'rgba(13,148,136,0.45)', borderWidth: 3 }, { rotation: 45 }), 96, 56, 40, 40),
        on(heading(P_, { x: 96, y: 70, width: 1088, height: 60 }, 'الأسعار', 42, {}, 'title'), 20, 40, 320, 60),
        on(line({ x: 1004, y: 136, width: 180, height: 16 }, 'line-wavy', P_.accent), 180, 98, 160, 30),
        ...groups.flatMap(([title, rows], g) => {
          const x = g === 0 ? 652 : 96;
          const my = 150 + g * 312; // the card's top on phones
          return [
            on(shape('بطاقة مجموعة', { x, y: 190, width: 532, height: 292 }, { backgroundColor: P_.card, borderColor: P_.line, borderWidth: 1, borderRadius: 20, shadow: 'md' }), 20, my, 320, 292),
            on(shape('رأس المجموعة', { x, y: 190, width: 532, height: 56 }, { backgroundColor: P_.accent, borderRadius: 20 }), 20, my, 320, 56),
            on(shape('رأس المجموعة', { x, y: 226, width: 532, height: 20 }, { backgroundColor: P_.accent }), 20, my + 36, 320, 20),
            on(heading(P_, { x: x + 26, y: 202, width: 480, height: 32 }, title, 20, { color: '#FFFFFF', fontFamily: P_.body }, `groups.${g}.name`), 40, my + 12, 280, 32),
            ...rows.flatMap(([name, price], r) => [
              ...(r ? [on(el('divider', 'خط فاصل', { x, y: 246 + r * 58, width: 532, height: 2 }, '', { borderColor: P_.line, borderWidth: 1 }), 20, my + 56 + r * 58, 320, 2)] : []),
              on(text(P_, { x: x + 226, y: 260 + r * 58, width: 280, height: 30 }, name, 16, { color: P_.ink }, `groups.${g}.rows.${r}.name`), 160, my + 70 + r * 58, 160, 30),
              on(text(P_, { x: x + 26, y: 260 + r * 58, width: 180, height: 30 }, `${price} ل.س`, 16, { color: P_.ink, fontWeight: 'bold', textAlign: 'left' }, `groups.${g}.rows.${r}.price`), 36, my + 70 + r * 58, 124, 30),
            ]),
          ];
        }),
        on(text(P_, { x: 96, y: 510, width: 1088, height: 28 }, 'السعر النهائي بعد المعاينة حسب حالة الجدران.', 14, {}, 'note'), 20, 778, 320, 50),
      ],
    };
  },
];

const GALLERY: (() => WeeSlide)[] = [
  // gallery.mosaic: one large photo and four small ones; photos grow under the mouse.
  () => {
    // [photo, caption, desktop box, phone box]
    const items: [string, string, Box, Box][] = [
      ['k3', 'عجينة بيتية', { x: 648, y: 160, width: 536, height: 494 }, { x: 20, y: 120, width: 320, height: 240 }],
      ['k1', 'بهارات طازة', { x: 373, y: 160, width: 261, height: 240 }, { x: 186, y: 372, width: 154, height: 150 }],
      ['k2', 'حبق من الجنينة', { x: 98, y: 160, width: 261, height: 240 }, { x: 20, y: 372, width: 154, height: 150 }],
      ['k4', 'قهوة بعد الغدا', { x: 373, y: 414, width: 261, height: 240 }, { x: 186, y: 534, width: 154, height: 150 }],
      ['k5', 'فنجان الضيافة', { x: 98, y: 414, width: 261, height: 240 }, { x: 20, y: 534, width: 154, height: 150 }],
    ];
    return {
      aiTemplate: 'gallery.mosaic',
      name: 'معرض فسيفساء',
      height: 720,
      mobileHeight: 720,
      backgroundColor: K_.bg,
      elements: [
        on(heading(K_, { x: 96, y: 70, width: 1088, height: 60 }, 'من مطبخنا', 42, {}, 'title'), 20, 40, 320, 60),
        ...items.flatMap(([img, cap, box, m], i) => [
          on(image(box, photo(img), { borderRadius: 18, animation: 'scale-up', animationTrigger: 'hover' }, {}, `photos.${i}`), m.x, m.y, m.width, m.height),
          on(caption(K_, { x: box.x + 16, y: box.y + box.height - 42, width: box.width - 32, height: 28 }, cap, `caption.${i}`), m.x + 10, m.y + m.height - 38, m.width - 20, 28, 0.9),
        ]),
      ],
    };
  },

  // gallery.strip: five tall arched photos in a row.
  () => {
    const items: [string, string][] = [['p1', 'ألوان الموسم'], ['p2', 'عدّة المعلم'], ['p3', 'ألوان الأبواب'], ['p4', 'تجهيز الجدران'], ['p5', 'جدار بمربعات']];
    return {
      aiTemplate: 'gallery.strip',
      name: 'معرض أقواس',
      height: 600,
      mobileHeight: 890,
      backgroundColor: P_.bg,
      dividerShape: 'curve-up',
      elements: [
        on(heading(P_, { x: 96, y: 70, width: 1088, height: 60 }, 'من شغلنا', 42, {}, 'title'), 20, 40, 320, 60),
        ...items.flatMap(([img, cap], i) => {
          const x = 980 - i * 221;
          // Phone: two arches a row from the right, the fifth in the middle.
          const mx = i === 4 ? 103 : i % 2 ? 20 : 186;
          const my = 130 + Math.floor(i / 2) * 240; // where the arch's curve starts
          return [
            on(image({ x, y: 160, width: 204, height: 300 }, photo(img), { imageFilter: 'technicolor' }, { clipPath: 'clip-shape-arch-classic' }, `photos.${i}`), mx, my - 66, 154, 260),
            on(text(P_, { x, y: 470, width: 204, height: 28 }, cap, 15, { color: P_.ink, fontWeight: 'bold', textAlign: 'center' }, `caption.${i}`), mx, my + 202, 154, 28),
          ];
        }),
      ],
    };
  },

  // gallery.frames: three photos on top and two below, each in a frame with its caption.
  () => {
    const items: [string, string, Box][] = [
      ['l1', 'قاعة الاجتماعات', { x: 836, y: 160, width: 348, height: 261 }],
      ['l2', 'ملفات الموكلين', { x: 466, y: 160, width: 348, height: 261 }],
      ['l3', 'استشارة قانونية', { x: 96, y: 160, width: 348, height: 261 }],
      ['l4', 'مكتبة المراجع', { x: 651, y: 476, width: 533, height: 300 }],
      ['l5', 'الأرشيف', { x: 96, y: 476, width: 533, height: 300 }],
    ];
    return {
      aiTemplate: 'gallery.frames',
      name: 'معرض إطارات',
      height: 850,
      mobileHeight: 1300,
      backgroundColor: L_.bg,
      elements: [
        on(heading(L_, { x: 96, y: 70, width: 1088, height: 60 }, 'من المكتب', 42, {}, 'title'), 20, 40, 320, 60),
        ...items.flatMap(([img, cap, box], i) => [
          on(image(box, photo(img), { borderRadius: 16, borderWidth: 8, borderStyle: 'solid', borderColor: L_.line, imageFilter: 'grayscale', animation: 'scale-up', animationTrigger: 'hover' }, {}, `photos.${i}`), 20, 120 + i * 232, 320, 180),
          on(text(L_, { x: box.x, y: box.y + box.height + 10, width: box.width, height: 26 }, cap, 15, { color: L_.ink, fontWeight: 'bold' }, `caption.${i}`), 20, 306 + i * 232, 320, 26),
        ]),
      ],
    };
  },
];

const CONTACT: (() => WeeSlide)[] = [
  // contact.card: the contact lines with icons in a card, the map beside it.
  () => {
    const rows: [string, string, string, string][] = [
      ['mdi:phone-outline', 'هاتف', '+963 944 123 456', 'phone'],
      ['mdi:whatsapp', 'واتساب', '+963 944 123 456', 'whatsapp'],
      ['mdi:map-marker-outline', 'العنوان', 'حمص، حي الوعر، الجزيرة السابعة', 'address'],
      ['mdi:clock-outline', 'الدوام', 'كل يوم من 9 الصبح لـ 6 المسا', 'hours'],
    ];
    return {
      aiTemplate: 'contact.card',
      name: 'تواصل معلومات وخريطة',
      height: 620,
      mobileHeight: 840,
      backgroundColor: K_.card,
      elements: [
        on(el('map', 'الخريطة', { x: 96, y: 80, width: 520, height: 460 }, 'حمص، حي الوعر', {
          borderRadius: 24, shadow: 'apple', innerGlowColor: K_.accent, innerGlowIntensity: 16, innerGlowPosition: 'top',
        }, slot('map')), 20, 560, 320, 240),
        on(shape('سداسي', { x: 56, y: 46, width: 150, height: 170 }, { backgroundColor: 'rgba(154,52,18,0.22)' }, { clipPath: 'clip-shape-geo-hexagon' }), 2, 530, 80, 90),
        on(shape('سداسي', { x: 150, y: 470, width: 90, height: 102 }, { backgroundColor: 'rgba(154,52,18,0.14)' }, { clipPath: 'clip-shape-geo-hexagon' }), 290, 760, 56, 64),
        on(shape('بطاقة التواصل', { x: 664, y: 80, width: 520, height: 460 }, {
          backgroundColor: K_.bg, borderColor: K_.line, borderWidth: 1, borderRadius: 24, glowIntensity: 24, glowColor: 'rgba(68,40,29,0.22)', glowPosition: 'bottom',
        }), 16, 30, 328, 496),
        on(heading(K_, { x: 704, y: 112, width: 440, height: 56 }, 'اطلب وجبتك', 40, {}, 'title'), 36, 54, 288, 56),
        on(text(K_, { x: 704, y: 170, width: 440, height: 30 }, 'اطلب قبل يوم بالواتساب أو اتصل فينا.', 16, {}, 'sub'), 36, 112, 288, 56),
        ...rows.flatMap(([ic, label, value, key], i) => {
          const y = 226 + i * 72;
          const my = 184 + i * 72 + (i > 2 ? 26 : 0); // the row's top on phones (the address takes two lines)
          return [
            on(shape('خلفية الأيقونة', { x: 1100, y, width: 44, height: 44 }, { backgroundColor: K_.soft, borderRadius: 12 }), 280, my, 44, 44),
            on(icon({ x: 1110, y: y + 10, width: 24, height: 24 }, ic, K_.accent), 290, my + 10, 24, 24),
            on(text(K_, { x: 704, y: y - 4, width: 384, height: 20 }, label, 13, {}, `${key}.label`), 36, my - 4, 236, 20),
            on(text(K_, { x: 704, y: y + 18, width: 384, height: 28 }, value, 17, { color: K_.ink, fontWeight: 'bold' }, `${key}.value`), 36, my + 18, 236, i === 2 ? 56 : 30),
          ];
        }),
      ],
    };
  },

  // contact.band: the brand colour across the slide with large call and WhatsApp buttons.
  () => ({
    aiTemplate: 'contact.band',
    name: 'تواصل شريط ملون',
    height: 420,
    mobileHeight: 400,
    backgroundColor: P_.accent,
    elements: [
      on(heading(P_, { x: 96, y: 84, width: 1088, height: 70 }, 'اطلب معاينة', 52, { color: '#FFFFFF', textAlign: 'center' }, 'title'), 20, 44, 320, 64),
      on(text(P_, { x: 240, y: 162, width: 800, height: 32 }, 'منجي لعندك ومنعطيك السعر بنفس اليوم.', 19, { color: 'rgba(255,255,255,0.92)', textAlign: 'center' }, 'sub'), 20, 114, 320, 76),
      on(button(P_, { x: 648, y: 222, width: 170, height: 54 }, 'اتصل', { backgroundColor: '#FFFFFF', color: P_.accent }, 'phone'), 186, 204, 154, 52),
      on(whatsapp(P_, { x: 462, y: 222, width: 170, height: 54 }, { animation: 'pulse', animationTrigger: 'loop' }), 20, 204, 154, 52),
      on(text(P_, { x: 96, y: 304, width: 1088, height: 28 }, 'حلب، الفرقان، قرب دوار الصخرة  ·  كل يوم ما عدا الجمعة، 8 الصبح لـ 5 المسا', 15, { color: 'rgba(255,255,255,0.9)', textAlign: 'center' }, 'address.value'), 20, 276, 320, 92),
    ],
  }),

  // contact.form: a short message form (name, phone, message) beside the contact lines.
  () => {
    // Phone: the contact lines on top, the form card under them.
    const field = (label: string, y: number, h: number, hint: string, my: number) => [
      on(text(L_, { x: 136, y, width: 500, height: 22 }, label, 14, { color: L_.ink, fontWeight: 'bold' }), 36, my, 288, 22),
      on(el('input', 'حقل', { x: 136, y: y + 28, width: 500, height: h }, hint, { fontSize: 15, fontFamily: L_.body }), 36, my + 28, 288, h),
    ];
    return {
      aiTemplate: 'contact.form',
      name: 'تواصل نموذج رسالة',
      height: 640,
      mobileHeight: 820,
      backgroundColor: L_.card,
      elements: [
        on(shape('بطاقة النموذج', { x: 96, y: 80, width: 580, height: 480 }, {
          backgroundColor: '#0F1626', borderColor: L_.line, borderWidth: 1, borderRadius: 24, glowIntensity: 30, glowColor: 'rgba(0,0,0,0.6)', glowPosition: 'bottom',
        }, slot('form')), 16, 340, 328, 440),
        ...field('الاسم', 112, 48, 'اكتب اسمك', 364),
        ...field('رقم الهاتف', 200, 48, '09xx xxx xxx', 452),
        ...field('رسالتك', 288, 110, 'شو بدك تسأل؟', 540),
        on(button(L_, { x: 486, y: 456, width: 150, height: 50 }, 'أرسل', { color: '#04121A' }, 'send'), 174, 702, 150, 50),
        on(heading(L_, { x: 736, y: 188, width: 448, height: 58 }, 'احجز موعدك', 42, {}, 'title'), 20, 40, 320, 58),
        on(line({ x: 736, y: 252, width: 448, height: 12 }, 'line-glow', L_.accent), 20, 96, 320, 30),
        on(text(L_, { x: 736, y: 276, width: 448, height: 30 }, 'الاستشارة الأولى بموعد مسبق فقط.', 16, {}, 'sub'), 20, 124, 320, 40),
        ...([
          ['mdi:phone-outline', '+963 11 612 3456', 'phone'],
          ['mdi:map-marker-outline', 'دمشق، المزة، شارع الجلاء، بناء 14', 'address'],
          ['mdi:clock-outline', 'من الأحد للخميس، 10 الصبح لـ 4 العصر', 'hours'],
        ] as const).flatMap(([ic, value, key], i) => [
          on(icon({ x: 1160, y: 334 + i * 44, width: 24, height: 24 }, ic, L_.accent), 316, 182 + i * 52, 24, 24),
          on(text(L_, { x: 736, y: 330 + i * 44, width: 412, height: 30 }, value, 16, { color: L_.ink, fontWeight: 'bold' }, `${key}.value`), 20, 176 + i * 52, 288, 36),
        ]),
      ],
    };
  },
];

// Fixed Weelink text; only the business name is filled in.
const TERMS = [
  'المعلومات في هذه الصفحة للتعريف بالنشاط وخدماته، ولا تعتبر عرضاً ملزماً.',
  'الأسعار المعروضة تقديرية وقد تتغير دون إشعار مسبق.',
  'الطلب أو الحجز يتم بالتواصل المباشر مع صاحب الصفحة.',
  'لا يجوز نسخ الصور والنصوص دون إذن صاحب الصفحة.',
];
const PRIVACY = [
  'لا نجمع أي بيانات شخصية عند تصفح الصفحة.',
  'البيانات التي ترسلها بالتواصل تستعمل للرد عليك فقط.',
  'لا نبيع بياناتك ولا نشاركها مع أي طرف آخر.',
  'يمكنك طلب حذف بياناتك بالتواصل معنا.',
];

const LEGAL: (() => WeeSlide)[] = [
  // legal.columns: terms and privacy side by side in framed numbered lists.
  () => ({
    aiTemplate: 'legal.columns',
    name: 'الشروط والخصوصية عمودان',
    height: 600,
    mobileHeight: 940,
    backgroundColor: P_.card,
    elements: [
      on(heading(P_, { x: 96, y: 64, width: 1088, height: 60 }, 'الشروط والخصوصية', 42), 20, 40, 320, 60),
      on(text(P_, { x: 96, y: 126, width: 1088, height: 24 }, 'آخر تحديث: تشرين الأول 2026', 13), 20, 102, 320, 24),
      ...([['شروط الاستخدام', TERMS, 652, 140], ['سياسة الخصوصية', PRIVACY, 96, 540]] as const).flatMap(([title, list, x, my]) => [
        on(shape('إطار', { x, y: 180, width: 532, height: 350 }, { backgroundColor: P_.bg, borderColor: '#5FC9BD', borderWidth: 2, borderStyle: 'dashed', borderRadius: 20 }), 20, my, 320, 380),
        on(heading(P_, { x: x + 32, y: 210, width: 468, height: 36 }, title, 22), 36, my + 22, 288, 36),
        ...list.map((item, i) => on(text(P_, { x: x + 32, y: 258 + i * 64, width: 468, height: 56 }, `${i + 1}. ${item}`, 15, { color: P_.ink }), 36, my + 70 + i * 74, 288, 70)),
      ]),
    ],
  }),

  // legal.accordion: two tabs and questions; the first one is open.
  () => {
    const questions = ['شو هي هالصفحة؟', 'هل الأسعار نهائية؟', 'كيف بطلب؟', 'هل فيني استعمل الصور؟'];
    return {
      aiTemplate: 'legal.accordion',
      name: 'الشروط والخصوصية أسئلة',
      height: 600,
      mobileHeight: 580,
      backgroundColor: L_.bg,
      elements: [
        on(heading(L_, { x: 96, y: 64, width: 1088, height: 60 }, 'الشروط والخصوصية', 42), 20, 40, 320, 60),
        on(el('badge', 'تبويب', { x: 1024, y: 140, width: 160, height: 36 }, 'شروط الاستخدام', { backgroundColor: L_.ink, color: L_.bg, borderRadius: 9999, fontSize: 14, fontWeight: 'bold', fontFamily: L_.body }), 184, 112, 156, 36),
        on(el('badge', 'تبويب', { x: 852, y: 140, width: 160, height: 36 }, 'سياسة الخصوصية', { backgroundColor: L_.card, color: L_.ink, borderColor: L_.line, borderWidth: 1, borderRadius: 9999, fontSize: 14, fontWeight: 'bold', fontFamily: L_.body }), 20, 112, 156, 36),
        on(shape('سؤال مفتوح', { x: 304, y: 196, width: 880, height: 112 }, { backgroundColor: L_.card, borderColor: L_.line, borderWidth: 1, borderRadius: 14 }), 20, 164, 320, 150),
        on(icon({ x: 1136, y: 215, width: 22, height: 22 }, 'mdi:chevron-down', L_.accent), 302, 180, 22, 22),
        on(heading(L_, { x: 330, y: 212, width: 798, height: 30 }, questions[0], 17, { fontFamily: L_.body }), 36, 176, 258, 30),
        on(text(L_, { x: 330, y: 248, width: 828, height: 48 }, TERMS[0], 15), 36, 210, 288, 96),
        ...questions.slice(1).flatMap((q, i) => [
          on(shape('سؤال', { x: 304, y: 322 + i * 70, width: 880, height: 58 }, { backgroundColor: L_.card, borderColor: L_.line, borderWidth: 1, borderRadius: 14 }), 20, 330 + i * 68, 320, 56),
          on(icon({ x: 1136, y: 340 + i * 70, width: 22, height: 22 }, 'mdi:chevron-left', L_.muted), 302, 347 + i * 68, 22, 22),
          on(heading(L_, { x: 330, y: 336 + i * 70, width: 798, height: 30 }, q, 17, { fontFamily: L_.body }), 36, 343 + i * 68, 258, 30),
        ]),
      ],
    };
  },
];

// «فريق العمل»: ten designs of their own (a card grid, a spotlight, a mosaic, a ribbon, a leader with a grid, a path, a banner, numbers
// with people, an orbit, and a hiring slide). The portraits are the three stock photos the platform already used; a member without
// one is a letter in a circle. Phone layouts come from the automatic phone arrangement.
const PEOPLE = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
];
const MEMBERS = [
  ['سامر الحلبي', 'مدير المشاريع', 'يتابع كل مشروع من أول فكرة حتى التسليم.'],
  ['ليلى القاسم', 'رئيسة التصميم', 'تحوّل الأفكار إلى شكل يُحَب من أول نظرة.'],
  ['أحمد درويش', 'مسؤول الجودة', 'لا يسلّم شيئاً قبل أن يجرّبه بنفسه مرتين.'],
  ['هنادي خوري', 'خدمة الزبائن', 'أول من يردّ، وآخر من يغلق الملف.'],
  ['رامي سعيد', 'التنفيذ والتركيب', 'يعمل بيديه ويحترم الموعد.'],
];
const person = (box: Box, i: number, styles: Styles = {}) => image(box, PEOPLE[i % PEOPLE.length], { borderRadius: 9999, ...styles });
// A member without a photo: a person icon on a soft round (or rounded-square) ground.
const initial = (_L: Look, box: Box, glyph: string, fill: string, ink: string, _size = 0, radius = 9999) => [
  shape('خلفية الأيقونة', box, { backgroundColor: fill, borderRadius: radius }),
  icon({ x: box.x + box.width * 0.25, y: box.y + box.height * 0.25, width: box.width * 0.5, height: box.height * 0.5 }, glyph, ink),
];
const ring = (L: Look, extra: Styles = {}) => ({ borderWidth: 4, borderStyle: 'solid', borderColor: L.accent, ...extra });
const cardShape = (L: Look, box: Box, extra: Styles = {}, glow = 'rgba(0,0,0,0.16)') =>
  shape('بطاقة', box, { backgroundColor: L.card, borderColor: L.line, borderWidth: 1, borderRadius: 24, glowIntensity: 22, glowColor: glow, glowPosition: 'bottom', ...extra });
const socials = (color: string, x: number, y: number) => [
  icon({ x, y, width: 22, height: 22 }, 'mdi:instagram', color),
  icon({ x: x + 30, y, width: 22, height: 22 }, 'mdi:linkedin', color),
];

const TEAM: (() => WeeSlide)[] = [
  // team.cards: four member cards in a row, a ring round each portrait.
  () => ({
    aiTemplate: 'team.cards', name: 'فريق أربع بطاقات', height: 620, mobileHeight: 620, backgroundColor: K_.bg, dividerShape: 'wave',
    elements: [
      shape('دائرة زخرفية', { x: -140, y: -140, width: 380, height: 380 }, { backgroundColor: K_.soft, borderRadius: 9999 }),
      eyebrow(K_, { x: 96, y: 56, width: 1088, height: 26 }, 'فريق العمل'),
      heading(K_, { x: 96, y: 88, width: 1088, height: 62 }, 'ناس بيحبوا شغلهم', 46, { textEffect: 'marker', textEffectColor: 'rgba(154,52,18,0.3)' }),
      text(K_, { x: 96, y: 160, width: 760, height: 56 }, 'أربعة وجوه بتعرفوها من أول اتصال، وكل واحد مسؤول عن قسمه من أول فكرة لحد التسليم.', 17),
      ...MEMBERS.slice(0, 4).flatMap(([name, role, line], i) => {
        const x = 936 - i * 280;
        return [
          cardShape(K_, { x, y: 250, width: 248, height: 320 }, { animation: 'slide-up', animationTrigger: 'once' }, 'rgba(154,52,18,0.2)'),
          ...(i < 3 ? [person({ x: x + 68, y: 274, width: 112, height: 112 }, i, ring(K_, { glowIntensity: 14, glowColor: 'rgba(154,52,18,0.35)', glowPosition: 'bottom' }))] : initial(K_, { x: x + 68, y: 274, width: 112, height: 112 }, 'mdi:account', K_.soft, K_.accent)),
          heading(K_, { x: x + 16, y: 404, width: 216, height: 32 }, name, 21, { textAlign: 'center' }),
          text(K_, { x: x + 16, y: 438, width: 216, height: 24 }, role, 14, { textAlign: 'center', color: K_.accent, fontWeight: 'bold' }),
          text(K_, { x: x + 24, y: 468, width: 200, height: 50 }, line, 13, { textAlign: 'center' }),
          ...socials(K_.accent, x + 98, 530),
        ];
      }),
    ],
  }),

  // team.spotlight: one member in the light, with figures and the others in small.
  () => ({
    aiTemplate: 'team.spotlight', name: 'فريق واجهة قائدة الفريق', height: 640, mobileHeight: 640, backgroundColor: L_.bg,
    elements: [
      shape('إطار ذهبي', { x: 70, y: 92, width: 420, height: 490 }, { backgroundColor: 'transparent', borderColor: GOLD, borderWidth: 2, borderStyle: 'solid', borderRadius: 28 }),
      image({ x: 96, y: 70, width: 420, height: 490 }, PEOPLE[0], { borderRadius: 28, imageFilter: 'grayscale', glowIntensity: 24, glowColor: 'rgba(212,175,55,0.3)', glowPosition: 'bottom' }),
      eyebrow(L_, { x: 600, y: 84, width: 584, height: 26 }, 'قائدة الفريق'),
      heading(L_, { x: 600, y: 114, width: 584, height: 66 }, 'لينا الخطيب', 52, { animation: 'fade', animationTrigger: 'once' }),
      text(L_, { x: 600, y: 188, width: 584, height: 30 }, 'مديرة العمليات والجودة', 20, { color: L_.accent, fontWeight: 'bold' }),
      icon({ x: 1136, y: 236, width: 48, height: 48 }, 'mdi:format-quote-open', GOLD),
      text(L_, { x: 600, y: 290, width: 584, height: 110 }, 'أؤمن أن الثقة تُبنى بالتفاصيل الصغيرة: موعد يُحترم، وردّ يصل بسرعة، وعمل نسلّمه كما وعدنا.', 18, { color: L_.ink }),
      el('divider', 'خط فاصل', { x: 600, y: 420, width: 584, height: 2 }, '', { borderColor: L_.line, borderWidth: 1 }),
      ...[['15', 'سنة خبرة'], ['300', 'مشروع'], ['98%', 'رضا الزبائن']].flatMap(([n, label], i) => [
        heading(L_, { x: 1064 - i * 200, y: 436, width: 120, height: 52 }, n, 42, { color: L_.accent, animation: 'slide-up', animationTrigger: 'once' }),
        text(L_, { x: 1064 - i * 200, y: 490, width: 120, height: 24 }, label, 14, { color: L_.ink }),
      ]),
      ...[1, 2, 0].flatMap((m, i) => [person({ x: 600 + i * 56, y: 548, width: 44, height: 44 }, m, { borderWidth: 3, borderStyle: 'solid', borderColor: L_.card })]),
      text(L_, { x: 780, y: 556, width: 240, height: 28 }, 'ومعها تسعة زملاء', 15, { color: L_.muted }),
      button(L_, { x: 984, y: 544, width: 200, height: 50 }, 'تعرّف على الفريق', { backgroundColor: GOLD, color: '#1A1A1A', fontSize: 15 }),
    ],
  }),

  // team.mosaic: portraits in a staggered mosaic with name pills, a tilted band behind.
  () => ({
    aiTemplate: 'team.mosaic', name: 'فريق فسيفساء صور', height: 660, mobileHeight: 660, backgroundColor: P_.bg,
    elements: [
      shape('شريط مائل', { x: -120, y: 400, width: 1520, height: 320 }, { backgroundColor: P_.soft, rotation: -5 }),
      shape('دائرة زخرفية', { x: 1010, y: -90, width: 320, height: 320 }, { backgroundColor: 'rgba(13,148,136,0.14)', borderRadius: 9999, animation: 'float', animationTrigger: 'loop' }),
      eyebrow(P_, { x: 640, y: 76, width: 544, height: 26 }, 'فريق العمل'),
      heading(P_, { x: 640, y: 106, width: 544, height: 130 }, 'فريق صغير بأيدٍ كثيرة', 50, { textEffect: 'marker', textEffectColor: 'rgba(13,148,136,0.3)' }),
      text(P_, { x: 640, y: 252, width: 544, height: 88 }, 'نعمل كعائلة: كل واحد يعرف شغل الثاني، فما في مشروع بيتأخر لأن حدا غايب.', 18),
      button(P_, { x: 984, y: 364, width: 200, height: 52 }, 'انضم إلينا'),
      person({ x: 96, y: 70, width: 230, height: 290 }, 0, { borderRadius: 32 }),
      person({ x: 344, y: 120, width: 200, height: 250 }, 1, { borderRadius: 32 }),
      person({ x: 150, y: 392, width: 200, height: 200 }, 2, { borderRadius: 32 }),
      ...initial(P_, { x: 370, y: 410, width: 150, height: 150 }, 'mdi:account', P_.accent, '#FFFFFF', 0, 32),
      el('badge', 'اسم', { x: 112, y: 322, width: 198, height: 30 }, MEMBERS[0][0], { backgroundColor: P_.accent, color: '#FFFFFF', fontSize: 14, borderRadius: 9999, textAlign: 'center', fontFamily: P_.body }),
      el('badge', 'اسم', { x: 360, y: 332, width: 168, height: 30 }, MEMBERS[1][0], { backgroundColor: P_.card, color: P_.ink, fontSize: 14, borderRadius: 9999, textAlign: 'center', fontFamily: P_.body }),
      el('badge', 'اسم', { x: 166, y: 554, width: 168, height: 30 }, MEMBERS[2][0], { backgroundColor: P_.card, color: P_.ink, fontSize: 14, borderRadius: 9999, textAlign: 'center', fontFamily: P_.body }),
    ],
  }),

  // team.ribbon: three round portraits cross a soft band; a wavy line runs through it.
  () => ({
    aiTemplate: 'team.ribbon', name: 'فريق شريط وصور دائرية', height: 600, mobileHeight: 600, backgroundColor: K_.card,
    elements: [
      shape('شريط', { x: 0, y: 236, width: 1280, height: 170 }, { backgroundColor: K_.soft }),
      line({ x: 96, y: 322, width: 1088, height: 6 }, 'line-wavy', K_.accent),
      heading(K_, { x: 96, y: 52, width: 1088, height: 60 }, 'وجوه شغلنا', 46, { textAlign: 'center', textEffect: 'marker', textEffectColor: 'rgba(154,52,18,0.3)' }),
      text(K_, { x: 290, y: 122, width: 700, height: 56 }, 'مين بيجاوبك على الهاتف، ومين بيصمم، ومين بيوصل لعندك. تعرّف عليهم.', 17, { textAlign: 'center' }),
      ...MEMBERS.slice(0, 3).flatMap(([name, role, line], i) => {
        const cx = 1024 - i * 384;
        return [
          person({ x: cx - 95, y: 230, width: 190, height: 190 }, i, { borderWidth: 8, borderStyle: 'solid', borderColor: '#FFFFFF', glowIntensity: 24, glowColor: 'rgba(154,52,18,0.3)', glowPosition: 'bottom', animation: 'slide-up', animationTrigger: 'once' }),
          heading(K_, { x: cx - 150, y: 440, width: 300, height: 34 }, name, 24, { textAlign: 'center' }),
          text(K_, { x: cx - 150, y: 478, width: 300, height: 24 }, role, 15, { textAlign: 'center', color: K_.accent, fontWeight: 'bold' }),
          text(K_, { x: cx - 140, y: 508, width: 280, height: 44 }, line, 14, { textAlign: 'center' }),
        ];
      }),
    ],
  }),

  // team.leader: one large leader card beside a two-by-two grid of the others.
  () => ({
    aiTemplate: 'team.leader', name: 'فريق قائد وأربعة أعضاء', height: 640, mobileHeight: 640, backgroundColor: L_.bg,
    elements: [
      cardShape(L_, { x: 664, y: 70, width: 520, height: 500 }, { borderRadius: 28 }, 'rgba(6,182,212,0.25)'),
      shape('رأس البطاقة', { x: 664, y: 70, width: 520, height: 8 }, { backgroundColor: L_.accent, borderRadius: 4 }),
      person({ x: 1010, y: 112, width: 140, height: 140 }, 1, ring(L_, { borderColor: GOLD })),
      heading(L_, { x: 704, y: 128, width: 290, height: 40 }, 'سامر الحلبي', 30),
      text(L_, { x: 704, y: 176, width: 290, height: 26 }, 'المدير العام ومؤسس الفريق', 16, { color: L_.accent, fontWeight: 'bold' }),
      text(L_, { x: 704, y: 214, width: 290, height: 40 }, 'عشرون سنة بين الورشة والمكتب.', 14, { color: L_.muted }),
      text(L_, { x: 704, y: 284, width: 440, height: 110 }, 'بدأ الفريق بثلاثة أشخاص وطاولة واحدة. واليوم نحن فريق كامل، لكن القاعدة ما تغيّرت: نعمل كل مشروع كأنه مشروعنا.', 17, { color: L_.ink }),
      el('divider', 'خط فاصل', { x: 704, y: 420, width: 440, height: 2 }, '', { borderColor: L_.line, borderWidth: 1 }),
      ...['قيادة', 'تخطيط', 'جودة'].map((t, i) => el('badge', 'مهارة', { x: 1014 - i * 150, y: 446, width: 130, height: 34 }, t, { backgroundColor: L_.soft, color: L_.accent, fontSize: 14, borderRadius: 9999, textAlign: 'center', fontFamily: L_.body })),
      button(L_, { x: 944, y: 504, width: 200, height: 48 }, 'تواصل معه', { fontSize: 15 }),
      ...MEMBERS.slice(1, 5).flatMap(([name, role], i) => {
        const x = 376 - (i % 2) * 280;
        const y = 70 + Math.floor(i / 2) * 270;
        return [
          cardShape(L_, { x, y, width: 256, height: 230 }, { borderRadius: 22 }, 'rgba(6,182,212,0.18)'),
          ...initial(L_, { x: x + 176, y: y + 22, width: 60, height: 60 }, 'mdi:account', L_.soft, L_.accent),
          heading(L_, { x: x + 20, y: y + 100, width: 216, height: 30 }, name, 20),
          text(L_, { x: x + 20, y: y + 134, width: 216, height: 24 }, role, 14, { color: L_.accent, fontWeight: 'bold' }),
          icon({ x: x + 214, y: y + 178, width: 22, height: 22 }, 'mdi:briefcase-outline', L_.muted),
          text(L_, { x: x + 20, y: y + 178, width: 190, height: 24 }, `${[6, 9, 4, 11][i]} سنوات خبرة`, 14),
        ];
      }),
    ],
  }),

  // team.path: four people along a gradient line, a numbered step above each.
  () => ({
    aiTemplate: 'team.path', name: 'فريق مسار بخطوات', height: 600, mobileHeight: 600, backgroundColor: P_.soft,
    elements: [
      heading(P_, { x: 96, y: 52, width: 1088, height: 60 }, 'كيف بنشتغل معك؟', 44, { textAlign: 'center' }),
      text(P_, { x: 290, y: 118, width: 700, height: 56 }, 'أربع محطات، وفي كل محطة شخص مسؤول عنك بالاسم.', 18, { textAlign: 'center' }),
      line({ x: 140, y: 252, width: 1000, height: 4 }, 'line-gradient', P_.accent),
      ...MEMBERS.slice(0, 4).flatMap(([name, role, text_], i) => {
        const cx = 1100 - i * 307;
        const ic = ['mdi:lightbulb-outline', 'mdi:pencil-ruler', 'mdi:hammer-wrench', 'mdi:flag-checkered'][i];
        return [
          text(P_, { x: cx - 80, y: 206, width: 160, height: 24 }, `الخطوة ${['الأولى', 'الثانية', 'الثالثة', 'الرابعة'][i]}`, 14, { textAlign: 'center', color: P_.accent, fontWeight: 'bold' }),
          shape('نقطة', { x: cx - 22, y: 232, width: 44, height: 44 }, { backgroundColor: P_.accent, borderRadius: 9999, glowIntensity: 14, glowColor: 'rgba(13,148,136,0.5)', glowPosition: 'center' }),
          heading(P_, { x: cx - 22, y: 238, width: 44, height: 32 }, String(i + 1), 20, { textAlign: 'center', color: '#FFFFFF' }),
          cardShape(P_, { x: cx - 135, y: 310, width: 270, height: 250 }, { borderRadius: 22 }, 'rgba(13,148,136,0.22)'),
          shape('خلفية الأيقونة', { x: cx - 28, y: 330, width: 56, height: 56 }, { backgroundColor: P_.soft, borderRadius: 16 }),
          icon({ x: cx - 14, y: 344, width: 28, height: 28 }, ic, P_.accent, { animation: 'float', animationTrigger: 'loop' }),
          heading(P_, { x: cx - 120, y: 402, width: 240, height: 32 }, name, 21, { textAlign: 'center' }),
          text(P_, { x: cx - 120, y: 436, width: 240, height: 24 }, role, 15, { textAlign: 'center', color: P_.accent, fontWeight: 'bold' }),
          text(P_, { x: cx - 112, y: 468, width: 224, height: 60 }, text_, 14, { textAlign: 'center' }),
        ];
      }),
    ],
  }),

  // team.banner: a photo behind a dark veil, three glass cards over it.
  () => ({
    aiTemplate: 'team.banner', name: 'فريق على صورة بأوراق زجاجية', height: 640, mobileHeight: 640, backgroundColor: '#1B120D', backgroundImage: photo('k-hero'),
    elements: [
      shape('طبقة داكنة', { x: 0, y: 0, width: 1280, height: 640 }, { backgroundColor: 'rgba(24,12,6,0.62)' }),
      eyebrow(K_, { x: 96, y: 62, width: 1088, height: 26 }, 'فريق العمل', { textAlign: 'center', color: '#FDBA74' }),
      heading(K_, { x: 96, y: 94, width: 1088, height: 70 }, 'خلف كل طبخة إيدين بتعرفها', 50, { textAlign: 'center', color: '#FFFFFF', textShadowIntensity: 14, textShadowColor: 'rgba(0,0,0,0.6)', textShadowPosition: 'bottom' }),
      text(K_, { x: 290, y: 174, width: 700, height: 54 }, 'ثلاثة أشخاص بيصحوا قبل الكل ويناموا بعد الكل.', 18, { textAlign: 'center', color: 'rgba(255,255,255,0.88)' }),
      ...MEMBERS.slice(0, 3).flatMap(([name, role, line], i) => {
        const x = 848 - i * 376;
        return [
          shape('بطاقة زجاج', { x, y: 262, width: 336, height: 300 }, { backgroundColor: 'rgba(255,255,255,0.13)', borderColor: 'rgba(255,255,255,0.4)', borderWidth: 1, borderStyle: 'solid', borderRadius: 26, glowIntensity: 18, glowColor: 'rgba(255,255,255,0.25)', glowPosition: 'bottom', animation: 'slide-up', animationTrigger: 'once' }),
          person({ x: x + 118, y: 284, width: 100, height: 100 }, i, { borderWidth: 4, borderStyle: 'solid', borderColor: '#FFFFFF' }),
          heading(K_, { x: x + 20, y: 400, width: 296, height: 32 }, name, 23, { textAlign: 'center', color: '#FFFFFF' }),
          text(K_, { x: x + 20, y: 436, width: 296, height: 24 }, role, 15, { textAlign: 'center', color: '#FDBA74', fontWeight: 'bold' }),
          text(K_, { x: x + 36, y: 468, width: 264, height: 60 }, line, 14, { textAlign: 'center', color: 'rgba(255,255,255,0.85)' }),
        ];
      }),
    ],
  }),

  // team.numbers: four figures on top, three horizontal member cards under them.
  () => ({
    aiTemplate: 'team.numbers', name: 'فريق أرقام وأشخاص', height: 680, mobileHeight: 680, backgroundColor: L_.card,
    elements: [
      eyebrow(L_, { x: 96, y: 56, width: 1088, height: 26 }, 'فريق العمل'),
      heading(L_, { x: 96, y: 86, width: 1088, height: 62 }, 'أرقام تحكي عنا', 46),
      line({ x: 944, y: 156, width: 240, height: 4 }, 'line-gradient', GOLD),
      ...[['40+', 'عضو بالفريق'], ['15', 'سنة بالسوق'], ['900', 'مشروع منفّذ'], ['4.9', 'تقييم الزبائن']].flatMap(([n, label], i) => {
        const x = 934 - i * 279;
        return [
          cardShape(L_, { x, y: 190, width: 250, height: 120 }, { borderRadius: 20 }, 'rgba(212,175,55,0.18)'),
          heading(L_, { x: x + 16, y: 204, width: 218, height: 56 }, n, 44, { color: GOLD, textAlign: 'center', animation: 'slide-up', animationTrigger: 'once' }),
          text(L_, { x: x + 16, y: 266, width: 218, height: 26 }, label, 15, { textAlign: 'center', color: L_.ink }),
        ];
      }),
      ...MEMBERS.slice(0, 3).flatMap(([name, role, line_], i) => {
        const x = 848 - i * 376;
        return [
          cardShape(L_, { x, y: 350, width: 336, height: 290 }, { borderRadius: 24 }, 'rgba(6,182,212,0.18)'),
          person({ x: x + 196, y: 372, width: 120, height: 246 }, i, { borderRadius: 20, imageFilter: i === 1 ? 'grayscale' : undefined }),
          heading(L_, { x: x + 20, y: 392, width: 166, height: 54 }, name, 22),
          text(L_, { x: x + 20, y: 450, width: 166, height: 24 }, role, 14, { color: L_.accent, fontWeight: 'bold' }),
          text(L_, { x: x + 20, y: 486, width: 166, height: 100 }, line_, 14),
        ];
      }),
    ],
  }),

  // team.orbit: a round heading with five avatars on its orbit, each with a name pill.
  () => ({
    aiTemplate: 'team.orbit', name: 'فريق مدار دائري', height: 680, mobileHeight: 680, backgroundColor: P_.bg,
    elements: [
      shape('دائرة زخرفية', { x: 40, y: 480, width: 200, height: 200 }, { backgroundColor: P_.soft, borderRadius: 9999, animation: 'float', animationTrigger: 'loop' }),
      shape('دائرة زخرفية', { x: 1060, y: 40, width: 160, height: 160 }, { backgroundColor: 'rgba(13,148,136,0.14)', borderRadius: 9999, animation: 'float', animationTrigger: 'loop' }),
      shape('مدار', { x: 390, y: 100, width: 500, height: 500 }, { backgroundColor: P_.card, borderColor: P_.accent, borderWidth: 2, borderStyle: 'dashed', borderRadius: 9999, glowIntensity: 22, glowColor: 'rgba(13,148,136,0.22)', glowPosition: 'center' }),
      eyebrow(P_, { x: 470, y: 240, width: 340, height: 26 }, 'فريق العمل', { textAlign: 'center' }),
      heading(P_, { x: 470, y: 272, width: 340, height: 100 }, 'كل واحد عنده دور', 36, { textAlign: 'center' }),
      text(P_, { x: 480, y: 384, width: 320, height: 84 }, 'خمسة أشخاص يدورون حول شيء واحد: أن يخرج شغلك أحسن مما تتوقع.', 16, { textAlign: 'center' }),
      ...([[640, 100, 'right'], [878, 273, 'right'], [786, 552, 'right'], [494, 552, 'left'], [402, 273, 'left']] as [number, number, 'right' | 'left'][]).flatMap(([cx, cy, side], i) => {
        const m = MEMBERS[i];
        return [
          ...(i < 3 ? [person({ x: cx - 50, y: cy - 50, width: 100, height: 100 }, i, ring(P_, { borderColor: '#FFFFFF', borderWidth: 5, glowIntensity: 14, glowColor: 'rgba(13,148,136,0.4)', glowPosition: 'bottom' }))] : initial(P_, { x: cx - 50, y: cy - 50, width: 100, height: 100 }, 'mdi:account', P_.accent, '#FFFFFF')),
          el('badge', 'اسم', { x: side === 'right' ? cx + 60 : cx - 60 - 150, y: cy - 26, width: 150, height: 52 }, `${m[0]}\n${m[1]}`, { backgroundColor: P_.card, color: P_.ink, fontSize: 13, borderRadius: 14, textAlign: 'center', fontFamily: P_.body, borderColor: P_.line, borderWidth: 1, borderStyle: 'solid' }),
        ];
      }),
    ],
  }),

  // team.join: open roles on one side, the invitation and the stacked avatars on the other.
  () => ({
    aiTemplate: 'team.join', name: 'فريق انضم إلينا', height: 600, mobileHeight: 600, backgroundColor: K_.soft,
    elements: [
      shape('دائرة زخرفية', { x: 1000, y: 380, width: 340, height: 340 }, { backgroundColor: 'rgba(154,52,18,0.1)', borderRadius: 9999 }),
      eyebrow(K_, { x: 640, y: 84, width: 544, height: 26 }, 'انضم إلينا'),
      heading(K_, { x: 640, y: 114, width: 544, height: 130 }, 'عندنا مكان لموهبتك', 50, { textEffect: 'marker', textEffectColor: 'rgba(154,52,18,0.3)' }),
      text(K_, { x: 640, y: 258, width: 544, height: 84 }, 'نبحث عن ناس يحبون شغلهم ويتعلمون بسرعة. إذا تشبهنا، فتّح لنا باب الحديث.', 18),
      button(K_, { x: 984, y: 366, width: 200, height: 52 }, 'قدّم طلبك'),
      el('button', 'زر واتساب', { x: 754, y: 366, width: 210, height: 52 }, 'تواصل واتساب', { backgroundColor: WHATSAPP_GREEN, color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', borderRadius: 9999, textAlign: 'center', fontFamily: K_.body }),
      ...[0, 1, 2].map((i) => person({ x: 1128 - i * 40, y: 462, width: 56, height: 56 }, i, { borderWidth: 4, borderStyle: 'solid', borderColor: K_.soft })),
      ...initial(K_, { x: 1008, y: 462, width: 56, height: 56 }, 'mdi:plus', K_.accent, '#FFFFFF'),
      text(K_, { x: 770, y: 474, width: 220, height: 28 }, 'انضم لأكثر من اثني عشر زميلاً', 15, { color: K_.ink }),
      ...[['mdi:palette-outline', 'مصمم/ة واجهات', 'دوام كامل · عن بعد'], ['mdi:headset', 'خدمة زبائن', 'دوام جزئي'], ['mdi:wrench-outline', 'فني تركيب', 'دوام كامل']].flatMap(([ic, title, meta], i) => [
        cardShape(K_, { x: 96, y: 80 + i * 160, width: 480, height: 136 }, { borderRadius: 22, animation: 'slide-up', animationTrigger: 'once' }, 'rgba(154,52,18,0.2)'),
        shape('خلفية الأيقونة', { x: 504, y: 112 + i * 160, width: 56, height: 56 }, { backgroundColor: K_.soft, borderRadius: 16 }),
        icon({ x: 518, y: 126 + i * 160, width: 28, height: 28 }, ic, K_.accent),
        heading(K_, { x: 196, y: 108 + i * 160, width: 290, height: 34 }, title, 22),
        text(K_, { x: 196, y: 148 + i * 160, width: 290, height: 24 }, meta, 15),
        icon({ x: 120, y: 126 + i * 160, width: 28, height: 28 }, 'mdi:arrow-left', K_.accent),
      ]),
    ],
  }),
];

// Cards, frames and question boxes arrive as groups with what lies on them (the constitution's
// grouping rule); icon backgrounds and header strips inside a card stay plain shapes.
const CARD_NAMES = ['بطاقة', 'إطار', 'سؤال'];
const grouped = (make: () => WeeSlide) => (): WeeSlide => {
  const slide = make();
  return { ...slide, elements: groupTemplateCards(slide.elements as any[], (e) => CARD_NAMES.some((n) => e.name?.startsWith(n))) };
};

// Ready-slide categories the designs open, first in their category's list.
export const WEE_SLIDES: Record<string, (() => WeeSlide)[]> = Object.fromEntries(
  Object.entries({ intro: HERO, about: ABOUT, prices: PRICES, gallery: GALLERY, contact: CONTACT, privacy: LEGAL, team: TEAM }).map(([id, list]) => [id, list.map(grouped)]),
);

export const weeSlideCount = (categoryId: string) => WEE_SLIDES[categoryId]?.length || 0;

// Every design by its id, for the AI page build.
export const WEE_SLIDE_BY_ID: Record<string, () => WeeSlide> = Object.fromEntries(
  Object.values(WEE_SLIDES).flat().map((make) => [make().aiTemplate, make]),
);

// Ready slides of the «عناصر المطعم» category, offered only in restaurant projects: a front slide,
// menus in several layouts (live 'menuList' elements reading the admin window's dishes), the order
// cart, why-us and an order call, plus a running strip and shaking cards of the featured dishes and
// a running text strip (the same three as the shop and the car showroom). Colours and fonts are the
// restaurant template's own. Coordinates are on the 1280-wide canvas.
import { REST_COLORS as C, REST_PAGE_IDS, REST_HEADING_FONT, REST_BODY_FONT } from './restaurantTemplate';
import { FOOD_PHOTOS, foodPhoto } from '../components/restaurant/restaurantTypes';

type Box = { x: number; y: number; width: number; height: number };

const el = (type: string, name: string, box: Box, content: string, styles: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  type,
  name,
  ...box,
  content,
  styles,
  ...extra,
});

const heading = (box: Box, text: string, size: number, color = C.ink, align = 'center') =>
  el('heading', 'عنوان', box, text, { fontSize: size, fontWeight: 'bold', color, fontFamily: REST_HEADING_FONT, textAlign: align });

const paragraph = (box: Box, text: string, size = 16, color = C.muted, align = 'center') =>
  el('paragraph', 'نص', box, text, { fontSize: size, color, fontFamily: REST_BODY_FONT, textAlign: align });

const menu = (box: Box, extra: Record<string, unknown>, accent = C.accent) =>
  el('menuList', 'منيو المطعم', box, '', { color: accent }, { menuLayout: 'grid', ...extra });

const menuLink = { linkType: 'page', linkTargetId: REST_PAGE_IDS.menu, linkUrl: `#page-${REST_PAGE_IDS.menu}` };

const solidButton = (box: Box, text: string, link: Record<string, unknown> = menuLink) =>
  el('button', 'زر', box, text, {
    backgroundColor: C.accent,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    borderRadius: 9999,
    textAlign: 'center',
    fontFamily: REST_BODY_FONT,
    glowIntensity: 22,
    glowColor: 'rgba(181,86,43,0.45)',
    glowPosition: 'bottom',
  }, link);

const overlay = (height: number, alpha = 0.6) => el('shape', 'طبقة داكنة', { x: 0, y: 0, width: 1280, height }, '', { backgroundColor: `rgba(20,14,10,${alpha})` });

type RestSlide = {
  name: string;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
  elements: ReturnType<typeof el>[];
};

const SLIDES: (() => RestSlide)[] = [
  // 1. Front: a full photo with the headline and the menu button.
  () => ({
    name: 'واجهة المطعم',
    height: 640,
    backgroundColor: C.dark,
    backgroundImage: foodPhoto(FOOD_PHOTOS.mezze, 1800),
    elements: [
      overlay(640),
      el('heading', 'عنوان', { x: 500, y: 220, width: 640, height: 140 }, 'طعم البيت، من مطبخنا إليك', {
        fontSize: 56, fontWeight: 'bold', color: '#FFFFFF', fontFamily: REST_HEADING_FONT, textAlign: 'right', animation: 'slide-up', animationTrigger: 'once', animationDuration: 1.1,
      }),
      paragraph({ x: 600, y: 370, width: 540, height: 64 }, 'اختر أطباقك من المنيو، عدّلها على ذوقك، واطلبها توصيلًا أو استلامًا.', 18, 'rgba(255,255,255,0.85)', 'right'),
      solidButton({ x: 940, y: 460, width: 200, height: 56 }, 'تصفح المنيو'),
    ],
  }),

  // 2. Featured dishes: three cards with a heading.
  () => ({
    name: 'أطباق مميزة',
    height: 700,
    backgroundColor: C.cream,
    elements: [
      heading({ x: 0, y: 56, width: 1280, height: 56 }, 'أطباقنا المميزة', 38),
      paragraph({ x: 0, y: 116, width: 1280, height: 32 }, 'الأكثر طلبًا عند زبائننا'),
      menu({ x: 90, y: 176, width: 1100, height: 460 }, { menuSource: 'featured', menuLimit: 3 }),
    ],
  }),

  // 2b. A running strip of the featured dishes.
  () => ({
    name: 'شريط أطباق مميزة متحرك',
    height: 520,
    backgroundColor: C.cream,
    elements: [
      heading({ x: 0, y: 40, width: 1280, height: 50 }, 'أطباقنا المميزة', 34),
      menu({ x: 0, y: 110, width: 1280, height: 380 }, { menuLayout: 'marquee', menuSource: 'featured', menuSpeed: 35 }),
    ],
  }),

  // 2c. The featured dishes' cards, shaking every few seconds.
  () => ({
    name: 'أطباق مميزة بحركة اهتزاز',
    height: 700,
    backgroundColor: '#FFFFFF',
    elements: [
      heading({ x: 0, y: 56, width: 1280, height: 56 }, 'أطباقنا المميزة', 38),
      paragraph({ x: 0, y: 116, width: 1280, height: 32 }, 'الأكثر طلبًا عند زبائننا'),
      menu({ x: 90, y: 176, width: 1100, height: 460 }, { menuSource: 'featured', menuLimit: 3, shopCardAnimation: 'shake' }),
    ],
  }),

  // 2d. A narrow strip of text running left to right.
  () => ({
    name: 'شريط نص متحرك',
    height: 60,
    backgroundColor: C.accent,
    elements: [
      el('paragraph', 'نص متحرك', { x: 0, y: 14, width: 1280, height: 32 }, 'مشاوي على الفحم   •   توصيل سريع إلى بابك   •   مكونات طازجة كل صباح   •   اطلب الآن من الموقع   •   مشاوي على الفحم   •   توصيل سريع إلى بابك   •   مكونات طازجة كل صباح   •   اطلب الآن من الموقع', {
        fontSize: 18, fontWeight: '600', color: '#FFFFFF', fontFamily: REST_BODY_FONT, textAlign: 'center', animation: 'marquee-ltr', animationTrigger: 'loop', animationDuration: 18,
      }),
    ],
  }),

  // 3. The whole menu: catalog tabs over cards.
  () => ({
    name: 'المنيو كاملًا بأقسام',
    height: 1400,
    backgroundColor: C.cream,
    elements: [menu({ x: 60, y: 60, width: 1160, height: 1280 }, {})],
  }),

  // 4. Menu rows: name and price beside a small photo, like a printed menu.
  () => ({
    name: 'منيو بصفوف',
    height: 1200,
    backgroundColor: '#FFFFFF',
    elements: [
      heading({ x: 0, y: 50, width: 1280, height: 56 }, 'المنيو', 40),
      menu({ x: 90, y: 130, width: 1100, height: 1020 }, { menuLayout: 'list' }),
    ],
  }),

  // 5. Large photos on a dark page.
  () => ({
    name: 'أطباق بصور كبيرة',
    height: 900,
    backgroundColor: C.dark,
    elements: [
      heading({ x: 0, y: 56, width: 1280, height: 56 }, 'من مطبخنا', 38, '#FFFFFF'),
      menu({ x: 90, y: 150, width: 1100, height: 700 }, { menuLayout: 'large', menuSource: 'featured', menuLimit: 4 }, '#E8894F'),
    ],
  }),

  // 6. One catalog of the menu (picked in the element's settings).
  () => ({
    name: 'قسم واحد من المنيو',
    height: 760,
    backgroundColor: C.cream,
    elements: [
      heading({ x: 90, y: 50, width: 1100, height: 56 }, 'مشروبات', 36, C.ink, 'right'),
      menu({ x: 90, y: 130, width: 1100, height: 580 }, { menuSource: 'category', menuTabs: false }),
    ],
  }),

  // 7. The order cart.
  () => ({
    name: 'سلة الطلب',
    height: 760,
    backgroundColor: C.cream,
    elements: [
      heading({ x: 0, y: 40, width: 1280, height: 56 }, 'طلبك', 38),
      el('menuCart', 'سلة الطلب', { x: 90, y: 120, width: 1100, height: 600 }, '', { color: C.accent }),
    ],
  }),

  // 8. Why order from us: four cards.
  () => {
    const perks = [
      { icon: 'iconify:mdi:leaf', title: 'مكونات طازجة', text: 'نشتري خضارنا ولحومنا كل صباح.' },
      { icon: 'iconify:mdi:fire', title: 'على الفحم', text: 'مشاوينا على الفحم كما تحبها.' },
      { icon: 'iconify:mdi:moped-outline', title: 'توصيل سريع', text: 'طلبك يصلك ساخنًا إلى باب البيت.' },
      { icon: 'iconify:mdi:silverware-fork-knife', title: 'على ذوقك', text: 'أزل أي مكون أو أضف ما تريد لكل طبق.' },
    ];
    return {
      name: 'لماذا نحن',
      height: 340,
      backgroundColor: '#FFFFFF',
      elements: [
        heading({ x: 0, y: 40, width: 1280, height: 50 }, 'لماذا تطلب منّا؟', 32),
        ...perks.flatMap((p, i) => {
          const x = 90 + (3 - i) * 280;
          return [
            el('shape', 'بطاقة', { x, y: 112, width: 260, height: 190 }, '', { backgroundColor: C.cream, borderRadius: 24 }),
            el('icon', 'أيقونة', { x: x + 196, y: 134, width: 40, height: 40 }, p.icon, { color: C.accent }),
            heading({ x: x + 20, y: 186, width: 220, height: 32 }, p.title, 20, C.ink, 'right'),
            paragraph({ x: x + 20, y: 224, width: 220, height: 60 }, p.text, 14, C.body, 'right'),
          ];
        }),
      ],
    };
  },

  // 9. Order call on a photo.
  () => ({
    name: 'اطلب الآن',
    height: 300,
    backgroundColor: C.dark,
    backgroundImage: foodPhoto(FOOD_PHOTOS.grill, 1800),
    elements: [
      overlay(300, 0.7),
      heading({ x: 0, y: 80, width: 1280, height: 56 }, 'جائع؟ اطلب الآن', 38, '#FFFFFF'),
      paragraph({ x: 0, y: 140, width: 1280, height: 32 }, 'طلبك يصل ساخنًا، أو استلمه جاهزًا من المطعم.', 17, 'rgba(255,255,255,0.8)'),
      solidButton({ x: 530, y: 196, width: 220, height: 54 }, 'اطلب من المنيو'),
    ],
  }),
];

export const REST_SLIDE_COUNT = SLIDES.length;

export const getRestaurantSlidePayload = (index: number) => SLIDES[Math.min(Math.max(index, 0), SLIDES.length - 1)]();

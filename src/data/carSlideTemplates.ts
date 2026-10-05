// Ready slides of the «عناصر معرض السيارات» category, offered only in car showroom projects: two
// front slides, car lists in several layouts (live 'carListings' elements reading the showroom's
// published cars), two search bars, a running strip and shaking cards of the featured cars, a running
// text strip, why-us, about, numbers and contact slides.
// Colours and fonts are the showroom template's own. Coordinates are on the 1280-wide canvas.
import { CAR_PAGE_IDS, CAR_PHOTOS, CAR_HEADING_FONT, CAR_BODY_FONT, carPhoto } from './carShowroomTemplate';
import { groupFrame, INVISIBLE_GROUP_STYLES } from '../utils/templateGroups';

const C = {
  ink: '#121316',
  body: '#4A4D55',
  muted: '#8A8D96',
  accent: '#C8102E',
  light: '#F4F4F5',
  line: 'rgba(18,19,22,0.08)',
};
const WHATSAPP_NUMBER = '963991234567';

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
  el('heading', 'عنوان', box, text, { fontSize: size, fontWeight: 'bold', color, fontFamily: CAR_HEADING_FONT, textAlign: align });

const paragraph = (box: Box, text: string, size = 16, color = C.muted, align = 'center') =>
  el('paragraph', 'نص', box, text, { fontSize: size, color, fontFamily: CAR_BODY_FONT, textAlign: align });

const cars = (box: Box, extra: Record<string, unknown>, accent = C.accent) =>
  el('carListings', 'سيارات المعرض', box, '', { color: accent }, { carLayout: 'grid', carLimit: 9, ...extra });

const search = (box: Box, look: 'minimal' | 'pill' | 'glass') =>
  el('carSearch', 'بحث عن سيارة', box, 'ابحث بالماركة أو الموديل أو السنة...', { color: C.accent }, { shopSearchStyle: look });

const showroomLink = { linkType: 'page', linkTargetId: CAR_PAGE_IDS.showroom, linkUrl: `#page-${CAR_PAGE_IDS.showroom}` };
const whatsappLink = { linkType: 'contact', contactType: 'whatsapp', contactValue: WHATSAPP_NUMBER, linkUrl: `https://wa.me/${WHATSAPP_NUMBER}` };

const solidButton = (box: Box, text: string, link: Record<string, unknown> = showroomLink) =>
  el('button', 'زر', box, text, {
    backgroundColor: C.accent,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    borderRadius: 9999,
    textAlign: 'center',
    fontFamily: CAR_BODY_FONT,
    glowIntensity: 24,
    glowColor: 'rgba(200,16,46,0.5)',
    glowPosition: 'bottom',
  }, link);

const lineButton = (box: Box, text: string, link: Record<string, unknown>, dark: boolean) =>
  el('button', 'زر', box, text, {
    backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'transparent',
    color: dark ? '#FFFFFF' : C.ink,
    borderColor: dark ? 'rgba(255,255,255,0.5)' : C.ink,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: '600',
    borderRadius: 9999,
    textAlign: 'center',
    fontFamily: CAR_BODY_FONT,
  }, link);

const badge = (box: Box, text: string) =>
  el('badge', 'شارة', box, text, { backgroundColor: C.accent, color: '#FFFFFF', fontSize: 14, fontWeight: '600', borderRadius: 9999, fontFamily: CAR_BODY_FONT });

const overlay = (height: number, alpha = 0.55) => el('shape', 'طبقة داكنة', { x: 0, y: 0, width: 1280, height }, '', { backgroundColor: `rgba(10,10,12,${alpha})` });

type CarSlide = {
  name: string;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundOpacity?: number;
  elements: ReturnType<typeof el>[];
};

const SLIDES: (() => CarSlide)[] = [
  // 1. Front: a full photo with the headline and two buttons.
  () => ({
    name: 'واجهة المعرض',
    height: 640,
    backgroundColor: C.ink,
    backgroundImage: carPhoto(CAR_PHOTOS.hero),
    elements: [
      overlay(640),
      badge({ x: 980, y: 170, width: 160, height: 34 }, 'وصلت سيارات جديدة'),
      el('heading', 'عنوان', { x: 500, y: 220, width: 640, height: 140 }, 'سيارتك القادمة بانتظارك', {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#FFFFFF',
        fontFamily: CAR_HEADING_FONT,
        textAlign: 'right',
        animation: 'slide-up',
        animationTrigger: 'once',
        animationDuration: 1.1,
      }),
      paragraph({ x: 600, y: 370, width: 540, height: 64 }, 'سيارات مختارة ومفحوصة بأسعار واضحة. تصفّح المعرض واطلب معاينة أو تجربة قيادة.', 18, 'rgba(255,255,255,0.85)', 'right'),
      solidButton({ x: 940, y: 460, width: 200, height: 56 }, 'تصفح المعرض'),
      lineButton({ x: 720, y: 460, width: 200, height: 56 }, 'راسلنا واتساب', whatsappLink, true),
    ],
  }),

  // 2. Front: dark with the search bar in the middle.
  () => ({
    name: 'واجهة مع بحث',
    height: 560,
    backgroundColor: C.ink,
    backgroundImage: carPhoto(CAR_PHOTOS.dark),
    elements: [
      overlay(560, 0.65),
      heading({ x: 0, y: 150, width: 1280, height: 70 }, 'ابحث عن سيارتك', 52, '#FFFFFF'),
      paragraph({ x: 0, y: 230, width: 1280, height: 34 }, 'اكتب الماركة أو الموديل أو سنة الصنع', 18, 'rgba(255,255,255,0.8)'),
      search({ x: 240, y: 300, width: 800, height: 66 }, 'glass'),
      solidButton({ x: 540, y: 410, width: 200, height: 52 }, 'كل السيارات'),
    ],
  }),

  // 3. Featured cars: three cards with a heading.
  () => ({
    name: 'سيارات مميزة',
    height: 700,
    backgroundColor: C.light,
    elements: [
      heading({ x: 0, y: 56, width: 1280, height: 56 }, 'سيارات مميزة', 36),
      paragraph({ x: 0, y: 114, width: 1280, height: 32 }, 'اخترناها لك من أفضل ما في المعرض'),
      cars({ x: 90, y: 170, width: 1100, height: 440 }, { carSource: 'featured', carLimit: 3 }),
      lineButton({ x: 530, y: 628, width: 220, height: 50 }, 'كل السيارات', showroomLink, false),
    ],
  }),

  // 4. The whole showroom: a filter bar over a grid of cards.
  () => ({
    name: 'كل السيارات مع تصفية',
    height: 1400,
    backgroundColor: C.light,
    elements: [cars({ x: 60, y: 60, width: 1160, height: 1280 }, { carFilters: true, carLimit: 12 })],
  }),

  // 5. Wide rows: each car on a row with its photo beside its details.
  () => ({
    name: 'سيارات بصفوف عرضية',
    height: 980,
    backgroundColor: '#FFFFFF',
    elements: [
      heading({ x: 90, y: 50, width: 1100, height: 56 }, 'أحدث ما وصلنا', 36, C.ink, 'right'),
      cars({ x: 90, y: 130, width: 1100, height: 800 }, { carLayout: 'wide', carLimit: 4 }),
    ],
  }),

  // 6. Large photos on a dark page.
  () => ({
    name: 'سيارات بصور كبيرة',
    height: 900,
    backgroundColor: C.ink,
    elements: [
      heading({ x: 0, y: 56, width: 1280, height: 56 }, 'سيارات تستحق النظر', 36, '#FFFFFF'),
      cars({ x: 90, y: 150, width: 1100, height: 700 }, { carLayout: 'large', carLimit: 4, carCardBg: '#1D1F24', carCardText: '#FFFFFF' }, '#FF4D5E'),
    ],
  }),

  // 7. A running strip of the featured cars.
  () => ({
    name: 'شريط سيارات مميزة متحرك',
    height: 260,
    backgroundColor: '#FFFFFF',
    elements: [
      heading({ x: 0, y: 30, width: 1280, height: 44 }, 'في المعرض الآن', 26),
      cars({ x: 0, y: 96, width: 1280, height: 130 }, { carLayout: 'marquee', carSpeed: 35, carSource: 'featured' }),
    ],
  }),

  // 7b. The featured cars' cards, shaking every few seconds.
  () => ({
    name: 'سيارات مميزة بحركة اهتزاز',
    height: 700,
    backgroundColor: '#FFFFFF',
    elements: [
      heading({ x: 0, y: 56, width: 1280, height: 56 }, 'سيارات مميزة', 36),
      paragraph({ x: 0, y: 114, width: 1280, height: 32 }, 'اخترناها لك من أفضل ما في المعرض'),
      cars({ x: 90, y: 170, width: 1100, height: 470 }, { carSource: 'featured', carLimit: 3, shopCardAnimation: 'shake' }),
    ],
  }),

  // 7c. A narrow strip of text running left to right.
  () => ({
    name: 'شريط نص متحرك',
    height: 60,
    backgroundColor: C.accent,
    elements: [
      el('paragraph', 'نص متحرك', { x: 0, y: 14, width: 1280, height: 32 }, 'فحص كامل لكل سيارة   •   تقسيط مريح   •   أوراق نظامية   •   تجربة قيادة مجانية   •   فحص كامل لكل سيارة   •   تقسيط مريح   •   أوراق نظامية   •   تجربة قيادة مجانية', {
        fontSize: 18, fontWeight: '600', color: '#FFFFFF', fontFamily: CAR_BODY_FONT, textAlign: 'center', animation: 'marquee-ltr', animationTrigger: 'loop', animationDuration: 18,
      }),
    ],
  }),

  // 8. A search bar on its own.
  () => ({
    name: 'شريط بحث',
    height: 160,
    backgroundColor: C.light,
    elements: [search({ x: 240, y: 48, width: 800, height: 64 }, 'pill')],
  }),

  // 9. Why buy from us: four cards.
  () => {
    const perks = [
      { icon: 'iconify:mdi:shield-check-outline', title: 'سيارات مفحوصة', text: 'كل سيارة تُفحص قبل عرضها، وتعرف حالتها كاملة.' },
      { icon: 'iconify:mdi:tag-outline', title: 'أسعار واضحة', text: 'السعر مكتوب على كل سيارة، بلا مفاجآت.' },
      { icon: 'iconify:mdi:swap-horizontal', title: 'بدّل سيارتك', text: 'نقيّم سيارتك ونقبلها جزءًا من الثمن.' },
      { icon: 'iconify:mdi:handshake-outline', title: 'خدمة بعد البيع', text: 'نساعدك في نقل الملكية وكل الأوراق.' },
    ];
    return {
      name: 'لماذا نحن',
      height: 360,
      backgroundColor: '#FFFFFF',
      elements: [
        heading({ x: 0, y: 44, width: 1280, height: 50 }, 'لماذا تشتري منّا؟', 32),
        ...perks.flatMap((p, i) => {
          const x = 90 + (3 - i) * 280;
          return [
            el('shape', 'بطاقة', { x, y: 120, width: 260, height: 200 }, '', { backgroundColor: C.light, borderRadius: 24 }),
            el('icon', 'أيقونة', { x: x + 196, y: 144, width: 40, height: 40 }, p.icon, { color: C.accent }),
            heading({ x: x + 20, y: 196, width: 220, height: 32 }, p.title, 20, C.ink, 'right'),
            paragraph({ x: x + 20, y: 234, width: 220, height: 66 }, p.text, 14, C.body, 'right'),
          ];
        }),
      ],
    };
  },

  // 10. About: a photo beside the story.
  () => ({
    name: 'من نحن',
    height: 620,
    backgroundColor: '#FFFFFF',
    elements: [
      el('image', 'صورة', { x: 90, y: 70, width: 520, height: 480 }, '', { borderRadius: 28, objectFit: 'cover' }, { imageUrl: carPhoto(CAR_PHOTOS.showroom, 1200) }),
      badge({ x: 1000, y: 110, width: 140, height: 34 }, 'من نحن'),
      heading({ x: 680, y: 160, width: 460, height: 110 }, 'خبرة طويلة في بيع وشراء السيارات', 36, C.ink, 'right'),
      paragraph({ x: 680, y: 290, width: 460, height: 150 }, 'بدأنا معرضنا بهدف بسيط: أن يشتري الزبون سيارته وهو مطمئن. نختار كل سيارة بعناية، نفحصها، ونعرض حالتها وسعرها بوضوح.', 16, C.body, 'right'),
      solidButton({ x: 940, y: 470, width: 200, height: 52 }, 'تصفح المعرض'),
    ],
  }),

  // 11. Numbers on a dark band.
  () => {
    const stats = [
      { n: '+15', t: 'سنة خبرة' },
      { n: '+2000', t: 'سيارة بيعت' },
      { n: '+1800', t: 'زبون راضٍ' },
    ];
    return {
      name: 'أرقامنا',
      height: 300,
      backgroundColor: C.ink,
      elements: stats.flatMap((s, i) => {
        const x = 140 + (2 - i) * 340;
        return [
          // An invisible group keeps each number with its label (moved, copied and phone-arranged together).
          el('shape', 'مجموعة', groupFrame({ x, y: 90, width: 320, height: 110 }), '', { ...INVISIBLE_GROUP_STYLES }, { isGroupContainer: true, groupName: 'رقم' }),
          heading({ x, y: 90, width: 320, height: 70 }, s.n, 52, '#FFFFFF'),
          paragraph({ x, y: 168, width: 320, height: 32 }, s.t, 17, 'rgba(255,255,255,0.7)'),
        ];
      }),
    };
  },

  // 12. Call to action on a photo.
  () => ({
    name: 'اطلب سيارتك',
    height: 300,
    backgroundColor: C.ink,
    backgroundImage: carPhoto(CAR_PHOTOS.road),
    elements: [
      overlay(300, 0.7),
      heading({ x: 0, y: 80, width: 1280, height: 56 }, 'لم تجد السيارة التي تريدها؟', 36, '#FFFFFF'),
      paragraph({ x: 0, y: 140, width: 1280, height: 32 }, 'أخبرنا بما تبحث عنه ونجده لك.', 17, 'rgba(255,255,255,0.8)'),
      solidButton({ x: 530, y: 196, width: 220, height: 54 }, 'راسلنا واتساب', whatsappLink),
    ],
  }),
];

export const CAR_SLIDE_COUNT = SLIDES.length;

export const getCarSlidePayload = (index: number) => SLIDES[Math.min(Math.max(index, 0), SLIDES.length - 1)]();

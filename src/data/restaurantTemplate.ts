// Restaurant template (Weelink / Restaurant): a 4-page site (الرئيسية، المنيو، طلبك، تواصل معنا)
// sharing one navbar. Everything is made of regular elements the owner edits freely; the dishes
// come live from the admin window through 'menuList' elements and the guest orders through the
// 'menuCart' element. More pages are added like in any project.
import type { Page, CanvasElement, NavbarConfig, ElementStyles } from '../types';
import { withTemplateGroups } from '../utils/templateGroups';
import { FOOD_PHOTOS, foodPhoto } from '../components/restaurant/restaurantTypes';

export const REST_PAGE_IDS = { home: 'rest-page-home', menu: 'rest-page-menu', cart: 'rest-page-cart', contact: 'rest-page-contact' };

const WHATSAPP_NUMBER = '963991234567';

export const REST_COLORS = {
  ink: '#2B2118',
  body: '#5C4F44',
  muted: '#8C7F73',
  accent: '#B5562B',
  cream: '#FBF6EF',
  card: '#FFFFFF',
  dark: '#1E1712',
  line: 'rgba(43,33,24,0.08)',
};
const C = REST_COLORS;
export const REST_HEADING_FONT = 'El Messiri';
export const REST_BODY_FONT = 'Cairo';

type Box = { x: number; y: number; width: number; height: number };

function el(id: string, type: CanvasElement['type'], slideId: string, box: Box, content: string, styles: ElementStyles, extra: Partial<CanvasElement> = {}): CanvasElement {
  return { id, name: type, type, ...box, content, slideId, styles, ...extra };
}

const heading = (id: string, slideId: string, box: Box, text: string, size: number, color = C.ink, align: 'right' | 'center' = 'right') =>
  el(id, 'heading', slideId, box, text, { fontSize: size, fontWeight: 'bold', color, fontFamily: REST_HEADING_FONT, textAlign: align });

const paragraph = (id: string, slideId: string, box: Box, text: string, size = 16, color = C.body, align: 'right' | 'center' = 'right') =>
  el(id, 'paragraph', slideId, box, text, { fontSize: size, color, fontFamily: REST_BODY_FONT, textAlign: align });

const pageLink = (target: string) => ({ linkType: 'page' as const, linkTargetId: target, linkUrl: `#page-${target}` });
const whatsapp = { linkType: 'contact' as const, contactType: 'whatsapp' as const, contactValue: WHATSAPP_NUMBER, linkUrl: `https://wa.me/${WHATSAPP_NUMBER}` };

const button = (id: string, slideId: string, box: Box, text: string, solid: boolean, link: Partial<CanvasElement>, dark = false) =>
  el(id, 'button', slideId, box, text, solid
    ? { backgroundColor: C.accent, color: '#FFFFFF', fontSize: 16, fontWeight: '600', borderRadius: 9999, textAlign: 'center', fontFamily: REST_BODY_FONT, glowIntensity: 22, glowColor: 'rgba(181,86,43,0.45)', glowPosition: 'bottom' }
    : { backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'transparent', color: dark ? '#FFFFFF' : C.ink, borderColor: dark ? 'rgba(255,255,255,0.55)' : C.ink, borderWidth: 1, fontSize: 16, fontWeight: '600', borderRadius: 9999, textAlign: 'center', fontFamily: REST_BODY_FONT },
  link);

export const menuList = (id: string, slideId: string, box: Box, extra: Partial<CanvasElement> = {}): CanvasElement =>
  el(id, 'menuList', slideId, box, '', { color: C.accent }, { name: 'منيو المطعم', menuLayout: 'grid', ...extra });

export const menuCart = (id: string, slideId: string, box: Box): CanvasElement =>
  el(id, 'menuCart', slideId, box, '', { color: C.accent }, { name: 'سلة الطلب' });

function buildNavbar(): NavbarConfig {
  const link = (id: string, label: string, target: string) => ({ id, label, href: '#', linkType: 'page' as const, linkTargetId: target });
  return {
    brandName: 'اسم مطعمك',
    brandSubtext: '',
    items: [
      link('nav-rest-home', 'الرئيسية', REST_PAGE_IDS.home),
      link('nav-rest-menu', 'المنيو', REST_PAGE_IDS.menu),
      link('nav-rest-cart', 'طلبك', REST_PAGE_IDS.cart),
      link('nav-rest-contact', 'تواصل معنا', REST_PAGE_IDS.contact),
    ],
    ctaText: 'اطلب الآن',
    ctaHref: '#',
    ctaLinkType: 'page',
    ctaLinkTargetId: REST_PAGE_IDS.menu,
    bgColor: '#FFFFFF',
    textColor: C.ink,
    isSticky: true,
  };
}

export function getRestaurantTemplate(): { pages: Page[]; elements: CanvasElement[] } {
  const S = {
    hero: 'rest-home-hero',
    featured: 'rest-home-featured',
    perks: 'rest-home-perks',
    cta: 'rest-home-cta',
    menuHead: 'rest-menu-head',
    menuAll: 'rest-menu-all',
    cart: 'rest-cart-slide',
    contact: 'rest-contact-slide',
  };
  const slide = (id: string, name: string, height: number, backgroundColor: string, image?: string) => ({
    id, name, height, backgroundColor, dividerShape: 'straight' as const,
    ...(image ? { backgroundImage: foodPhoto(image, 1800), backgroundSize: 'cover' as const, backgroundPosition: 'center' } : {}),
  });

  const pages: Page[] = [
    {
      id: REST_PAGE_IDS.home, name: 'الرئيسية', slug: '/', navbar: buildNavbar(),
      slides: [
        slide(S.hero, 'الواجهة', 640, C.dark, FOOD_PHOTOS.mezze),
        slide(S.featured, 'أطباق مميزة', 720, C.cream),
        slide(S.perks, 'لماذا نحن', 340, '#FFFFFF'),
        slide(S.cta, 'اطلب الآن', 300, C.dark, FOOD_PHOTOS.grill),
      ],
    },
    {
      id: REST_PAGE_IDS.menu, name: 'المنيو', slug: '/menu', navbar: buildNavbar(),
      slides: [
        slide(S.menuHead, 'رأس المنيو', 280, C.dark, FOOD_PHOTOS.plates),
        slide(S.menuAll, 'كل الأطباق', 1500, C.cream),
      ],
    },
    {
      id: REST_PAGE_IDS.cart, name: 'طلبك', slug: '/cart', navbar: buildNavbar(),
      slides: [slide(S.cart, 'سلة الطلب', 760, C.cream)],
    },
    {
      id: REST_PAGE_IDS.contact, name: 'تواصل معنا', slug: '/contact', navbar: buildNavbar(),
      slides: [slide(S.contact, 'تواصل معنا', 580, C.cream)],
    },
  ];

  const perks = [
    { icon: 'iconify:mdi:leaf', title: 'مكونات طازجة', text: 'نشتري خضارنا ولحومنا كل صباح.' },
    { icon: 'iconify:mdi:fire', title: 'على الفحم', text: 'مشاوينا على الفحم كما تحبها.' },
    { icon: 'iconify:mdi:moped-outline', title: 'توصيل سريع', text: 'طلبك يصلك ساخنًا إلى باب البيت.' },
    { icon: 'iconify:mdi:silverware-fork-knife', title: 'على ذوقك', text: 'أزل أي مكون أو أضف ما تريد لكل طبق.' },
  ];
  const contactRows = [
    { icon: 'iconify:mdi:whatsapp', text: '+963 991 234 567', link: whatsapp },
    { icon: 'iconify:mdi:phone', text: '+963 991 234 567', link: { linkType: 'contact' as const, contactType: 'phone' as const, contactValue: '+963 991 234 567', linkUrl: `tel:+${WHATSAPP_NUMBER}` } },
    { icon: 'iconify:mdi:map-marker-outline', text: 'دمشق، الشعلان', link: {} },
    { icon: 'iconify:mdi:clock-outline', text: 'يوميًا من 11 صباحًا حتى 12 ليلًا', link: {} },
  ];

  const elements: CanvasElement[] = [
    // ---------- Home: hero ----------
    el('rest-hero-overlay', 'shape', S.hero, { x: 0, y: 0, width: 1280, height: 640 }, '', { backgroundColor: 'rgba(20,14,10,0.6)' }),
    el('rest-hero-badge', 'badge', S.hero, { x: 990, y: 170, width: 150, height: 34 }, 'التوصيل متاح', { backgroundColor: C.accent, color: '#FFFFFF', fontSize: 14, fontWeight: '600', borderRadius: 9999, fontFamily: REST_BODY_FONT }),
    el('rest-hero-heading', 'heading', S.hero, { x: 500, y: 220, width: 640, height: 140 }, 'طعم البيت، من مطبخنا إليك', {
      fontSize: 56, fontWeight: 'bold', color: '#FFFFFF', fontFamily: REST_HEADING_FONT, textAlign: 'right', animation: 'slide-up', animationTrigger: 'once', animationDuration: 1.1,
    }),
    paragraph('rest-hero-text', S.hero, { x: 600, y: 370, width: 540, height: 64 }, 'اختر أطباقك من المنيو، عدّلها على ذوقك، واطلبها توصيلًا أو استلامًا.', 18, 'rgba(255,255,255,0.85)'),
    button('rest-hero-cta', S.hero, { x: 940, y: 460, width: 200, height: 56 }, 'تصفح المنيو', true, pageLink(REST_PAGE_IDS.menu)),
    button('rest-hero-cta-2', S.hero, { x: 720, y: 460, width: 200, height: 56 }, 'راسلنا واتساب', false, whatsapp, true),

    // ---------- Home: featured ----------
    heading('rest-featured-heading', S.featured, { x: 0, y: 56, width: 1280, height: 56 }, 'أطباقنا المميزة', 38, C.ink, 'center'),
    paragraph('rest-featured-sub', S.featured, { x: 0, y: 116, width: 1280, height: 32 }, 'الأكثر طلبًا عند زبائننا', 16, C.muted, 'center'),
    menuList('rest-featured-live', S.featured, { x: 90, y: 176, width: 1100, height: 440 }, { menuSource: 'featured', menuLimit: 3 }),
    button('rest-featured-more', S.featured, { x: 530, y: 640, width: 220, height: 50 }, 'كل المنيو', false, pageLink(REST_PAGE_IDS.menu)),

    // ---------- Home: why us ----------
    heading('rest-perks-heading', S.perks, { x: 0, y: 40, width: 1280, height: 50 }, 'لماذا تطلب منّا؟', 32, C.ink, 'center'),
    ...perks.flatMap((p, i) => {
      const x = 90 + (3 - i) * 280;
      return [
        el(`rest-perk-${i + 1}-card`, 'shape', S.perks, { x, y: 112, width: 260, height: 190 }, '', { backgroundColor: C.cream, borderRadius: 24 }),
        el(`rest-perk-${i + 1}-icon`, 'icon', S.perks, { x: x + 196, y: 134, width: 40, height: 40 }, p.icon, { color: C.accent }),
        heading(`rest-perk-${i + 1}-title`, S.perks, { x: x + 20, y: 186, width: 220, height: 32 }, p.title, 20),
        paragraph(`rest-perk-${i + 1}-text`, S.perks, { x: x + 20, y: 224, width: 220, height: 60 }, p.text, 14),
      ];
    }),

    // ---------- Home: call to action ----------
    el('rest-cta-overlay', 'shape', S.cta, { x: 0, y: 0, width: 1280, height: 300 }, '', { backgroundColor: 'rgba(20,14,10,0.7)' }),
    heading('rest-cta-heading', S.cta, { x: 0, y: 80, width: 1280, height: 56 }, 'جائع؟ اطلب الآن', 38, '#FFFFFF', 'center'),
    paragraph('rest-cta-text', S.cta, { x: 0, y: 140, width: 1280, height: 32 }, 'طلبك يصل ساخنًا، أو استلمه جاهزًا من المطعم.', 17, 'rgba(255,255,255,0.8)', 'center'),
    button('rest-cta-btn', S.cta, { x: 530, y: 196, width: 220, height: 54 }, 'اطلب من المنيو', true, pageLink(REST_PAGE_IDS.menu)),

    // ---------- Menu ----------
    el('rest-menuhead-overlay', 'shape', S.menuHead, { x: 0, y: 0, width: 1280, height: 280 }, '', { backgroundColor: 'rgba(20,14,10,0.62)' }),
    heading('rest-menuhead-heading', S.menuHead, { x: 0, y: 84, width: 1280, height: 64 }, 'المنيو', 48, '#FFFFFF', 'center'),
    paragraph('rest-menuhead-text', S.menuHead, { x: 0, y: 154, width: 1280, height: 32 }, 'اضغط على أي طبق لتعدّله على ذوقك وتضيفه إلى طلبك', 16, 'rgba(255,255,255,0.82)', 'center'),
    menuList('rest-menu-live', S.menuAll, { x: 60, y: 60, width: 1160, height: 1380 }, { menuLayout: 'list' }),

    // ---------- Cart ----------
    heading('rest-cart-heading', S.cart, { x: 0, y: 40, width: 1280, height: 56 }, 'طلبك', 38, C.ink, 'center'),
    menuCart('rest-cart-live', S.cart, { x: 90, y: 120, width: 1100, height: 600 }),

    // ---------- Contact ----------
    heading('rest-contact-heading', S.contact, { x: 700, y: 60, width: 440, height: 56 }, 'تواصل معنا', 36),
    paragraph('rest-contact-sub', S.contact, { x: 700, y: 120, width: 440, height: 56 }, 'لحجز طاولة أو طلب مناسبة أو لأي سؤال، نحن بانتظارك.', 16),
    el('rest-contact-card', 'shape', S.contact, { x: 700, y: 200, width: 440, height: 300 }, '', { backgroundColor: C.card, borderColor: C.line, borderWidth: 1, borderRadius: 28 }),
    ...contactRows.flatMap((row, i) => {
      const y = 236 + i * 62;
      return [
        el(`rest-contact-${i + 1}-icon`, 'icon', S.contact, { x: 1072, y, width: 32, height: 32 }, row.icon, { color: C.accent }),
        el(`rest-contact-${i + 1}-text`, 'paragraph', S.contact, { x: 736, y, width: 320, height: 32 }, row.text, { fontSize: 16, color: C.body, fontFamily: REST_BODY_FONT, textAlign: 'right' }, row.link),
      ];
    }),
    el('rest-contact-map', 'map', S.contact, { x: 140, y: 60, width: 500, height: 440 }, 'دمشق، سوريا', { borderRadius: 24 }, { mapLocation: 'دمشق، سوريا' }),
  ];

  return withTemplateGroups(pages, elements);
}

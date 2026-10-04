// Car showroom template (Weelink / Cars): a 4-page site (الرئيسية، المعرض، من نحن، تواصل معنا)
// sharing one navbar. Everything is made of regular elements the owner edits freely; the cars
// themselves come live from the admin window through 'carListings' elements, and 'carSearch' bars
// search them. More pages are added like in any project.
import type { Page, CanvasElement, NavbarConfig, ElementStyles } from '../types';
import { withTemplateGroups } from '../utils/templateGroups';

export const CAR_PAGE_IDS = { home: 'car-page-home', showroom: 'car-page-showroom', about: 'car-page-about', contact: 'car-page-contact' };

const WHATSAPP_NUMBER = '963991234567';

const C = {
  ink: '#121316',
  body: '#4A4D55',
  muted: '#8A8D96',
  accent: '#C8102E',
  light: '#F4F4F5',
  card: '#FFFFFF',
  line: 'rgba(18,19,22,0.08)',
};
export const CAR_HEADING_FONT = 'Alexandria';
export const CAR_BODY_FONT = 'Cairo';

export const carPhoto = (id: string, w = 1800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
export const CAR_PHOTOS = {
  hero: '1503376780353-7e6692767b70',
  dark: '1617814076367-b759c7d7e738',
  road: '1563720223185-11003d516935',
  showroom: '1555215695-3004980ad54e',
};

type Box = { x: number; y: number; width: number; height: number };

function el(id: string, type: CanvasElement['type'], slideId: string, box: Box, content: string, styles: ElementStyles, extra: Partial<CanvasElement> = {}): CanvasElement {
  return { id, name: type, type, ...box, content, slideId, styles, ...extra };
}

const heading = (id: string, slideId: string, box: Box, text: string, size: number, color = C.ink, align: 'right' | 'center' = 'right') =>
  el(id, 'heading', slideId, box, text, { fontSize: size, fontWeight: 'bold', color, fontFamily: CAR_HEADING_FONT, textAlign: align });

const paragraph = (id: string, slideId: string, box: Box, text: string, size = 16, color = C.body, align: 'right' | 'center' = 'right') =>
  el(id, 'paragraph', slideId, box, text, { fontSize: size, color, fontFamily: CAR_BODY_FONT, textAlign: align });

const pageLink = (target: string) => ({ linkType: 'page' as const, linkTargetId: target, linkUrl: `#page-${target}` });
const whatsapp = { linkType: 'contact' as const, contactType: 'whatsapp' as const, contactValue: WHATSAPP_NUMBER, linkUrl: `https://wa.me/${WHATSAPP_NUMBER}` };

const button = (id: string, slideId: string, box: Box, text: string, solid: boolean, link: Partial<CanvasElement>, dark = false) =>
  el(id, 'button', slideId, box, text, solid
    ? { backgroundColor: C.accent, color: '#FFFFFF', fontSize: 16, fontWeight: '600', borderRadius: 9999, textAlign: 'center', fontFamily: CAR_BODY_FONT, glowIntensity: 24, glowColor: 'rgba(200,16,46,0.5)', glowPosition: 'bottom' }
    : { backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'transparent', color: dark ? '#FFFFFF' : C.ink, borderColor: dark ? 'rgba(255,255,255,0.5)' : C.ink, borderWidth: 1, fontSize: 16, fontWeight: '600', borderRadius: 9999, textAlign: 'center', fontFamily: CAR_BODY_FONT },
  link);

export const carListings = (id: string, slideId: string, box: Box, extra: Partial<CanvasElement> = {}): CanvasElement =>
  el(id, 'carListings', slideId, box, '', { color: C.accent }, { name: 'سيارات المعرض', carLayout: 'grid', carLimit: 9, ...extra });

export const carSearch = (id: string, slideId: string, box: Box, look: 'minimal' | 'pill' | 'glass' = 'pill'): CanvasElement =>
  el(id, 'carSearch', slideId, box, 'ابحث بالماركة أو الموديل أو السنة...', { color: C.accent }, { name: 'بحث عن سيارة', shopSearchStyle: look });

function buildNavbar(): NavbarConfig {
  const link = (id: string, label: string, target: string) => ({ id, label, href: '#', linkType: 'page' as const, linkTargetId: target });
  return {
    brandName: 'اسم معرضك',
    brandSubtext: '',
    items: [
      link('nav-car-home', 'الرئيسية', CAR_PAGE_IDS.home),
      link('nav-car-showroom', 'المعرض', CAR_PAGE_IDS.showroom),
      link('nav-car-about', 'من نحن', CAR_PAGE_IDS.about),
      link('nav-car-contact', 'تواصل معنا', CAR_PAGE_IDS.contact),
    ],
    ctaText: 'تصفح السيارات',
    ctaHref: '#',
    ctaLinkType: 'page',
    ctaLinkTargetId: CAR_PAGE_IDS.showroom,
    bgColor: '#FFFFFF',
    textColor: C.ink,
    isSticky: true,
  };
}

export function getCarShowroomTemplate(): { pages: Page[]; elements: CanvasElement[] } {
  const S = {
    hero: 'car-home-hero',
    search: 'car-home-search',
    featured: 'car-home-featured',
    perks: 'car-home-perks',
    cta: 'car-home-cta',
    showHead: 'car-showroom-head',
    showAll: 'car-showroom-all',
    aboutStory: 'car-about-story',
    aboutStats: 'car-about-stats',
    contact: 'car-contact-slide',
  };
  const slide = (id: string, name: string, height: number, backgroundColor: string, image?: string) => ({
    id, name, height, backgroundColor, dividerShape: 'straight' as const,
    ...(image ? { backgroundImage: carPhoto(image), backgroundSize: 'cover' as const, backgroundPosition: 'center' } : {}),
  });

  const pages: Page[] = [
    {
      id: CAR_PAGE_IDS.home, name: 'الرئيسية', slug: '/', navbar: buildNavbar(),
      slides: [
        slide(S.hero, 'الواجهة', 640, C.ink, CAR_PHOTOS.hero),
        slide(S.search, 'ابحث عن سيارة', 150, C.ink),
        slide(S.featured, 'سيارات مميزة', 700, C.light),
        slide(S.perks, 'لماذا نحن', 360, '#FFFFFF'),
        slide(S.cta, 'تواصل', 300, C.ink, CAR_PHOTOS.road),
      ],
    },
    {
      id: CAR_PAGE_IDS.showroom, name: 'المعرض', slug: '/showroom', navbar: buildNavbar(),
      slides: [
        slide(S.showHead, 'رأس المعرض', 300, C.ink, CAR_PHOTOS.dark),
        slide(S.showAll, 'كل السيارات', 1400, C.light),
      ],
    },
    {
      id: CAR_PAGE_IDS.about, name: 'من نحن', slug: '/about', navbar: buildNavbar(),
      slides: [
        slide(S.aboutStory, 'قصتنا', 620, '#FFFFFF'),
        slide(S.aboutStats, 'أرقامنا', 300, C.ink),
      ],
    },
    {
      id: CAR_PAGE_IDS.contact, name: 'تواصل معنا', slug: '/contact', navbar: buildNavbar(),
      slides: [slide(S.contact, 'تواصل معنا', 580, C.light)],
    },
  ];

  const perks = [
    { icon: 'iconify:mdi:shield-check-outline', title: 'سيارات مفحوصة', text: 'كل سيارة تُفحص قبل عرضها، وتعرف حالتها كاملة.' },
    { icon: 'iconify:mdi:tag-outline', title: 'أسعار واضحة', text: 'السعر مكتوب على كل سيارة، بلا مفاجآت.' },
    { icon: 'iconify:mdi:swap-horizontal', title: 'بدّل سيارتك', text: 'نقيّم سيارتك ونقبلها جزءًا من الثمن.' },
    { icon: 'iconify:mdi:handshake-outline', title: 'خدمة بعد البيع', text: 'نساعدك في نقل الملكية وكل الأوراق.' },
  ];
  const stats = [
    { n: '+15', t: 'سنة خبرة' },
    { n: '+2000', t: 'سيارة بيعت' },
    { n: '+1800', t: 'زبون راضٍ' },
  ];
  const contactRows = [
    { icon: 'iconify:mdi:whatsapp', text: '+963 991 234 567', link: whatsapp },
    { icon: 'iconify:mdi:phone', text: '+963 991 234 567', link: { linkType: 'contact' as const, contactType: 'phone' as const, contactValue: '+963 991 234 567', linkUrl: `tel:+${WHATSAPP_NUMBER}` } },
    { icon: 'iconify:mdi:map-marker-outline', text: 'دمشق، أوتوستراد المزة', link: {} },
    { icon: 'iconify:mdi:clock-outline', text: 'يوميًا من 9 صباحًا حتى 9 مساءً', link: {} },
  ];

  const elements: CanvasElement[] = [
    // ---------- Home: hero ----------
    el('car-hero-overlay', 'shape', S.hero, { x: 0, y: 0, width: 1280, height: 640 }, '', { backgroundColor: 'rgba(10,10,12,0.55)' }),
    el('car-hero-badge', 'badge', S.hero, { x: 980, y: 170, width: 160, height: 34 }, 'وصلت سيارات جديدة', { backgroundColor: C.accent, color: '#FFFFFF', fontSize: 14, fontWeight: '600', borderRadius: 9999, fontFamily: CAR_BODY_FONT }),
    el('car-hero-heading', 'heading', S.hero, { x: 500, y: 220, width: 640, height: 140 }, 'سيارتك القادمة بانتظارك', {
      fontSize: 56, fontWeight: 'bold', color: '#FFFFFF', fontFamily: CAR_HEADING_FONT, textAlign: 'right', animation: 'slide-up', animationTrigger: 'once', animationDuration: 1.1,
    }),
    paragraph('car-hero-text', S.hero, { x: 600, y: 370, width: 540, height: 64 }, 'سيارات مختارة ومفحوصة بأسعار واضحة. تصفّح المعرض واطلب معاينة أو تجربة قيادة.', 18, 'rgba(255,255,255,0.85)'),
    button('car-hero-cta', S.hero, { x: 940, y: 460, width: 200, height: 56 }, 'تصفح المعرض', true, pageLink(CAR_PAGE_IDS.showroom)),
    button('car-hero-cta-2', S.hero, { x: 720, y: 460, width: 200, height: 56 }, 'راسلنا واتساب', false, whatsapp, true),

    // ---------- Home: search ----------
    carSearch('car-home-search-bar', S.search, { x: 240, y: 43, width: 800, height: 64 }),

    // ---------- Home: featured ----------
    heading('car-featured-heading', S.featured, { x: 0, y: 56, width: 1280, height: 56 }, 'سيارات مميزة', 36, C.ink, 'center'),
    paragraph('car-featured-sub', S.featured, { x: 0, y: 114, width: 1280, height: 32 }, 'اخترناها لك من أفضل ما في المعرض', 16, C.muted, 'center'),
    carListings('car-featured-live', S.featured, { x: 90, y: 170, width: 1100, height: 440 }, { carSource: 'featured', carLimit: 3 }),
    button('car-featured-more', S.featured, { x: 530, y: 628, width: 220, height: 50 }, 'كل السيارات', false, pageLink(CAR_PAGE_IDS.showroom)),

    // ---------- Home: why us ----------
    heading('car-perks-heading', S.perks, { x: 0, y: 44, width: 1280, height: 50 }, 'لماذا تشتري منّا؟', 32, C.ink, 'center'),
    ...perks.flatMap((p, i) => {
      const x = 90 + (3 - i) * 280; // four columns, right to left
      return [
        el(`car-perk-${i + 1}-card`, 'shape', S.perks, { x, y: 120, width: 260, height: 200 }, '', { backgroundColor: C.light, borderRadius: 24 }),
        el(`car-perk-${i + 1}-icon`, 'icon', S.perks, { x: x + 196, y: 144, width: 40, height: 40 }, p.icon, { color: C.accent }),
        heading(`car-perk-${i + 1}-title`, S.perks, { x: x + 20, y: 196, width: 220, height: 32 }, p.title, 20),
        paragraph(`car-perk-${i + 1}-text`, S.perks, { x: x + 20, y: 234, width: 220, height: 66 }, p.text, 14),
      ];
    }),

    // ---------- Home: call to action ----------
    el('car-cta-overlay', 'shape', S.cta, { x: 0, y: 0, width: 1280, height: 300 }, '', { backgroundColor: 'rgba(10,10,12,0.7)' }),
    heading('car-cta-heading', S.cta, { x: 0, y: 80, width: 1280, height: 56 }, 'لم تجد السيارة التي تريدها؟', 36, '#FFFFFF', 'center'),
    paragraph('car-cta-text', S.cta, { x: 0, y: 140, width: 1280, height: 32 }, 'أخبرنا بما تبحث عنه ونجده لك.', 17, 'rgba(255,255,255,0.8)', 'center'),
    button('car-cta-btn', S.cta, { x: 530, y: 196, width: 220, height: 54 }, 'تواصل معنا', true, pageLink(CAR_PAGE_IDS.contact)),

    // ---------- Showroom ----------
    el('car-showhead-overlay', 'shape', S.showHead, { x: 0, y: 0, width: 1280, height: 300 }, '', { backgroundColor: 'rgba(10,10,12,0.65)' }),
    heading('car-showhead-heading', S.showHead, { x: 0, y: 60, width: 1280, height: 60 }, 'المعرض', 44, '#FFFFFF', 'center'),
    paragraph('car-showhead-text', S.showHead, { x: 0, y: 124, width: 1280, height: 32 }, 'كل السيارات المتاحة الآن، اضغط على أي سيارة لرؤية تفاصيلها وصورها', 16, 'rgba(255,255,255,0.8)', 'center'),
    carSearch('car-showhead-search', S.showHead, { x: 290, y: 190, width: 700, height: 60 }, 'glass'),
    carListings('car-showroom-live', S.showAll, { x: 60, y: 60, width: 1160, height: 1280 }, { carFilters: true, carLimit: 12 }),

    // ---------- About ----------
    el('car-about-photo', 'image', S.aboutStory, { x: 90, y: 70, width: 520, height: 480 }, '', { borderRadius: 28, objectFit: 'cover' }, { imageUrl: carPhoto(CAR_PHOTOS.showroom, 1200) }),
    el('car-about-badge', 'badge', S.aboutStory, { x: 1000, y: 110, width: 140, height: 34 }, 'من نحن', { backgroundColor: C.accent, color: '#FFFFFF', fontSize: 14, fontWeight: '600', borderRadius: 9999, fontFamily: CAR_BODY_FONT }),
    heading('car-about-heading', S.aboutStory, { x: 680, y: 160, width: 460, height: 110 }, 'خبرة طويلة في بيع وشراء السيارات', 36),
    paragraph('car-about-text', S.aboutStory, { x: 680, y: 290, width: 460, height: 150 }, 'بدأنا معرضنا بهدف بسيط: أن يشتري الزبون سيارته وهو مطمئن. نختار كل سيارة بعناية، نفحصها، ونعرض حالتها وسعرها بوضوح. اليوم نخدم زبائننا في كل المحافظات.', 16),
    button('car-about-cta', S.aboutStory, { x: 940, y: 470, width: 200, height: 52 }, 'زرنا في المعرض', true, pageLink(CAR_PAGE_IDS.contact)),
    ...stats.flatMap((s, i) => {
      const x = 140 + (2 - i) * 340;
      return [
        heading(`car-stat-${i + 1}-n`, S.aboutStats, { x, y: 90, width: 320, height: 70 }, s.n, 52, '#FFFFFF', 'center'),
        paragraph(`car-stat-${i + 1}-t`, S.aboutStats, { x, y: 168, width: 320, height: 32 }, s.t, 17, 'rgba(255,255,255,0.7)', 'center'),
      ];
    }),

    // ---------- Contact ----------
    heading('car-contact-heading', S.contact, { x: 700, y: 60, width: 440, height: 56 }, 'تواصل معنا', 36),
    paragraph('car-contact-sub', S.contact, { x: 700, y: 120, width: 440, height: 56 }, 'لحجز معاينة أو تجربة قيادة أو لأي سؤال عن سيارة، نحن بانتظارك.', 16),
    el('car-contact-card', 'shape', S.contact, { x: 700, y: 200, width: 440, height: 300 }, '', { backgroundColor: C.card, borderColor: C.line, borderWidth: 1, borderRadius: 28 }),
    ...contactRows.flatMap((row, i) => {
      const y = 236 + i * 62;
      return [
        el(`car-contact-${i + 1}-icon`, 'icon', S.contact, { x: 1072, y, width: 32, height: 32 }, row.icon, { color: C.accent }),
        el(`car-contact-${i + 1}-text`, 'paragraph', S.contact, { x: 736, y, width: 320, height: 32 }, row.text, { fontSize: 16, color: C.body, fontFamily: CAR_BODY_FONT, textAlign: 'right' }, row.link),
      ];
    }),
    el('car-contact-map', 'map', S.contact, { x: 140, y: 60, width: 500, height: 440 }, 'دمشق، سوريا', { borderRadius: 24 }, { mapLocation: 'دمشق، سوريا' }),
  ];

  return withTemplateGroups(pages, elements);
}

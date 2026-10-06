// Investments & projects template (Weelink / Invest): a 4-page site (الرئيسية، المشاريع، من نحن،
// تواصل معنا) sharing one navbar. Everything is made of regular elements the owner edits freely; the
// projects themselves come live from the admin window through 'investProjects' elements. More pages
// are added like in any project.
import type { Page, CanvasElement, NavbarConfig, ElementStyles } from '../types';
import { withTemplateGroups } from '../utils/templateGroups';

export const INVEST_PAGE_IDS = { home: 'inv-page-home', projects: 'inv-page-projects', about: 'inv-page-about', contact: 'inv-page-contact' };

const WHATSAPP_NUMBER = '963991234567';

const C = {
  ink: '#0E1A16',
  body: '#46524D',
  muted: '#86918C',
  accent: '#0F6B4F',
  gold: '#C9A227',
  light: '#F3F6F4',
  card: '#FFFFFF',
  line: 'rgba(14,26,22,0.08)',
};
const HEADING_FONT = 'Alexandria';
const BODY_FONT = 'Cairo';

const photo = (id: string, w = 1800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
const PHOTOS = {
  hero: '1486406146926-c627a92ad1ab',
  about: '1551288049-bebda4e38f71',
};

type Box = { x: number; y: number; width: number; height: number };

function el(id: string, type: CanvasElement['type'], slideId: string, box: Box, content: string, styles: ElementStyles, extra: Partial<CanvasElement> = {}): CanvasElement {
  return { id, name: type, type, ...box, content, slideId, styles, ...extra };
}

const heading = (id: string, slideId: string, box: Box, text: string, size: number, color = C.ink, align: 'right' | 'center' = 'right') =>
  el(id, 'heading', slideId, box, text, { fontSize: size, fontWeight: 'bold', color, fontFamily: HEADING_FONT, textAlign: align });

const paragraph = (id: string, slideId: string, box: Box, text: string, size = 16, color = C.body, align: 'right' | 'center' = 'right') =>
  el(id, 'paragraph', slideId, box, text, { fontSize: size, color, fontFamily: BODY_FONT, textAlign: align });

const pageLink = (target: string) => ({ linkType: 'page' as const, linkTargetId: target, linkUrl: `#page-${target}` });
const whatsapp = { linkType: 'contact' as const, contactType: 'whatsapp' as const, contactValue: WHATSAPP_NUMBER, linkUrl: `https://wa.me/${WHATSAPP_NUMBER}` };

const button = (id: string, slideId: string, box: Box, text: string, solid: boolean, link: Partial<CanvasElement>, dark = false) =>
  el(id, 'button', slideId, box, text, solid
    ? { backgroundColor: C.accent, color: '#FFFFFF', fontSize: 16, fontWeight: '600', borderRadius: 9999, textAlign: 'center', fontFamily: BODY_FONT, glowIntensity: 24, glowColor: 'rgba(15,107,79,0.45)', glowPosition: 'bottom' }
    : { backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'transparent', color: dark ? '#FFFFFF' : C.ink, borderColor: dark ? 'rgba(255,255,255,0.5)' : C.ink, borderWidth: 1, fontSize: 16, fontWeight: '600', borderRadius: 9999, textAlign: 'center', fontFamily: BODY_FONT },
  link);

export const investProjects = (id: string, slideId: string, box: Box, extra: Partial<CanvasElement> = {}): CanvasElement =>
  el(id, 'investProjects', slideId, box, '', { color: C.accent }, { name: 'مشاريع الشركة', investLayout: 'grid', investLimit: 9, ...extra });

function buildNavbar(): NavbarConfig {
  const link = (id: string, label: string, target: string) => ({ id, label, href: '#', linkType: 'page' as const, linkTargetId: target });
  return {
    brandName: 'اسم شركتك',
    brandSubtext: '',
    items: [
      link('nav-inv-home', 'الرئيسية', INVEST_PAGE_IDS.home),
      link('nav-inv-projects', 'المشاريع', INVEST_PAGE_IDS.projects),
      link('nav-inv-about', 'من نحن', INVEST_PAGE_IDS.about),
      link('nav-inv-contact', 'تواصل معنا', INVEST_PAGE_IDS.contact),
    ],
    ctaText: 'فرص الاستثمار',
    ctaHref: '#',
    ctaLinkType: 'page',
    ctaLinkTargetId: INVEST_PAGE_IDS.projects,
    bgColor: '#FFFFFF',
    textColor: C.ink,
    isSticky: true,
  };
}

export function getInvestTemplate(): { pages: Page[]; elements: CanvasElement[] } {
  const S = {
    hero: 'inv-home-hero',
    stats: 'inv-home-stats',
    featured: 'inv-home-featured',
    steps: 'inv-home-steps',
    cta: 'inv-home-cta',
    projHead: 'inv-projects-head',
    projAll: 'inv-projects-all',
    aboutStory: 'inv-about-story',
    aboutValues: 'inv-about-values',
    contact: 'inv-contact-slide',
  };
  const slide = (id: string, name: string, height: number, backgroundColor: string, image?: string) => ({
    id, name, height, backgroundColor, dividerShape: 'straight' as const,
    ...(image ? { backgroundImage: photo(image), backgroundSize: 'cover' as const, backgroundPosition: 'center' } : {}),
  });

  const pages: Page[] = [
    {
      id: INVEST_PAGE_IDS.home, name: 'الرئيسية', slug: '/', navbar: buildNavbar(),
      slides: [
        slide(S.hero, 'الواجهة', 640, C.ink, PHOTOS.hero),
        slide(S.stats, 'أرقامنا', 200, C.accent),
        slide(S.featured, 'مشاريع مميزة', 760, C.light),
        slide(S.steps, 'كيف تستثمر معنا', 380, '#FFFFFF'),
        slide(S.cta, 'تواصل', 300, C.ink),
      ],
    },
    {
      id: INVEST_PAGE_IDS.projects, name: 'المشاريع', slug: '/projects', navbar: buildNavbar(),
      slides: [
        slide(S.projHead, 'رأس المشاريع', 280, C.ink, PHOTOS.hero),
        slide(S.projAll, 'كل المشاريع', 1400, C.light),
      ],
    },
    {
      id: INVEST_PAGE_IDS.about, name: 'من نحن', slug: '/about', navbar: buildNavbar(),
      slides: [
        slide(S.aboutStory, 'قصتنا', 620, '#FFFFFF'),
        slide(S.aboutValues, 'ما نلتزم به', 380, C.light),
      ],
    },
    {
      id: INVEST_PAGE_IDS.contact, name: 'تواصل معنا', slug: '/contact', navbar: buildNavbar(),
      slides: [slide(S.contact, 'تواصل معنا', 580, '#FFFFFF')],
    },
  ];

  const stats = [
    { n: '+25', t: 'مشروعًا منجزًا' },
    { n: '+12M$', t: 'رأس مال مُدار' },
    { n: '+900', t: 'مستثمر يثق بنا' },
  ];
  const steps = [
    { icon: 'iconify:mdi:magnify', title: 'اختر المشروع', text: 'تصفّح الفرص المفتوحة واقرأ تفاصيل كل مشروع وأرقامه.' },
    { icon: 'iconify:mdi:send-outline', title: 'أرسل طلبك', text: 'اضغط «أرغب بالاستثمار» واكتب المبلغ، ونتواصل معك.' },
    { icon: 'iconify:mdi:file-sign', title: 'وقّع العقد', text: 'عقد واضح يحدد حصتك ومدتك وطريقة توزيع الأرباح.' },
    { icon: 'iconify:mdi:chart-line', title: 'تابع أرباحك', text: 'تقارير دورية عن سير المشروع، وأرباح في مواعيدها.' },
  ];
  const values = [
    { icon: 'iconify:mdi:shield-check-outline', title: 'شفافية كاملة', text: 'كل رقم في المشروع مكتوب ومشروح قبل أن تستثمر.' },
    { icon: 'iconify:mdi:file-document-outline', title: 'عقود موثّقة', text: 'لكل مستثمر عقد مستقل يحفظ حقه.' },
    { icon: 'iconify:mdi:account-tie-outline', title: 'إدارة محترفة', text: 'فريق بخبرة طويلة في كل قطاع نعمل فيه.' },
  ];
  const contactRows = [
    { icon: 'iconify:mdi:whatsapp', text: '+963 991 234 567', link: whatsapp },
    { icon: 'iconify:mdi:phone', text: '+963 991 234 567', link: { linkType: 'contact' as const, contactType: 'phone' as const, contactValue: '+963 991 234 567', linkUrl: `tel:+${WHATSAPP_NUMBER}` } },
    { icon: 'iconify:mdi:map-marker-outline', text: 'دمشق، أبو رمانة', link: {} },
    { icon: 'iconify:mdi:clock-outline', text: 'من الأحد إلى الخميس، 9 صباحًا حتى 5 مساءً', link: {} },
  ];

  const elements: CanvasElement[] = [
    // ---------- Home: hero ----------
    el('inv-hero-overlay', 'shape', S.hero, { x: 0, y: 0, width: 1280, height: 640 }, '', { backgroundColor: 'rgba(8,20,16,0.68)' }),
    el('inv-hero-badge', 'badge', S.hero, { x: 960, y: 170, width: 180, height: 34 }, 'فرص استثمار مفتوحة الآن', { backgroundColor: C.gold, color: C.ink, fontSize: 14, fontWeight: '600', borderRadius: 9999, fontFamily: BODY_FONT }),
    el('inv-hero-heading', 'heading', S.hero, { x: 440, y: 220, width: 700, height: 140 }, 'استثمر في مشاريع حقيقية تبني المستقبل', {
      fontSize: 52, fontWeight: 'bold', color: '#FFFFFF', fontFamily: HEADING_FONT, textAlign: 'right', animation: 'slide-up', animationTrigger: 'once', animationDuration: 1.1,
    }),
    paragraph('inv-hero-text', S.hero, { x: 580, y: 370, width: 560, height: 64 }, 'مشاريع مدروسة في العقارات والزراعة والطاقة والتجارة، بأرقام واضحة وعقود موثّقة وتقارير دورية.', 18, 'rgba(255,255,255,0.85)'),
    button('inv-hero-cta', S.hero, { x: 940, y: 460, width: 200, height: 56 }, 'تصفح المشاريع', true, pageLink(INVEST_PAGE_IDS.projects)),
    button('inv-hero-cta-2', S.hero, { x: 720, y: 460, width: 200, height: 56 }, 'راسلنا واتساب', false, whatsapp, true),

    // ---------- Home: stats ----------
    ...stats.flatMap((s, i) => {
      const x = 140 + (2 - i) * 340;
      return [
        heading(`inv-stat-${i + 1}-n`, S.stats, { x, y: 50, width: 320, height: 64 }, s.n, 46, '#FFFFFF', 'center'),
        paragraph(`inv-stat-${i + 1}-t`, S.stats, { x, y: 118, width: 320, height: 32 }, s.t, 17, 'rgba(255,255,255,0.75)', 'center'),
      ];
    }),

    // ---------- Home: featured ----------
    heading('inv-featured-heading', S.featured, { x: 0, y: 56, width: 1280, height: 56 }, 'مشاريع مميزة', 36, C.ink, 'center'),
    paragraph('inv-featured-sub', S.featured, { x: 0, y: 114, width: 1280, height: 32 }, 'فرص اخترناها لك، اضغط على أي مشروع لرؤية تفاصيله', 16, C.muted, 'center'),
    investProjects('inv-featured-live', S.featured, { x: 90, y: 170, width: 1100, height: 500 }, { investSource: 'featured', investLimit: 3 }),
    button('inv-featured-more', S.featured, { x: 530, y: 688, width: 220, height: 50 }, 'كل المشاريع', false, pageLink(INVEST_PAGE_IDS.projects)),

    // ---------- Home: how it works ----------
    heading('inv-steps-heading', S.steps, { x: 0, y: 44, width: 1280, height: 50 }, 'كيف تستثمر معنا؟', 32, C.ink, 'center'),
    ...steps.flatMap((p, i) => {
      const x = 90 + (3 - i) * 280; // four columns, right to left
      return [
        el(`inv-step-${i + 1}-card`, 'shape', S.steps, { x, y: 120, width: 260, height: 220 }, '', { backgroundColor: C.light, borderRadius: 24 }),
        el(`inv-step-${i + 1}-icon`, 'icon', S.steps, { x: x + 196, y: 144, width: 40, height: 40 }, p.icon, { color: C.accent }),
        heading(`inv-step-${i + 1}-title`, S.steps, { x: x + 20, y: 200, width: 220, height: 32 }, `${i + 1}. ${p.title}`, 20),
        paragraph(`inv-step-${i + 1}-text`, S.steps, { x: x + 20, y: 238, width: 220, height: 80 }, p.text, 14),
      ];
    }),

    // ---------- Home: call to action ----------
    heading('inv-cta-heading', S.cta, { x: 0, y: 80, width: 1280, height: 56 }, 'عندك سؤال قبل أن تستثمر؟', 36, '#FFFFFF', 'center'),
    paragraph('inv-cta-text', S.cta, { x: 0, y: 140, width: 1280, height: 32 }, 'فريقنا يشرح لك كل مشروع بالتفصيل ويجيب عن أسئلتك.', 17, 'rgba(255,255,255,0.8)', 'center'),
    button('inv-cta-btn', S.cta, { x: 530, y: 196, width: 220, height: 54 }, 'تواصل معنا', true, pageLink(INVEST_PAGE_IDS.contact)),

    // ---------- Projects ----------
    el('inv-projhead-overlay', 'shape', S.projHead, { x: 0, y: 0, width: 1280, height: 280 }, '', { backgroundColor: 'rgba(8,20,16,0.72)' }),
    heading('inv-projhead-heading', S.projHead, { x: 0, y: 80, width: 1280, height: 60 }, 'المشاريع وفرص الاستثمار', 44, '#FFFFFF', 'center'),
    paragraph('inv-projhead-text', S.projHead, { x: 0, y: 146, width: 1280, height: 32 }, 'المفتوحة للاستثمار أولًا، ثم المموّلة وقيد التنفيذ والمنجزة', 16, 'rgba(255,255,255,0.8)', 'center'),
    investProjects('inv-projects-live', S.projAll, { x: 60, y: 60, width: 1160, height: 1280 }, { investFilters: true, investLimit: 12 }),

    // ---------- About ----------
    el('inv-about-photo', 'image', S.aboutStory, { x: 90, y: 70, width: 520, height: 480 }, '', { borderRadius: 28, objectFit: 'cover' }, { imageUrl: photo(PHOTOS.about, 1200) }),
    el('inv-about-badge', 'badge', S.aboutStory, { x: 1000, y: 110, width: 140, height: 34 }, 'من نحن', { backgroundColor: C.accent, color: '#FFFFFF', fontSize: 14, fontWeight: '600', borderRadius: 9999, fontFamily: BODY_FONT }),
    heading('inv-about-heading', S.aboutStory, { x: 680, y: 160, width: 460, height: 110 }, 'نحوّل الأفكار الجيدة إلى مشاريع رابحة', 36),
    paragraph('inv-about-text', S.aboutStory, { x: 680, y: 290, width: 460, height: 150 }, 'نختار المشاريع بعناية وندرسها قبل أن نعرضها، ونجمع لها المستثمرين وندير تنفيذها حتى توزيع الأرباح. هدفنا أن يعرف كل مستثمر أين وُضع ماله وكيف يعمل.', 16),
    button('inv-about-cta', S.aboutStory, { x: 940, y: 470, width: 200, height: 52 }, 'تعرّف على مشاريعنا', true, pageLink(INVEST_PAGE_IDS.projects)),
    heading('inv-values-heading', S.aboutValues, { x: 0, y: 44, width: 1280, height: 50 }, 'ما نلتزم به', 32, C.ink, 'center'),
    ...values.flatMap((v, i) => {
      const x = 130 + (2 - i) * 350;
      return [
        el(`inv-value-${i + 1}-card`, 'shape', S.aboutValues, { x, y: 120, width: 320, height: 200 }, '', { backgroundColor: C.card, borderRadius: 24 }),
        el(`inv-value-${i + 1}-icon`, 'icon', S.aboutValues, { x: x + 256, y: 144, width: 40, height: 40 }, v.icon, { color: C.accent }),
        heading(`inv-value-${i + 1}-title`, S.aboutValues, { x: x + 24, y: 200, width: 272, height: 32 }, v.title, 20),
        paragraph(`inv-value-${i + 1}-text`, S.aboutValues, { x: x + 24, y: 238, width: 272, height: 60 }, v.text, 14),
      ];
    }),

    // ---------- Contact ----------
    heading('inv-contact-heading', S.contact, { x: 700, y: 60, width: 440, height: 56 }, 'تواصل معنا', 36),
    paragraph('inv-contact-sub', S.contact, { x: 700, y: 120, width: 440, height: 56 }, 'لأي سؤال عن مشروع أو لترتيب موعد في مكتبنا، نحن بانتظارك.', 16),
    el('inv-contact-card', 'shape', S.contact, { x: 700, y: 200, width: 440, height: 300 }, '', { backgroundColor: C.light, borderColor: C.line, borderWidth: 1, borderRadius: 28 }),
    ...contactRows.flatMap((row, i) => {
      const y = 236 + i * 62;
      return [
        el(`inv-contact-${i + 1}-icon`, 'icon', S.contact, { x: 1072, y, width: 32, height: 32 }, row.icon, { color: C.accent }),
        el(`inv-contact-${i + 1}-text`, 'paragraph', S.contact, { x: 736, y, width: 320, height: 32 }, row.text, { fontSize: 16, color: C.body, fontFamily: BODY_FONT, textAlign: 'right' }, row.link),
      ];
    }),
    el('inv-contact-map', 'map', S.contact, { x: 140, y: 60, width: 500, height: 440 }, 'دمشق، سوريا', { borderRadius: 24 }, { mapLocation: 'دمشق، سوريا' }),
  ];

  return withTemplateGroups(pages, elements);
}

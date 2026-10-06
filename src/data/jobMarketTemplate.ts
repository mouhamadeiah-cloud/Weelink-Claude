// Job market template (Weelink / Jobs): a 4-page site (الرئيسية، الوظائف، للشركات، تواصل معنا)
// sharing one navbar. Everything is made of regular elements the owner edits freely. The job cards
// are example elements for now; live job listings from an admin window come in a later step.
import type { Page, CanvasElement, NavbarConfig, ElementStyles } from '../types';
import { withTemplateGroups } from '../utils/templateGroups';

export const JOB_PAGE_IDS = { home: 'job-page-home', jobs: 'job-page-jobs', employers: 'job-page-employers', contact: 'job-page-contact' };

const WHATSAPP_NUMBER = '963991234567';

export const JOB_COLORS = {
  ink: '#14213D',
  body: '#4A5568',
  muted: '#8A94A6',
  accent: '#0F7B6C',
  soft: '#F2F7F6',
  card: '#FFFFFF',
  dark: '#0E1A2B',
  line: 'rgba(20,33,61,0.08)',
};
const C = JOB_COLORS;
export const JOB_HEADING_FONT = 'Cairo';
export const JOB_BODY_FONT = 'Cairo';

type Box = { x: number; y: number; width: number; height: number };

function el(id: string, type: CanvasElement['type'], slideId: string, box: Box, content: string, styles: ElementStyles, extra: Partial<CanvasElement> = {}): CanvasElement {
  return { id, name: type, type, ...box, content, slideId, styles, ...extra };
}

const heading = (id: string, slideId: string, box: Box, text: string, size: number, color = C.ink, align: 'right' | 'center' = 'right') =>
  el(id, 'heading', slideId, box, text, { fontSize: size, fontWeight: 'bold', color, fontFamily: JOB_HEADING_FONT, textAlign: align });

const paragraph = (id: string, slideId: string, box: Box, text: string, size = 16, color = C.body, align: 'right' | 'center' = 'right') =>
  el(id, 'paragraph', slideId, box, text, { fontSize: size, color, fontFamily: JOB_BODY_FONT, textAlign: align });

const pageLink = (target: string) => ({ linkType: 'page' as const, linkTargetId: target, linkUrl: `#page-${target}` });
const whatsapp = { linkType: 'contact' as const, contactType: 'whatsapp' as const, contactValue: WHATSAPP_NUMBER, linkUrl: `https://wa.me/${WHATSAPP_NUMBER}` };

const button = (id: string, slideId: string, box: Box, text: string, solid: boolean, link: Partial<CanvasElement>, dark = false) =>
  el(id, 'button', slideId, box, text, solid
    ? { backgroundColor: C.accent, color: '#FFFFFF', fontSize: 16, fontWeight: '600', borderRadius: 14, textAlign: 'center', fontFamily: JOB_BODY_FONT }
    : { backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'transparent', color: dark ? '#FFFFFF' : C.ink, borderColor: dark ? 'rgba(255,255,255,0.5)' : C.ink, borderWidth: 1, fontSize: 16, fontWeight: '600', borderRadius: 14, textAlign: 'center', fontFamily: JOB_BODY_FONT },
  link);

function buildNavbar(): NavbarConfig {
  const link = (id: string, label: string, target: string) => ({ id, label, href: '#', linkType: 'page' as const, linkTargetId: target });
  return {
    brandName: 'سوق العمل',
    brandSubtext: '',
    items: [
      link('nav-job-home', 'الرئيسية', JOB_PAGE_IDS.home),
      link('nav-job-jobs', 'الوظائف', JOB_PAGE_IDS.jobs),
      link('nav-job-employers', 'للشركات', JOB_PAGE_IDS.employers),
      link('nav-job-contact', 'تواصل معنا', JOB_PAGE_IDS.contact),
    ],
    ctaText: 'أضف وظيفة',
    ctaHref: '#',
    ctaLinkType: 'page',
    ctaLinkTargetId: JOB_PAGE_IDS.employers,
    bgColor: '#FFFFFF',
    textColor: C.ink,
    isSticky: true,
  };
}

// Example jobs shown as cards until live listings exist.
const EXAMPLE_JOBS = [
  { title: 'محاسب', company: 'شركة النور للتجارة', place: 'دمشق', kind: 'دوام كامل', salary: '1.500.000 ل.س' },
  { title: 'مطور مواقع', company: 'تقنيات الشام', place: 'عن بعد', kind: 'دوام كامل', salary: 'حسب الخبرة' },
  { title: 'مندوب مبيعات', company: 'مستودعات الفرات', place: 'حلب', kind: 'دوام كامل', salary: '1.200.000 ل.س + عمولة' },
  { title: 'سكرتيرة إدارية', company: 'عيادات الياسمين', place: 'حمص', kind: 'دوام جزئي', salary: '800.000 ل.س' },
  { title: 'سائق توصيل', company: 'مطعم البيت', place: 'دمشق', kind: 'دوام مسائي', salary: '900.000 ل.س' },
  { title: 'مصمم جرافيك', company: 'وكالة لمسة', place: 'اللاذقية', kind: 'عمل حر', salary: 'بالمشروع' },
];

const jobCards = (prefix: string, slideId: string, jobs: typeof EXAMPLE_JOBS, top: number) =>
  jobs.flatMap((j, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 90 + (2 - col) * 375;
    const y = top + row * 250;
    return [
      el(`${prefix}-${i + 1}-card`, 'shape', slideId, { x, y, width: 350, height: 225 }, '', { backgroundColor: C.card, borderColor: C.line, borderWidth: 1, borderRadius: 22 }),
      el(`${prefix}-${i + 1}-kind`, 'badge', slideId, { x: x + 216, y: y + 24, width: 110, height: 30 }, j.kind, { backgroundColor: C.soft, color: C.accent, fontSize: 13, fontWeight: '600', borderRadius: 9999, fontFamily: JOB_BODY_FONT }),
      heading(`${prefix}-${i + 1}-title`, slideId, { x: x + 24, y: y + 66, width: 302, height: 36 }, j.title, 22),
      paragraph(`${prefix}-${i + 1}-company`, slideId, { x: x + 24, y: y + 104, width: 302, height: 26 }, `${j.company} · ${j.place}`, 15, C.muted),
      paragraph(`${prefix}-${i + 1}-salary`, slideId, { x: x + 24, y: y + 136, width: 302, height: 26 }, j.salary, 15, C.ink),
      button(`${prefix}-${i + 1}-apply`, slideId, { x: x + 24, y: y + 170, width: 130, height: 38 }, 'قدّم الآن', true, whatsapp),
    ];
  });

export function getJobMarketTemplate(): { pages: Page[]; elements: CanvasElement[] } {
  const S = {
    hero: 'job-home-hero',
    cats: 'job-home-cats',
    latest: 'job-home-latest',
    how: 'job-home-how',
    jobsHead: 'job-jobs-head',
    jobsAll: 'job-jobs-all',
    employers: 'job-employers-slide',
    contact: 'job-contact-slide',
  };
  const slide = (id: string, name: string, height: number, backgroundColor: string) => ({
    id, name, height, backgroundColor, dividerShape: 'straight' as const,
  });

  const pages: Page[] = [
    {
      id: JOB_PAGE_IDS.home, name: 'الرئيسية', slug: '/', navbar: buildNavbar(),
      slides: [
        slide(S.hero, 'الواجهة', 600, C.dark),
        slide(S.cats, 'المجالات', 360, '#FFFFFF'),
        slide(S.latest, 'أحدث الوظائف', 720, C.soft),
        slide(S.how, 'كيف يعمل', 360, '#FFFFFF'),
      ],
    },
    {
      id: JOB_PAGE_IDS.jobs, name: 'الوظائف', slug: '/jobs', navbar: buildNavbar(),
      slides: [
        slide(S.jobsHead, 'رأس الوظائف', 260, C.dark),
        slide(S.jobsAll, 'كل الوظائف', 640, C.soft),
      ],
    },
    {
      id: JOB_PAGE_IDS.employers, name: 'للشركات', slug: '/employers', navbar: buildNavbar(),
      slides: [slide(S.employers, 'أضف وظيفة', 600, C.soft)],
    },
    {
      id: JOB_PAGE_IDS.contact, name: 'تواصل معنا', slug: '/contact', navbar: buildNavbar(),
      slides: [slide(S.contact, 'تواصل معنا', 520, C.soft)],
    },
  ];

  const cats = [
    { icon: 'iconify:mdi:calculator-variant-outline', title: 'محاسبة وإدارة' },
    { icon: 'iconify:mdi:laptop', title: 'تقنية وبرمجة' },
    { icon: 'iconify:mdi:storefront-outline', title: 'مبيعات وتسويق' },
    { icon: 'iconify:mdi:hammer-wrench', title: 'حرف وصيانة' },
    { icon: 'iconify:mdi:stethoscope', title: 'طب وتمريض' },
    { icon: 'iconify:mdi:school-outline', title: 'تعليم وتدريب' },
  ];
  const steps = [
    { icon: 'iconify:mdi:magnify', title: 'ابحث', text: 'تصفح الوظائف حسب المجال والمدينة.' },
    { icon: 'iconify:mdi:file-account-outline', title: 'قدّم', text: 'أرسل طلبك وسيرتك الذاتية بضغطة.' },
    { icon: 'iconify:mdi:handshake-outline', title: 'ابدأ العمل', text: 'صاحب العمل يتواصل معك مباشرة.' },
  ];
  const employerPerks = [
    'انشر وظيفتك خلال دقائق',
    'استقبل طلبات المتقدمين في مكان واحد',
    'تواصل مع المرشحين عبر واتساب',
  ];
  const contactRows = [
    { icon: 'iconify:mdi:whatsapp', text: '+963 991 234 567', link: whatsapp },
    { icon: 'iconify:mdi:email-outline', text: 'info@example.com', link: {} },
    { icon: 'iconify:mdi:map-marker-outline', text: 'دمشق، سوريا', link: {} },
  ];

  const elements: CanvasElement[] = [
    // ---------- Home: hero ----------
    el('job-hero-badge', 'badge', S.hero, { x: 960, y: 150, width: 180, height: 34 }, 'وظائف جديدة كل يوم', { backgroundColor: C.accent, color: '#FFFFFF', fontSize: 14, fontWeight: '600', borderRadius: 9999, fontFamily: JOB_BODY_FONT }),
    el('job-hero-heading', 'heading', S.hero, { x: 440, y: 200, width: 700, height: 140 }, 'وظيفتك القادمة تبدأ من هنا', {
      fontSize: 56, fontWeight: 'bold', color: '#FFFFFF', fontFamily: JOB_HEADING_FONT, textAlign: 'right', animation: 'slide-up', animationTrigger: 'once', animationDuration: 1.1,
    }),
    paragraph('job-hero-text', S.hero, { x: 540, y: 350, width: 600, height: 64 }, 'آلاف الفرص من شركات ومحلات في مدينتك. ابحث وقدّم مجانًا، أو انشر وظيفتك ووصل إلى المرشحين.', 18, 'rgba(255,255,255,0.82)'),
    button('job-hero-cta', S.hero, { x: 940, y: 440, width: 200, height: 56 }, 'ابحث عن وظيفة', true, pageLink(JOB_PAGE_IDS.jobs)),
    button('job-hero-cta-2', S.hero, { x: 720, y: 440, width: 200, height: 56 }, 'أضف وظيفة', false, pageLink(JOB_PAGE_IDS.employers), true),

    // ---------- Home: categories ----------
    heading('job-cats-heading', S.cats, { x: 0, y: 40, width: 1280, height: 50 }, 'تصفح حسب المجال', 32, C.ink, 'center'),
    ...cats.flatMap((c, i) => {
      const x = 90 + (5 - i) * 185;
      return [
        el(`job-cat-${i + 1}-card`, 'shape', S.cats, { x, y: 120, width: 170, height: 170 }, '', { backgroundColor: C.soft, borderRadius: 22 }),
        el(`job-cat-${i + 1}-icon`, 'icon', S.cats, { x: x + 61, y: 150, width: 48, height: 48 }, c.icon, { color: C.accent }),
        heading(`job-cat-${i + 1}-title`, S.cats, { x: x + 10, y: 218, width: 150, height: 32 }, c.title, 17, C.ink, 'center'),
      ];
    }),

    // ---------- Home: latest jobs ----------
    heading('job-latest-heading', S.latest, { x: 0, y: 50, width: 1280, height: 50 }, 'أحدث الوظائف', 34, C.ink, 'center'),
    ...jobCards('job-latest', S.latest, EXAMPLE_JOBS.slice(0, 3), 130),
    ...jobCards('job-latest-b', S.latest, EXAMPLE_JOBS.slice(3, 6), 380),
    button('job-latest-more', S.latest, { x: 530, y: 640, width: 220, height: 50 }, 'كل الوظائف', false, pageLink(JOB_PAGE_IDS.jobs)),

    // ---------- Home: how it works ----------
    heading('job-how-heading', S.how, { x: 0, y: 40, width: 1280, height: 50 }, 'كيف يعمل؟', 32, C.ink, 'center'),
    ...steps.flatMap((s, i) => {
      const x = 140 + (2 - i) * 350;
      return [
        el(`job-how-${i + 1}-icon`, 'icon', S.how, { x: x + 141, y: 120, width: 48, height: 48 }, s.icon, { color: C.accent }),
        heading(`job-how-${i + 1}-title`, S.how, { x, y: 186, width: 330, height: 34 }, s.title, 22, C.ink, 'center'),
        paragraph(`job-how-${i + 1}-text`, S.how, { x, y: 226, width: 330, height: 52 }, s.text, 15, C.body, 'center'),
      ];
    }),

    // ---------- Jobs ----------
    heading('job-jobshead-heading', S.jobsHead, { x: 0, y: 80, width: 1280, height: 64 }, 'الوظائف المتاحة', 46, '#FFFFFF', 'center'),
    paragraph('job-jobshead-text', S.jobsHead, { x: 0, y: 150, width: 1280, height: 32 }, 'اختر الوظيفة المناسبة لك وقدّم طلبك مباشرة', 16, 'rgba(255,255,255,0.8)', 'center'),
    ...jobCards('job-all', S.jobsAll, EXAMPLE_JOBS, 60),

    // ---------- Employers ----------
    heading('job-emp-heading', S.employers, { x: 640, y: 80, width: 500, height: 60 }, 'عندك وظيفة شاغرة؟', 40),
    paragraph('job-emp-text', S.employers, { x: 640, y: 150, width: 500, height: 56 }, 'انشر إعلانك في سوق العمل ووصل إلى المرشحين في مدينتك.', 17),
    ...employerPerks.flatMap((p, i) => [
      el(`job-emp-perk-${i + 1}-icon`, 'icon', S.employers, { x: 1108, y: 236 + i * 52, width: 28, height: 28 }, 'iconify:mdi:check-circle', { color: C.accent }),
      paragraph(`job-emp-perk-${i + 1}-text`, S.employers, { x: 640, y: 236 + i * 52, width: 456, height: 30 }, p, 17, C.ink),
    ]),
    button('job-emp-cta', S.employers, { x: 900, y: 420, width: 240, height: 56 }, 'أرسل إعلانك واتساب', true, whatsapp),
    el('job-emp-card', 'shape', S.employers, { x: 140, y: 80, width: 420, height: 440 }, '', { backgroundColor: C.card, borderColor: C.line, borderWidth: 1, borderRadius: 28 }),
    el('job-emp-card-icon', 'icon', S.employers, { x: 314, y: 140, width: 72, height: 72 }, 'iconify:mdi:briefcase-plus-outline', { color: C.accent }),
    heading('job-emp-card-title', S.employers, { x: 170, y: 236, width: 360, height: 40 }, 'إعلان وظيفة', 26, C.ink, 'center'),
    paragraph('job-emp-card-text', S.employers, { x: 180, y: 286, width: 340, height: 120 }, 'المسمى الوظيفي، المدينة، نوع الدوام، الراتب، وطريقة التواصل. نراجع الإعلان وننشره.', 16, C.body, 'center'),

    // ---------- Contact ----------
    heading('job-contact-heading', S.contact, { x: 0, y: 60, width: 1280, height: 56 }, 'تواصل معنا', 36, C.ink, 'center'),
    paragraph('job-contact-sub', S.contact, { x: 0, y: 120, width: 1280, height: 32 }, 'لأي سؤال عن الوظائف أو الإعلانات، نحن بانتظارك.', 16, C.body, 'center'),
    el('job-contact-card', 'shape', S.contact, { x: 420, y: 190, width: 440, height: 250 }, '', { backgroundColor: C.card, borderColor: C.line, borderWidth: 1, borderRadius: 28 }),
    ...contactRows.flatMap((row, i) => {
      const y = 226 + i * 62;
      return [
        el(`job-contact-${i + 1}-icon`, 'icon', S.contact, { x: 792, y, width: 32, height: 32 }, row.icon, { color: C.accent }),
        el(`job-contact-${i + 1}-text`, 'paragraph', S.contact, { x: 456, y, width: 320, height: 32 }, row.text, { fontSize: 16, color: C.body, fontFamily: JOB_BODY_FONT, textAlign: 'right' }, row.link),
      ];
    }),
  ];

  return withTemplateGroups(pages, elements);
}

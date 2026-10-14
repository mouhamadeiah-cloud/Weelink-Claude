// The small language the gallery's «Weelink AI» pages are written in (see scripts/gallery/pages/*.ts).
// A page is up to three slides and a navbar on the 1280-wide canvas the editor draws; every element is one
// the editor already has (headings, texts, buttons, badges, shapes, lines, icons, images, the booking
// calendar, the ratings block, a photo gallery), so a customer who copies a page can edit all of it. Photos
// are written as `photo:<english search>`: the admin site's «نشر نماذج Weelink» turns each into a real
// Unsplash photo found with that search. Phone layouts come from the editor's own «تنسيق الموبايل».
import { PAGE_LOOKS, type PageLook } from '../../src/data/pageLooks';
import { withPhoneLayouts } from '../../src/utils/mobileLayout';
import { groupTemplateCards } from '../../src/utils/templateGroups';
import type { CanvasElement, NavbarConfig, Page, Slide, SlideDividerShape } from '../../src/types';

export type Box = { x: number; y: number; width: number; height: number };
export type Styles = Record<string, unknown>;
export type El = Omit<CanvasElement, 'id' | 'slideId' | 'styles'> & { styles: Styles; slideId?: string };

export const look = (id: string): PageLook => {
  const found = PAGE_LOOKS.find((l) => l.id === id);
  if (!found) throw new Error(`unknown look ${id}`);
  return found;
};

// '#RRGGBB' + alpha → rgba(); the glass cards and veils of the constitution are written with it.
export const rgba = (hex: string, alpha: number) => {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return `rgba(${parseInt(n.slice(0, 2), 16)}, ${parseInt(n.slice(2, 4), 16)}, ${parseInt(n.slice(4, 6), 16)}, ${alpha})`;
};

const el = (type: string, name: string, box: Box, content: string, styles: Styles, extra: Record<string, unknown> = {}): El =>
  ({ type, name, ...box, content, styles, ...extra }) as unknown as El;

export type Link = { slide: number } | { url: string } | undefined;
const linkProps = (link: Link): Record<string, unknown> => {
  if (!link) return {};
  if ('slide' in link) return { linkType: 'slide', linkUrl: `#slide:${link.slide}`, linkTargetId: `@slide:${link.slide}` };
  return { linkType: 'url', linkUrl: link.url };
};

export class Kit {
  constructor(public L: PageLook) {}

  heading(box: Box, text: string, size: number, styles: Styles = {}) {
    return el('heading', 'عنوان', box, text, { fontSize: size, fontWeight: 'bold', color: this.L.ink, fontFamily: this.L.head, textAlign: 'right', backgroundColor: 'transparent', ...styles });
  }
  text(box: Box, value: string, size = 17, styles: Styles = {}) {
    return el('paragraph', 'نص', box, value, { fontSize: size, color: this.L.muted, fontFamily: this.L.body, textAlign: 'right', backgroundColor: 'transparent', ...styles });
  }
  eyebrow(box: Box, value: string, styles: Styles = {}) {
    return this.text(box, value, 14, { color: this.L.price, fontWeight: 'bold', ...styles });
  }
  button(box: Box, label: string, link?: Link, styles: Styles = {}) {
    return el('button', 'زر', box, label, {
      backgroundColor: this.L.accent, color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', borderRadius: this.L.radius >= 9999 ? 9999 : Math.max(this.L.radius, 6), textAlign: 'center', fontFamily: this.L.body, ...styles,
    }, linkProps(link));
  }
  badge(box: Box, label: string, styles: Styles = {}) {
    return el('badge', 'شارة', box, label, {
      backgroundColor: this.L.soft, color: this.L.accent, fontSize: 13, fontWeight: 'bold', borderRadius: 9999, fontFamily: this.L.body, ...styles,
    });
  }
  shape(box: Box, styles: Styles, name = 'شكل') {
    return el('shape', name, box, '', styles);
  }
  // A card: a filled box with the look's radius; put the elements on it after it in the same slide.
  card(box: Box, styles: Styles = {}) {
    return el('shape', 'بطاقة', box, '', { backgroundColor: this.L.card, borderRadius: Math.min(this.L.radius, 28), borderWidth: 1, borderColor: this.L.line, borderStyle: 'solid', ...styles });
  }
  // Frosted glass: a see-through card over a photo (the constitution's only way to put text on a photo).
  glass(box: Box, dark: boolean, styles: Styles = {}) {
    return el('shape', 'بطاقة زجاجية', box, '', {
      backgroundColor: dark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.10)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.18)', borderStyle: 'solid', borderRadius: Math.min(this.L.radius, 28), ...styles,
    });
  }
  // A line drawn by the shape element: line-gradient, line-glow, line-wavy, line-dotted, line-double …
  line(box: Box, kind: string, color: string) {
    const height = Math.max(box.height, 30);
    return el('shape', 'خط', { ...box, y: box.y - (height - box.height) / 2, height }, kind, { backgroundColor: color });
  }
  icon(box: Box, name: string, color: string, styles: Styles = {}) {
    return el('icon', 'أيقونة', box, `iconify:${name}`, { color, ...styles });
  }
  image(box: Box, photo: string, styles: Styles = {}, extra: Record<string, unknown> = {}) {
    const url = photo.startsWith('/') || photo.startsWith('http') ? photo : `photo:${photo}`;
    return el('image', 'صورة', box, url, { objectFit: 'cover', ...styles }, { imageUrl: url, ...extra });
  }
  calendar(box: Box, accent: string, title: string, extra: Record<string, unknown> = {}) {
    return el('calendar', 'حجز موعد', box, '', { backgroundColor: this.L.card }, {
      calendarTitle: title, calendarAccentColor: accent, calendarWorkingDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
      calendarSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'], calendarInterval: '60', calendarWorkStart: '09:00', calendarWorkEnd: '17:00', ...extra,
    });
  }
  ratings(box: Box, accent: string, styles: Styles = {}) {
    return el('ratings', 'التقييمات', box, '', { backgroundColor: '#FFFFFF', ...styles }, { ratingsAccentColor: accent });
  }
  // The editor's own photo gallery block (its four layouts), photos given as search words.
  gallery(box: Box, layout: 'top-main' | 'left-thumbnails' | 'right-thumbnails' | 'left-main-row', photos: string[], styles: Styles = {}, gap = 10, radius = 14) {
    return el('gallery', 'معرض صور', box, '', styles, {
      galleryConfig: { layout, items: photos.map((p, i) => ({ id: `g${i}`, url: `photo:${p}`, title: '' })), activeImageIndex: 0, showThumbnails: true, gap, borderRadius: radius, objectFit: 'cover' },
    });
  }
  // A plan card built from plain elements (the editor's price block keeps its own dark-on-light colours).
  plan(box: Box, o: { name: string; price: string; period: string; features: string[]; featured?: boolean; ink?: string; muted?: string; accent?: string; bg?: string; cta?: string; link?: Link; glow?: string }) {
    const accent = o.accent || this.L.accent;
    const ink = o.ink || this.L.ink;
    const muted = o.muted || this.L.muted;
    const { x, y, width: w, height: h } = box;
    return [
      this.card(box, { backgroundColor: o.bg || this.L.card, borderWidth: o.featured ? 3 : 1, borderColor: o.featured ? accent : this.L.line, glowColor: o.featured ? (o.glow || accent) : undefined, glowIntensity: o.featured ? 20 : undefined }),
      ...(o.featured ? [this.badge({ x: x + 20, y: y + 20, width: 110, height: 30 }, 'الأكثر طلباً', { backgroundColor: accent, color: '#FFFFFF', fontSize: 12 })] : []),
      this.heading({ x: x + 20, y: y + 62, width: w - 40, height: 36 }, o.name, 24, { color: ink }),
      this.heading({ x: x + 20, y: y + 104, width: w - 40, height: 52 }, o.price, 38, { color: accent }),
      this.text({ x: x + 20, y: y + 158, width: w - 40, height: 26 }, o.period, 15, { color: muted }),
      this.line({ x: x + 20, y: y + 196, width: w - 40, height: 2 }, 'line-dotted', accent),
      ...o.features.flatMap((f, i) => [
        this.icon({ x: x + w - 52, y: y + 216 + i * 44, width: 28, height: 28 }, 'mdi:check-circle-outline', accent),
        this.text({ x: x + 20, y: y + 218 + i * 44, width: w - 84, height: 28 }, f, 16, { color: ink }),
      ]),
      ...(o.cta ? [this.button({ x: x + 20, y: y + h - 76, width: w - 40, height: 52 }, o.cta, o.link, { backgroundColor: o.featured ? accent : 'transparent', color: o.featured ? '#FFFFFF' : accent, borderWidth: o.featured ? 0 : 2, borderColor: accent, borderStyle: 'solid' })] : []),
    ];
  }
  pricing(box: Box, plan: string, price: string, period: string, features: string[], featured = false, styles: Styles = {}) {
    return el('pricing', 'باقة', box, '', styles, { pricingPlan: plan, pricingPrice: price, pricingPeriod: period, pricingFeatures: features, pricingFeatured: featured });
  }
}

export interface Background {
  color?: string;
  image?: string; // 'photo:…' search words, or a /Library path
  video?: string; // an id of src/data/backgroundVideos
  fixed?: boolean;
  opacity?: number;
}

export interface SlideSpec {
  name: string;
  height: number;
  bg: Background;
  divider?: SlideDividerShape;
  innerGlow?: { color: string; intensity: number; position?: string };
  glow?: { color: string; intensity: number; position?: string };
  border?: { color: string; width: number; style?: string; radius?: number };
  elements: El[];
}

export interface NavSpec {
  brand: string;
  items: { label: string; slide: number }[];
  cta?: { label: string; slide: number };
  bg: string;
  text: string;
  accent: string;
  accentText?: string;
  sticky?: boolean;
  layout?: 'horizontal' | 'vertical' | 'hamburger';
  posX?: number;
  posY?: number;
  width?: number;
  height?: number;
  sideWidth?: number;
  opacity?: number;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  glow?: { color: string; intensity: number };
  itemsFrame?: { bg?: string; border?: string; borderWidth?: number; radius?: number };
  itemsAlign?: 'right' | 'center' | 'left';
  icons?: Record<string, { icon: string; mode: 'icon' | 'icon-text' }>;
  backgroundImage?: string;
}

export type Category = 'p-business' | 'p-restaurant' | 'p-cars' | 'p-shop';

export interface PageSpec {
  key: string;
  name: string;
  category: Category;
  look: PageLook;
  navbar: NavSpec;
  slides: SlideSpec[];
}

// The videos of src/data/backgroundVideos, by id (title + file); read as text so this file stays plain.
export const videoFiles = (id: string) => ({ src: `/bg-videos/${id}.mp4`, poster: `/bg-videos/${id}.jpg` });

export const buildPage = (spec: PageSpec) => {
  const slideIds = spec.slides.map((_, i) => `${spec.key}-s${i + 1}`);
  const resolveLink = (e: any) => {
    if (typeof e.linkUrl === 'string' && e.linkUrl.startsWith('#slide:')) {
      const n = Number(e.linkUrl.slice(7));
      return { ...e, linkUrl: `#slide-${slideIds[n - 1]}`, linkTargetId: slideIds[n - 1] };
    }
    return e;
  };
  const slides: Slide[] = spec.slides.map((s, i) => ({
    id: slideIds[i],
    name: s.name,
    height: s.height,
    backgroundColor: s.bg.color || spec.look.bg,
    ...(s.bg.image ? { backgroundImage: s.bg.image.startsWith('/') ? s.bg.image : `photo:${s.bg.image}`, backgroundSize: 'cover' as const, backgroundPosition: 'center' } : {}),
    ...(s.bg.video ? { backgroundVideo: videoFiles(s.bg.video).src, backgroundImage: videoFiles(s.bg.video).poster, backgroundSize: 'cover' as const, backgroundPosition: 'center' } : {}),
    ...(s.bg.fixed ? { backgroundAttachment: 'fixed' as const } : {}),
    ...(s.bg.opacity !== undefined ? { backgroundOpacity: s.bg.opacity } : {}),
    dividerShape: s.divider || 'straight',
    ...(s.innerGlow ? { innerGlowColor: s.innerGlow.color, innerGlowIntensity: s.innerGlow.intensity, innerGlowPosition: (s.innerGlow.position || 'center') as any } : {}),
    ...(s.glow ? { glowColor: s.glow.color, glowIntensity: s.glow.intensity, glowPosition: (s.glow.position || 'center') as any } : {}),
    ...(s.border ? { borderColor: s.border.color, borderWidth: s.border.width, borderStyle: s.border.style || 'solid', borderRadius: s.border.radius ?? 0 } : {}),
  }));
  const n = spec.navbar;
  const navbar: NavbarConfig = {
    brandName: n.brand,
    items: n.items.map((it, i) => ({ id: `nav-${i + 1}`, label: it.label, href: `#slide-${slideIds[it.slide - 1]}`, linkType: 'slide', linkTargetId: slideIds[it.slide - 1] })),
    ctaText: n.cta?.label || '',
    ctaHref: n.cta ? `#slide-${slideIds[n.cta.slide - 1]}` : '',
    ...(n.cta ? { ctaLinkType: 'slide' as const, ctaLinkTargetId: slideIds[n.cta.slide - 1] } : {}),
    bgColor: n.bg,
    textColor: n.text,
    accentColor: n.accent,
    accentTextColor: n.accentText || '#FFFFFF',
    isSticky: n.sticky ?? true,
    ...(n.layout ? { layout: n.layout } : {}),
    ...(n.posX !== undefined ? { posX: n.posX } : {}),
    ...(n.posY !== undefined ? { posY: n.posY } : {}),
    ...(n.width !== undefined ? { width: n.width } : {}),
    ...(n.height !== undefined ? { height: n.height } : {}),
    ...(n.sideWidth !== undefined ? { sideWidth: n.sideWidth } : {}),
    ...(n.opacity !== undefined ? { backgroundOpacity: n.opacity } : {}),
    ...(n.borderRadius !== undefined ? { borderRadius: n.borderRadius } : {}),
    ...(n.borderColor ? { borderColor: n.borderColor, borderWidth: n.borderWidth ?? 1, borderStyle: 'solid' } : {}),
    ...(n.glow ? { glowColor: n.glow.color, glowIntensity: n.glow.intensity } : {}),
    ...(n.itemsFrame ? { itemsFrameBgColor: n.itemsFrame.bg, itemsFrameBorderColor: n.itemsFrame.border, itemsFrameBorderWidth: n.itemsFrame.borderWidth, itemsFrameBorderRadius: n.itemsFrame.radius } : {}),
    ...(n.itemsAlign ? { itemsAlign: n.itemsAlign } : {}),
    ...(n.icons ? { partIcons: Object.fromEntries(Object.entries(n.icons).map(([key, v]) => [key.replace(/^item-(\d+)$/, 'item-nav-$1'), v])) } : {}),
    ...(n.backgroundImage ? { backgroundImage: n.backgroundImage } : {}),
    itemsFontFamily: spec.look.body,
  } as NavbarConfig;

  let counter = 0;
  const elements: CanvasElement[] = spec.slides.flatMap((s, i) =>
    s.elements.map((e) => {
      counter += 1;
      return resolveLink({ ...e, id: `${spec.key}-e${counter}`, slideId: slideIds[i] }) as CanvasElement;
    }),
  );
  const page: Page = { id: 'page-home', name: 'الرئيسية', slug: '/', navbar, slides };
  const done = withPhoneLayouts([page], groupTemplateCards(elements));
  return { key: spec.key, name: spec.name, category: spec.category, lookId: spec.look.id, page: { navbar, slides: done.pages[0].slides }, elements: done.elements };
};

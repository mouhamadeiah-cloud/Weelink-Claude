// «ابن صفحتي»: Wee AI builds the page from the owner's answers. The server function
// /api/build-page asks Gemini for a plan (a ready slide for each section, with its texts, links,
// photos and the palette and fonts) and checks it against the designer constitution; here the plan
// becomes slides and elements: the ready slides recoloured to the palette, their slots filled,
// what the owner did not give (a phone number, an address, a price) taken off the page with the
// icons and lines that belonged to it.
import { autoSlots, isStockPhoto } from '../data/autoSlots';
import { auth } from './firebase';
import type { CanvasElement, Page, Slide } from '../types';
import { businessFacts, ownerServices, type WeeAnswers } from './weeWriter';
import { trackUnsplashDownload } from './unsplashService';
import { WEE_COLOR_CHOICES } from '../data/weeColorChoices';
import { DEFAULT_LOOK, pageLookById } from '../data/pageLooks';
import { SLIDE_DIVIDER_OPTIONS } from '../components/SlideDividers';
import { REST_PAGE_IDS } from '../data/restaurantTemplate';
import { CAR_PAGE_IDS } from '../data/carShowroomTemplate';
import { RENTAL_CART_PAGE } from '../data/rentalCartPage';
import { opensPage, type PageRole } from '../data/pageModels';
import { applyPageLook, lookColours, slideSource } from './applyLook';
import { TEXT_EFFECTS } from '../utils/textEffects';
import { lookOf, luminance, ownerPalette, recolourDeep, targetColours, textOn, toneColours, type RecolourScene, type TargetColours } from '../utils/pageRecolour';
import { closeGaps, fittedFontSize, fitTexts, fitTextsPhone, listItems, reflowList, type Box, type FlexEl } from '../utils/flexLayout';
import { arrangeSlideForMobile } from '../utils/mobileLayout';
import type { ProjectType } from '../components/shop/shopTypes';
import { deserializeElements } from '../utils/elementStorage';
import { GALLERY_MAX } from '../utils/planLimits';
import { freeToBuilt, type FreeDesign } from '../utils/freeDesign';

export type BuildKind = 'free' | 'restaurant' | 'shop' | 'cars';
// The look family of a project (the colours and fonts its slides start in, src/utils/pageRecolour.ts). It never decides what is built:
// the server builds from the page model and the site's real kind (src/data/siteKinds.ts).
export const KIND_OF_PROJECT: Record<ProjectType, BuildKind> = { page: 'free', restaurant: 'restaurant', shop: 'shop', cars: 'cars', rental: 'free', hotel: 'free' };

// As api/build-page.ts returns it.
interface PlannedSection {
  section: string;
  template: string;
  tone: 'light' | 'tint' | 'dark';
  slots: Record<string, string>; // single slots and list items (points.3.title …)
  icons: Record<string, string>; // points.0.icon → mdi:…
  links: Record<string, string>;
  images: Record<string, string>;
  entrance: string; // an editor animation, or 'none'
}
// The ready slide the server chose for a section (server/pagePicker.ts): `g:{id}` an admin's, `code:…` the editor's own.
export interface GalleryPayload { slide: Record<string, any>; elements: any[]; name?: string }
export interface Plan {
  extra?: Record<string, GalleryPayload>; // the ready slides the plan uses, by template id
  look: string; // the page look Wee AI chose (its colours and two fonts)
  navbar: { layout: 'horizontal' | 'hamburger' | 'vertical'; sticky: boolean; tone: 'light' | 'tint' | 'accent' | 'dark' };
  accentColor?: string; // the owner's own colour only
  motion: boolean;
  sections: PlannedSection[];
}

// The Wee AI divider answer as the editor's slide edge.
// Older answers used four short names; now the answer is the editor's own edge shape.
const DIVIDERS: Record<string, Slide['dividerShape']> = { straight: 'straight', wave: 'wave', sine: 'double-wave', curved: 'curve-down' };
const dividerOf = (answer: string | undefined): Slide['dividerShape'] =>
  DIVIDERS[answer || ''] || SLIDE_DIVIDER_OPTIONS.find((o) => o.id === answer)?.id;

// The pages a button may open, by the kind of page the AI named.
const PAGE_TARGETS: Record<string, string[]> = {
  menu: [REST_PAGE_IDS.menu],
  products: ['shop-page-products', CAR_PAGE_IDS.showroom], // a rental of things lists them in the showroom's page
  cars: [CAR_PAGE_IDS.showroom],
  cart: [REST_PAGE_IDS.cart, 'shop-page-cart'],
  contact: [REST_PAGE_IDS.contact, 'shop-page-contact', CAR_PAGE_IDS.contact],
};
// The built-in pages a page of the model is (Eyad, 28 Oct: the model is the only source): the model builds into them, or keeps them as they
// are (the cart, the live menu, products and cars), so the page, the buttons that open it and its navbar entry stay one.
const TWINS: Record<PageRole, string[]> = {
  cart: [REST_PAGE_IDS.cart, 'shop-page-cart', RENTAL_CART_PAGE],
  menu: [REST_PAGE_IDS.menu],
  products: ['shop-page-products', CAR_PAGE_IDS.showroom], // a rental of things lists them in the showroom's page
  cars: [CAR_PAGE_IDS.showroom],
  contact: [REST_PAGE_IDS.contact, 'shop-page-contact', CAR_PAGE_IDS.contact],
};
/** A page of the model as the server names it: its id, name, and what it is to a store. */
export interface SitePage { id: string; name: string; system?: 'cart'; role?: PageRole }
/** The site's own page this page of the model is, when it has one not taken yet. */
export const twinOf = (p: Pick<SitePage, 'role'>, pages: Page[], taken: string[]): string | null =>
  (p.role ? TWINS[p.role] : []).find((id) => pages.some((x) => x.id === id) && !taken.includes(id)) || null;
/** The pages kept as the store has them (its cart and live lists): the model names them, nothing is built in them. */
export const keptAsIs = (p: Pick<SitePage, 'role'>) => p.role === 'cart' || p.role === 'menu' || p.role === 'products' || p.role === 'cars';

/**
 * The site as the model has it: these pages only, in this order, under these names. Every other page goes with its slides' elements,
 * and a button or the navbar's own button that opened a page that went now opens the first page.
 */
export const keepModelPages = (pages: Page[], elements: CanvasElement[], order: { pageId: string; name: string }[]) => {
  const byId = new Map(pages.map((p) => [p.id, p]));
  const kept = order.filter((o, i) => byId.has(o.pageId) && order.findIndex((x) => x.pageId === o.pageId) === i).map((o) => ({ ...byId.get(o.pageId)!, name: o.name }));
  if (!kept.length) return { pages, elements };
  const ids = new Set(kept.map((p) => p.id));
  const first = kept[0].id;
  const slides = new Set(kept.flatMap((p) => p.slides.map((s) => s.id)));
  const goneLink = (e: { linkType?: string; linkTargetId?: string }) => e.linkType === 'page' && !!e.linkTargetId && !ids.has(e.linkTargetId);
  return {
    pages: kept.map((p) => (p.navbar.ctaLinkType === 'page' && p.navbar.ctaLinkTargetId && !ids.has(p.navbar.ctaLinkTargetId)
      ? { ...p, navbar: { ...p.navbar, ctaLinkTargetId: first, ctaHref: `#page-${first}` } }
      : p)),
    elements: elements.filter((e) => slides.has(e.slideId)).map((e) => (goneLink(e) ? { ...e, linkTargetId: first, linkUrl: `#page-${first}` } : e)),
  };
};
// The page Wee AI builds on: a store's main page is its first, a page project builds the open page.
const mainPageOf = (kind: BuildKind, pages: Page[], activePageId: string) => (kind === 'free' && pages.find((p) => p.id === activePageId)) || pages[0];

// The owner's colour choice (Wee AI step 6): a named choice gives its accent and second colour,
// «مخصص» the colour picked by hand. Nothing when the owner left the question.
const ownersChoice = (a: WeeAnswers): { accent: string; second?: string; palette?: [string, string, string, string, string] } | null => {
  const ai = a.aiAnswers || {};
  if (ai.lookId && pageLookById(ai.lookId)) return null; // a page look: its own colours
  if ((ai.colorPalette || '').startsWith('مخصص')) {
    const pal = ai.customPalette;
    if (Array.isArray(pal) && pal.length === 5 && pal.every((c) => /^#[0-9a-f]{6}$/i.test(c))) return { accent: pal[4], palette: pal as [string, string, string, string, string] };
    const custom = /#[0-9a-f]{6}/i.exec(`${ai.colorPalette} ${ai.customColor || ''}`)?.[0];
    return custom ? { accent: custom } : null;
  }
  const named = WEE_COLOR_CHOICES.find((c) => c.name === ai.colorPalette);
  return named ? { accent: named.colors[0], second: named.colors[1] } : null;
};

/** What the server and Gemini get: the facts the writer uses plus the look the owner asked for. */
export const buildProfile = (a: WeeAnswers, siteName: string): Record<string, string> => {
  const ai = a.aiAnswers || {};
  const extra: Record<string, string> = {
    اللون_المفضل: ai.colorPalette || '',
    اللون_المفضل_رمز: ownersChoice(a)?.accent || '',
    الفواصل: ai.dividerStyle || '',
    الحركة: ai.motionEffects || '',
  };
  return { ...businessFacts(a, siteName), ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v)) };
};

// The owner's gallery photos, up to what the package allows (5 on the free page, 15 on Pro).
const galleryOf = (a: WeeAnswers, max: number = GALLERY_MAX) => (a.aiAnswers?.wantsGallery === false ? [] : (a.aiAnswers?.galleryImages || []).filter(Boolean).slice(0, max));

export const pageAssets = (a: WeeAnswers, max: number = GALLERY_MAX) => ({
  heroBg: !!a.aiAnswers?.heroBgImage,
  gallery: galleryOf(a, max).length,
  logo: !!a.personalInfo?.logoUrl,
});

export type PlanResult = { ok: true; plan: Plan; pageName: string; ratings: boolean; missing?: string[]; site: SitePage[]; plain?: string[] } | { ok: false; message: string };

// What went wrong, in words the owner can act on, with the server's code for whoever fixes it.
const failureMessage = (status: number, data: { reason?: string; detail?: string }) => {
  const reason = data.reason || (status === 504 ? 'timeout' : `http_${status}`);
  const detail = data.detail ? ` ${data.detail}` : '';
  const words: Record<string, string> = {
    timeout: 'Wee AI أخد وقت أطول من المسموح وانقطع الطلب.',
    bad_json: 'Wee AI رد بجواب ناقص أو مكسور.',
    empty: 'Wee AI ما رد بشي.',
    network: 'الخادم ما قدر يوصل لـ Wee AI.',
    gemini_400: 'Wee AI رفض الطلب.',
    gemini_403: 'مفتاح Wee AI على الخادم مرفوض.',
    gemini_404: 'نموذج Wee AI المطلوب غير موجود.',
    gemini_429: 'خلص رصيد Wee AI المسموح هلق.',
    check: 'جواب Wee AI ما مر من الفحص.',
  };
  const lead = words[reason] || (reason.startsWith('gemini_5') ? 'خدمة Wee AI واقعة هلق.' : 'ما قدر Wee AI يبني الصفحة هالمرة.');
  return `${lead} جرّب مرة ثانية بعد شوي. (السبب للدعم: ${reason}${detail})`;
};

const NO_MODEL = 'ما قدرت إقرا نموذج صفحتك، فما بنيت شي. جرّب بعد شوي، وإذا تكرر خبّر الإدارة.';
export const requestPagePlan = async (kind: BuildKind, profile: Record<string, string>, assets: ReturnType<typeof pageAssets>, project?: string, model: { flavor?: string; ticked?: string[]; modelPage?: string } = {}): Promise<PlanResult> => {
  const user = auth.currentUser;
  if (!user) return { ok: false, message: 'سجّل الدخول أولاً حتى يبني Wee AI صفحتك.' };
  try {
    const res = await fetch('/api/build-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify({ kind, profile, assets, project, ...(model.flavor ? { flavor: model.flavor } : {}), ...(model.ticked ? { ticked: model.ticked } : {}), ...(model.modelPage ? { modelPage: model.modelPage } : {}) }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data.plan?.sections)) {
      // The tokens this build used, for working out its cost (browser console).
      if (data.usage) console.info('Wee AI build tokens:', data.usage);
      // The model is the only source (Eyad, 29 Oct): an answer without the model's pages is not built.
      if (!Array.isArray(data.site) || !data.site.length) return { ok: false, message: NO_MODEL };
      return { ok: true, plan: data.extra ? { ...data.plan, extra: data.extra } : data.plan, pageName: String(data.pageName || ''), ratings: data.ratings === true, site: data.site as SitePage[], ...(Array.isArray(data.missing) && data.missing.length ? { missing: data.missing.map(String) } : {}), ...(Array.isArray(data.plain) && data.plain.length ? { plain: data.plain.map(String) } : {}) };
    }
    if (data.error === 'not_configured') return { ok: false, message: 'Wee AI غير مفعّل بعد على الخادم (ينقصه مفتاح الذكاء الاصطناعي).' };
    if (data.error === 'no_tokens') return { ok: false, message: 'انتهى رصيد Wee AI في حسابك. تواصل مع الإدارة لشحن رصيد جديد.' };
    if (data.error === 'no_model') return { ok: false, message: NO_MODEL };
    if (data.error === 'build_limit') {
      return { ok: false, message: data.perDay ? `خلصت مرات «ابن صفحتي» لليوم (${data.limit} حسب باقتك). جرّب بكرا، أو رقّي لـ Pro.` : '«ابن صفحتي» بالصفحة المجانية مرة وحدة. رقّي لـ Pro لتبني أكتر.' };
    }
    if (data.error === 'no_profile') return { ok: false, message: 'اكتب وصف عملك أو اختر تصنيفه بالأسئلة أولاً.' };
    if (res.status === 401) return { ok: false, message: 'انتهت جلسة الدخول. سجّل الدخول من جديد وجرّب مرة ثانية.' };
    return { ok: false, message: failureMessage(res.status, data) };
  } catch {
    return { ok: false, message: 'ما في اتصال بالإنترنت أو الخادم ما رد. جرّب بعد شوي.' };
  }
};

// ---------- Building ----------

type Draft = Omit<CanvasElement, 'id' | 'slideId'> & { id?: string; slideId?: string };

/** A ready slide as the server sent it: the slide and its elements, whose marked parts the AI filled. */
const readySlide = (template: string, extra?: Record<string, GalleryPayload>): (Record<string, any> & { elements: Draft[] }) | null => {
  const g = extra?.[template];
  if (!g) return null;
  // The editor's own slides keep the look they are drawn in (their `aiTemplate`), so the page's colours map onto them.
  const { id: _id, aiTemplate, ...slide } = g.slide || {};
  return {
    ...slide,
    ...(template.startsWith('code:') && aiTemplate ? { aiTemplate } : {}),
    name: slide.name || g.name || 'شريحة',
    height: Number(slide.height) || 560,
    backgroundColor: slide.backgroundColor || '#ffffff',
    elements: autoSlots(deserializeElements(JSON.parse(JSON.stringify(g.elements || [])))).map(({ id: _e, slideId: _s, ...el }) => el as Draft),
  };
};

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// A number as WhatsApp wants it: digits with the country code (Syrian 09… numbers get 963).
const waNumber = (raw: string) => {
  let d = raw.replace(/[^0-9]/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = `963${d.slice(1)}`;
  return d;
};

const whatsappLink = (num: string) => ({ linkType: 'contact' as const, contactType: 'whatsapp' as const, contactValue: num, linkUrl: `https://wa.me/${waNumber(num)}`, linkTargetId: undefined });
const phoneLink = (num: string) => ({ linkType: 'contact' as const, contactType: 'phone' as const, contactValue: num, linkUrl: `tel:${num.replace(/[^0-9+]/g, '')}`, linkTargetId: undefined });
const noLink = { linkType: undefined, linkUrl: undefined, linkTargetId: undefined, contactType: undefined, contactValue: undefined };

// The owner's social pages from the contact question (Facebook, TikTok): a link as typed, or the bare address given a https://.
const SOCIAL: { type: 'facebook' | 'tiktok'; label: string; host: RegExp }[] = [
  { type: 'facebook', label: 'فيسبوك', host: /^(?:https?:\/\/)?(?:www\.|m\.|web\.)?(?:facebook|fb)\.com\/\S+/i },
  { type: 'tiktok', label: 'تيك توك', host: /^(?:https?:\/\/)?(?:www\.|vm\.)?tiktok\.com\/\S+/i },
];
export const socialLinks = (contact: WeeAnswers['contactInfo']) =>
  SOCIAL.flatMap((n) => {
    const raw = (contact?.[n.type] || '').trim();
    if (!n.host.test(raw)) return [];
    return [{ type: n.type, label: n.label, url: /^https?:\/\//i.test(raw) ? raw : `https://${raw}` }];
  });

const SYSTEM = /^(phone|whatsapp|address|hours|email)\.(label|value)$/;
const IMAGE = /^(image|avatar|photos\.\d+)$/;
// The first part of a list item: without it the item's other parts go too.
const ITEM_HEAD = /^(.*\.\d+)\.(name|title|number)$/;

interface Context {
  maxPhotos: number; // the package's gallery
  extra?: Record<string, GalleryPayload>;
  kind: BuildKind;
  answers: WeeAnswers;
  facts: Record<string, string>;
  slideIds: string[];
  pageIds: Set<string>;
  contactIndex: number;
  photo: (query: string, shape?: PhotoShape) => Promise<string | null>;
  fallbackQuery?: string; // the AI's first photo search, for a photo it left without one
  services: { name: string; price: string }[]; // the owner's own, for the price section
  title: string; // the page's name, or the owner's
}

const inside = (outer: Draft, inner: Draft) =>
  inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;

const resolveLink = (to: string | undefined, ctx: Context) => {
  if (!to) return null;
  const wa = ctx.facts['واتساب'];
  const tel = ctx.facts['هاتف'];
  if (to === 'whatsapp') return wa ? whatsappLink(wa) : null;
  if (to === 'phone') return tel ? phoneLink(tel) : wa ? phoneLink(wa) : null;
  const slide = /^slide:(\d+)$/.exec(to);
  if (slide) {
    const id = ctx.slideIds[+slide[1]];
    return id ? { ...noLink, linkType: 'slide' as const, linkTargetId: id, linkUrl: `#slide-${id}` } : null;
  }
  const page = /^page:(\w+)$/.exec(to);
  const target = page && PAGE_TARGETS[page[1]]?.find((id) => ctx.pageIds.has(id));
  return target ? { ...noLink, linkType: 'page' as const, linkTargetId: target, linkUrl: `#page-${target}` } : null;
};

// Where a button leads when the AI gave it no link: its own page or contact link when it still
// works, else the contact section, else WhatsApp.
const defaultLink = (el: Draft, slideIndex: number, ctx: Context) => {
  if (el.linkType === 'page' && el.linkTargetId && ctx.pageIds.has(el.linkTargetId)) return {};
  if (el.linkType === 'contact' && el.contactType === 'whatsapp') return resolveLink('whatsapp', ctx) || noLink;
  if (el.linkType === 'contact' && el.contactType === 'phone') return resolveLink('phone', ctx) || noLink;
  if (ctx.contactIndex >= 0 && ctx.contactIndex !== slideIndex) return resolveLink(`slide:${ctx.contactIndex}`, ctx) || noLink;
  return resolveLink('whatsapp', ctx) || noLink;
};

const shapeOfEl = (el: { width?: number; height?: number }): PhotoShape => {
  const w = Number(el.width) || 1;
  const h = Number(el.height) || 1;
  return w > h * 1.25 ? 'wide' : h > w * 1.25 ? 'tall' : 'square';
};

const imageFor = async (ref: string | undefined, ctx: Context, shape?: PhotoShape): Promise<string | null> => {
  if (!ref) return null;
  const a = ctx.answers;
  if (ref === 'user:heroBg') return a.aiAnswers?.heroBgImage || null;
  if (ref === 'user:logo') return a.personalInfo?.logoUrl || null;
  const g = /^user:gallery:(\d{1,2})$/.exec(ref);
  if (g) return galleryOf(a, ctx.maxPhotos)[+g[1] - 1] || null;
  return ctx.photo(ref, shape);
};

// ---------- The flexible plan as an example slide's slots ----------

const LIST_SLOT = /^(chips|facts|points|items|packages)\.(\d+)(?=\.|$)/;
const ON_REQUEST = 'حسب الطلب';
// A price the owner wrote as a bare number gets the Syrian pound; words stay as written.
const priceText = (p: string) => (!p ? ON_REQUEST : /^[\d٠-٩][\d٠-٩.,،\s]*$/.test(p) ? `${p} ل.س` : p);

/** The owner's services and prices as the price section's rows (the AI writes only their descriptions). */
const withServices = (section: PlannedSection, rows: { name: string; price: string }[], templateKeys: string[]) => {
  if (section.section !== 'prices' || !rows.length) return section;
  const slots = { ...section.slots };
  const list = templateKeys.some((k) => k.startsWith('items.')) ? 'items' : templateKeys.some((k) => k.startsWith('packages.')) ? 'packages' : null;
  if (list) {
    for (const k of Object.keys(slots)) if (LIST_SLOT.exec(k)?.[1] === list && +LIST_SLOT.exec(k)![2] >= rows.length) delete slots[k];
    rows.forEach((r, i) => {
      slots[`${list}.${i}.name`] = r.name;
      slots[`${list}.${i}.price`] = priceText(r.price);
    });
    return { ...section, slots };
  }
  // A grouped list: the rows filled in order, the groups left without a row go.
  const rowKeys = templateKeys.filter((k) => /^groups\.\d+\.rows\.\d+\.name$/.test(k));
  rowKeys.forEach((k, i) => {
    const r = rows[i];
    slots[k] = r?.name || '';
    slots[k.replace(/name$/, 'price')] = r ? priceText(r.price) : '';
  });
  const groups = new Set(rowKeys.map((k) => k.split('.')[1]));
  for (const g of groups) if (!rowKeys.some((k, i) => k.split('.')[1] === g && rows[i])) slots[`groups.${g}.name`] = '';
  return { ...section, slots };
};

/** The list items the AI filled, numbered from 0 with no gaps, and how many each list has. */
const compactLists = (section: PlannedSection) => {
  // An item counts when it has text, and its name, title or figure when it has one of those.
  const HEAD = /^[a-z]+\.\d+\.(name|title|number)$/;
  const itemKey = (k: string) => k.split('.').slice(0, 2).join('.');
  const heads = Object.entries(section.slots).filter(([k]) => HEAD.test(k));
  const headless = new Set(heads.map(([k]) => itemKey(k)).filter((item) => !heads.some(([k, v]) => itemKey(k) === item && v.trim())));
  const used = new Map<string, number[]>();
  for (const [k, v] of Object.entries(section.slots)) {
    const m = LIST_SLOT.exec(k);
    if (!m || !v.trim() || headless.has(`${m[1]}.${m[2]}`)) continue;
    const list = used.get(m[1]) || [];
    if (!list.includes(+m[2])) list.push(+m[2]);
    used.set(m[1], list);
  }
  used.forEach((list) => list.sort((a, b) => a - b));
  const rename = (k: string) => {
    const m = LIST_SLOT.exec(k);
    if (!m) return k;
    const j = (used.get(m[1]) || []).indexOf(+m[2]);
    return j < 0 ? null : k.replace(LIST_SLOT, `${m[1]}.${j}`);
  };
  const move = (rec: Record<string, string>) =>
    Object.fromEntries(Object.entries(rec).map(([k, v]) => [rename(k), v] as const).filter((e): e is [string, string] => e[0] !== null));
  return { slots: move(section.slots), icons: move(section.icons), counts: new Map([...used].map(([k, v]) => [k, v.length])) };
};

const ANIMATED = /^(fade|slide-up|slide-left|slide-right|scale-up)$/;

/** One planned section as a slide and its elements. */
const buildSlide = async (planned: PlannedSection, index: number, ctx: Context, page: TargetColours, fonts: { head: string; body: string }, motion: boolean) => {
  const ready = readySlide(planned.template, ctx.extra);
  if (!ready) return null;
  const slideId = ctx.slideIds[index];
  const { aiTemplate, name, backgroundColor, backgroundImage, backgroundVideo, backgroundOpacity, backgroundAttachment } = ready;
  let height: number = ready.height;
  const templateKeys = ready.elements.map((e) => e.aiSlot).filter(Boolean) as string[];
  const section = withServices(planned, ctx.services, templateKeys);
  const { slots, icons, counts } = compactLists(section);
  // The page's name heads its first section (Eyad: the name is the page's title).
  if (opensPage(section.section) && templateKeys.includes('title') && ctx.title) slots.title = ctx.title;

  // Each list with as many items as the AI wrote, on the example's grid.
  let els = ready.elements.map((e) => ({ ...e, styles: { ...e.styles } })) as (Draft & FlexEl)[];
  // The example's own phone layout is kept and moved with the desktop one; a slide without one
  // gets one arranged at the end.
  let mobileHeight: number | undefined = ready.mobileHeight && els.every((e) => e.mobile) ? ready.mobileHeight : undefined;
  const lists = new Set(templateKeys.map((k) => LIST_SLOT.exec(k)?.[1]).filter(Boolean) as string[]);
  for (const list of lists) {
    const flowed = reflowList(els, list, counts.get(list) || 0, height, mobileHeight);
    els = flowed.els as (Draft & FlexEl)[];
    height = flowed.height;
    mobileHeight = flowed.mobileHeight;
  }

  const look = lookOf(aiTemplate, ctx.kind, els);
  const removed = new Set<number>();
  const filled = new Set<number>();
  const examples = new Map<number, string>(); // each filled text's example wording, to fit the new text's size to it
  const value = (k: string) => (slots[k] || '').trim();
  const facts = ctx.facts;
  const systemValue: Record<string, string> = { phone: facts['هاتف'] || '', whatsapp: facts['واتساب'] || '', address: facts['العنوان'] || '', hours: facts['ساعات_العمل'] || '', email: facts['بريد'] || '' };

  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    const key = el.aiSlot;
    // An example photo nobody gave a slot is still the example business's: it takes a photo of this one, or goes (never the example's).
    if (!key && el.type === 'image' && isStockPhoto(String(el.content || el.imageUrl || ''))) {
      const url = ctx.fallbackQuery ? await ctx.photo(ctx.fallbackQuery, shapeOfEl(el)) : null;
      if (url) Object.assign(el, { content: url, imageUrl: url });
      else removed.add(i);
      continue;
    }
    if (!key) continue;
    const sys = SYSTEM.exec(key);
    if (sys) {
      const v = systemValue[sys[1]];
      if (!v) removed.add(i);
      else if (sys[2] === 'value') {
        examples.set(i, String(el.content || ''));
        el.content = escapeHtml(v);
        filled.add(i);
      }
      continue;
    }
    if (key === 'map') {
      // The owner's pin when he put one, else his address.
      const where = facts['الموقع'] || systemValue.address;
      if (!where) removed.add(i);
      else Object.assign(el, { content: where, mapLocation: where });
      continue;
    }
    // The video the owner linked plays in the slide's player; without one the player goes.
    if (key === 'video') {
      if (!facts['فيديو']) removed.add(i);
      else Object.assign(el, { videoUrl: facts['فيديو'] });
      continue;
    }
    if (key === 'form') continue;
    // The photo-viewer block takes the owner's photos; without any it goes.
    if (key === 'gallery' && el.type === 'gallery') {
      const urls = galleryOf(ctx.answers, ctx.maxPhotos);
      if (!urls.length) removed.add(i);
      else el.galleryConfig = { ...(el.galleryConfig as NonNullable<typeof el.galleryConfig>), items: urls.map((url, n) => ({ id: `g${n}`, url, title: '' })), activeImageIndex: 0 };
      continue;
    }
    if (IMAGE.test(key) || el.type === 'image') {
      const shape = shapeOfEl(el);
      const ref = section.images[key];
      const url = (await imageFor(ref, ctx, shape)) || (ctx.fallbackQuery && !key.startsWith('photos.') ? await ctx.photo(ctx.fallbackQuery, shape) : null);
      if (url) Object.assign(el, { content: url, imageUrl: url, ...(ref && !ref.startsWith('user:') && !el.alt ? { alt: ref } : {}) });
      // The example photos belong to the example business (Eyad, 28 Oct: none may stay): a photo with none of
      // this one goes, a gallery frame with its caption.
      else {
        removed.add(i);
        if (key.startsWith('photos.')) els.forEach((c, j) => c.aiSlot === `caption.${key.split('.')[1]}` && removed.add(j));
      }
      continue;
    }
    if (el.type === 'button' && (key === 'whatsapp' || key === 'phone')) {
      const link = resolveLink(key, ctx);
      if (!link) {
        removed.add(i);
        continue;
      }
      if (value(key)) el.content = escapeHtml(value(key));
      Object.assign(el, link);
      continue;
    }
    const text = value(key);
    if (!text && !(key === 'send' && el.type === 'button')) {
      removed.add(i);
      continue;
    }
    if (text) {
      examples.set(i, String(el.content || ''));
      el.content = escapeHtml(text);
      filled.add(i);
    }
    if (el.type === 'button' && key !== 'eyebrow') {
      const link = resolveLink(section.links[key], ctx);
      if (key !== 'send') Object.assign(el, link || defaultLink(el, index, ctx));
    }
  }

  // Each card's icon as the AI chose it for that card.
  for (const list of lists) {
    listItems(els, list).forEach((item, n) => {
      const chosen = icons[`${list}.${n}.icon`];
      const iconAt = item.members.find((m) => els[m].type === 'icon');
      if (chosen && iconAt !== undefined) els[iconAt].content = `iconify:${chosen}`;
    });
  }

  // A list item without its name or title goes whole.
  const heads = [...removed].map((i) => ITEM_HEAD.exec(els[i].aiSlot || '')?.[1]).filter(Boolean) as string[];
  els.forEach((el, i) => {
    if (el.aiSlot && heads.some((h) => el.aiSlot!.startsWith(`${h}.`))) removed.add(i);
  });

  // The small icons, lines and icon backgrounds on the row of something taken off.
  for (const r of [...removed]) {
    const gone = els[r];
    els.forEach((el, i) => {
      if (removed.has(i) || el.aiSlot || el.isGroupContainer || (el.type !== 'shape' && el.type !== 'icon')) return;
      if (el.width >= 1280 * 0.7 || el.height > Math.max(gone.height * 1.5, 60)) return;
      const cy = el.y + el.height / 2;
      const overlaps = el.x < gone.x + gone.width + 60 && el.x + el.width > gone.x - 60;
      if (overlaps && cy >= gone.y - 12 && cy <= gone.y + gone.height + 12) removed.add(i);
    });
  }

  // A card whose filled parts all went goes with everything on it.
  els.forEach((card, c) => {
    if (!card.isGroupContainer || removed.has(c)) return;
    const on = els.map((el, i) => (i !== c && inside(card, el) ? i : -1)).filter((i) => i >= 0);
    const slotted = on.filter((i) => els[i].aiSlot);
    if (slotted.length && slotted.every((i) => removed.has(i))) [c, ...on].forEach((i) => removed.add(i));
  });

  // Texts at their own length: a box grows to fit and pushes down what is under it.
  const kept = els.filter((_, i) => !removed.has(i));
  // Nothing left but a title and decoration (its photos or texts all went): an empty slide, not built.
  if (kept.every((e) => e.type === 'heading' || e.type === 'shape' || e.type === 'icon')) return null;
  const grew = new Set(kept.filter((el) => filled.has(els.indexOf(el))));
  // A longer text than the example's goes smaller in its box instead of overflowing or breaking a word.
  examples.forEach((example, i) => {
    if (removed.has(i)) return;
    const size = fittedFontSize(els[i], example);
    if (size) els[i].styles = { ...els[i].styles, fontSize: size };
  });
  // A whole row that went (a title, a paragraph, a button, a photo) leaves no hole.
  const goneEls = [...removed].map((i) => els[i]).filter((e) => e.aiSlot && !e.isGroupContainer && ['heading', 'paragraph', 'button', 'image', 'badge'].includes(e.type));
  if (goneEls.length) {
    height = closeGaps(kept, height, goneEls);
    if (mobileHeight !== undefined) {
      const views = kept.map((e) => ({ ...e, ...(e.mobile as Box) }));
      mobileHeight = closeGaps(views, mobileHeight, goneEls.map((e) => e.mobile as Box));
      kept.forEach((e, i) => (e.mobile = { ...(e.mobile as Box), y: views[i].y, height: views[i].height }));
    }
  }
  const fitted = fitTexts(kept, height, grew);
  height = fitted.height;
  if (mobileHeight !== undefined) {
    // The phone view of the same texts, from the boxes before the desktop fit.
    const phone = fitTextsPhone(kept, mobileHeight, grew);
    mobileHeight = phone.mobileHeight;
    fitted.els.forEach((el, i) => (el.mobile = phone.els[i].mobile));
  }

  // The section's tone: the page's colours, a faint accent, or dark. A photo section keeps the
  // page's own, its photo is its tone.
  const onPhoto = !!(backgroundImage || backgroundVideo) && (backgroundOpacity ?? 1) >= 0.5;
  const to = onPhoto ? page : toneColours(page, section.tone);
  const headFont = fitted.els.find((e) => e.type === 'heading' && e.styles?.fontFamily)?.styles.fontFamily || look.head;
  const scene: RecolourScene = { look, to, onPhoto };
  const firstButton = fitted.els.findIndex((e) => e.type === 'button');
  const elements: CanvasElement[] = fitted.els.map((draft, j) => {
    let el = recolourDeep(draft, scene) as Draft;
    const styles = { ...el.styles };
    if (styles.fontFamily) styles.fontFamily = styles.fontFamily === headFont ? fonts.head : fonts.body;
    if ((el.type === 'button' || el.type === 'badge') && styles.backgroundColor?.toLowerCase() === to.accent.toLowerCase()) styles.color = textOn(to.accent);
    // A text effect the designer put on the letters stays (it is part of the design, and its colours follow the page's); a moving one goes on a calm page,
    // and a glow, made for a dark ground, goes on a light one.
    const effect = styles.textEffect ? TEXT_EFFECTS.find((t) => t.id === styles.textEffect) : undefined;
    if (effect && ((!motion && (effect.group === 'motion' || effect.id === 'neon-pulse' || effect.id === 'gradient-move')) || (effect.dark && !onPhoto && luminance(to.bg) > 0.5))) {
      for (const k of ['textEffect', 'textEffectColor', 'textEffectColor2', 'textEffectIntensity', 'textEffectImage']) delete (styles as Record<string, unknown>)[k];
    }
    if (!motion) {
      if (styles.animationTrigger === 'once' || styles.animationTrigger === 'loop') {
        delete styles.animation;
        delete styles.animationTrigger;
      }
    } else if (opensPage(section.section) && j === firstButton) {
      // The page's main call to action keeps pulsing on a lively page.
      Object.assign(styles, { animation: 'pulse', animationTrigger: 'loop', animationDuration: 2 });
    } else if (ANIMATED.test(section.entrance) && !styles.animation && !el.isGroupContainer && el.width < 1280 * 0.7) {
      // (A part the designer animated keeps its own animation, scroll effects included.)
      Object.assign(styles, { animation: section.entrance, animationTrigger: 'once', animationDuration: 0.8 });
    }
    el = { ...el, styles };
    // The gallery's photos open in the photo viewer, one after another.
    if (section.section === 'gallery' && el.type === 'image' && /^photos\./.test(el.aiSlot || '')) el = { ...el, lightboxGroup: 'photos' };
    return { ...el, id: `${slideId}-el-${j}`, slideId } as CanvasElement;
  });

  // The contact section also shows the owner's Facebook and TikTok pages, as buttons under what the slide has.
  const socials = section.section === 'contact' ? socialLinks(ctx.answers.contactInfo) : [];
  if (socials.length) {
    const w = 190;
    const gap = 16;
    const x0 = Math.round((1280 - (socials.length * w + (socials.length - 1) * gap)) / 2);
    const top = height;
    height += 96;
    const phoneTop = mobileHeight;
    socials.forEach((n, i) => {
      elements.push({
        id: `${slideId}-el-${elements.length}`, slideId, name: `زر ${n.label}`, type: 'button', content: n.label,
        x: x0 + i * (w + gap), y: top + 24, width: w, height: 48,
        styles: { backgroundColor: to.accent, color: textOn(to.accent), fontSize: 16, fontWeight: 'bold', borderRadius: 9999, textAlign: 'center', fontFamily: fonts.body },
        linkType: 'contact', contactType: n.type, contactValue: n.url, linkUrl: n.url, linkTargetId: undefined,
        ...(phoneTop !== undefined ? { mobile: { x: 36, y: phoneTop + 24 + i * 60, width: 288, height: 48, fontScale: 1 } } : {}),
      } as CanvasElement);
    });
    if (mobileHeight !== undefined) mobileHeight += 24 + socials.length * 60 + 12;
  }

  // A faint photo wash fades the slide colour with it, to near white: on a dark section it goes.
  const wash = (backgroundOpacity ?? 1) < 0.5;
  const dropWash = wash && to.deep === to.bg;
  // The example's background photo is never kept: this business's, a photo of its subject, or none (the slide's colour).
  const stockBg = !!backgroundImage && isStockPhoto(backgroundImage);
  const bgUrl = dropWash ? null : (await imageFor(section.images.background, ctx)) || (stockBg && ctx.fallbackQuery ? await ctx.photo(ctx.fallbackQuery, 'wide') : null);
  const divider = dividerOf(ctx.answers.aiAnswers?.dividerStyle);
  let slide: Slide = {
    id: slideId,
    name,
    height,
    ...(mobileHeight !== undefined ? { mobileHeight } : {}),
    backgroundColor: recolourDeep(backgroundColor, scene, 'fill'),
    aiTemplate,
    ...(divider ? { dividerShape: divider } : ready.dividerShape ? { dividerShape: ready.dividerShape } : {}),
    ...(backgroundVideo && !bgUrl ? { backgroundVideo } : {}),
    ...(!dropWash && (bgUrl || (backgroundImage && !stockBg))
      ? {
          backgroundImage: bgUrl || backgroundImage,
          backgroundSize: 'cover' as const,
          backgroundPosition: 'center',
          backgroundOpacity: backgroundOpacity ?? 1,
          backgroundAttachment: backgroundAttachment || 'scroll',
        }
      : {}),
  };
  // The phone layout follows the new desktop one.
  if (mobileHeight === undefined) {
    const { layouts, mobileHeight } = arrangeSlideForMobile(slide, elements.map((e) => ({ ...e, mobile: undefined })));
    slide = { ...slide, mobileHeight };
    return { slide, elements: elements.map((e) => ({ ...e, mobile: layouts.get(e.id) })) };
  }
  return { slide, elements };
};

// Photos in the page's mood (Eyad: a calm page gets calm photos, a lively one vivid photos): the
// mood's words are added to a search that lacks them, and the plain search is the fallback.
const moodPhoto = (photo: (q: string, shape?: PhotoShape) => Promise<string | null>, motion: boolean) => {
  const mood = motion ? 'vibrant' : 'soft light';
  return async (query: string, shape?: PhotoShape) => {
    const q = query.trim();
    if (/vibrant|vivid|bold|soft|muted|calm|minimal|dynamic/i.test(q)) return photo(q, shape);
    return (await photo(`${q} ${mood}`, shape)) || photo(q, shape);
  };
};

// Unsplash photos for the AI's English searches, a different photo each time a search repeats.
export type PhotoShape = 'wide' | 'tall' | 'square';
const photoFinder = () => {
  const cache = new Map<string, { url: string; id?: string; w: number; h: number }[]>();
  const taken = new Set<string>();
  return async (query: string, shape?: PhotoShape) => {
    const q = query.trim().toLowerCase();
    if (!cache.has(q)) {
      try {
        const res = await fetch(`/api/photos?${new URLSearchParams({ q, perPage: '8' })}`);
        const data = await res.json().catch(() => ({}));
        cache.set(q, res.ok && Array.isArray(data.items) ? data.items.filter((p: any) => p.fullUrl).map((p: any) => ({ url: p.fullUrl, id: p.unsplashId, w: Number(p.width) || 0, h: Number(p.height) || 0 })) : []);
      } catch {
        cache.set(q, []);
      }
    }
    const list = cache.get(q)!;
    if (!list.length) return null;
    // The result whose shape fits the place best, never one already used on the page (all used: start over).
    const fit = (p: { w: number; h: number }) => {
      if (!shape || !p.w || !p.h) return 1;
      const r = p.w / p.h;
      return shape === 'wide' ? (r >= 1.3 ? 0 : 1) : shape === 'tall' ? (r <= 0.85 ? 0 : 1) : r > 0.85 && r < 1.3 ? 0 : 1;
    };
    let fresh = list.filter((p) => !taken.has(p.url));
    if (!fresh.length) {
      list.forEach((p) => taken.delete(p.url));
      fresh = list;
    }
    const pick = [...fresh].sort((a, b) => fit(a) - fit(b))[0];
    taken.add(pick.url);
    if (pick.id) trackUnsplashDownload(undefined, pick.id);
    return pick.url;
  };
};

export interface BuildInput {
  maxPhotos?: number; // photos the gallery may hold (the package's)
  kind: BuildKind;
  answers: WeeAnswers;
  siteName: string;
  pages: Page[];
  elements: CanvasElement[];
  activePageId: string;
  later?: boolean; // a later page of the model: built beside the main page, the rest of the site left as it is
  ratings?: boolean; // the owner gets the model's «التقييمات» on this page (always, or ticked): the server says so
  targetPageId?: string; // build into this page, not the store's home
}
export type BuildResult = { ok: false; message: string } | { ok: true; pages: Page[]; elements: CanvasElement[]; pageId: string; firstSlideId: string; sections: number };

/** The page Wee AI would build (a store's home page, else the open page) emptied to one white slide. */
export const emptyMainPage = (kind: BuildKind, pages: Page[], elements: CanvasElement[], activePageId: string) => {
  const page = mainPageOf(kind, pages, activePageId);
  const old = new Set(page.slides.map((sl) => sl.id));
  const slide: Slide = { id: `${page.id}-blank-${Date.now().toString(36)}`, name: 'شريحة فارغة', height: 560, backgroundColor: '#ffffff', dividerShape: 'straight' };
  return {
    pages: pages.map((p) => (p.id === page.id ? { ...p, slides: [slide] } : p)),
    elements: elements.filter((el) => !old.has(el.slideId)),
    pageId: page.id,
    slideId: slide.id,
  };
};

/** The site with one more empty page after the others (its navbar the main page's), for a later page of the model to be built into. */
export const withBlankPage = (pages: Page[], fromPageId: string, name: string) => {
  const from = pages.find((p) => p.id === fromPageId) || pages[0];
  const id = `page-ai-${Date.now().toString(36)}-${pages.length}`;
  const page: Page = { id, name, slug: `/${id}`, navbar: { ...from.navbar }, slides: [{ id: `${id}-blank`, name: 'شريحة فارغة', height: 560, backgroundColor: '#ffffff' }] };
  return { pages: [...pages, page], pageId: id };
};

/** The «التقييمات» slide of a page whose owner ticked it: a title over the ratings box, in the page's colours. */
const ratingsSlide = (slideId: string, to: TargetColours, fonts: { head: string; body: string }): { slide: Slide; elements: CanvasElement[] } => {
  const tone = toneColours(to, 'tint');
  const base = { slideId, x: 140, width: 1000 };
  const elements: CanvasElement[] = [
    { ...base, id: `${slideId}-el-0`, name: 'عنوان التقييمات', type: 'heading', y: 48, height: 60, content: 'آراء زبائننا', styles: { fontSize: 32, fontWeight: 'bold', color: tone.ink, textAlign: 'center', fontFamily: fonts.head } } as CanvasElement,
    { ...base, id: `${slideId}-el-1`, name: 'التقييمات', type: 'ratings', y: 130, height: 380, content: 'التقييمات', ratingsAccentColor: to.accent, styles: { backgroundColor: to.card, borderRadius: 24 } } as CanvasElement,
  ];
  const slide: Slide = { id: slideId, name: 'التقييمات', height: 560, backgroundColor: tone.bg };
  const { layouts, mobileHeight } = arrangeSlideForMobile(slide, elements.map((e) => ({ ...e, mobile: undefined })));
  return { slide: { ...slide, mobileHeight }, elements: elements.map((e) => ({ ...e, mobile: layouts.get(e.id) })) };
};

/** The page built from a checked plan: the target page's slides replaced, the rest of the site recoloured for a store. */
export const buildPageFromPlan = async (plan: Plan, input: BuildInput, photo: (q: string) => Promise<string | null> = photoFinder()): Promise<BuildResult> => {
  const { kind, answers, pages } = input;
  const page = (input.targetPageId && pages.find((p) => p.id === input.targetPageId)) || mainPageOf(kind, pages, input.activePageId);
  // The page look Wee AI chose gives the fonts. The owner's colours are the page's (Eyad: the chosen
  // colours are the page colours); the look's colours only when the owner chose none, and then the
  // site is also kept in that look («ستايل الصفحة»), so a ready slide added later comes in it.
  const look = pageLookById(answers.aiAnswers?.lookId) || pageLookById(plan.look) || pageLookById(DEFAULT_LOOK[kind])!;
  const choice = ownersChoice(answers);
  const ownColours = choice ? choice.palette || ownerPalette(choice.accent, choice.second) : null;
  const colors: [string, string, string, string, string] = ownColours || [look.bg, look.card, look.line, look.ink, look.accent];
  const to = choice ? targetColours(colors, choice.accent) : lookColours(look);
  const fonts = { head: look.head, body: look.body };
  // The navbar the AI chose: its colours from the page's, its shape, pinned or moving with the page.
  const navTone = plan.navbar?.tone || 'light';
  const navColours =
    navTone === 'accent' ? { bg: to.accent, text: textOn(to.accent), accent: textOn(to.accent), accentText: to.accent }
    : navTone === 'dark' ? { bg: to.deep, text: textOn(to.deep), accent: to.accent, accentText: textOn(to.accent) }
    : navTone === 'tint' ? { bg: to.soft, text: to.ink, accent: to.accent, accentText: textOn(to.accent) }
    : { bg: to.card, text: to.ink, accent: to.accent, accentText: textOn(to.accent) };
  const navShape = {
    layout: plan.navbar?.layout || 'horizontal',
    isSticky: plan.navbar?.sticky ?? true,
    ...(plan.navbar?.layout === 'vertical' ? { sideWidth: 190 } : {}),
  };
  const stamp = Date.now().toString(36);
  const ctx: Context = {
    maxPhotos: input.maxPhotos ?? GALLERY_MAX,
    extra: plan.extra,
    kind,
    answers,
    facts: buildProfile(answers, input.siteName),
    slideIds: plan.sections.map((_, i) => `slide-ai-${stamp}-${i}`),
    pageIds: new Set(pages.map((p) => p.id)),
    contactIndex: plan.sections.findIndex((s) => s.section === 'contact'),
    photo: moodPhoto(photo, plan.motion),
    fallbackQuery: plan.sections.flatMap((s) => Object.values(s.images)).find((ref) => !ref.startsWith('user:')),
    services: ownerServices(answers.aiAnswers?.services),
    title: (answers.personalInfo?.pageName || '').trim() || [answers.personalInfo?.title, answers.personalInfo?.fullName].filter(Boolean).join(' ').trim(),
  };

  const built: { slide: Slide; elements: CanvasElement[] }[] = [];
  const builtSection: string[] = [];
  for (let i = 0; i < plan.sections.length; i++) {
    const b = await buildSlide(plan.sections[i], i, ctx, to, fonts, plan.motion);
    if (b) {
      built.push(b);
      builtSection.push(plan.sections[i].section);
    }
  }
  // The model's page has «التقييمات» for this owner (any kind of site): its slide comes before the contact and the terms at the end.
  if (input.ratings === true) {
    let at = built.length;
    while (at > 0 && ['contact', 'privacy'].includes(builtSection[at - 1])) at -= 1;
    built.splice(at, 0, ratingsSlide(`slide-ai-${stamp}-ratings`, to, fonts));
  }
  if (!built.length) return { ok: false, message: 'ما قدر Wee AI يبني الصفحة هالمرة. جرّب مرة ثانية.' };

  const oldSlides = new Set(page.slides.map((s) => s.id));
  const logo = answers.personalInfo?.logoUrl;
  // A store's other pages (menu, products, cart…) keep their layout and take the new colours and fonts.
  const restyle = kind !== 'free' && !input.later;
  // A page in a look («ستايل الصفحة») has that look's colours; the build gives it the owner's.
  const pageOf = new Map(pages.flatMap((p) => p.slides.map((s) => [s.id, p] as const)));
  const sceneFor = (aiTemplate: string | undefined, els: CanvasElement[], photoBg: boolean, slide?: Slide, p?: Page): RecolourScene => ({
    look: p ? slideSource(p, slide, kind, els) : lookOf(aiTemplate, kind, els),
    to,
    onPhoto: photoBg,
  });
  const otherSlides = new Map(pages.filter((p) => p.id !== page.id).flatMap((p) => p.slides.map((s) => [s.id, s] as const)));

  const nextPages = pages.map((p) => {
    // The navbar in the page's own card and text colours, on every page so they match.
    const navbar = {
      ...(restyle ? recolourDeep(p.navbar, sceneFor(undefined, [], false, undefined, p)) : p.navbar),
      ...navShape,
      bgColor: navColours.bg,
      textColor: navColours.text,
      accentColor: navColours.accent,
      accentTextColor: navColours.accentText,
      ...(logo ? { logoUrl: logo } : {}),
      ...(ctx.title ? { brandName: ctx.title } : {}),
    };
    if (p.id === page.id) return { ...p, slides: built.map((b) => b.slide), navbar, colorPalette: colors, styleLook: undefined, aiLook: look.id, ratingsSuggested: true };
    if (!restyle) return { ...p, navbar, aiLook: look.id };
    return {
      ...p,
      navbar,
      colorPalette: colors,
      styleLook: undefined,
      aiLook: look.id,
      slides: p.slides.map((s) => ({ ...s, backgroundColor: s.backgroundColor && recolourDeep(s.backgroundColor, sceneFor(s.aiTemplate, [], !!s.backgroundImage, s, p), 'fill') })),
    };
  });

  const others = input.elements.filter((e) => !oldSlides.has(e.slideId));
  const bySlide = new Map<string, CanvasElement[]>();
  others.forEach((e) => bySlide.set(e.slideId, [...(bySlide.get(e.slideId) || []), e]));
  const restyled = restyle
    ? others.map((e) => {
        const s = otherSlides.get(e.slideId);
        if (!s) return e;
        const slideEls = bySlide.get(e.slideId)!;
        const next = recolourDeep(e, sceneFor(s.aiTemplate, slideEls, !!s.backgroundImage, s, pageOf.get(e.slideId)));
        const head = slideEls.find((x) => x.type === 'heading' && x.styles?.fontFamily)?.styles.fontFamily;
        if (next.styles?.fontFamily) next.styles = { ...next.styles, fontFamily: next.styles.fontFamily === head ? fonts.head : fonts.body };
        return next;
      })
    : others;

  const allElements = [...restyled, ...built.flatMap((b) => b.elements)];
  // No colour of the owner's: the whole site in the chosen look, its buttons and cards too.
  const site = choice ? { pages: nextPages, elements: allElements } : applyPageLook(nextPages.map((p) => ({ ...p, styleLook: look.id })), allElements, look, kind, { corners: true, keepNavbar: true });
  return {
    ok: true,
    pages: site.pages,
    elements: site.elements,
    pageId: page.id,
    firstSlideId: built[0].slide.id,
    sections: built.length,
  };
};

// ---------- «تصميم حر» ----------

export type FreeTurnResult = { ok: true; reply: string; design: FreeDesign; changed: string[] } | { ok: false; message: string };

/** One chat turn of the free design: the message (with the page so far) goes to the server, which answers with the whole design. */
export const requestFreeTurn = async (
  kind: BuildKind,
  profile: Record<string, string>,
  o: { message: string; current: FreeDesign | null; history: { role: 'user' | 'ai'; text: string }[]; structure?: string[]; project?: string },
): Promise<FreeTurnResult> => {
  const user = auth.currentUser;
  if (!user) return { ok: false, message: 'سجّل الدخول أولاً حتى يصمم Wee AI صفحتك.' };
  try {
    const res = await fetch('/api/build-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify({ mode: 'free', kind, profile, project: o.project, message: o.message, current: o.current, history: o.history, structure: o.structure }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data.design?.sections)) {
      if (data.usage) console.info('Wee AI free design tokens:', data.usage);
      return { ok: true, reply: String(data.reply || ''), design: data.design, changed: Array.isArray(data.changed) ? data.changed : [] };
    }
    if (data.error === 'not_configured') return { ok: false, message: 'Wee AI غير مفعّل بعد على الخادم (ينقصه مفتاح الذكاء الاصطناعي).' };
    if (data.error === 'no_profile') return { ok: false, message: 'اكتب وصف عملك أو اختر تصنيفه بالأسئلة أولاً.' };
    if (res.status === 401) return { ok: false, message: 'انتهت جلسة الدخول. سجّل الدخول من جديد وجرّب مرة ثانية.' };
    return { ok: false, message: failureMessage(res.status, data) };
  } catch {
    return { ok: false, message: 'ما في اتصال بالإنترنت أو الخادم ما رد. جرّب بعد شوي.' };
  }
};

/** The free design laid on the page Wee AI builds on (as «ابن صفحتي»): that page's slides are replaced, the rest of the site stays. */
export const applyFreeDesign = async (design: FreeDesign, input: { kind: BuildKind; answers: WeeAnswers; siteName: string; pages: Page[]; elements: CanvasElement[]; activePageId: string }, photo: (q: string) => Promise<string | null> = photoFinder()) => {
  const { kind, answers, pages } = input;
  const page = mainPageOf(kind, pages, input.activePageId);
  const stamp = Date.now().toString(36);
  const ids = design.sections.map((sec) => `slide-ai-${stamp}-${sec.key}`);
  const ctx = { facts: buildProfile(answers, input.siteName), slideIds: ids, pageIds: new Set(pages.map((p) => p.id)) } as unknown as Context;
  const searches = new Map<string, string | null>();
  const wanted = new Set<string>();
  design.sections.forEach((sec) => {
    if (sec.photo) wanted.add(sec.photo);
    sec.elements.forEach((e) => e.photo && wanted.add(e.photo));
  });
  for (const q of wanted) searches.set(q, await photo(q));
  const built = freeToBuilt(design, { idPrefix: `slide-ai-${stamp}`, photoUrl: (q) => searches.get(q) || undefined, linkFor: (l) => resolveLink(l, ctx) as any });
  if (!built.slides.length) return { ok: false as const, message: 'ما قدر Wee AI يصمم الصفحة هالمرة. جرّب مرة ثانية.' };
  const old = new Set(page.slides.map((sl) => sl.id));
  return {
    ok: true as const,
    pages: pages.map((p) => (p.id === page.id ? { ...p, slides: built.slides } : p)),
    elements: [...input.elements.filter((e) => !old.has(e.slideId)), ...built.elements],
    pageId: page.id,
    firstSlideId: built.slides[0].id,
    sections: built.slides.length,
  };
};

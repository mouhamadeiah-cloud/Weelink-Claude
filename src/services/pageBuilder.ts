// «ابن صفحتي»: Wee AI builds the page from the owner's answers. The server function
// /api/build-page asks Gemini for a plan (a ready slide for each section, with its texts, links,
// photos and the palette and fonts) and checks it against the designer constitution; here the plan
// becomes slides and elements: the ready slides recoloured to the palette, their slots filled,
// what the owner did not give (a phone number, an address, a price) taken off the page with the
// icons and lines that belonged to it.
import { auth } from './firebase';
import type { CanvasElement, Page, Slide } from '../types';
import { businessFacts, type WeeAnswers } from './weeWriter';
import { trackUnsplashDownload } from './unsplashService';
import { WEE_COLOR_CHOICES } from '../data/weeColorChoices';
import { WEE_SLIDE_BY_ID } from '../data/weeSlideTemplates';
import { getSlideTemplatePayload } from '../data/slideTemplates';
import { STORE_SLIDE_IDS } from '../data/storeSlideAi';
import { TWENTY_PAGE_PALETTES } from '../data/palettes';
import { REST_PAGE_IDS } from '../data/restaurantTemplate';
import { CAR_PAGE_IDS } from '../data/carShowroomTemplate';
import { lookOf, recolourDeep, targetColours, textOn, type RecolourScene, type TargetColours } from '../utils/pageRecolour';
import type { ProjectType } from '../components/shop/shopTypes';

export type BuildKind = 'free' | 'restaurant' | 'shop' | 'cars';
export const KIND_OF_PROJECT: Record<ProjectType, BuildKind> = { page: 'free', restaurant: 'restaurant', shop: 'shop', cars: 'cars' };

// As api/build-page.ts returns it.
export interface PlannedSection {
  section: string;
  template: string;
  slots: Record<string, string>;
  links: Record<string, string>;
  images: Record<string, string>;
  motion: boolean;
}
export interface Plan {
  palette: string;
  fonts: string;
  accentColor?: string;
  sections: PlannedSection[];
}

const FONT_PAIRS: Record<string, { head: string; body: string }> = {
  'messiri-tajawal': { head: 'El Messiri', body: 'Tajawal' },
  'amiri-plex': { head: 'Amiri', body: 'IBM Plex Sans Arabic' },
  'alexandria-almarai': { head: 'Alexandria', body: 'Almarai' },
  'cairo-cairo': { head: 'Cairo', body: 'Cairo' },
};

// The Wee AI divider answer as the editor's slide edge.
const DIVIDERS: Record<string, Slide['dividerShape']> = { straight: 'straight', wave: 'wave', sine: 'double-wave', curved: 'curve-down' };

// The pages a button may open, by the kind of page the AI named.
const PAGE_TARGETS: Record<string, string[]> = {
  menu: [REST_PAGE_IDS.menu],
  products: ['shop-page-products'],
  cars: [CAR_PAGE_IDS.showroom],
  cart: [REST_PAGE_IDS.cart, 'shop-page-cart'],
  contact: [REST_PAGE_IDS.contact, 'shop-page-contact', CAR_PAGE_IDS.contact],
};
const HOME_PAGE: Record<BuildKind, string | null> = { free: null, restaurant: REST_PAGE_IDS.home, shop: 'shop-page-home', cars: CAR_PAGE_IDS.home };

/** The owner's colour as a hex: the custom one, or the first colour of the named choice. */
const ownersColour = (a: WeeAnswers) => {
  const ai = a.aiAnswers || {};
  const custom = /#[0-9a-f]{6}/i.exec(`${ai.customColor || ''} ${ai.colorPalette || ''}`)?.[0];
  if (custom) return custom;
  return WEE_COLOR_CHOICES.find((c) => c.name === ai.colorPalette)?.colors[0] || '';
};

/** What the server and Gemini get: the facts the writer uses plus the look the owner asked for. */
export const buildProfile = (a: WeeAnswers, siteName: string): Record<string, string> => {
  const ai = a.aiAnswers || {};
  const extra: Record<string, string> = {
    اللون_المفضل: ai.colorPalette || '',
    اللون_المفضل_رمز: ownersColour(a),
    الفواصل: ai.dividerStyle || '',
    الحركة: ai.motionEffects || '',
  };
  return { ...businessFacts(a, siteName), ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v)) };
};

const galleryOf = (a: WeeAnswers) => (a.aiAnswers?.wantsGallery === false ? [] : (a.aiAnswers?.galleryImages || []).filter(Boolean).slice(0, 5));

export const pageAssets = (a: WeeAnswers) => ({
  heroBg: !!a.aiAnswers?.heroBgImage,
  gallery: galleryOf(a).length,
  logo: !!a.personalInfo?.logoUrl,
});

export type PlanResult = { ok: true; plan: Plan } | { ok: false; message: string };

export const requestPagePlan = async (kind: BuildKind, profile: Record<string, string>, assets: ReturnType<typeof pageAssets>): Promise<PlanResult> => {
  const user = auth.currentUser;
  if (!user) return { ok: false, message: 'سجّل الدخول أولاً حتى يبني Wee AI صفحتك.' };
  try {
    const res = await fetch('/api/build-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify({ kind, profile, assets }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data.plan?.sections)) return { ok: true, plan: data.plan };
    if (data.error === 'not_configured') return { ok: false, message: 'Wee AI غير مفعّل بعد على الخادم (ينقصه مفتاح الذكاء الاصطناعي).' };
    if (data.error === 'no_profile') return { ok: false, message: 'اكتب وصف عملك أو اختر تصنيفه بالأسئلة أولاً.' };
    if (res.status === 401) return { ok: false, message: 'انتهت جلسة الدخول. سجّل الدخول من جديد وجرّب مرة ثانية.' };
    return { ok: false, message: 'ما قدر Wee AI يبني الصفحة هالمرة. جرّب بعد شوي.' };
  } catch {
    return { ok: false, message: 'ما في اتصال بالإنترنت أو الخادم ما رد. جرّب بعد شوي.' };
  }
};

// ---------- Building ----------

type Draft = Omit<CanvasElement, 'id' | 'slideId'> & { id?: string; slideId?: string };

/** A ready slide by its AI id, fresh. */
export const readySlide = (template: string): (Record<string, any> & { elements: Draft[] }) | null => {
  if (WEE_SLIDE_BY_ID[template]) return JSON.parse(JSON.stringify(WEE_SLIDE_BY_ID[template]()));
  for (const [kind, ids] of Object.entries(STORE_SLIDE_IDS)) {
    const i = ids.indexOf(template);
    if (i >= 0) return JSON.parse(JSON.stringify(getSlideTemplatePayload(kind, i, '')));
  }
  return null;
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

const SYSTEM = /^(phone|whatsapp|address|hours)\.(label|value)$/;
const IMAGE = /^(image|avatar|photos\.\d+)$/;
// The first part of a list item: without it the item's other parts go too.
const ITEM_HEAD = /^(.*\.\d+)\.(name|title|number)$/;

interface Context {
  kind: BuildKind;
  answers: WeeAnswers;
  facts: Record<string, string>;
  slideIds: string[];
  pageIds: Set<string>;
  contactIndex: number;
  photo: (query: string) => Promise<string | null>;
  fallbackQuery?: string; // the AI's first photo search, for a photo it left without one
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

const imageFor = async (ref: string | undefined, ctx: Context): Promise<string | null> => {
  if (!ref) return null;
  const a = ctx.answers;
  if (ref === 'user:heroBg') return a.aiAnswers?.heroBgImage || null;
  if (ref === 'user:logo') return a.personalInfo?.logoUrl || null;
  const g = /^user:gallery:(\d)$/.exec(ref);
  if (g) return galleryOf(a)[+g[1] - 1] || null;
  return ctx.photo(ref);
};

/** One planned section as a slide and its elements. */
const buildSlide = async (section: PlannedSection, index: number, ctx: Context, to: TargetColours, fonts: { head: string; body: string }) => {
  const ready = readySlide(section.template);
  if (!ready) return null;
  const slideId = ctx.slideIds[index];
  const { elements: drafts, aiTemplate, name, height, mobileHeight, backgroundColor, backgroundImage, backgroundVideo, backgroundOpacity, backgroundAttachment } = ready;
  const look = lookOf(aiTemplate, ctx.kind, drafts);
  const removed = new Set<number>();
  const els: Draft[] = drafts.map((e) => ({ ...e }));
  const value = (k: string) => (section.slots[k] || '').trim();
  const facts = ctx.facts;
  const systemValue: Record<string, string> = { phone: facts['هاتف'] || '', whatsapp: facts['واتساب'] || '', address: facts['العنوان'] || '', hours: '' };

  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    const key = el.aiSlot;
    if (!key) continue;
    const sys = SYSTEM.exec(key);
    if (sys) {
      const v = systemValue[sys[1]];
      if (!v) removed.add(i);
      else if (sys[2] === 'value') el.content = escapeHtml(v);
      continue;
    }
    if (key === 'map') {
      if (!systemValue.address) removed.add(i);
      else Object.assign(el, { content: systemValue.address, mapLocation: systemValue.address });
      continue;
    }
    if (key === 'form') continue;
    if (IMAGE.test(key) || el.type === 'image') {
      const url = (await imageFor(section.images[key], ctx)) || (ctx.fallbackQuery && !key.startsWith('photos.') ? await ctx.photo(ctx.fallbackQuery) : null);
      if (url) Object.assign(el, { content: url, imageUrl: url });
      // The example photos belong to the example business: a gallery frame with no photo of
      // this one goes with its caption, a main photo keeps the example only when no search worked.
      else if (key.startsWith('photos.')) {
        removed.add(i);
        els.forEach((c, j) => c.aiSlot === `caption.${key.split('.')[1]}` && removed.add(j));
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
    if (text) el.content = escapeHtml(text);
    if (el.type === 'button' && key !== 'eyebrow') {
      const link = resolveLink(section.links[key], ctx);
      if (key !== 'send') Object.assign(el, link || defaultLink(el, index, ctx));
    }
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

  // Fonts: the design's heading font becomes the chosen heading font, every other font the text font.
  const headFont = els.find((e) => e.type === 'heading' && e.styles?.fontFamily)?.styles.fontFamily || look.head;
  const scene: RecolourScene = { look, to, onPhoto: !!(backgroundImage || backgroundVideo) };
  const kept = els.filter((_, i) => !removed.has(i));
  const elements: CanvasElement[] = kept.map((draft, j) => {
    let el = recolourDeep(draft, scene) as Draft;
    const styles = { ...el.styles };
    if (styles.fontFamily) styles.fontFamily = styles.fontFamily === headFont ? fonts.head : fonts.body;
    if ((el.type === 'button' || el.type === 'badge') && styles.backgroundColor?.toLowerCase() === to.accent.toLowerCase()) styles.color = textOn(to.accent);
    if (!section.motion && (styles.animationTrigger === 'once' || styles.animationTrigger === 'loop')) {
      delete styles.animation;
      delete styles.animationTrigger;
    }
    el = { ...el, styles };
    return { ...el, id: `${slideId}-el-${j}`, slideId } as CanvasElement;
  });

  // A faint photo wash fades the slide colour with it, to near white: on a dark palette it goes.
  const wash = (backgroundOpacity ?? 1) < 0.5;
  const dropWash = wash && to.deep === to.bg;
  const bgUrl = dropWash ? null : await imageFor(section.images.background, ctx);
  const divider = DIVIDERS[ctx.answers.aiAnswers?.dividerStyle || ''];
  const slide: Slide = {
    id: slideId,
    name,
    height,
    ...(mobileHeight ? { mobileHeight } : {}),
    backgroundColor: recolourDeep(backgroundColor, scene, 'fill'),
    aiTemplate,
    ...(divider ? { dividerShape: divider } : ready.dividerShape ? { dividerShape: ready.dividerShape } : {}),
    ...(backgroundVideo && !bgUrl ? { backgroundVideo } : {}),
    ...(!dropWash && (bgUrl || backgroundImage)
      ? {
          backgroundImage: bgUrl || backgroundImage,
          backgroundSize: 'cover' as const,
          backgroundPosition: 'center',
          backgroundOpacity: backgroundOpacity ?? 1,
          backgroundAttachment: backgroundAttachment || 'scroll',
        }
      : {}),
  };
  return { slide, elements };
};

// Unsplash photos for the AI's English searches, a different photo each time a search repeats.
const photoFinder = () => {
  const cache = new Map<string, { url: string; id?: string }[]>();
  const used = new Map<string, number>();
  return async (query: string) => {
    const q = query.trim().toLowerCase();
    if (!cache.has(q)) {
      try {
        const res = await fetch(`/api/photos?${new URLSearchParams({ q, perPage: '8' })}`);
        const data = await res.json().catch(() => ({}));
        cache.set(q, res.ok && Array.isArray(data.items) ? data.items.filter((p: any) => p.fullUrl).map((p: any) => ({ url: p.fullUrl, id: p.unsplashId })) : []);
      } catch {
        cache.set(q, []);
      }
    }
    const list = cache.get(q)!;
    if (!list.length) return null;
    const n = used.get(q) || 0;
    used.set(q, n + 1);
    const pick = list[n % list.length];
    if (pick.id) trackUnsplashDownload(undefined, pick.id);
    return pick.url;
  };
};

export interface BuildInput {
  kind: BuildKind;
  answers: WeeAnswers;
  siteName: string;
  pages: Page[];
  elements: CanvasElement[];
  activePageId: string;
}
export type BuildResult = { ok: false; message: string } | { ok: true; pages: Page[]; elements: CanvasElement[]; pageId: string; firstSlideId: string; sections: number };

/** The page built from a checked plan: the target page's slides replaced, the rest of the site recoloured for a store. */
export const buildPageFromPlan = async (plan: Plan, input: BuildInput, photo: (q: string) => Promise<string | null> = photoFinder()): Promise<BuildResult> => {
  const { kind, answers, pages } = input;
  const home = HOME_PAGE[kind];
  const page = pages.find((p) => p.id === (home && pages.some((x) => x.id === home) ? home : input.activePageId)) || pages[0];
  const palette = TWENTY_PAGE_PALETTES.find((p) => p.id === plan.palette) || TWENTY_PAGE_PALETTES[0];
  const to = targetColours(palette.colors, plan.accentColor);
  const fonts = FONT_PAIRS[plan.fonts] || FONT_PAIRS['messiri-tajawal'];
  const stamp = Date.now().toString(36);
  const ctx: Context = {
    kind,
    answers,
    facts: buildProfile(answers, input.siteName),
    slideIds: plan.sections.map((_, i) => `slide-ai-${stamp}-${i}`),
    pageIds: new Set(pages.map((p) => p.id)),
    contactIndex: plan.sections.findIndex((s) => s.section === 'contact' || s.section === 'order' || s.section === 'request'),
    photo,
    fallbackQuery: plan.sections.flatMap((s) => Object.values(s.images)).find((ref) => !ref.startsWith('user:')),
  };

  const built: { slide: Slide; elements: CanvasElement[] }[] = [];
  for (let i = 0; i < plan.sections.length; i++) {
    const b = await buildSlide(plan.sections[i], i, ctx, to, fonts);
    if (b) built.push(b);
  }
  if (!built.length) return { ok: false, message: 'ما قدر Wee AI يبني الصفحة هالمرة. جرّب مرة ثانية.' };

  const oldSlides = new Set(page.slides.map((s) => s.id));
  const logo = answers.personalInfo?.logoUrl;
  // A store's other pages (menu, products, cart…) keep their layout and take the new colours and fonts.
  const restyle = kind !== 'free';
  const sceneFor = (aiTemplate: string | undefined, els: CanvasElement[], photoBg: boolean): RecolourScene => ({ look: lookOf(aiTemplate, kind, els), to, onPhoto: photoBg });
  const otherSlides = new Map(pages.filter((p) => p.id !== page.id).flatMap((p) => p.slides.map((s) => [s.id, s] as const)));

  const nextPages = pages.map((p) => {
    // The navbar in the page's own card and text colours, on every page so they match.
    const navbar = { ...(restyle ? recolourDeep(p.navbar, sceneFor(undefined, [], false)) : p.navbar), bgColor: to.card, textColor: to.ink, ...(logo ? { logoUrl: logo } : {}) };
    if (p.id === page.id) return { ...p, slides: built.map((b) => b.slide), navbar, colorPalette: palette.colors };
    if (!restyle) return { ...p, navbar };
    return {
      ...p,
      navbar,
      colorPalette: palette.colors,
      slides: p.slides.map((s) => ({ ...s, backgroundColor: s.backgroundColor && recolourDeep(s.backgroundColor, sceneFor(s.aiTemplate, [], !!s.backgroundImage), 'fill') })),
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
        const next = recolourDeep(e, sceneFor(s.aiTemplate, slideEls, !!s.backgroundImage));
        const head = slideEls.find((x) => x.type === 'heading' && x.styles?.fontFamily)?.styles.fontFamily;
        if (next.styles?.fontFamily) next.styles = { ...next.styles, fontFamily: next.styles.fontFamily === head ? fonts.head : fonts.body };
        return next;
      })
    : others;

  return {
    ok: true,
    pages: nextPages,
    elements: [...restyled, ...built.flatMap((b) => b.elements)],
    pageId: page.id,
    firstSlideId: built[0].slide.id,
    sections: built.length,
  };
};

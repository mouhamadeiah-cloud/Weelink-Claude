// «ابن صفحتي»: Wee AI builds the page from the owner's answers. The server function
// /api/build-page asks Gemini for a plan (a ready slide for each section, with its texts, links,
// photos and the palette and fonts) and checks it against the designer constitution; here the plan
// becomes slides and elements: the ready slides recoloured to the palette, their slots filled,
// what the owner did not give (a phone number, an address, a price) taken off the page with the
// icons and lines that belonged to it.
import { auth } from './firebase';
import type { CanvasElement, Page, Slide } from '../types';
import { businessFacts, ownerServices, type WeeAnswers } from './weeWriter';
import { trackUnsplashDownload } from './unsplashService';
import { WEE_COLOR_CHOICES } from '../data/weeColorChoices';
import { WEE_SLIDE_BY_ID } from '../data/weeSlideTemplates';
import { getSlideTemplatePayload } from '../data/slideTemplates';
import { STORE_SLIDE_IDS } from '../data/storeSlideAi';
import { TWENTY_PAGE_PALETTES } from '../data/palettes';
import { REST_PAGE_IDS } from '../data/restaurantTemplate';
import { CAR_PAGE_IDS } from '../data/carShowroomTemplate';
import { lookOf, ownerPalette, recolourDeep, targetColours, textOn, toneColours, type RecolourScene, type TargetColours } from '../utils/pageRecolour';
import { fitTexts, fitTextsPhone, listItems, reflowList, type FlexEl } from '../utils/flexLayout';
import { arrangeSlideForMobile } from '../utils/mobileLayout';
import type { ProjectType } from '../components/shop/shopTypes';

export type BuildKind = 'free' | 'restaurant' | 'shop' | 'cars';
export const KIND_OF_PROJECT: Record<ProjectType, BuildKind> = { page: 'free', restaurant: 'restaurant', shop: 'shop', cars: 'cars' };

// As api/build-page.ts returns it.
export interface PlannedSection {
  section: string;
  template: string;
  tone: 'light' | 'tint' | 'dark';
  slots: Record<string, string>; // single slots and list items (points.3.title …)
  icons: Record<string, string>; // points.0.icon → mdi:…
  links: Record<string, string>;
  images: Record<string, string>;
  entrance: string; // an editor animation, or 'none'
}
export interface Plan {
  palette: string;
  fonts: string;
  accentColor?: string;
  motion: boolean;
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

// The owner's colour choice (Wee AI step 6): a named choice gives its accent and second colour,
// «مخصص» the colour picked by hand. Nothing when the owner left the question.
const ownersChoice = (a: WeeAnswers): { accent: string; second?: string } | null => {
  const ai = a.aiAnswers || {};
  if ((ai.colorPalette || '').startsWith('مخصص')) {
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

const galleryOf = (a: WeeAnswers) => (a.aiAnswers?.wantsGallery === false ? [] : (a.aiAnswers?.galleryImages || []).filter(Boolean).slice(0, 5));

export const pageAssets = (a: WeeAnswers) => ({
  heroBg: !!a.aiAnswers?.heroBgImage,
  gallery: galleryOf(a).length,
  logo: !!a.personalInfo?.logoUrl,
});

export type PlanResult = { ok: true; plan: Plan } | { ok: false; message: string };

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
    if (res.ok && Array.isArray(data.plan?.sections)) {
      // The tokens this build used, for working out its cost (browser console).
      if (data.usage) console.info('Wee AI build tokens:', data.usage);
      return { ok: true, plan: data.plan };
    }
    if (data.error === 'not_configured') return { ok: false, message: 'Wee AI غير مفعّل بعد على الخادم (ينقصه مفتاح الذكاء الاصطناعي).' };
    if (data.error === 'no_profile') return { ok: false, message: 'اكتب وصف عملك أو اختر تصنيفه بالأسئلة أولاً.' };
    if (res.status === 401) return { ok: false, message: 'انتهت جلسة الدخول. سجّل الدخول من جديد وجرّب مرة ثانية.' };
    return { ok: false, message: failureMessage(res.status, data) };
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

const imageFor = async (ref: string | undefined, ctx: Context): Promise<string | null> => {
  if (!ref) return null;
  const a = ctx.answers;
  if (ref === 'user:heroBg') return a.aiAnswers?.heroBgImage || null;
  if (ref === 'user:logo') return a.personalInfo?.logoUrl || null;
  const g = /^user:gallery:(\d)$/.exec(ref);
  if (g) return galleryOf(a)[+g[1] - 1] || null;
  return ctx.photo(ref);
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
  const ready = readySlide(planned.template);
  if (!ready) return null;
  const slideId = ctx.slideIds[index];
  const { aiTemplate, name, backgroundColor, backgroundImage, backgroundVideo, backgroundOpacity, backgroundAttachment } = ready;
  let height: number = ready.height;
  const templateKeys = ready.elements.map((e) => e.aiSlot).filter(Boolean) as string[];
  const section = withServices(planned, ctx.services, templateKeys);
  const { slots, icons, counts } = compactLists(section);
  // The page's name heads its first section (Eyad: the name is the page's title).
  if (section.section === 'intro' && templateKeys.includes('title') && ctx.title) slots.title = ctx.title;

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
  const value = (k: string) => (slots[k] || '').trim();
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
      else if (sys[2] === 'value') {
        el.content = escapeHtml(v);
        filled.add(i);
      }
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
    if (text) {
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
  const grew = new Set(kept.filter((el) => filled.has(els.indexOf(el))));
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
    if (!motion) {
      if (styles.animationTrigger === 'once' || styles.animationTrigger === 'loop') {
        delete styles.animation;
        delete styles.animationTrigger;
      }
    } else if (section.section === 'intro' && j === firstButton) {
      // The page's main call to action keeps pulsing on a lively page.
      Object.assign(styles, { animation: 'pulse', animationTrigger: 'loop', animationDuration: 2 });
    } else if (ANIMATED.test(section.entrance) && styles.animationTrigger !== 'loop' && !el.isGroupContainer && el.width < 1280 * 0.7) {
      Object.assign(styles, { animation: section.entrance, animationTrigger: 'once', animationDuration: 0.8 });
    }
    el = { ...el, styles };
    return { ...el, id: `${slideId}-el-${j}`, slideId } as CanvasElement;
  });

  // A faint photo wash fades the slide colour with it, to near white: on a dark section it goes.
  const wash = (backgroundOpacity ?? 1) < 0.5;
  const dropWash = wash && to.deep === to.bg;
  const bgUrl = dropWash ? null : await imageFor(section.images.background, ctx);
  const divider = DIVIDERS[ctx.answers.aiAnswers?.dividerStyle || ''];
  let slide: Slide = {
    id: slideId,
    name,
    height,
    ...(mobileHeight !== undefined ? { mobileHeight } : {}),
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
const moodPhoto = (photo: (q: string) => Promise<string | null>, motion: boolean) => {
  const mood = motion ? 'vibrant' : 'soft light';
  return async (query: string) => {
    const q = query.trim();
    if (/vibrant|vivid|bold|soft|muted|calm|minimal|dynamic/i.test(q)) return photo(q);
    return (await photo(`${q} ${mood}`)) || photo(q);
  };
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
  // The owner's colours are the page's (Eyad: the chosen colours are the page colours); the AI's
  // palette only when the owner chose none.
  const choice = ownersChoice(answers);
  const ownColours = choice ? ownerPalette(choice.accent, choice.second) : null;
  const palette = TWENTY_PAGE_PALETTES.find((p) => p.id === plan.palette) || TWENTY_PAGE_PALETTES[0];
  const colors = ownColours || palette.colors;
  const to = targetColours(colors, choice ? choice.accent : plan.accentColor);
  const fonts = FONT_PAIRS[plan.fonts] || FONT_PAIRS['messiri-tajawal'];
  const stamp = Date.now().toString(36);
  const ctx: Context = {
    kind,
    answers,
    facts: buildProfile(answers, input.siteName),
    slideIds: plan.sections.map((_, i) => `slide-ai-${stamp}-${i}`),
    pageIds: new Set(pages.map((p) => p.id)),
    contactIndex: plan.sections.findIndex((s) => s.section === 'contact' || s.section === 'order' || s.section === 'request'),
    photo: moodPhoto(photo, plan.motion),
    fallbackQuery: plan.sections.flatMap((s) => Object.values(s.images)).find((ref) => !ref.startsWith('user:')),
    services: ownerServices(answers.aiAnswers?.services),
    title: (answers.personalInfo?.pageName || '').trim() || [answers.personalInfo?.title, answers.personalInfo?.fullName].filter(Boolean).join(' ').trim(),
  };

  const built: { slide: Slide; elements: CanvasElement[] }[] = [];
  for (let i = 0; i < plan.sections.length; i++) {
    const b = await buildSlide(plan.sections[i], i, ctx, to, fonts, plan.motion);
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
    const navbar = {
      ...(restyle ? recolourDeep(p.navbar, sceneFor(undefined, [], false)) : p.navbar),
      bgColor: to.card,
      textColor: to.ink,
      ...(logo ? { logoUrl: logo } : {}),
      ...(ctx.title ? { brandName: ctx.title } : {}),
    };
    if (p.id === page.id) return { ...p, slides: built.map((b) => b.slide), navbar, colorPalette: colors };
    if (!restyle) return { ...p, navbar };
    return {
      ...p,
      navbar,
      colorPalette: colors,
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

// Writes src/data/ai/buildCatalog.json: the ready slides «ابن صفحتي» may use, with their slots and
// character limits, read from the slide templates themselves so the two never drift apart.
// The server function api/build-page.ts sends it to Gemini and checks Gemini's answer against it.
//
//   npm run ai-catalog      (after changing a ready slide's texts or slots)

import { writeFileSync } from 'node:fs';
import { WEE_SLIDE_BY_ID } from '../src/data/weeSlideTemplates';
import { getSlideTemplatePayload } from '../src/data/slideTemplates';
import { STORE_SLIDE_IDS } from '../src/data/storeSlideAi';
import { TWENTY_PAGE_PALETTES } from '../src/data/palettes';

type Kind = 'free' | 'restaurant' | 'shop' | 'cars';

// Filled by Weelink from the owner's answers, never by the AI.
const SYSTEM_SLOTS = /^(phone|whatsapp|address|hours)\.(label|value)$|^(map|form)$/;
const IMAGE_SLOTS = /^(image|avatar|photos\.\d+)$/;

// Generous room: the builder grows a box (and moves what is under it) to fit a longer text, so the
// limits only keep texts to a sensible length for their part of the design.
const LIMITS: Record<string, number> = {
  title: 60, eyebrow: 40, sub: 240, text: 520, note: 120, quote: 220, owner: 40, role: 50, ticker: 160,
  name: 40, desc: 100, price: 20, unit: 20, number: 8, label: 40, features: 50, caption: 40, chips: 32,
};
// A list item's parts are shorter than the section's own.
const LIST_LIMITS: Record<string, number> = { title: 40, text: 180, name: 40, desc: 100, price: 20, unit: 20, number: 8, label: 40, '': 32 };
const limitFor = (path: string, type: string) => {
  if (type === 'button') return 24;
  const list = /^(?:chips|facts|points|items|packages)\.\d+(?:\.([a-z]+))?$/.exec(path);
  if (list) return LIST_LIMITS[list[1] || ''] ?? 60;
  const parts = path.split('.').filter((p) => !/^\d+$/.test(p));
  return LIMITS[parts[parts.length - 1]] ?? LIMITS[parts[0]] ?? (type === 'heading' ? 60 : 200);
};

// Lists the AI may make longer or shorter (the builder lays out the items like the example's):
// chips.N, facts.N.number, points.N.title … One level only; packages' features and price groups'
// rows keep the example's number of places.
const LIST = /^(chips|facts|points|items|packages)\.(\d+)(?:\.([a-z]+))?$/;
const LIST_MAX = 8;

interface SlotSpec {
  max?: number;
  kind: 'text' | 'button' | 'image';
}
interface ListSpec {
  count: number; // in the example
  fields: Record<string, number | 'icon'>; // field ('' for a bare chip) → its character limit
}

const describe = (slide: { name: string; elements: any[]; backgroundImage?: string; backgroundVideo?: string }) => {
  const slots: Record<string, SlotSpec> = {};
  const lists: Record<string, ListSpec> = {};
  for (const el of slide.elements) {
    const path: string | undefined = el.aiSlot;
    if (!path || SYSTEM_SLOTS.test(path)) continue;
    const list = LIST.exec(path);
    if (list) {
      const [, name, index, field = ''] = list;
      const spec = (lists[name] ||= { count: 0, fields: {} });
      spec.count = Math.max(spec.count, +index + 1);
      spec.fields[field] = limitFor(path, el.type);
      continue;
    }
    if (IMAGE_SLOTS.test(path) || el.type === 'image') {
      slots[path] = { kind: 'image' };
      continue;
    }
    const kind = el.type === 'button' ? 'button' : 'text';
    slots[path] = { kind, max: limitFor(path, el.type) };
  }
  // A card with one icon on it: the AI picks the icon.
  for (const [name, spec] of Object.entries(lists)) {
    const first = slide.elements.filter((e) => (e.aiSlot || '').startsWith(`${name}.0`));
    const card = slide.elements.find((c) => c.isGroupContainer && first.length && first.every((e) => e.x >= c.x && e.y >= c.y && e.x + e.width <= c.x + c.width && e.y + e.height <= c.y + c.height));
    const icons = card ? slide.elements.filter((e) => e.type === 'icon' && e.x >= card.x && e.y >= card.y && e.x + e.width <= card.x + card.width && e.y + e.height <= card.y + card.height) : [];
    if (icons.length === 1) spec.fields.icon = 'icon';
  }
  if (slide.backgroundImage || slide.backgroundVideo) slots.background = { kind: 'image' };
  return { name: slide.name, slots, lists };
};

const templates: Record<string, ReturnType<typeof describe>> = {};
for (const [id, make] of Object.entries(WEE_SLIDE_BY_ID)) templates[id] = describe(make());
for (const [kind, ids] of Object.entries(STORE_SLIDE_IDS)) {
  ids.forEach((id, i) => {
    templates[id] = describe(getSlideTemplatePayload(kind, i, '') as any);
  });
}

const HERO = ['hero.cover', 'hero.split', 'hero.band'];
const ABOUT = ['about.story', 'about.quote', 'about.points'];
const GALLERY = ['gallery.mosaic', 'gallery.strip', 'gallery.frames'];
const CONTACT = ['contact.card', 'contact.band', 'contact.form'];
const LEGAL = ['legal.columns', 'legal.accordion'];

const PRICES = ['prices.list', 'prices.cards', 'prices.groups'];
const SERVICES = ['about.points', 'rest.why', 'cars.why'];

// Each page type's sections: the example slides the AI picks from, whether the section must be on
// the page, and where it may stand ('first' and 'last' are fixed; the others follow the AI's order).
// Prices appear only when the owner listed services, and the gallery only with the owner's photos
// (checked in api/build-page.ts). The paid types build their home page; their menu, products, cart
// and contact pages stay as they are.
type Place = 'first' | 'last' | 'any';
const S = (id: string, name: string, templates: string[], required = false, place: Place = 'any') => ({ id, name, required, place, templates });
const sections: Record<Kind, ReturnType<typeof S>[]> = {
  free: [
    S('intro', 'مدخل', HERO, true, 'first'),
    S('about', 'من نحن', ABOUT),
    S('services', 'خدماتنا', SERVICES),
    S('why', 'لماذا نحن', ['rest.why', 'cars.why', 'about.points']),
    S('numbers', 'أرقامنا', ['cars.numbers']),
    S('prices', 'الأسعار', PRICES),
    S('ticker', 'شريط نص متحرك', ['rest.ticker']),
    S('gallery', 'المعرض', GALLERY),
    S('contact', 'تواصل', CONTACT, true, 'last'),
    S('privacy', 'الشروط والخصوصية', LEGAL, true, 'last'),
  ],
  restaurant: [
    S('intro', 'مدخل', ['rest.front', ...HERO], true, 'first'),
    S('ticker', 'شريط نص متحرك', ['rest.ticker']),
    S('featured', 'أطباق مميزة', ['rest.featured', 'rest.featuredStrip', 'rest.featuredShake', 'rest.menuBig'], true),
    S('about', 'من نحن', ABOUT),
    S('why', 'لماذا نحن', ['rest.why', 'about.points']),
    S('gallery', 'المعرض', GALLERY),
    S('order', 'اطلب الآن', ['rest.order']),
    S('contact', 'تواصل', CONTACT, false, 'last'),
  ],
  shop: [
    S('intro', 'مدخل', ['shop.front', 'shop.twoPhotos', ...HERO], true, 'first'),
    S('ticker', 'شريط نص متحرك', ['shop.ticker']),
    S('search', 'بحث في المتجر', ['shop.searchSimple', 'shop.searchBg']),
    S('featured', 'منتجات مميزة', ['shop.zigzag', 'shop.small', 'shop.featuredStrip', 'shop.featuredShake', 'shop.moving'], true),
    S('about', 'من نحن', ABOUT),
    S('why', 'لماذا نحن', SERVICES),
    S('gallery', 'المعرض', GALLERY),
    S('contact', 'تواصل', CONTACT, false, 'last'),
  ],
  cars: [
    S('intro', 'مدخل', ['cars.front', 'cars.frontSearch', ...HERO], true, 'first'),
    S('ticker', 'شريط نص متحرك', ['cars.ticker']),
    S('featured', 'سيارات مميزة', ['cars.featured', 'cars.strip', 'cars.shake', 'cars.big'], true),
    S('why', 'لماذا نحن', ['cars.why', 'about.points']),
    S('about', 'من نحن', ['cars.about', ...ABOUT]),
    S('numbers', 'أرقامنا', ['cars.numbers']),
    S('request', 'اطلب سيارتك', ['cars.request']),
    S('contact', 'تواصل', CONTACT, false, 'last'),
  ],
};

for (const list of Object.values(sections)) for (const s of list) for (const t of s.templates) {
  if (!templates[t]) throw new Error(`Unknown template ${t} in section ${s.id}`);
}

// The four Arabic font pairs (heading, text) of the approval gallery.
const fonts = {
  'messiri-tajawal': { head: 'El Messiri', body: 'Tajawal' },
  'amiri-plex': { head: 'Amiri', body: 'IBM Plex Sans Arabic' },
  'alexandria-almarai': { head: 'Alexandria', body: 'Almarai' },
  'cairo-cairo': { head: 'Cairo', body: 'Cairo' },
};
const palettes = Object.fromEntries(TWENTY_PAGE_PALETTES.map((p) => [p.id, { name: p.name, colors: p.colors }]));

writeFileSync(new URL('../src/data/ai/buildCatalog.json', import.meta.url), JSON.stringify({ listMax: LIST_MAX, sections, templates, fonts, palettes }, null, 1) + '\n');
console.log(`Wrote ${Object.keys(templates).length} templates.`);

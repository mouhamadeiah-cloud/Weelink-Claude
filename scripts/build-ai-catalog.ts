// Writes src/data/ai/buildCatalog.json: the ready slides «ابن صفحتي» may use, with their slots and
// character limits, read from the slide templates themselves so the two never drift apart.
// The server function api/build-page.ts sends it to Gemini and checks Gemini's answer against it.
//
//   npm run ai-catalog      (after changing a ready slide's texts or slots)

import { writeFileSync } from 'node:fs';
import { WEE_SLIDE_BY_ID } from '../src/data/weeSlideTemplates';
import { getSlideTemplatePayload } from '../src/data/slideTemplates';
import { STORE_SLIDE_IDS } from '../src/data/storeSlideAi';
import { DEFAULT_LOOK, PAGE_LOOKS, suitsKind } from '../src/data/pageLooks';

type Kind = 'free' | 'restaurant' | 'shop' | 'cars';

import { describe, LIST_MAX } from '../src/data/aiSlots';

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

// The 12 page looks Wee AI chooses from: who each suits, its colours and its two fonts. The server
// checks the AI's choice against this list and falls back on the page type's default look.
const looks = Object.fromEntries(PAGE_LOOKS.map((l) => [l.id, { name: l.name, forWho: l.forWho, bg: l.bg, ink: l.ink, accent: l.accent, head: l.head, body: l.body }]));
const kinds: Kind[] = ['free', 'restaurant', 'shop', 'cars'];
const suits = Object.fromEntries(kinds.map((k) => [k, PAGE_LOOKS.filter((l) => suitsKind(l, k)).map((l) => l.id)]));

writeFileSync(new URL('../src/data/ai/buildCatalog.json', import.meta.url), JSON.stringify({ listMax: LIST_MAX, sections, templates, looks, suits, defaults: DEFAULT_LOOK }, null, 1) + '\n');
console.log(`Wrote ${Object.keys(templates).length} templates.`);

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

const plain = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

// Room for a little more text than the design shows, within what its box holds.
const limitFor = (path: string, type: string, current: string) => {
  const leaf = path.split('.').pop() || path;
  if (leaf === 'price') return 14;
  if (leaf === 'number') return 6;
  if (type === 'button') return 18;
  if (type === 'badge' || path === 'eyebrow') return 30;
  const room = Math.round(current.length * 1.4);
  const least = type === 'heading' ? 16 : 40;
  return Math.max(least, Math.min(260, room));
};

interface SlotSpec {
  max?: number;
  kind: 'text' | 'button' | 'image';
}

const describe = (slide: { name: string; elements: any[]; backgroundImage?: string; backgroundVideo?: string }) => {
  const slots: Record<string, SlotSpec> = {};
  for (const el of slide.elements) {
    const path: string | undefined = el.aiSlot;
    if (!path || SYSTEM_SLOTS.test(path)) continue;
    if (IMAGE_SLOTS.test(path) || el.type === 'image') {
      slots[path] = { kind: 'image' };
      continue;
    }
    const kind = el.type === 'button' ? 'button' : 'text';
    slots[path] = { kind, max: limitFor(path, el.type, plain(el.content || '')) };
  }
  if (slide.backgroundImage || slide.backgroundVideo) slots.background = { kind: 'image' };
  return { name: slide.name, slots };
};

const templates: Record<string, { name: string; slots: Record<string, SlotSpec> }> = {};
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

// Each page type's sections in page order: the templates the AI picks from, and whether the
// section must be on the page. The paid types build their home page; their menu, products, cart
// and contact pages stay as they are.
const sections: Record<Kind, { id: string; name: string; required: boolean; templates: string[] }[]> = {
  free: [
    { id: 'intro', name: 'مدخل', required: true, templates: HERO },
    { id: 'about', name: 'من نحن', required: true, templates: ABOUT },
    { id: 'prices', name: 'الأسعار', required: true, templates: ['prices.list', 'prices.cards', 'prices.groups'] },
    { id: 'gallery', name: 'المعرض', required: true, templates: GALLERY },
    { id: 'contact', name: 'تواصل', required: true, templates: CONTACT },
    { id: 'privacy', name: 'الشروط والخصوصية', required: true, templates: LEGAL },
  ],
  restaurant: [
    { id: 'intro', name: 'مدخل', required: true, templates: ['rest.front', ...HERO] },
    { id: 'ticker', name: 'شريط نص متحرك', required: false, templates: ['rest.ticker'] },
    { id: 'featured', name: 'أطباق مميزة', required: true, templates: ['rest.featured', 'rest.featuredStrip', 'rest.featuredShake', 'rest.menuBig'] },
    { id: 'about', name: 'من نحن', required: false, templates: ABOUT },
    { id: 'why', name: 'لماذا نحن', required: false, templates: ['rest.why'] },
    { id: 'gallery', name: 'المعرض', required: false, templates: GALLERY },
    { id: 'order', name: 'اطلب الآن', required: false, templates: ['rest.order'] },
    { id: 'contact', name: 'تواصل', required: false, templates: CONTACT },
  ],
  shop: [
    { id: 'intro', name: 'مدخل', required: true, templates: ['shop.front', 'shop.twoPhotos', ...HERO] },
    { id: 'ticker', name: 'شريط نص متحرك', required: false, templates: ['shop.ticker'] },
    { id: 'search', name: 'بحث في المتجر', required: false, templates: ['shop.searchSimple', 'shop.searchBg'] },
    { id: 'featured', name: 'منتجات مميزة', required: true, templates: ['shop.zigzag', 'shop.small', 'shop.featuredStrip', 'shop.featuredShake', 'shop.moving'] },
    { id: 'about', name: 'من نحن', required: false, templates: ABOUT },
    { id: 'gallery', name: 'المعرض', required: false, templates: GALLERY },
    { id: 'contact', name: 'تواصل', required: false, templates: CONTACT },
  ],
  cars: [
    { id: 'intro', name: 'مدخل', required: true, templates: ['cars.front', 'cars.frontSearch', ...HERO] },
    { id: 'ticker', name: 'شريط نص متحرك', required: false, templates: ['cars.ticker'] },
    { id: 'featured', name: 'سيارات مميزة', required: true, templates: ['cars.featured', 'cars.strip', 'cars.shake', 'cars.big'] },
    { id: 'why', name: 'لماذا نحن', required: false, templates: ['cars.why'] },
    { id: 'about', name: 'من نحن', required: false, templates: ['cars.about', ...ABOUT] },
    { id: 'numbers', name: 'أرقامنا', required: false, templates: ['cars.numbers'] },
    { id: 'request', name: 'اطلب سيارتك', required: false, templates: ['cars.request'] },
    { id: 'contact', name: 'تواصل', required: false, templates: CONTACT },
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

writeFileSync(new URL('../src/data/ai/buildCatalog.json', import.meta.url), JSON.stringify({ sections, templates, fonts, palettes }, null, 1) + '\n');
console.log(`Wrote ${Object.keys(templates).length} templates.`);

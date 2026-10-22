// The AI slots of a slide, found by the slide itself (Eyad, 22 Oct): every ready slide gets the part each text, button and photo plays
// (title, sub, cta, points.0.title…) when it is saved, so nobody marks them by hand. Read from the element's type, size, font size and
// place; the names are the ones src/data/aiSlots.ts knows. A slot the admin set by hand stays; the ones found here carry `aiSlotAuto`
// and are found again on every save.
export interface SlotEl {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  imageUrl?: string;
  linkType?: string;
  linkUrl?: string;
  isGroupContainer?: boolean;
  styles?: { fontSize?: number };
  aiSlot?: string;
  aiSlotAuto?: boolean;
}

const TEXT_TYPES = ['heading', 'paragraph', 'badge'];
const plain = (html: unknown) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const fontOf = (e: SlotEl) => Number(e.styles?.fontSize) || 16;
const PRICE = /[\d٠-٩].*(\$|€|£|ل\.?\s?س|ر\.?\s?س|د\.?\s?إ|دينار|ريال|درهم|ليرة|SYP|USD|EUR)|(\$|€|£)\s?[\d٠-٩]/;
const PHONE = /^\+?[\d٠-٩][\d٠-٩\s\-()]{6,}$/;
const NUMBER = /^[+\-~]?[\d٠-٩][\d٠-٩.,٫٬]*\s*[%+kKmMxX×]?\+?$/;
// Reading order of a right-to-left page: top to bottom, and in a row from the right.
const reading = (a: SlotEl, b: SlotEl) => (Math.abs(a.y - b.y) > 40 ? a.y - b.y : b.x - a.x);
const overlapX = (a: SlotEl, b: SlotEl) => Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) / Math.max(1, Math.min(a.width, b.width));
const photoUrl = (e: SlotEl) => String(e.content || e.imageUrl || '');
// The built-in pictures (/Library/…) are decoration of the design; the owner's own photos would replace a photo, not these.
const isPhoto = (e: SlotEl) => e.type === 'image' && !/^\/Library\//.test(photoUrl(e)) && e.width >= 80 && e.height >= 80;

/** The slide's elements with the slots found for the ones that have none (earlier automatic marks are redone). */
export const autoSlots = <T extends SlotEl>(input: T[]): T[] => {
  const els: T[] = input.map((e) => {
    if (!e.aiSlotAuto) return e;
    const { aiSlot: _a, aiSlotAuto: _b, ...rest } = e;
    return rest as T;
  });
  const used = new Set(els.map((e) => e.aiSlot).filter(Boolean) as string[]);
  const marks = new Map<T, string>();
  const take = (e: T, name: string) => {
    if (e.aiSlot || marks.has(e) || used.has(name)) return false;
    marks.set(e, name);
    used.add(name);
    return true;
  };
  const free = (e: T) => !e.aiSlot && !marks.has(e);
  const bottom = Math.max(720, ...els.map((e) => e.y + e.height));

  // What Weelink fills from the owner's card.
  for (const e of els) {
    if (e.type === 'map') take(e, 'map');
    else if (e.type === 'contactForm') take(e, 'form');
    else if (e.type === 'gallery') take(e, 'gallery');
  }

  // Buttons: the main one, and the contact ones by their words or link.
  for (const e of els.filter((x) => x.type === 'button' && plain(x.content)).sort(reading)) {
    const label = plain(e.content).toLowerCase();
    const link = `${e.linkType || ''} ${e.linkUrl || ''}`.toLowerCase();
    if (/whatsapp|واتس/.test(label + link)) take(e, 'whatsapp');
    else if (/tel:|phone|اتصل|هاتف/.test(label + link)) take(e, 'phone');
    else take(e, 'cta');
  }

  const texts = els.filter((e) => TEXT_TYPES.includes(e.type) && !e.isGroupContainer && plain(e.content).length > 0 && free(e));

  // A price list: each price with its name beside it (and a line of description under the name).
  const prices = texts.filter((e) => free(e) && plain(e.content).length <= 24 && PRICE.test(plain(e.content))).sort(reading);
  if (prices.length >= 2) {
    prices.slice(0, 12).forEach((pr, i) => {
      if (!take(pr, `items.${i}.price`)) return;
      const cy = pr.y + pr.height / 2;
      const name = texts.filter((t) => free(t) && Math.abs(t.y + t.height / 2 - cy) <= Math.max(t.height, pr.height) && Math.abs(t.x - pr.x) > 20).sort((a, b) => fontOf(b) - fontOf(a))[0];
      if (name && take(name, `items.${i}.name`)) {
        const desc = texts.find((t) => free(t) && t.y >= name.y + name.height - 6 && t.y - (name.y + name.height) < 60 && overlapX(name, t) > 0.4 && fontOf(t) < fontOf(name));
        if (desc) take(desc, `items.${i}.desc`);
      }
    });
  }

  // Contact lines: a phone number, with its label beside or above it.
  for (const ph of texts.filter((e) => free(e) && PHONE.test(plain(e.content))).sort(reading)) {
    const near = texts.filter((t) => free(t) && t !== ph && plain(t.content).length <= 30 && Math.abs(t.y + t.height / 2 - (ph.y + ph.height / 2)) <= 70 && Math.abs(t.x - ph.x) <= 420);
    const label = near.sort((a, b) => Math.abs(a.y - ph.y) - Math.abs(b.y - ph.y))[0];
    const part = label && /واتس|whats/i.test(plain(label.content)) ? 'whatsapp' : 'phone';
    if (take(ph, `${part}.value`) && label) take(label, `${part}.label`);
  }

  // Repeated figures: «+500 / عميل» pairs.
  const numbers = texts.filter((e) => NUMBER.test(plain(e.content)) && fontOf(e) >= 24).sort(reading);
  if (numbers.length >= 2) {
    numbers.slice(0, 6).forEach((n, i) => {
      if (!take(n, `facts.${i}.number`)) return;
      const label = texts.find((t) => free(t) && t.y >= n.y + n.height - 10 && t.y - (n.y + n.height) < 90 && overlapX(n, t) > 0.4 && fontOf(t) < fontOf(n));
      if (label) take(label, `facts.${i}.label`);
    });
  }

  // Repeated cards: three or more titles of the same size, each with its text beneath.
  const heads = texts.filter((e) => free(e) && e.type !== 'badge' && fontOf(e) >= 17 && fontOf(e) <= 60 && plain(e.content).length <= 60);
  const groups: T[][] = [];
  for (const e of heads) {
    const g = groups.find((m) => m[0].type === e.type && Math.abs(fontOf(m[0]) - fontOf(e)) <= 1 && Math.abs(m[0].width - e.width) <= 0.15 * Math.max(m[0].width, e.width));
    if (g) g.push(e);
    else groups.push([e]);
  }
  const cards = groups.filter((g) => g.length >= 3 && g.length <= 8).sort((a, b) => b.length - a.length)[0];
  if (cards) {
    cards.sort(reading).forEach((t, i) => {
      if (!take(t, `points.${i}.title`)) return;
      const body = texts.find((p) => free(p) && p.type === 'paragraph' && p.y >= t.y + t.height - 10 && p.y - (t.y + t.height) < 160 && overlapX(t, p) > 0.4 && fontOf(p) <= fontOf(t));
      if (body) take(body, `points.${i}.text`);
    });
  }

  // The slide's own words.
  const left = texts.filter(free);
  const byBig = [...left].sort((a, b) => fontOf(b) - fontOf(a) || (a.type === 'heading' ? -1 : 1) - (b.type === 'heading' ? -1 : 1) || a.y - b.y);
  const title = byBig.find((e) => plain(e.content).length >= 2 && (e.type === 'heading' || fontOf(e) >= 28));
  if (title) take(title, 'title');
  const above = title && left.filter((e) => free(e) && e !== title && e.y + e.height <= title.y + 12 && fontOf(e) < fontOf(title) && plain(e.content).length <= 50).sort((a, b) => b.y - a.y)[0];
  if (above) take(above, 'eyebrow');
  else {
    const badge = left.find((e) => free(e) && e.type === 'badge' && plain(e.content).length <= 50);
    if (badge) take(badge, 'eyebrow');
  }
  const below = title
    ? left.filter((e) => free(e) && e !== title && e.type === 'paragraph' && e.y >= title.y + title.height - 24 && fontOf(e) < fontOf(title) && plain(e.content).length >= 12).sort((a, b) => a.y - b.y)[0]
    : undefined;
  if (below) take(below, plain(below.content).length >= 130 ? 'text' : 'sub');
  const body = left.filter((e) => free(e) && e.type === 'paragraph' && plain(e.content).length >= 60).sort((a, b) => plain(b.content).length - plain(a.content).length)[0];
  if (body) take(body, 'text');
  else if (!title) {
    const any = left.filter(free).sort((a, b) => plain(b.content).length - plain(a.content).length)[0];
    if (any) take(any, 'text');
  }

  // Photos: one picture of the design, or a set of equal ones for a gallery.
  const photos = els.filter((e) => isPhoto(e) && free(e) && e.width * e.height < 0.7 * 1280 * bottom);
  const sets = photos.filter((p) => photos.filter((q) => Math.abs(q.width - p.width) <= 0.3 * p.width && Math.abs(q.height - p.height) <= 0.3 * p.height).length >= 3);
  if (sets.length >= 3) sets.sort(reading).slice(0, 15).forEach((p, i) => take(p, `photos.${i}`));
  else {
    const main = [...photos].sort((a, b) => b.width * b.height - a.width * a.height)[0];
    if (main) take(main, 'image');
  }

  return els.map((e) => (marks.has(e) ? { ...e, aiSlot: marks.get(e), aiSlotAuto: true } : e));
};

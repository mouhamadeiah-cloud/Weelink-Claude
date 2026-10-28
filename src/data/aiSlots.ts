// The slots of a ready slide for «ابن صفحتي»: which of its elements the AI fills (element.aiSlot), with the character limit of each.
// Read from the slide itself, for the slides of the code (scripts/build-ai-catalog.ts) and for the admin's ready slides
// (server/readySlides.ts; the slots are found by src/data/autoSlots.ts), so the two never drift apart.

// Filled by Weelink from the owner's answers, never by the AI.
export const SYSTEM_SLOTS = /^(phone|whatsapp|address|hours)\.(label|value)$|^(map|form|gallery)$/;
export const IMAGE_SLOTS = /^(image|avatar|photos\.\d+)$/;

// Generous room: the builder grows a box (and moves what is under it) to fit a longer text, so the
// limits only keep texts to a sensible length for their part of the design.
const LIMITS: Record<string, number> = {
  title: 60, eyebrow: 40, sub: 240, text: 520, note: 120, quote: 220, owner: 40, role: 50, ticker: 160,
  name: 40, extra: 160, desc: 100, price: 20, unit: 20, number: 8, label: 40, features: 50, caption: 40, chips: 32,
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
export const LIST_MAX = 8;

export interface SlotSpec {
  max?: number;
  kind: 'text' | 'button' | 'image';
}
export interface ListSpec {
  count: number; // in the example
  fields: Record<string, number | 'icon'>; // field ('' for a bare chip) → its character limit
}

export const describe = (slide: { name: string; elements: any[]; backgroundImage?: string; backgroundVideo?: string }) => {
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


// ---- The slot names of a ready slide ----
const SINGLE_TEXT = ['eyebrow', 'title', 'sub', 'text', 'note', 'quote', 'owner', 'role', 'ticker'];
const SINGLE_BUTTON = ['cta', 'whatsapp', 'phone', 'send'];
const SINGLE_IMAGE = ['image', 'avatar'];
const INDEXED = /^(?:(?:chips|facts|points|items|packages)\.\d+(?:\.[a-z]+)?|packages\.\d+\.features\.\d+|groups\.\d+\.name|groups\.\d+\.rows\.\d+\.(?:name|price)|photos\.\d+|caption\.\d+|extra\.\d+)$/;
/** Is this a slot name the builder knows? */
export const isSlotName = (name: string) => [...SINGLE_TEXT, ...SINGLE_BUTTON, ...SINGLE_IMAGE].includes(name) || INDEXED.test(name) || SYSTEM_SLOTS.test(name);

export interface Eligibility { eligible: boolean; slots: number; problems: string[] }

/**
 * Can the AI use this slide? It needs a title or a text to write, every slot name known and used once, and its lists counted from 0
 * without gaps. A slide with no marked slot is simply «not marked yet».
 */
export const slideEligibility = (elements: { type: string; aiSlot?: string }[]): Eligibility => {
  const problems: string[] = [];
  const marked = elements.filter((e) => e.aiSlot);
  const names = marked.map((e) => String(e.aiSlot));
  // A booking slide is its calendar: the builder keeps it as it is, so it needs no slot of its own.
  const booking = elements.some((e) => e.type === 'calendar');
  if (!marked.length && booking) return { eligible: true, slots: 0, problems };
  if (!marked.length) return { eligible: false, slots: 0, problems: ['لم تُعلَّم أي خانة'] };
  for (const e of marked) if (!isSlotName(String(e.aiSlot))) problems.push(`خانة غير معروفة: ${e.aiSlot}`);
  const dup = names.filter((n, i) => names.indexOf(n) !== i);
  if (dup.length) problems.push(`خانة مكررة: ${[...new Set(dup)].join('، ')}`);
  if (!booking && !names.some((n) => n === 'title' || n === 'text' || /^(points|items|packages)\.\d+\.(title|text|name)$/.test(n))) problems.push('تحتاج عنواناً أو نصاً يكتبه الذكاء');
  const lists = new Map<string, Set<number>>();
  for (const n of names) {
    const m = /^(chips|facts|points|items|packages|photos|caption)\.(\d+)/.exec(n);
    if (m) lists.set(m[1], (lists.get(m[1]) || new Set()).add(+m[2]));
  }
  for (const [list, idx] of lists) {
    const max = Math.max(...idx);
    if (idx.size !== max + 1) problems.push(`القائمة ${list} يجب أن تبدأ من 0 بلا فجوات`);
  }
  return { eligible: problems.length === 0, slots: marked.length, problems };
};

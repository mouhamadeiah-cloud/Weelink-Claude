// The flexible layout of «ابن صفحتي» (Eyad, 12 Oct: a ready slide is an example, not a form). The AI
// decides how many cards, rows or figures a list has and writes texts at their natural length;
// this file lays the example's elements out for that: list items are repeated or dropped and placed
// on the example's own grid, a text box grows to fit its text and pushes down what is under it,
// and the slide grows with its content. The phone layout is arranged afterwards from the result.

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FlexEl extends Box {
  type: string;
  content: string;
  aiSlot?: string;
  isGroupContainer?: boolean;
  styles: Record<string, any>;
  [key: string]: any;
}

const CANVAS = 1280;
const near = (a: number, b: number) => Math.abs(a - b) < 4;
const inside = (outer: Box, inner: Box, pad = 0) =>
  inner.x >= outer.x - pad && inner.y >= outer.y - pad && inner.x + inner.width <= outer.x + outer.width + pad && inner.y + inner.height <= outer.y + outer.height + pad;
const union = (boxes: Box[]): Box => {
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  return { x, y, width: Math.max(...boxes.map((b) => b.x + b.width)) - x, height: Math.max(...boxes.map((b) => b.y + b.height)) - y };
};
const isDecoration = (el: FlexEl) => !el.aiSlot && !el.isGroupContainer && ['shape', 'icon', 'divider', 'lottie'].includes(el.type) && el.width < CANVAS * 0.7;
const isBackdrop = (el: FlexEl) => el.type === 'shape' && !el.aiSlot && !(el.content || '').trim();

/** The item number of a list slot: points.2.title → 2 (for list 'points'). */
export const itemOf = (slot: string | undefined, list: string) => {
  const m = slot && new RegExp(`^${list}\\.(\\d+)(\\.|$)`).exec(slot);
  return m ? +m[1] : -1;
};

/** The elements of each item of a list: its slots, the card it sits on with all on it, and the small
 * decorations on its row (a dotted line, a divider, an icon). */
export const listItems = (els: FlexEl[], list: string) => {
  const slotted = new Map<number, number[]>();
  els.forEach((el, i) => {
    const n = itemOf(el.aiSlot, list);
    if (n >= 0) slotted.set(n, [...(slotted.get(n) || []), i]);
  });
  const items = new Map<number, { members: number[]; box: Box }>();
  const taken = new Set<number>([...slotted.values()].flat());
  for (const [n, own] of [...slotted].sort((a, b) => a[0] - b[0])) {
    const ownBox = union(own.map((i) => els[i]));
    const others = [...slotted].filter(([m]) => m !== n).flatMap(([, ids]) => ids);
    // The smallest backdrop holding this item and no other.
    const card = els
      .map((el, i) => ({ el, i }))
      .filter(({ el, i }) => !taken.has(i) && isBackdrop(el) && el.width < CANVAS * 0.7 && inside(el, ownBox) && !others.some((o) => inside(el, els[o])))
      .sort((a, b) => a.el.width * a.el.height - b.el.width * b.el.height)[0];
    const box = card ? { x: card.el.x, y: card.el.y, width: card.el.width, height: card.el.height } : ownBox;
    const members = new Set(own);
    if (card) members.add(card.i);
    els.forEach((el, i) => {
      if (members.has(i) || taken.has(i) || el.aiSlot) return;
      if (card ? inside(box, el) : isDecoration(el) && inside({ x: box.x - 8, y: box.y - 14, width: box.width + 16, height: box.height + 28 }, el)) members.add(i);
    });
    members.forEach((i) => taken.add(i));
    items.set(n, { members: [...members].sort((a, b) => a - b), box });
  }
  return items;
};

/** Where n items go on the grid the example's items show (rows right to left, or columns). */
export const gridPositions = (boxes: Box[], n: number): { x: number; y: number }[] => {
  const b0 = boxes[0];
  if (boxes.length === 1) return Array.from({ length: n }, (_, j) => ({ x: b0.x, y: b0.y + j * (b0.height + 24) }));
  const sameX = boxes.filter((b) => near(b.x, b0.x));
  // Columns: the items run down a column, then the next column (a two-column price list).
  if (near(boxes[1].x, b0.x)) {
    const xs = [...new Set(boxes.map((b) => Math.round(b.x)))];
    const pitch = boxes[1].y - b0.y;
    const per = sameX.length === boxes.length ? n : Math.max(1, Math.ceil(n / xs.length));
    return Array.from({ length: n }, (_, j) => ({ x: xs[Math.min(xs.length - 1, Math.floor(j / per))], y: b0.y + (j % per) * pitch }));
  }
  // Rows: the items run across a row (right to left), then wrap to the next row.
  const row = boxes.filter((b) => near(b.y, b0.y));
  const pitchX = Math.abs(row[0].x - row[1].x);
  const rtl = row[0].x > row[1].x;
  const next = boxes.find((b) => b.y > b0.y + 4);
  const pitchY = next ? next.y - b0.y : b0.height + Math.max(16, Math.min(48, pitchX - b0.width));
  const cols = row.length;
  const left = Math.min(...row.map((b) => b.x));
  const right = Math.max(...row.map((b) => b.x)) + b0.width;
  const out: { x: number; y: number }[] = [];
  for (let j = 0; j < n; j++) {
    const r = Math.floor(j / cols);
    const q = j % cols;
    const inRow = Math.min(cols, n - r * cols);
    const span = (inRow - 1) * pitchX + b0.width;
    const start = (left + right) / 2 - span / 2; // the row centred under the example's
    const x = inRow === cols ? (rtl ? row[q].x : row[q].x) : rtl ? start + span - b0.width - q * pitchX : start + q * pitchX;
    out.push({ x: Math.round(x), y: b0.y + r * pitchY });
  }
  return out;
};

const renumber = (slot: string | undefined, list: string, from: number, to: number) =>
  slot && itemOf(slot, list) === from ? slot.replace(new RegExp(`^${list}\\.${from}(?=\\.|$)`), `${list}.${to}`) : slot;

/** Pushes down what is under a line, and lengthens what holds it. */
const pushDown = (els: FlexEl[], from: number, by: number, span: Box | null, skip: Set<number>) => {
  els.forEach((el, i) => {
    if (skip.has(i)) return;
    const overlaps = !span || (el.x < span.x + span.width && el.x + el.width > span.x);
    if (!overlaps) return;
    if (el.y >= from - 4) el.y += by;
    // A card around it grows; full-width veils and bands follow the slide's height instead.
    else if (el.y + el.height > from - 4 && isBackdrop(el) && el.width < CANVAS * 0.7) el.height += by;
  });
};

type Mobile = { x: number; y: number; width: number; height: number; fontScale?: number };
const mobileBox = (els: FlexEl[], ids: number[]) => union(ids.map((i) => els[i].mobile as Mobile));

/** The list with n items on the example's grid; the rest of the slide moves to make room. A slide
 * with a phone layout keeps it: the items follow the example's phone order and what is under them
 * moves with them there too. */
export const reflowList = (
  els: FlexEl[],
  list: string,
  n: number,
  height: number,
  mobileHeight?: number
): { els: FlexEl[]; height: number; mobileHeight?: number } => {
  const items = listItems(els, list);
  const k = items.size;
  if (!k || n === k || n < 0) return { els, height, mobileHeight };
  const indices = [...items.keys()].sort((a, b) => a - b);
  const boxes = indices.map((i) => items.get(i)!.box);
  const oldBlock = union(boxes);
  const places = gridPositions(boxes, n);
  const memberSet = new Set(indices.flatMap((i) => items.get(i)!.members));
  const firstMember = Math.min(...memberSet);
  const phone = mobileHeight !== undefined && els.every((el) => el.mobile);
  // The phone places: the example's own, then on from the last two items' step.
  const mBoxes = phone ? indices.map((i) => mobileBox(els, items.get(i)!.members)) : [];
  const mPlace = (j: number) => {
    if (j < k) return mBoxes[j];
    const last = mBoxes[k - 1];
    const prev = k > 1 ? mBoxes[k - 2] : { ...last, y: last.y - last.height - 24 };
    const step = j - k + 1;
    return { ...last, x: last.x + (last.x - prev.x) * step, y: last.y + (last.y - prev.y) * step };
  };
  const clones: FlexEl[] = [];
  for (let j = 0; j < n; j++) {
    const from = j < k ? indices[j] : indices[0];
    const item = items.get(from)!;
    const dx = places[j].x - item.box.x;
    const dy = places[j].y - item.box.y;
    const own = phone ? mBoxes[indices.indexOf(from)] : null;
    const target = phone ? mPlace(j) : null;
    for (const m of item.members) {
      const el = els[m];
      const mobile = own && target ? { ...(el.mobile as Mobile), x: el.mobile.x + target.x - own.x, y: el.mobile.y + target.y - own.y } : undefined;
      clones.push({ ...el, styles: { ...el.styles }, x: el.x + dx, y: el.y + dy, aiSlot: renumber(el.aiSlot, list, from, j), mobile });
    }
  }
  const rest = els.filter((_, i) => !memberSet.has(i));
  const at = els.slice(0, firstMember).filter((_, i) => !memberSet.has(i)).length;
  const next = [...rest.slice(0, at), ...clones, ...rest.slice(at)];
  if (!n) return { els: next, height, mobileHeight };
  const cloneSet = new Set(clones);
  const restIdx = new Set(next.map((el, i) => (cloneSet.has(el) ? i : -1)).filter((i) => i >= 0));
  const newBlock = union(clones);
  const delta = newBlock.y + newBlock.height - (oldBlock.y + oldBlock.height);
  if (delta) pushDown(next, oldBlock.y + oldBlock.height, delta, null, restIdx);
  const grown = Math.max(240, height + delta);
  for (const el of next) if (isBackdrop(el) && el.width >= CANVAS * 0.7 && el.y + el.height >= height - 2) el.height = Math.max(1, el.height + grown - height);
  if (!phone) return { els: next, height: grown, mobileHeight: undefined };
  // The same on the phone.
  const oldM = union(mBoxes);
  const newM = union(clones.map((c) => c.mobile as Mobile));
  const mDelta = newM.y + newM.height - (oldM.y + oldM.height);
  const mobileGrown = Math.max(240, mobileHeight! + mDelta);
  next.forEach((el, i) => {
    if (restIdx.has(i)) return;
    const m = el.mobile as Mobile;
    if (m.y >= oldM.y + oldM.height - 4) el.mobile = { ...m, y: m.y + mDelta };
    else if (m.y + m.height >= mobileHeight! - 2 && m.height >= mobileHeight! * 0.6) el.mobile = { ...m, height: Math.max(1, m.height + mobileGrown - mobileHeight!) };
    else if (m.y + m.height > oldM.y + oldM.height - 4 && isBackdrop(el)) el.mobile = { ...m, height: m.height + mDelta };
  });
  return { els: next, height: grown, mobileHeight: mobileGrown };
};

const plain = (html: string) => html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');

/** The height a text needs in its box: Arabic letters about half the font size wide. */
export const textHeight = (el: FlexEl) => {
  const size = Number(el.styles.fontSize) || 16;
  const bold = el.styles.fontWeight === 'bold' || el.type === 'heading';
  const perLine = Math.max(1, Math.floor(el.width / (size * (bold ? 0.56 : 0.5))));
  const lines = plain(el.content || '')
    .split('\n')
    .reduce((n, part) => n + Math.max(1, Math.ceil(part.trim().length / perLine)), 0);
  const lineHeight = el.type === 'heading' ? 1.3 : 1.6;
  return Math.ceil(lines * size * lineHeight + 4);
};

/** Every text box as tall as its text; what is under a grown box moves down with it. */
export const fitTexts = (els: FlexEl[], height: number, only?: Set<FlexEl>): { els: FlexEl[]; height: number } => {
  const next = els.map((el) => ({ ...el }));
  const bottomPad = Math.max(40, height - Math.max(0, ...els.filter((e) => !isBackdrop(e) || e.width < CANVAS * 0.7).map((e) => e.y + e.height)));
  const order = next.map((el, i) => i).sort((a, b) => next[a].y - next[b].y);
  for (const i of order) {
    const el = next[i];
    if ((el.type !== 'heading' && el.type !== 'paragraph') || (only && !only.has(els[i]))) continue;
    const need = textHeight(el);
    if (need <= el.height) continue;
    const by = need - el.height;
    const bottom = el.y + el.height;
    el.height = need;
    pushDown(next, bottom, by, el, new Set([i]));
  }
  const contentBottom = Math.max(0, ...next.filter((e) => !isBackdrop(e) || e.width < CANVAS * 0.7).map((e) => e.y + e.height));
  const grown = Math.max(height, contentBottom + bottomPad);
  // Full-width veils and bands stretch with the slide.
  for (const el of next) if (isBackdrop(el) && el.width >= CANVAS * 0.7 && el.y + el.height >= height - 2) el.height += grown - height;
  return { els: next, height: grown };
};

/** fitTexts on the phone layout: each text as tall as its text at the phone's width and size. */
export const fitTextsPhone = (els: FlexEl[], mobileHeight: number, only?: Set<FlexEl>): { els: FlexEl[]; mobileHeight: number } => {
  const views = els.map((el) => {
    const m = el.mobile as Mobile;
    const size = el.styles.fontSize ? Math.round(el.styles.fontSize * (m.fontScale || 1)) : el.styles.fontSize;
    return { ...el, x: m.x, y: m.y, width: m.width, height: m.height, styles: { ...el.styles, fontSize: size } };
  });
  const onlyViews = only && new Set(views.filter((_, i) => only.has(els[i])));
  const fitted = fitTexts(views, mobileHeight, onlyViews);
  const grow = fitted.height - mobileHeight;
  return {
    els: els.map((el, i) => {
      const f = fitted.els[i];
      // The phone's full-slide background follows the slide's height.
      const whole = f.y <= 0 && f.height >= mobileHeight - 2;
      return { ...el, mobile: { ...(el.mobile as Mobile), x: f.x, y: f.y, width: f.width, height: whole ? f.height + grow : f.height } };
    }),
    mobileHeight: fitted.height,
  };
};

import { CanvasElement, Page } from '../types';
import { arrangeSlideForMobile, DESKTOP_CANVAS_WIDTH } from './mobileLayout';

/**
 * Groups in the ready templates (car showroom and Online Shop).
 *
 * A group is an empty shape with `isGroupContainer` whose contents lie inside it: moving, copying
 * or deleting the shape takes its contents along, and «تنسيق الموبايل» keeps them together as one
 * panel. Template cards (a background shape with an icon, a title and a text on it) become groups,
 * and items with no background (a number above its label) get an invisible shape around them.
 */

type Boxed = Pick<CanvasElement, 'type' | 'content' | 'x' | 'y' | 'width' | 'height'> & {
  slideId?: string;
  isGroupContainer?: boolean;
  groupName?: string;
  name?: string;
};

const inside = (outer: Boxed, inner: Boxed) =>
  inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;

// A card background: an empty shape narrower than the slide (full-width overlays are not cards).
const isCardShape = (el: Boxed) =>
  el.type === 'shape' && !(el.content || '').trim() && el.width < DESKTOP_CANVAS_WIDTH * 0.7;

/** Marks every card background that holds elements drawn above it as a group. */
export const groupTemplateCards = <T extends Boxed>(elements: T[], canGroup: (el: T) => boolean = () => true): T[] =>
  elements.map((el, i) => {
    if (el.isGroupContainer || !isCardShape(el) || !canGroup(el)) return el;
    const holds = elements.some((other, j) => j > i && (other.slideId ?? '') === (el.slideId ?? '') && !isCardShape(other) && inside(el, other));
    return holds ? { ...el, isGroupContainer: true, groupName: el.groupName || el.name || 'مجموعة' } : el;
  });

/** An invisible group shape around items that have no card behind them. */
export const groupFrame = (box: { x: number; y: number; width: number; height: number }, pad = 12) => ({
  x: box.x - pad,
  y: box.y - pad,
  width: box.width + pad * 2,
  height: box.height + pad * 2,
});

export const INVISIBLE_GROUP_STYLES = { backgroundColor: 'transparent', borderWidth: 0 };

// Template items saved before they had a group shape around them: the members' ids and where
// the invisible group goes (`${prefix}-group`).
const FRAMELESS_GROUPS: { match: RegExp; members: string[] }[] = [
  { match: /^(car-stat-\d+)-n$/, members: ['n', 't'] },
  { match: /^(shop-perk-\d+)-icon$/, members: ['icon', 'title', 'text'] },
];

/**
 * Brings showrooms and shops made from older templates up to date: their card shapes become
 * groups and their number/label (or icon/title/text) items get an invisible group around them.
 * Only template elements (ids starting with car- or shop-) are touched. Slides that gained a
 * group are re-arranged for phones when they already had a phone layout.
 */
export const withTemplateGroups = (pages: Page[], elements: CanvasElement[]): { pages: Page[]; elements: CanvasElement[] } => {
  const ids = new Set(elements.map((e) => e.id));
  const changedSlides = new Set<string>();
  let next: CanvasElement[] = [];
  for (const el of elements) {
    for (const g of FRAMELESS_GROUPS) {
      const m = el.id.match(g.match);
      if (!m || ids.has(`${m[1]}-group`)) continue;
      const members = g.members.map((k) => elements.find((e) => e.id === `${m[1]}-${k}`)).filter(Boolean) as CanvasElement[];
      if (members.length < 2) continue;
      const left = Math.min(...members.map((e) => e.x));
      const top = Math.min(...members.map((e) => e.y));
      const box = { x: left, y: top, width: Math.max(...members.map((e) => e.x + e.width)) - left, height: Math.max(...members.map((e) => e.y + e.height)) - top };
      next.push({
        id: `${m[1]}-group`,
        type: 'shape',
        name: 'مجموعة',
        ...groupFrame(box),
        content: '',
        slideId: el.slideId,
        styles: { ...INVISIBLE_GROUP_STYLES },
        isGroupContainer: true,
        groupName: 'مجموعة',
      });
      ids.add(`${m[1]}-group`);
      changedSlides.add(el.slideId);
    }
    next.push(el);
  }
  next = groupTemplateCards(next, (el) => /^(car|shop|rest)-/.test(el.id));

  if (!changedSlides.size) return { pages, elements: next };
  const layouts = new Map<string, NonNullable<CanvasElement['mobile']>>();
  const nextPages = pages.map((p) => ({
    ...p,
    slides: p.slides.map((s) => {
      if (!changedSlides.has(s.id)) return s;
      const slideEls = next.filter((e) => e.slideId === s.id);
      if (!slideEls.some((e) => e.mobile)) return s;
      const { layouts: l, mobileHeight } = arrangeSlideForMobile(s, slideEls);
      l.forEach((v, k) => layouts.set(k, v));
      return { ...s, mobileHeight };
    }),
  }));
  return { pages: nextPages, elements: layouts.size ? next.map((e) => (layouts.has(e.id) ? { ...e, mobile: layouts.get(e.id) } : e)) : next };
};

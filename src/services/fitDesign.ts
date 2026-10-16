// «أضف لصفحتي مجاناً» (Eyad, 14 Oct): a slide or a page from the designers' gallery is copied into the
// customer's page, and its colours and fonts are fitted to the customer's page style automatically.
//
// A gallery design is not drawn in one of the known looks, so its roles are found from its own colours:
// the slide's background, the letters' main colour (ink) and a second, quieter one (muted), the most
// saturated colour (the accent), the panels (cards, soft tints, dark bands) and the borders (lines).
// Each role then takes the matching colour of the customer's page look (or palette), through the same
// recolouring «ستايل الصفحة» uses; headings take the look's heading font and the other texts its text
// font. A page with neither a look nor a palette has no style to fit, so the design comes as it is.
// Photos, videos, drawings, white and black letters on a photo, and the designer's own unrelated colours stay.

import { SCRIPTABLE_TYPES } from '../utils/safeHtml';
import type { CanvasElement, Page, Slide } from '../types';
import { pageLookById, type PageLook } from '../data/pageLooks';
import { buttonText, lookColours, restyleElement } from './applyLook';
import { luminance, recolourDeep, targetColours, type RecolourScene, type Role, type SourceLook, type TargetColours } from '../utils/pageRecolour';

type Rgb = [number, number, number];

const parse = (c: unknown): Rgb | null => {
  if (typeof c !== 'string') return null;
  const hex = c.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map((x) => x + x).join('') : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
  }
  const rgb = c.trim().match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (rgb && (rgb[4] === undefined || Number(rgb[4]) >= 0.5)) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
};
const toHex = (c: Rgb) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
const dist = (a: Rgb, b: Rgb) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const saturation = ([r, g, b]: Rgb) => {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  return max === 0 ? 0 : (max - min) / max;
};
// How far a colour is from grey, 0..255: a slate grey is «saturated» by HSV but is not a colour of its own.
const chroma = ([r, g, b]: Rgb) => Math.max(r, g, b) - Math.min(r, g, b);
const isColourful = (c: Rgb) => saturation(c) >= 0.28 && chroma(c) >= 80;
const isWhite = (c: Rgb) => dist(c, [255, 255, 255]) < 4;
const isBlack = (c: Rgb) => dist(c, [0, 0, 0]) < 4;

interface Use {
  rgb: Rgb;
  fill: number;
  text: number;
  line: number;
}

const TEXT_TYPES = new Set(['heading', 'paragraph', 'button', 'badge', 'input', 'pricing', 'card', 'table']);

/** The roles of a design's own colours (see the top of this file). */
export const deriveSource = (slide: Slide, elements: CanvasElement[]): SourceLook => {
  const uses = new Map<string, Use>();
  const note = (c: unknown, kind: 'fill' | 'text' | 'line', w: number) => {
    const rgb = parse(c);
    if (!rgb || isWhite(rgb) || isBlack(rgb)) return;
    const key = toHex(rgb);
    const u = uses.get(key) || { rgb, fill: 0, text: 0, line: 0 };
    u[kind] += w;
    uses.set(key, u);
  };
  const bg = parse(slide.backgroundColor);
  note(slide.backgroundColor, 'fill', 40);
  note(slide.borderColor, 'line', 2);
  for (const e of elements) {
    const area = Math.max(1, (e.width * e.height) / 10000);
    note(e.styles?.backgroundColor, 'fill', e.type === 'button' ? area * 3 : area);
    note(e.styles?.borderColor, 'line', 1);
    if (TEXT_TYPES.has(e.type)) note(e.styles?.color, 'text', Math.min(area, 12) + 1);
  }
  const all = [...uses.values()];
  const bgHex = bg && !isWhite(bg) && !isBlack(bg) ? toHex(bg) : '';
  const others = all.filter((u) => toHex(u.rgb) !== bgHex);

  // The accent: every saturated colour of the design is its accent (a button's fill counts most, then
  // the letters), so a blue heading and a blue button both take the page's accent.
  const saturated = others
    .filter((u) => isColourful(u.rgb))
    .sort((a, b) => saturation(b.rgb) * (b.fill + b.text + 1) - saturation(a.rgb) * (a.fill + a.text + 1));
  const accentOf = saturated[0];
  const accent = accentOf && toHex(accentOf.rgb);

  const roles: [string, Role][] = [];
  const taken = new Set<string>();
  const give = (u: Use | undefined, role: Role) => {
    if (!u) return;
    const hex = toHex(u.rgb);
    if (taken.has(hex)) return;
    taken.add(hex);
    roles.push([hex, role]);
  };
  if (bgHex) {
    taken.add(bgHex);
    roles.push([bgHex, 'bg']);
  }
  for (const u of saturated) give(u, 'accent');

  // The letters: the main neutral colour is the ink, the next a quieter one.
  const texts = others.filter((u) => u.text > 0 && !taken.has(toHex(u.rgb))).sort((a, b) => b.text - a.text);
  const neutral = texts.filter((u) => !isColourful(u.rgb));
  const ink = neutral[0] || texts[0];
  give(ink, 'ink');
  give(texts.find((u) => u !== ink && dist(u.rgb, ink?.rgb || [0, 0, 0]) > 30), 'muted');

  // Panels, by what they are: a dark band on a light design, a tint of the accent, or a card.
  const bgLum = bg ? luminance(bg) : 1;
  const panels = others.filter((u) => u.fill > 0 && !taken.has(toHex(u.rgb))).sort((a, b) => b.fill - a.fill).slice(0, 4);
  let card = false;
  let soft = false;
  let deep = false;
  for (const u of panels) {
    const lum = luminance(u.rgb);
    if (!deep && lum < 0.12 && bgLum > 0.4) {
      give(u, 'deep');
      deep = true;
    } else if (!soft && accentOf && saturation(u.rgb) > 0.08 && lum > 0.6 && dist(u.rgb, accentOf.rgb) > 45) {
      give(u, 'soft');
      soft = true;
    } else if (!card) {
      give(u, 'card');
      card = true;
    }
  }
  give(others.filter((u) => u.line > 0 && !taken.has(toHex(u.rgb))).sort((a, b) => b.line - a.line)[0], 'line');

  const headFont = String(elementsHeadFont(elements));
  return { roles, dark: !!bg && !!ink && luminance(bg) < luminance(ink.rgb), head: headFont };
};

const fontName = (f: unknown) => (typeof f === 'string' ? f.split(',')[0].replace(/['"]/g, '').trim() : '');
const elementsHeadFont = (elements: CanvasElement[]) => fontName(elements.find((e) => e.type === 'heading' && e.styles?.fontFamily)?.styles.fontFamily);

export interface FitTarget {
  look?: PageLook;
  colours: TargetColours;
}

/** What the customer's page is drawn in: its look, or its palette; none when it has neither. */
export const targetOf = (page: Page | undefined): FitTarget | null => {
  const look = pageLookById(page?.styleLook);
  if (look) return { look, colours: lookColours(look) };
  if (page?.colorPalette) return { colours: targetColours(page.colorPalette) };
  return null;
};

const hasPhoto = (s: Slide) => !!(s.backgroundImage || s.backgroundVideo);

/** A design (slides and their elements) fitted to the customer's page style; as it is when the page has none. */
export const fitDesign = (slides: Slide[], elements: CanvasElement[], target: FitTarget | null): { slides: Slide[]; elements: CanvasElement[] } => {
  if (!target) return { slides, elements };
  try {
    const { look, colours } = target;
    const nextSlides: Slide[] = [];
    const nextElements: CanvasElement[] = [];
    for (const slide of slides) {
      const mine = elements.filter((e) => e.slideId === slide.id);
      const source = deriveSource(slide, mine);
      const scene: RecolourScene = { look: source, to: colours, onPhoto: hasPhoto(slide) };
      const next = recolourDeep(slide, scene) as Slide;
      // The slide's own background: a white one becomes the page's, a black one its dark band, and a
      // photo or video keeps what is behind it.
      const bg = parse(slide.backgroundColor);
      if (bg && isWhite(bg)) next.backgroundColor = colours.bg;
      else if (bg && isBlack(bg)) next.backgroundColor = source.dark ? colours.bg : colours.deep;
      nextSlides.push(next);
      const slideHead = elementsHeadFont(mine);
      for (const e of mine) {
        let styled = look
          ? restyleElement(e, scene, slideHead, {}, look, true)
          : (recolourDeep(e, scene) as CanvasElement);
        // The page's fonts: headings take its heading font, every other text its text font.
        if (look && (e.type === 'heading' || TEXT_TYPES.has(e.type) || e.styles?.fontFamily)) {
          const isHead = e.type === 'heading';
          const font = isHead ? look.head : look.body;
          styled = { ...styled, styles: { ...styled.styles, fontFamily: font, ...(isHead && /^(bold|600)$/.test(String(styled.styles?.fontWeight ?? '')) ? { fontWeight: look.headWeight >= 700 ? 'bold' : '600' } : {}) } };
        }
        if (look && e.type === 'button' && styled.styles?.backgroundColor === look.accent) styled = { ...styled, styles: { ...styled.styles, color: buttonText(look) } };
        nextElements.push(styled);
      }
    }
    // Elements of no listed slide (there should be none) come unchanged.
    for (const e of elements) if (!slides.some((s) => s.id === e.slideId)) nextElements.push(e);
    return { slides: nextSlides, elements: nextElements };
  } catch (err) {
    console.warn('Could not fit the design to the page style:', err);
    return { slides, elements };
  }
};

export interface Design {
  slides: Slide[];
  elements: CanvasElement[];
}

export interface Inserted {
  pages: Page[];
  elements: CanvasElement[];
  firstSlideId: string;
  added: number;
}

// A link inside the design to another slide of it follows the new ids; any other page or slide link
// pointed at the designer's own page and is dropped, so nothing on the customer's page links to nowhere.
const relink = (e: CanvasElement, idOf: Map<string, string>): CanvasElement => {
  if (e.linkType !== 'page' && e.linkType !== 'slide') return e;
  const to = e.linkTargetId ? idOf.get(e.linkTargetId) : undefined;
  if (e.linkType === 'slide' && to) return { ...e, linkTargetId: to };
  const { linkType: _t, linkTargetId: _id, ...rest } = e;
  return rest as CanvasElement;
};

/**
 * The design added at the end of the page's slides (new ids for every slide and element). A page that
 * is still one empty slide gives that slide up to it. `fit` fits it to the page's style first.
 */
export const insertDesign = (pages: Page[], elements: CanvasElement[], design: Design, opts: { pageId?: string; fit: boolean }): Inserted | null => {
  const page = pages.find((p) => p.id === opts.pageId) || pages[0];
  if (!page || !design.slides.length) return null;
  const fitted = opts.fit ? fitDesign(design.slides, design.elements, targetOf(page)) : design;
  const stamp = Date.now().toString(36);
  const slideIds = new Map(fitted.slides.map((s, i) => [s.id, `slide-g${stamp}-${i + 1}`]));
  const newSlides = fitted.slides.map((s) => ({ ...s, id: slideIds.get(s.id)! }));
  const newElements = fitted.elements
    .filter((e) => slideIds.has(e.slideId) && !SCRIPTABLE_TYPES.includes(e.type))
    .map((e, i) => relink({ ...e, id: `el-g${stamp}-${i + 1}`, slideId: slideIds.get(e.slideId)! }, slideIds));
  const empty = page.slides.length === 1 && !elements.some((e) => e.slideId === page.slides[0].id);
  return {
    pages: pages.map((p) => (p.id === page.id ? { ...p, slides: empty ? newSlides : [...p.slides, ...newSlides] } : p)),
    elements: [...(empty ? elements.filter((e) => e.slideId !== page.slides[0].id) : elements), ...newElements],
    firstSlideId: newSlides[0].id,
    added: newSlides.length,
  };
};

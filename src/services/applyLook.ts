// «ستايل الصفحة»: one of the 12 page looks applied to every page of the site. Each colour of a
// slide has a role (background, card, line, text, muted text, accent…) in the look it was drawn in,
// and takes the new look's colour for that role; the heading font becomes the look's heading font
// and the text font its text font. Colours and fonts that belong to no look (the owner's own
// choices), white, black, WhatsApp green, gold and dark veils over photos stay as they are.

import type { CanvasElement, Page, Slide } from '../types';
import type { BuildKind } from './pageBuilder';
import { pageLookById, type PageLook } from '../data/pageLooks';
import { joinSources, lookOf, luminance, recolourDeep, sourceOf, targetColours, type RecolourScene, type SourceLook, type TargetColours } from '../utils/pageRecolour';

// Every font a ready slide or a look is drawn in; any other font was the owner's choice.
const LOOK_FONTS = new Set([
  'El Messiri', 'Tajawal', 'Amiri', 'IBM Plex Sans Arabic', 'Alexandria', 'Almarai', 'Cairo', 'Readex Pro',
  'Aref Ruqaa', 'Noto Naskh Arabic', 'Noto Kufi Arabic', 'Lemonada', 'Changa', 'Reem Kufi', 'Kufam',
]);

// The ones drawn only as headings; a heading in a text font (a price row's name) stays a text font.
const HEAD_FONTS = new Set(['El Messiri', 'Amiri', 'Alexandria', 'Readex Pro', 'Aref Ruqaa', 'Noto Kufi Arabic', 'Lemonada', 'Changa', 'Reem Kufi', 'Kufam']);

const fontName = (f: unknown) => (typeof f === 'string' ? f.split(',')[0].replace(/['"]/g, '').trim() : '');

/** The look's colours by role. */
export const lookColours = (look: PageLook): TargetColours => {
  const dark = luminance(look.bg) < luminance(look.ink);
  return {
    bg: look.bg,
    card: look.card,
    line: look.line,
    ink: look.ink,
    muted: look.muted,
    accent: look.accent,
    soft: look.soft,
    deep: dark ? look.bg : look.ink,
    pale: dark ? look.ink : look.bg,
  };
};

/** Letters on the look's accent: the page background on gold, else white. */
export const buttonText = (look: PageLook) => (luminance(look.accent) > 0.3 ? look.bg : '#FFFFFF');

const cardRadius = (look: PageLook) => (look.radius > 100 ? 16 : look.radius);

interface Before {
  look?: PageLook; // the look the page has now, when it was given one
  palette?: [string, string, string, string, string];
}

const sourceFor = (before: Before, slide: Slide | undefined, kind: BuildKind, els: CanvasElement[]): SourceLook => {
  if (before.look) return sourceOf(lookColours(before.look), before.look.head, [[before.look.price, 'accent']]);
  const drawn = lookOf(slide?.aiTemplate, kind, els);
  return before.palette ? joinSources(drawn, sourceOf(targetColours(before.palette), drawn.head)) : drawn;
};

const newFont = (font: string, isHeading: boolean, slideHead: string, before: Before, look: PageLook) => {
  if (before.look) {
    const { head, body } = before.look;
    if (font === head && font === body) return isHeading ? look.head : look.body;
    if (font === head) return look.head;
    if (font === body) return look.body;
    return null;
  }
  if (!LOOK_FONTS.has(font)) return null;
  return font === slideHead || (isHeading && HEAD_FONTS.has(font)) ? look.head : look.body;
};

export const restyleElement = (e: CanvasElement, scene: RecolourScene, slideHead: string, before: Before, look: PageLook, corners: boolean): CanvasElement => {
  const to = scene.to;
  const next = recolourDeep(e, scene);
  const styles = { ...next.styles };
  const font = fontName(styles.fontFamily);
  const isHeading = e.type === 'heading';
  const swapped = font ? newFont(font, isHeading, slideHead, before, look) : null;
  if (swapped) {
    styles.fontFamily = swapped;
    if (swapped === look.head && swapped !== look.body && /^(bold|600)$/.test(String(styles.fontWeight ?? ''))) styles.fontWeight = look.headWeight >= 700 ? 'bold' : '600';
  }
  // Buttons take the look's corners, unless the owner set their own.
  if (e.type === 'button' && (corners || !before.look || styles.borderRadius === before.look.radius)) styles.borderRadius = look.radius;
  // Letters on the accent follow it, so they always read: dark on gold, white on the rest.
  if (e.type === 'button' && styles.backgroundColor === look.accent) styles.color = buttonText(look);
  next.styles = styles;

  // Store cards, ratings and the booking calendar: their colours are kept on the element.
  if (e.type === 'menuList') Object.assign(next, { menuCardBg: to.card, menuCardText: to.ink, menuCardRadius: cardRadius(look) }, { styles: { ...styles, color: look.price } });
  if (e.type === 'carListings') Object.assign(next, { carCardBg: to.card, carCardText: to.ink, carCardRadius: cardRadius(look) }, { styles: { ...styles, color: look.price } });
  if (e.type === 'shopProducts' || e.type === 'cart' || e.type === 'checkout') next.shopAccent = look.accent;
  if (e.type === 'ratings') next.ratingsAccentColor = look.accent;
  if (e.type === 'calendar') next.calendarAccentColor = look.accent;
  return next;
};

/**
 * Every page and element of the site in the given look. For a page just built by Wee AI (where no
 * button was set by the owner): `corners` gives the buttons the look's corners whatever they had,
 * and `keepNavbar` leaves the navbar's colours as the build set them (the AI chose its tone).
 */
export const applyPageLook = (
  pages: Page[],
  elements: CanvasElement[],
  look: PageLook,
  kind: BuildKind,
  { corners = false, keepNavbar = false }: { corners?: boolean; keepNavbar?: boolean } = {},
): { pages: Page[]; elements: CanvasElement[] } => {
  const to = lookColours(look);
  const palette: [string, string, string, string, string] = [look.bg, look.card, look.line, look.ink, look.accent];
  const bySlide = new Map<string, CanvasElement[]>();
  elements.forEach((e) => bySlide.set(e.slideId, [...(bySlide.get(e.slideId) || []), e]));
  const slideOf = new Map<string, { slide: Slide; before: Before }>();

  const nextPages = pages.map((p) => {
    const before: Before = { look: pageLookById(p.styleLook), palette: p.colorPalette };
    p.slides.forEach((s) => slideOf.set(s.id, { slide: s, before }));
    const sceneFor = (s: Slide | undefined): RecolourScene => {
      const look0 = sourceFor(before, s, kind, s ? bySlide.get(s.id) || [] : []);
      return { look: look0, to, onPhoto: !!s?.backgroundImage };
    };
    const navbar = recolourDeep(p.navbar, sceneFor(undefined));
    return {
      ...p,
      styleLook: look.id,
      colorPalette: palette,
      paletteMode: 'default' as const,
      navbar: {
        ...navbar,
        ...(keepNavbar
          ? {}
          : {
              // The lighter of background and card, so a white page keeps a white navbar.
              bgColor: luminance(look.bg) >= luminance(look.card) ? look.bg : look.card,
              textColor: look.ink,
              accentColor: look.accent,
              accentTextColor: buttonText(look),
            }),
        ...(navbar.itemsFontFamily && LOOK_FONTS.has(fontName(navbar.itemsFontFamily)) ? { itemsFontFamily: look.body } : {}),
      },
      slides: p.slides.map((s) => recolourDeep(s, sceneFor(s))),
    };
  });

  const nextElements = elements.map((e) => {
    const home = slideOf.get(e.slideId);
    if (!home) return e;
    const els = bySlide.get(e.slideId)!;
    const scene: RecolourScene = { look: sourceFor(home.before, home.slide, kind, els), to, onPhoto: !!home.slide.backgroundImage };
    const slideHead = fontName(els.find((x) => x.type === 'heading' && x.styles?.fontFamily)?.styles.fontFamily);
    return restyleElement(e, scene, slideHead, home.before, look, corners);
  });

  return { pages: nextPages, elements: nextElements };
};

/**
 * A ready slide (as the gallery hands it over) in the page's look, so a slide added to a page that
 * has a look arrives in it. Only the designs with a known look (aiTemplate) are restyled; the older
 * ready slides come as they are.
 */
export const lookSlide = <T extends { aiTemplate?: string; backgroundColor: string; elements: any[] }>(payload: T, look: PageLook | undefined, kind: BuildKind): T => {
  if (!look || !payload.aiTemplate) return payload;
  const { elements, ...slide } = payload;
  const id = '__ready';
  const page = { id, name: '', slug: '', slides: [{ ...slide, id } as unknown as Slide], navbar: { brandName: '', items: [], ctaText: '', ctaHref: '', bgColor: '', textColor: '', isSticky: false } } as Page;
  const els = elements.map((e, i) => ({ ...e, id: `${id}-${i}`, slideId: id })) as CanvasElement[];
  const next = applyPageLook([page], els, look, kind);
  const { id: _slideId, ...nextSlide } = next.pages[0].slides[0] as Slide & Record<string, unknown>;
  return {
    ...(nextSlide as unknown as T),
    elements: next.elements.map((e, i) => {
      const { id: _id, slideId: _sid, ...rest } = e;
      return { ...elements[i], ...rest };
    }),
  };
};

// The look a new store starts in (Eyad, 13 Oct: the shop too starts warm).
const STARTING_LOOK: Partial<Record<BuildKind, string>> = { restaurant: 'homey', shop: 'homey', cars: 'bold' };

/** A new store's template in its starting look. */
export const inStartingLook = (site: { pages: Page[]; elements: CanvasElement[] }, kind: BuildKind) => {
  const look = pageLookById(STARTING_LOOK[kind]);
  return look ? applyPageLook(site.pages, site.elements, look, kind) : site;
};

/** The colours a page's slide is drawn in now: its look's when the page has one. */
export const slideSource = (page: Page, slide: Slide | undefined, kind: BuildKind, els: CanvasElement[]): SourceLook => {
  const look = pageLookById(page.styleLook);
  return look ? sourceFor({ look }, slide, kind, els) : lookOf(slide?.aiTemplate, kind, els);
};

// Recolouring a ready slide to the owner's palette for «ابن صفحتي». Every ready slide comes in a
// known look (the kitchen, law office or painter of the 17 designs, or the restaurant, shop or car
// showroom colours), so each of its colours has a role: background, card, line, text, muted text,
// accent, soft accent or dark band. Each role gets the matching colour of the chosen palette.
// White, black, WhatsApp green and gold stay as they are, dark veils over photos stay dark, and a
// colour with transparency keeps its transparency.

import { WEE_LOOKS } from '../data/weeSlideTemplates';
import { REST_COLORS } from '../data/restaurantTemplate';
import { SHOP_SLIDE_COLORS } from '../data/shopSlideTemplates';
import { CAR_SLIDE_COLORS } from '../data/carSlideTemplates';

type Rgb = [number, number, number];

export interface TargetColours {
  bg: string;
  card: string;
  line: string;
  ink: string;
  muted: string;
  accent: string;
  soft: string;
  deep: string; // the darker of background and text: dark bands
  pale: string; // the lighter of the two: text on dark bands
}
export type Role = keyof TargetColours;
export type SourceLook = { roles: [string, Role][]; dark?: boolean; head: string };

const hexToRgb = (hex: string): Rgb | null => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb;
};
const toHex = (c: Rgb) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
const mix = (a: string, b: string, t: number) => {
  const x = hexToRgb(a)!;
  const y = hexToRgb(b)!;
  return toHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t) as Rgb);
};
const dist = (a: Rgb, b: Rgb) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const luminance = (c: Rgb | string) => {
  const rgb = typeof c === 'string' ? hexToRgb(c) : c;
  if (!rgb) return 1;
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** The roles' colours from a palette [bg, card, border, text, accent] and the owner's colour. */
export const targetColours = (palette: string[], accentColor?: string): TargetColours => {
  const [bg, card, line, ink, paletteAccent] = palette;
  const accent = accentColor || paletteAccent;
  const darkPage = luminance(bg) < luminance(ink);
  return {
    bg,
    card,
    line,
    ink,
    muted: mix(ink, bg, 0.3),
    accent,
    soft: mix(accent, bg, 0.86),
    deep: darkPage ? bg : ink,
    pale: darkPage ? ink : bg,
  };
};

/** White or near-black, whichever reads on this colour. */
export const textOn = (fill: string) => (luminance(fill) < 0.42 ? '#FFFFFF' : '#111111');

const wee = (L: (typeof WEE_LOOKS)['kitchen'], dark = false): SourceLook => ({
  roles: [[L.bg, 'bg'], [L.card, 'card'], [L.line, 'line'], [L.ink, 'ink'], [L.muted, 'muted'], [L.accent, 'accent'], [L.soft, 'soft']],
  dark,
  head: L.head,
});

const LOOKS: Record<string, SourceLook> = {
  kitchen: wee(WEE_LOOKS.kitchen),
  law: wee(WEE_LOOKS.law, true),
  painter: wee(WEE_LOOKS.painter),
  restaurant: {
    roles: [[REST_COLORS.ink, 'ink'], [REST_COLORS.body, 'muted'], [REST_COLORS.muted, 'muted'], [REST_COLORS.accent, 'accent'], [REST_COLORS.cream, 'bg'], [REST_COLORS.dark, 'deep']],
    head: 'El Messiri',
  },
  shop: {
    roles: [[SHOP_SLIDE_COLORS.ink, 'ink'], [SHOP_SLIDE_COLORS.body, 'muted'], [SHOP_SLIDE_COLORS.muted, 'muted'], [SHOP_SLIDE_COLORS.accent, 'accent'], [SHOP_SLIDE_COLORS.cream, 'bg']],
    head: 'El Messiri',
  },
  cars: {
    roles: [[CAR_SLIDE_COLORS.ink, 'ink'], [CAR_SLIDE_COLORS.body, 'muted'], [CAR_SLIDE_COLORS.muted, 'muted'], [CAR_SLIDE_COLORS.accent, 'accent'], [CAR_SLIDE_COLORS.light, 'bg']],
    head: 'Alexandria',
  },
};

/** The look a slide was drawn in: the store's own for its slides, else by the 17 designs' heading font. */
export const lookOf = (aiTemplate: string | undefined, kind: string, elements: { type: string; styles?: any }[]): SourceLook => {
  const prefix = aiTemplate?.split('.')[0];
  if (prefix === 'rest') return LOOKS.restaurant;
  if (prefix === 'shop' || prefix === 'cars') return LOOKS[prefix];
  if (!aiTemplate) return LOOKS[kind] || LOOKS.kitchen;
  const head = elements.find((e) => e.type === 'heading' && e.styles?.fontFamily)?.styles.fontFamily;
  if (head === WEE_LOOKS.law.head) return LOOKS.law;
  if (head === WEE_LOOKS.painter.head) return LOOKS.painter;
  return LOOKS.kitchen;
};

/** A look whose colours are known role by role: a page look applied before, or a page palette. */
export const sourceOf = (to: TargetColours, head: string, extra: [string, Role][] = []): SourceLook => {
  const dark = toneColours(to, 'dark');
  const roles = (Object.keys(to) as Role[]).map((r) => [to[r], r] as [string, Role]);
  return {
    roles: [...roles, ...extra, [dark.bg, 'deep'], [dark.ink, 'pale'], [toneColours(to, 'tint').bg, 'soft']],
    dark: luminance(to.bg) < luminance(to.ink),
    head,
  };
};

/** Two sources as one: a slide drawn in a known look and then given a page palette. */
export const joinSources = (a: SourceLook, b: SourceLook): SourceLook => ({ roles: [...a.roles, ...b.roles], dark: a.dark, head: a.head });

const KEEP = ['#000000', '#1F9D55', '#D4AF37'].map((h) => hexToRgb(h)!);
const WHITE: Rgb = [255, 255, 255];

const roleOf = (rgb: Rgb, look: SourceLook): Role | null => {
  let best: Role | null = null;
  let bestDist = 45;
  for (const [hex, role] of look.roles) {
    const d = dist(rgb, hexToRgb(hex)!);
    if (d < bestDist) {
      best = role;
      bestDist = d;
    }
  }
  return best;
};

// 'fill': backgrounds; 'text': letters; 'other': borders, glows, shadows.
type Use = 'fill' | 'text' | 'other';
const COLOUR = /#[0-9a-f]{6}\b|#[0-9a-f]{3}\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/gi;

export interface RecolourScene {
  look: SourceLook;
  to: TargetColours;
  onPhoto: boolean; // the slide has a photo or video behind it
  whiteIsInk?: boolean; // white letters on this slide sit on its background (a section turned dark)
}

const mapColour = (found: string, use: Use, scene: RecolourScene) => {
  let rgb: Rgb | null;
  let alpha = 1;
  if (found.startsWith('#')) rgb = hexToRgb(found);
  else {
    const n = found.match(/[\d.]+/g)!.map(Number);
    rgb = [n[0], n[1], n[2]];
    alpha = n[3] ?? 1;
  }
  if (!rgb) return found;
  // A dark veil keeps photos readable under white text (Eyad, 12 Oct: transparency stays where needed).
  if (alpha < 1 && alpha >= 0.4 && luminance(rgb) < 0.05) return found;
  if (KEEP.some((k) => dist(k, rgb!) < 4)) return found;
  let role: Role | null;
  if (dist(rgb, WHITE) < 4) {
    if (alpha < 1) return found;
    if (use === 'fill') role = 'card';
    // White letters straight on a design's background (not on a photo or a coloured band) follow
    // the text colour: a dark design on a light page, or a light one turned dark.
    else if (use === 'text' && !scene.onPhoto && (scene.look.dark || scene.whiteIsInk)) role = 'ink';
    else return found;
  } else role = roleOf(rgb, scene.look);
  if (!role) return found;
  if (use === 'fill' && (role === 'ink' || role === 'muted')) role = 'deep';
  if (use === 'text' && (role === 'bg' || role === 'card' || role === 'soft' || role === 'line')) role = 'pale';
  const out = scene.to[role];
  if (alpha >= 1) return out;
  const [r, g, b] = hexToRgb(out)!;
  return `rgba(${r},${g},${b},${alpha})`;
};

const recolourString = (value: string, use: Use, scene: RecolourScene) => value.replace(COLOUR, (m) => mapColour(m, use, scene));

const USE_OF: Record<string, Use> = {
  backgroundColor: 'fill',
  menuCardBg: 'fill',
  carCardBg: 'fill',
  color: 'text',
  content: 'text',
  menuCardText: 'text',
  carCardText: 'text',
};
// Addresses and code, never colours.
const SKIP = new Set(['imageUrl', 'videoUrl', 'linkUrl', 'lottieUrl', 'htmlCode', 'mapLocation', 'linkTargetId', 'id', 'slideId', 'aiSlot', 'aiTemplate', 'backgroundImage', 'backgroundVideo']);

/** Every colour in an element (its styles, inline colours in its text, card colours…) recoloured. */
export const recolourDeep = <T>(value: T, scene: RecolourScene, use: Use = 'other'): T => {
  if (typeof value === 'string') return recolourString(value, use, scene) as T;
  if (Array.isArray(value)) return value.map((v) => recolourDeep(v, scene, use)) as T;
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SKIP.has(k) || (k === 'content' && typeof v === 'string' && /^(https?:|data:|\/|iconify:)/.test(v))) out[k] = v;
    else out[k] = recolourDeep(v, scene, USE_OF[k] || use);
  }
  return out as T;
};

/**
 * The page's colours from the owner's own choice (Wee AI step 6): the accent, and the choice's second
 * colour as the page background when it is light, or a dark page when it is dark. Text, lines and
 * cards come from the accent's own hue, so the whole page is the owner's colour.
 */
export const ownerPalette = (accent: string, second?: string): [string, string, string, string, string] => {
  if (second && luminance(second) < 0.06) {
    const bg = second;
    return [bg, mix(bg, '#ffffff', 0.06), mix(bg, '#ffffff', 0.14), mix(accent, '#ffffff', 0.9), accent];
  }
  const bg = second && luminance(second) > 0.8 ? second : mix(accent, '#ffffff', 0.95);
  return [bg, '#ffffff', mix(accent, '#ffffff', 0.78), mix(accent, '#000000', 0.82), accent];
};

/** A section's colours for its tone: the page's own (light), the accent faintly (tint), or dark. */
export const toneColours = (to: TargetColours, tone: 'light' | 'tint' | 'dark' | undefined): TargetColours => {
  if (tone === 'tint') return { ...to, bg: to.soft, soft: mix(to.accent, to.bg, 0.72) };
  if (tone !== 'dark') return to;
  const deep = luminance(to.deep) < 0.02 ? to.deep : mix(to.deep, '#000000', 0.25);
  const pale = luminance(to.pale) > 0.7 ? to.pale : '#F5F5F4';
  return {
    bg: deep,
    card: mix(deep, pale, 0.07),
    line: mix(deep, pale, 0.16),
    ink: pale,
    muted: mix(pale, deep, 0.3),
    accent: to.accent,
    soft: mix(to.accent, deep, 0.78),
    deep,
    pale,
  };
};

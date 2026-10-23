// «تصميم حر» (Eyad, 23 Oct): the AI designs the page's slides itself, out of the platform's own elements, effects and motions, instead of
// filling a ready slide. It answers with a short JSON on the 1280-wide canvas (a `FreeDesign`); nothing it writes is trusted:
// `cleanFreeDesign` keeps only what the platform has (element kinds, fonts, icons, motions, effects), clamps every number and colour,
// and `freeToBuilt` turns the result into the slides and elements the editor holds, with a phone layout made the usual way.
import type { CanvasElement, Slide } from '../types';
import { arrangeSlideForMobile, DESKTOP_CANVAS_WIDTH } from './mobileLayout';
import { TEXT_EFFECTS } from './textEffects';

export const FREE_KINDS = ['heading', 'text', 'button', 'image', 'icon', 'shape', 'badge'] as const;
export type FreeKind = (typeof FREE_KINDS)[number];

export const FREE_FONTS = ['Cairo', 'Tajawal', 'Almarai', 'Alexandria', 'El Messiri', 'Amiri', 'IBM Plex Sans Arabic', 'Noto Kufi Arabic', 'Noto Naskh Arabic', 'Reem Kufi', 'Kufam', 'Readex Pro', 'Changa', 'Lemonada', 'Aref Ruqaa'];
// Entrance and looping motions the AI may give an element, and the triggers they play on.
export const FREE_MOTIONS = ['none', 'fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'scale-up', 'pulse', 'float', 'bounce', 'heartbeat', 'swing', 'shake', 'spin-slow', 'marquee-rtl', 'marquee-ltr'];
export const FREE_TRIGGERS = ['once', 'scroll', 'loop', 'hover'] as const;
export const FREE_SHAPES = ['rect', 'circle', 'line-gradient', 'line-glow', 'line-wavy', 'line-dotted'] as const;
export const FREE_EFFECTS = TEXT_EFFECTS.map((t) => t.id).filter((id) => id !== 'image-fill');
export const FREE_LINKS = /^(whatsapp|phone|page:(menu|products|cars|cart|contact)|slide:\d{1,2})$/;
export const MAX_SECTIONS = 10;
export const MAX_ELEMENTS = 26;

export interface FreeElement {
  kind: FreeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  size?: number;
  bold?: boolean;
  color?: string;
  align?: 'right' | 'center' | 'left';
  font?: 'head' | 'body';
  bg?: string;
  radius?: number;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: string; // border colour (1–4px)
  opacity?: number; // 0..1
  icon?: string;
  photo?: string; // search words for a photo
  shape?: (typeof FREE_SHAPES)[number];
  link?: string;
  motion?: string;
  trigger?: (typeof FREE_TRIGGERS)[number];
  effect?: string;
  effectColor?: string;
}
export interface FreeSection {
  key: string; // stable name the chat edits refer to
  name: string;
  height: number;
  bg: string;
  photo?: string; // background photo search words
  overlay?: string; // colour laid over the background photo (to keep the text readable)
  elements: FreeElement[];
}
export interface FreeDesign {
  look: { head: string; body: string };
  sections: FreeSection[];
}

export interface FreeContext {
  icons: ReadonlySet<string>;
  fonts?: readonly string[];
  /** Numbers the owner wrote; a text with another figure keeps no figure at all. Leave out to skip the check. */
  figuresOk?: (text: string) => boolean;
}

const HEX = /^#[0-9a-f]{6}$/i;
const num = (v: unknown, lo: number, hi: number, fallback: number) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : fallback;
};
const hex = (v: unknown, fallback?: string) => (typeof v === 'string' && HEX.test(v.trim()) ? v.trim().toLowerCase() : fallback);
const words = (v: unknown) => (typeof v === 'string' && /^[a-z0-9][a-z0-9 ,\-]{1,78}$/i.test(v.trim()) ? v.trim() : undefined);
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/<[^>]*>/g, '').trim().slice(0, max) : '');
const oneOf = <T extends string>(v: unknown, list: readonly T[]): T | undefined => (list as readonly string[]).includes(v as string) ? (v as T) : undefined;

const TEXTY: FreeKind[] = ['heading', 'text', 'button', 'badge'];

export const cleanFreeElement = (raw: any, ctx: FreeContext, slideHeight: number): FreeElement | null => {
  const kind = oneOf(raw?.kind, FREE_KINDS);
  if (!kind) return null;
  const w = num(raw.w, 24, DESKTOP_CANVAS_WIDTH, kind === 'icon' ? 48 : 200);
  const h = num(raw.h, 4, 1400, kind === 'icon' ? 48 : 60);
  const e: FreeElement = { kind, x: num(raw.x, 0, DESKTOP_CANVAS_WIDTH - w, 0), y: num(raw.y, 0, Math.max(0, slideHeight - 4), 0), w, h };
  if (TEXTY.includes(kind)) {
    const t = text(raw.text, kind === 'heading' ? 120 : kind === 'badge' ? 40 : kind === 'button' ? 40 : 600);
    if (!t) return null;
    if (ctx.figuresOk && !ctx.figuresOk(t)) return null;
    e.text = t;
    e.size = num(raw.size, 11, 120, kind === 'heading' ? 40 : 18);
    e.bold = typeof raw.bold === 'boolean' ? raw.bold : kind === 'heading' || kind === 'button';
    e.color = hex(raw.color);
    e.align = oneOf(raw.align, ['right', 'center', 'left'] as const);
    e.font = oneOf(raw.font, ['head', 'body'] as const);
    const effect = oneOf(raw.effect, FREE_EFFECTS as readonly string[]);
    if (effect && kind !== 'button') {
      e.effect = effect;
      e.effectColor = hex(raw.effectColor);
    }
  }
  if (kind === 'icon') {
    if (typeof raw.icon !== 'string' || !ctx.icons.has(raw.icon)) return null;
    e.icon = raw.icon;
    e.color = hex(raw.color);
  }
  if (kind === 'image') {
    const p = words(raw.photo);
    if (!p) return null;
    e.photo = p;
  }
  if (kind === 'shape') e.shape = oneOf(raw.shape, FREE_SHAPES) || 'rect';
  if (kind !== 'icon') {
    e.bg = hex(raw.bg);
    if (raw.radius !== undefined) e.radius = num(raw.radius, 0, 200, 0);
    e.border = hex(raw.border);
  }
  if (kind !== 'icon' && raw.shadow) e.shadow = oneOf(raw.shadow, ['none', 'sm', 'md', 'lg'] as const);
  if (raw.opacity !== undefined) e.opacity = Math.min(1, Math.max(0.05, Number(raw.opacity) || 1));
  if (kind === 'button' || kind === 'badge') {
    if (typeof raw.link === 'string' && FREE_LINKS.test(raw.link)) e.link = raw.link;
  }
  const motion = oneOf(raw.motion, FREE_MOTIONS);
  if (motion && motion !== 'none') {
    e.motion = motion;
    e.trigger = oneOf(raw.trigger, FREE_TRIGGERS) || (['pulse', 'float', 'bounce', 'heartbeat', 'swing', 'spin-slow', 'marquee-rtl', 'marquee-ltr'].includes(motion) ? 'loop' : 'scroll');
  }
  return e;
};

export const cleanFreeSection = (raw: any, ctx: FreeContext, i = 0): FreeSection | null => {
  if (!raw || typeof raw !== 'object') return null;
  const height = num(raw.height, 240, 1400, 640);
  const key = typeof raw.key === 'string' && /^[a-z0-9_-]{1,30}$/i.test(raw.key) ? raw.key : `s${i + 1}`;
  const elements = (Array.isArray(raw.elements) ? raw.elements : [])
    .slice(0, MAX_ELEMENTS)
    .map((e: unknown) => cleanFreeElement(e, ctx, height))
    .filter((e: FreeElement | null): e is FreeElement => !!e);
  if (!elements.length) return null;
  return { key, name: text(raw.name, 40) || `قسم ${i + 1}`, height, bg: hex(raw.bg, '#ffffff')!, photo: words(raw.photo), overlay: hex(raw.overlay), elements };
};

/** The model's answer made safe: only the platform's parts, in bounds. Throws a short reason when nothing usable is left. */
export const cleanFreeDesign = (raw: any, ctx: FreeContext, allowEmpty = false): FreeDesign => {
  const fonts = ctx.fonts || FREE_FONTS;
  const head = fonts.includes(raw?.look?.head) ? raw.look.head : fonts[0];
  const body = fonts.includes(raw?.look?.body) ? raw.look.body : head;
  const seen = new Set<string>();
  const sections: FreeSection[] = [];
  for (const [i, s] of (Array.isArray(raw?.sections) ? raw.sections : []).slice(0, MAX_SECTIONS).entries()) {
    const c = cleanFreeSection(s, ctx, i);
    if (!c) continue;
    if (seen.has(c.key)) c.key = `${c.key}-${i + 1}`;
    seen.add(c.key);
    sections.push(c);
  }
  if (!sections.length && !allowEmpty) throw new Error('empty_design');
  return { look: { head, body }, sections };
};

/** A chat edit: the sections the model returned replace the ones with the same key (in place), new keys are added at the end. */
export const patchFreeDesign = (current: FreeDesign, patch: FreeDesign, remove: string[] = []): FreeDesign => {
  const byKey = new Map(patch.sections.map((s) => [s.key, s]));
  const kept = current.sections.filter((s) => !remove.includes(s.key)).map((s) => byKey.get(s.key) || s);
  const added = patch.sections.filter((s) => !current.sections.some((c) => c.key === s.key));
  return { look: patch.look, sections: [...kept, ...added].slice(0, MAX_SECTIONS) };
};

export interface BuiltFree {
  slides: Slide[];
  elements: CanvasElement[];
  /** Photo search words the browser still has to turn into pictures (element id or slide id → words). */
  photos: { slideId: string; elementId?: string; words: string }[];
}

const SHADOWS: Record<string, string> = { none: 'none', sm: 'sm', md: 'md', lg: 'lg' };

export const freeToBuilt = (design: FreeDesign, o: { idPrefix: string; photoUrl?: (words: string) => string | undefined; linkFor?: (link: string) => Partial<CanvasElement> | null }): BuiltFree => {
  const slides: Slide[] = [];
  const elements: CanvasElement[] = [];
  const photos: BuiltFree['photos'] = [];
  for (const s of design.sections) {
    const slideId = `${o.idPrefix}-${s.key}`;
    const slide: Slide = { id: slideId, name: s.name, height: s.height, backgroundColor: s.bg, dividerShape: 'straight' };
    if (s.photo) {
      const url = o.photoUrl?.(s.photo);
      if (url) slide.backgroundImage = url;
      else photos.push({ slideId, words: s.photo });
    }
    const made: CanvasElement[] = [];
    if (s.photo && s.overlay) {
      made.push({ id: `${slideId}-el-0`, name: 'طبقة الصورة', type: 'shape', x: 0, y: 0, width: DESKTOP_CANVAS_WIDTH, height: s.height, content: '', slideId, styles: { backgroundColor: s.overlay, opacity: 0.55 } } as CanvasElement);
    }
    for (const e of s.elements) {
      const id = `${slideId}-el-${made.length}`;
      const styles: CanvasElement['styles'] = {};
      const font = e.font === 'head' ? design.look.head : design.look.body;
      if (e.kind === 'heading' || e.kind === 'text' || e.kind === 'button' || e.kind === 'badge') {
        styles.fontSize = e.size;
        styles.fontWeight = e.bold ? 'bold' : 'normal';
        styles.fontFamily = e.font ? font : e.kind === 'heading' ? design.look.head : design.look.body;
        styles.textAlign = e.align || (e.kind === 'button' || e.kind === 'badge' ? 'center' : 'right');
        if (e.color) styles.color = e.color;
        if (e.effect) {
          styles.textEffect = e.effect;
          if (e.effectColor) styles.textEffectColor = e.effectColor;
        }
      }
      if (e.kind === 'icon' && e.color) styles.color = e.color;
      if (e.bg) styles.backgroundColor = e.bg;
      if (e.radius !== undefined) styles.borderRadius = e.radius;
      if (e.kind === 'button' && styles.borderRadius === undefined) styles.borderRadius = 9999;
      if (e.border) Object.assign(styles, { borderColor: e.border, borderWidth: 2, borderStyle: 'solid' });
      if (e.shadow) styles.shadow = SHADOWS[e.shadow] as NonNullable<CanvasElement['styles']['shadow']>;
      if (e.opacity !== undefined) styles.opacity = e.opacity;
      if (e.motion) {
        styles.animation = e.motion;
        styles.animationTrigger = e.trigger;
      }
      const type = e.kind === 'text' ? 'paragraph' : e.kind;
      const el: CanvasElement = { id, name: e.kind === 'heading' ? 'عنوان' : e.kind === 'text' ? 'نص' : e.kind === 'button' ? 'زر' : e.kind === 'image' ? 'صورة' : e.kind === 'icon' ? 'أيقونة' : e.kind === 'badge' ? 'شارة' : 'شكل', type: type as CanvasElement['type'], x: e.x, y: e.y, width: e.w, height: e.h, content: e.text || '', slideId, styles };
      if (e.kind === 'icon') el.content = `iconify:${e.icon}`;
      if (e.kind === 'shape') el.content = e.shape === 'circle' || e.shape === 'rect' ? '' : e.shape!;
      if (e.kind === 'shape' && e.shape === 'circle') styles.borderRadius = 9999;
      if (e.kind === 'image') {
        styles.objectFit = 'cover';
        const url = o.photoUrl?.(e.photo!);
        if (url) {
          el.content = url;
          el.imageUrl = url;
        } else photos.push({ slideId, elementId: id, words: e.photo! });
      }
      if (e.link && o.linkFor) Object.assign(el, o.linkFor(e.link) || {});
      made.push(el);
    }
    const { layouts, mobileHeight } = arrangeSlideForMobile(slide, made.map((m) => ({ ...m, mobile: undefined })));
    slides.push({ ...slide, mobileHeight });
    elements.push(...made.map((m) => ({ ...m, mobile: layouts.get(m.id) })));
  }
  return { slides, elements, photos };
};

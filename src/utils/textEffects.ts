// Ready-made looks for a text's letters (glow, shadow, outline, fill, highlight, motion), like the
// text effects of Canva. Each is plain CSS on the text, so it costs nothing to load and shows the same
// in the editor, the preview and the published site. The motions move whole words: Arabic letters are
// joined, so nothing here splits a word into letters.
import type React from 'react';
import type { ElementStyles } from '../types';

export type TextEffectGroup = 'glow' | 'shadow' | 'outline' | 'fill' | 'highlight' | 'motion';

export const TEXT_EFFECT_GROUPS: { id: TextEffectGroup; name: string }[] = [
  { id: 'glow', name: 'توهج' },
  { id: 'shadow', name: 'ظل' },
  { id: 'outline', name: 'إطار الحروف' },
  { id: 'fill', name: 'تعبئة' },
  { id: 'highlight', name: 'تمييز' },
  { id: 'motion', name: 'حركة' },
];

export interface TextEffectDef {
  id: string;
  name: string;
  group: TextEffectGroup;
  // The effect's own colour when the user has picked none.
  color?: string;
  // A second colour (two-colour glow, gradients, the shadow of a hollow text).
  color2?: string;
  // Drawn on a dark tile in the picker (glows read best on dark).
  dark?: boolean;
  // Uses a picture inside the letters.
  image?: boolean;
}

export const TEXT_EFFECTS: TextEffectDef[] = [
  { id: 'neon', name: 'نيون', group: 'glow', color: '#ff2bd6', dark: true },
  { id: 'soft-glow', name: 'توهج ناعم', group: 'glow', color: '#38bdf8', dark: true },
  { id: 'dual-glow', name: 'توهج بلونين', group: 'glow', color: '#f43f5e', color2: '#22d3ee', dark: true },
  { id: 'neon-pulse', name: 'نيون نابض', group: 'glow', color: '#a855f7', dark: true },
  { id: 'gold-glow', name: 'توهج ذهبي', group: 'glow', color: '#f5b301', dark: true },
  { id: 'laser', name: 'ليزر', group: 'glow', color: '#00ff9c', dark: true },

  { id: 'shadow-soft', name: 'ظل ناعم', group: 'shadow', color: '#000000' },
  { id: 'shadow-hard', name: 'ظل حاد', group: 'shadow', color: '#f97316' },
  { id: 'shadow-long', name: 'ظل طويل', group: 'shadow', color: '#94a3b8' },
  { id: 'shadow-3d', name: 'ثلاثي الأبعاد', group: 'shadow', color: '#2563eb' },
  { id: 'lifted', name: 'مرفوع', group: 'shadow', color: '#000000' },
  { id: 'engraved', name: 'محفور', group: 'shadow', color: '#ffffff' },

  { id: 'hollow', name: 'حروف مجوفة', group: 'outline' },
  { id: 'outline-fill', name: 'إطار مع تعبئة', group: 'outline', color: '#111827' },
  { id: 'double-outline', name: 'إطار مزدوج', group: 'outline', color: '#2563eb' },
  { id: 'hollow-shadow', name: 'مجوف مع ظل', group: 'outline', color2: '#f43f5e' },
  { id: 'stamp', name: 'ختم', group: 'outline', color: '#dc2626' },

  { id: 'gradient', name: 'تدرج لوني', group: 'fill', color: '#6366f1', color2: '#ec4899' },
  { id: 'rainbow', name: 'قوس قزح', group: 'fill' },
  { id: 'gold', name: 'ذهبي معدني', group: 'fill', dark: true },
  { id: 'chrome', name: 'كروم فضي', group: 'fill', dark: true },
  { id: 'image-fill', name: 'صورة بالحروف', group: 'fill', image: true },
  { id: 'gradient-move', name: 'تدرج متحرك', group: 'fill', color: '#06b6d4', color2: '#8b5cf6' },
  { id: 'glass', name: 'زجاجي', group: 'fill', dark: true },

  { id: 'highlight-bg', name: 'خلفية للكلمة', group: 'highlight', color: '#fde047' },
  { id: 'marker', name: 'قلم فوسفوري', group: 'highlight', color: '#86efac' },
  { id: 'underline-color', name: 'خط ملون تحت', group: 'highlight', color: '#f43f5e' },
  { id: 'box', name: 'صندوق', group: 'highlight', color: '#2563eb' },

  { id: 'typewriter', name: 'كتابة تدريجية', group: 'motion' },
  { id: 'shine', name: 'لمعة', group: 'motion', color: '#ffffff' },
  { id: 'wave', name: 'تموّج', group: 'motion' },
  { id: 'appear', name: 'ظهور ناعم', group: 'motion' },
];

// The ones shown in the panel itself; the rest open in the side panel.
export const FEATURED_TEXT_EFFECTS = ['neon', 'shadow-3d', 'hollow', 'gradient', 'gold', 'highlight-bg', 'shine'];

// Pictures that can fill the letters (Unsplash, which loads in Syria).
export const TEXT_EFFECT_IMAGES = [
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=70',
];

export const textEffectById = (id?: string) => (id ? TEXT_EFFECTS.find((e) => e.id === id) : undefined);

// '#rrggbb' + alpha 0..1 → rgba(); anything else is returned as it is.
const alpha = (color: string, a: number) => {
  const m = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const clip = (backgroundImage: string): React.CSSProperties => ({
  backgroundImage,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
});

export interface TextEffectStyles {
  // On the text's block (heading, paragraph, button label).
  block: React.CSSProperties;
  // On a span around the words, for looks that follow the lines of text (highlights).
  inline?: React.CSSProperties;
}

// The CSS of a text's effect. `base` is the text's own colour, `words` its number of words.
export const getTextEffectStyles = (styles: ElementStyles, words = 3): TextEffectStyles | null => {
  const def = textEffectById(styles.textEffect);
  if (!def) return null;
  const c = styles.textEffectColor || def.color || '#2563eb';
  const c2 = styles.textEffectColor2 || def.color2 || '#ec4899';
  const base = styles.color && !styles.color.includes('gradient') ? styles.color : '#1d1d1f';
  // Strength: 0..100, 50 is the effect as designed.
  const k = Math.max(0.1, (styles.textEffectIntensity ?? 50) / 50);
  const px = (n: number) => `${Math.round(n * k * 10) / 10}px`;
  const layers = (n: number, f: (i: number) => string) => Array.from({ length: Math.max(1, Math.round(n)) }, (_, i) => f(i + 1)).join(', ');

  switch (def.id) {
    case 'neon':
    case 'neon-pulse':
      return {
        block: {
          color: '#fff',
          textShadow: `0 0 ${px(2)} #fff, 0 0 ${px(6)} ${c}, 0 0 ${px(14)} ${c}, 0 0 ${px(28)} ${c}, 0 0 ${px(44)} ${alpha(c, 0.6)}`,
          animation: def.id === 'neon-pulse' ? 'fx-flicker 2.6s linear infinite' : undefined,
        },
      };
    case 'soft-glow':
      return { block: { textShadow: `0 0 ${px(10)} ${c}, 0 0 ${px(22)} ${alpha(c, 0.5)}` } };
    case 'dual-glow':
      return { block: { textShadow: `${px(-3)} 0 ${px(10)} ${c}, ${px(3)} 0 ${px(10)} ${c2}, 0 0 ${px(24)} ${alpha(c2, 0.4)}` } };
    case 'gold-glow':
      return { block: { color: '#ffe8a3', textShadow: `0 0 ${px(6)} ${c}, 0 0 ${px(16)} ${alpha(c, 0.75)}, 0 0 ${px(30)} ${alpha(c, 0.45)}` } };
    case 'laser':
      return { block: { color: '#f0fff8', textShadow: `0 0 1px #fff, 0 0 ${px(4)} ${c}, 0 ${px(2)} ${px(16)} ${c}, 0 0 ${px(30)} ${alpha(c, 0.5)}` } };

    case 'shadow-soft':
      return { block: { textShadow: `0 ${px(4)} ${px(12)} ${alpha(c, 0.3)}` } };
    case 'shadow-hard':
      return { block: { textShadow: `${px(3)} ${px(3)} 0 ${c}` } };
    case 'shadow-long':
      return { block: { textShadow: layers(12 * k, (i) => `${i}px ${i}px 0 ${alpha(c, Math.max(0.08, 0.5 - i * 0.025))}`) } };
    case 'shadow-3d':
      return { block: { textShadow: `${layers(5 * k, (i) => `0 ${i}px 0 ${c}`)}, 0 ${px(7)} ${px(10)} rgba(0,0,0,0.35)` } };
    case 'lifted':
      return { block: { textShadow: `0 1px 0 rgba(255,255,255,0.7), 0 ${px(10)} ${px(18)} ${alpha(c, 0.35)}`, transform: `translateY(${px(-2)})` } };
    case 'engraved':
      return { block: { textShadow: `0 1px 0 ${alpha(c, 0.75)}, 0 -1px 0 rgba(0,0,0,${Math.min(0.6, 0.3 * k)})` } };

    case 'hollow':
      return { block: { WebkitTextStroke: `${px(1.5)} ${styles.textEffectColor || base}`, WebkitTextFillColor: 'transparent', color: 'transparent' } };
    case 'outline-fill':
      return { block: { WebkitTextStroke: `${px(3)} ${c}`, paintOrder: 'stroke fill' } };
    case 'double-outline': {
      const d = 3 * k + 2;
      const ring = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]]
        .map(([x, y]) => `${(x * d).toFixed(1)}px ${(y * d).toFixed(1)}px 0 ${c}`)
        .join(', ');
      return { block: { WebkitTextStroke: '2px #ffffff', paintOrder: 'stroke fill', textShadow: ring } };
    }
    case 'hollow-shadow':
      return {
        block: {
          WebkitTextStroke: `1.5px ${styles.textEffectColor || base}`,
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
          textShadow: `${px(4)} ${px(4)} 0 ${c2}`,
        },
      };
    case 'stamp':
      return {
        block: {},
        inline: {
          color: c,
          border: `${px(2.5)} solid ${c}`,
          borderRadius: '0.25em',
          padding: '0 0.3em',
          display: 'inline-block',
          transform: 'rotate(-4deg)',
          opacity: 0.88,
          textShadow: `0 0 1px ${alpha(c, 0.6)}`,
        },
      };

    case 'gradient':
      return { block: clip(`linear-gradient(90deg, ${c}, ${c2})`) };
    case 'rainbow':
      return { block: clip('linear-gradient(90deg, #f43f5e, #f59e0b, #22c55e, #3b82f6, #a855f7)') };
    case 'gold':
      return {
        block: {
          ...clip('linear-gradient(180deg, #fff6c2 0%, #f5c542 42%, #a8740a 52%, #ffe38a 100%)'),
          filter: `drop-shadow(0 ${px(2)} ${px(3)} rgba(0,0,0,0.35))`,
        },
      };
    case 'chrome':
      return {
        block: {
          ...clip('linear-gradient(180deg, #ffffff 0%, #d4d4d8 45%, #52525b 51%, #e4e4e7 100%)'),
          filter: `drop-shadow(0 ${px(2)} ${px(3)} rgba(0,0,0,0.35))`,
        },
      };
    case 'image-fill':
      return {
        block: {
          ...clip(`url("${styles.textEffectImage || TEXT_EFFECT_IMAGES[0]}")`),
          // Until the picture has loaded (or if it can't), the letters show in the text's colour.
          backgroundColor: base,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        },
      };
    case 'gradient-move':
      return {
        block: {
          ...clip(`linear-gradient(90deg, ${c}, ${c2}, ${c})`),
          backgroundSize: '200% 100%',
          animation: 'fx-gradient-move 4s linear infinite',
        },
      };
    case 'glass':
      return {
        block: {
          color: 'rgba(255,255,255,0.28)',
          WebkitTextStroke: '1px rgba(255,255,255,0.85)',
          textShadow: `0 ${px(4)} ${px(16)} rgba(0,0,0,0.25)`,
        },
      };

    case 'highlight-bg':
      return { block: {}, inline: { backgroundColor: c, padding: '0 0.25em', borderRadius: '0.2em', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' } };
    case 'marker': {
      const top = Math.max(20, Math.min(80, 100 - 40 * k));
      return {
        block: {},
        inline: { backgroundImage: `linear-gradient(transparent ${top}%, ${c} ${top}%)`, padding: '0 0.15em', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' },
      };
    }
    case 'underline-color':
      return {
        block: {},
        inline: {
          backgroundImage: `linear-gradient(${c}, ${c})`,
          backgroundSize: `100% ${px(4)}`,
          backgroundPosition: '0 100%',
          backgroundRepeat: 'no-repeat',
          paddingBottom: '0.08em',
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
        },
      };
    case 'box':
      return {
        block: {},
        inline: { border: `${px(2)} solid ${c}`, padding: '0 0.3em', borderRadius: '0.3em', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' },
      };

    case 'typewriter':
      // Shown from the right a word at a time (the text reads right to left).
      return { block: { animation: `fx-type ${Math.max(0.6, words * 0.35) / k}s steps(${Math.max(1, words)}, end) both` } };
    case 'shine':
      return {
        block: {
          ...clip(`linear-gradient(110deg, ${base} 38%, ${c} 50%, ${base} 62%)`),
          backgroundSize: '250% 100%',
          animation: `fx-shine ${(3 / k).toFixed(1)}s linear infinite`,
        },
      };
    case 'wave':
      return { block: { animation: `fx-wave ${(2.4 / k).toFixed(1)}s ease-in-out infinite`, transformOrigin: 'center' } };
    case 'appear':
      return { block: { animation: `fx-appear ${(1.2 / k).toFixed(1)}s ease-out both` } };
  }
  return null;
};

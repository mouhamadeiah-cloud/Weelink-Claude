/**
 * Weelink editor chrome design tokens.
 *
 * These are the ONLY colors allowed for the editor's own UI chrome
 * (drawers, toolbars, buttons, swatches, tabs, dividers, etc.) —
 * NOT for content the user designs on the canvas, which stays free-form.
 *
 * Source of truth, so the same role never drifts into a different
 * hex value or a random Tailwind color class again.
 */

export const EDITOR_COLORS = {
  // Primary accent (selected state, primary buttons, active tab, slider fill)
  accent: '#0071e3',
  accentHover: '#0077ed',
  accentActive: '#006edb',

  // Positive / publish-style action
  success: '#34c759',
  successHover: '#30b753',

  // Destructive action (delete, remove)
  danger: '#ff3b30',
  dangerHover: '#e6352b',

  // Text
  textPrimary: '#1d1d1f',
  textSecondary: '#6e6e73',
  textMuted: '#8e8e93',

  // Surfaces
  panelBg: '#f5f5f7',
  panelBgAlt: '#ffffff',

  // Icon tones (chrome icons only, muted neutral set)
  iconDefault: '#636366',
  iconMuted: '#aeaeb2',

  // Borders / dividers — single canonical value
  border: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.12)',
} as const;

/** Tailwind-friendly class fragments for the few cases that need classes rather than inline style. */
export const EDITOR_CLASSES = {
  accentText: 'text-[#0071e3]',
  accentBg: 'bg-[#0071e3]',
  accentRing: 'ring-[#0071e3]',
  panelBg: 'bg-[#f5f5f7]',
  divider: 'border-black/[0.08]',
} as const;

/** Standard sizes for chrome icons, by role — stops the size/strokeWidth drift. */
export const ICON_SIZE = {
  /** Small inline action icon inside a row (e.g. delete/duplicate on a layer row) */
  inline: 14,
  /** Icon-only toolbar button */
  tool: 16,
  /** Section header icon */
  section: 18,
} as const;

export const ICON_STROKE = {
  inline: 2.2,
  tool: 2,
  section: 2,
} as const;

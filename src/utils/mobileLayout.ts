import { CanvasElement, MobileLayout, Slide } from '../types';

/**
 * "تنسيق الموبايل" — automatic phone layout.
 *
 * Elements are placed freely on a 1280px-wide desktop canvas. On a phone that layout is simply
 * cut off, so this module derives a second, phone-only layout for every element (stored in
 * `element.mobile`) and a phone height for every slide (`slide.mobileHeight`). The desktop
 * layout is never modified.
 *
 * How a slide is arranged:
 * 1. Full-bleed backgrounds (shapes/images covering most of the slide) stretch over the whole
 *    phone slide.
 * 2. Empty shapes and images that contain other elements become "panels": their contents are
 *    arranged inside them and the panel grows to wrap them.
 * 3. Everything else is read top-to-bottom and right-to-left (Arabic reading order) and stacked
 *    in one column at the phone width. Small items sitting side by side (buttons, icons,
 *    badges) stay in one row when they fit.
 * 4. Purely decorative empty shapes (e.g. circles hanging off the slide edge) keep their
 *    relative position, scaled down to the phone width.
 */

export const DESKTOP_CANVAS_WIDTH = 1280;
// Inner width of the phone frame in mobile view (380px frame minus its 10px border on each side).
export const MOBILE_CANVAS_WIDTH = 360;

const SIDE_PADDING = 20;
const SLIDE_PADDING_Y = 32;
const PANEL_PADDING = 20;
const STACK_GAP = 16;
const INLINE_GAP = 12;

type Box = { x: number; y: number; width: number; height: number };

interface LayoutNode {
  el: CanvasElement;
  children: LayoutNode[];
}

const TEXT_TYPES = new Set(['heading', 'paragraph']);
const SMALL_INLINE_TYPES = new Set(['button', 'icon', 'badge']);
const MEDIA_TYPES = new Set(['image', 'video', 'lottie', 'map', 'gallery', 'mask', 'table', 'shape']);
const REFLOW_TYPES = new Set(['pricing', 'calendar', 'html', 'input', 'divider', 'menuCart']);

const DEFAULT_FONT_SIZE: Record<string, number> = { heading: 32, paragraph: 16 };

const isEmptyBox = (el: CanvasElement) =>
  (el.type === 'shape' || el.type === 'image' || el.type === 'mask') && !(el.content || '').trim();

const center = (b: Box) => ({ cx: b.x + b.width / 2, cy: b.y + b.height / 2 });

const containsCenter = (outer: Box, inner: Box) => {
  const { cx, cy } = center(inner);
  return cx >= outer.x && cx <= outer.x + outer.width && cy >= outer.y && cy <= outer.y + outer.height;
};

const isOutsideCanvas = (el: CanvasElement, slideHeight: number) =>
  el.x < 0 || el.y < 0 || el.x + el.width > DESKTOP_CANVAS_WIDTH || el.y + el.height > slideHeight;

const stripHtml = (html: string) =>
  html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d)>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');

// Large headings shrink on phones; body-size text stays as is.
const mobileFontSize = (fontSize: number) => (fontSize <= 18 ? fontSize : 18 + (fontSize - 18) * 0.6);

const fontScaleFor = (el: CanvasElement) => {
  const fs = el.styles.fontSize;
  if (!fs) return 1;
  return Math.round((mobileFontSize(fs) / fs) * 100) / 100;
};

// Rough height of wrapped text at a given width (Arabic glyphs average ~0.55em wide).
const estimateTextHeight = (el: CanvasElement, width: number, fontScale: number) => {
  const fs = (el.styles.fontSize || DEFAULT_FONT_SIZE[el.type] || 16) * fontScale;
  const lineHeight = fs * 1.6;
  const charsPerLine = Math.max(1, Math.floor((width - 16) / (fs * 0.55)));
  const lines = stripHtml(el.content || '')
    .split('\n')
    .reduce((sum, line) => sum + Math.max(1, Math.ceil(line.trim().length / charsPerLine)), 0);
  return Math.ceil(Math.max(1, lines) * lineHeight + 20);
};

// Size of a single (non-panel) element when it has `available` px of width.
const sizeLeaf = (el: CanvasElement, available: number): { width: number; height: number; fontScale: number } => {
  const fontScale = fontScaleFor(el);

  if (TEXT_TYPES.has(el.type)) {
    const width = available;
    return { width, height: Math.max(36, estimateTextHeight(el, width, fontScale)), fontScale };
  }

  if (el.type === 'card') {
    // Wrapped text needs more height as the box narrows: height ∝ fontSize² / width.
    const width = available;
    const grown = el.height * fontScale * fontScale * (el.width / width);
    return { width, height: Math.round(Math.min(el.height * 3, Math.max(el.height, grown))), fontScale };
  }

  if (REFLOW_TYPES.has(el.type)) {
    // These fill their box, so they take the full width; content-heavy ones grow taller as they narrow.
    const width = available;
    const growth = el.type === 'divider' || el.type === 'input' ? 1 : Math.min(1.5, Math.max(1, el.width / width));
    return { width, height: Math.round(el.height * growth), fontScale };
  }

  if (MEDIA_TYPES.has(el.type) || el.width > available) {
    // Keep the aspect ratio; only shrink when wider than the phone.
    const scale = Math.min(1, available / el.width);
    return { width: Math.round(el.width * scale), height: Math.round(el.height * scale), fontScale };
  }

  // Buttons, icons, badges and anything else that already fits: keep its size.
  return { width: el.width, height: el.height, fontScale };
};

type Align = 'right' | 'center' | 'left';

// Where the element sat horizontally inside its parent on desktop, so phones keep the same side.
const alignmentIn = (el: Box, parent: Box): Align => {
  const leftGap = el.x - parent.x;
  const rightGap = parent.x + parent.width - (el.x + el.width);
  if (Math.abs(leftGap - rightGap) < parent.width * 0.08) return 'center';
  return rightGap < leftGap ? 'right' : 'left';
};

const alignedX = (align: Align, x: number, width: number, itemWidth: number) =>
  align === 'center' ? x + (width - itemWidth) / 2 : align === 'right' ? x + width - itemWidth : x;

/** Computes the phone layout of one slide's elements. */
export const arrangeSlideForMobile = (
  slide: Slide,
  slideElements: CanvasElement[]
): { layouts: Map<string, MobileLayout>; mobileHeight: number } => {
  const layouts = new Map<string, MobileLayout>();
  const slideBox: Box = { x: 0, y: 0, width: DESKTOP_CANVAS_WIDTH, height: slide.height };
  const slideArea = slideBox.width * slideBox.height;

  const backgrounds = slideElements.filter(
    el => isEmptyBox(el) && el.width >= DESKTOP_CANVAS_WIDTH * 0.7 && el.height >= slide.height * 0.6
  );
  const backgroundIds = new Set(backgrounds.map(el => el.id));
  const rest = slideElements.filter(el => !backgroundIds.has(el.id));

  // Parent of each element: the smallest empty shape/image that contains its center.
  const parentOf = new Map<string, string>();
  for (const el of rest) {
    let best: CanvasElement | null = null;
    for (const candidate of rest) {
      if (candidate.id === el.id || !isEmptyBox(candidate)) continue;
      if (candidate.width * candidate.height <= el.width * el.height * 1.2) continue;
      if (!containsCenter(candidate, el)) continue;
      if (!best || candidate.width * candidate.height < best.width * best.height) best = candidate;
    }
    if (best) parentOf.set(el.id, best.id);
  }

  const nodes = new Map<string, LayoutNode>(rest.map(el => [el.id, { el, children: [] }]));
  const roots: LayoutNode[] = [];
  for (const el of rest) {
    const parentId = parentOf.get(el.id);
    if (parentId) nodes.get(parentId)!.children.push(nodes.get(el.id)!);
    else roots.push(nodes.get(el.id)!);
  }

  // Empty shapes with nothing inside that hang off the slide or cover a big area are decoration.
  const decorative = roots.filter(
    n =>
      n.children.length === 0 &&
      n.el.type === 'shape' &&
      isEmptyBox(n.el) &&
      (isOutsideCanvas(n.el, slide.height) || (n.el.width * n.el.height) / slideArea > 0.15)
  );
  const decorativeIds = new Set(decorative.map(n => n.el.id));
  const flowRoots = roots.filter(n => !decorativeIds.has(n.el.id));

  // Lays out `items` in a column `width` px wide starting at (x, y); returns the bottom edge.
  const layoutFlow = (items: LayoutNode[], parentBox: Box, x: number, y: number, width: number): number => {
    const sorted = [...items].sort((a, b) => a.el.y - b.el.y);

    // Items whose vertical ranges overlap on desktop form one row.
    const rows: LayoutNode[][] = [];
    let rowBottom = -Infinity;
    for (const item of sorted) {
      if (rows.length && item.el.y < rowBottom - 4) {
        rows[rows.length - 1].push(item);
        rowBottom = Math.max(rowBottom, item.el.y + item.el.height);
      } else {
        rows.push([item]);
        rowBottom = item.el.y + item.el.height;
      }
    }

    let cursor = y;
    rows.forEach((row, rowIndex) => {
      if (rowIndex > 0) cursor += STACK_GAP;
      cursor = layoutRow(row, parentBox, x, cursor, width);
    });
    return cursor;
  };

  // Places one node stacked at `cursor`; returns its bottom edge.
  const placeStacked = (n: LayoutNode, parentBox: Box, x: number, cursor: number, width: number): number => {
    if (n.children.length > 0) {
      // Panel: arrange its contents inside, then wrap them.
      const contentBottom = layoutFlow(n.children, n.el, x + PANEL_PADDING, cursor + PANEL_PADDING, width - PANEL_PADDING * 2);
      const height = Math.round(contentBottom + PANEL_PADDING - cursor);
      layouts.set(n.el.id, { x: Math.round(x), y: Math.round(cursor), width: Math.round(width), height, fontScale: 1 });
      return cursor + height;
    }
    const s = sizeLeaf(n.el, width);
    const left = alignedX(alignmentIn(n.el, parentBox), x, width, s.width);
    layouts.set(n.el.id, { x: Math.round(left), y: Math.round(cursor), width: s.width, height: s.height, fontScale: s.fontScale });
    return cursor + s.height;
  };

  // Lays out one desktop row (items side by side); returns its bottom edge.
  const layoutRow = (row: LayoutNode[], parentBox: Box, x: number, cursor: number, width: number): number => {
    // Right-to-left reading order.
    row.sort((a, b) => b.el.x + b.el.width - (a.el.x + a.el.width));

    // 1. Small items side by side (buttons, icons, badges — optionally with one text, like an
    //    icon next to a phone number) stay on one line when they fit.
    if (row.length > 1 && row.every(n => n.children.length === 0)) {
      const texts = row.filter(n => TEXT_TYPES.has(n.el.type));
      const fixed = row.filter(n => !TEXT_TYPES.has(n.el.type));
      const fixedSizes = new Map(fixed.map(n => [n.el.id, sizeLeaf(n.el, width)]));
      const fixedWidth = [...fixedSizes.values()].reduce((sum, s) => sum + s.width, 0) + INLINE_GAP * (row.length - 1);
      const allSmall = fixed.every(n => SMALL_INLINE_TYPES.has(n.el.type) || fixedSizes.get(n.el.id)!.width <= width * 0.45);
      const textWidth = width - fixedWidth;
      if (allSmall && (texts.length === 0 ? fixedWidth <= width : texts.length === 1 && textWidth >= width * 0.5)) {
        const sizes = row.map(n =>
          TEXT_TYPES.has(n.el.type)
            ? { width: textWidth, height: Math.max(32, estimateTextHeight(n.el, textWidth, fontScaleFor(n.el))), fontScale: fontScaleFor(n.el) }
            : fixedSizes.get(n.el.id)!
        );
        const rowWidth = sizes.reduce((sum, s) => sum + s.width, 0) + INLINE_GAP * (row.length - 1);
        const rowBox: Box = {
          x: Math.min(...row.map(n => n.el.x)),
          y: 0,
          width: Math.max(...row.map(n => n.el.x + n.el.width)) - Math.min(...row.map(n => n.el.x)),
          height: 0,
        };
        let right = alignedX(alignmentIn(rowBox, parentBox), x, width, rowWidth) + rowWidth;
        const rowHeight = Math.max(...sizes.map(s => s.height));
        row.forEach((n, i) => {
          const s = sizes[i];
          layouts.set(n.el.id, {
            x: Math.round(right - s.width),
            y: Math.round(cursor + (rowHeight - s.height) / 2),
            width: s.width,
            height: s.height,
            fontScale: s.fontScale,
          });
          right -= s.width + INLINE_GAP;
        });
        return cursor + rowHeight;
      }
    }

    // 2. Otherwise split the row into columns (items whose horizontal ranges overlap) and stack
    //    the columns right to left, each one top to bottom.
    const columns: LayoutNode[][] = [];
    for (const n of row) {
      const column = columns.find(col =>
        col.some(other => n.el.x < other.el.x + other.el.width && other.el.x < n.el.x + n.el.width)
      );
      if (column) column.push(n);
      else columns.push([n]);
    }

    columns.forEach((column, i) => {
      if (i > 0) cursor += STACK_GAP;
      if (columns.length > 1 && column.length > 1) {
        cursor = layoutFlow(column, parentBox, x, cursor, width);
      } else {
        column.sort((a, b) => a.el.y - b.el.y);
        column.forEach((n, j) => {
          if (j > 0) cursor += STACK_GAP;
          cursor = placeStacked(n, parentBox, x, cursor, width);
        });
      }
    });
    return cursor;
  };

  const contentBottom = flowRoots.length
    ? layoutFlow(flowRoots, slideBox, SIDE_PADDING, SLIDE_PADDING_Y, MOBILE_CANVAS_WIDTH - SIDE_PADDING * 2)
    : 0;
  const mobileHeight = Math.max(160, Math.round(contentBottom + SLIDE_PADDING_Y));

  const ratio = MOBILE_CANVAS_WIDTH / DESKTOP_CANVAS_WIDTH;
  for (const n of decorative) {
    layouts.set(n.el.id, {
      x: Math.round(n.el.x * ratio),
      y: Math.round((n.el.y / slide.height) * mobileHeight),
      width: Math.round(n.el.width * ratio),
      height: Math.round(n.el.height * ratio),
      fontScale: 1,
    });
  }
  for (const el of backgrounds) {
    layouts.set(el.id, { x: 0, y: 0, width: MOBILE_CANVAS_WIDTH, height: mobileHeight, fontScale: 1 });
  }

  return { layouts, mobileHeight };
};

/** Arranges every given slide for phones; returns updated elements and slides. */
export const arrangeForMobile = (
  slides: Slide[],
  elements: CanvasElement[]
): { elements: CanvasElement[]; slides: Slide[] } => {
  const allLayouts = new Map<string, MobileLayout>();
  const updatedSlides = slides.map(slide => {
    const { layouts, mobileHeight } = arrangeSlideForMobile(
      slide,
      elements.filter(el => el.slideId === slide.id)
    );
    layouts.forEach((layout, id) => allLayouts.set(id, layout));
    return { ...slide, mobileHeight };
  });
  const updatedElements = elements.map(el => {
    const layout = allLayouts.get(el.id);
    return layout ? { ...el, mobile: layout } : el;
  });
  return { elements: updatedElements, slides: updatedSlides };
};

/** The element as it should render on a phone (desktop element when it has no phone layout). */
export const resolveMobileElement = (el: CanvasElement): CanvasElement => {
  const m = el.mobile;
  if (!m) return el;
  const widthRatio = m.width / (el.width || 1);
  const heightRatio = m.height / (el.height || 1);
  return {
    ...el,
    x: m.x,
    y: m.y,
    width: m.width,
    height: m.height,
    styles:
      m.fontScale && m.fontScale !== 1 && el.styles.fontSize
        ? { ...el.styles, fontSize: Math.round(el.styles.fontSize * m.fontScale) }
        : el.styles,
    ...(el.tableConfig
      ? {
          tableConfig: {
            ...el.tableConfig,
            colWidths: el.tableConfig.colWidths.map(w => Math.round(w * widthRatio)),
            rowHeights: el.tableConfig.rowHeights.map(h => Math.round(h * heightRatio)),
          },
        }
      : {}),
  };
};

/** Phone height of a slide: its arranged height once any of its elements has a phone layout. */
export const resolveMobileSlideHeight = (slide: Slide, elements: CanvasElement[]) =>
  slide.mobileHeight && elements.some(el => el.slideId === slide.id && el.mobile) ? slide.mobileHeight : slide.height;

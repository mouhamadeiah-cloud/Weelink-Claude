// Photos that open together in the viewer (the same one the «معرض صور» block uses): the images of a slide that carry the same
// `lightboxGroup`, shown one after another in reading order (rows from the top, right to left in each row).
import type { CanvasElement, GalleryItem } from '../types';

const ROW = 0.6; // two images are on one row when their tops are closer than this share of the taller one's height

export const lightboxOrder = (elements: Pick<CanvasElement, 'id' | 'type' | 'slideId' | 'imageUrl' | 'name' | 'x' | 'y' | 'height' | 'lightboxGroup'>[], from: Pick<CanvasElement, 'slideId' | 'lightboxGroup'>) => {
  const group = elements.filter((e) => e.type === 'image' && !!e.imageUrl && e.slideId === from.slideId && e.lightboxGroup && e.lightboxGroup === from.lightboxGroup);
  const sorted = [...group].sort((a, b) => a.y - b.y);
  const rows: (typeof group)[] = [];
  for (const e of sorted) {
    const row = rows.find((r) => Math.abs(r[0].y - e.y) < Math.max(r[0].height, e.height) * ROW);
    if (row) row.push(e);
    else rows.push([e]);
  }
  return rows.flatMap((r) => r.sort((a, b) => b.x - a.x));
};

/** What the viewer opens with: every photo of the group in order, and the place of the one that was clicked. */
export const lightboxFor = (elements: Parameters<typeof lightboxOrder>[0], clicked: Parameters<typeof lightboxOrder>[1] & { id: string }): { items: GalleryItem[]; activeIndex: number } => {
  const list = lightboxOrder(elements, clicked);
  return { items: list.map((e) => ({ id: e.id, url: e.imageUrl as string, title: '' })), activeIndex: Math.max(0, list.findIndex((e) => e.id === clicked.id)) };
};

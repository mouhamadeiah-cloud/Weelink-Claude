import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withFeaturedKind } from '../src/data/featuredSlide.ts';
import type { CanvasElement, Page } from '../src/types.ts';

const el = (id: string, slideId: string, type: string, extra: Record<string, unknown> = {}) =>
  ({ id, name: id, type, x: 0, y: 0, width: 10, height: 10, content: '', slideId, styles: {}, ...extra }) as unknown as CanvasElement;
const page = (id: string, slides: string[]) =>
  ({ id, name: id, slides: slides.map((s) => ({ id: s, name: s, height: 500 })), navbar: { items: [] } }) as unknown as Page;

test('a rental slide with only car cards gets the item cards when an item is featured, once', () => {
  const pages = [page('p1', ['h', 'f'])];
  const els = [el('c', 'f', 'carListings', { carSource: 'featured', y: 170, height: 440 }), el('b', 'f', 'button', { y: 628, height: 50 })];
  const next = withFeaturedKind(pages, els, 'items', 5)!;
  const added = next.find((e) => e.type === 'shopProducts')!;
  assert.equal(added.shopSource, 'featured');
  assert.equal(added.slideId, 'f');
  assert.equal(added.y, 630);
  assert.equal(next.find((e) => e.id === 'b')!.y, 628 + 420);
  assert.equal(withFeaturedKind(pages, next, 'items', 6), null);
  assert.equal(withFeaturedKind(pages, [], 'items', 7), null);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lightboxFor, lightboxOrder } from '../src/utils/imageGroup.ts';

const img = (id: string, x: number, y: number, extra: any = {}) => ({ id, type: 'image' as const, slideId: 's1', imageUrl: `u-${id}`, name: id, x, y, height: 200, lightboxGroup: 'photos', ...extra });

test('the group opens in reading order: rows from the top, right to left in each row', () => {
  const els = [img('c', 100, 400), img('a', 900, 100), img('b', 500, 110), img('d', 900, 410)];
  assert.deepEqual(lightboxOrder(els, { slideId: 's1', lightboxGroup: 'photos' }).map((e) => e.id), ['a', 'b', 'd', 'c']);
});

test('only the images of the clicked one\'s slide and group, with a photo, are in the viewer', () => {
  const els = [img('a', 900, 100), img('b', 500, 100), img('other-slide', 100, 100, { slideId: 's2' }), img('other-group', 100, 100, { lightboxGroup: 'x' }), img('nogroup', 100, 100, { lightboxGroup: undefined }), img('empty', 100, 100, { imageUrl: '' }), { ...img('t', 0, 0), type: 'heading' as const }];
  const v = lightboxFor(els, els[1]);
  assert.deepEqual(v.items.map((i) => i.id), ['a', 'b']);
  assert.equal(v.activeIndex, 1);
  assert.deepEqual(v.items.map((i) => i.url), ['u-a', 'u-b']);
});

test('the engine wires the click to the viewer, only on the public page or in the preview', async () => {
  const { readFileSync } = await import('node:fs');
  const canvas = readFileSync(new URL('../src/components/CanvasWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(canvas, /elem\.lightboxGroup && elem\.imageUrl && \(isPublicSite \|\| isPreviewActive\)/);
  assert.match(canvas, /lightboxFor\(layoutElements, elem\)/);
});

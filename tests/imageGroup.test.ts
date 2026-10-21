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

test('the gallery block moves its thumbnails sideways past five photos, and the questions take the package\'s photos', async () => {
  const { readFileSync } = await import('node:fs');
  const canvas = readFileSync(new URL('../src/components/CanvasWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(canvas, /items\.length <= 5 \?/);
  assert.match(canvas, /overflow-x-auto overflow-y-hidden snap-x/);
  const chat = readFileSync(new URL('../src/components/WeeAIChat.tsx', import.meta.url), 'utf8');
  assert.match(chat, /slice\(0, galleryMax\)/);
  assert.match(chat, /prev\.galleryImages\.length >= galleryMax/);
  assert.doesNotMatch(chat, /slice\(0, 5\)\.forEach/);
});

test('the viewer is drawn on the page itself, above everything, and its clicks stay out of the canvas', async () => {
  const { readFileSync } = await import('node:fs');
  const canvas = readFileSync(new URL('../src/components/CanvasWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(canvas, /createPortal\(\s*<div[\s\S]*?role="dialog"[\s\S]*?document\.body\s*\)/);
  assert.match(canvas, /zIndex: 2147483000/);
  assert.match(canvas, /onPointerDown=\{\(e\) => e\.stopPropagation\(\)\}/);
});

test('in the editor a click on the gallery photo selects it; the viewer opens from the «تكبير» button, on the page a click opens it', async () => {
  const { readFileSync } = await import('node:fs');
  const canvas = readFileSync(new URL('../src/components/CanvasWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(canvas, /const viewing = isPreviewActive \|\| isPublicSite;/);
  assert.match(canvas, /onClick=\{viewing \? handleOpenLightbox : undefined\}/); // the covering overlay no longer takes the editor's clicks
  assert.match(canvas, /\$\{viewing \? '' : 'pointer-events-none'\}/);
  assert.match(canvas, /\{!viewing && \(\s*<button[\s\S]*?تكبير/);
  assert.doesNotMatch(canvas, /onDoubleClick=\{handleOpenLightbox\}/);
});

test('the gallery panel marks the chosen photo, lets the last-but-one go, and says the package\'s limit', async () => {
  const { readFileSync } = await import('node:fs');
  const panel = readFileSync(new URL('../src/components/RightDrawer.tsx', import.meta.url), 'utf8');
  assert.match(panel, /const activePhoto = /);
  assert.match(panel, /items\.length > 1 && \(/); // the delete button stays down to the last photo
  assert.match(panel, /هذه آخر صورة في المعرض/);
  assert.doesNotMatch(panel, /إعدادات معرض الصور \(٥ صور\)/);
});

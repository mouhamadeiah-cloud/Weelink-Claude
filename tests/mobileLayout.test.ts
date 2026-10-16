import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arrangeSlideForMobile } from '../src/utils/mobileLayout.ts';

const slide: any = { id: 's', height: 700 };
const el = (id: string, type: string, x: number, y: number, width: number, height: number, extra: any = {}): any => ({ id, type, slideId: 's', x, y, width, height, content: '', styles: {}, ...extra });

test('phone layout: a small round badge with a letter in it keeps its size and the letter stays inside it', () => {
  const { layouts } = arrangeSlideForMobile(slide, [el('c', 'shape', 100, 100, 100, 100), el('t', 'heading', 120, 130, 60, 40, { content: 'EN', styles: { fontSize: 28 } })]);
  const c = layouts.get('c')!;
  const t = layouts.get('t')!;
  assert.equal(c.width, 100);
  assert.equal(c.height, 100);
  assert.ok(t.x >= c.x && t.x + t.width <= c.x + c.width && t.y >= c.y && t.y + t.height <= c.y + c.height, 'the letter lies inside the badge');
});

test('phone layout: a thin vertical rule lies down as a short rule, not a tall strip', () => {
  const { layouts } = arrangeSlideForMobile(slide, [el('r', 'shape', 600, 100, 4, 400), el('t', 'heading', 700, 100, 400, 60, { content: 'عنوان', styles: { fontSize: 32 } })]);
  assert.ok(layouts.get('r')!.height <= 8);
});

test('phone layout: a huge icon is a backdrop and takes no room in the column', () => {
  const { layouts, mobileHeight } = arrangeSlideForMobile(slide, [el('i', 'icon', 100, 100, 340, 340), el('t', 'heading', 700, 100, 400, 60, { content: 'عنوان', styles: { fontSize: 32 } })]);
  assert.ok(layouts.get('i')!.width <= 100);
  assert.ok(mobileHeight < 300, `slide is ${mobileHeight} high`);
});

test('phone layout: buttons stacked under a text follow its side instead of staggering', () => {
  const { layouts } = arrangeSlideForMobile(slide, [
    el('h', 'heading', 700, 60, 500, 60, { content: 'عنوان', styles: { fontSize: 32, textAlign: 'right' } }),
    el('b1', 'button', 960, 160, 220, 50, { content: 'a' }),
    el('b2', 'button', 600, 260, 220, 50, { content: 'b' }),
    el('b3', 'button', 100, 360, 220, 50, { content: 'c' }),
  ]);
  const right = (id: string) => layouts.get(id)!.x + layouts.get(id)!.width;
  assert.equal(right('b1'), right('b2'));
  assert.equal(right('b2'), right('b3'));
});

test('phone layout: a gallery stays a usable size', () => {
  const { layouts } = arrangeSlideForMobile(slide, [el('g', 'gallery', 96, 100, 1088, 330)]);
  assert.ok(layouts.get('g')!.height >= 240);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { closeGaps } from '../src/utils/flexLayout';

const el = (type: string, y: number, height: number, extra: any = {}) => ({ type, content: 'x', x: 100, y, width: 600, height, styles: {}, ...extra });

test('a removed row lets what is under it move up', () => {
  const a = el('heading', 60, 60);
  const c = el('button', 400, 50);
  const gone = { x: 100, y: 200, width: 600, height: 80 };
  const h = closeGaps([a, c] as any, 560, [gone]);
  assert.equal(c.y, 200);
  assert.equal(a.y, 60);
  assert.ok(h < 560);
});

test('a removed box beside another text leaves the rows alone', () => {
  const side = el('paragraph', 210, 60, { x: 800, width: 300 });
  const c = el('button', 400, 50);
  const h = closeGaps([side, c] as any, 560, [{ x: 100, y: 200, width: 600, height: 80 }]);
  assert.equal(c.y, 400);
  assert.equal(h, 560);
});

import { fittedFontSize } from '../src/utils/flexLayout';

test('a longer text than the example goes smaller in its box, a shorter one keeps its size', () => {
  const box = (content: string, extra: any = {}) => ({ type: 'heading', content, x: 0, y: 0, width: 150, height: 60, styles: { fontSize: 42, fontWeight: 'bold' }, ...extra });
  const size = fittedFontSize(box('متوفر دائماً للجميع') as any, 'مرن');
  assert.ok(size && size < 42 && size >= 23);
  assert.equal(fittedFontSize(box('سريع') as any, 'مرن'), null);
  // a word wider than the box shrinks even when the line count is the same
  const word = fittedFontSize(box('استثنائيّة') as any, 'جودة');
  assert.ok(word && word < 42);
});

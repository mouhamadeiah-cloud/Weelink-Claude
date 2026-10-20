import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { customMotionDirection, customMotionVars } from '../src/utils/customMotion';
import { AnimationSection } from '../src/components/rightDrawer/sections/AnimationSection';

test('a custom motion hands its two states to the shared keyframe as variables', () => {
  const v = customMotionVars({ x: 40, y: -20, opacity: 0.25, scale: 1.5, rotate: 10 }, { opacity: 1 }, 5);
  assert.equal(v['--mv-fx'], '40px');
  assert.equal(v['--mv-fy'], '-20px');
  assert.equal(v['--mv-fo'], '0.25');
  assert.equal(v['--mv-fs'], '1.5');
  assert.equal(v['--mv-fr'], '15deg'); // the element's own 5° turn is kept
  assert.equal(v['--mv-tx'], '0px'); // the end state falls back to «as it is»
  assert.equal(v['--mv-to'], '1');
  assert.equal(v['--mv-tr'], '5deg');
});

test('opacity stays between 0 and 1, and a phone halves the shift', () => {
  const v = customMotionVars({ x: 100, opacity: 3 }, { opacity: -1 }, 0, 0.5);
  assert.equal(v['--mv-fo'], '1');
  assert.equal(v['--mv-to'], '0');
  assert.equal(v['--mv-fx'], '50px');
});

test('a loop or a hover goes there and back; a single play goes there once unless asked', () => {
  assert.equal(customMotionDirection('loop'), 'alternate');
  assert.equal(customMotionDirection('hover'), 'alternate');
  assert.equal(customMotionDirection('once'), 'normal');
  assert.equal(customMotionDirection('scroll', true), 'alternate');
});

test('the custom keyframe exists and the animation card offers the two states', () => {
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.match(css, /@keyframes custom-move\s*\{[\s\S]*var\(--mv-fx[\s\S]*var\(--mv-tx/);
  const html = renderToStaticMarkup(React.createElement(AnimationSection, { styles: { animation: 'custom' } as any, onUpdateElementStyles: () => {} }));
  assert.match(html, /حالة البداية/);
  assert.match(html, /حالة النهاية/);
  assert.match(html, /الشفافية/);
});

test('set by dragging: the shift is from the resting place to the drop, doubled when set on a phone', async () => {
  const { shiftBetween } = await import('../src/utils/customMotion');
  assert.deepEqual(shiftBetween({ x: 100, y: 50 }, { x: 40, y: 80 }), { x: -60, y: 30 });
  assert.deepEqual(shiftBetween({ x: 100, y: 50 }, { x: 40, y: 80 }, 2), { x: -120, y: 60 });
});

test('the animation card offers «set by dragging» once it knows the element', () => {
  const html = renderToStaticMarkup(React.createElement(AnimationSection, { styles: { animation: 'custom' } as any, onUpdateElementStyles: () => {}, element: { id: 'a', x: 1, y: 2 }, onPlace: () => {} }));
  assert.match(html, /حدّد المكان بالسحب/);
});

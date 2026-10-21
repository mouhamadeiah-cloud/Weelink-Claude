import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { customMotionDirection, customMotionVars, realMotionState, resolveMotion } from '../src/utils/customMotion';
import { AnimationSection } from '../src/components/rightDrawer/sections/AnimationSection';

const real = { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 };

test('a custom motion\'s first state follows the element\'s real values, its last state stays as saved', () => {
  const el = realMotionState({ opacity: 0.8 }, 12);
  assert.deepEqual(el, { x: 0, y: 0, opacity: 0.8, scale: 1, rotate: 12 });
  // nothing set: the motion has nowhere to go
  assert.deepEqual(resolveMotion({}, el), { from: el, to: el });
  // the owner moved/changed the element (the real values change): the first state follows, the saved last state does not
  const saved = { x: 0, y: 0, opacity: 0.8, scale: 1, rotate: 12 };
  const moved = realMotionState({ opacity: 0.5 }, 30);
  const r = resolveMotion({ animationTo: saved }, moved);
  assert.equal(r.from.opacity, 0.5);
  assert.equal(r.from.rotate, 30);
  assert.equal(r.to.opacity, 0.8);
  assert.equal(r.to.rotate, 12);
  // a first state the owner set wins over the real value
  assert.equal(resolveMotion({ animationFrom: { opacity: 0 }, animationTo: saved }, moved).from.opacity, 0);
});

test('a custom motion hands its two states to the shared keyframe as variables', () => {
  const v = customMotionVars({ ...real, x: 40, y: -20, opacity: 0.25, scale: 1.5, rotate: 15 }, { ...real, opacity: 1, rotate: 5 });
  assert.equal(v['--mv-fx'], '40px');
  assert.equal(v['--mv-fy'], '-20px');
  assert.equal(v['--mv-fo'], '0.25');
  assert.equal(v['--mv-fs'], '1.5');
  assert.equal(v['--mv-fr'], '15deg'); // a real turn, not added to the element's own
  assert.equal(v['--mv-tx'], '0px');
  assert.equal(v['--mv-to'], '1');
  assert.equal(v['--mv-tr'], '5deg');
});

test('opacity is a share of the element\'s own, stays between 0 and 1, a phone halves the shift, the editor keeps a floor', () => {
  const v = customMotionVars({ ...real, x: 100, opacity: 3 }, { ...real, opacity: -1 }, 0.5);
  assert.equal(v['--mv-fo'], '1');
  assert.equal(v['--mv-to'], '0');
  assert.equal(v['--mv-fx'], '50px');
  const half = customMotionVars({ ...real, opacity: 0.4 }, { ...real, opacity: 0.8 }, 1, 0, 0.8);
  assert.equal(half['--mv-fo'], '0.5'); // 40% of an element that is 80% opaque
  assert.equal(half['--mv-to'], '1');
  assert.equal(customMotionVars({ ...real, opacity: 0 }, real, 1, 0, 1, 0.25)['--mv-fo'], '0.25');
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
  assert.match(html, /البداية/);
  assert.match(html, /النهاية/);
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

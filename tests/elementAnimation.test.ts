import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildElementAnimation } from '../src/utils/elementAnimation';
import { AnimationSection } from '../src/components/rightDrawer/sections/AnimationSection';

const ctx = { x: 100, width: 200, pageWidth: 1280, bleed: 0, phone: false, waits: false };

test('an element with no animation gets no animation style', () => {
  const b = buildElementAnimation({} as any, ctx);
  assert.equal(b.any, false);
  assert.deepEqual(b.style, {});
});

test('one animation keeps the old single-animation behaviour', () => {
  const b = buildElementAnimation({ animation: 'slide-up', animationTrigger: 'once' } as any, ctx);
  assert.equal(b.style.animationName, 'slide-up');
  assert.equal(b.style.animationIterationCount, '1');
  assert.equal(b.style.animationFillMode, 'forwards');
  assert.equal(b.hasHover, false);
});

test('extra animations run together on the element, composed on top of the first', () => {
  const b = buildElementAnimation({
    animation: 'slide-up', animationTrigger: 'once',
    animationLayers: [{ animation: 'pulse', animationTrigger: 'loop', animationDuration: 3 }],
  } as any, ctx);
  assert.equal(b.style.animationName, 'slide-up, pulse');
  assert.equal(b.style.animationIterationCount, '1, infinite');
  assert.equal(b.style.animationDuration, '1.2s, 3s');
  assert.equal(b.style.animationComposition, 'replace, add');
});

test('a hover animation joins the others only while the mouse is over the element', () => {
  const b = buildElementAnimation({
    animation: 'fade', animationTrigger: 'once',
    animationLayers: [{ animation: 'shake', animationTrigger: 'hover' }],
  } as any, ctx);
  assert.equal(b.hasHover, true);
  assert.equal(b.style.animationName, 'fade'); // idle
  assert.equal(b.style['--h-name'], 'fade, shake'); // under the mouse
  assert.equal(b.style['--h-count'], '1, infinite');
});

test('every custom layer has its own keyframes and variables; an extra layer does not repeat the base turn', () => {
  const b = buildElementAnimation({
    animation: 'custom', animationTrigger: 'once', animationFrom: { x: 10 },
    animationLayers: [{ animation: 'custom', animationTrigger: 'loop', animationFrom: { x: 99, rotate: 5 } }],
  } as any, { ...ctx, rotation: 20 });
  assert.equal(b.style.animationName, 'custom-move, custom-move-1');
  assert.equal(b.style['--mv-fx'], '10px');
  assert.equal(b.style['--mv-fr'], '20deg');
  assert.equal(b.style['--mv1-fx'], '99px');
  assert.equal(b.style['--mv1-fr'], '5deg');
});

test('on the preview, entrance and scroll layers wait to be seen; a scroll layer repeats', () => {
  const once = buildElementAnimation({ animation: 'fade', animationTrigger: 'once' } as any, { ...ctx, waits: true });
  assert.equal(once.waitsForView, true);
  assert.equal(once.repeatsOnScroll, false);
  assert.equal(once.style.animationFillMode, 'both');
  const scroll = buildElementAnimation({ animation: 'fade', animationTrigger: 'scroll' } as any, { ...ctx, waits: true });
  assert.equal(scroll.repeatsOnScroll, true);
  const loop = buildElementAnimation({ animation: 'pulse', animationTrigger: 'loop' } as any, { ...ctx, waits: true });
  assert.equal(loop.waitsForView, false);
});

test('a ticker runs for ever and knows the page edges; at most three extras count', () => {
  const b = buildElementAnimation({ animation: 'marquee-rtl' } as any, ctx);
  assert.equal(b.style.animationIterationCount, 'infinite');
  assert.equal(b.style['--marquee-from'], '1180px');
  const many = buildElementAnimation({ animation: 'pulse', animationLayers: Array.from({ length: 6 }, () => ({ animation: 'shake' })) } as any, ctx);
  assert.equal(many.style.animationName.split(',').length, 4);
});

test('the animation card lists the extra animations and offers to add one', () => {
  const html = renderToStaticMarkup(React.createElement(AnimationSection, {
    styles: { animation: 'pulse', animationLayers: [{ animation: 'shake', animationTrigger: 'hover' }] } as any,
    onUpdateElementStyles: () => {},
  }));
  assert.match(html, /الحركة 2/);
  assert.match(html, /أضف حركة أخرى/);
});

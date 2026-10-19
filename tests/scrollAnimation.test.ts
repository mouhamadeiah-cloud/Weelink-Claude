import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { AnimationSection } from '../src/components/rightDrawer/sections/AnimationSection';

test('the animation card offers «عند التمرير» next to the other triggers', () => {
  const html = renderToStaticMarkup(React.createElement(AnimationSection, { styles: { animation: 'slide-up', animationTrigger: 'scroll' } as any, onUpdateElementStyles: () => {} }));
  assert.match(html, /عند التمرير/);
  assert.match(html, /فتح الصفحة/);
  assert.match(html, /مستمر دائم/);
});

test('a scroll-triggered element holds its first frame until it is seen, and reduced motion skips it', () => {
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.match(css, /\[data-scroll-anim\]:not\(\[data-seen\]\)\s*\{\s*animation-play-state:\s*paused/);
  assert.match(css, /prefers-reduced-motion[\s\S]*\[data-scroll-anim\][\s\S]*animation:\s*none/);
});

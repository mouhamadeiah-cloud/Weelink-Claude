import { test } from 'node:test';
import assert from 'node:assert/strict';
import { featuredSlide, hasFeaturedCards, listPageOf, withFeaturedSlide } from '../src/data/featuredSlide.ts';
import type { CanvasElement, Page } from '../src/types.ts';

const el = (id: string, slideId: string, type: string, extra: Record<string, unknown> = {}) =>
  ({ id, name: id, type, x: 0, y: 0, width: 10, height: 10, content: '', slideId, styles: {}, ...extra }) as unknown as CanvasElement;
const page = (id: string, slides: string[]) =>
  ({ id, name: id, slides: slides.map((s) => ({ id: s, name: s, height: 500 })), navbar: { items: [] } }) as unknown as Page;

test('a slide that already shows featured cards is found, a plain list is not', () => {
  const pages = [page('p1', ['s1', 's2']), page('p2', ['s3'])];
  assert.ok(!hasFeaturedCards(pages, [el('a', 's3', 'carListings', { carSource: 'all' })]));
  assert.ok(hasFeaturedCards(pages, [el('a', 's2', 'shopProducts', { shopSource: 'featured' })]));
  assert.ok(hasFeaturedCards(pages, [el('a', 's1', 'menuList', { menuSource: 'featured' })]));
  assert.ok(!hasFeaturedCards(pages, [el('a', 'gone', 'carListings', { carSource: 'featured' })]));
});

test('«عرض الكل» goes to the first other page that lists these kinds', () => {
  const pages = [page('p1', ['s1']), page('p2', ['s2']), page('p3', ['s3'])];
  const els = [el('a', 's1', 'shopProducts', { shopSource: 'all' }), el('b', 's3', 'shopProducts', { shopSource: 'all' })];
  assert.equal(listPageOf(pages, els, ['items']), 'p3');
  assert.equal(listPageOf(pages, els, ['cars']), undefined);
});

test('the slide holds a live featured grid per kind and a button only when there is a list page', () => {
  const both = featuredSlide({ kinds: ['cars', 'items'], listPageId: 'p2', stamp: 7 });
  assert.equal(both.slide.id, 'slide-featured-7');
  assert.ok(both.elements.every((e) => e.slideId === both.slide.id));
  assert.ok(both.elements.some((e) => e.type === 'carListings' && e.carSource === 'featured'));
  assert.ok(both.elements.some((e) => e.type === 'shopProducts' && e.shopSource === 'featured'));
  assert.equal(both.elements.find((e) => e.type === 'button')?.linkTargetId, 'p2');
  assert.equal(new Set(both.elements.map((e) => e.id)).size, both.elements.length);
  const dishes = featuredSlide({ kinds: ['dishes'], stamp: 8 });
  assert.ok(dishes.elements.some((e) => e.type === 'menuList' && e.menuSource === 'featured'));
  assert.ok(!dishes.elements.some((e) => e.type === 'button'));
  assert.equal(featuredSlide({ kinds: [], stamp: 9 }).elements.some((e) => e.type === 'carListings'), true);
});

test('it goes after the hero, or at the end of a one-slide page, and marks the page', () => {
  const made = featuredSlide({ kinds: ['items'], stamp: 1 }).slide;
  const two = withFeaturedSlide([page('p1', ['h', 'x']), page('p2', ['y'])], made);
  assert.deepEqual(two[0].slides.map((s) => s.id), ['h', made.id, 'x']);
  assert.ok(two[0].featuredSuggested);
  assert.deepEqual(two[1].slides.map((s) => s.id), ['y']);
  const one = withFeaturedSlide([page('p1', ['h'])], made);
  assert.deepEqual(one[0].slides.map((s) => s.id), ['h', made.id]);
});

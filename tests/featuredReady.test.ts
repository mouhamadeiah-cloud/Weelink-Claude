import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSlideTemplatePayload, slideTemplateCount } from '../src/data/slideTemplates.ts';
import { STORE_SLIDE_IDS } from '../src/data/storeSlideAi.ts';
import { READY_SLIDE_CATEGORIES } from '../src/data/readyCategories.ts';

const isFeaturedLive = (e: any) => (e.type === 'carListings' && e.carSource === 'featured') || (e.type === 'shopProducts' && e.shopSource === 'featured') || (e.type === 'menuList' && e.menuSource === 'featured');

test('the featured slides of shop, showroom and menu are one category of their own', () => {
  assert.ok(READY_SLIDE_CATEGORIES.some((c) => c.id === 'featured'));
  const n = slideTemplateCount('featured');
  assert.equal(n, 8);
  const ids = new Set<string>();
  for (let i = 0; i < n; i++) {
    const p: any = getSlideTemplatePayload('featured', i, 'عروض مميزة');
    assert.ok(p.elements.some(isFeaturedLive), `slide ${i} shows featured cards`);
    ids.add(p.aiTemplate);
  }
  assert.equal(ids.size, n);
});

test('the shop, showroom and menu lists no longer hold them, and keep every other slide', () => {
  for (const [kind, total] of [['shop', 14], ['cars', 14], ['restaurant', 12]] as const) {
    const left = slideTemplateCount(kind);
    const ids = Array.from({ length: left }, (_, i) => (getSlideTemplatePayload(kind, i, '') as any).aiTemplate);
    assert.equal(new Set(ids).size, left);
    assert.equal(STORE_SLIDE_IDS[kind].length, total);
    assert.equal(left, total - { shop: 2, cars: 3, restaurant: 3 }[kind]);
  }
  const rest = Array.from({ length: slideTemplateCount('restaurant') }, (_, i) => (getSlideTemplatePayload('restaurant', i, '') as any).aiTemplate);
  assert.ok(!rest.includes('rest.featured') && !rest.includes('rest.featuredStrip') && !rest.includes('rest.featuredShake'));
  assert.ok(rest.includes('rest.front') && rest.includes('rest.cart'));
  const cars = Array.from({ length: slideTemplateCount('cars') }, (_, i) => (getSlideTemplatePayload('cars', i, '') as any).aiTemplate);
  assert.ok(!cars.includes('cars.featured') && !cars.includes('cars.strip') && !cars.includes('cars.shake'));
  assert.ok(cars.includes('cars.all') && cars.includes('cars.request'));
});

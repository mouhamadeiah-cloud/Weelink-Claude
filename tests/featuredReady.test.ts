import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSlideTemplatePayload, slideTemplateCount } from '../src/data/slideTemplates.ts';
import { READY_SLIDE_CATEGORIES } from '../src/data/readyCategories.ts';

const isFeaturedLive = (e: any) => (e.type === 'carListings' && e.carSource === 'featured') || (e.type === 'shopProducts' && e.shopSource === 'featured') || (e.type === 'menuList' && e.menuSource === 'featured');

test('the featured slides of shop, showroom and menu are one category of their own', () => {
  assert.ok(READY_SLIDE_CATEGORIES.some((c) => c.id === 'featured'));
  const n = slideTemplateCount('featured');
  assert.equal(n, 16);
  const ids = new Set<string>();
  const names: string[] = [];
  for (let i = 0; i < n; i++) {
    const p: any = getSlideTemplatePayload('featured', i, 'عروض مميزة');
    assert.ok(p.elements.some(isFeaturedLive), `slide ${i} shows featured cards`);
    names.push(p.name);
    if (p.aiTemplate) ids.add(p.aiTemplate);
  }
  assert.equal(ids.size, 8); // the derived ones are drawn in no look of their own
  assert.equal(new Set(names).size, n);
  for (const page of ['السيارات', 'المطعم', 'المتجر', 'الفندق', 'التأجير (سيارات)', 'التأجير (أغراض)']) assert.ok(names.some((x) => x.startsWith(`شريحة ${page} المميزة`)), page);
  const hotel: any = getSlideTemplatePayload('featured', 9, '');
  assert.ok(JSON.stringify(hotel.elements).includes('غرف مميزة'));
});

test('the shop, showroom and menu lists no longer hold them, and keep every other slide', () => {
  const kinds = { shop: 'shop', cars: 'cars', restaurant: 'rest' } as const;
  for (const [kind, total] of [['shop', 14], ['cars', 14], ['restaurant', 12]] as const) {
    const left = slideTemplateCount(kind);
    const ids = Array.from({ length: left }, (_, i) => (getSlideTemplatePayload(kind, i, '') as any).aiTemplate);
    assert.equal(new Set(ids).size, left);
    assert.equal(left, total - { shop: 2, cars: 3, restaurant: 3 }[kind]);
    // Each is drawn in its store's look (src/utils/pageRecolour.ts reads the start of the tag).
    assert.ok(ids.every((id) => id.startsWith(`${kinds[kind]}.`)));
  }
});

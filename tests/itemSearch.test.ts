import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_ITEM_FILTERS, SearchItem, hasItemFilters, itemFilterChips, itemFromDish, itemFromProduct, itemMatches, sortItems, withoutItemChip } from '../src/components/shop/store/itemSearch.ts';
import { getSlideTemplatePayload, slideTemplateCount } from '../src/data/slideTemplates.ts';
import { READY_SLIDE_CATEGORIES } from '../src/data/readyCategories.ts';

const item = (over: Partial<SearchItem>): SearchItem => ({
  id: 'a', texts: ['x'], group: ['g1'], price: 100, oldPrice: 0, featured: false, available: true, badge: '', options: {}, kind: '', guests: 0, created: '2026-01-01', ...over,
});

test('filters narrow by price, group, guests, kind, options, discount and stock', () => {
  const room = item({ price: 80, group: ['g1'], guests: 4, options: { اللون: ['أحمر', 'أزرق'] }, oldPrice: 100, available: false, kind: 'شرقي' });
  assert.ok(itemMatches(room, EMPTY_ITEM_FILTERS));
  assert.ok(itemMatches(room, { ...EMPTY_ITEM_FILTERS, priceFrom: '50', priceTo: '80' }));
  assert.ok(!itemMatches(room, { ...EMPTY_ITEM_FILTERS, priceFrom: '90' }));
  assert.ok(!itemMatches(room, { ...EMPTY_ITEM_FILTERS, group: 'g2' }));
  assert.ok(itemMatches(room, { ...EMPTY_ITEM_FILTERS, guests: '4' }));
  assert.ok(!itemMatches(room, { ...EMPTY_ITEM_FILTERS, guests: '5' }));
  assert.ok(itemMatches(room, { ...EMPTY_ITEM_FILTERS, options: { اللون: 'أزرق' } }));
  assert.ok(!itemMatches(room, { ...EMPTY_ITEM_FILTERS, options: { اللون: 'أخضر' } }));
  assert.ok(itemMatches(room, { ...EMPTY_ITEM_FILTERS, onSale: true, kind: 'شرقي' }));
  assert.ok(!itemMatches(room, { ...EMPTY_ITEM_FILTERS, available: true }));
});

test('sorting, chips and removing a chip', () => {
  const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const items = new Map([['a', item({ id: 'a', price: 30, created: '2026-01-02' })], ['b', item({ id: 'b', price: 10, created: '2026-01-03' })], ['c', item({ id: 'c', price: 20, created: '2026-01-01' })]]);
  assert.deepEqual(sortItems(list, items, 'priceAsc').map((x) => x.id), ['b', 'c', 'a']);
  assert.deepEqual(sortItems(list, items, 'priceDesc').map((x) => x.id), ['a', 'c', 'b']);
  assert.deepEqual(sortItems(list, items, 'newest').map((x) => x.id), ['b', 'a', 'c']);
  assert.deepEqual(sortItems(list, items, '').map((x) => x.id), ['a', 'b', 'c']);
  const f = { ...EMPTY_ITEM_FILTERS, priceFrom: '10', group: 'g1', onSale: true, options: { اللون: 'أحمر' } };
  assert.ok(hasItemFilters(f) && !hasItemFilters(EMPTY_ITEM_FILTERS));
  const chips = itemFilterChips(f, () => 'قسم');
  assert.deepEqual(chips.map((c) => c.key), ['group', 'price', 'option:اللون', 'onSale']);
  assert.equal(withoutItemChip(f, 'price').priceFrom, '');
  assert.equal(withoutItemChip(f, 'option:اللون').options['اللون'], '');
  assert.equal(withoutItemChip(f, 'onSale').onSale, false);
});

test('products and dishes become search items (a sub catalog counts in its main catalog)', () => {
  const catalogs: any[] = [{ id: 'main', name: 'ملابس', parentId: null }, { id: 'sub', name: 'قمصان', parentId: 'main' }];
  const p: any = { id: 'p', name: 'قميص', shortDescription: '', sku: 'S1', catalogIds: ['sub'], price: 5, oldPrice: 8, featured: true, inWarehouse: true, stock: 0, badge: 'new', options: [{ name: 'المقاس', values: [{ label: 'L' }, { label: 'M' }] }], maxGuests: 0, createdAt: '2026-01-01' };
  const it = itemFromProduct(p, catalogs);
  assert.deepEqual(it.group.sort(), ['main', 'sub']);
  assert.equal(it.available, false);
  assert.deepEqual(it.options, { المقاس: ['L', 'M'] });
  const d: any = { id: 'd', name: 'شاورما', description: 'دجاج', cuisine: 'شرقي', categoryId: 'c1', price: 3, oldPrice: 0, featured: false, available: true, badge: 'spicy', createdAt: '2026-01-01' };
  const di = itemFromDish(d, [{ id: 'c1', name: 'سندويش' } as any]);
  assert.deepEqual(di.group, ['c1']);
  assert.equal(di.kind, 'شرقي');
  assert.ok(di.texts.includes('سندويش'));
});

test('«شرائح البحث»: one slim coloured slide per kind of page', () => {
  assert.ok(READY_SLIDE_CATEGORIES.some((c) => c.id === 'search' && c.name === 'شرائح البحث'));
  assert.equal(slideTemplateCount('search'), 5);
  const slides: any[] = Array.from({ length: 5 }, (_, i) => getSlideTemplatePayload('search', i, 'شرائح البحث'));
  assert.equal(new Set(slides.map((s) => s.backgroundColor)).size, 5);
  assert.equal(new Set(slides.map((s) => s.name)).size, 5);
  for (const s of slides) {
    assert.ok(s.height <= 130);
    assert.equal(s.elements.length, 1);
    assert.ok(['shopSearch', 'carSearch'].includes(s.elements[0].type));
  }
  assert.equal(slides[0].elements[0].shopSearchKind, 'menu');
  assert.equal(slides[2].elements[0].type, 'carSearch');
});

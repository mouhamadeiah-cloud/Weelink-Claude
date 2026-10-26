import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isProjectKey, kindOf, localPrefixOf, newProjectKey } from '../src/utils/projectKeys.ts';
import { createEmptyRentalAdmin, normalizeRentalAdmin, rentalCatalogs, rentsCars } from '../src/components/rental/rentalTypes.ts';
import { getRentalTemplate } from '../src/data/rentalTemplate.ts';
import { itemsOf } from '../server/searchIndex.ts';
import { limitsOf } from '../src/utils/planLimits.ts';
import { flavorOf, PLANS } from '../src/data/plans.ts';
import categories from '../src/data/rentalCategories.json' with { type: 'json' };

test('a rental is a project kind of its own', () => {
  assert.ok(isProjectKey('rental'));
  const key = newProjectKey('rental');
  assert.ok(isProjectKey(key));
  assert.equal(kindOf(key), 'rental');
  assert.equal(localPrefixOf('rental'), 'weelink_rental_');
});

test('a rental keeps cars and items, and old or broken data still loads', () => {
  const empty = createEmptyRentalAdmin();
  assert.deepEqual(empty.cars.cars, []);
  assert.deepEqual(empty.shop.products, []);
  const loaded = normalizeRentalAdmin({ cars: { cars: [{ id: 'c1', brand: 'كيا' }] }, shop: null });
  assert.equal(loaded.cars.cars.length, 1);
  assert.deepEqual(loaded.shop.products, []);
  assert.deepEqual(normalizeRentalAdmin(undefined).cars.cars, []);
});

test('the packages: free is a page with the rental flavour, 30 and 60 count cars and items, Pro is open', () => {
  assert.deepEqual(PLANS.rental.map((p) => p.id), ['rental-free', 'rental-30', 'rental-60', 'rental-pro']);
  assert.equal(flavorOf('rental-free'), 'rental');
  assert.equal(limitsOf('rental-30').items, 30);
  assert.equal(limitsOf('rental-60').items, 60);
  assert.equal(limitsOf('rental-pro').items, Number.POSITIVE_INFINITY);
  assert.equal(limitsOf('rental-free').bookings, false);
});

test('a car rental lists car cards; any other rental lists the item cards in their place', () => {
  assert.ok(rentsCars('سيارات'));
  assert.ok(rentsCars(''));
  assert.ok(!rentsCars('صالات'));
  const cars = getRentalTemplate('سيارات');
  assert.ok(cars.elements.some((e) => e.type === 'carListings'));
  assert.ok(!cars.elements.some((e) => e.type === 'shopProducts'));
  const halls = getRentalTemplate('صالات');
  assert.ok(!halls.elements.some((e) => e.type === 'carListings' || e.type === 'carSearch'));
  const grids = halls.elements.filter((e) => e.type === 'shopProducts');
  assert.equal(grids.length, 2);
  assert.ok(grids.some((e) => e.shopSource === 'featured'));
  assert.ok(halls.elements.some((e) => e.type === 'shopSearch'));
  assert.equal(halls.pages.length, 5);
  assert.equal(halls.elements.filter((e) => e.type === 'cart').length, 1);
  assert.equal(halls.elements.filter((e) => e.type === 'checkout').length, 1);
  assert.ok(halls.pages.every((p) => p.navbar.items.some((i) => i.label === 'للإيجار')));
  assert.equal(new Set(halls.elements.map((e) => e.id)).size, halls.elements.length);
});

test('the catalogs of a new rental: everything but cars, the owner\'s kind first', () => {
  const list = categories.map((c) => ({ name: c.name, subs: c.subs }));
  const cats = rentalCatalogs(list, 'صالات');
  const top = cats.filter((c) => !c.parentId);
  assert.equal(top[0].name, 'صالات');
  assert.ok(!top.some((c) => c.name === 'سيارات'));
  const halls = cats.filter((c) => c.parentId === top[0].id).map((c) => c.name);
  assert.ok(halls.includes('صالات أفراح ومناسبات') && halls.includes('صالات رياضية وملاعب') && halls.includes('صالات عزاء'));
  assert.equal(new Set(cats.map((c) => c.id)).size, cats.length);
});

test('Weelink search indexes a published rental\'s cars and items', () => {
  const items = itemsOf('rental', {
    cars: { cars: [{ id: 'c1', brand: 'هيونداي', model: 'أكسنت', year: 2020, price: 40, currency: '$', published: true, status: 'available' }] },
    shop: { catalogs: [{ id: 'k', name: 'صالات' }], products: [{ id: 'p1', name: 'صالة الياسمين', price: 500, currency: '$', catalogIds: ['k'], published: true }] },
  });
  assert.deepEqual(items.map((i) => i.kind), ['car', 'product']);
  assert.equal(items[1].category, 'صالات');
});

test('the rental catalogs repeat no sub kind, and a rental item\'s specs are all known presets', async () => {
  const subs = categories.flatMap((c) => c.subs);
  assert.equal(new Set(subs).size, subs.length);
  const { RENTAL_SPEC_PRESETS, SPEC_PRESETS } = await import('../src/components/shop/artikel.ts');
  assert.ok(RENTAL_SPEC_PRESETS.every((k: string) => SPEC_PRESETS[k]));
  for (const k of ['brand', 'model', 'area', 'power']) assert.ok(RENTAL_SPEC_PRESETS.includes(k) && !SPEC_PRESETS[k].affectsStock);
});

test('a rental made before its cart page gets one, once', async () => {
  const { withRentalCart } = await import('../src/data/rentalCartPage.ts');
  const t = getRentalTemplate('سيارات');
  const stripped = { pages: t.pages.filter((p) => p.id !== 'rental-page-cart'), elements: t.elements.filter((e) => e.type !== 'cart' && e.type !== 'checkout') };
  const added = withRentalCart(stripped.pages, stripped.elements, 9)!;
  assert.equal(added.pages.length, stripped.pages.length + 1);
  assert.equal(added.elements.filter((e) => e.type === 'cart').length, 1);
  assert.equal(withRentalCart(added.pages, added.elements, 10), null);
});

test('the first rental cart (one cart element) is split into the summary and the booking card, once', async () => {
  const { withRentalCart } = await import('../src/data/rentalCartPage.ts');
  const t = getRentalTemplate('سيارات');
  const first = { pages: t.pages, elements: t.elements.filter((e) => e.type !== 'checkout').map((e) => (e.type === 'cart' ? { ...e, cartSplit: undefined, width: 900 } : e)) };
  const split = withRentalCart(first.pages, first.elements, 11)!;
  assert.ok(split.elements.find((e) => e.type === 'cart')!.cartSplit);
  assert.equal(split.elements.filter((e) => e.type === 'checkout').length, 1);
  assert.equal(withRentalCart(split.pages, split.elements, 12), null);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exampleProducts, withExampleProducts } from '../src/data/exampleItems.ts';
import { createEmptyShopAdmin } from '../src/components/shop/shopTypes.ts';
import { exampleCars } from '../src/components/cars/carTypes.ts';
import { fitExtra, fitMinHeight, MIN_LIST_HEIGHT } from '../src/utils/listFit.ts';

test('every kind starts with at least five marked examples', () => {
  for (const kind of ['shop', 'rental', 'hotel'] as const) {
    const list = exampleProducts(kind, '$');
    assert.ok(list.length >= 5, kind);
    assert.ok(list.every((p) => p.sample && p.name && p.price > 0));
    assert.equal(new Set(list.map((p) => p.id)).size, list.length);
  }
  assert.ok(exampleProducts('hotel', '$').every((p) => p.maxGuests > 0));
  assert.ok(exampleProducts('rental', '$').every((p) => !p.inWarehouse));
  const cars = exampleCars();
  assert.ok(cars.length >= 5 && cars.every((c) => c.sample));
});

test('examples never replace what the owner already has', () => {
  const shop = withExampleProducts(createEmptyShopAdmin(), 'shop');
  assert.equal(shop.products.length, 5);
  assert.equal(withExampleProducts(shop, 'hotel').products, shop.products);
});

test('a live list takes the room its cards need', () => {
  assert.equal(fitExtra(300, 500, true), -200);
  assert.equal(fitExtra(80, 500, true), MIN_LIST_HEIGHT - 500);
  assert.equal(fitExtra(900, 500, true), 400);
  assert.equal(fitExtra(300, 500, false), 0);
  assert.equal(fitExtra(700, 500, false), 200);
  assert.equal(fitMinHeight(true, 500), MIN_LIST_HEIGHT);
  assert.equal(fitMinHeight(false, 500), 500);
  assert.equal(fitMinHeight(true, 100), 100);
});

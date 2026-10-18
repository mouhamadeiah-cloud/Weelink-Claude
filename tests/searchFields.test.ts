import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProduct } from '../src/components/shop/shopTypes.ts';
import { normalizeRestaurantAdmin } from '../src/components/restaurant/restaurantTypes.ts';

test('a product keeps the artikel sub-catalog and name it was picked from; older ones get 0', () => {
  const p = normalizeProduct({ id: 'a', artikelSub: 101, artikelItem: 10101 }, 'SYP');
  assert.deepEqual([p.artikelSub, p.artikelItem], [101, 10101]);
  const old = normalizeProduct({ id: 'b' }, 'SYP');
  assert.deepEqual([old.artikelSub, old.artikelItem], [0, 0]);
  assert.equal(normalizeProduct({ id: 'c', artikelSub: -5 }, 'SYP').artikelSub, 0);
});

test('a dish keeps its kind of food', () => {
  const dishes = normalizeRestaurantAdmin({ dishes: [{ id: 'd', name: 'x', cuisine: ' سوشي / رامن / صيني ' }, { id: 'e', name: 'y' }] }).dishes;
  assert.equal(dishes.find((d) => d.id === 'd')!.cuisine, 'سوشي / رامن / صيني');
  assert.equal(dishes.find((d) => d.id === 'e')!.cuisine, '');
});

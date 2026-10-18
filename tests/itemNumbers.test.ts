import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/item-numbers.ts';
import { store, tokens } from './fakeAdmin.ts';
import { giveNumbers, itemNoLabel, missingIds, parseItemNo } from '../src/utils/itemNumbers.ts';

process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ private_key: 'x' });
tokens['owner'] = { uid: 'u1', firebase: { sign_in_provider: 'password' } };
tokens['other'] = { uid: 'u2', firebase: { sign_in_provider: 'google.com' } };
tokens['guest'] = { uid: 'g1', firebase: { sign_in_provider: 'anonymous' } };

const call = async (token: string | null, body: unknown) => {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await handler.fetch(new Request('http://x/api/item-numbers', { method: 'POST', headers, body: JSON.stringify(body) }));
  return { status: res.status, ...(await res.json()) } as any;
};

test('labels and typed numbers', () => {
  assert.equal(itemNoLabel('car', 10001), 'C-10001');
  assert.equal(itemNoLabel('dish', 10042), 'F-10042');
  assert.equal(itemNoLabel('product', 0), '');
  assert.deepEqual(parseItemNo('c-10001'), { kind: 'car', no: 10001 });
  assert.deepEqual(parseItemNo(' S 10002 '), { kind: 'product', no: 10002 });
  assert.deepEqual(parseItemNo('10003'), { kind: null, no: 10003 });
  assert.equal(parseItemNo('C-12'), null);
  assert.equal(parseItemNo('hello'), null);
});

test('numbers go to the items that had none, by id', () => {
  const items = [{ id: 'a', publicNo: 0 }, { id: 'b', publicNo: 10005 }, { id: 'c', publicNo: 0 }, { id: 'd', publicNo: 0 }];
  assert.deepEqual(missingIds(items), ['a', 'c', 'd']);
  // d was added after the numbers were asked for, b already has one
  const out = giveNumbers(items, ['a', 'c'], 20000);
  assert.deepEqual(out.map((i) => i.publicNo), [20000, 10005, 20001, 0]);
  assert.equal(giveNumbers(out, ['b'], 30000), out, 'nothing to give: same list');
});

test('the server hands out consecutive numbers per kind, from 10001', async () => {
  const a = await call('owner', { kind: 'car', count: 3 });
  assert.deepEqual([a.status, a.from, a.count], [200, 10001, 3]);
  const b = await call('other', { kind: 'car', count: 2 });
  assert.equal(b.from, 10004, 'another owner continues the same counter');
  const c = await call('owner', { kind: 'dish', count: 1 });
  assert.equal(c.from, 10001, 'each kind counts on its own');
  assert.equal(store.get('platform_counters/items_car').next, 10006);
});

test('only signed-in owners ask, with sane amounts', async () => {
  assert.equal((await call(null, { kind: 'car', count: 1 })).status, 401);
  assert.equal((await call('bad', { kind: 'car', count: 1 })).status, 401);
  assert.equal((await call('guest', { kind: 'car', count: 1 })).status, 401);
  assert.equal((await call('owner', { kind: 'boat', count: 1 })).status, 400);
  assert.equal((await call('owner', { kind: 'car', count: 0 })).status, 400);
  assert.equal((await call('owner', { kind: 'car', count: 201 })).status, 400);
  assert.equal(store.get('platform_counters/items_car').next, 10006, 'refused calls use no numbers');
});

test('the number survives loading an admin and reaches the published copy', async () => {
  const { normalizeCarAdmin, emptyCar } = await import('../src/components/cars/carTypes.ts');
  const { normalizeShopAdmin } = await import('../src/components/shop/shopTypes.ts');
  const { normalizeRestaurantAdmin } = await import('../src/components/restaurant/restaurantTypes.ts');
  const { publicDataFor } = await import('../src/components/publish/publicData.ts');
  const car = { ...emptyCar('USD'), id: 'c1', brand: 'Kia', model: 'Rio', publicNo: 10077 };
  const cars = normalizeCarAdmin({ cars: [car, { ...car, id: 'c2', publicNo: undefined }] });
  assert.deepEqual(cars.cars.map((c) => c.publicNo), [10077, 0]);
  assert.equal((publicDataFor('cars', normalizeShopAdmin({}), cars) as any).cars[0].publicNo, 10077);
  const shop = normalizeShopAdmin({ products: [{ id: 'p1', name: 'x', publicNo: 10009 }, { id: 'p2', name: 'y' }] });
  assert.deepEqual(shop.products.map((p) => p.publicNo), [10009, 0]);
  assert.equal((publicDataFor('shop', shop, cars) as any).products[0].publicNo, 10009);
  const rest = normalizeRestaurantAdmin({ dishes: [{ id: 'd1', name: 'x', publicNo: 10003 }] });
  assert.equal(rest.dishes[0].publicNo, 10003);
});

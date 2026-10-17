import { test } from 'node:test';
import assert from 'node:assert/strict';
import { store, getFirestore } from './fakeAdmin.ts';
import { UNLIMITED, limitsOf, overLimit, smallestFitting } from '../src/utils/planLimits.ts';
import { projectLimits } from '../src/services/billing.ts';
import { buildAllowance } from '../api/build-page.ts';

test('limits per package', () => {
  assert.equal(limitsOf('shop-30').items, 30);
  assert.equal(limitsOf('restaurant-60').items, 60);
  assert.equal(limitsOf('cars-pro').items, Infinity);
  assert.equal(limitsOf('page-free').gallery, 5);
  assert.equal(limitsOf('page-pro').gallery, 15);
  assert.equal(limitsOf('restaurant-60', 2).devices, 3, 'extra devices bought on top');
  assert.equal(limitsOf('unknown').builds, 1);
  assert.equal(smallestFitting(['shop-30', 'shop-60', 'shop-pro'], 42), 'shop-60');
  assert.equal(smallestFitting(['shop-30', 'shop-60'], 99), '');
  assert.ok(overLimit(30, 31, 30) && !overLimit(31, 31, 30) && !overLimit(40, 39, 30) && !overLimit(5, 6, 30));
});

test('the editor is unlimited until paying is on, and for test accounts', () => {
  const later = Date.now() + 86400000;
  assert.equal(projectLimits(null, 'u', 'shop'), UNLIMITED);
  assert.equal(projectLimits({ enforce: false, test: false, paidUntil: 0 }, 'u', 'shop'), UNLIMITED);
  assert.equal(projectLimits({ enforce: true, test: true, paidUntil: 0 }, 'u', 'shop'), UNLIMITED);
  assert.equal(projectLimits({ enforce: true, test: false, paidUntil: later, plan: 'shop-pro' }, 'u', 'shop').items, Infinity);
  assert.equal(projectLimits({ enforce: true, test: false, paidUntil: later, plan: 'restaurant-60', devices: 1 }, 'u', 'restaurant').devices, 2);
  assert.equal(projectLimits({ enforce: true, test: false, paidUntil: 0 }, 'u', 'page').gallery, 5, 'a page is free before Pro');
  assert.equal(projectLimits({ enforce: true, test: false, paidUntil: 0 }, 'u', 'cars-abcd12').items, 60, 'unpaid: the popular package');
});

test('«ابن صفحتي» counts per project once paying is on', async () => {
  const db = getFirestore() as any;
  const day = Date.UTC(2026, 9, 17, 10);
  assert.equal(await buildAllowance(db, 'b1', 'page', day), null, 'paying off: no limit');
  store.set('platformSettings/billing', { enforce: true });
  store.set('testAccounts/b2', { at: 1 });
  assert.equal(await buildAllowance(db, 'b2', 'page', day), null, 'test account');

  const free = await buildAllowance(db, 'b1', 'page', day);
  assert.equal(free!.over, false);
  store.set('platform_builds/b1__page', { day: '2026-10-10', today: 1, total: 1 });
  assert.equal((await buildAllowance(db, 'b1', 'page', day))!.over, true, 'a free page builds once, ever');

  store.set('projectAccess/b1__shop', { plan: 'shop-pro', paidUntil: day + 1e9 });
  store.set('platform_builds/b1__shop', { day: '2026-10-17', today: 4, total: 9 });
  assert.equal((await buildAllowance(db, 'b1', 'shop', day))!.over, false, 'Pro: 5 a day');
  store.set('platform_builds/b1__shop', { day: '2026-10-17', today: 5, total: 10 });
  assert.equal((await buildAllowance(db, 'b1', 'shop', day))!.over, true);
  assert.equal((await buildAllowance(db, 'b1', 'shop', day + 86400000))!.over, false, 'a new day');
  store.set('platform_builds/b1__cars', { day: '2026-10-17', today: 1, total: 1 });
  assert.equal((await buildAllowance(db, 'b1', 'cars', day))!.over, true, 'unpaid: once a day');
  store.delete('platformSettings/billing');
});

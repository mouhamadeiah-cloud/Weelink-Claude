import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLANS, flavorOf } from '../src/data/plans.ts';
import { limitsOf } from '../src/utils/planLimits.ts';
import { modelOf } from '../src/data/pageModels.ts';

test('the restaurant, shop and showroom each start with a free package, then 30, 60 and Pro', () => {
  for (const k of ['restaurant', 'shop', 'cars'] as const) {
    assert.deepEqual(PLANS[k].map((p) => p.id), [`${k}-free`, `${k}-30`, `${k}-60`, `${k}-pro`]);
    assert.equal(PLANS[k][0].monthly, 0);
    assert.ok(PLANS[k].slice(1).every((p) => p.monthly > 0));
  }
});

test('only the free packages of the three types carry a flavour', () => {
  assert.equal(flavorOf('restaurant-free'), 'restaurant');
  assert.equal(flavorOf('shop-free'), 'shop');
  assert.equal(flavorOf('cars-free'), 'cars');
  for (const id of ['page-free', 'page-pro', 'restaurant-30', 'shop-pro', 'cars-60', '', null, undefined]) assert.equal(flavorOf(id as any), null);
});

test('a free flavoured page has the free page limits (5 photos, one build, no item limit) and its own model', () => {
  for (const k of ['restaurant', 'shop', 'cars']) {
    const l = limitsOf(`${k}-free`);
    assert.deepEqual([l.gallery, l.builds, l.perDay, l.items, l.devices], [5, 1, false, Number.POSITIVE_INFINITY, 0]);
    assert.equal(modelOf(`${k}-free`), `${k}-free`);
  }
});

test('the start page and the questions send a flavoured free page as a page', () => {
  const start = readFileSync(new URL('../src/components/onboarding/StartPage.tsx', import.meta.url), 'utf8');
  assert.match(start, /flavor \? 'page' : chosen\.type/);
  assert.match(start, /startQuestions\(f \? 'page' : kind\)/);
});
import { readFileSync } from 'node:fs';

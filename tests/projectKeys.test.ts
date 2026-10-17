import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isFirstOfKind, isProjectKey, kindOf, localPrefixOf, newProjectKey } from '../src/utils/projectKeys.ts';

test('first projects keep their kind as key and their old local prefixes', () => {
  for (const k of ['page', 'shop', 'cars', 'restaurant']) {
    assert.ok(isProjectKey(k));
    assert.ok(isFirstOfKind(k));
    assert.equal(kindOf(k), k);
  }
  assert.equal(localPrefixOf('page'), 'weelink_');
  assert.equal(localPrefixOf('restaurant'), 'weelink_restaurant_');
});

test('later projects get the kind and their own id', () => {
  const key = newProjectKey('restaurant');
  assert.match(key, /^restaurant-[a-z0-9]{6}$/);
  assert.ok(isProjectKey(key));
  assert.ok(!isFirstOfKind(key));
  assert.equal(kindOf(key), 'restaurant');
  assert.equal(localPrefixOf('shop-ab12cd'), 'weelink_shop_ab12cd_');
});

test('anything else is not a project key', () => {
  for (const bad of ['', 'blog', 'shop-', 'shop-AB12', 'shop-ab1', 'page-ab12/x', 'restaurant_ab12', 7, null]) assert.ok(!isProjectKey(bad), String(bad));
});

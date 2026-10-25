import test from 'node:test';
import assert from 'node:assert/strict';
import { UNLIMITED, limitsOf } from '../src/utils/planLimits';

test('bookings and accounts: not in the free packages, in all the others', () => {
  for (const id of ['page-free', 'restaurant-free', 'shop-free', 'cars-free']) assert.equal(limitsOf(id).bookings, false, id);
  for (const id of ['page-pro', 'restaurant-30', 'restaurant-60', 'restaurant-pro', 'shop-30', 'shop-pro', 'cars-60', 'cars-pro']) assert.equal(limitsOf(id).bookings, true, id);
  assert.equal(UNLIMITED.bookings, true);
  assert.equal(limitsOf('unknown').bookings, false);
});

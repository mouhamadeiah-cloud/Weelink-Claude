import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placeFromAddress, placeLabel } from '../src/services/place.ts';

test('a city address keeps governorate, city, area, street and the pin', () => {
  const p = placeFromAddress({ governorate: 'اللاذقية', placeType: 'city', city: 'اللاذقية', area: 'الرمل', district: 'x', street: ' شارع 8 ', details: 'سر', coordinates: { lat: 35.5, lng: 35.8 } })!;
  assert.equal(p.area, 'الرمل');
  assert.equal(p.district, '');
  assert.equal(p.street, 'شارع 8');
  assert.deepEqual([p.lat, p.lng], [35.5, 35.8]);
  assert.equal('details' in p, false);
  assert.equal(placeLabel(p), 'اللاذقية، اللاذقية، الرمل، شارع 8');
});

test('a rural address keeps the village and drops the city', () => {
  const p = placeFromAddress({ governorate: 'حماة', placeType: 'rural', city: 'حماة', village: 'قرية', district: 'مصياف' })!;
  assert.equal(p.village, 'قرية');
  assert.equal(p.city, '');
});

test('no governorate of the 14, or a bad pin, gives no place or no pin', () => {
  assert.equal(placeFromAddress({ governorate: 'باريس' }), null);
  assert.equal(placeFromAddress(undefined), null);
  assert.equal(placeFromAddress({ governorate: 'حلب', coordinates: { lat: 999, lng: 1 } })!.lat, null);
});

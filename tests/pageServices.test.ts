import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyPageAdmin, normalizePageAdmin, servicesFromAnswers } from '../src/components/pageAdmin/pageServices.ts';
import { publicDataFor } from '../src/components/publish/publicData.ts';
import { createEmptyShopAdmin } from '../src/components/shop/shopTypes.ts';
import { createEmptyCarAdmin } from '../src/components/cars/carTypes.ts';

test('normalizePageAdmin keeps named services and defaults the rest', () => {
  const a = normalizePageAdmin({ services: [{ name: ' تركيب مكيف ', price: '20$', publicNo: 10002 }, { name: '' }, { name: 'x', published: false }] });
  assert.equal(a.services.length, 2);
  assert.equal(a.services[0].name, 'تركيب مكيف');
  assert.equal(a.services[0].publicNo, 10002);
  assert.equal(a.services[0].published, true);
  assert.equal(a.services[1].published, false);
  assert.equal(normalizePageAdmin(null).services.length, 0);
});

test('servicesFromAnswers turns Wee AI rows into unnumbered items', () => {
  const s = servicesFromAnswers([{ name: 'استشارة', price: '10$' }, { name: ' ' }]);
  assert.equal(s.length, 1);
  assert.equal(s[0].publicNo, 0);
  assert.equal(s[0].price, '10$');
});

test('the published copy of a page carries only shown services', () => {
  const page = normalizePageAdmin({ services: [{ name: 'a' }, { name: 'b', published: false }] });
  const data: any = publicDataFor('page', createEmptyShopAdmin(), createEmptyCarAdmin(), page);
  assert.deepEqual(data.services.map((s: any) => s.name), ['a']);
  assert.equal(publicDataFor('page', createEmptyShopAdmin(), createEmptyCarAdmin(), createEmptyPageAdmin()), null);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MODELS, MODEL_CATEGORIES, cleanSections, modelOf } from '../src/data/pageModels.ts';
import { readModels, resetModel, saveModel } from '../server/pageModels.ts';
import { getFirestore, store } from './fakeAdmin.ts';

const db = getFirestore() as any;
const reset = () => { for (const k of [...store.keys()]) if (k.startsWith('pageModels/')) store.delete(k); };

test('eleven models: the free page, its pro, and three types in free, paid and pro', () => {
  assert.deepEqual(DEFAULT_MODELS.map((m) => m.id), ['page-free', 'page-pro', 'restaurant-free', 'restaurant', 'restaurant-pro', 'shop-free', 'shop', 'shop-pro', 'cars-free', 'cars', 'cars-pro']);
});

test('every model starts with an intro slide, ends with the contact (and the optional privacy) and uses known categories', () => {
  const known = new Set(MODEL_CATEGORIES.map((c) => c.id));
  for (const m of DEFAULT_MODELS) {
    assert.ok(m.sections[0].category === 'intro' || m.sections[0].part === 'front', `${m.id} starts with an intro`);
    assert.equal(m.sections.at(-2)?.category, 'contact');
    assert.equal(m.sections.at(-1)?.category, 'privacy');
    assert.equal(new Set(m.sections.map((s) => s.id)).size, m.sections.length, `${m.id} has no repeated section`);
    for (const s of m.sections) assert.ok(known.has(s.category), `${m.id}: ${s.category}`);
  }
});

test('the legal slide is ticked from the start and the owner may untick it; ratings are asked, not forced', () => {
  const s = DEFAULT_MODELS[0].sections;
  assert.deepEqual(s.find((x) => x.category === 'privacy'), { id: 'privacy', category: 'privacy', mode: 'ask', defaultOn: true });
  assert.equal(s.find((x) => x.category === 'ratings')?.mode, 'ask');
});

test('the free restaurant, shop and showroom take a hand-typed price list instead of the live section', () => {
  for (const t of ['restaurant', 'shop', 'cars']) {
    const free = DEFAULT_MODELS.find((m) => m.id === `${t}-free`)!.sections.map((s) => s.id);
    assert.ok(free.includes('table:priceList') && !free.includes(`${t}:main`));
    assert.ok(DEFAULT_MODELS.find((m) => m.id === t)!.sections.some((s) => s.id === `${t}:main`));
  }
});

test('a package builds from its model: 30 and 60 share one', () => {
  assert.equal(modelOf('page-free'), 'page-free');
  assert.equal(modelOf('page-pro'), 'page-pro');
  assert.equal(modelOf('restaurant-30'), 'restaurant');
  assert.equal(modelOf('restaurant-60'), 'restaurant');
  assert.equal(modelOf('shop-pro'), 'shop-pro');
  assert.equal(modelOf('cars-free'), 'cars-free');
  assert.equal(modelOf('nonsense'), 'page-free');
});

test('saved sections are cleaned: unknown ones dropped, repeats kept once, an empty list refused', () => {
  const out = cleanSections([{ category: 'intro', mode: 'always' }, { category: 'intro', mode: 'ask' }, { category: 'nope', mode: 'always' }, { category: 'about', mode: 'wat' }, { category: 'gallery', mode: 'if', need: 'x' }]);
  assert.deepEqual(out, [{ id: 'intro', category: 'intro', mode: 'always' }, { id: 'gallery', category: 'gallery', mode: 'if', need: 'services' }]);
  assert.equal(cleanSections([]), null);
  assert.equal(cleanSections('x'), null);
});

test('the admin saves a model, reads it back over the defaults, and resets it', async () => {
  reset();
  assert.equal((await readModels(db)).every((m) => !m.custom), true);
  assert.deepEqual(await saveModel(db, 'zzz', [{ category: 'intro', mode: 'always' }], 'x'), { error: 'bad_model' });
  assert.deepEqual(await saveModel(db, 'page-free', [], 'x'), { error: 'bad_sections' });
  const r = await saveModel(db, 'page-free', [{ category: 'intro', mode: 'always' }, { category: 'contact', mode: 'always' }], 'admin:eyad');
  assert.ok('ok' in r);
  const free = (await readModels(db)).find((m) => m.id === 'page-free')!;
  assert.equal(free.custom, true);
  assert.deepEqual(free.sections.map((s) => s.id), ['intro', 'contact']);
  assert.deepEqual(await resetModel(db, 'page-free'), { ok: true });
  assert.equal((await readModels(db)).find((m) => m.id === 'page-free')!.custom, false);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MODELS, MODEL_CATEGORIES, cleanPages, cleanSections, modelOf, pagesOf } from '../src/data/pageModels.ts';
import { readModels, resetModel, saveModel } from '../server/pageModels.ts';
import { getFirestore, store } from './fakeAdmin.ts';

const db = getFirestore() as any;
const reset = () => { for (const k of [...store.keys()]) if (k.startsWith('pageModels/')) store.delete(k); };

test('eleven models: the free page, its pro, and three types in free, paid and pro', () => {
  assert.deepEqual(DEFAULT_MODELS.map((m) => m.id), ['page-free', 'page-pro', 'restaurant-free', 'restaurant', 'restaurant-pro', 'shop-free', 'shop', 'shop-pro', 'cars-free', 'cars', 'cars-pro', 'rental-free', 'rental', 'rental-pro', 'hotel-free', 'hotel', 'hotel-pro']);
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

test('pages are cleaned: named, unique ids, empty pages dropped, the same section may be in two pages', () => {
  const out = cleanPages([
    { id: 'a', name: '  ', sections: [{ category: 'intro', mode: 'always' }, { category: 'about', mode: 'always' }] },
    { id: 'a', name: 'خدماتنا', sections: [{ category: 'about', mode: 'ask' }] },
    { name: 'فارغة', sections: [] },
  ])!;
  assert.deepEqual(out.map((p) => p.name), ['الرئيسية', 'خدماتنا']);
  assert.equal(new Set(out.map((p) => p.id)).size, 2);
  assert.equal(out[1].sections[0].id, 'about');
  assert.equal(cleanPages([{ sections: [] }]), null);
  assert.equal(cleanPages('x'), null);
});

test('a section keeps the slides the admin allowed, without repeats or blanks', () => {
  const [s] = cleanSections([{ category: 'about', mode: 'always', slides: ['r1', 'r1', '', 'r2'] }])!;
  assert.deepEqual(s.slides, ['r1', 'r2']);
  assert.equal('slides' in cleanSections([{ category: 'about', mode: 'always', slides: [] }])![0], false);
});

test('a model is saved as pages; the first page stays as `sections` for the builder; an old model is one page', async () => {
  reset();
  const r = await saveModel(db, 'page-free', [{ name: 'الرئيسية', sections: [{ category: 'intro', mode: 'always' }, { category: 'contact', mode: 'always' }] }, { name: 'من نحن', sections: [{ category: 'about', mode: 'always' }] }], 'x');
  assert.ok('ok' in r);
  const m = (await readModels(db)).find((x) => x.id === 'page-free')!;
  assert.deepEqual(m.pages!.map((p) => p.name), ['الرئيسية', 'من نحن']);
  assert.deepEqual(m.sections.map((s) => s.id), ['intro', 'contact']);
  store.set('pageModels/page-pro', { sections: [{ category: 'intro', mode: 'always' }] });
  const old = (await readModels(db)).find((x) => x.id === 'page-pro')!;
  assert.equal(old.custom, true);
  assert.deepEqual(old.pages!.map((p) => [p.name, p.sections.length]), [['الرئيسية', 1]]);
  assert.deepEqual(pagesOf(DEFAULT_MODELS[0]).map((p) => p.name), ['الرئيسية']);
  reset();
});

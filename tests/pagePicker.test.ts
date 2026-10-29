import { test } from 'node:test';
import assert from 'node:assert/strict';
import { photoCapacity, pickSections, sectionsFor, slidePool, type SlidePool } from '../server/pagePicker.ts';
import { DEFAULT_MODELS } from '../src/data/pageModels.ts';
import { getFirestore, store } from './fakeAdmin.ts';

const slide = (texts = ['title', 'sub']) => ({ slide: { id: 's', height: 500 }, name: 'تصميم', elements: texts.map((t, i) => ({ id: `e${i}`, type: 'heading', aiSlot: t, content: 'نص' })) });
const pool = (byCat: Record<string, string[]> = {}): SlidePool => ({
  ids: (c) => (byCat[c] || []).map((id) => ({ id })), load: async (id) => (id.startsWith('bad') ? null : slide()),
});
const free = DEFAULT_MODELS[0].sections;
const none = { services: false, priced: false, photos: false };

test('the owner gets the always sections, the ones whose need is met, and the ticked or default-on asked ones', () => {
  const ids = (o: any) => sectionsFor(free, o).map((s) => s.id);
  assert.deepEqual(ids(none), ['intro', 'about', 'contact', 'privacy']); // privacy is ticked from the start
  assert.deepEqual(ids({ services: true, priced: true, photos: true }), ['intro', 'about', 'services', 'prices', 'gallery', 'contact', 'privacy']);
  assert.deepEqual(ids({ ...none, ticked: ['ratings'] }), ['intro', 'about', 'ratings', 'contact']); // he unticked the legal slide
});

test('each section takes the first ready slide of its category, by the model\'s own section id, in the model\'s order', async () => {
  const r = await pickSections({ sections: sectionsFor(free, none), pool: pool({ intro: ['i1', 'i2'], about: ['a1'], contact: ['c1'], privacy: ['p1'] }), kind: 'page' });
  assert.deepEqual(r.pool.map((p) => [p.id, p.template]), [['intro', 'g:i1'], ['about', 'g:a1'], ['contact', 'g:c1'], ['privacy', 'g:p1']]);
  assert.deepEqual(Object.keys(r.extra), ['g:i1', 'g:a1', 'g:c1', 'g:p1']);
  assert.equal(r.pool[1].name, 'من نحن');
});

test('the same answers build the same slides every time; a section with no slide is skipped by name, the ratings are the browser\'s', async () => {
  const sections = sectionsFor(free, { ...none, ticked: ['ratings', 'privacy'] });
  const a = await pickSections({ sections, pool: pool({ intro: ['i1', 'i2'], contact: ['c1'] }), kind: 'page' });
  const b = await pickSections({ sections, pool: pool({ intro: ['i1', 'i2'], contact: ['c1'] }), kind: 'page' });
  assert.deepEqual(a.pool.map((p) => p.template), b.pool.map((p) => p.template));
  assert.ok(!a.pool.some((p) => p.id === 'ratings'));
  assert.deepEqual(a.skipped, ['من نحن', 'قوانين وخصوصية']); // the ratings are not missing: the browser draws them
});

test('the slides the admin allowed for a section are the only ones it takes; when none of them works the whole category is used', async () => {
  const sections = [{ id: 'about', category: 'about', mode: 'always' as const, slides: ['g2'] }];
  assert.equal((await pickSections({ sections, pool: pool({ about: ['g1', 'g2', 'g3'] }), kind: 'page' })).pool[0].template, 'g:g2');
  assert.equal((await pickSections({ sections: [{ ...sections[0], slides: ['gone'] }], pool: pool({ about: ['g1'] }), kind: 'page' })).pool[0].template, 'g:g1');
  // A slide that cannot be read is passed over.
  assert.equal((await pickSections({ sections: [{ id: 'about', category: 'about', mode: 'always' }], pool: pool({ about: ['bad1', 'g4'] }), kind: 'page' })).pool[0].template, 'g:g4');
});

test('the gallery section takes only a slide that holds all the owner\'s photos: the photo-gallery block holds 15', async () => {
  const frames = (n: number) => ({ name: 'x', slide: {}, elements: [...Array.from({ length: n }, (_, i) => ({ id: `p${i}`, type: 'image', aiSlot: `photos.${i}` })), { id: 't', type: 'heading', aiSlot: 'title' }] });
  const block = { name: 'y', slide: {}, elements: [{ id: 'g', type: 'gallery', aiSlot: 'gallery' }, { id: 't', type: 'heading', aiSlot: 'title' }] };
  assert.equal(photoCapacity(frames(3) as any), 3);
  assert.equal(photoCapacity(block as any), 15);
  const p: SlidePool = { ids: () => [{ id: 'three' }, { id: 'block' }], load: async (id) => (id === 'three' ? frames(3) : block) as any };
  const sections = free.filter((s) => s.category === 'gallery');
  assert.equal((await pickSections({ sections, pool: p, kind: 'page', photos: 12 })).pool[0].template, 'g:block');
  assert.equal((await pickSections({ sections, pool: p, kind: 'page', photos: 3 })).pool[0].template, 'g:three');
});

test('the pool reads the admin\'s ready slides, and the editor\'s own for search, featured and the live lists', async () => {
  const db = getFirestore() as any;
  for (const k of [...store.keys()]) if (/^(gallerySlides|readySlides|readyConfig)\//.test(k)) store.delete(k);
  const doc = (o: any) => ({ category: 'intro', order: 1, slide: {}, name: 'x', ...o });
  store.set('readySlides/ok', doc({ name: 'جيد', eligible: true, elements: [{ id: 'a', type: 'heading', aiSlot: 'title' }] }));
  store.set('readySlides/unmarked', doc({ eligible: false, elements: [{ id: 'a', type: 'heading' }] }));
  store.set('readySlides/old', { category: 'intro', order: 3, galleryId: 'g' });
  store.set('readySlides/shop', doc({ category: 'shop', eligible: true, elements: [] }));
  const p = await slidePool(db);
  assert.deepEqual(p.ids('intro').map((x) => x.id), ['ok']);
  assert.equal((await p.load('ok'))?.name, 'جيد');
  assert.equal(await p.load('unmarked'), null);
  assert.equal(await p.load('old'), null);
  assert.equal(await p.load('missing'), null);
  // A live category lists the editor's own slides (never a design added to it), each a slide the builder can load.
  const search = p.ids('search');
  assert.ok(search.length >= 5 && search.every((x) => x.id.startsWith('code:search:')));
  assert.ok(!p.ids('shop').some((x) => x.id === 'shop'));
  assert.equal((await p.load(search[0].id))?.elements[0].type, 'shopSearch');
});

test('a rental of cars and a rental of things each take the search and featured slides made for them, never another kind\'s', async () => {
  const db = getFirestore() as any;
  const p = await slidePool(db);
  const sections = [{ id: 'search', category: 'search', mode: 'always' as const }, { id: 'featured', category: 'featured', mode: 'always' as const }];
  const name = async (kind: any) => Promise.all((await pickSections({ sections, pool: p, kind })).pool.map(async (x) => (await p.load(x.template))!.name));
  assert.deepEqual(await name('rental-cars'), ['بحث السيارات', 'شريحة التأجير (سيارات) المميزة · شريط متحرك']);
  assert.deepEqual(await name('rental-items'), ['بحث التأجير', 'شريحة التأجير (أغراض) المميزة · شريط متحرك']);
  assert.deepEqual(await name('hotel'), ['بحث الفنادق والمساحات', 'شريحة الفندق المميزة · بطاقات']);
  // A free page has no search or featured slide: those sections are not built and are named.
  assert.deepEqual((await pickSections({ sections, pool: p, kind: 'page' })).skipped, ['شرائح البحث', 'عروض مميزة']);
});

test('a store\'s front takes a front slide and its live section a slide with the live list', async () => {
  const p = await slidePool(getFirestore() as any);
  const model = DEFAULT_MODELS.find((m) => m.id === 'restaurant')!.sections.filter((s) => s.category === 'restaurant');
  const r = await pickSections({ sections: model, pool: p, kind: 'restaurant' });
  assert.deepEqual(r.pool.map((x) => x.id), ['restaurant:front', 'restaurant:main']);
  assert.ok(!r.extra[r.pool[0].template].elements.some((e) => e.type === 'menuList'));
  assert.ok(r.extra[r.pool[1].template].elements.some((e) => e.type === 'menuList'));
});

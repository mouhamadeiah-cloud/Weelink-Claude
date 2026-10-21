import { test } from 'node:test';
import assert from 'node:assert/strict';
import { galleryPool, pickSections, planSectionId, sectionsFor, type CodeSection, type GalleryPool } from '../server/pagePicker.ts';
import { DEFAULT_MODELS } from '../src/data/pageModels.ts';
import { getFirestore, store } from './fakeAdmin.ts';

const code: CodeSection[] = [
  { id: 'intro', name: 'مدخل', required: true, place: 'first', templates: ['hero.cover', 'hero.split'] },
  { id: 'about', name: 'من نحن', required: false, place: 'any', templates: ['about.story'] },
  { id: 'contact', name: 'تواصل', required: true, place: 'last', templates: ['contact.card'] },
  { id: 'privacy', name: 'الشروط', required: true, place: 'last', templates: ['legal.columns'] },
];
const slide = (texts = ['title', 'sub']) => ({ slide: { id: 's', height: 500 }, name: 'تصميم', elements: texts.map((t, i) => ({ id: `e${i}`, type: 'heading', aiSlot: t, content: 'نص' })) });
const pool = (o: Partial<GalleryPool> & { byCat?: Record<string, string[]>; on?: string[] } = {}): GalleryPool => ({
  ids: (c) => o.byCat?.[c] || [], useGallery: (c) => !!o.on?.includes(c), load: async (id) => (id.startsWith('bad') ? null : slide()), ...o,
});
const free = DEFAULT_MODELS[0].sections;
const seq = (...n: number[]) => { let i = 0; return () => n[i++ % n.length]; };

test('the owner gets the always sections, the ones whose need is met, and the ticked or default-on asked ones', () => {
  const ids = (o: any) => sectionsFor(free, o).map((s) => s.id);
  assert.deepEqual(ids({ services: false, priced: false, photos: false }), ['intro', 'about', 'contact', 'privacy']); // privacy is ticked from the start
  assert.deepEqual(ids({ services: true, priced: true, photos: true }), ['intro', 'about', 'services', 'prices', 'gallery', 'contact', 'privacy']);
  assert.deepEqual(ids({ services: false, priced: false, photos: false, ticked: ['ratings'] }), ['intro', 'about', 'ratings', 'contact']); // he unticked the legal slide
});

test('section ids the plan and the builder know', () => {
  const rest = DEFAULT_MODELS.find((m) => m.id === 'restaurant')!.sections;
  assert.deepEqual(rest.map(planSectionId).slice(0, 4), ['intro', 'featured', 'about', 'gallery']);
  assert.equal(planSectionId({ id: 'features', category: 'features', mode: 'ask' }), 'why');
});

test('each section takes one template of the code, in the model order, and the first stays first and the legal one last', async () => {
  const r = await pickSections({ sections: sectionsFor(free, { services: false, priced: false, photos: false }), codeSections: code, gallery: pool(), rng: seq(0.1) });
  assert.deepEqual(r.pool.map((p) => p.id), ['intro', 'about', 'contact', 'privacy']);
  assert.ok(r.pool.every((p) => p.templates.length === 1));
  assert.deepEqual(r.pool.map((p) => p.place), ['first', 'any', 'last', 'last']);
  assert.deepEqual(r.extra, {});
});

test('a gallery slide marked for the AI can be picked, with its spec and its payload', async () => {
  const r = await pickSections({ sections: sectionsFor(free, { services: false, priced: false, photos: false }), codeSections: code, gallery: pool({ byCat: { intro: ['g1'] }, on: ['intro'] }), rng: seq(0.5) });
  assert.deepEqual(r.pool[0].templates, ['g:g1']);
  assert.deepEqual(Object.keys(r.templates), ['g:g1']);
  assert.deepEqual(Object.keys(r.templates['g:g1'].slots), ['title', 'sub']);
  assert.equal(r.extra['g:g1'].elements.length, 2);
});

test('a category switched to the gallery leaves the code alone while a gallery slide works, and falls back when none does', async () => {
  const sections = sectionsFor(free, { services: false, priced: false, photos: false });
  for (let k = 0; k < 8; k++) {
    const r = await pickSections({ sections, codeSections: code, gallery: pool({ byCat: { intro: ['g1', 'g2'] }, on: ['intro'] }), rng: seq(k / 8, 0.3, 0.9) });
    assert.ok(r.pool[0].templates[0].startsWith('g:'));
  }
  const back = await pickSections({ sections, codeSections: code, gallery: pool({ byCat: { intro: ['bad1'] }, on: ['intro'] }) });
  assert.ok(['hero.cover', 'hero.split'].includes(back.pool[0].templates[0]));
});

test('without the switch the code and the gallery slides are drawn from together', async () => {
  const sections = sectionsFor(free, { services: false, priced: false, photos: false });
  const seen = new Set<string>();
  let x = 7;
  const lcg = () => (x = (x * 48271) % 2147483647) / 2147483647;
  for (let k = 0; k < 60; k++) seen.add((await pickSections({ sections, codeSections: code, gallery: pool({ byCat: { intro: ['g1'] } }), rng: lcg })).pool[0].templates[0]);
  assert.ok(seen.has('g:g1') && seen.has('hero.cover') && seen.has('hero.split'));
});

test('the slide of the owner\'s last build is left for last, and a section nothing can fill is skipped', async () => {
  const sections = sectionsFor(free, { services: false, priced: false, photos: false, ticked: ['ratings'] });
  const r = await pickSections({ sections, codeSections: code, gallery: pool(), rng: seq(0.9, 0.1), avoid: new Set(['hero.cover']) });
  assert.equal(r.pool[0].templates[0], 'hero.split');
  assert.ok(!r.pool.some((p) => p.id === 'ratings')); // no slide for it yet
});

test('the pool over the database reads the ready slides and the switches, and refuses a slide that is not usable', async () => {
  const db = getFirestore() as any;
  for (const k of [...store.keys()]) if (/^(gallerySlides|readySlides|readyConfig)\//.test(k)) store.delete(k);
  store.set('gallerySlides/ok', { kind: 'slide', status: 'approved', name: 'جيد', slide: {}, elements: [{ id: 'a', type: 'heading', aiSlot: 'title' }] });
  store.set('gallerySlides/unmarked', { kind: 'slide', status: 'approved', name: 'x', slide: {}, elements: [{ id: 'a', type: 'heading' }] });
  store.set('gallerySlides/pending', { kind: 'slide', status: 'pending', name: 'x', slide: {}, elements: [{ id: 'a', type: 'heading', aiSlot: 'title' }] });
  for (const id of ['ok', 'unmarked', 'pending']) store.set(`readySlides/${id}`, { category: 'intro', order: 1 });
  store.set('readyConfig/intro', { useGallery: true });
  const p = await galleryPool(db);
  assert.deepEqual(p.ids('intro').sort(), ['ok', 'pending', 'unmarked']);
  assert.equal(p.useGallery('intro'), true);
  assert.equal(p.useGallery('about'), false);
  assert.equal((await p.load('ok'))?.name, 'جيد');
  assert.equal(await p.load('unmarked'), null);
  assert.equal(await p.load('pending'), null);
  assert.equal(await p.load('missing'), null);
});

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
  const r = await pickSections({ sections: sectionsFor(free, { services: false, priced: false, photos: false }), codeSections: code, gallery: pool() });
  assert.deepEqual(r.pool.map((p) => p.id), ['intro', 'about', 'contact', 'privacy']);
  assert.ok(r.pool.every((p) => p.templates.length === 1));
  assert.deepEqual(r.pool.map((p) => p.place), ['first', 'any', 'last', 'last']);
  assert.deepEqual(r.extra, {});
});

test('a gallery slide marked for the AI can be picked, with its spec and its payload', async () => {
  const r = await pickSections({ sections: sectionsFor(free, { services: false, priced: false, photos: false }), codeSections: code, gallery: pool({ byCat: { intro: ['g1'] }, on: ['intro'] }) });
  assert.deepEqual(r.pool[0].templates, ['g:g1']);
  assert.deepEqual(Object.keys(r.templates), ['g:g1']);
  assert.deepEqual(Object.keys(r.templates['g:g1'].slots), ['title', 'sub']);
  assert.equal(r.extra['g:g1'].elements.length, 2);
});

test('a category switched to the gallery leaves the code alone while a gallery slide works, and falls back when none does', async () => {
  const sections = sectionsFor(free, { services: false, priced: false, photos: false });
  const r = await pickSections({ sections, codeSections: code, gallery: pool({ byCat: { intro: ['g1', 'g2'] }, on: ['intro'] }) });
  assert.equal(r.pool[0].templates[0], 'g:g1', 'the first in the admin\'s order');
  const back = await pickSections({ sections, codeSections: code, gallery: pool({ byCat: { intro: ['bad1'] }, on: ['intro'] }) });
  assert.ok(['hero.cover', 'hero.split'].includes(back.pool[0].templates[0]));
});

test('the same answers build the same slides every time, and a section nothing can fill is skipped', async () => {
  const sections = sectionsFor(free, { services: false, priced: false, photos: false, ticked: ['ratings'] });
  const a = await pickSections({ sections, codeSections: code, gallery: pool() });
  const b = await pickSections({ sections, codeSections: code, gallery: pool() });
  assert.equal(a.pool[0].templates[0], 'hero.cover');
  assert.deepEqual(a.pool.map((p) => p.templates[0]), b.pool.map((p) => p.templates[0]));
  assert.ok(!a.pool.some((p) => p.id === 'ratings')); // no slide for it yet
  assert.deepEqual(a.skipped, ['ratings']);
});

test('the pool over the database reads the admin\'s ready slides and refuses a slide that is not usable', async () => {
  const db = getFirestore() as any;
  for (const k of [...store.keys()]) if (/^(gallerySlides|readySlides|readyConfig)\//.test(k)) store.delete(k);
  const doc = (o: any) => ({ category: 'intro', order: 1, slide: {}, name: 'x', ...o });
  store.set('readySlides/ok', doc({ name: 'جيد', eligible: true, elements: [{ id: 'a', type: 'heading', aiSlot: 'title' }] }));
  store.set('readySlides/unmarked', doc({ eligible: false, elements: [{ id: 'a', type: 'heading' }] }));
  store.set('readySlides/old', { category: 'intro', order: 3, galleryId: 'g' });
  store.set('readySlides/shop', doc({ category: 'shop', eligible: true, elements: [] }));
  const p = await galleryPool(db);
  assert.deepEqual(p.ids('intro'), ['ok']);
  assert.equal(p.useGallery('intro'), true);
  assert.equal(p.useGallery('about'), false);
  assert.deepEqual(p.ids('shop'), []); // fixed categories stay in the code
  assert.equal((await p.load('ok'))?.name, 'جيد');
  assert.equal(await p.load('unmarked'), null);
  assert.equal(await p.load('old'), null);
  assert.equal(await p.load('missing'), null);
});

import catalog from '../src/data/ai/buildCatalog.json' with { type: 'json' };
import { photoCapacity } from '../server/pagePicker.ts';

test('the gallery section takes only a slide that holds all the owner\'s photos: the photo-gallery block holds 15', async () => {
  const codeSections = (catalog.sections as any).free as CodeSection[];
  const specs = catalog.templates as any;
  assert.deepEqual(['gallery.block1', 'gallery.block5', 'gallery.block8'].map((t) => photoCapacity(t, specs[t])), [15, 15, 15]);
  const sections = DEFAULT_MODELS[0].sections.filter((s) => s.category === 'gallery');
  const gallery: GalleryPool = { ids: () => [], useGallery: () => false, load: async () => null };
  for (let k = 0; k < 20; k++) {
    const many = await pickSections({ sections, codeSections, specs, photos: 12, gallery });
    assert.match(many.pool[0].templates[0], /^gallery\.block[1-8]$/);
    const few = await pickSections({ sections, codeSections, specs, photos: 3, gallery });
    assert.match(few.pool[0].templates[0], /^gallery\.block[1-8]$/);
  }
  // A gallery slide of the gallery with only three photo frames cannot hold 12.
  const three: GalleryPool = { ids: () => ['g3'], useGallery: () => true, load: async () => ({ name: 'x', slide: {}, elements: [0, 1, 2].map((i) => ({ id: `p${i}`, type: 'image', aiSlot: `photos.${i}` })).concat([{ id: 't', type: 'heading', aiSlot: 'title' } as any]) }) };
  const r = await pickSections({ sections, codeSections, specs, photos: 12, gallery: three });
  assert.match(r.pool[0].templates[0], /^gallery\.block[1-8]$/);
});

test('the fixed categories (shop, showroom, menu) never take gallery slides, even ones that were added to them', async () => {
  const db = getFirestore() as any;
  for (const k of [...store.keys()]) if (/^(gallerySlides|readySlides|readyConfig)\//.test(k)) store.delete(k);
  store.set('readySlides/x', { category: 'shop', order: 1, slide: {}, elements: [], eligible: true });
  store.set('readySlides/y', { category: 'intro', order: 1, slide: {}, elements: [], eligible: true });
  const p = await galleryPool(db);
  assert.deepEqual(p.ids('shop'), []);
  assert.equal(p.useGallery('shop'), false);
  assert.deepEqual(p.ids('intro'), ['y']);
});

import { WEE_SLIDES } from '../src/data/weeSlideTemplates.ts';
import { slideTemplateCount } from '../src/data/slideTemplates.ts';

test('the gallery category holds exactly eight slides, each beside an explanation, in all four layouts', () => {
  const made = WEE_SLIDES.gallery.map((m) => m() as any);
  assert.equal(made.length, 8);
  assert.equal(slideTemplateCount('gallery'), 8); // the editor's panel lists only these
  assert.deepEqual(made.map((s) => s.aiTemplate), ['gallery.block1', 'gallery.block2', 'gallery.block3', 'gallery.block4', 'gallery.block5', 'gallery.block6', 'gallery.block7', 'gallery.block8']);
  for (const s of made) {
    const block = s.elements.find((e: any) => e.type === 'gallery');
    assert.ok(block, `${s.aiTemplate} has the photo-gallery block`);
    assert.equal(block.aiSlot, 'gallery');
    assert.ok(s.elements.some((e: any) => e.aiSlot === 'title') && s.elements.some((e: any) => e.aiSlot === 'sub'), `${s.aiTemplate} has its explanation`);
    assert.ok(s.elements.every((e: any) => e.mobile), `${s.aiTemplate} has its phone layout`);
  }
  const layouts = new Set(made.map((s) => s.elements.find((e: any) => e.type === 'gallery').galleryConfig.layout));
  assert.equal(layouts.size, 4); // all four layouts of the block are used
});

test('the slides the admin allowed for a section are the only ones it takes; when none of them works the whole category is used', async () => {
  const sections = [{ id: 'about', category: 'about', mode: 'always' as const, slides: ['g2'] }];
  const gallery = pool({ byCat: { about: ['g1', 'g2', 'g3'] }, on: ['about'] });
  {
    const out = await pickSections({ sections, codeSections: code, gallery });
    assert.deepEqual(out.pool[0].templates, ['g:g2']);
  }
  const gone = await pickSections({ sections: [{ ...sections[0], slides: ['gone'] }], codeSections: code, gallery: pool({ byCat: { about: ['g1'] }, on: ['about'] }) });
  assert.deepEqual(gone.pool[0].templates, ['g:g1']);
});

test('a section that finds no slide is named in skipped, and a restaurant\'s live section builds from the restaurant\'s own sections', async () => {
  const restaurant: CodeSection[] = [
    { id: 'intro', name: 'مدخل', required: true, place: 'first', templates: ['hero.split'] },
    { id: 'featured', name: 'المنيو', required: true, place: 'any', templates: ['rest.menuBig'] },
  ];
  const model = DEFAULT_MODELS.find((m) => m.id === 'restaurant')!.sections.filter((s) => s.category === 'restaurant');
  const own = await pickSections({ sections: model, codeSections: restaurant, gallery: pool() });
  assert.deepEqual(own.pool.map((p) => p.id), ['intro', 'featured']);
  assert.deepEqual(own.skipped, []);
  const generic = await pickSections({ sections: model, codeSections: code, gallery: pool() });
  assert.deepEqual(generic.pool.map((p) => p.id), ['intro']);
  assert.deepEqual(generic.skipped, ['featured']);
});

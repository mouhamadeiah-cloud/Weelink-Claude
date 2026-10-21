import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { addReady, adoptSeeded, dropReadyFor, moveReady, readyMap, readyOverview, removeReady, setUseGallery } from '../server/readySlides.ts';
import { FIXED_READY_CATEGORIES, GALLERY_READY_CATEGORIES, READY_SLIDE_CATEGORIES } from '../src/data/readyCategories.ts';
import { getFirestore, store } from './fakeAdmin.ts';

const db = getFirestore() as any;
const gallery = (id: string, extra: any = {}) => store.set(`gallerySlides/${id}`, { kind: 'slide', name: `شريحة ${id}`, category: 'hero', status: 'approved', ...extra });
const reset = () => { for (const k of [...store.keys()]) if (k.startsWith('gallerySlides/') || k.startsWith('readySlides/')) store.delete(k); };

test('the shop, showroom, menu, booking and contact categories stay in the code; the others take gallery slides', () => {
  assert.deepEqual(FIXED_READY_CATEGORIES.sort(), ['booking', 'cars', 'contact', 'restaurant', 'shop']);
  assert.ok(GALLERY_READY_CATEGORIES.length === READY_SLIDE_CATEGORIES.length - 5);
  for (const c of GALLERY_READY_CATEGORIES) assert.ok(!FIXED_READY_CATEGORIES.includes(c.id));
  assert.ok(GALLERY_READY_CATEGORIES.some((c) => c.id === 'intro') && GALLERY_READY_CATEGORIES.some((c) => c.id === 'special_offer'));
});

test('an approved slide is added to a ready category, at the end of it', async () => {
  reset();
  gallery('a'); gallery('b'); gallery('c');
  assert.deepEqual(await addReady(db, 'a', 'intro', 'admin:eyad'), { ok: true, category: 'intro', order: 1 });
  assert.deepEqual(await addReady(db, 'b', 'intro', 'admin:eyad'), { ok: true, category: 'intro', order: 2 });
  assert.deepEqual(await addReady(db, 'c', 'about', 'admin:eyad'), { ok: true, category: 'about', order: 1 });
  assert.deepEqual(await readyMap(db), { a: 'intro', b: 'intro', c: 'about' });
  assert.equal(store.get('readySlides/a').addedBy, 'admin:eyad');
  assert.equal(store.get('readySlides/a').galleryId, 'a');
});

test('adding the same slide again keeps its place in its category and moves it to another category when asked', async () => {
  reset();
  gallery('a'); gallery('b');
  await addReady(db, 'a', 'intro', 'x'); await addReady(db, 'b', 'intro', 'x');
  assert.equal(((await addReady(db, 'a', 'intro', 'x')) as any).order, 1);
  assert.deepEqual(await addReady(db, 'a', 'team', 'x'), { ok: true, category: 'team', order: 1 });
  assert.deepEqual(await readyMap(db), { a: 'team', b: 'intro' });
});

test('refused: a slide not in the gallery, a pending or rejected one, a page, a fixed or unknown category', async () => {
  reset();
  gallery('p', { status: 'pending' }); gallery('r', { status: 'rejected' }); gallery('pg', { kind: 'page', category: 'p-business' }); gallery('ok');
  assert.deepEqual(await addReady(db, 'nope', 'intro', 'x'), { error: 'not_found' });
  assert.deepEqual(await addReady(db, 'p', 'intro', 'x'), { error: 'not_approved' });
  assert.deepEqual(await addReady(db, 'r', 'intro', 'x'), { error: 'not_approved' });
  assert.deepEqual(await addReady(db, 'pg', 'intro', 'x'), { error: 'not_a_slide' });
  assert.deepEqual(await addReady(db, 'ok', 'shop', 'x'), { error: 'bad_category' });
  assert.deepEqual(await addReady(db, 'ok', 'contact', 'x'), { error: 'bad_category' });
  assert.deepEqual(await addReady(db, 'ok', 'made-up', 'x'), { error: 'bad_category' });
  assert.deepEqual(await readyMap(db), {});
});

test('a slide leaves the ready slides when removed, withdrawn or deleted', async () => {
  reset();
  gallery('a'); gallery('b');
  await addReady(db, 'a', 'intro', 'x'); await addReady(db, 'b', 'intro', 'x');
  assert.deepEqual(await removeReady(db, 'a'), { ok: true });
  assert.deepEqual(await removeReady(db, 'a'), { error: 'not_found' });
  await dropReadyFor(db, 'b');
  await dropReadyFor(db, 'b'); // nothing left: no error
  assert.deepEqual(await readyMap(db), {});
});

test('everyone reads readySlides, nobody writes it from the browser, and the admin actions are content-only', () => {
  const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  assert.match(rules, /match \/readySlides\/\{id\} \{\s*allow read: if true;\s*allow write: if false;/);
  const admin = readFileSync(new URL('../api/admin.ts', import.meta.url), 'utf8');
  assert.match(admin, /CONTENT_ONLY = \[[^\]]*'ready-add', 'ready-remove'/);
  assert.match(admin, /if \(decision === 'reject'\) await dropReadyFor\(db, id\)/);
});

test('up and down move a slide one place inside its category and the places stay 1..n', async () => {
  reset();
  for (const id of ['a', 'b', 'c']) { gallery(id); await addReady(db, id, 'intro', 'x'); }
  assert.deepEqual(await moveReady(db, 'c', 'up'), { ok: true, order: 2 });
  assert.deepEqual((await readyOverview(db)).find((c) => c.id === 'intro')!.items.map((i) => i.id), ['a', 'c', 'b']);
  assert.deepEqual(await moveReady(db, 'a', 'up'), { ok: true, order: 1 }); // already first: stays
  assert.deepEqual(await moveReady(db, 'b', 'down'), { ok: true, order: 3 });
  assert.deepEqual(await moveReady(db, 'zzz', 'up'), { error: 'not_found' });
});

test('the copied official slides that were approved take their original category and place, once', async () => {
  reset();
  const seeded = (id: string, category: string, index: number, extra: any = {}) => gallery(id, { designerUid: 'weelink-ai', official: true, seededFrom: { category, index }, ...extra });
  seeded('s2', 'intro', 1); seeded('s1', 'intro', 0); seeded('p', 'about', 0, { status: 'pending' }); seeded('f', 'shop', 0);
  gallery('mine'); await addReady(db, 'mine', 'intro', 'x'); // already placed: stays first
  assert.deepEqual(await adoptSeeded(db, 'admin:eyad'), { adopted: 2, categories: 1 });
  const intro = (await readyOverview(db)).find((c) => c.id === 'intro')!.items.map((i) => i.id);
  assert.deepEqual(intro, ['mine', 's1', 's2']);
  assert.deepEqual(await adoptSeeded(db, 'admin:eyad'), { adopted: 0, categories: 0 });
});

test('the switch to gallery slides needs an approved slide in the category', async () => {
  reset(); store.delete('readyConfig/intro');
  assert.deepEqual(await setUseGallery(db, 'intro', true, 'x'), { error: 'empty' });
  assert.deepEqual(await setUseGallery(db, 'shop', true, 'x'), { error: 'bad_category' });
  gallery('a'); await addReady(db, 'a', 'intro', 'x');
  assert.deepEqual(await setUseGallery(db, 'intro', true, 'x'), { ok: true, useGallery: true });
  assert.equal((await readyOverview(db)).find((c) => c.id === 'intro')!.useGallery, true);
  assert.deepEqual(await setUseGallery(db, 'intro', false, 'x'), { ok: true, useGallery: false });
  assert.equal((await readyOverview(db)).find((c) => c.id === 'intro')!.useGallery, false);
});

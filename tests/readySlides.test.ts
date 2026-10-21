import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { addReady, dropReadyFor, readyMap, removeReady } from '../server/readySlides.ts';
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

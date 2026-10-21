import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import readyFile from '../src/data/galleryReady/ready.json' with { type: 'json' };
import { GALLERY_READY_CATEGORIES } from '../src/data/readyCategories.ts';
import { slideTemplateCount } from '../src/data/slideTemplates.ts';
import { SLIDE_CATEGORIES } from '../src/data/slideCategories.ts';
import { readyCopy, readyCopyStatus, readyDocId } from '../server/readyCopy.ts';
import { getFirestore, store } from './fakeAdmin.ts';

const db = getFirestore() as any;
const ITEMS = readyFile as any[];
const reset = () => { for (const k of [...store.keys()]) if (k.startsWith('gallerySlides/')) store.delete(k); };

test('the copy file holds every ready slide of the code (but the fixed categories), as gallery slides', () => {
  const expected = GALLERY_READY_CATEGORIES.reduce((n, c) => n + slideTemplateCount(c.id), 0);
  assert.equal(ITEMS.length, expected, 'run `npm run ready-to-gallery` after changing the ready slides');
  assert.equal(new Set(ITEMS.map((i) => i.key)).size, ITEMS.length);
  const categories = new Set(SLIDE_CATEGORIES.map((c) => c.id));
  for (const i of ITEMS) {
    assert.ok(categories.has(i.category), `${i.key}: ${i.category}`);
    assert.equal(i.slide.id, 's1');
    assert.ok(i.name.length >= 2 && i.name.length <= 60, i.name);
    assert.ok(i.elements.length > 0 && i.elements.length <= 400, i.key);
    for (const e of i.elements) {
      assert.ok(e.id && e.slideId === 's1', i.key);
      assert.notEqual(e.type, 'html', i.key); // raw HTML never goes into the gallery
    }
  }
  for (const fixed of ['shop', 'cars', 'restaurant', 'booking', 'contact', 'gallery']) assert.ok(!ITEMS.some((i) => i.readyCategory === fixed), fixed);
});

test('the copy stages every slide as an official, pending gallery slide that remembers where it came from', async () => {
  reset();
  let from: number | null = 0;
  let written = 0;
  while (from !== null) {
    const r = await readyCopy(db, { publish: false, overwrite: false, from, limit: 40 });
    written += r.written;
    from = r.next;
  }
  assert.equal(written, ITEMS.length);
  const doc = store.get(`gallerySlides/${readyDocId(ITEMS[0].key)}`);
  assert.equal(doc.status, 'pending');
  assert.equal(doc.official, true);
  assert.equal(doc.kind, 'slide');
  assert.deepEqual(doc.seededFrom, { category: ITEMS[0].readyCategory, index: ITEMS[0].index });
  assert.equal(doc.designerName, 'Weelink AI');
  assert.deepEqual(await readyCopyStatus(db), { total: ITEMS.length, copied: ITEMS.length, published: 0 });
});

test('copying again changes nothing; a slide the admin edited is never rebuilt; publishing approves, keeping likes', async () => {
  const id = `gallerySlides/${readyDocId(ITEMS[0].key)}`;
  const again = await readyCopy(db, { publish: false, overwrite: false, from: 0, limit: 30 });
  assert.equal(again.written, 0);
  assert.equal(again.kept, 30);
  store.set(id, { ...store.get(id), editedBy: 'admin:eyad', name: 'عدّلتُه بيدي', likes: 7 });
  await readyCopy(db, { publish: true, overwrite: true, from: 0, limit: 30 });
  assert.equal(store.get(id).name, 'عدّلتُه بيدي'); // untouched
  const second = store.get(`gallerySlides/${readyDocId(ITEMS[1].key)}`);
  assert.equal(second.status, 'approved');
  assert.ok(second.approvedAt > 0);
  assert.equal((await readyCopyStatus(db)).published, 29);
});

test('the admin actions are content-only and the copy runs in short slices', () => {
  const admin = readFileSync(new URL('../api/admin.ts', import.meta.url), 'utf8');
  assert.match(admin, /CONTENT_ONLY = \[[^\]]*'ready-copy-status', 'ready-copy'/);
  assert.match(admin, /from: Number\(body\.from\) \|\| 0, limit: Number\(body\.limit\) \|\| 30/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gallerySeed, gallerySeedStatus, OFFICIAL_UID } from '../server/gallerySeed.ts';
import { getFirestore, store } from './fakeAdmin.ts';

process.env.UNSPLASH_ACCESS_KEY = 'test';
const db = getFirestore() as any;
// The pages are the docs without `derivedFrom`; the others are the slides taken from them.
const pageEntries = () => [...store.entries()].filter(([k, v]) => k.startsWith(`gallerySlides/${OFFICIAL_UID}_`) && !v.derivedFrom);
const slideEntries = () => [...store.entries()].filter(([k, v]) => k.startsWith(`gallerySlides/${OFFICIAL_UID}_`) && v.derivedFrom);
let calls = 0;
let limitAfter = Infinity;
globalThis.fetch = (async (url: string) => {
  calls += 1;
  if (calls > limitAfter) return new Response('limit', { status: 403 });
  const q = new URL(url).searchParams.get('query');
  const results = Array.from({ length: 10 }, (_, i) => ({ id: `${q}-${i}`, urls: { raw: `https://img.test/${encodeURIComponent(q!)}-${i}?x=1` }, user: { name: 'A' }, links: { html: 'https://u.test' } }));
  return new Response(JSON.stringify({ results }), { status: 200 });
}) as typeof fetch;

test('status before: nothing published, searches to do', async () => {
  const s = await gallerySeedStatus(db);
  assert.equal(s.published, 0);
  assert.ok(s.searchesLeft > 0 && s.total > 0 && s.unsplash);
});

test('a rate limit stops the searches and publishes only what is complete', async () => {
  limitAfter = 3;
  const r = (await gallerySeed(db, { budget: 40, overwrite: false })) as any;
  assert.equal(r.limited, true);
  assert.equal(r.spent <= 4, true);
  for (const k of r.published) assert.ok(store.has(`gallerySlides/${OFFICIAL_UID}_${k}`));
});

test('running again finishes: every page published, no photo placeholder left, official and approved', async () => {
  limitAfter = Infinity;
  let r: any;
  for (let i = 0; i < 20; i++) {
    r = await gallerySeed(db, { budget: 40, overwrite: false });
    if (!r.waiting.length) break;
  }
  assert.equal(r.waiting.length, 0);
  const docs = pageEntries().map(([, v]) => v);
  assert.equal(docs.length, r.published.length);
  for (const d of docs) {
    assert.equal(d.official, true);
    assert.equal(d.status, 'pending');
    assert.equal(d.designerName, 'Weelink AI');
    assert.equal(d.kind, 'page');
    assert.ok(!JSON.stringify(d).includes('photo:'), `${d.key} still has a photo placeholder`);
    assert.ok(d.page.slides.length <= 3);
  }
});

test('publish: true approves them', async () => {
  const r = (await gallerySeed(db, { budget: 40, overwrite: true, publish: true })) as any;
  assert.ok(r.published.length > 0);
  const d = store.get(`gallerySlides/${OFFICIAL_UID}_${r.published[0]}`);
  assert.equal(d.status, 'approved');
  assert.ok(d.approvedAt > 0);
});

test('a page the admin edited by hand is never rebuilt', async () => {
  const [path, doc] = pageEntries()[0];
  store.set(path, { ...doc, name: 'معدّل يدوياً', editedBy: 'admin:x' });
  await gallerySeed(db, { budget: 40, overwrite: true });
  assert.equal(store.get(path).name, 'معدّل يدوياً');
});

test('a second run asks Unsplash for nothing and keeps the likes', async () => {
  const [path, doc] = pageEntries()[0];
  store.set(path, { ...doc, likes: 7 });
  const before = calls;
  await gallerySeed(db, { budget: 40, overwrite: true });
  assert.equal(calls, before);
  assert.equal(store.get(path).likes, 7);
});

test('each page also gives its slides as gallery slides: same status, no link to a slide that is not there, a valid category', async () => {
  const { SLIDE_CATEGORY_IDS } = await import('../server/galleryEdit.ts');
  const pages = pageEntries();
  const slides = slideEntries();
  assert.ok(slides.length >= pages.length);
  for (const [, s] of slides) {
    assert.equal(s.kind, 'slide');
    assert.equal(s.official, true);
    assert.ok(SLIDE_CATEGORY_IDS.includes(s.category), `${s.key}: ${s.category}`);
    assert.ok(store.has(`gallerySlides/${s.derivedFrom}`));
    assert.equal(s.status, store.get(`gallerySlides/${s.derivedFrom}`).status);
    for (const e of s.elements) {
      assert.equal(e.slideId, s.slide.id);
      assert.ok(e.linkType !== 'slide' && e.linkType !== 'page', `${s.key}: a link to another slide is left`);
    }
    assert.ok(!JSON.stringify(s).includes('photo:'));
  }
});

test('rebuilding keeps a derived slide the admin edited by hand and the likes of the others', async () => {
  const [path, doc] = slideEntries()[0];
  const [path2, doc2] = slideEntries()[1];
  store.set(path, { ...doc, name: 'شريحة معدّلة', editedBy: 'admin:x' });
  store.set(path2, { ...doc2, likes: 5 });
  await gallerySeed(db, { budget: 40, overwrite: true });
  assert.equal(store.get(path).name, 'شريحة معدّلة');
  assert.equal(store.get(path2).likes, 5);
});

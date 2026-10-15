import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gallerySeed, gallerySeedStatus, OFFICIAL_UID } from '../server/gallerySeed.ts';
import { getFirestore, store } from './fakeAdmin.ts';

process.env.UNSPLASH_ACCESS_KEY = 'test';
const db = getFirestore() as any;
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
  const docs = [...store.entries()].filter(([k]) => k.startsWith(`gallerySlides/${OFFICIAL_UID}_`)).map(([, v]) => v);
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
  const [path, doc] = [...store.entries()].find(([k]) => k.startsWith(`gallerySlides/${OFFICIAL_UID}_`))!;
  store.set(path, { ...doc, name: 'معدّل يدوياً', editedBy: 'admin:x' });
  await gallerySeed(db, { budget: 40, overwrite: true });
  assert.equal(store.get(path).name, 'معدّل يدوياً');
});

test('a second run asks Unsplash for nothing and keeps the likes', async () => {
  const [path, doc] = [...store.entries()].find(([k]) => k.startsWith(`gallerySlides/${OFFICIAL_UID}_`))!;
  store.set(path, { ...doc, likes: 7 });
  const before = calls;
  await gallerySeed(db, { budget: 40, overwrite: true });
  assert.equal(calls, before);
  assert.equal(store.get(path).likes, 7);
});

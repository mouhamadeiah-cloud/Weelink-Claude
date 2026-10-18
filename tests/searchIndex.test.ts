import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import handler from '../worker/index-site.ts';
import { store, tokens } from './fakeAdmin.ts';
import { indexSite, itemsOf, removeSite, setSearchDb, type IndexedPage, type SearchDb } from '../server/searchIndex.ts';
import { normalizeSearchText } from '../server/searchText.ts';

process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ private_key: 'x' });
process.env.CRON_SECRET = 'cron';
tokens['owner'] = { uid: 'u1', firebase: { sign_in_provider: 'password' } };
tokens['other'] = { uid: 'u2', firebase: { sign_in_provider: 'password' } };
tokens['member'] = { uid: 'm1', firebase: { sign_in_provider: 'password' } };
tokens['guest'] = { uid: 'g1', firebase: { sign_in_provider: 'anonymous' } };

// D1's interface over node:sqlite (which has FTS5).
const memoryDb = (): SearchDb & { raw: DatabaseSync } => {
  const raw = new DatabaseSync(':memory:');
  return {
    raw,
    exec: async (sql) => raw.exec(sql),
    prepare: (sql) => ({
      bind: (...values: unknown[]) => {
        const stmt = { sql, values };
        return Object.assign(stmt, {
          run: async () => raw.prepare(sql).run(...(values as any[])),
          all: async () => ({ results: raw.prepare(sql).all(...(values as any[])) as any[] }),
        });
      },
    }),
    batch: async (statements: any[]) => {
      raw.exec('BEGIN');
      try {
        for (const s of statements) raw.prepare(s.sql).run(...s.values);
        raw.exec('COMMIT');
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      }
    },
  };
};

const page = (over: Partial<IndexedPage> = {}): IndexedPage => ({
  siteId: 'u1__page', name: 'alnour', owner: 'u1', project: 'page', kind: 'page', title: 'مكتب النور للمحاماة', description: 'استشارات قانونية',
  keywords: ['محامي'], place: { governorate: 'الرقة', city: 'الرقة', lat: 35.9, lng: 39 }, publishedAt: '2026-10-18', visits30: 4, ...over,
});

test('arabic text is normalized the same way for the index and the query', () => {
  assert.equal(normalizeSearchText('مَطْعَم  أبو سامي، الإدلبية'), 'مطعم ابو سامي الادلبيه');
});

test('a published page and its items are found by their words, and replaced on the next index', async () => {
  const d = memoryDb();
  const items = itemsOf('page', { services: [{ id: 's1', name: 'استشارة قانونية', price: '20$', publicNo: 10001 }, { id: 's2', name: 'مخفية', published: false }] });
  assert.equal(items.length, 1);
  await indexSite(d, page(), items);
  const found = async (q: string) => (await d.prepare('SELECT site_id FROM pages_fts WHERE pages_fts MATCH ?').bind(normalizeSearchText(q)).all()).results;
  assert.equal((await found('محامي الرقه')).length, 1);
  assert.equal((await found('مطعم')).length, 0);
  const itemHits = (await d.prepare('SELECT item_id FROM items_fts WHERE items_fts MATCH ?').bind('استشاره').all()).results;
  assert.equal(itemHits.length, 1);
  await indexSite(d, page({ title: 'مكتب جديد' }), []);
  assert.equal((await d.prepare('SELECT COUNT(*) AS n FROM pages').bind().all()).results[0].n, 1);
  assert.equal((await d.prepare('SELECT COUNT(*) AS n FROM items').bind().all()).results[0].n, 0);
  await removeSite(d, 'u1__page');
  assert.equal((await d.prepare('SELECT COUNT(*) AS n FROM pages_fts').bind().all()).results[0].n, 0);
});

test('items of a shop, a showroom and a restaurant carry their search words', () => {
  const shop = itemsOf('shop', { catalogs: [{ id: 'c1', name: 'هواتف أندرويد' }], products: [{ id: 'p', name: 'جوال', price: 5, publicNo: 10002, catalogIds: ['c1'], published: true }, { id: 'q', name: 'x', published: false }] });
  assert.deepEqual(shop.map((i) => [i.kind, i.category]), [['product', 'هواتف أندرويد']]);
  const cars = itemsOf('cars', { cars: [{ id: 'c', brand: 'كيا', model: 'سبورتاج', year: 2019, price: 9000, publicNo: 10003, published: true, status: 'available' }, { id: 's', brand: 'x', status: 'sold' }] });
  assert.equal(cars.length, 1);
  assert.equal(cars[0].name, 'كيا سبورتاج 2019');
  const dishes = itemsOf('restaurant', { dishes: [{ id: 'd', name: 'سوشي سلمون', cuisine: 'سوشي / رامن / صيني', price: 3, publicNo: 10004 }] });
  assert.equal(dishes[0].category, 'سوشي / رامن / صيني');
});

const call = (token: string | null, body: unknown, method = 'POST') =>
  handler.fetch(new Request('https://x.test/api/index-site', { method, headers: { 'Content-Type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) }));

test('the owner indexes a published site; others, guests and a missing binding are refused', async () => {
  setSearchDb(null);
  assert.equal((await call('owner', { owner: 'u1', project: 'page' })).status, 503);
  const d = memoryDb();
  setSearchDb(d);
  store.set('publishedSites/u1__page', { name: 'alnour', owner: 'u1', project: 'page', seo: { title: 'النور', description: '', keywords: ['محامي'] }, place: { governorate: 'الرقة', city: 'الرقة' }, publishedAt: 'x', data: { services: [{ id: 's1', name: 'استشارة', publicNo: 10001 }] } });
  assert.equal((await call(null, { owner: 'u1', project: 'page' })).status, 401);
  assert.equal((await call('guest', { owner: 'u1', project: 'page' })).status, 401);
  assert.equal((await call('other', { owner: 'u1', project: 'page' })).status, 403);
  assert.equal((await call('owner', { owner: 'u1', project: '../x' })).status, 400);
  const ok = await call('owner', { owner: 'u1', project: 'page' });
  assert.deepEqual(await ok.json(), { indexed: true, items: 1 });
  assert.equal((await d.prepare('SELECT gov FROM pages').bind().all()).results[0].gov, 'الرقة');
  store.set('accounts/u1/members/m1', { perms: {} });
  assert.equal((await call('member', { owner: 'u1', project: 'page' })).status, 200);
  store.delete('publishedSites/u1__page');
  assert.deepEqual(await (await call('owner', { owner: 'u1', project: 'page' })).json(), { indexed: false });
  assert.equal((await d.prepare('SELECT COUNT(*) AS n FROM pages').bind().all()).results[0].n, 0);
});

test('the daily job needs the cron secret', async () => {
  setSearchDb(memoryDb());
  assert.equal((await call('wrong', null, 'GET')).status, 401);
  assert.equal((await call('cron', null, 'GET')).status, 200);
});

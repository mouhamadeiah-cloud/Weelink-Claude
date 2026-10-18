import { test } from 'node:test';
import assert from 'node:assert/strict';
import { store, getFirestore, storageDeletes, storageFiles } from './fakeAdmin.ts';
import { runCleanup } from '../server/cleanup.ts';

const db = getFirestore();
// Only u-live still has a sign-in.
const auth = { getUsers: async (ids: { uid: string }[]) => ({ users: [], notFound: ids.filter((x) => x.uid !== 'u-live') }) };

test('cleanup counts orphans first, then wipes only accounts without a sign-in', async () => {
  store.set('designs/u-live', { restaurantPages: [] });
  store.set('designs/u-gone', { restaurantPages: [] });
  store.set('platform_directory/u-gone', {});
  store.set('publishedSites/u-gone__page', { owner: 'u-gone', project: 'page', name: 'gonepage' });
  store.set('siteNames/gonepage', { owner: 'u-gone', project: 'page' });
  storageFiles.push(
    { name: 'users/u-live/images/a.webp', size: 100 },
    { name: 'users/u-gone/images/b.webp', size: 300 },
    { name: 'users/u-gone/backgrounds/c.webp', size: 200 },
    { name: 'images/old.jpg', size: 50 },
  );

  const scan = await runCleanup(db, auth, false);
  assert.equal(scan.orphanAccounts, 1);
  assert.equal(scan.orphanFiles, 2);
  assert.equal(scan.orphanBytes, 500);
  assert.equal(scan.orphanDocs, 3);
  assert.equal(scan.legacyFiles, 1);
  assert.equal(scan.wiped, 0);
  assert.ok(store.has('designs/u-gone'), 'a scan deletes nothing');

  const done = await runCleanup(db, auth, true);
  assert.equal(done.wiped, 1);
  for (const k of ['designs/u-gone', 'platform_directory/u-gone', 'publishedSites/u-gone__page', 'siteNames/gonepage']) assert.equal(store.has(k), false, k);
  assert.ok(store.has('designs/u-live'), 'a live account stays');
  assert.ok(storageDeletes.some((d) => d.endsWith('/users/u-gone/')));
  assert.ok(!storageDeletes.some((d) => d.endsWith('/users/u-live/')));
  assert.equal(store.get('platform_cleanup/last').wiped, 1);
});

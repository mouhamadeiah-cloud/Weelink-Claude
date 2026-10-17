import { test } from 'node:test';
import assert from 'node:assert/strict';
import { store, getFirestore, storageDeletes } from './fakeAdmin.ts';
import { sent } from './mailRecorder.ts';
import {
  DAY, accessId, approveOrder, attachProof, createOrder, deleteCustomer, enforceBilling, extendOrder, invoiceFor, myBilling, needsPayment, rejectOrder, runBillingDaily,
} from '../server/billing.ts';

const db = getFirestore();
const auth = { getUser: async (uid: string) => ({ email: `${uid}@x.de`, displayName: 'إياد', metadata: { creationTime: '2026-10-01T00:00:00Z' } }) };
const user = { uid: 'u1', email: 'u1@x.de', name: 'إياد' };
const link = (id: string, key: string) => `https://x/inv/${id}/${key}`;

test('invoice: package, devices, yearly domain', () => {
  const m = invoiceFor('restaurant', 'restaurant-60', 'monthly', 2)!;
  assert.equal(m.total, 499000 + 150000);
  assert.equal(m.items.length, 2);
  const y = invoiceFor('restaurant-abcd12', 'restaurant-30', 'yearly')!;
  assert.equal(y.total, Math.round((299000 * 12 * 0.9) / 1000) * 1000);
  assert.equal(y.items.at(-1)!.amount, 0);
  assert.equal(invoiceFor('shop', 'restaurant-30', 'monthly'), null, 'a package of another kind');
  assert.equal(invoiceFor('page', 'page-free', 'monthly'), null, 'the free page has no invoice');
  assert.equal(invoiceFor('shop', 'shop-30', 'monthly', 3)!.devices, 0, 'only restaurants buy devices');
  assert.ok(needsPayment('shop') && needsPayment('page', 'page-pro') && !needsPayment('page'));
});

test('order → receipt → approve starts the project period', async () => {
  store.set('designs/u1', { restaurantPages: [], profile: { phone: '0933' } });
  assert.equal((await createOrder(db, user, { project: 'restaurant-zz9999', plan: 'restaurant-30', period: 'monthly' }) as any).error, 'not-found', 'not their project');
  const c: any = await createOrder(db, user, { project: 'restaurant', plan: 'restaurant-30', period: 'monthly', siteName: 'AlNour!' });
  assert.equal(c.order.status, 'unpaid');
  assert.equal(c.order.siteName, 'alnour');
  const firstDelete = c.order.deleteAt;
  assert.ok(Math.abs(firstDelete - (Date.now() + 60 * DAY)) < 5000);

  // A second invoice replaces the first but keeps its deletion date.
  const c2: any = await createOrder(db, user, { project: 'restaurant', plan: 'restaurant-60', period: 'yearly', devices: 1 });
  assert.equal(store.get(`platform_orders/${c.order.id}`).status, 'cancelled');
  assert.equal(c2.order.deleteAt, firstDelete);

  assert.equal((await attachProof(db, { uid: 'other' }, { id: c2.order.id, way: 'syriatel', transferNo: '1' }) as any).error, 'not-found');
  assert.equal((await attachProof(db, user, { id: c2.order.id, way: 'card' }) as any).error, 'card-soon');
  assert.equal((await attachProof(db, user, { id: c2.order.id, way: 'syriatel' }) as any).error, 'no-proof');
  assert.equal((await attachProof(db, user, { id: c2.order.id, way: 'syriatel', image: 'data:text/html;base64,AAAA' }) as any).error, 'bad-image');
  sent.length = 0;
  const a: any = await attachProof(db, user, { id: c2.order.id, way: 'syriatel', image: 'data:image/jpeg;base64,AAAA' });
  assert.equal(a.order.status, 'attached');
  assert.ok(store.get(`platform_receipts/${c2.order.id}`).image.startsWith('data:image/jpeg'));
  assert.ok(sent.some((m) => m.startsWith('weelinkclaud@gmail.com:')), 'the office is told');

  const r: any = await rejectOrder(db, c2.order.id, 'admin', 'الصورة غير واضحة');
  assert.equal(r.order.status, 'rejected');
  assert.ok(sent.some((m) => m.startsWith('u1@x.de:')));
  await attachProof(db, user, { id: c2.order.id, way: 'sham', transferNo: 'TR-77' });

  const before = Date.now();
  const ok: any = await approveOrder(db, c2.order.id, 'admin', link);
  assert.equal(ok.order.status, 'paid');
  const acc = store.get(`projectAccess/${accessId('u1', 'restaurant')}`);
  assert.equal(acc.owner, 'u1');
  assert.ok(acc.paidUntil > before + 360 * DAY, 'a year from today');
  const pay = store.get(`platform_payments/${ok.order.paymentId}`);
  assert.equal(pay.amount, c2.order.total);
  assert.equal(pay.project, 'restaurant');
  assert.equal(store.get(`platform_orders/${c2.order.id}`).deleteAt, 0, 'a paid project is never deleted');
  assert.equal((await approveOrder(db, c2.order.id, 'admin', link) as any).error, 'bad-state', 'not twice');

  // Renewing while the period runs adds to its end.
  const ren: any = await createOrder(db, user, { project: 'restaurant', plan: 'restaurant-60', period: 'monthly' });
  assert.ok(ren.order.renewal && ren.order.deleteAt === 0);
  await approveOrder(db, ren.order.id, 'admin', link);
  assert.ok(store.get(`projectAccess/${accessId('u1', 'restaurant')}`).paidUntil > acc.paidUntil + 27 * DAY);

  const mine: any = await myBilling(db, 'u1');
  assert.ok(mine.projects.restaurant.paidUntil > Date.now());
  assert.equal(mine.orders.length, 0, 'nothing open');
});

test('daily: reminders, end of period, unpaid project deleted after 2 months', async () => {
  const now = Date.now();
  store.set('designs/u2', { shopPages: [1], shopElements: [], pages: [] });
  store.set(`projectAccess/${accessId('u2', 'page')}`, { owner: 'u2', project: 'page', planName: 'صفحة Pro', paidUntil: now + 5 * DAY, notified: {} });
  const c: any = await createOrder(db, { uid: 'u2', email: 'u2@x.de' }, { project: 'shop', plan: 'shop-30', period: 'monthly' });
  store.set('publishedSites/u2__shop', { name: 'myshop', owner: 'u2', project: 'shop' });
  store.set('siteNames/myshop', { owner: 'u2', project: 'shop' });

  sent.length = 0;
  let out = await runBillingDaily(db, auth, now);
  assert.equal(out.reminded, 1, 'the Pro page: 7 days reminder');
  assert.deepEqual(Object.keys(store.get(`projectAccess/${accessId('u2', 'page')}`).notified).sort(), ['d14', 'd7']);
  assert.equal((await runBillingDaily(db, auth, now)).reminded, 0, 'once');

  out = await runBillingDaily(db, auth, c.order.deleteAt - 3 * DAY);
  assert.equal(out.warned, 1, 'a week before deletion');
  const ext: any = await extendOrder(db, c.order.id, new Date(now + 90 * DAY).toISOString().slice(0, 10));
  assert.ok(ext.deleteAt > c.order.deleteAt, 'the team gives more time');
  out = await runBillingDaily(db, auth, c.order.deleteAt + DAY);
  assert.equal(out.deleted, 0, 'not deleted after the extension');

  out = await runBillingDaily(db, auth, ext.deleteAt + DAY);
  assert.equal(out.deleted, 1);
  assert.equal(store.get(`platform_orders/${c.order.id}`).status, 'deleted');
  assert.equal(store.has('publishedSites/u2__shop') || store.has('siteNames/myshop'), false, 'the page went too');
  assert.equal('shopPages' in store.get('designs/u2'), false);
  assert.ok('pages' in store.get('designs/u2'), 'the other projects stay');

  out = await runBillingDaily(db, auth, now + 6 * DAY);
  assert.equal(out.ended, 1, 'the end of the Pro page');
});

test('a receipt waiting for the team stops the deletion', async () => {
  store.set('designs/u3', { carPages: [] });
  const c: any = await createOrder(db, { uid: 'u3', email: 'u3@x.de' }, { project: 'cars', plan: 'cars-30', period: 'monthly' });
  await attachProof(db, { uid: 'u3' }, { id: c.order.id, way: 'office', transferNo: 'cash' });
  const out = await runBillingDaily(db, auth, c.order.deleteAt + DAY);
  assert.equal(out.deleted, 0);
  assert.ok(store.has('designs/u3'));
});

test('deleting a customer keeps their sign-in, payments and a card', async () => {
  store.set('designs/u4', { restaurantPages: [], pages: [], profile: { phone: '0999' } });
  store.set('designs/u4/projects/shop-ab12cd', { kind: 'shop' });
  store.set('restaurants/u4', { name: 'مطعم' });
  store.set('restaurants/u4/orders/o1', { total: 1 });
  store.set('restaurants/u4/giftCards/1234567812345678', { balance: 1 });
  store.set('giftCardNumbers/1234567812345678', { restaurant: 'u4' });
  store.set('publishedSites/u4__page', { name: 'u4page', owner: 'u4', project: 'page' });
  store.set('siteNames/u4page', { owner: 'u4', project: 'page' });
  store.set('bookings/u4/items/b1', { name: 'x' });
  store.set('platform_payments/p4', { uid: 'u4', amount: 5 });
  store.set(`projectAccess/${accessId('u4', 'restaurant')}`, { owner: 'u4', project: 'restaurant', paidUntil: 123456 });
  store.set('platform_directory/u4', { contactInfo: { phone: '0999' } });

  assert.equal((await deleteCustomer(db, auth, 'u4', 'admin', '') as any).error, 'reason');
  const r: any = await deleteCustomer(db, auth, 'u4', 'admin', 'طلب الزبون');
  assert.equal(r.card.phone, '0999');
  assert.equal(r.card.endsAt, 123456);
  for (const k of ['designs/u4', 'designs/u4/projects/shop-ab12cd', 'restaurants/u4', 'restaurants/u4/orders/o1', 'giftCardNumbers/1234567812345678', 'publishedSites/u4__page', 'siteNames/u4page', 'bookings/u4/items/b1', 'platform_directory/u4', `projectAccess/u4__restaurant`]) {
    assert.equal(store.has(k), false, k);
  }
  assert.ok(store.has('platform_payments/p4'), 'payments stay');
  assert.equal(store.get('platform_deleted/u4').email, 'u4@x.de');
  assert.deepEqual(storageDeletes, ['weelink-cd35d.firebasestorage.app/users/u4/'], 'their photos');
});

test('turning payment on marks the accounts that exist as test accounts', async () => {
  const r = await enforceBilling(db, true, 'admin', ['a', 'b']);
  assert.equal(r.marked, 2);
  assert.ok(store.has('testAccounts/a') && store.get('platformSettings/billing').enforce === true);
  await enforceBilling(db, false, 'admin', []);
  assert.equal(store.get('platformSettings/billing').enforce, false);
});

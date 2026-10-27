import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/booking.ts';
import { store, tokens } from './fakeAdmin.ts';

process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ private_key: 'x' });
tokens['own'] = { uid: 'wown' };
tokens['stranger'] = { uid: 'nobody' };
store.set('team/wown/people/pa', { name: 'سارة', role: 'حلاقة', takesBookings: true, at: '2026-01-01' });
store.set('team/wown/people/pb', { name: 'ليث', takesBookings: true, at: '2026-01-02' });
// The server counts days in Damascus time, so the fixtures do too (UTC dates drift from it after 21:00 UTC).
const day = (n: number) => new Date(Date.now() + n * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Damascus' });
store.set('bookings/wown/items/b1', { person: 'pa', date: day(1), startMin: 600, slot: '10:00 ص', name: 'ليلى', phone: '0933000111', email: 'l@x.com', desc: 'قص', status: 'confirmed' });
store.set('bookings/wown/items/b2', { person: 'pb', date: day(1), startMin: 700, slot: 'x', name: 'غيرها', status: 'confirmed' });
store.set('bookings/wown/items/b3', { person: 'pa', date: day(0), startMin: 480, slot: '8:00 ص', name: 'اليوم', status: 'confirmed' });
store.set('bookings/wown/items/b4', { person: 'pa', date: day(-3), startMin: 480, slot: 'old', name: 'قديم', status: 'confirmed' });
store.set('bookings/wown/items/b5', { person: 'pa', date: day(2), startMin: 480, slot: 'c', name: 'ملغى', status: 'cancelled' });

const call = async (body: any, token = '') => {
  const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {}, body: JSON.stringify({ ...body, action: `worker-${body.action}` }) }));
  return { s: r.status, ...(await r.json()) };
};

test('only the owner sets codes, a code is unique, and the list shows who has one', async () => {
  assert.equal((await call({ action: 'set-pin', owner: 'wown', person: 'pa', pin: '123456' })).s, 401);
  assert.equal((await call({ action: 'set-pin', owner: 'wown', person: 'pa', pin: '123456' }, 'stranger')).s, 404);
  assert.equal((await call({ action: 'set-pin', owner: 'wown', person: 'pa', pin: '12' }, 'own')).s, 400);
  assert.equal((await call({ action: 'set-pin', owner: 'wown', person: 'pa', pin: '123456' }, 'own')).s, 200);
  assert.equal((await call({ action: 'set-pin', owner: 'wown', person: 'pb', pin: '123456' }, 'own')).error, 'pin_used');
  assert.equal((await call({ action: 'set-pin', owner: 'wown', person: 'pb', pin: '654321' }, 'own')).s, 200);
  assert.deepEqual((await call({ action: 'pins', owner: 'wown' }, 'own')).ids.sort(), ['pa', 'pb']);
  assert.ok(!JSON.stringify([...store.values()]).includes('"123456"'));
});

test('a worker sees only their own coming bookings, without phone or email', async () => {
  const v = await call({ action: 'view', owner: 'wown', pin: '123456' });
  assert.equal(v.s, 200);
  assert.equal(v.person.name, 'سارة');
  assert.deepEqual(v.bookings.map((b: any) => b.name), ['اليوم', 'ليلى']);
  assert.ok(!JSON.stringify(v).includes('0933000111'));
  assert.notEqual(v.person.color, (await call({ action: 'view', owner: 'wown', pin: '654321' })).person.color);
});

test('«تم» works on own bookings that are due, not on others or future ones', async () => {
  assert.equal((await call({ action: 'done', owner: 'wown', pin: '123456', id: 'b2' })).s, 404);
  assert.equal((await call({ action: 'done', owner: 'wown', pin: '123456', id: 'b1' })).error, 'too_early');
  assert.equal((await call({ action: 'done', owner: 'wown', pin: '123456', id: 'b3' })).s, 200);
  assert.equal(store.get('bookings/wown/items/b3').status, 'done');
});

test('ten wrong codes lock the page', async () => {
  for (let i = 0; i < 10; i++) assert.equal((await call({ action: 'view', owner: 'wown', pin: '000000' })).error, 'wrong_pin');
  assert.equal((await call({ action: 'view', owner: 'wown', pin: '123456' })).error, 'locked');
});

test('a worker with a rota sees their next two weeks of shifts', async () => {
  store.delete('workerPins/wown'); // the lock test above filled the counter
  store.set('team/wown/people/pr', { name: 'نور', takesBookings: true, at: '2026-01-03', rota: { weeks: 1, anchor: day(0), plan: [{ sunday: [{ start: '09:00', end: '12:00' }], monday: [{ start: '09:00', end: '12:00' }], tuesday: [{ start: '09:00', end: '12:00' }], wednesday: [{ start: '09:00', end: '12:00' }], thursday: [{ start: '09:00', end: '12:00' }], friday: [{ start: '09:00', end: '12:00' }], saturday: [{ start: '09:00', end: '12:00' }] }], exceptions: { [day(1)]: [] } } });
  tokens['own'] = { uid: 'wown' };
  const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', headers: { authorization: 'Bearer own' }, body: JSON.stringify({ action: 'worker-set-pin', owner: 'wown', person: 'pr', pin: '111222' }) }));
  assert.equal(r.status, 200);
  const v = await call({ action: 'view', owner: 'wown', pin: '111222' });
  assert.equal(v.shifts.length, 14);
  assert.equal(v.shifts[0].shifts.length, 1);
  assert.equal(v.shifts[1].shifts.length, 0);
});

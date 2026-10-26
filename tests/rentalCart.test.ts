import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/booking.ts';
import { store, tokens, users } from './fakeAdmin.ts';

process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ private_key: 'x' });
users['own11'] = { email: 'owner11@example.com' };
tokens['tk11'] = { uid: 'own11' };
const inD = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
store.set('bookingSettings/own11/pages/rental', {
  schedules: [{
    id: 'rental', name: 'التأجير', type: 'stay', rental: true, minNights: 1, maxNights: 10, daysAhead: 60, workStart: '09:00', workEnd: '23:00',
    extras: [{ id: 'xdj', name: 'DJ', price: 50, per: 'once', units: [] }],
    rooms: [
      { id: 'uhall', name: 'صالة', item: 'p_hall', byDay: true, dayPrice: 300, currency: '$' },
      { id: 'uchairs', name: 'كراسي', item: 'p_chairs', byDay: true, dayPrice: 40, currency: '$' },
      { id: 'utent', name: 'خيمة', item: 'p_tent', byDay: true, dayPrice: 20, currency: '$' },
    ],
  }],
});
const cart = async (items: any[], extra: any = {}) => {
  const body = { action: 'create', owner: 'own11', project: 'rental', schedule: 'rental', pageName: 'تأجير', date: inD(5), startMin: 0, slot: 'x', meetingType: '', name: 'ليلى', phone: '0933123456', email: '', needsConfirmation: true, rent: { by: 'day', items }, checkOut: inD(7), ...extra };
  const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', body: JSON.stringify(body) }));
  return { s: r.status, ...(await r.json()) };
};

test('a cart books all its items in one booking with one total, and a cancelled one frees every item', async () => {
  const ok = await cart([{ room: 'uhall', extras: ['xdj'] }, { room: 'uchairs' }]);
  assert.equal(ok.s, 200);
  const b = store.get(`bookings/own11/items/${ok.id}`);
  assert.equal(b.items.length, 2);
  assert.equal(b.roomName, 'صالة، كراسي');
  assert.equal(b.price.total, (300 * 2 + 50) + 40 * 2);
  assert.ok(b.price.lines.some((l: any) => l.label.startsWith('صالة: ')));
  assert.equal(store.get(`bookingRooms/own11_rental_rental_uhall`).nights.length, 2);
  // the same days again: the hall is taken, so nothing at all is booked, not even the free tent
  const again = await cart([{ room: 'utent' }, { room: 'uhall' }]);
  assert.equal(again.error, 'taken');
  assert.equal(store.get(`bookingRooms/own11_rental_rental_utent`), undefined);
  const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', headers: { authorization: 'Bearer tk11' }, body: JSON.stringify({ action: 'status', owner: 'own11', id: ok.id, status: 'cancelled' }) }));
  assert.equal(r.status, 200);
  assert.equal(store.get(`bookingRooms/own11_rental_rental_uhall`).nights.length, 0);
  assert.equal(store.get(`bookingRooms/own11_rental_rental_uchairs`).nights.length, 0);
  assert.equal((await cart([{ room: 'utent' }, { room: 'uhall' }])).s, 200);
});

test('a cart with the same item twice or an unknown item is refused', async () => {
  assert.equal((await cart([{ room: 'uhall' }, { room: 'uhall' }], { date: inD(30), checkOut: inD(31) })).error, 'bad_rent');
  assert.equal((await cart([{ room: 'uhall' }, { room: 'nope' }], { date: inD(30), checkOut: inD(31) })).error, 'no_rooms');
});

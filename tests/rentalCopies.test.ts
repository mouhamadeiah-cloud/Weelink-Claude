import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/booking.ts';
import { store, tokens, users } from './fakeAdmin.ts';
import { copyIdOf, daysFree, normalizeExtras, normalizeUnit, quote, slotsFree, slotsOf, unitOf } from '../src/services/rentalBooking.ts';
import { rentalItemCount } from '../src/components/rental/rentalTypes.ts';
import { DEFAULT_MODELS, modelOf } from '../src/data/pageModels.ts';

test('extras priced per person: each guest each night, or each guest once', () => {
  const extras = normalizeExtras([
    { id: 'e1', name: 'فطور', price: 5, per: 'person' },
    { id: 'e2', name: 'نقل من المطار', price: 10, per: 'personOnce' },
    { id: 'e3', name: 'تنظيف', price: 7, per: 'nonsense' },
  ]);
  assert.deepEqual(extras.map((e) => e.per), ['person', 'personOnce', 'unit']);
  const room = unitOf({ id: 'r1', name: 'غرفة', capacity: 4, price: '', photo: '', dayPrice: 100 } as any);
  const q = quote(room, extras, 'r1', { by: 'day', date: '2030-05-01', checkOut: '2030-05-03', extras: ['e1', 'e2'], guests: 3 }, { night: true })!;
  assert.equal(q.total, 200 + 5 * 2 * 3 + 10 * 3);
  // a person-priced extra with no guests given counts one person
  assert.equal(quote(room, extras, 'r1', { by: 'day', date: '2030-05-01', checkOut: '2030-05-02', extras: ['e1'] })!.total, 105);
});

test('copies: clamped, counted in the limit, and free while any copy is free', () => {
  assert.equal(normalizeUnit({}).copies, 1);
  assert.equal(normalizeUnit({ copies: 5 }).copies, 5);
  assert.equal(normalizeUnit({ copies: 999 }).copies, 100);
  assert.equal(normalizeUnit({ copies: 0 }).copies, 1);
  assert.equal(rentalItemCount([{ copies: 5 }, {}, { copies: 2 }]), 8);
  assert.equal(copyIdOf('uabc', 1), 'uabc');
  assert.equal(copyIdOf('uabc', 3), 'uabck3');
  assert.ok(copyIdOf('u' + 'x'.repeat(19), 12).length <= 20);
  const a = { nights: ['2030-04-02'], slots: [] };
  const b = { nights: [], slots: slotsOf('2030-04-02', 600, 660) };
  assert.equal(daysFree([a, b], ['2030-04-02']), false);
  assert.equal(daysFree([a, { nights: [], slots: [] }], ['2030-04-02']), true);
  assert.equal(slotsFree([a, b], slotsOf('2030-04-02', 600, 660)), false);
  assert.equal(daysFree([a, { nights: ['2030-04-02'], slots: [] }], ['2030-04-02']), false);
  assert.equal(slotsFree([a, { nights: [], slots: [] }], slotsOf('2030-04-02', 720, 780)), true);
});

process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ private_key: 'x' });
users['own7'] = { email: 'owner7@example.com' };
tokens['tk7'] = { uid: 'own7' };
const inD = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
store.set('bookingSettings/own7/pages/rental', {
  schedules: [{
    id: 'rental', name: 'التأجير', type: 'stay', rental: true, minNights: 1, maxNights: 10, daysAhead: 60, workStart: '09:00', workEnd: '23:00',
    rooms: [{ id: 'utent', name: 'خيمة', item: 'p_tent', byDay: true, dayPrice: 20, currency: '$', copies: 2 }],
  }],
});
const rbook = async (extra: any = {}) => {
  const body = { action: 'create', owner: 'own7', project: 'rental', schedule: 'rental', pageName: 'تأجير', date: inD(5), startMin: 0, slot: 'x', meetingType: '', name: 'ليلى', phone: '0933123456', email: '', needsConfirmation: true, room: 'utent', rent: { by: 'day' }, checkOut: inD(7), ...extra };
  const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', body: JSON.stringify(body) }));
  return { s: r.status, ...(await r.json()) };
};

test('a unit with two copies books twice on the same days, each on its own copy, and a cancelled one frees its copy', async () => {
  const one = await rbook();
  const two = await rbook({ name: 'سامر' });
  assert.equal(one.s, 200);
  assert.equal(two.s, 200);
  assert.equal(store.get(`bookings/own7/items/${one.id}`).roomId, 'utent');
  assert.equal(store.get(`bookings/own7/items/${two.id}`).roomId, 'utentk2');
  assert.equal(store.get(`bookings/own7/items/${two.id}`).roomName, 'خيمة · 2');
  assert.equal((await rbook({ name: 'ثالث' })).error, 'taken');
  // other days are still free
  assert.equal((await rbook({ date: inD(20), checkOut: inD(21) })).s, 200);
  const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', headers: { authorization: 'Bearer tk7' }, body: JSON.stringify({ action: 'status', owner: 'own7', id: two.id, status: 'cancelled' }) }));
  assert.equal(r.status, 200);
  const again = await rbook({ name: 'رابع' });
  assert.equal(again.s, 200);
  assert.equal(store.get(`bookings/own7/items/${again.id}`).roomId, 'utentk2');
});

test('the models of rental and hotel exist for free, 30 and 60, and Pro, and a package builds from them', () => {
  for (const t of ['rental', 'hotel']) {
    for (const id of [`${t}-free`, t, `${t}-pro`]) assert.ok(DEFAULT_MODELS.some((m) => m.id === id && m.sections.length > 3), id);
    assert.equal(modelOf(`${t}-free`), `${t}-free`);
    assert.equal(modelOf(`${t}-30`), t);
    assert.equal(modelOf(`${t}-60`), t);
    assert.equal(modelOf(`${t}-pro`), `${t}-pro`);
  }
  assert.ok(DEFAULT_MODELS.find((m) => m.id === 'rental')!.sections.some((s) => s.id === 'cars:main'));
  assert.ok(DEFAULT_MODELS.find((m) => m.id === 'hotel')!.sections.some((s) => s.id === 'shop:main'));
});

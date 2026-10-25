import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/booking.ts';
import { store, tokens, users } from './fakeAdmin.ts';

process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ private_key: 'x' });
users['own1'] = { email: 'owner@example.com' };
store.set('team/own1/people/pa1', { name: 'د. سارة', takesBookings: true, email: 'sara@example.com' });
store.set('team/own1/people/pb2', { name: 'سامر', takesBookings: false, email: 'samer@example.com' });

store.set('team/own1/people/pc3', { name: 'ليث', takesBookings: true, email: 'laith@example.com', workStart: '12:00', workEnd: '15:00' });

const day = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
const base = { action: 'create', owner: 'own1', project: 'page', pageName: 'عيادة', date: day, startMin: 600, slot: '10:00 ص - 10:30 ص', meetingType: 'phone', name: 'ليلى', phone: '0933123456', email: '', needsConfirmation: true };
const book = async (extra: any = {}) => {
  const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', body: JSON.stringify({ ...base, ...extra }) }));
  return { s: r.status, ...(await r.json()) };
};

test('a team person has their own times on the same schedule', async () => {
  assert.equal((await book({ person: 'pa1' })).s, 200);
  assert.equal((await book({ person: 'pa1' })).error, 'taken');
  assert.deepEqual(store.get(`bookingDays/own1_page_${day}_ppa1`).taken, [600]);
  // the time without a person is a different day document, still free
  assert.equal((await book()).s, 200);
});

test('a booking keeps who it is with, and the person gets their own mail address stored', async () => {
  const rows = [...store.entries()].filter(([k]) => k.startsWith('bookings/own1/items/')).map(([, v]) => v);
  const withPerson = rows.find((r) => r.person === 'pa1');
  assert.equal(withPerson.personName, 'د. سارة');
  assert.equal(withPerson.personEmail, 'sara@example.com');
});

test('only people who take bookings can be booked, and another schedule has its own times', async () => {
  assert.equal((await book({ person: 'pb2' })).error, 'bad_person');
  assert.equal((await book({ person: 'ghost' })).error, 'bad_person');
  assert.equal((await book({ person: 'pa1', schedule: 's9' })).s, 200);
  assert.deepEqual(store.get(`bookingDays/own1_page_${day}_s9_ppa1`).taken, [600]);
});

// ---- tables (restaurants) ----
const tday = new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10);
store.set('restaurants/own1', { menu: { halls: [
  { id: 'h1', name: 'الداخلية', tables: [{ id: 't1', name: '1', seats: 2 }, { id: 't2', name: '2', seats: 4 }] },
  { id: 'h2', name: 'الحديقة', tables: [{ id: 't4', name: 'ح1', seats: 6 }] },
] } });
store.set('bookingSettings/own1/pages/restaurant', { schedules: [{ id: 'table', name: 'حجز الطاولات', type: 'table', durationMinutes: 90, interval: '30', partyMax: 6 }] });
const tbase = { ...base, project: 'restaurant', schedule: 'table', date: tday, startMin: 720, slot: '12:00 م', meetingType: '', partySize: 3 };
const tbook = async (extra: any = {}) => {
  const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', body: JSON.stringify({ ...tbase, ...extra }) }));
  return { s: r.status, ...(await r.json()) };
};

test('a party gets the smallest free table and an overlapping party gets another', async () => {
  const a = await tbook();
  assert.equal(a.s, 200);
  assert.equal(a.tableName, '2');
  const b = await tbook({ name: 'سمير' });
  assert.equal(b.tableName, 'ح1');
  assert.equal((await tbook()).error, 'taken');
  assert.deepEqual(store.get(`bookingDays/own1_restaurant_${tday}_table`).tables.t2, [720]);
});

test('a table booking checks the party, the schedule and the wished table', async () => {
  assert.equal((await tbook({ partySize: 9 })).error, 'bad_party');
  assert.equal((await tbook({ schedule: 'main' })).error, 'bad_schedule');
  assert.equal((await tbook({ startMin: 1200, partySize: 2, tableId: 't4' })).tableName, 'ح1');
  assert.equal((await tbook({ startMin: 1200, partySize: 5, tableId: 't1' })).error, 'taken');
});

test('a cancelled table booking frees its times', async () => {
  const [id] = [...store.entries()].find(([k, v]: any) => k.startsWith('bookings/own1/items/') && v.date === tday && v.tableId === 't2') as any;
  tokens['tk'] = { uid: 'own1' };
  const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', headers: { authorization: 'Bearer tk' }, body: JSON.stringify({ action: 'status', owner: 'own1', id: id.split('/').pop(), status: 'cancelled' }) }));
  assert.equal(r.status, 200);
  assert.deepEqual(store.get(`bookingDays/own1_restaurant_${tday}_table`).tables.t2, []);
  assert.equal((await tbook({ partySize: 4 })).tableName, '2');
});

test('a restaurant that never saved table settings still books with the defaults', async () => {
  store.delete('bookingSettings/own1/pages/restaurant');
  assert.equal((await tbook({ startMin: 900 })).s, 200);
});

test('a person is not booked outside their own hours', async () => {
  assert.equal((await book({ person: 'pc3', startMin: 600 })).error, 'taken');
  assert.equal((await book({ person: 'pc3', startMin: 720 })).s, 200);
});

// ---- hotel stays ----
const inD = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
store.set('bookingSettings/own1/pages/page', { schedules: [
  { id: 'main', name: 'المواعيد', type: 'appointment' },
  { id: 'stay', name: 'الغرف', type: 'stay', minNights: 1, maxNights: 5, daysAhead: 60, rooms: [
    { id: 'r1', name: '101', capacity: 2 }, { id: 'r2', name: '102', capacity: 4 },
  ] },
] });
const sbook = async (extra: any = {}) => {
  const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', body: JSON.stringify({ ...base, schedule: 'stay', date: inD(10), checkOut: inD(12), partySize: 2, startMin: 0, slot: '2', meetingType: '', ...extra }) }));
  return { s: r.status, ...(await r.json()) };
};

test('a stay gets the smallest free room, and overlapping stays get another room, then none', async () => {
  assert.equal((await sbook()).roomName, '101');
  assert.equal((await sbook({ date: inD(11), checkOut: inD(13), name: 'سمير' })).roomName, '102');
  assert.equal((await sbook({ date: inD(11), checkOut: inD(12) })).error, 'taken');
  // the check-out day is free for the next check-in
  assert.equal((await sbook({ date: inD(12), checkOut: inD(14) })).roomName, '101');
  assert.deepEqual(store.get(`bookingRooms/own1_page_stay_r1`).nights.sort(), [inD(10), inD(11), inD(12), inD(13)]);
});

test('a stay checks the nights, the guests and the schedule', async () => {
  assert.equal((await sbook({ date: inD(20), checkOut: inD(20) })).error, 'bad_nights');
  assert.equal((await sbook({ date: inD(20), checkOut: inD(30) })).error, 'bad_nights');
  assert.equal((await sbook({ date: inD(20), checkOut: inD(21), partySize: 9 })).error, 'bad_party');
  assert.equal((await sbook({ schedule: 'main', date: inD(20), checkOut: inD(21) })).error, 'bad_schedule');
  assert.equal((await sbook({ date: inD(70), checkOut: inD(71) })).error, 'bad_date');
});

test('a cancelled stay frees its nights', async () => {
  const [path] = [...store.entries()].find(([k, v]: any) => k.startsWith('bookings/own1/items/') && v.roomId === 'r2' && v.date === inD(11)) as any;
  tokens['tk2'] = { uid: 'own1' };
  const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', headers: { authorization: 'Bearer tk2' }, body: JSON.stringify({ action: 'status', owner: 'own1', id: path.split('/').pop(), status: 'cancelled' }) }));
  assert.equal(r.status, 200);
  assert.deepEqual(store.get('bookingRooms/own1_page_stay_r2').nights, []);
  assert.equal((await sbook({ date: inD(11), checkOut: inD(13), partySize: 3 })).roomName, '102');
});

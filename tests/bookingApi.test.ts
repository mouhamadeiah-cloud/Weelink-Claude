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

// ---- the owner books on the admin's grid ----
const oday = inD(12);
const obook = async (extra: any = {}, token = 'tk') => {
  tokens['tk'] = { uid: 'own1' };
  tokens['other'] = { uid: 'stranger' };
  const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify({ ...tbase, action: 'owner-create', date: oday, phone: '', email: '', ...extra }) }));
  return { s: r.status, ...(await r.json()) };
};

test('the owner books a pinned table at once, without a phone or any email', async () => {
  const a = await obook({ tableId: 't4', partySize: 5, name: 'زبون هاتف' });
  assert.equal(a.s, 200);
  assert.equal(a.status, 'confirmed');
  assert.equal(a.tableName, 'ح1');
  assert.equal((await obook({ tableId: 't4', partySize: 2 })).error, 'taken');
  assert.equal((await obook({ tableId: 't1', partySize: 4, startMin: 1000 })).error, 'taken');
});

test('only the owner or a member may book on the grid, and the owner can pin a person outside their hours', async () => {
  assert.equal((await obook({}, 'other')).s, 404);
  assert.equal((await handler.fetch(new Request('http://x/api/booking', { method: 'POST', body: JSON.stringify({ ...base, action: 'owner-create' }) }))).status, 401);
  const p = await obook({ project: 'page', schedule: 'main', tableId: undefined, partySize: undefined, person: 'pc3', startMin: 600, slot: '10:00 ص - 10:30 ص', name: 'علي' });
  assert.equal(p.s, 200);
  assert.equal((await obook({ project: 'page', schedule: 'main', partySize: undefined, person: 'pc3', startMin: 600, name: 'غيره' })).error, 'taken');
});

// ---- seats in a session ----
store.set('bookingSettings/own1/pages/cars', { schedules: [
  { id: 'seats', name: 'الدورات', type: 'seats', maxSeatsPerBooking: 3, daysAhead: 60, sessions: [
    { id: 'x1', name: 'رحلة الشاطئ', date: inD(10), startMin: 480, seats: 5 },
    { id: 'x4', name: 'كورس', date: inD(12), endDate: inD(40), startMin: 600, seats: 5 },
    { id: 'x2', name: 'ورشة', date: inD(100), startMin: 600, seats: 5 },
    { id: 'x3', name: 'قديمة', date: inD(-3), startMin: 600, seats: 5 },
  ] },
] });
const qbook = async (extra: any = {}) => {
  const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', body: JSON.stringify({ ...base, project: 'cars', schedule: 'seats', session: 'x1', date: inD(10), startMin: 480, slot: 'x', meetingType: '', partySize: 2, ...extra }) }));
  return { s: r.status, ...(await r.json()) };
};

test('seats of a session are counted and the last seats are never given twice', async () => {
  assert.equal((await qbook()).s, 200);
  assert.equal(store.get('bookingSessions/own1_cars_seats_x1').taken, 2);
  assert.equal((await qbook({ partySize: 3 })).s, 200);
  assert.equal((await qbook({ partySize: 1 })).error, 'taken');
  const row = [...store.values()].find((v: any) => v.sessionId === 'x1');
  assert.equal(row.date, inD(10));
  assert.equal(row.startMin, 480);
  assert.match(row.slot, /رحلة الشاطئ/);
});

test('seat bookings check the session, the seats and the dates', async () => {
  assert.equal((await qbook({ session: 'nope' })).error, 'bad_session');
  assert.equal((await qbook({ session: 'x2' })).error, 'bad_date');
  assert.equal((await qbook({ session: 'x3' })).error, 'bad_date');
  assert.equal((await qbook({ partySize: 4 })).error, 'bad_party');
  assert.equal((await qbook({ partySize: 0 })).error, 'bad_party');
  assert.equal((await qbook({ schedule: 'main' })).error, 'bad_schedule');
});

test('a cancelled seat booking gives its seats back', async () => {
  const entry = [...store.entries()].find(([k, v]: any) => k.startsWith('bookings/own1/items/') && v.sessionId === 'x1' && v.partySize === 3) as any;
  tokens['tk3'] = { uid: 'own1' };
  const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', headers: { authorization: 'Bearer tk3' }, body: JSON.stringify({ action: 'status', owner: 'own1', id: entry[0].split('/').pop(), status: 'cancelled' }) }));
  assert.equal(r.status, 200);
  assert.equal(store.get('bookingSessions/own1_cars_seats_x1').taken, 2);
  assert.equal((await qbook({ partySize: 3 })).s, 200);
});

test('a course books on its first day and keeps its last day', async () => {
  const r = await qbook({ session: 'x4', date: inD(12), startMin: 600, partySize: 1 });
  assert.equal(r.s, 200);
  const row = [...store.values()].find((v: any) => v.sessionId === 'x4');
  assert.equal(row.date, inD(12));
  assert.equal(row.endDate, inD(40));
});

// ---- deposits ----
store.set('bookingSettings/own1/pages/shop', {
  payments: { currency: '$', wallets: { syriatel: { enabled: true, account: '0933000111' }, sham: { enabled: true, account: '' } } },
  schedules: [
    { id: 'main', name: 'مواعيد', type: 'appointment', depositOn: true, depositType: 'fixed', depositValue: 5 },
    { id: 'seats', name: 'دورات', type: 'seats', depositOn: true, depositType: 'percent', depositValue: 50, maxSeatsPerBooking: 4, daysAhead: 60, sessions: [
      { id: 'd1', name: 'دورة', date: inD(15), startMin: 600, seats: 4, price: '20$ للشخص' },
    ] },
  ],
});
const dbook = async (extra: any = {}) => {
  const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', body: JSON.stringify({ ...base, project: 'shop', date: inD(5), startMin: 540, slot: '9:00', ...extra }) }));
  return { s: r.status, ...(await r.json()) };
};
const proof = { wallet: 'syriatel', txn: 'TX12345', screenshot: 'https://x.test/i.png' };

test('a fixed deposit needs a proof, then the booking waits as «new» with a hold', async () => {
  assert.equal((await dbook()).error, 'deposit_required');
  assert.equal((await dbook({ deposit: { ...proof, wallet: 'sham' } })).error, 'deposit_required'); // no account
  assert.equal((await dbook({ deposit: { ...proof, txn: 'a' } })).error, 'deposit_required');
  const ok = await dbook({ deposit: proof, needsConfirmation: false });
  assert.equal(ok.s, 200);
  assert.equal(ok.status, 'new');
  assert.equal(ok.deposit, true);
  const row = store.get(`bookings/own1/items/${ok.id}`);
  assert.equal(row.deposit.amount, 5);
  assert.equal(row.deposit.state, 'pending');
  assert.equal(row.deposit.currency, '$');
  assert.ok(store.get(`depositHolds/own1_${ok.id}`));
});

test('a percent deposit uses the numeric price of the session times the seats', async () => {
  const r = await dbook({ schedule: 'seats', session: 'd1', date: inD(15), startMin: 600, partySize: 2, deposit: proof });
  assert.equal(r.s, 200);
  assert.equal(store.get(`bookings/own1/items/${r.id}`).deposit.amount, 20);
  assert.equal(store.get('bookingSessions/own1_shop_seats_d1').taken, 2);
});

test('confirming the deposit confirms the booking and drops the hold; rejecting frees the time', async () => {
  tokens['tk4'] = { uid: 'own1' };
  const status = (id: string, s: string) => handler.fetch(new Request('http://x/api/booking', { method: 'POST', headers: { authorization: 'Bearer tk4' }, body: JSON.stringify({ action: 'status', owner: 'own1', id, status: s }) }));
  const [okId] = [...store.entries()].find(([k, v]: any) => k.startsWith('bookings/own1/items/') && v.deposit?.amount === 5)!.map((x: any, i: number) => (i === 0 ? x.split('/').pop() : x));
  assert.equal((await status(okId, 'confirmed')).status, 200);
  assert.equal(store.get(`bookings/own1/items/${okId}`).deposit.state, 'paid');
  assert.equal(store.get(`bookings/own1/items/${okId}`).status, 'confirmed');
  assert.equal(store.get(`depositHolds/own1_${okId}`), undefined);
  const seatId = [...store.entries()].find(([k, v]: any) => k.startsWith('bookings/own1/items/') && v.sessionId === 'd1')![0].split('/').pop()!;
  assert.equal((await status(seatId, 'cancelled')).status, 200);
  assert.equal(store.get(`bookings/own1/items/${seatId}`).deposit.state, 'rejected');
  assert.equal(store.get('bookingSessions/own1_shop_seats_d1').taken, 0);
});

test('a deposit nobody confirms in 24 hours is released by the daily cron', async () => {
  process.env.CRON_SECRET = 'cron';
  const r = await dbook({ schedule: 'seats', session: 'd1', date: inD(15), startMin: 600, partySize: 3, deposit: proof });
  assert.equal(store.get('bookingSessions/own1_shop_seats_d1').taken, 3);
  store.set(`depositHolds/own1_${r.id}`, { owner: 'own1', id: r.id, createdAt: Date.now() - 25 * 3600000 });
  const out = await handler.fetch(new Request('http://x/api/booking', { headers: { authorization: 'Bearer cron' } }));
  assert.equal((await out.json()).expired, 1);
  assert.equal(store.get(`bookings/own1/items/${r.id}`).status, 'cancelled');
  assert.equal(store.get(`bookings/own1/items/${r.id}`).deposit.state, 'expired');
  assert.equal(store.get('bookingSessions/own1_shop_seats_d1').taken, 0);
  assert.equal(store.get(`depositHolds/own1_${r.id}`), undefined);
});

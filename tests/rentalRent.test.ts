import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/booking.ts';
import { store, tokens, users } from './fakeAdmin.ts';
import { daysFree, mergeUnits, normalizeUnit, quote, slotsFree, slotsOf, unitIdOf, type RentalExtra } from '../src/services/rentalBooking.ts';
import { normalizeSchedule } from '../src/services/bookingSettings.ts';

// ---- the price ----
const unit = normalizeUnit({
  byDay: true, byHour: true, dayPrice: 50, hourPrice: 10, currency: '$', minHours: 2, maxHours: 6,
  periods: [{ id: 'p1', name: 'مسائية', start: 1080, end: 1380, price: 300 }],
  driver: 'both', driverDay: 20, driverHour: 5,
  prices: [
    { id: 's1', kind: 'days', for: 'day', days: ['friday', 'saturday'], price: 70 },
    { id: 's2', kind: 'dates', for: 'day', from: '2030-04-10', to: '2030-04-12', price: 100 },
    { id: 's3', kind: 'hours', for: 'hour', from: '18:00', to: '23:00', price: 15 },
  ],
});
const extras: RentalExtra[] = [
  { id: 'e1', name: 'كرسي أطفال', price: 3, per: 'unit', units: [] },
  { id: 'e2', name: 'توصيل', price: 8, per: 'once', units: [] },
  { id: 'e3', name: 'لغيرها', price: 99, per: 'once', units: ['uother'] },
];

test('by the day: weekend and date prices win over the day price, the most exact first', () => {
  // 2030-04-04 is a Thursday: Thu 50, Fri 70, Sat 70, Sun 50
  const q = quote(unit, extras, 'u1', { by: 'day', date: '2030-04-04', checkOut: '2030-04-08' })!;
  assert.equal(q.total, 240);
  assert.equal(q.nights.length, 4);
  assert.equal(q.lines.length, 2);
  // the Eid dates (a Wednesday to a Friday) beat the Friday price
  assert.equal(quote(unit, extras, 'u1', { by: 'day', date: '2030-04-10', checkOut: '2030-04-13' })!.total, 300);
  assert.equal(quote(unit, extras, 'u1', { by: 'day', date: '2030-04-04', checkOut: '2030-04-04' }), null);
  assert.equal(quote(unit, extras, 'u1', { by: 'day', date: '2030-04-01', checkOut: '2030-04-09' }, { maxDays: 5 }), null);
});

test('by the hour: the evening hours cost more, within the hours and the opening times', () => {
  const q = quote(unit, extras, 'u1', { by: 'hour', date: '2030-04-01', start: 960, hours: 4 })!; // 16:00-20:00
  assert.equal(q.total, 10 + 10 + 15 + 15);
  assert.equal(q.slots.length, 8);
  assert.equal(q.slots[0], '2030-04-01@960');
  assert.equal(quote(unit, extras, 'u1', { by: 'hour', date: '2030-04-01', start: 960, hours: 1 }), null); // fewer than 2
  assert.equal(quote(unit, extras, 'u1', { by: 'hour', date: '2030-04-01', start: 960, hours: 7 }), null); // more than 6
  assert.equal(quote(unit, extras, 'u1', { by: 'hour', date: '2030-04-01', start: 1200, hours: 4 }, { workStart: 540, workEnd: 1320 }), null);
});

test('a period, the driver and the extras add up; an extra for another unit is left out', () => {
  const q = quote(unit, extras, 'u1', { by: 'period', date: '2030-04-01', period: 'p1', driver: true, extras: ['e1', 'e2', 'e3'] })!;
  assert.equal(q.total, 300 + 5 * 5 + 3 + 8);
  const d = quote(unit, extras, 'u1', { by: 'day', date: '2030-04-01', checkOut: '2030-04-03', driver: true, extras: ['e1'] })!;
  assert.equal(d.total, 100 + 40 + 6);
  assert.equal(quote(unit, extras, 'u1', { by: 'day', date: '2030-04-01', checkOut: '2030-04-03', driver: false })!.total, 100);
  assert.equal(quote({ ...unit, driver: 'none' }, extras, 'u1', { by: 'day', date: '2030-04-01', checkOut: '2030-04-03', driver: true })!.total, 100);
});

test('a day rented whole has no free hours, and a day with hours booked is not free whole', () => {
  const taken = { nights: ['2030-04-02'], slots: slotsOf('2030-04-03', 600, 720) };
  assert.equal(daysFree(taken, ['2030-04-01']), true);
  assert.equal(daysFree(taken, ['2030-04-03']), false);
  assert.equal(slotsFree(taken, slotsOf('2030-04-02', 600, 660)), false);
  assert.equal(slotsFree(taken, slotsOf('2030-04-03', 690, 780)), false);
  assert.equal(slotsFree(taken, slotsOf('2030-04-03', 720, 780)), true);
});

test('the warehouse makes the units: new ones by the day at their price, settings kept, the price follows the warehouse', () => {
  const first = mergeUnits([], [{ item: 'car_abc', name: 'كيا', photo: 'https://x/1.jpg', price: 40, currency: '$' }]);
  assert.equal(first[0].id, unitIdOf('car_abc'));
  assert.equal(first[0].dayPrice, 40);
  const tuned = [{ ...first[0], byHour: true, hourPrice: 8, dayPrice: 45 }];
  const again = mergeUnits(tuned, [{ item: 'car_abc', name: 'كيا ريو', photo: '', price: 40, currency: '$' }, { item: 'p_x', name: 'خيمة', photo: '', price: 5, currency: '$' }]);
  assert.equal(again.length, 2);
  assert.equal(again[0].name, 'كيا ريو');
  assert.equal(again[0].dayPrice, 45); // the owner's own day price stays
  assert.equal(again[0].hourPrice, 8);
  assert.equal(mergeUnits(again, [{ item: 'car_abc', name: 'كيا ريو', photo: '', price: 60, currency: '$' }])[0].dayPrice, 60);
  // a schedule keeps them through its normalizing
  const s = normalizeSchedule({ type: 'stay', rental: true, rooms: again, extras, termsOn: true, terms: 'بنود' });
  assert.equal((s.rooms[0] as any).hourPrice, 8);
  assert.equal(s.extras.length, 3);
  assert.equal(s.terms, 'بنود');
});

// ---- the server ----
process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ private_key: 'x' });
users['own9'] = { email: 'owner9@example.com' };
const inD = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
store.set('bookingSettings/own9/pages/rental', {
  payments: { currency: '$', wallets: { syriatel: { enabled: true, account: '0933000111' } } },
  schedules: [{
    id: 'rental', name: 'التأجير', type: 'stay', rental: true, minNights: 1, maxNights: 10, daysAhead: 60, workStart: '09:00', workEnd: '23:00',
    termsOn: true, terms: 'الشروط: لا تأخير.', depositOn: true, depositType: 'percent', depositValue: 50,
    extras: [{ id: 'e1', name: 'كرسي أطفال', price: 2, per: 'unit', units: [] }],
    rooms: [{ id: 'u1', name: 'صالة الياسمين', item: 'p_hall', byDay: true, byHour: true, dayPrice: 100, hourPrice: 20, currency: '$', minHours: 1, maxHours: 8 }],
  }],
});
const proof = { wallet: 'syriatel', txn: 'TX12345', screenshot: '' };
const rbook = async (extra: any = {}) => {
  const body = { action: 'create', owner: 'own9', project: 'rental', schedule: 'rental', pageName: 'تأجير', date: inD(5), startMin: 0, slot: 'x', meetingType: '', name: 'ليلى', phone: '0933123456', email: '', needsConfirmation: true, room: 'u1', acceptTerms: true, deposit: proof, ...extra };
  const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', body: JSON.stringify(body) }));
  return { s: r.status, ...(await r.json()) };
};

test('a rental by the hour is priced on the server, keeps the terms, and blocks the same hours and the whole day', async () => {
  assert.equal((await rbook({ rent: { by: 'hour', start: 600, hours: 2 }, acceptTerms: false })).error, 'terms_required');
  assert.equal((await rbook({ rent: { by: 'hour', start: 600, hours: 2 }, deposit: undefined })).error, 'deposit_required');
  const ok = await rbook({ rent: { by: 'hour', start: 600, hours: 2, extras: ['e1'] } });
  assert.equal(ok.s, 200);
  const row = store.get(`bookings/own9/items/${ok.id}`);
  assert.equal(row.price.total, 44);
  assert.equal(row.deposit.amount, 22);
  assert.equal(row.terms, 'الشروط: لا تأخير.');
  assert.ok(row.termsAt);
  assert.equal(row.rentBy, 'hour');
  assert.equal((await rbook({ rent: { by: 'hour', start: 660, hours: 2 } })).error, 'taken');
  assert.equal((await rbook({ rent: { by: 'day' }, checkOut: inD(6) })).error, 'taken');
  assert.equal((await rbook({ rent: { by: 'hour', start: 720, hours: 2 } })).s, 200);
  assert.equal((await rbook({ rent: { by: 'hour', start: 1320, hours: 2 } })).error, 'bad_rent'); // after closing
});

test('a rental by the day blocks its days for hours too, and a cancelled one frees them', async () => {
  const ok = await rbook({ date: inD(8), checkOut: inD(10), rent: { by: 'day' } });
  assert.equal(ok.s, 200);
  assert.equal(store.get(`bookings/own9/items/${ok.id}`).price.total, 200);
  assert.equal((await rbook({ date: inD(9), rent: { by: 'hour', start: 600, hours: 1 } })).error, 'taken');
  tokens['tk9'] = { uid: 'own9' };
  const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', headers: { authorization: 'Bearer tk9' }, body: JSON.stringify({ action: 'status', owner: 'own9', id: ok.id, status: 'cancelled' }) }));
  assert.equal(r.status, 200);
  assert.equal((await rbook({ date: inD(9), rent: { by: 'hour', start: 600, hours: 1 } })).s, 200);
  // the hours of the 5th are kept when another booking is saved
  assert.equal(store.get('bookingRooms/own9_rental_rental_u1').slots.filter((x: string) => x.startsWith(inD(5))).length, 8);
});

// ---- periods of days and fixed dates ----
const packs = normalizeUnit({
  byDay: true, dayPrice: 50, currency: '$',
  periods: [
    { id: 'w', name: 'أسبوع', kind: 'length', days: 7, price: 300 },
    { id: 'eid', name: 'العيد', kind: 'dates', from: '2030-06-10', to: '2030-06-14', price: 180 },
    { id: 'bad', name: 'ناقص', kind: 'dates', from: '2030-06-10', to: '2030-06-10', price: 1 },
  ],
});

test('a period of days or fixed dates is priced whole and takes its days', () => {
  assert.equal(packs.periods.length, 2); // the one with no days between is left out
  const w = quote(packs, [], 'u1', { by: 'period', date: '2030-05-01', period: 'w' })!;
  assert.equal(w.total, 300);
  assert.equal(w.nights.length, 7);
  assert.equal(w.nights[6], '2030-05-07');
  const e = quote(packs, [], 'u1', { by: 'period', date: '2030-06-10', period: 'eid' })!;
  assert.equal(e.total, 180);
  assert.equal(e.nights.length, 4);
  assert.equal(quote(packs, [], 'u1', { by: 'period', date: '2030-06-11', period: 'eid' }), null); // fixed dates start on their day
});

test('a rental period of days is booked and freed as days', async () => {
  store.set('bookingSettings/own9/pages/rental-packs', {
    payments: { currency: '$', wallets: { syriatel: { enabled: true, account: '0933000111' } } },
    schedules: [{ id: 'rental', name: 'التأجير', type: 'stay', rental: true, minNights: 1, maxNights: 10, daysAhead: 60, rooms: [{ id: 'u1', name: 'خيمة', ...packs, item: 'p_tent' }] }],
  });
  const book = async (extra: any = {}) => {
    const body = { action: 'create', owner: 'own9', project: 'rental-packs', schedule: 'rental', pageName: 'تأجير', date: inD(5), startMin: 0, slot: 'x', meetingType: '', name: 'ليلى', phone: '0933123456', email: '', needsConfirmation: true, room: 'u1', deposit: proof, ...extra };
    const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', body: JSON.stringify(body) }));
    return { s: r.status, ...(await r.json()) };
  };
  const ok = await book({ rent: { by: 'period', period: 'w' } });
  assert.equal(ok.s, 200);
  const row = store.get(`bookings/own9/items/${ok.id}`);
  assert.equal(row.price.total, 300);
  assert.equal(row.nights, 7);
  assert.equal(row.checkOut, new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10));
  assert.equal((await book({ date: inD(8), checkOut: inD(9), rent: { by: 'day' } })).error, 'taken');
  assert.equal((await book({ date: inD(12), checkOut: inD(13), rent: { by: 'day' } })).s, 200);
});

// ---- availability ----
const avail = normalizeUnit({
  byDay: true, byHour: true, dayPrice: 50, hourPrice: 10, currency: '$', minHours: 1, maxHours: 8,
  avail: [
    { id: 'a1', allow: true, kind: 'dates', from: '2030-06-01', to: '2030-09-30' },
    { id: 'a2', allow: false, kind: 'days', days: ['friday'] },
    { id: 'a3', allow: true, kind: 'hours', from: '10:00', to: '18:00' },
    { id: 'a4', allow: false, kind: 'dates', from: '2030-07-10', to: '2030-07-12' },
    { id: 'bad', allow: true, kind: 'dates', from: '2030-09-30', to: '2030-09-01' },
  ],
});

test('availability: allowed dates, hours and weekdays limit the rental, blocked ones are left out', () => {
  assert.equal(avail.avail.length, 4); // the rule with reversed dates is left out
  // 2030-06-03 is a Monday: inside the season
  assert.ok(quote(avail, [], 'u1', { by: 'day', date: '2030-06-03', checkOut: '2030-06-05' }));
  assert.equal(quote(avail, [], 'u1', { by: 'day', date: '2030-05-30', checkOut: '2030-06-02' }), null); // starts before the season
  assert.equal(quote(avail, [], 'u1', { by: 'day', date: '2030-06-06', checkOut: '2030-06-08' }), null); // takes Friday 7th
  assert.equal(quote(avail, [], 'u1', { by: 'day', date: '2030-07-09', checkOut: '2030-07-11' }), null); // takes a blocked date
  assert.ok(quote(avail, [], 'u1', { by: 'hour', date: '2030-06-03', start: 600, hours: 8 })); // 10:00-18:00
  assert.equal(quote(avail, [], 'u1', { by: 'hour', date: '2030-06-03', start: 540, hours: 2 }), null); // before 10:00
  assert.equal(quote(avail, [], 'u1', { by: 'hour', date: '2030-06-03', start: 960, hours: 3 }), null); // after 18:00
  assert.equal(quote(avail, [], 'u1', { by: 'hour', date: '2030-06-07', start: 600, hours: 2 }), null); // a Friday
  // days rules don't apply to hours of the day, and hours rules don't apply to whole days
  assert.ok(quote(avail, [], 'u1', { by: 'day', date: '2030-06-03', checkOut: '2030-06-04' }));
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/booking.ts';
import { store } from './fakeAdmin.ts';
import { users } from './fakeAdmin.ts';
import { quote, unitOf } from '../src/services/rentalBooking.ts';
import { normalizeSchedule } from '../src/services/bookingSettings.ts';
import { createEmptyHotelAdmin, normalizeHotelAdmin, stayRoomsOf } from '../src/components/hotel/hotelTypes.ts';
import { buildRentalPaper, paperLabel } from '../src/components/rental/rentalContract.ts';
import { DEFAULT_TERMS } from '../src/services/rentalBooking.ts';

const inD = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

test('nights are priced by the room type, with a special price for a date and the extras by night', () => {
  const room = { id: 'r1', name: 'غرفة 101', capacity: 2, price: '', photo: '', item: 't1', dayPrice: 100, currency: '$', prices: [{ id: 's1', kind: 'dates', for: 'day', days: [], from: '2030-05-02', to: '2030-05-02', price: 150 }] };
  const extras = [{ id: 'e1', name: 'فطور', price: 5, per: 'unit' as const, units: [] }, { id: 'e2', name: 'نقل من المطار', price: 20, per: 'once' as const, units: [] }];
  const q = quote(unitOf(room as any), extras, 'r1', { by: 'day', date: '2030-05-01', checkOut: '2030-05-04', extras: ['e1', 'e2'] }, { night: true })!;
  assert.equal(q.nights.length, 3);
  assert.equal(q.total, 100 + 150 + 100 + 15 + 20);
  assert.match(q.lines[0].label, /ليلة|ليالٍ|ليلتان/);
  assert.ok(!q.lines.some((l) => /يوم|أيام/.test(l.label)));
});

test('the hotel keeps the room type, the price and the special prices in the schedule', () => {
  const d = createEmptyHotelAdmin();
  d.shop.products = [{ id: 't1', name: 'مزدوجة', price: 80, currency: '$', images: [], published: true }] as any;
  d.rooms = [{ id: 'r1', number: '101', floor: '', type: 't1', closed: false }];
  d.specials = { t1: [{ id: 's1', kind: 'days', for: 'day', days: ['friday'], from: '', to: '', price: 99 }] as any };
  const n = normalizeHotelAdmin(JSON.parse(JSON.stringify(d)));
  assert.equal(n.specials.t1[0].price, 99);
  const s = normalizeSchedule({ type: 'stay', rooms: stayRoomsOf(n), extras: [{ id: 'e1', name: 'فطور', price: 5, per: 'unit' }], termsOn: true, terms: 'شروط' });
  assert.equal((s.rooms[0] as any).item, 't1');
  assert.equal((s.rooms[0] as any).dayPrice, 80);
  assert.equal((s.rooms[0] as any).prices.length, 1);
  assert.equal(s.extras.length, 1);
  assert.equal(s.terms, 'شروط');
});

process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ private_key: 'x' });
users['own8'] = { email: 'owner8@example.com' };
store.set('bookingSettings/own8/pages/hotel', {
  payments: { currency: '$', wallets: { syriatel: { enabled: true, account: '0933000111' } } },
  schedules: [{
    id: 'stay', name: 'حجز الغرف', type: 'stay', minNights: 1, maxNights: 10, daysAhead: 60, termsOn: true, terms: 'الشروط: الهوية عند الوصول.',
    depositOn: true, depositType: 'percent', depositValue: 50, roomChoice: 'auto',
    extras: [{ id: 'e1', name: 'فطور', price: 5, per: 'unit', units: [] }],
    rooms: [
      { id: 'r1', name: 'غرفة 101 · مزدوجة', capacity: 2, price: '100 $ / ليلة', photo: '', item: 't1', dayPrice: 100, currency: '$', prices: [{ id: 's1', kind: 'dates', for: 'day', from: inD(6), to: inD(6), price: 150 }] },
      { id: 'r2', name: 'غرفة 201 · جناح', capacity: 4, price: '200 $ / ليلة', photo: '', item: 't2', dayPrice: 200, currency: '$' },
      { id: 'r3', name: 'غرفة قديمة', capacity: 2, price: '30 $', photo: '' },
    ],
  }],
});
const proof = { wallet: 'syriatel', txn: 'TX12345', screenshot: '' };
const hbook = async (extra: any = {}) => {
  const body = { action: 'create', owner: 'own8', project: 'hotel', schedule: 'stay', pageName: 'فندق الياسمين', date: inD(5), startMin: 0, slot: 'x', meetingType: '', name: 'سامر', phone: '0933123456', email: '', needsConfirmation: true, checkOut: inD(8), partySize: 2, acceptTerms: true, deposit: proof, ...extra };
  const r = await handler.fetch(new Request('http://x/api/booking', { method: 'POST', body: JSON.stringify(body) }));
  return { s: r.status, ...(await r.json()) };
};

test('a hotel stay needs the terms, is priced on the server, and keeps the terms with the booking', async () => {
  assert.equal((await hbook({ acceptTerms: false })).error, 'terms_required');
  assert.equal((await hbook({ deposit: undefined })).error, 'deposit_required');
  const ok = await hbook({ roomType: 't1', stayExtras: ['e1'] });
  assert.equal(ok.s, 200);
  const row = store.get(`bookings/own8/items/${ok.id}`);
  // nights inD(5), inD(6) (special 150), inD(7): 100 + 150 + 100 + breakfast 3 nights x 5
  assert.equal(row.price.total, 365);
  assert.equal(row.deposit.amount, 182.5);
  assert.equal(row.roomId, 'r1');
  assert.equal(row.hotel, true);
  assert.equal(row.terms, 'الشروط: الهوية عند الوصول.');
  assert.ok(row.termsAt);
});

test('the room type decides the room, the same nights are not given twice, and the old text price still works', async () => {
  // r1 is taken for those nights: type t1 has no other room
  assert.equal((await hbook({ roomType: 't1' })).error, 'taken');
  const suite = await hbook({ roomType: 't2', partySize: 3 });
  assert.equal(suite.s, 200);
  assert.equal(store.get(`bookings/own8/items/${suite.id}`).roomId, 'r2');
  assert.equal(store.get(`bookings/own8/items/${suite.id}`).price.total, 600);
  // the old room without a nightly price is priced from its text price
  const old = await hbook({ room: 'r3' });
  assert.equal(old.s, 200);
  assert.equal(store.get(`bookings/own8/items/${old.id}`).price, undefined);
  assert.equal(store.get(`bookings/own8/items/${old.id}`).deposit.amount, 45);
  // a stay longer than the allowed nights is refused
  assert.equal((await hbook({ date: inD(20), checkOut: inD(40) })).error, 'bad_nights');
});

test('the hotel prints the contract and the room record in its own words', () => {
  const b: any = {
    id: 'abcdef123456', owner: 'o', project: 'hotel', pageName: 'فندق الياسمين', date: '2030-04-04', startMin: 0, slot: 'x', meetingType: '', name: 'سامر', phone: '0933', email: '', address: '', desc: '',
    status: 'confirmed', createdAt: '2030-04-01T10:00:00Z', hotel: true, roomName: 'غرفة 101', checkOut: '2030-04-07', nights: 3, partySize: 2,
    price: { lines: [{ label: '3 ليالٍ × 100', amount: 300 }], total: 300, currency: '$' },
  };
  const c = buildRentalPaper(b, 'contract');
  assert.match(c, /عقد إقامة/);
  assert.match(c, /النزيل/);
  assert.match(c, /3 ليالٍ/);
  assert.match(c, /عدد الضيوف/);
  assert.ok(!c.includes('المستأجر'), 'no rental words');
  assert.match(c, new RegExp(DEFAULT_TERMS.hotel.split('\n')[0].slice(3, 20)));
  assert.match(buildRentalPaper(b, 'handover'), /محضر استلام وتسليم الغرفة/);
  assert.equal(paperLabel('contract', { hotel: false }), 'عقد إيجار');
});

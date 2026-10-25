import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/booking.ts';
import { store, users } from './fakeAdmin.ts';

process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ private_key: 'x' });
users['own1'] = { email: 'owner@example.com' };
store.set('team/own1/people/pa1', { name: 'د. سارة', takesBookings: true, email: 'sara@example.com' });
store.set('team/own1/people/pb2', { name: 'سامر', takesBookings: false, email: 'samer@example.com' });

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

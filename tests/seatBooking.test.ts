import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canTake, dayPlus, normalizeSessions, openSessions, seatsLeft } from '../src/services/seatBooking.ts';

const sessions = normalizeSessions([
  { id: 'b', name: 'مساء', date: '2026-11-02', startMin: 1080, seats: 8 },
  { id: 'a', name: 'صباح', date: '2026-11-02', startMin: 540, seats: 10, price: '20$' },
  { id: 'c', name: '', date: '2026-11-03', seats: 5 },
  { id: 'a', name: 'مكرر', date: '2026-11-04', seats: 5 },
  { id: 'd', name: 'بلا تاريخ', date: 'x', seats: 5 },
]);

test('only named, dated sessions with a unique id are kept, soonest first', () => {
  assert.deepEqual(sessions.map((s) => s.id), ['a', 'b']);
});

test('seats left and the last seats', () => {
  assert.equal(seatsLeft(sessions[0], 4), 6);
  assert.equal(seatsLeft(sessions[0], 99), 0);
  assert.equal(seatsLeft(sessions[0], undefined), 10);
  assert.equal(canTake(sessions[0], 8, 2), true);
  assert.equal(canTake(sessions[0], 8, 3), false);
  assert.equal(canTake(sessions[0], 0, 0), false);
});

test('only upcoming sessions inside the booking window are open', () => {
  assert.deepEqual(openSessions(sessions, '2026-11-03', '2026-12-01'), []);
  assert.equal(openSessions(sessions, '2026-11-02', dayPlus('2026-11-02', 30)).length, 2);
});

test('a course keeps its end date only when it is after the start', () => {
  const [a, b, c] = normalizeSessions([
    { id: 'a', name: 'كورس', date: '2026-11-01', endDate: '2026-11-20', seats: 5 },
    { id: 'b', name: 'خطأ', date: '2026-11-05', endDate: '2026-11-01', seats: 5 },
    { id: 'c', name: 'وحدة', date: '2026-11-06', seats: 5 },
  ]);
  assert.equal(a.endDate, '2026-11-20');
  assert.equal(b.endDate, '');
  assert.equal(c.endDate, '');
});

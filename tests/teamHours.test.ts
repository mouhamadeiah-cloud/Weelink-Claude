import { test } from 'node:test';
import assert from 'node:assert/strict';
import { personWorks } from '../src/services/teamHours.ts';

test('a person without hours follows the schedule', () => {
  assert.equal(personWorks(undefined, '2026-10-25', 600), true);
  assert.equal(personWorks({ workingDays: [], workStart: '', workEnd: '' }, '2026-10-25', 1200), true);
});

test('their own days and hours limit the times they take', () => {
  // 2026-10-25 is a Sunday, 2026-10-26 a Monday
  const h = { workingDays: ['monday', 'tuesday'], workStart: '10:00', workEnd: '14:00' };
  assert.equal(personWorks(h, '2026-10-25', 660), false);
  assert.equal(personWorks(h, '2026-10-26', 660), true);
  assert.equal(personWorks(h, '2026-10-26', 599), false);
  assert.equal(personWorks(h, '2026-10-26', 840), false);
  assert.equal(personWorks(h, '2026-10-26', 839), true);
});

import { cleanRota, shiftsOn } from '../src/services/teamHours.ts';

// anchor 2026-10-25 is a Sunday: week 1 = 25 Oct–31 Oct, week 2 = 1–7 Nov
const rota2 = cleanRota({
  weeks: 2,
  anchor: '2026-10-27',
  plan: [{ monday: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }] }, { monday: [{ start: '12:00', end: '18:00' }], tuesday: [{ start: '09:00', end: '10:00' }] }],
  exceptions: { '2026-11-09': [], '2026-11-16': [{ start: '08:00', end: '09:00' }] },
})!;

test('a two-week rota alternates its weeks and has more than one shift a day', () => {
  assert.deepEqual(shiftsOn(rota2, '2026-10-26').map((s) => s.start), ['09:00', '16:00']);
  assert.deepEqual(shiftsOn(rota2, '2026-11-02').map((s) => s.start), ['12:00']);
  assert.deepEqual(shiftsOn(rota2, '2026-11-09').length, 0); // exception: off (it would be week 1's Monday)
  assert.deepEqual(shiftsOn(rota2, '2026-11-16').map((s) => s.start), ['08:00']);
  assert.deepEqual(shiftsOn(rota2, '2026-10-19').map((s) => s.start), ['12:00']); // before the anchor: week 2
  assert.equal(shiftsOn(rota2, '2026-10-28').length, 0);
});

test('personWorks follows the rota and ignores the simple fields', () => {
  const h = { workingDays: ['sunday'], workStart: '', workEnd: '', rota: rota2 };
  assert.equal(personWorks(h, '2026-10-26', 600), true);
  assert.equal(personWorks(h, '2026-10-26', 14 * 60), false); // between the shifts
  assert.equal(personWorks(h, '2026-10-26', 16 * 60), true);
  assert.equal(personWorks(h, '2026-10-25', 600), false);
  assert.equal(personWorks(h, '2026-11-09', 600), false);
});

test('a bad rota is cleaned or dropped', () => {
  assert.equal(cleanRota({ weeks: 3 }), null);
  const r = cleanRota({ weeks: 7, anchor: '2026-10-25', plan: [{ monday: [{ start: '10:00', end: '09:00' }, { start: '25:00', end: '26:00' }, { start: '09:00', end: '10:00' }] }], exceptions: { 'bad': [], '2026-11-01': [] } })!;
  assert.equal(r.weeks, 1);
  assert.deepEqual(r.plan[0].monday, [{ start: '09:00', end: '10:00' }]);
  assert.deepEqual(Object.keys(r.exceptions), ['2026-11-01']);
});

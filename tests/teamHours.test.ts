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

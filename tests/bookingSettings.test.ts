import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSchedule, normalizeSettings, scheduleFor, scheduleFromElement } from '../src/services/bookingSettings';

test('a booking element made before the admin settings keeps what it had', () => {
  const s = scheduleFromElement({
    calendarTitle: 'عيادة', calendarWorkingDays: ['sunday', 'monday'], calendarWorkStart: '10:00', calendarWorkEnd: '18:30',
    calendarInterval: '60', calendarNeedsConfirmation: false, calendarMeetingTypes: ['personal', 'whatsapp'],
  } as any);
  assert.equal(s.id, 'main');
  assert.equal(s.name, 'عيادة');
  assert.deepEqual(s.workingDays, ['sunday', 'monday']);
  assert.equal(s.workStart, '10:00');
  assert.equal(s.interval, '60');
  assert.equal(s.needsConfirmation, false);
  assert.deepEqual(s.meetingTypes, ['personal', 'whatsapp']);
  // an element always showed the 12:00-13:00 break unless it set its own
  assert.equal(s.breakStart, '12:00');
});

test('settings read from Firestore are cleaned up', () => {
  const s = normalizeSchedule({ id: 'Bad Id!', workStart: '25:00', interval: 'x', daysAhead: 9999, minNoticeHours: -4, workingDays: ['friday', 'nope'], meetingTypes: [] }, 'main');
  assert.equal(s.id, 'main');
  assert.equal(s.workStart, '09:00');
  assert.equal(s.interval, '30');
  assert.equal(s.daysAhead, 365);
  assert.equal(s.minNoticeHours, 0);
  assert.deepEqual(s.workingDays, ['friday']);
  assert.deepEqual(s.meetingTypes, ['phone']);
});

test('an element books with its own schedule, or the first one', () => {
  const settings = normalizeSettings({ schedules: [{ id: 'main', name: 'أ' }, { id: 's1', name: 'ب' }, { id: 's1', name: 'مكرر' }] })!;
  assert.equal(settings.schedules.length, 2);
  assert.equal(scheduleFor(settings, 's1')!.name, 'ب');
  assert.equal(scheduleFor(settings, 'gone')!.id, 'main');
  assert.equal(scheduleFor(null, 's1'), null);
  assert.equal(normalizeSettings({ schedules: [] }), null);
});

test('a schedule books with specialists only when told to', () => {
  assert.equal(normalizeSchedule({}, 'main').specialists, 'none');
  assert.equal(normalizeSchedule({ specialists: 'choose' }, 'main').specialists, 'choose');
  assert.equal(normalizeSchedule({ specialists: 'first' }, 'main').specialists, 'first');
  assert.equal(normalizeSchedule({ specialists: 'anyone' }, 'main').specialists, 'none');
});

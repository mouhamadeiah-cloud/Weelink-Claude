import test from 'node:test';
import assert from 'node:assert/strict';
import { newRentalSchedule, newStaySchedule, normalizeSchedule, normalizeSettings, scheduleFor } from '../src/services/bookingSettings';

test('a rental is a stay schedule flagged rental, kept apart from the hotel rooms', () => {
  const settings = normalizeSettings({ schedules: [{ ...newStaySchedule() }, { ...newRentalSchedule() }] })!;
  assert.equal(settings.schedules.length, 2);
  assert.equal(scheduleFor(settings, 'rental', 'stay', true)?.rental, true);
  assert.equal(scheduleFor(settings, undefined, 'stay', true)?.id, 'rental');
  assert.equal(scheduleFor(settings, undefined, 'stay', false)?.id, 'stay');
  assert.equal(scheduleFor(settings, 'rental', 'stay', false)?.id, 'stay');
});

test('only a stay can be a rental', () => {
  assert.equal(normalizeSchedule({ type: 'table', rental: true }).rental, false);
  assert.equal(normalizeSchedule({ type: 'stay', rental: true }).rental, true);
  assert.equal(normalizeSchedule({ type: 'stay' }).rental, false);
});

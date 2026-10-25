import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gridSlots, blockOf, timeLabel, slotText, bookingsOfDay } from '../src/services/bookingGrid';

test('slots run from opening to closing in steps', () => {
  assert.deepEqual(gridSlots('12:00', '15:00', 90), [720, 810]);
  assert.deepEqual(gridSlots('09:00', '10:00', 30), [540, 570]);
  assert.deepEqual(gridSlots('10:00', '09:00', 30), []);
});

test('a booking spans the slots it touches', () => {
  const slots = gridSlots('12:00', '18:00', 30);
  assert.deepEqual(blockOf(slots, 30, 720, 90), { from: 0, span: 3 });
  assert.deepEqual(blockOf(slots, 30, 735, 30), { from: 0, span: 2 });
  assert.equal(blockOf(slots, 30, 60, 30), null);
});

test('labels read like the visitor calendar', () => {
  assert.equal(timeLabel(570), '9:30 ص');
  assert.equal(timeLabel(720), '12:00 م');
  assert.equal(slotText(780, 90), '1:00 م - 2:30 م');
});

test('a day groups live bookings of one schedule by resource', () => {
  const b = (id: string, extra: object) => ({ id, date: '2026-10-30', status: 'confirmed', schedule: 'table', tableId: 't1', ...extra } as any);
  const out = bookingsOfDay([b('a', {}), b('b', { status: 'cancelled' }), b('c', { date: '2026-10-31' }), b('d', { schedule: undefined }), b('e', { tableId: 't2' })], '2026-10-30', 'table', (x) => x.tableId || '');
  assert.deepEqual(Object.keys(out).sort(), ['t1', 't2']);
  assert.equal(out.t1.length, 1);
});

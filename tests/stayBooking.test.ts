import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseRoom, nightsBetween, normalizeRooms } from '../src/services/stayBooking.ts';

const rooms = normalizeRooms([
  { id: 'a1', name: 'غرفة 101', capacity: 2 },
  { id: 'a2', name: 'غرفة 102', capacity: 4 },
  { id: 'a3', name: '', capacity: 4 },
  { id: 'a1', name: 'مكرر', capacity: 9 },
]);

test('only named rooms with a unique id are bookable', () => {
  assert.deepEqual(rooms.map((r) => r.id), ['a1', 'a2']);
});

test('a stay takes the nights from check-in up to, not including, check-out', () => {
  assert.deepEqual(nightsBetween('2026-10-30', '2026-11-02'), ['2026-10-30', '2026-10-31', '2026-11-01']);
  assert.deepEqual(nightsBetween('2026-11-02', '2026-11-02'), []);
  assert.deepEqual(nightsBetween('2026-11-03', '2026-11-02'), []);
  assert.deepEqual(nightsBetween('x', '2026-11-02'), []);
});

test('the smallest free room that fits the guests is chosen', () => {
  const n = nightsBetween('2026-11-01', '2026-11-03');
  assert.equal(chooseRoom(rooms, {}, { guests: 2, nights: n })?.id, 'a1');
  assert.equal(chooseRoom(rooms, {}, { guests: 3, nights: n })?.id, 'a2');
  assert.equal(chooseRoom(rooms, {}, { guests: 5, nights: n }), null);
});

test('a room taken on any night moves the stay to another room, then to none', () => {
  const n = nightsBetween('2026-11-01', '2026-11-03');
  assert.equal(chooseRoom(rooms, { a1: ['2026-11-02'] }, { guests: 2, nights: n })?.id, 'a2');
  assert.equal(chooseRoom(rooms, { a1: ['2026-11-02'], a2: ['2026-11-01'] }, { guests: 2, nights: n }), null);
  // check-out day is free for the next guest to check in
  assert.equal(chooseRoom(rooms, { a1: ['2026-10-30', '2026-10-31'] }, { guests: 2, nights: n })?.id, 'a1');
});

test('the visitor may wish for a room', () => {
  const n = nightsBetween('2026-11-01', '2026-11-03');
  assert.equal(chooseRoom(rooms, {}, { guests: 2, nights: n, roomId: 'a2' })?.id, 'a2');
  assert.equal(chooseRoom(rooms, {}, { guests: 3, nights: n, roomId: 'a1' }), null);
});

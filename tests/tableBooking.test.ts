import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseTable, coveredSlots, stepOf, tablesOfHalls } from '../src/services/tableBooking.ts';

const halls = [
  { id: 'h1', name: 'الداخلية', tables: [{ id: 't1', name: '1', seats: 2 }, { id: 't2', name: '2', seats: 4 }, { id: 't3', name: '', seats: 4 }] },
  { id: 'h2', name: 'الحديقة', tables: [{ id: 't4', name: 'ح1', seats: 6 }] },
];
const tables = tablesOfHalls(halls);
const wish = { party: 3, start: 720, duration: 90, step: 30 };

test('only named tables with seats are bookable', () => {
  assert.deepEqual(tables.map((t) => t.id), ['t1', 't2', 't4']);
});

test('a booking covers every start time from its start up to its end', () => {
  assert.deepEqual(coveredSlots(720, 90, 30), [720, 750, 780]);
  assert.equal(stepOf('manual', 20), 20);
  assert.equal(stepOf('day', 20), 60);
});

test('the smallest free table that seats the party is chosen', () => {
  assert.equal(chooseTable(tables, {}, wish)?.id, 't2');
  assert.equal(chooseTable(tables, {}, { ...wish, party: 1 })?.id, 't1');
});

test('an overlapping booking moves to the next table, then to none', () => {
  assert.equal(chooseTable(tables, { t2: [750] }, wish)?.id, 't4');
  assert.equal(chooseTable(tables, { t2: [750], t4: [780] }, wish), null);
  // a booking that ends exactly when this one starts does not block it
  assert.equal(chooseTable(tables, { t2: [630, 660, 690] }, wish)?.id, 't2');
});

test('the visitor may wish for a hall or a table', () => {
  assert.equal(chooseTable(tables, {}, { ...wish, hallId: 'h2' })?.id, 't4');
  assert.equal(chooseTable(tables, {}, { ...wish, tableId: 't1' }), null);
  assert.equal(chooseTable(tables, {}, { ...wish, party: 2, tableId: 't1' })?.id, 't1');
});

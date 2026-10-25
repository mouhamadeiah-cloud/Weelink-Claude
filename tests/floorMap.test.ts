import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutHall, canPlace, tableAt, firstFree, overlaps } from '../src/components/restaurant/floorMap';
import type { Hall } from '../src/components/restaurant/restaurantTypes';

const tb = (id: string, extra: object = {}) => ({ id, name: id, seats: 4, ...extra });

test('old hall without a map is laid out row by row without overlaps', () => {
  const hall: Hall = { id: 'h', name: 'H', tables: Array.from({ length: 10 }, (_, i) => tb(`t${i}`)) };
  const out = layoutHall(hall);
  assert.equal(out.cols, 8);
  assert.equal(out.tables[8].row, 1);
  assert.equal(out.tables[8].col, 0);
  assert.ok(out.rows! >= 2);
  for (let i = 0; i < out.tables.length; i++) for (let j = i + 1; j < out.tables.length; j++) {
    const a = out.tables[i], b = out.tables[j];
    assert.ok(!overlaps({ col: a.col!, row: a.row!, w: a.w!, h: a.h! }, { col: b.col!, row: b.row!, w: b.w!, h: b.h! }));
  }
});

test('tables with a valid place keep it; clashing ones move', () => {
  const hall: Hall = { id: 'h', name: 'H', cols: 4, rows: 3, tables: [tb('a', { col: 1, row: 1, w: 2, h: 1 }), tb('b', { col: 2, row: 1 }), tb('c', { col: 9, row: 0 })] };
  const out = layoutHall(hall);
  assert.deepEqual([out.tables[0].col, out.tables[0].row, out.tables[0].w], [1, 1, 2]);
  assert.notDeepEqual([out.tables[1].col, out.tables[1].row], [2, 1]);
  assert.ok(out.tables[2].col! < 4);
});

test('rows grow so every table fits; canPlace and tableAt respect merged squares', () => {
  const hall = layoutHall({ id: 'h', name: 'H', cols: 2, rows: 2, tables: Array.from({ length: 5 }, (_, i) => tb(`t${i}`)) });
  assert.equal(hall.rows, 3);
  const h2 = layoutHall({ id: 'h', name: 'H', cols: 4, rows: 3, tables: [tb('a', { col: 0, row: 0, w: 2, h: 2 })] });
  assert.equal(tableAt(h2, 1, 1)?.id, 'a');
  assert.equal(canPlace(h2, { col: 1, row: 0, w: 1, h: 1 }), false);
  assert.equal(canPlace(h2, { col: 2, row: 0, w: 2, h: 2 }), true);
  assert.equal(canPlace(h2, { col: 3, row: 0, w: 2, h: 1 }), false);
  assert.deepEqual(firstFree(h2), { col: 2, row: 0 });
});

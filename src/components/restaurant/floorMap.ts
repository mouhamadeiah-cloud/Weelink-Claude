// Floor map of a hall: a grid of big squares where each table sits on one square or on a rectangle of
// merged squares. Pure helpers shared by the hall editor, the cashier and (later) the booking board.
import type { Hall, RestTable } from './restaurantTypes';

export const DEFAULT_COLS = 8;
export const MIN_COLS = 2;
export const MAX_COLS = 20;
export const MIN_ROWS = 2;
export const MAX_ROWS = 30;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const int = (v: unknown, fallback: number) => (typeof v === 'number' && isFinite(v) ? Math.round(v) : fallback);

export interface Rect { col: number; row: number; w: number; h: number }

export const rectOf = (t: RestTable): Rect => ({ col: t.col ?? 0, row: t.row ?? 0, w: t.w ?? 1, h: t.h ?? 1 });

export const overlaps = (a: Rect, b: Rect) => a.col < b.col + b.w && b.col < a.col + a.w && a.row < b.row + b.h && b.row < a.row + a.h;

export const inside = (r: Rect, cols: number, rows: number) => r.col >= 0 && r.row >= 0 && r.w >= 1 && r.h >= 1 && r.col + r.w <= cols && r.row + r.h <= rows;

// Can a table of this rectangle sit in the hall (inside the grid, not on another table)?
export const canPlace = (hall: Hall, r: Rect, ignoreId?: string) =>
  inside(r, hall.cols ?? DEFAULT_COLS, hall.rows ?? MIN_ROWS) && !hall.tables.some((t) => t.id !== ignoreId && overlaps(rectOf(t), r));

export const tableAt = (hall: Hall, col: number, row: number) =>
  hall.tables.find((t) => overlaps(rectOf(t), { col, row, w: 1, h: 1 }));

// The first free square (row by row), or null when the grid is full.
export const firstFree = (hall: Hall): { col: number; row: number } | null => {
  const cols = hall.cols ?? DEFAULT_COLS;
  const rows = hall.rows ?? MIN_ROWS;
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) if (!tableAt(hall, col, row)) return { col, row };
  return null;
};

// Gives the hall a grid and every table a place. Tables that already have a valid, free place keep it;
// the others (old halls without a map) are laid out row by row, and the grid grows by rows as needed.
export const layoutHall = (hall: Hall): Hall => {
  const cols = clamp(int(hall.cols, DEFAULT_COLS), MIN_COLS, MAX_COLS);
  let rows = clamp(int(hall.rows, MIN_ROWS), MIN_ROWS, MAX_ROWS);
  const placed: RestTable[] = [];
  const loose: RestTable[] = [];
  for (const t of hall.tables) {
    const w = clamp(int(t.w, 1), 1, cols);
    const h = clamp(int(t.h, 1), 1, MAX_ROWS);
    const r: Rect = { col: int(t.col, -1), row: int(t.row, -1), w, h };
    if (t.col !== undefined && t.row !== undefined && inside(r, cols, MAX_ROWS) && !placed.some((p) => overlaps(rectOf(p), r))) placed.push({ ...t, ...r });
    else loose.push({ ...t, w, h });
  }
  for (const t of loose) {
    const w = t.w ?? 1;
    const h = t.h ?? 1;
    let spot: Rect | null = null;
    for (let row = 0; !spot; row++) {
      for (let col = 0; col + w <= cols; col++) {
        const r = { col, row, w, h };
        if (!placed.some((p) => overlaps(rectOf(p), r))) { spot = r; break; }
      }
    }
    placed.push({ ...t, ...spot });
  }
  for (const t of placed) rows = Math.max(rows, (t.row ?? 0) + (t.h ?? 1));
  const order = new Map(hall.tables.map((t, i) => [t.id, i]));
  placed.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return { ...hall, cols, rows: Math.min(rows, MAX_ROWS), tables: placed };
};

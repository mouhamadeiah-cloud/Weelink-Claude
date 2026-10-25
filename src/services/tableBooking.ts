// Table reservations for restaurants (Eyad, 25 Oct): a «طاولة» schedule books one of the restaurant's
// tables (الصالات والطاولات in its admin) for a party of N, for the schedule's booking length. The
// pure rules live here, used by the page (to show the free times) and by /api/booking (to decide).
//   bookingDays/{owner}_{project}_{date}[_{schedule}]  { tables: { [tableId]: [slot starts taken] } }
// A booking covers every start time (in the schedule's step) from its start up to its end, so two
// bookings of one table never overlap, and a table's day is one list of numbers.

import { layoutHall } from '../components/restaurant/floorMap.js';

export interface BookableTable {
  id: string;
  name: string;
  seats: number;
  hallId: string;
  hallName: string;
  // Its place on the hall's floor map (restaurant/floorMap.ts) and the map's size, for picking it by tapping
  col: number;
  row: number;
  w: number;
  h: number;
  hallCols: number;
  hallRows: number;
}

export type Occupancy = Record<string, number[]>;

// The start times a booking of `duration` minutes from `start` takes, in steps of `step`.
export const coveredSlots = (start: number, duration: number, step: number): number[] => {
  const out: number[] = [];
  for (let t = start; t < start + Math.max(duration, 1); t += Math.max(step, 1)) out.push(t);
  return out;
};

export const isFree = (taken: number[] | undefined, covers: number[]) => !taken || !covers.some((c) => taken.includes(c));

export interface TableWish {
  party: number;
  start: number;
  duration: number;
  step: number;
  hallId?: string; // only this hall
  tableId?: string; // only this table
}

// The table a party gets: the smallest free one that seats them (the first by the restaurant's own
// order among equals), inside the wished hall or table. null when nothing fits.
export const chooseTable = (tables: BookableTable[], occupancy: Occupancy, wish: TableWish): BookableTable | null => {
  const covers = coveredSlots(wish.start, wish.duration, wish.step);
  const fits = tables.filter((t) => t.seats >= wish.party && (!wish.hallId || t.hallId === wish.hallId) && (!wish.tableId || t.id === wish.tableId) && isFree(occupancy[t.id], covers));
  if (fits.length === 0) return null;
  return fits.reduce((best, t) => (t.seats < best.seats ? t : best));
};

// Whether any table is free for the wish at that start (the page greys out the others).
export const hasTable = (tables: BookableTable[], occupancy: Occupancy, wish: TableWish) => chooseTable(tables, occupancy, wish) !== null;

// Tables that seat the party, to choose from.
export const tablesFor = (tables: BookableTable[], party: number, hallId?: string) =>
  tables.filter((t) => t.seats >= party && (!hallId || t.hallId === hallId));

// The halls (with at least one table that seats the party).
export const hallsFor = (tables: BookableTable[], party: number) => {
  const seen = new Map<string, string>();
  for (const t of tables) if (t.seats >= party && !seen.has(t.hallId)) seen.set(t.hallId, t.hallName);
  return [...seen].map(([id, name]) => ({ id, name }));
};

// The tables of a restaurant's published halls (restaurants/{id}.menu.halls): named ones with seats.
export const tablesOfHalls = (halls: any): BookableTable[] =>
  (Array.isArray(halls) ? halls : []).flatMap((raw: any) => {
    const h = layoutHall({ id: String(raw?.id || ''), name: String(raw?.name || ''), cols: raw?.cols, rows: raw?.rows, tables: Array.isArray(raw?.tables) ? raw.tables : [] });
    return h.tables
      .filter((t) => typeof t.id === 'string' && typeof t.name === 'string' && t.name.trim() && Number(t.seats) > 0)
      .map((t) => ({
        id: t.id, name: String(t.name).trim(), seats: Math.round(Number(t.seats)), hallId: h.id, hallName: h.name,
        col: t.col ?? 0, row: t.row ?? 0, w: t.w ?? 1, h: t.h ?? 1, hallCols: h.cols ?? 8, hallRows: h.rows ?? 2,
      }));
  });

export const stepOf = (interval: string, intervalMinutes: number) => (interval === 'manual' ? intervalMinutes : ['10', '15', '30', '60'].includes(interval) ? Number(interval) : 60);

// The admin's booking grid (resources down the side, the day's times across): pure helpers.
// A resource is a table (restaurants) or a team person (appointments).
import type { Booking } from './bookings';

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// The start times of a day from the opening to the closing, one per `step` minutes.
export const gridSlots = (workStart: string, workEnd: string, step: number): number[] => {
  const out: number[] = [];
  const s = Math.max(5, Math.round(step) || 60);
  for (let t = toMin(workStart); t < toMin(workEnd) && out.length < 200; t += s) out.push(t);
  return out;
};

// «9:30 ص»
export const timeLabel = (min: number) => {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'ص' : 'م'}`;
};

// The slot text a booking carries («9:00 ص - 9:30 ص»), like the visitor's calendar writes it.
export const slotText = (start: number, duration: number) => `${timeLabel(start)} - ${timeLabel(start + duration)}`;

// Where a booking sits on the slots: the first slot it touches and how many it spans (null when outside).
export const blockOf = (slots: number[], step: number, startMin: number, durationMin: number): { from: number; span: number } | null => {
  const end = startMin + Math.max(durationMin, 1);
  const idx = slots.map((s, i) => (s < end && s + step > startMin ? i : -1)).filter((i) => i >= 0);
  return idx.length ? { from: idx[0], span: idx.length } : null;
};

// The live bookings of a day on a schedule, keyed by the resource ('' for a schedule without resources).
export const bookingsOfDay = (rows: Booking[], date: string, scheduleId: string, resourceOf: (b: Booking) => string): Record<string, Booking[]> => {
  const out: Record<string, Booking[]> = {};
  for (const b of rows) {
    if (b.date !== date || b.status === 'cancelled' || (b.schedule || 'main') !== scheduleId) continue;
    (out[resourceOf(b)] ||= []).push(b);
  }
  return out;
};

export const PERSON_COLORS = ['#1971C2', '#2F9E44', '#C2255C', '#7048E8', '#E8590C', '#0C8599', '#F08C00', '#868E96'];
export const colorOf = (index: number) => PERSON_COLORS[index % PERSON_COLORS.length];

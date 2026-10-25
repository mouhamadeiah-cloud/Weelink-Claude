// The owner's report of the bookings in a period (Eyad, 25 Oct): how many, of what kind, how many were
// cancelled, who was booked most, and the deposits received. Pure, so the page, the printout and the
// CSV all show the same numbers. The bookings are kept 3 months; the deposits (bookingDeposits) stay.
import type { Booking } from './bookings';

export type BookingKind = 'appointment' | 'table' | 'stay' | 'seats';

export const KIND_LABEL: Record<BookingKind, string> = { appointment: 'مواعيد', table: 'طاولات', stay: 'إقامة', seats: 'مقاعد وكورسات' };

export const kindOfBooking = (b: Booking): BookingKind => (b.sessionId ? 'seats' : b.roomId ? 'stay' : b.tableId ? 'table' : 'appointment');

export interface DepositLine {
  id: string;
  name: string;
  amount: number;
  currency: string;
  walletLabel: string;
  txn: string;
  bookingDate: string;
  date: string; // the day the owner confirmed it
  state: 'received' | 'cancelled';
}

export interface Count {
  label: string;
  value: number;
}

export interface BookingReport {
  total: number;
  byStatus: { new: number; confirmed: number; done: number; cancelled: number };
  cancelRate: number; // 0..1 of the bookings that were not waiting
  byKind: Count[];
  byDay: Count[]; // weekday names, busiest first
  byPerson: Count[]; // team people, most booked first
  guests: number; // people at tables, in stays and in seats
  nights: number;
  deposits: { currency: string; received: number; cancelled: number }[];
  depositLines: DepositLine[];
}

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const weekdayOf = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return DAYS[new Date(y, m - 1, d).getDay()];
};

const tally = (items: string[]): Count[] => {
  const m = new Map<string, number>();
  items.forEach((k) => m.set(k, (m.get(k) || 0) + 1));
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
};

// `from`/`to` are 'yyyy-mm-dd' (inclusive). Bookings count by the day of the booking itself, deposits
// by the day they were confirmed.
export const buildReport = (bookings: Booking[], deposits: DepositLine[], from: string, to: string): BookingReport => {
  const rows = bookings.filter((b) => b.date >= from && b.date <= to);
  const byStatus = { new: 0, confirmed: 0, done: 0, cancelled: 0 };
  rows.forEach((b) => {
    if (b.status in byStatus) byStatus[b.status] += 1;
  });
  const decided = rows.length - byStatus.new;
  const live = rows.filter((b) => b.status !== 'cancelled');
  const lines = deposits.filter((d) => d.date >= from && d.date <= to).sort((a, b) => b.date.localeCompare(a.date));
  const money = new Map<string, { received: number; cancelled: number }>();
  lines.forEach((d) => {
    const m = money.get(d.currency) || { received: 0, cancelled: 0 };
    m[d.state === 'received' ? 'received' : 'cancelled'] += d.amount;
    money.set(d.currency, m);
  });
  return {
    total: rows.length,
    byStatus,
    cancelRate: decided > 0 ? byStatus.cancelled / decided : 0,
    byKind: tally(rows.map((b) => KIND_LABEL[kindOfBooking(b)])),
    byDay: tally(live.map((b) => weekdayOf(b.date))),
    byPerson: tally(live.filter((b) => b.personName).map((b) => b.personName as string)),
    guests: live.reduce((s, b) => s + (b.partySize || 0), 0),
    nights: live.reduce((s, b) => s + (b.nights || 0), 0),
    deposits: [...money.entries()].map(([currency, v]) => ({ currency, ...v })),
    depositLines: lines,
  };
};

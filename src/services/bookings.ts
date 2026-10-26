// Appointments booked from the «حجز مواعيد» calendar on a page (Eyad, 13 Oct). The server
// (/api/booking) saves them and emails both sides; the day before, its daily cron reminds both
// sides, and bookings older than 3 months are deleted.
//   bookings/{owner}/items/{id}                 the booking; the owner and members read it
//   bookingDays/{owner}_{project}_{yyyy-mm-dd}  { taken: [startMin] }; anyone reads it
//   bookingSessions/{owner}_{project}_{schedule}_{session}  { taken: seats } of a session; anyone reads it
//   bookingDeposits/{owner}/items/{bookingId}  a confirmed deposit, kept for the accounts and the report; the owner and members read it
//   bookingRooms/{owner}_{project}_{schedule}_{room}  { nights: [yyyy-mm-dd] } of a hotel room; anyone reads it
import { createContext, useEffect, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { ProjectKey } from '../utils/projectKeys';
import type { DepositLine } from './bookingReport';

export type BookingStatus = 'new' | 'confirmed' | 'done' | 'cancelled';

export interface Booking {
  id: string;
  owner: string;
  project: ProjectKey;
  // The page's schedule («إعدادات الحجز») it was booked on; 'main' (or unset, before 24 Oct) is the first.
  schedule?: string;
  // A table booking (restaurants): how many people, and the table the server gave them.
  partySize?: number;
  tableId?: string;
  tableName?: string;
  hallName?: string;
  durationMin?: number;
  // A room stay (hotels): check-out date (the check-in is `date`), the nights, and the room the server gave them.
  checkOut?: string;
  nights?: number;
  roomId?: string;
  roomName?: string;
  rental?: boolean; // a rental (cars, equipment): the room is a unit, the nights are days
  hotel?: boolean; // a hotel project's room stay (priced per night, with extras and terms)
  // A rental by the hour or a period (rentalBooking.ts): the half hours it takes; its price, line by line;
  // with a driver or not; the extras; and the terms the visitor accepted, as they read them, and when.
  rentBy?: 'day' | 'hour' | 'period';
  slots?: string[];
  price?: { lines: { label: string; amount: number; note?: string }[]; total: number; currency: string };
  driver?: boolean;
  // A cart booking (several units at once): each unit with its own price; roomName joins their names.
  items?: { roomId: string; roomName: string; total: number; driver?: boolean }[];
  extras?: string[];
  terms?: string;
  termsAt?: string;
  // Seats in a session (courses, trips, events): the session, and how many seats were booked (partySize).
  sessionId?: string;
  sessionName?: string;
  endDate?: string; // a course's last day
  // The deposit the visitor paid; the booking waits (status 'new') while state is 'pending'.
  deposit?: { amount: number; currency: string; wallet: string; walletLabel: string; txn: string; screenshot: string; state: 'pending' | 'paid' | 'rejected' | 'expired'; at: string };
  // The team person it was booked with («فريق العمل»), when the schedule has specialists.
  person?: string;
  personName?: string;
  pageName: string;
  date: string; // yyyy-mm-dd, the business's own day
  startMin: number; // minutes from midnight
  slot: string; // as the visitor saw it: «9:00 ص - 9:30 ص»
  meetingType: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  desc: string;
  status: BookingStatus;
  createdAt: string;
}

// The page a calendar books on. `live` is false in the editor, where a booking is only a preview;
// the published page and the owner's own view of it save real bookings.
export interface BookingPage {
  owner: string;
  project: ProjectKey;
  pageName: string;
  live: boolean;
}
export const BookingPageContext = createContext<BookingPage | null>(null);

export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// The times already booked on a day.
// A schedule other than the page's first ('main') keeps its own (api/booking.ts).
// A person of «فريق العمل» has their own times on the schedule.
// A «طاولة» schedule's day: the taken start times of each table.
export const readTakenTables = async (owner: string, project: ProjectKey, date: string, schedule = 'main'): Promise<Record<string, number[]>> => {
  const snap = await getDoc(doc(db, 'bookingDays', `${owner}_${project}_${date}${schedule === 'main' ? '' : `_${schedule}`}`));
  const t = snap.data()?.tables;
  if (!t || typeof t !== 'object') return {};
  return Object.fromEntries(Object.entries(t).map(([id, v]) => [id, Array.isArray(v) ? v.filter((n) => typeof n === 'number') : []]));
};

// A «مقاعد» schedule's session: the seats already booked.
export const readSessionTaken = async (owner: string, project: ProjectKey, schedule: string, session: string): Promise<number> => {
  const snap = await getDoc(doc(db, 'bookingSessions', `${owner}_${project}_${schedule}_${session}`));
  const n = Number(snap.data()?.taken);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// A «إقامة» schedule's room: the nights already taken.
export const readRoomNights = async (owner: string, project: ProjectKey, schedule: string, room: string): Promise<string[]> => {
  const snap = await getDoc(doc(db, 'bookingRooms', `${owner}_${project}_${schedule}_${room}`));
  const nights = snap.data()?.nights;
  return Array.isArray(nights) ? nights.filter((n) => typeof n === 'string') : [];
};

// A rental unit: the days and the half hours already taken (rentalBooking.ts).
export const readUnitTaken = async (owner: string, project: ProjectKey, schedule: string, room: string): Promise<{ nights: string[]; slots: string[] }> => {
  const data = (await getDoc(doc(db, 'bookingRooms', `${owner}_${project}_${schedule}_${room}`))).data();
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((n): n is string => typeof n === 'string') : []);
  return { nights: list(data?.nights), slots: list(data?.slots) };
};

export const readTaken = async (owner: string, project: ProjectKey, date: string, schedule = 'main', person = ''): Promise<number[]> => {
  const snap = await getDoc(doc(db, 'bookingDays', `${owner}_${project}_${date}${schedule === 'main' ? '' : `_${schedule}`}${person ? `_p${person}` : ''}`));
  const taken = snap.data()?.taken;
  return Array.isArray(taken) ? taken.filter((n) => typeof n === 'number') : [];
};

export type NewBooking = Omit<Booking, 'id' | 'status' | 'createdAt' | 'deposit' | 'tableName' | 'hallName' | 'durationMin' | 'roomName' | 'nights' | 'rental' | 'hotel' | 'rentBy' | 'slots' | 'price' | 'driver' | 'extras' | 'terms' | 'termsAt'> & {
  needsConfirmation: boolean; hall?: string; room?: string; session?: string; deposit?: { wallet: string; txn: string; screenshot: string };
  // A rental unit's booking (rentalBooking.ts RentWish), and the visitor's yes to the terms.
  rent?: { by: 'day' | 'hour' | 'period'; start?: number; hours?: number; period?: string; driver?: boolean; extras?: string[] };
  acceptTerms?: boolean;
  // A hotel stay: the room type wished (a hotel room's `item`) and the extras ticked.
  roomType?: string;
  stayExtras?: string[];
};

// 'taken': somebody booked that time a moment before.
export const createBooking = async (b: NewBooking): Promise<{ id: string; status: BookingStatus; deposit?: boolean; tableName?: string; hallName?: string; roomName?: string } | { error: string; reason?: string }> => {
  try {
    const res = await fetch('/api/booking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...b }) });
    const out = await res.json().catch(() => ({}));
    return res.ok ? out : { error: out.error || 'error', reason: out.reason || `http_${res.status}` };
  } catch {
    return { error: 'offline' };
  }
};

// The owner books on the admin's grid for a customer who called or walked in: confirmed at once, no emails.
// `tableId` / `person` pin the table or the team person the cell belongs to.
export const createOwnerBooking = async (b: Omit<NewBooking, 'needsConfirmation' | 'email' | 'address' | 'desc' | 'meetingType' | 'pageName'> & { tableId?: string; durationMin?: number }): Promise<{ id: string } | { error: string }> => {
  const user = auth.currentUser;
  if (!user) return { error: 'signed_out' };
  try {
    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify({ action: 'owner-create', pageName: '', meetingType: 'personal', ...b }),
    });
    const out = await res.json().catch(() => ({}));
    return res.ok ? out : { error: out.error || 'error' };
  } catch {
    return { error: 'offline' };
  }
};

export const setBookingStatus = async (owner: string, id: string, status: Exclude<BookingStatus, 'new'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('signed_out');
  const res = await fetch('/api/booking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
    body: JSON.stringify({ action: 'status', owner, id, status }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'error');
};

// The page's bookings, live, soonest first.
export const watchBookings = (owner: string, project: ProjectKey, onData: (rows: Booking[]) => void, onError: () => void) =>
  onSnapshot(
    query(collection(db, 'bookings', owner, 'items'), where('project', '==', project)),
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, 'id'>) }));
      rows.sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin);
      onData(rows);
    },
    onError
  );

// The page's confirmed deposits, live (they stay after the bookings are deleted).
export const watchDeposits = (owner: string, project: ProjectKey, onData: (rows: DepositLine[]) => void, onError: () => void) =>
  onSnapshot(
    query(collection(db, 'bookingDeposits', owner, 'items'), where('project', '==', project)),
    (snap) =>
      onData(
        snap.docs.map((d) => {
          const x: any = d.data();
          return {
            id: d.id,
            name: String(x.name || ''),
            amount: Number(x.amount) || 0,
            currency: String(x.currency || ''),
            walletLabel: String(x.walletLabel || ''),
            txn: String(x.txn || ''),
            bookingDate: String(x.bookingDate || ''),
            date: String(x.date || ''),
            state: x.state === 'cancelled' ? 'cancelled' : 'received',
          } as DepositLine;
        })
      ),
    onError
  );

// The confirmed (received) deposits of the page, for its accounts tab; [] until they load.
export const useDepositLines = (owner: string | null | undefined, project: ProjectKey | null | undefined): DepositLine[] => {
  const [lines, setLines] = useState<DepositLine[]>([]);
  useEffect(() => {
    if (!owner || !project) return setLines([]);
    return watchDeposits(owner, project, (rows) => setLines(rows.filter((d) => d.state === 'received')), () => setLines([]));
  }, [owner, project]);
  return lines;
};

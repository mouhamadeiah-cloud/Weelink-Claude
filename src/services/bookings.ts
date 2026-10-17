// Appointments booked from the «حجز مواعيد» calendar on a page (Eyad, 13 Oct). The server
// (/api/booking) saves them and emails both sides; the day before, its daily cron reminds both
// sides, and bookings older than 3 months are deleted.
//   bookings/{owner}/items/{id}                 the booking; the owner and members read it
//   bookingDays/{owner}_{project}_{yyyy-mm-dd}  { taken: [startMin] }; anyone reads it
import { createContext } from 'react';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { ProjectKey } from '../utils/projectKeys';

export type BookingStatus = 'new' | 'confirmed' | 'done' | 'cancelled';

export interface Booking {
  id: string;
  owner: string;
  project: ProjectKey;
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
export const readTaken = async (owner: string, project: ProjectKey, date: string): Promise<number[]> => {
  const snap = await getDoc(doc(db, 'bookingDays', `${owner}_${project}_${date}`));
  const taken = snap.data()?.taken;
  return Array.isArray(taken) ? taken.filter((n) => typeof n === 'number') : [];
};

export type NewBooking = Omit<Booking, 'id' | 'status' | 'createdAt'> & { needsConfirmation: boolean };

// 'taken': somebody booked that time a moment before.
export const createBooking = async (b: NewBooking): Promise<{ id: string; status: BookingStatus } | { error: string; reason?: string }> => {
  try {
    const res = await fetch('/api/booking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...b }) });
    const out = await res.json().catch(() => ({}));
    return res.ok ? out : { error: out.error || 'error', reason: out.reason || `http_${res.status}` };
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

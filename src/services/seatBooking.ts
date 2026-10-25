// Seats in a session for courses, trips and events (Eyad, 25 Oct): a «مقاعد» schedule lists sessions
// (a date, a start time, a number of seats), and a visitor books some seats of one session. The pure
// rules live here, used by the page (to show what is left) and by /api/booking (to decide).
//   bookingSessions/{owner}_{project}_{schedule}_{session}  { taken: number }  the seats booked
// The seats are counted in that one document inside a transaction, so two visitors never get the
// same last seat.

export interface SeatSession {
  id: string;
  name: string;
  date: string; // yyyy-mm-dd, the business's own day (a course: its first day)
  endDate: string; // a course's last day; '' for a single session
  startMin: number; // minutes from midnight
  seats: number; // the session's capacity
  price: string; // free text shown to the visitor, e.g. «25$ للشخص»
}

export const MAX_SESSIONS = 100;
export const MAX_SESSION_SEATS = 1000;

const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

export const normalizeSessions = (raw: unknown): SeatSession[] => {
  const seen = new Set<string>();
  return (Array.isArray(raw) ? raw : [])
    .slice(0, MAX_SESSIONS)
    .map((s: any) => ({
      id: typeof s?.id === 'string' && /^[a-z0-9]{1,20}$/.test(s.id) ? s.id : '',
      name: String(s?.name ?? '').trim().slice(0, 80),
      date: isDate(s?.date) ? s.date : '',
      endDate: isDate(s?.endDate) && isDate(s?.date) && s.endDate > s.date ? s.endDate : '',
      startMin: Math.min(1439, Math.max(0, Math.round(Number(s?.startMin)) || 0)),
      seats: Math.min(MAX_SESSION_SEATS, Math.max(1, Math.round(Number(s?.seats)) || 10)),
      price: String(s?.price ?? '').trim().slice(0, 40),
    }))
    .filter((s: SeatSession) => s.id && s.name && s.date && !seen.has(s.id) && !!seen.add(s.id))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin);
};

export const newSessionId = () => `x${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const seatsLeft = (session: SeatSession, taken: number | undefined) => Math.max(0, session.seats - Math.max(0, Math.round(Number(taken)) || 0));

// The sessions a visitor can still book from `today`: not in the past and not further than `daysAhead`.
export const openSessions = (sessions: SeatSession[], today: string, lastDay: string) => sessions.filter((s) => s.date >= today && s.date <= lastDay);

// 'yyyy-mm-dd' + n days.
export const dayPlus = (date: string, n: number) => new Date(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) + n * 86400000).toISOString().slice(0, 10);

// Can `want` seats be added to a session that already holds `taken`?
export const canTake = (session: SeatSession, taken: number | undefined, want: number) => Number.isInteger(want) && want >= 1 && want <= seatsLeft(session, taken);

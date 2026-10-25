// Room stays for hotels, chalets and the like (Eyad, 25 Oct): a «إقامة» schedule books one of the
// schedule's rooms for a number of nights, from a check-in date to a check-out date. The pure rules
// live here, used by the page (to show what is free) and by /api/booking (to decide).
//   bookingRooms/{owner}_{project}_{schedule}_{room}  { nights: ["yyyy-mm-dd"] }  the nights taken
// A stay of 2 nights from the 5th to the 7th takes the nights of the 5th and the 6th; the 7th is free
// for the next guest to check in.

export interface StayRoom {
  id: string;
  name: string;
  capacity: number; // guests
  price: string; // free text shown to the visitor, e.g. «50$ / ليلة»
  photo: string; // the room's or unit's picture ('' = none)
}

export type RoomNights = Record<string, string[]>;

const DAY = 86400000;
const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const stamp = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// The nights of a stay: check-in included, check-out not. [] when the dates are wrong.
export const nightsBetween = (checkIn: string, checkOut: string): string[] => {
  if (!isDate(checkIn) || !isDate(checkOut)) return [];
  const out: string[] = [];
  for (let t = stamp(checkIn); t < stamp(checkOut) && out.length <= 400; t += DAY) out.push(iso(t));
  return out;
};

export const addDays = (date: string, n: number) => iso(stamp(date) + n * DAY);

export const normalizeRooms = (raw: unknown): StayRoom[] => {
  const seen = new Set<string>();
  return (Array.isArray(raw) ? raw : [])
    .slice(0, 100)
    .map((r: any) => ({
      id: typeof r?.id === 'string' && /^[a-z0-9]{1,20}$/.test(r.id) ? r.id : '',
      name: String(r?.name ?? '').trim().slice(0, 60),
      capacity: Math.min(20, Math.max(1, Math.round(Number(r?.capacity)) || 2)),
      price: String(r?.price ?? '').trim().slice(0, 40),
      photo: typeof r?.photo === 'string' && /^https?:\/\//.test(r.photo) ? r.photo.slice(0, 1000) : '',
    }))
    .filter((r: StayRoom) => r.id && r.name && !seen.has(r.id) && !!seen.add(r.id));
};

export const newRoomId = () => `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const isRoomFree = (taken: string[] | undefined, nights: string[]) => !taken || !nights.some((n) => taken.includes(n));

export interface StayWish {
  guests: number;
  nights: string[];
  roomId?: string; // only this room
}

// The room a stay gets: the smallest free one that fits the guests (the first by the owner's order
// among equals), or the wished room. null when nothing fits.
export const chooseRoom = (rooms: StayRoom[], occupancy: RoomNights, wish: StayWish): StayRoom | null => {
  const fits = rooms.filter((r) => r.capacity >= wish.guests && (!wish.roomId || r.id === wish.roomId) && isRoomFree(occupancy[r.id], wish.nights));
  if (fits.length === 0) return null;
  return fits.reduce((best, r) => (r.capacity < best.capacity ? r : best));
};

// The longest stay the rooms can take, to cap the guests' stepper.
export const maxGuests = (rooms: StayRoom[]) => rooms.reduce((m, r) => Math.max(m, r.capacity), 0);

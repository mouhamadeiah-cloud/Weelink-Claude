// A team person's own hours (Eyad, 25 Oct): inside the schedule's days and hours, a person may work only
// some days and a shorter day. Empty days or times mean they follow the schedule. Pure, so the page
// (to grey out their times) and /api/booking (to refuse them) decide the same.
export interface PersonHours {
  workingDays: string[];
  workStart: string; // "09:00", '' = the schedule's
  workEnd: string;
  rota?: WorkRota | null; // a 1–2 week shift rota; when set it replaces the three fields above
}

// A work rota (Eyad, 25 Oct): a cycle of 1 or 2 weeks, each day with up to 3 shifts (one by default),
// and dates that differ from the cycle («إجازة» = no shifts, or other shifts).
export interface Shift { start: string; end: string }
export interface WorkRota {
  weeks: 1 | 2;
  anchor: string; // a date inside the cycle's first week
  plan: Record<string, Shift[]>[]; // per week, per day name
  exceptions: Record<string, Shift[]>; // date → shifts ([] = off that day)
}
export const MAX_SHIFTS = 3;
const MAX_EXCEPTIONS = 120;

export const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const isTime = (v: unknown): v is string => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(`${v}T12:00:00Z`).getTime());

export const cleanShifts = (v: unknown): Shift[] =>
  (Array.isArray(v) ? v : [])
    .filter((x) => x && isTime(x.start) && isTime(x.end) && x.start < x.end)
    .map((x) => ({ start: x.start as string, end: x.end as string }))
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, MAX_SHIFTS);

export const cleanRota = (v: any): WorkRota | null => {
  if (!v || typeof v !== 'object' || !isDate(v.anchor)) return null;
  const weeks: 1 | 2 = v.weeks === 2 ? 2 : 1;
  const plan = Array.from({ length: weeks }, (_, i) => Object.fromEntries(DAYS.map((d) => [d, cleanShifts(v.plan?.[i]?.[d])])));
  const exceptions = Object.fromEntries(
    Object.entries(v.exceptions && typeof v.exceptions === 'object' ? v.exceptions : {})
      .filter(([d]) => isDate(d))
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, MAX_EXCEPTIONS)
      .map(([d, shifts]) => [d, cleanShifts(shifts)])
  );
  return { weeks, anchor: v.anchor, plan, exceptions };
};

const DAY_MS = 86400000;
const dayNumber = (date: string) => Math.floor(new Date(`${date}T12:00:00Z`).getTime() / DAY_MS);
const weekStart = (date: string) => dayNumber(date) - new Date(`${date}T12:00:00Z`).getUTCDay();

// The shifts a rota gives a date: its exception, or the day of the cycle's week.
export const shiftsOn = (rota: WorkRota, date: string): Shift[] => {
  if (rota.exceptions[date]) return rota.exceptions[date];
  const week = (((weekStart(date) - weekStart(rota.anchor)) / 7) % rota.weeks + rota.weeks) % rota.weeks;
  return rota.plan[week]?.[DAYS[new Date(`${date}T12:00:00Z`).getUTCDay()]] || [];
};

export const cleanDays = (v: unknown): string[] => (Array.isArray(v) ? DAYS.filter((d) => v.includes(d)) : []);

// Whether the person takes a booking that starts at `startMin` on the calendar day `date` ("YYYY-MM-DD").
export const personWorks = (h: Partial<PersonHours> | null | undefined, date: string, startMin: number): boolean => {
  if (!h) return true;
  const rota = cleanRota(h.rota);
  if (rota) return shiftsOn(rota, date).some((x) => startMin >= minutes(x.start) && startMin < minutes(x.end));
  const days = cleanDays(h.workingDays);
  if (days.length > 0 && !days.includes(DAYS[new Date(`${date}T12:00:00Z`).getUTCDay()])) return false;
  if (isTime(h.workStart) && startMin < minutes(h.workStart)) return false;
  if (isTime(h.workEnd) && startMin >= minutes(h.workEnd)) return false;
  return true;
};

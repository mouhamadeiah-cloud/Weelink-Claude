// A team person's own hours (Eyad, 25 Oct): inside the schedule's days and hours, a person may work only
// some days and a shorter day. Empty days or times mean they follow the schedule. Pure, so the page
// (to grey out their times) and /api/booking (to refuse them) decide the same.
export interface PersonHours {
  workingDays: string[];
  workStart: string; // "09:00", '' = the schedule's
  workEnd: string;
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const isTime = (v: unknown): v is string => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

export const cleanDays = (v: unknown): string[] => (Array.isArray(v) ? DAYS.filter((d) => v.includes(d)) : []);

// Whether the person takes a booking that starts at `startMin` on the calendar day `date` ("YYYY-MM-DD").
export const personWorks = (h: Partial<PersonHours> | null | undefined, date: string, startMin: number): boolean => {
  if (!h) return true;
  const days = cleanDays(h.workingDays);
  if (days.length > 0 && !days.includes(DAYS[new Date(`${date}T12:00:00Z`).getUTCDay()])) return false;
  if (isTime(h.workStart) && startMin < minutes(h.workStart)) return false;
  if (isTime(h.workEnd) && startMin >= minutes(h.workEnd)) return false;
  return true;
};

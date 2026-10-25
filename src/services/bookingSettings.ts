// «إعدادات الحجز» (Eyad, 24 Oct): how a business takes bookings lives in its admin, not in the
// editor. A page has one or more schedules (جداول); each booking element on the page uses one of
// them (CanvasElement.calendarScheduleId, the first one when unset). A schedule's type says what is
// booked: an appointment («موعد») now; tables, rooms and seats come later on the same engine.
//   bookingSettings/{owner}/pages/{project}  { schedules: BookingSchedule[] }; anyone reads it (the page
//                                       works its free times out from it), the owner and members write it
// The editor keeps only the look of the element (title, colour, labels). A page made before this
// keeps its settings in the element: the admin copies them in the first time it opens
// (scheduleFromElement), and until then the element still books with its own.
import { createContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { CanvasElement } from '../types';
import type { ProjectKey } from '../utils/projectKeys';

export type BookingType = 'appointment' | 'table';
// Who a visitor books with: nobody in particular, a team person of their choice (or any free one), or
// always the first free person. The people are those of «فريق العمل» who take bookings.
export type SpecialistMode = 'none' | 'choose' | 'first';
// A «طاولة» schedule (restaurants): who chooses the table. 'auto' = the smallest free table that seats the
// party; 'hall' = the visitor picks the hall; 'table' = the visitor picks the table.
export type TableChoice = 'auto' | 'hall' | 'table';
export type SlotInterval = '10' | '15' | '30' | '60' | 'day' | 'manual';
export const WEEK_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
export const MEETING_TYPES = ['personal', 'phone', 'whatsapp'] as const;

export interface BookingSchedule {
  id: string; // 'main' for the first schedule of a page
  name: string;
  type: BookingType;
  workingDays: string[];
  workStart: string; // "09:00"
  workEnd: string;
  breakStart: string; // '' when there is no break
  breakEnd: string;
  interval: SlotInterval;
  intervalMinutes: number; // with interval 'manual'
  needsConfirmation: boolean;
  specialists: SpecialistMode;
  meetingTypes: string[];
  durationMinutes: number; // type 'table': how long a table is kept for a party
  partyMax: number; // type 'table': the biggest party that books online
  tableChoice: TableChoice;
  daysAhead: number; // how far ahead a visitor may book
  minNoticeHours: number; // how soon before a time it can still be booked
}

export interface BookingSettings {
  schedules: BookingSchedule[];
}

export const MAX_SCHEDULES = 10;

const DEFAULT: Omit<BookingSchedule, 'id' | 'name'> = {
  type: 'appointment',
  workingDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
  workStart: '09:00',
  workEnd: '17:00',
  breakStart: '12:00',
  breakEnd: '13:00',
  interval: '30',
  intervalMinutes: 30,
  needsConfirmation: true,
  specialists: 'none',
  meetingTypes: ['phone'],
  durationMinutes: 90,
  partyMax: 8,
  tableChoice: 'auto',
  daysAhead: 60,
  minNoticeHours: 0,
};

const isTime = (v: unknown): v is string => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const INTERVALS: SlotInterval[] = ['10', '15', '30', '60', 'day', 'manual'];
const clampInt = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export const newSchedule = (id: string, name: string): BookingSchedule => ({ ...DEFAULT, id, name, workingDays: [...DEFAULT.workingDays], meetingTypes: [...DEFAULT.meetingTypes] });

export const newScheduleId = () => `s${Date.now().toString(36)}`;

export const normalizeSchedule = (raw: any, fallbackId = 'main'): BookingSchedule => {
  const id = typeof raw?.id === 'string' && /^[a-z0-9]{1,20}$/.test(raw.id) ? raw.id : fallbackId;
  const days = Array.isArray(raw?.workingDays) ? WEEK_DAYS.filter((d) => raw.workingDays.includes(d)) : DEFAULT.workingDays;
  const meetings = Array.isArray(raw?.meetingTypes) ? MEETING_TYPES.filter((m) => raw.meetingTypes.includes(m)) : [];
  return {
    id,
    name: String(raw?.name ?? '').trim().slice(0, 60) || 'المواعيد',
    type: raw?.type === 'table' ? 'table' : 'appointment',
    workingDays: [...days],
    workStart: isTime(raw?.workStart) ? raw.workStart : DEFAULT.workStart,
    workEnd: isTime(raw?.workEnd) ? raw.workEnd : DEFAULT.workEnd,
    breakStart: isTime(raw?.breakStart) ? raw.breakStart : '',
    breakEnd: isTime(raw?.breakEnd) ? raw.breakEnd : '',
    interval: INTERVALS.includes(raw?.interval) ? raw.interval : DEFAULT.interval,
    intervalMinutes: clampInt(raw?.intervalMinutes, 5, 480, 30),
    needsConfirmation: raw?.needsConfirmation !== false,
    specialists: raw?.specialists === 'choose' || raw?.specialists === 'first' ? raw.specialists : 'none',
    meetingTypes: meetings.length ? [...meetings] : ['phone'],
    durationMinutes: clampInt(raw?.durationMinutes, 15, 480, DEFAULT.durationMinutes),
    partyMax: clampInt(raw?.partyMax, 1, 50, DEFAULT.partyMax),
    tableChoice: raw?.tableChoice === 'hall' || raw?.tableChoice === 'table' ? raw.tableChoice : 'auto',
    daysAhead: clampInt(raw?.daysAhead, 1, 365, DEFAULT.daysAhead),
    minNoticeHours: clampInt(raw?.minNoticeHours, 0, 168, 0),
  };
};

export const normalizeSettings = (raw: any): BookingSettings | null => {
  if (!raw || !Array.isArray(raw.schedules) || raw.schedules.length === 0) return null;
  const seen = new Set<string>();
  const schedules = raw.schedules
    .slice(0, MAX_SCHEDULES)
    .map((s: any, i: number) => normalizeSchedule(s, i === 0 ? 'main' : `s${i}`))
    .filter((s: BookingSchedule) => !seen.has(s.id) && seen.add(s.id));
  return { schedules };
};

// The settings a booking element made before 24 Oct carries itself.
export const scheduleFromElement = (e: Partial<CanvasElement> | null | undefined, id = 'main'): BookingSchedule =>
  normalizeSchedule({
    id,
    name: e?.calendarTitle || e?.content || 'المواعيد',
    workingDays: e?.calendarWorkingDays,
    workStart: e?.calendarWorkStart,
    workEnd: e?.calendarWorkEnd,
    // Unset meant the old default break; an element always showed one.
    breakStart: e?.calendarBreakStart ?? DEFAULT.breakStart,
    breakEnd: e?.calendarBreakEnd ?? DEFAULT.breakEnd,
    interval: e?.calendarInterval,
    intervalMinutes: e?.calendarIntervalMinutes,
    needsConfirmation: e?.calendarNeedsConfirmation,
    meetingTypes: e?.calendarMeetingTypes || [e?.calendarMeetingType || 'phone'],
    daysAhead: 365,
    minNoticeHours: 0,
  }, id);

// The schedule an element books with: its own, or the page's first.
// `wantType`: a table element finds the page's table schedule when it has not been told which.
export const scheduleFor = (settings: BookingSettings | null, scheduleId?: string, wantType?: BookingType): BookingSchedule | null =>
  settings
    ? settings.schedules.find((s) => s.id === scheduleId) || (wantType && settings.schedules.find((s) => s.type === wantType)) || settings.schedules[0]
    : null;

// A restaurant's first table schedule when it has none saved: shown by the element and the admin.
export const newTableSchedule = (): BookingSchedule => ({ ...newSchedule('table', 'حجز الطاولات'), type: 'table', workStart: '12:00', workEnd: '23:00', breakStart: '', breakEnd: '', interval: '30', meetingTypes: ['personal'] });

const settingsDoc = (owner: string, project: ProjectKey) => doc(db, 'bookingSettings', owner, 'pages', project);

export const saveBookingSettings = (owner: string, project: ProjectKey, settings: BookingSettings) =>
  setDoc(settingsDoc(owner, project), { schedules: settings.schedules.slice(0, MAX_SCHEDULES).map((s) => normalizeSchedule(s, s.id)) });

// undefined while loading, null when the page has none yet.
export const useBookingSettings = (owner: string | null | undefined, project: ProjectKey | null | undefined) => {
  const [state, setState] = useState<{ key: string; settings: BookingSettings | null | undefined }>({ key: '', settings: undefined });
  const key = owner && project ? `${owner}_${project}` : '';
  useEffect(() => {
    if (!owner || !project) return;
    return onSnapshot(
      settingsDoc(owner, project),
      (snap) => setState({ key: `${owner}_${project}`, settings: normalizeSettings(snap.data()) }),
      () => setState({ key: `${owner}_${project}`, settings: null })
    );
  }, [owner, project]);
  return state.key === key ? state.settings : undefined;
};

// The editor (and the owner's view of the page) opens «إعدادات الحجز» in the admin from the gear on
// a booking element. Left out on the published page, where visitors never see the gear.
export const BookingSettingsOpenContext = createContext<((scheduleId?: string) => void) | null>(null);

// The settings the page's first booking element carries (pages made before 24 Oct), for the admin
// to copy in when the page has none of its own yet.
export const BookingLegacyContext = createContext<BookingSchedule | null>(null);

// The schedule the last gear asked for (n counts the asks), so the admin shows it.
export interface BookingSettingsFocus {
  schedule: string;
  n: number;
}
export const BookingSettingsFocusContext = createContext<BookingSettingsFocus | null>(null);

// The staff side of the restaurant: the workers (العمال) who sign in on the cashier and the waiters'
// tablets with their PIN, the open bills of the tables (tabs), the payments and each worker's till
// (shift). A tab lives while its table is occupied: the waiter adds dishes, sends them to the kitchen,
// takes payments (all, by items, by amount or split) and the tab closes when nothing is left to pay.
// Every payment carries the worker, the device and the method, so the manager sees the money each
// worker took and the money of every device together.
import { newId } from '../shop/shopTypes';
import type { OrderLine } from './restaurantTypes';

export type WorkerRole = 'waiter' | 'cashier' | 'manager';

export const WORKER_ROLES: { id: WorkerRole; label: string; hint: string }[] = [
  { id: 'waiter', label: 'نادل', hint: 'يفتح الطاولات ويطلب ويحصّل.' },
  { id: 'cashier', label: 'كاشير', hint: 'مثل النادل، على جهاز الكاشير عادةً.' },
  { id: 'manager', label: 'مدير', hint: 'رقمه يسمح بالإلغاء والخصم وإعادة فتح الفواتير.' },
];

export interface Worker {
  id: string;
  name: string;
  phone: string;
  role: WorkerRole;
  pin: string; // 4 digits, typed on the cashier and the waiters' tablets
  active: boolean;
  createdAt: string;
}

// A new four-digit PIN no other worker has.
export const newWorkerPin = (workers: Worker[]) => {
  for (;;) {
    const p = String(Math.floor(1000 + Math.random() * 9000));
    if (!workers.some((w) => w.pin === p)) return p;
  }
};

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : Number(v) || 0);
const strList = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export const normalizeWorker = (raw: any): Worker => ({
  id: str(raw?.id) || newId('wrk'),
  name: str(raw?.name),
  phone: str(raw?.phone),
  role: WORKER_ROLES.some((r) => r.id === raw?.role) ? raw.role : 'waiter',
  pin: /^\d{4}$/.test(str(raw?.pin)) ? raw.pin : '',
  active: raw?.active !== false,
  createdAt: str(raw?.createdAt) || new Date().toISOString(),
});

// Who did something, as it is written on the records.
export interface Actor {
  workerId: string;
  workerName: string;
  deviceId: string;
  deviceName: string;
}

// ---------- Tabs (the open bill of a table, or a takeaway) ----------

export interface TabItem extends OrderLine {
  id: string;
  addedBy: string; // worker name
  addedAt: string;
  sentAt: string; // '' = not sent to the kitchen yet
  orderId: string; // the kitchen order it went in
  paidQty: number; // paid by items
  voided: boolean;
  voidNote: string;
}

export interface TabPayment {
  id: string;
  at: string;
  amount: number;
  method: string; // one of PAYMENT_METHODS
  workerId: string;
  workerName: string;
  deviceId: string;
  deviceName: string;
  shiftId: string;
  note: string; // «بالأصناف», «1 من 3»...
}

export type TabKind = 'table' | 'takeaway';

export interface Tab {
  id: string; // the document's id: open_<tableId> while open
  number: number;
  kind: TabKind;
  tableId: string;
  table: string; // the table's name
  hall: string;
  status: 'open' | 'closed';
  guests: number;
  note: string;
  openedAt: string;
  ownerId: string; // the worker responsible for the table
  ownerName: string;
  items: TabItem[];
  payments: TabPayment[];
  discount: number; // a fixed amount, or ...
  discountPct: number; // ... a percentage of the dishes (0 = the fixed amount)
  discountNote: string;
  closedAt: string; // '' while open
  closedBy: string;
}

export const openTabId = (tableId: string) => `open_${tableId}`;

const normalizeItem = (raw: any): TabItem => ({
  id: str(raw?.id) || newId('itm'),
  dishId: str(raw?.dishId),
  name: str(raw?.name),
  unitPrice: num(raw?.unitPrice),
  qty: Math.max(1, num(raw?.qty)),
  removed: strList(raw?.removed),
  extras: Array.isArray(raw?.extras) ? raw.extras.map((e: any) => ({ name: str(e?.name), price: num(e?.price) })) : [],
  notes: str(raw?.notes),
  addedBy: str(raw?.addedBy),
  addedAt: str(raw?.addedAt),
  sentAt: str(raw?.sentAt),
  orderId: str(raw?.orderId),
  paidQty: Math.max(0, num(raw?.paidQty)),
  voided: !!raw?.voided,
  voidNote: str(raw?.voidNote),
});

const normalizePayment = (raw: any): TabPayment => ({
  id: str(raw?.id) || newId('pay'),
  at: str(raw?.at),
  amount: num(raw?.amount),
  method: str(raw?.method),
  workerId: str(raw?.workerId),
  workerName: str(raw?.workerName),
  deviceId: str(raw?.deviceId),
  deviceName: str(raw?.deviceName),
  shiftId: str(raw?.shiftId),
  note: str(raw?.note),
});

export const normalizeTab = (id: string, raw: any): Tab => ({
  id,
  number: num(raw?.number),
  kind: raw?.kind === 'takeaway' ? 'takeaway' : 'table',
  tableId: str(raw?.tableId),
  table: str(raw?.table),
  hall: str(raw?.hall),
  status: raw?.status === 'closed' ? 'closed' : 'open',
  guests: Math.max(0, num(raw?.guests)),
  note: str(raw?.note),
  openedAt: str(raw?.openedAt),
  ownerId: str(raw?.ownerId),
  ownerName: str(raw?.ownerName),
  items: Array.isArray(raw?.items) ? raw.items.map(normalizeItem) : [],
  payments: Array.isArray(raw?.payments) ? raw.payments.map(normalizePayment) : [],
  discount: Math.max(0, num(raw?.discount)),
  discountPct: Math.max(0, Math.min(100, num(raw?.discountPct))),
  discountNote: str(raw?.discountNote),
  closedAt: str(raw?.closedAt),
  closedBy: str(raw?.closedBy),
});

const round = (n: number) => Math.round(n * 100) / 100;

export const itemTotal = (i: TabItem) => (i.voided ? 0 : i.unitPrice * i.qty);

export const tabTotals = (t: Tab) => {
  const subtotal = round(t.items.reduce((s, i) => s + itemTotal(i), 0));
  const discount = round(Math.min(subtotal, t.discountPct ? (subtotal * t.discountPct) / 100 : t.discount));
  const total = round(Math.max(0, subtotal - discount));
  const paid = round(t.payments.reduce((s, p) => s + p.amount, 0));
  return { subtotal, discount, total, paid, due: round(Math.max(0, total - paid)) };
};

export const unsentItems = (t: Tab) => t.items.filter((i) => !i.voided && !i.sentAt);

export const tabTitle = (t: Pick<Tab, 'kind' | 'table' | 'number'>) => (t.kind === 'takeaway' ? `سفري #${t.number}` : `طاولة ${t.table}`);

// ---------- Shifts (each worker's till) ----------

export interface Shift {
  id: string;
  workerId: string;
  workerName: string;
  deviceName: string; // where it was opened
  openedAt: string;
  closedAt: string; // '' while open
  counted: number; // the cash the worker counted at the end
  expectedCash: number; // the cash payments of the shift, written when it closes
}

export const normalizeShift = (id: string, raw: any): Shift => ({
  id,
  workerId: str(raw?.workerId),
  workerName: str(raw?.workerName),
  deviceName: str(raw?.deviceName),
  openedAt: str(raw?.openedAt),
  closedAt: str(raw?.closedAt),
  counted: num(raw?.counted),
  expectedCash: num(raw?.expectedCash),
});

export const CASH = 'نقدي';

// The payments of a list of tabs, newest first, each with its tab.
export const paymentsOf = (tabs: Tab[]) =>
  tabs.flatMap((t) => t.payments.map((p) => ({ ...p, tab: t }))).sort((a, b) => b.at.localeCompare(a.at));

// Sums by method: [{method, amount}], cash first.
export const byMethod = (payments: TabPayment[]) => {
  const m = new Map<string, number>();
  payments.forEach((p) => m.set(p.method, round((m.get(p.method) || 0) + p.amount)));
  return [...m.entries()].map(([method, amount]) => ({ method, amount })).sort((a, b) => (a.method === CASH ? -1 : b.method === CASH ? 1 : b.amount - a.amount));
};

// ---------- The log of sensitive actions (seen by the manager) ----------

export interface LogEntry {
  id: string;
  at: string;
  action: string; // «إلغاء صنف», «خصم», «إعادة فتح»...
  detail: string;
  workerName: string;
  approvedBy: string; // the manager whose PIN allowed it
  deviceName: string;
}

export const normalizeLog = (id: string, raw: any): LogEntry => ({
  id,
  at: str(raw?.at),
  action: str(raw?.action),
  detail: str(raw?.detail),
  workerName: str(raw?.workerName),
  approvedBy: str(raw?.approvedBy),
  deviceName: str(raw?.deviceName),
});

// ---------- The customer's screen ----------
// The cashier device writes which bill it shows; the customer's screen tied to it follows.

export interface ScreenState {
  tabId: string; // '' = nothing open
  thanks: { total: number; paid: number; change: number; at: string } | null;
}

export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

// The main cashier's session (جلسة الكاشير الرئيسي, restaurants/{uid}/cashDays/{id}): it opens with an
// opening amount in the drawer and closes with the money counted in it. Closing writes the report of
// the session next to it (what was sold, taken by each worker, tips, the drawer's expected cash), and
// the accounting reads those reports. Reports are kept for two years.
import { newId } from '../shop/shopTypes';
import { CASH, Handover, Shift, Tab, TabPayment, byMethod, tipTotal } from './staffTypes';

export const REPORT_KEEP_DAYS = 730; // two years

export interface ReportWorker {
  workerId: string;
  name: string;
  collected: number; // the money he took in the session, all methods
  cash: number; // of it in cash
  tips: number; // the tips on his bills
  bills: number; // bills he opened
  handedCash: number; // cash he handed to the main cashier
  handover: 'confirmed' | 'skipped' | 'none'; // none = no handover recorded (still open or not asked)
}

export interface ReportDish {
  name: string;
  qty: number;
  amount: number;
}

export interface CashReport {
  from: string;
  to: string;
  sales: number; // all the money taken in the session
  tips: number;
  discounts: number;
  bills: number; // closed bills
  methods: { method: string; amount: number }[];
  dishes: ReportDish[];
  workers: ReportWorker[];
  cashDirect: number; // cash taken at the cashier itself (not through a waiter's handover)
  cashFromWaiters: number; // cash received in handovers
}

export interface CashDay {
  id: string;
  openedAt: string;
  openedBy: string;
  openingAmount: number;
  closedAt: string; // '' while open
  closedBy: string;
  expectedDrawer: number; // opening + cash taken at the cashier + cash from waiters
  counted: number;
  report: CashReport | null;
  keepUntil: string; // reports older than this are deleted
}

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : Number(v) || 0);
const round = (n: number) => Math.round(n * 100) / 100;

const normalizeReport = (raw: any): CashReport | null =>
  raw && typeof raw === 'object'
    ? {
        from: str(raw.from),
        to: str(raw.to),
        sales: num(raw.sales),
        tips: num(raw.tips),
        discounts: num(raw.discounts),
        bills: num(raw.bills),
        methods: Array.isArray(raw.methods) ? raw.methods.map((m: any) => ({ method: str(m?.method), amount: num(m?.amount) })) : [],
        dishes: Array.isArray(raw.dishes) ? raw.dishes.map((d: any) => ({ name: str(d?.name), qty: num(d?.qty), amount: num(d?.amount) })) : [],
        workers: Array.isArray(raw.workers)
          ? raw.workers.map((w: any) => ({
              workerId: str(w?.workerId),
              name: str(w?.name),
              collected: num(w?.collected),
              cash: num(w?.cash),
              tips: num(w?.tips),
              bills: num(w?.bills),
              handedCash: num(w?.handedCash),
              handover: ['confirmed', 'skipped'].includes(w?.handover) ? w.handover : 'none',
            }))
          : [],
        cashDirect: num(raw.cashDirect),
        cashFromWaiters: num(raw.cashFromWaiters),
      }
    : null;

export const normalizeCashDay = (id: string, raw: any): CashDay => ({
  id,
  openedAt: str(raw?.openedAt),
  openedBy: str(raw?.openedBy),
  openingAmount: num(raw?.openingAmount),
  closedAt: str(raw?.closedAt),
  closedBy: str(raw?.closedBy),
  expectedDrawer: num(raw?.expectedDrawer),
  counted: num(raw?.counted),
  report: normalizeReport(raw?.report),
  keepUntil: str(raw?.keepUntil),
});

export const newCashDay = (openedBy: string, openingAmount: number): CashDay => {
  const now = new Date();
  return {
    id: newId('day'),
    openedAt: now.toISOString(),
    openedBy,
    openingAmount,
    closedAt: '',
    closedBy: '',
    expectedDrawer: 0,
    counted: 0,
    report: null,
    keepUntil: new Date(now.getTime() + REPORT_KEEP_DAYS * 86400000).toISOString(),
  };
};

// The report of the session from `from` until `to`, from the bills (open ones and those closed since
// then), the workers' tills and the handovers received. Dishes sold count the bills closed in the
// session; the money counts every payment taken in it.
export const buildReport = (tabs: Tab[], handovers: Handover[], shifts: Shift[], waiterIds: Set<string>, from: string, to: string): CashReport => {
  const inside = (iso: string) => iso >= from && iso <= to;
  const payments: (TabPayment & { tab: Tab })[] = tabs.flatMap((t) => t.payments.filter((p) => inside(p.at)).map((p) => ({ ...p, tab: t })));
  const closed = tabs.filter((t) => t.status === 'closed' && inside(t.closedAt));

  const dishMap = new Map<string, ReportDish>();
  closed.forEach((t) =>
    t.items
      .filter((i) => !i.voided && !i.tip)
      .forEach((i) => {
        const d = dishMap.get(i.name) || { name: i.name, qty: 0, amount: 0 };
        d.qty += i.qty;
        d.amount = round(d.amount + i.unitPrice * i.qty);
        dishMap.set(i.name, d);
      })
  );

  const received = handovers.filter((h) => h.status === 'confirmed' && inside(h.confirmedAt));
  const cashFromWaiters = round(received.reduce((s, h) => s + h.receivedCash, 0));
  // A waiter's cash comes to the drawer by his handover, not by his payments.
  const cashDirect = round(payments.filter((p) => p.method === CASH && !waiterIds.has(p.workerId)).reduce((s, p) => s + p.amount, 0));

  const names = new Map<string, string>();
  tabs.forEach((t) => {
    if (t.ownerId) names.set(t.ownerId, t.ownerName);
    t.payments.forEach((p) => p.workerId && names.set(p.workerId, p.workerName));
  });
  shifts.forEach((s) => names.set(s.workerId, s.workerName));
  handovers.forEach((h) => names.set(h.workerId, h.workerName));

  const workers: ReportWorker[] = [...names.entries()]
    .map(([workerId, name]) => {
      const mine = payments.filter((p) => p.workerId === workerId);
      const bills = tabs.filter((t) => t.ownerId === workerId && inside(t.openedAt));
      const tips = round(tabs.filter((t) => t.ownerId === workerId && t.payments.some((p) => inside(p.at))).reduce((s, t) => s + tipTotal(t), 0));
      const hs = handovers.filter((h) => h.workerId === workerId && (inside(h.requestedAt) || inside(h.confirmedAt)));
      const confirmed = hs.filter((h) => h.status === 'confirmed');
      return {
        workerId,
        name,
        collected: round(mine.reduce((s, p) => s + p.amount, 0)),
        cash: round(mine.filter((p) => p.method === CASH).reduce((s, p) => s + p.amount, 0)),
        tips,
        bills: bills.length,
        handedCash: round(confirmed.reduce((s, h) => s + h.receivedCash, 0)),
        handover: (confirmed.length ? 'confirmed' : hs.some((h) => h.status === 'skipped') ? 'skipped' : 'none') as ReportWorker['handover'],
      };
    })
    .filter((w) => w.collected > 0 || w.bills > 0 || w.handedCash > 0)
    .sort((a, b) => b.collected - a.collected);

  return {
    from,
    to,
    sales: round(payments.reduce((s, p) => s + p.amount, 0)),
    tips: round(closed.reduce((s, t) => s + tipTotal(t), 0)),
    discounts: round(closed.reduce((s, t) => s + (t.discountPct ? (t.items.filter((i) => !i.voided && !i.tip).reduce((a, i) => a + i.unitPrice * i.qty, 0) * t.discountPct) / 100 : t.discount), 0)),
    bills: closed.length,
    methods: byMethod(payments),
    dishes: [...dishMap.values()].sort((a, b) => b.qty - a.qty),
    workers,
    cashDirect,
    cashFromWaiters,
  };
};

// What should be in the drawer now.
export const expectedDrawer = (openingAmount: number, r: CashReport) => round(openingAmount + r.cashDirect + r.cashFromWaiters);

// Adds the reports' dishes and workers together (the accounting's period totals).
export const sumReports = (days: CashDay[]) => {
  const dishes = new Map<string, ReportDish>();
  const workers = new Map<string, ReportWorker>();
  let sales = 0;
  let tips = 0;
  let bills = 0;
  const methods = new Map<string, number>();
  days.forEach((d) => {
    const r = d.report;
    if (!r) return;
    sales += r.sales;
    tips += r.tips;
    bills += r.bills;
    r.methods.forEach((m) => methods.set(m.method, round((methods.get(m.method) || 0) + m.amount)));
    r.dishes.forEach((x) => {
      const t = dishes.get(x.name) || { name: x.name, qty: 0, amount: 0 };
      t.qty += x.qty;
      t.amount = round(t.amount + x.amount);
      dishes.set(x.name, t);
    });
    r.workers.forEach((w) => {
      const t = workers.get(w.workerId) || { ...w, collected: 0, cash: 0, tips: 0, bills: 0, handedCash: 0 };
      t.collected = round(t.collected + w.collected);
      t.cash = round(t.cash + w.cash);
      t.tips = round(t.tips + w.tips);
      t.bills += w.bills;
      t.handedCash = round(t.handedCash + w.handedCash);
      workers.set(w.workerId, t);
    });
  });
  return {
    sales: round(sales),
    tips: round(tips),
    bills,
    methods: [...methods.entries()].map(([method, amount]) => ({ method, amount })).sort((a, b) => b.amount - a.amount),
    dishes: [...dishes.values()].sort((a, b) => b.qty - a.qty),
    workers: [...workers.values()].sort((a, b) => b.collected - a.collected),
  };
};

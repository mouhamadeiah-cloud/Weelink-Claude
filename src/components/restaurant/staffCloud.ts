// The cashier and the waiters' tablets in Firestore, under restaurants/{uid}:
//   tabs/{id}       the bills: open_<tableId> while a table is occupied (one per table, so two
//                   devices can never open the same table twice); a closed bill is kept under its
//                   own id for the day's report.
//   shifts/{id}     each worker's till: opened at the worker's first sign-in, closed with the cash
//                   the worker counted.
//   screens/{id}    what a cashier device shows its customer's screen.
//   log/{id}        the sensitive actions (cancelled dishes, discounts, reopened bills).
// Every change of a bill runs in a transaction, so devices working on the same table at the same
// time never overwrite each other. A payment also books its sale in the accounts (ledger).
import { useEffect, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, runTransaction, setDoc, updateDoc, where, Transaction } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { newId } from '../shop/shopTypes';
import { MenuOrder, OrderLine, orderNumberNow, todayKey } from './restaurantTypes';
import type { LiveState } from './restaurantCloud';
import { NextNumber, readNextNumber } from './orderNumbers';
import { Actor, LogEntry, ScreenState, Shift, Tab, TabItem, TabKind, TabPayment, normalizeLog, normalizeScreen, normalizeShift, normalizeTab, openTabId, tabTitle, tabTotals, unsentItems } from './staffTypes';

const col = (uid: string, name: string) => collection(db, 'restaurants', uid, name);
const tabDoc = (uid: string, id: string) => doc(db, 'restaurants', uid, 'tabs', id);
const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

const useLive = <T,>(make: () => ReturnType<typeof query> | null, map: (id: string, data: any) => T, deps: unknown[]): LiveState<T> => {
  const [state, setState] = useState<LiveState<T>>({ items: [], ready: false, error: '' });
  useEffect(() => {
    const q = make();
    if (!q) return;
    return onSnapshot(
      q,
      (snap) => setState({ items: snap.docs.map((d) => map(d.id, d.data())), ready: true, error: '' }),
      (e) => setState({ items: [], ready: true, error: e.code || e.message })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
};

// ---------- Live lists ----------

export const useOpenTabs = (uid: string | null) =>
  useLive(() => (uid ? query(col(uid, 'tabs'), where('status', '==', 'open')) : null), normalizeTab, [uid]);

export const useClosedTabs = (uid: string | null, since: string) =>
  useLive(() => (uid ? query(col(uid, 'tabs'), where('closedAt', '>=', since)) : null), normalizeTab, [uid, since]);

export const useShifts = (uid: string | null, max = 200) =>
  useLive(() => (uid ? query(col(uid, 'shifts'), orderBy('openedAt', 'desc'), limit(max)) : null), normalizeShift, [uid, max]);

export const useLog = (uid: string | null, max = 200) =>
  useLive(() => (uid ? query(col(uid, 'log'), orderBy('at', 'desc'), limit(max)) : null), normalizeLog, [uid, max]);

// One bill, live (null = it was closed or moved).
export const useTab = (uid: string | null, tabId: string) => {
  const [tab, setTab] = useState<Tab | null | undefined>(undefined);
  useEffect(() => {
    if (!uid || !tabId) {
      setTab(null);
      return;
    }
    setTab(undefined);
    return onSnapshot(
      tabDoc(uid, tabId),
      (s) => setTab(s.exists() ? normalizeTab(s.id, s.data()) : null),
      () => setTab(null)
    );
  }, [uid, tabId]);
  return tab;
};

export const useScreen = (uid: string | null, deviceId: string) => {
  const [screen, setScreenState] = useState<ScreenState | null>(null);
  useEffect(() => {
    if (!uid || !deviceId) return;
    return onSnapshot(
      doc(db, 'restaurants', uid, 'screens', deviceId),
      (s) => setScreenState(normalizeScreen(s.exists() ? s.data() : null)),
      () => setScreenState(normalizeScreen(null))
    );
  }, [uid, deviceId]);
  return screen;
};

export const setScreen = (uid: string, deviceId: string, s: ScreenState) =>
  setDoc(doc(db, 'restaurants', uid, 'screens', deviceId), clean({ ...s, updatedAt: new Date().toISOString() })).catch((e) => console.warn('Could not update the customer screen:', e));

// ---------- Bills ----------

const readTab = async (tx: Transaction, uid: string, tabId: string) => {
  const s = await tx.get(tabDoc(uid, tabId));
  if (!s.exists()) throw new Error('gone');
  return normalizeTab(s.id, s.data());
};

const orderLineOf = (i: TabItem): OrderLine => ({ dishId: i.dishId, name: i.name, unitPrice: i.unitPrice, qty: i.qty, removed: i.removed, extras: i.extras, notes: i.notes });

// The day's next number for the kitchen order of a table's unsent dishes (a takeaway keeps its own
// number on every order). Reads only, so it goes before the transaction's first write.
const kitchenNumber = (tx: Transaction, uid: string, t: Tab) => (t.kind !== 'takeaway' && unsentItems(t).length > 0 ? readNextNumber(tx, uid) : Promise.resolve(null));

// Writes the kitchen order of the bill's unsent dishes and returns the bill's items marked as sent.
const sendUnsent = (tx: Transaction, uid: string, t: Tab, actor: Actor, next: NextNumber | null): TabItem[] => {
  const unsent = unsentItems(t);
  if (unsent.length === 0) return t.items;
  next?.take();
  const now = new Date().toISOString();
  const lines = unsent.map(orderLineOf);
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const order: MenuOrder = {
    id: newId('ord'),
    number: t.kind === 'takeaway' ? t.number : next?.n ?? orderNumberNow(),
    createdAt: now,
    status: 'new',
    type: t.kind === 'takeaway' ? 'pickup' : 'table',
    source: 'staff',
    table: t.kind === 'takeaway' ? '' : t.table,
    name: actor.workerName,
    phone: '',
    address: '',
    notes: t.note,
    lines,
    subtotal,
    deliveryFee: 0,
    total: subtotal,
    tabId: t.id,
  };
  tx.set(doc(col(uid, 'orders'), order.id), clean(order));
  const ids = new Set(unsent.map((i) => i.id));
  return t.items.map((i) => (ids.has(i.id) ? { ...i, sentAt: now, orderId: order.id } : i));
};

export interface TabPlace {
  kind: TabKind;
  tableId: string; // '' for a new takeaway
  table: string;
  hall: string;
}

const newTab = (id: string, place: TabPlace, actor: Actor): Tab => ({
  id,
  number: orderNumberNow(),
  kind: place.kind,
  tableId: place.tableId,
  table: place.table,
  hall: place.hall,
  status: 'open',
  guests: 0,
  note: '',
  openedAt: new Date().toISOString(),
  ownerId: actor.workerId,
  ownerName: actor.workerName,
  items: [],
  payments: [],
  discount: 0,
  discountPct: 0,
  discountNote: '',
  closedAt: '',
  closedBy: '',
});

// Opens the table's bill, or returns the one another device opened a moment ago.
export const openTab = (uid: string, place: TabPlace, actor: Actor) =>
  runTransaction(db, async (tx) => {
    const tableId = place.kind === 'takeaway' && !place.tableId ? newId('tw') : place.tableId;
    const id = openTabId(tableId);
    const ref = tabDoc(uid, id);
    const s = await tx.get(ref);
    if (!s.exists()) {
      // A takeaway gets the day's next number now: it is the number the guest waits for.
      const next = place.kind === 'takeaway' ? await readNextNumber(tx, uid) : null;
      next?.take();
      tx.set(ref, clean({ ...newTab(id, { ...place, tableId }, actor), ...(next ? { number: next.n } : {}) }));
    }
    return id;
  });

// Any change to a bill's own fields, in a transaction.
export const changeTab = (uid: string, tabId: string, fn: (t: Tab) => Partial<Tab>) =>
  runTransaction(db, async (tx) => {
    const t = await readTab(tx, uid, tabId);
    tx.update(tabDoc(uid, tabId), clean(fn(t)) as any);
  });

export const newItem = (line: OrderLine, actor: Actor): TabItem => ({
  ...line,
  id: newId('itm'),
  addedBy: actor.workerName,
  addedAt: new Date().toISOString(),
  sentAt: '',
  orderId: '',
  paidQty: 0,
  voided: false,
  voidNote: '',
});

export const addItems = (uid: string, tabId: string, lines: OrderLine[], actor: Actor) =>
  changeTab(uid, tabId, (t) => ({ items: [...t.items, ...lines.map((l) => newItem(l, actor))] }));

export const sendToKitchen = (uid: string, tabId: string, actor: Actor) =>
  runTransaction(db, async (tx) => {
    const t = await readTab(tx, uid, tabId);
    const seq = await kitchenNumber(tx, uid, t);
    tx.update(tabDoc(uid, tabId), { items: clean(sendUnsent(tx, uid, t, actor, seq)) });
  });

const closeInTx = (tx: Transaction, uid: string, t: Tab, actor: Actor) => {
  const closedId = `${t.id.replace(/^open_/, 'c_')}_${Date.now()}`;
  tx.set(tabDoc(uid, closedId), clean({ ...t, id: closedId, status: 'closed', closedAt: new Date().toISOString(), closedBy: actor.workerName }));
  tx.delete(tabDoc(uid, t.id));
};

export interface PayInput {
  amount: number;
  method: string;
  note: string;
  items?: Record<string, number>; // paying by items: item id → how many
  shiftId: string;
}

// Takes a payment: unsent dishes go to the kitchen first, the sale is booked in the accounts, and the
// bill closes when nothing is left to pay. Returns what is left to pay.
export const payTab = (uid: string, tabId: string, input: PayInput, actor: Actor) =>
  runTransaction(db, async (tx) => {
    const t = await readTab(tx, uid, tabId);
    const seq = await kitchenNumber(tx, uid, t);
    const items = sendUnsent(tx, uid, t, actor, seq).map((i) => (input.items?.[i.id] ? { ...i, paidQty: Math.min(i.qty, i.paidQty + input.items[i.id]) } : i));
    const due = tabTotals(t).due;
    const amount = Math.min(due, Math.max(0, Math.round(input.amount * 100) / 100));
    const payment: TabPayment = {
      id: newId('pay'),
      at: new Date().toISOString(),
      amount,
      method: input.method,
      workerId: actor.workerId,
      workerName: actor.workerName,
      deviceId: actor.deviceId,
      deviceName: actor.deviceName,
      shiftId: input.shiftId,
      note: input.note,
    };
    const next: Tab = { ...t, items, payments: amount > 0 ? [...t.payments, payment] : t.payments };
    if (amount > 0) {
      tx.set(doc(col(uid, 'ledger'), `pay_${payment.id}`), clean({
        kind: 'income',
        date: todayKey(),
        createdAt: payment.at,
        amount,
        category: 'مبيعات الصالة',
        method: input.method,
        note: `${tabTitle(t)} · ${actor.workerName}`,
        source: 'cashier',
        orderId: t.id,
      }));
    }
    const left = tabTotals(next).due;
    if (left <= 0) closeInTx(tx, uid, next, actor);
    else tx.update(tabDoc(uid, tabId), { items: clean(next.items), payments: clean(next.payments) });
    return { paid: amount, left, total: tabTotals(next).total };
  });

// Closes a bill with nothing to pay (opened by mistake, or every dish cancelled).
export const closeEmptyTab = (uid: string, tabId: string, actor: Actor) =>
  runTransaction(db, async (tx) => {
    const t = await readTab(tx, uid, tabId);
    if (tabTotals(t).due > 0) throw new Error('due');
    closeInTx(tx, uid, t, actor);
  });

// Moves the bill to another table; when that table is occupied the two bills become one.
export const moveTab = (uid: string, tabId: string, to: TabPlace) =>
  runTransaction(db, async (tx) => {
    const t = await readTab(tx, uid, tabId);
    const targetId = openTabId(to.tableId);
    if (targetId === tabId) return targetId;
    const targetSnap = await tx.get(tabDoc(uid, targetId));
    const orderIds = [...new Set(t.items.map((i) => i.orderId).filter(Boolean))];
    const orderSnaps = await Promise.all(orderIds.map((id) => tx.get(doc(col(uid, 'orders'), id))));
    if (targetSnap.exists()) {
      const target = normalizeTab(targetId, targetSnap.data());
      tx.update(tabDoc(uid, targetId), clean({
        items: [...target.items, ...t.items],
        payments: [...target.payments, ...t.payments],
        discount: tabTotals(target).discount + tabTotals(t).discount,
        discountPct: 0,
        guests: target.guests + t.guests,
        note: [target.note, t.note].filter(Boolean).join(' · '),
      }) as any);
    } else {
      tx.set(tabDoc(uid, targetId), clean({ ...t, id: targetId, kind: 'table', tableId: to.tableId, table: to.table, hall: to.hall }));
    }
    tx.delete(tabDoc(uid, tabId));
    // The kitchen's tickets follow the bill to its new table.
    orderSnaps.forEach((o) => o.exists() && tx.update(o.ref, { table: to.table, tabId: targetId }));
    return targetId;
  });

// Opens a closed bill again on its table (the table must be free).
export const reopenTab = (uid: string, closed: Tab) =>
  runTransaction(db, async (tx) => {
    const id = openTabId(closed.tableId || newId('tw'));
    const s = await tx.get(tabDoc(uid, id));
    if (s.exists()) throw new Error('occupied');
    tx.set(tabDoc(uid, id), clean({ ...closed, id, status: 'open', closedAt: '', closedBy: '' }));
    tx.delete(tabDoc(uid, closed.id));
    return id;
  });

// Adds a guest's QR order to the table's bill (opening it if needed): its dishes are already in the
// kitchen, and its money is now taken with the bill instead of when the kitchen hands it over.
export const attachOrder = (uid: string, order: MenuOrder, place: TabPlace, actor: Actor) =>
  runTransaction(db, async (tx) => {
    const id = openTabId(place.tableId);
    const ref = tabDoc(uid, id);
    const s = await tx.get(ref);
    const orderSnap = await tx.get(doc(col(uid, 'orders'), order.id));
    if (orderSnap.exists() && orderSnap.data().tabId) return id;
    const t = s.exists() ? normalizeTab(id, s.data()) : newTab(id, place, actor);
    const items = order.lines.map((l) => ({ ...newItem(l, { ...actor, workerName: 'QR' }), sentAt: order.createdAt, orderId: order.id }));
    tx.set(ref, clean({ ...t, items: [...t.items, ...items], note: t.note || order.notes }));
    tx.update(doc(col(uid, 'orders'), order.id), { tabId: id });
    tx.delete(doc(col(uid, 'ledger'), `order_${order.id}`));
    return id;
  });

// ---------- Shifts and the log ----------

export const openShift = async (uid: string, actor: Actor) => {
  const id = newId('shf');
  const s: Shift = { id, workerId: actor.workerId, workerName: actor.workerName, deviceName: actor.deviceName, openedAt: new Date().toISOString(), closedAt: '', counted: 0, expectedCash: 0 };
  await setDoc(doc(col(uid, 'shifts'), id), clean(s));
  return id;
};

export const closeShift = (uid: string, shiftId: string, counted: number, expectedCash: number) =>
  updateDoc(doc(col(uid, 'shifts'), shiftId), { closedAt: new Date().toISOString(), counted, expectedCash });

export const addLog = (uid: string, e: Omit<LogEntry, 'id' | 'at'>) =>
  setDoc(doc(col(uid, 'log'), newId('log')), clean({ ...e, at: new Date().toISOString() })).catch((err) => console.warn('Could not write the log:', err));

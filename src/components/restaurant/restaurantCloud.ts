// The restaurant's live data in Firestore, apart from the owner's private design document:
//   restaurants/{uid}                 the published site: pages, elements, the menu and the public
//                                     settings. Anyone can read it (the guests' site and QR codes).
//   restaurants/{uid}/orders/{id}     the guests' orders. A guest can only add a new order; only the
//                                     owner reads and updates them (orders list, kitchen screen).
//   restaurants/{uid}/ledger/{id}     the accounts (الحسابات). Owner only. The cashier writes
//                                     each payment here too.
//   restaurants/{uid}/tabs|shifts|screens|log   the cashier and the waiters (see staffCloud.ts).
// See firestore.rules. Nothing private (orders, accounts, customers) is ever in the public doc.
import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDoc, limit, onSnapshot, orderBy, query, runTransaction, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { CanvasElement, Page } from '../../types';
import { LedgerEntry, MenuOrder, StaffDevice, OrderStatus, RestaurantAdminData, normalizeLedgerEntry, normalizeOrderRecord, normalizeRestaurantAdmin, orderLedgerEntry, setDayStartHour } from './restaurantTypes';
import { newId } from '../shop/shopTypes';
import { readNextNumber } from './orderNumbers';
import type { Worker } from './staffTypes';

const restaurantDoc = (uid: string) => doc(db, 'restaurants', uid);
const ordersCol = (uid: string) => collection(db, 'restaurants', uid, 'orders');
const ledgerCol = (uid: string) => collection(db, 'restaurants', uid, 'ledger');

// Firestore rejects undefined values; JSON drops them.
const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

// ---------- Published site ----------

export interface PublishedRestaurant {
  pages: Page[];
  elements: CanvasElement[];
  admin: RestaurantAdminData; // menu and settings only; orders always empty
}

export const publishRestaurant = (uid: string, pages: Page[], elements: CanvasElement[], admin: RestaurantAdminData) =>
  setDoc(restaurantDoc(uid), {
    pages: clean(pages),
    elements: clean(elements),
    menu: clean({
      categories: admin.categories.filter((c) => !c.hidden),
      subCatalogs: admin.subCatalogs,
      dishes: admin.dishes.filter((d) => d.published),
      // The kitchen screens and the tables' QR codes need these; the devices and their codes stay private.
      stations: admin.stations,
      halls: admin.halls,
    }),
    settings: clean(admin.settings),
    updatedAt: new Date().toISOString(),
  });

export const loadPublishedRestaurant = async (uid: string): Promise<PublishedRestaurant | null> => {
  const snap = await getDoc(restaurantDoc(uid));
  if (!snap.exists()) return null;
  const data: any = snap.data();
  const admin = normalizeRestaurantAdmin({ ...(data.menu || {}), settings: data.settings, orders: [] });
  setDayStartHour(admin.settings.dayStartHour);
  return {
    pages: Array.isArray(data.pages) ? data.pages : [],
    elements: Array.isArray(data.elements) ? data.elements : [],
    admin,
  };
};

// The guests' address of the site; `table` makes it a table's QR link.
export const restaurantSiteUrl = (uid: string, table?: string | number) => {
  const base = `${window.location.origin}/?r=${encodeURIComponent(uid)}`;
  return table ? `${base}&t=${encodeURIComponent(String(table))}` : base;
};

export const kitchenScreenUrl = (uid: string) => `${window.location.origin}/?kitchen=${encodeURIComponent(uid)}`;

// The address every restaurant tablet opens once; its code then picks its screen.
export const deviceUrl = (uid: string) => `${window.location.origin}/?device=${encodeURIComponent(uid)}`;

// The devices and the workers (with their PINs) are kept in the owner's design document, which only
// the owner (and, for now, the test accounts) can read. Real per-device sign-in comes with the
// separate customer/owner levels.
export const loadStaff = async (uid: string): Promise<{ devices: StaffDevice[]; workers: Worker[] }> => {
  const snap = await getDoc(doc(db, 'designs', uid));
  const admin = normalizeRestaurantAdmin(snap.exists() ? (snap.data() as any).restaurantAdmin || {} : {});
  return { devices: admin.devices, workers: admin.workers };
};

export const setOrderDoneLines = (uid: string, orderId: string, doneLines: number[]) => updateDoc(doc(ordersCol(uid), orderId), { doneLines });

// ---------- Orders ----------

// Gives up after a while on a bad connection, so the guest is offered WhatsApp instead of waiting.
// Writes a guest's order with the day's next number and returns that number.
export const placeOrder = (uid: string, order: MenuOrder, timeoutMs = 15000) =>
  Promise.race([
    runTransaction(db, async (tx) => {
      const next = await readNextNumber(tx, uid);
      next?.take();
      const number = next?.n ?? order.number;
      tx.set(doc(ordersCol(uid), order.id), clean({ ...order, number }));
      return number;
    }),
    new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('timeout')), timeoutMs)),
  ]);

// A delivered order adds its sale to the accounts; taking it back from «تم التسليم» removes it.
// The staff's orders and the ones added to a table's bill are paid at the cashier, which books them.
export const syncOrderLedger = (uid: string, order: MenuOrder, status: OrderStatus) =>
  order.source === 'staff' || order.tabId
    ? Promise.resolve()
    : status === 'done'
    ? setDoc(doc(ledgerCol(uid), `order_${order.id}`), clean(orderLedgerEntry(order)))
    : order.status === 'done'
      ? deleteDoc(doc(ledgerCol(uid), `order_${order.id}`))
      : Promise.resolve();

export const setOrderStatus = (uid: string, order: MenuOrder, status: OrderStatus) =>
  Promise.all([updateDoc(doc(ordersCol(uid), order.id), { status }), syncOrderLedger(uid, order, status)]);

export const deleteOrder = (uid: string, id: string) => deleteDoc(doc(ordersCol(uid), id));

export type LiveState<T> = { items: T[]; ready: boolean; error: string };

// The newest orders, live. `error` is set when Firestore refuses (e.g. the rules are not deployed).
export function useLiveOrders(uid: string | null, max = 300): LiveState<MenuOrder> {
  const [state, setState] = useState<LiveState<MenuOrder>>({ items: [], ready: false, error: '' });
  useEffect(() => {
    if (!uid) return;
    setState((s) => ({ ...s, ready: false }));
    return onSnapshot(
      query(ordersCol(uid), orderBy('createdAt', 'desc'), limit(max)),
      (snap) => setState({ items: snap.docs.map((d) => normalizeOrderRecord({ ...d.data(), id: d.id })), ready: true, error: '' }),
      (e) => setState({ items: [], ready: true, error: e.code || e.message })
    );
  }, [uid, max]);
  return state;
}

// ---------- Accounts ----------

export const addLedgerEntry = (uid: string, entry: Omit<LedgerEntry, 'id'>) => setDoc(doc(ledgerCol(uid), newId('led')), clean(entry));
export const deleteLedgerEntry = (uid: string, id: string) => deleteDoc(doc(ledgerCol(uid), id));

export function useLedger(uid: string | null, max = 2000): LiveState<LedgerEntry> {
  const [state, setState] = useState<LiveState<LedgerEntry>>({ items: [], ready: false, error: '' });
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      query(ledgerCol(uid), orderBy('date', 'desc'), limit(max)),
      (snap) => setState({ items: snap.docs.map((d) => normalizeLedgerEntry(d.id, d.data())), ready: true, error: '' }),
      (e) => setState({ items: [], ready: true, error: e.code || e.message })
    );
  }, [uid, max]);
  return state;
}

export const cloudErrorText = (code: string) =>
  code.includes('permission')
    ? 'قاعدة البيانات اللحظية غير مفعّلة بعد: يجب نشر قواعد Firebase الجديدة (firestore.rules) مرة واحدة.'
    : code
      ? 'تعذر الاتصال بقاعدة البيانات اللحظية. تحقق من الإنترنت.'
      : '';

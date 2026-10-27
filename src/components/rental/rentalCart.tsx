// A rental's booking cart (Eyad, 26 Oct): the visitor adds cars or items, sets the days or hours of each, and books them all
// at once, all or nothing (api/booking.ts, rent.items). The cart keeps each line (the warehouse id, how many, the dates, the
// driver and the services) in the visitor's browser, per page; the price and the free times are worked out when it is booked.
import React, { useContext, useMemo, useSyncExternalStore } from 'react';
import { KeyRound, ShoppingCart } from 'lucide-react';
import { BookingPageContext } from '../../services/bookings';
import type { RentBy } from '../../services/rentalBooking';

export const RENTAL_CART_OPEN = 'weelink-rental-cart-open';
const CHANGE = 'weelink-rental-cart-change';
const MAX_ITEMS = 8;

export interface RentLine {
  id: string; // the warehouse car or item
  qty: number; // identical copies of it
  on: boolean; // in the booking; off keeps it in the cart without booking it
  by: RentBy | '';
  date: string; // the day it starts (yyyy-mm-dd)
  checkOut: string; // by day: the day it is given back
  hours: number;
  start: number | null; // by hour: minutes from midnight
  period: string;
  driver: boolean;
  extras: string[];
  guests: number; // people, for a unit with a most or a price for one person
}

export const newLine = (id: string): RentLine => ({ id, qty: 1, on: true, by: '', date: '', checkOut: '', hours: 0, start: null, period: '', driver: false, extras: [], guests: 1 });

const lineOf = (raw: unknown): RentLine | null => {
  if (typeof raw === 'string') return raw ? newLine(raw) : null;
  const x = raw as Partial<RentLine> | null;
  if (!x || typeof x.id !== 'string' || !x.id) return null;
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  return {
    id: x.id,
    qty: Math.max(1, Math.round(Number(x.qty)) || 1),
    on: x.on !== false,
    by: x.by === 'day' || x.by === 'hour' || x.by === 'period' ? x.by : '',
    date: str(x.date), checkOut: str(x.checkOut),
    hours: Math.max(0, Math.round(Number(x.hours)) || 0),
    start: typeof x.start === 'number' ? x.start : null,
    period: str(x.period),
    driver: x.driver === true,
    extras: Array.isArray(x.extras) ? x.extras.filter((e): e is string => typeof e === 'string') : [],
    guests: Math.min(500, Math.max(1, Math.round(Number(x.guests)) || 1)),
  };
};

const parse = (raw: string): RentLine[] => {
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.map(lineOf).filter((l): l is RentLine => !!l).slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
};
const write = (key: string, lines: RentLine[]) => {
  try { localStorage.setItem(key, JSON.stringify(lines)); } catch { /* private mode: the cart lasts this page view only */ }
  window.dispatchEvent(new Event(CHANGE));
};

const subscribe = (cb: () => void) => {
  window.addEventListener(CHANGE, cb);
  window.addEventListener('storage', cb);
  return () => { window.removeEventListener(CHANGE, cb); window.removeEventListener('storage', cb); };
};

/** The cart of the page being viewed (in the editor, a preview cart of its own). */
export const useRentalCart = () => {
  const page = useContext(BookingPageContext);
  const key = `weelink_rental_cart_${page ? `${page.owner}_${page.project}` : 'preview'}`;
  const snapshot = useSyncExternalStore(subscribe, () => localStorage.getItem(key) || '[]', () => '[]');
  const lines = useMemo(() => parse(snapshot), [snapshot]);
  return {
    lines,
    ids: lines.map((l) => l.id),
    // What the navbar's count shows: the copies of every line.
    count: lines.reduce((n, l) => n + l.qty, 0),
    has: (id: string) => lines.some((l) => l.id === id),
    add: (id: string) => { if (!lines.some((l) => l.id === id) && lines.length < MAX_ITEMS) write(key, [...lines, newLine(id)]); },
    update: (id: string, patch: Partial<RentLine>) => write(key, lines.map((l) => (l.id === id ? { ...l, ...patch } : l))),
    // Only this line stays in the booking (the others stay in the cart).
    only: (id: string) => write(key, lines.map((l) => ({ ...l, on: l.id === id }))),
    remove: (id: string) => write(key, lines.filter((l) => l.id !== id)),
    clear: () => write(key, []),
    full: lines.length >= MAX_ITEMS,
  };
};

export const openRentalCart = () => window.dispatchEvent(new Event(RENTAL_CART_OPEN));

/** «أضف للسلة» on a car or item: in the cart it says so and opens the cart page (`onClose` closes the card first). */
export const RentalCartAdd: React.FC<{ itemId: string; accent: string; className?: string; onClose?: () => void }> = ({ itemId, accent, className = '', onClose }) => {
  const cart = useRentalCart();
  const inCart = cart.has(itemId);
  return (
    <button
      type="button"
      onClick={() => { if (!inCart) return cart.add(itemId); onClose?.(); openRentalCart(); }}
      disabled={!inCart && cart.full}
      className={`h-12 rounded-full border-2 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 ${className}`}
      style={{ borderColor: accent, color: accent }}
    >
      <ShoppingCart size={18} /> {inCart ? 'في السلة ✓ افتح السلة' : 'أضف للسلة'}
    </button>
  );
};

/** «اطلب الآن»: puts the car or item in the cart and opens the cart page straight away, nothing else. */
export const RentalOrderNow: React.FC<{ itemId: string; accent: string; className?: string; onClose?: () => void }> = ({ itemId, accent, className = '', onClose }) => {
  const cart = useRentalCart();
  return (
    <button
      type="button"
      onClick={() => { cart.add(itemId); onClose?.(); openRentalCart(); }}
      disabled={!cart.has(itemId) && cart.full}
      className={`h-12 rounded-full border-2 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 ${className}`}
      style={{ borderColor: accent, color: accent }}
    >
      <KeyRound size={18} /> اطلب الآن
    </button>
  );
};

// The visitor's restaurant order (السلة): dishes with the ingredients taken out, the extras added,
// a note and a quantity. Kept in localStorage so it survives moving between pages and reloads, and
// broadcast through a window event so the menu, the cart and the navbar badge stay in sync.
import { useSyncExternalStore } from 'react';
import type { OrderLine } from './restaurantTypes';

export interface MenuCartLine extends OrderLine {
  key: string;
  image: string;
}

const STORAGE_KEY = 'weelink_menu_cart';
const CHANGE_EVENT = 'weelink-menu-cart-change';

let cache: MenuCartLine[] | null = null;

function read(): MenuCartLine[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as MenuCartLine[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(lines: MenuCartLine[]) {
  cache = lines;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage unavailable (private mode): the cart still works for this page view.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// The same dish with the same choices and note is one cart line.
const lineKey = (l: Omit<MenuCartLine, 'key' | 'qty'>) =>
  [l.dishId, [...l.removed].sort().join(','), l.extras.map((e) => e.name).sort().join(','), l.notes.trim()].join('|');

export function addMenuLine(line: Omit<MenuCartLine, 'key'>) {
  const key = lineKey(line);
  const lines = read();
  const existing = lines.find((l) => l.key === key);
  write(existing ? lines.map((l) => (l.key === key ? { ...l, qty: l.qty + line.qty } : l)) : [...lines, { ...line, key }]);
}

export function setMenuLineQty(key: string, qty: number) {
  write(qty <= 0 ? read().filter((l) => l.key !== key) : read().map((l) => (l.key === key ? { ...l, qty } : l)));
}

export function clearMenuCart() {
  write([]);
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      onChange();
    }
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

const EMPTY: MenuCartLine[] = [];

export function useMenuCart(): MenuCartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const menuCartCount = (lines: MenuCartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
export const menuCartSubtotal = (lines: MenuCartLine[]) => lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);

// One cart line as text, for the WhatsApp message and the admin window.
export const describeLine = (l: Pick<OrderLine, 'removed' | 'extras' | 'notes'>) =>
  [
    l.removed.length ? `بدون ${l.removed.join('، ')}` : '',
    l.extras.length ? `مع ${l.extras.map((e) => e.name).join('، ')}` : '',
    l.notes.trim() ? `ملاحظة: ${l.notes.trim()}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

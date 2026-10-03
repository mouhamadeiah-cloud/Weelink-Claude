// Visitor shopping cart for shop sites: the products a visitor added with "أضف إلى السلة" buttons.
// Kept in localStorage so it survives moving between pages and reloads, and broadcast through a
// window event so every mounted cart view and the add-to-cart toast stay in sync.

import { useSyncExternalStore } from 'react';
import type { CartProduct } from '../types';

export interface CartItem extends CartProduct {
  key: string;
  qty: number;
}

const STORAGE_KEY = 'weelink_cart';
const CHANGE_EVENT = 'weelink-cart-change';

let cache: CartItem[] | null = null;

function read(): CartItem[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(items: CartItem[]) {
  cache = items;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode): the cart still works for this page view.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Same name + price = same product, so duplicated cards merge into one cart line.
const productKey = (p: CartProduct) => `${p.name}|${p.price}|${p.currency}`;

export function addToCart(product: CartProduct) {
  const key = productKey(product);
  const items = read();
  const existing = items.find((i) => i.key === key);
  write(
    existing
      ? items.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i))
      : [...items, { ...product, key, qty: 1 }]
  );
}

export function setCartQty(key: string, qty: number) {
  write(qty <= 0 ? read().filter((i) => i.key !== key) : read().map((i) => (i.key === key ? { ...i, qty } : i)));
}

export function clearCart() {
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

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, read, () => []);
}

export const formatPrice = (amount: number, currency: string) =>
  `${Number.isInteger(amount) ? amount : amount.toFixed(2)} ${currency}`;

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

// WhatsApp link carrying the whole order as a ready-to-send message.
export function buildWhatsappOrderUrl(items: CartItem[], phone: string) {
  const currency = items[0]?.currency || '';
  const lines = items.map((i) => `- ${i.name} × ${i.qty} = ${formatPrice(i.price * i.qty, i.currency)}`);
  const text = ['مرحبًا، أريد طلب:', ...lines, `المجموع: ${formatPrice(cartTotal(items), currency)}`].join('\n');
  return `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
}

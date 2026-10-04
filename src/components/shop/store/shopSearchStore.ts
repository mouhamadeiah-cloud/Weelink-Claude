// The visitor's store search, shared between the search bar ('shopSearch') and the product
// slides ('shopProducts'): submitting a search shows every matching product in the store's product
// slide. Kept in memory for the visit only.
import { useSyncExternalStore } from 'react';

interface ShopSearchState {
  query: string;
  // Set by a new search: the product slide scrolls itself into view once, then clears it.
  reveal: number;
}

let state: ShopSearchState = { query: '', reveal: 0 };
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const setShopSearch = (query: string) => {
  state = { query: query.trim(), reveal: query.trim() ? state.reveal + 1 : state.reveal };
  emit();
};

export const clearShopSearch = () => setShopSearch('');

// Asks the results slide to scroll into view again (a search made with filters instead of text).
export const bumpShopReveal = () => {
  state = { ...state, reveal: state.reveal + 1 };
  emit();
};

export const useShopSearch = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state
  );

// Arabic-aware matching: alef forms, taa marbuta and alef maqsura count as the same letter.
export const normalizeSearch = (s: string) =>
  s.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim();

export const matchesSearch = (fields: (string | undefined)[], query: string) => {
  const q = normalizeSearch(query);
  return !q || fields.some((f) => f && normalizeSearch(f).includes(q));
};

// A product slide scrolls into view once per search; the first one to ask takes it.
let revealed = 0;
export const takeReveal = (reveal: number) => {
  if (reveal <= revealed) return false;
  revealed = reveal;
  return true;
};

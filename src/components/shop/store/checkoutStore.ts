// The visitor's checkout choices (delivery or pickup, cash or wallet, which wallet), shared by
// the cart summary and the order form card: they can be two separate elements on the cart page
// and both need the same totals. Kept in memory for the visit only.
import { useSyncExternalStore, type CSSProperties } from 'react';
import type { CanvasElement } from '../../../types';
import type { WalletId } from '../shopTypes';

export interface CheckoutChoices {
  method: 'delivery' | 'pickup' | null; // null = the store's default
  pay: 'cash' | 'wallet' | null;
  walletId: WalletId | null;
}

let state: CheckoutChoices = { method: null, pay: null, walletId: null };
const listeners = new Set<() => void>();

export const setCheckoutChoices = (changes: Partial<CheckoutChoices>) => {
  state = { ...state, ...changes };
  listeners.forEach((l) => l());
};

export const useCheckoutChoices = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state
  );

// The texts of the cart and the order card; the merchant can replace each one (shopTexts).
export const CHECKOUT_TEXTS = {
  summaryTitle: 'ملخص السلة',
  empty: 'سلتك فارغة',
  totalLabel: 'الإجمالي النهائي',
  formTitle: 'إتمام الطلب',
  details: 'بياناتك',
  receive: 'الاستلام',
  payment: 'الدفع',
  submit: 'تأكيد الطلب',
  thanks: 'شكراً',
} as const;
export type CheckoutTextKey = keyof typeof CHECKOUT_TEXTS;

// How a cart / order card element looks, from its own styles (background, border and corners are
// drawn by the canvas around it): accent colour, text colour, font and texts.
export interface CheckoutLook {
  accent: string;
  ink: string;
  font: string;
  // No background set on the element: the component draws its own white card.
  framed: boolean;
  text: (k: CheckoutTextKey) => string;
}

export const checkoutLook = (elem: CanvasElement): CheckoutLook => ({
  // Carts made before the accent setting kept the accent in styles.color.
  accent: elem.shopAccent || elem.styles.color || '#B4532A',
  ink: (elem.shopAccent && elem.styles.color) || '#2A1F1A',
  font: `${elem.styles.fontFamily ? `${elem.styles.fontFamily}, ` : ''}'IBM Plex Sans Arabic', sans-serif`,
  framed: !elem.styles.backgroundColor && !elem.styles.backgroundImage,
  text: (k) => elem.shopTexts?.[k]?.trim() || CHECKOUT_TEXTS[k],
});

// CSS variables the components colour their text and lines with.
export const lookVars = (look: CheckoutLook) =>
  ({
    '--ink': look.ink,
    '--muted': `color-mix(in srgb, ${look.ink} 60%, transparent)`,
    '--line': `color-mix(in srgb, ${look.ink} 12%, transparent)`,
    '--soft': `color-mix(in srgb, ${look.ink} 5%, transparent)`,
    fontFamily: look.font,
  }) as CSSProperties;

// بطاقة رصيد (gift card): a fixed catalog of the cashier. The guest buys an amount, the bill prints a slip
// with a unique 16-digit number and a QR code, and the balance is spent later at the same restaurant by
// typing or scanning the number. The pure parts live here (no database), see staffCloud.ts for the rest.

export const GIFT_METHOD = 'بطاقة رصيد';

export type ExpiryUnit = 'day' | 'month' | 'year';

export interface GiftCardSettings {
  enabled: boolean;
  amounts: number[]; // the ready amounts on the cashier (500000, 1000000...)
  custom: boolean; // the cashier may also type any amount
  expiry: { never: boolean; n: number; unit: ExpiryUnit };
}

export const DEFAULT_GIFT_SETTINGS: GiftCardSettings = {
  enabled: false,
  amounts: [50000, 100000, 250000, 500000],
  custom: true,
  expiry: { never: false, n: 1, unit: 'year' },
};

export const EXPIRY_UNITS: { id: ExpiryUnit; label: string }[] = [
  { id: 'day', label: 'يوم' },
  { id: 'month', label: 'شهر' },
  { id: 'year', label: 'سنة' },
];

const positive = (v: unknown) => {
  const n = Number(v);
  return isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
};

export const normalizeGiftSettings = (raw: any): GiftCardSettings => {
  const amounts: number[] = Array.isArray(raw?.amounts) ? raw.amounts.map(positive).filter(Boolean) : DEFAULT_GIFT_SETTINGS.amounts;
  const unit: ExpiryUnit = raw?.expiry?.unit === 'day' || raw?.expiry?.unit === 'month' ? raw.expiry.unit : 'year';
  const n = Math.max(1, Math.min(999, Math.floor(Number(raw?.expiry?.n)) || 1));
  return {
    enabled: raw?.enabled === true,
    amounts: Array.from(new Set(amounts)).sort((a, b) => a - b).slice(0, 12),
    custom: raw?.custom !== false,
    expiry: raw?.expiry ? { never: raw.expiry.never === true, n, unit } : { ...DEFAULT_GIFT_SETTINGS.expiry },
  };
};

// The ready choices of the expiry picker: a year, six months, never. The rest is a number and a unit.
export const expiryPreset = (e: GiftCardSettings['expiry']): 'year' | 'six' | 'never' | 'custom' =>
  e.never ? 'never' : e.n === 1 && e.unit === 'year' ? 'year' : e.n === 6 && e.unit === 'month' ? 'six' : 'custom';

// When a card sold at `from` stops working ('' = never).
export const expiryFrom = (s: GiftCardSettings, from = new Date()): string => {
  if (s.expiry.never) return '';
  const d = new Date(from);
  if (s.expiry.unit === 'day') d.setDate(d.getDate() + s.expiry.n);
  else if (s.expiry.unit === 'month') d.setMonth(d.getMonth() + s.expiry.n);
  else d.setFullYear(d.getFullYear() + s.expiry.n);
  return d.toISOString();
};

// ---------- Numbers ----------

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

// Digits only, whatever the keyboard typed (Arabic-Indic digits, spaces, dashes).
export const cleanCardNumber = (s: string) =>
  s.replace(/[٠-٩]/g, (c) => String(ARABIC_DIGITS.indexOf(c))).replace(/\D/g, '');

export const isCardNumber = (s: string) => /^\d{16}$/.test(s);

export const formatCardNumber = (n: string) => n.replace(/(\d{4})(?=\d)/g, '$1 ').trim();

// 16 random digits (not a counter, so a number cannot be guessed from another one).
export const newCardNumber = (): string => {
  const parts = new Uint16Array(4);
  crypto.getRandomValues(parts);
  return Array.from(parts, (p) => String(p % 10000).padStart(4, '0')).join('');
};

// ---------- The card ----------

export interface CardUse {
  at: string;
  amount: number;
  place: string; // «طاولة 5 · أحمد»
}

export interface GiftCard {
  number: string;
  initial: number;
  balance: number;
  issuedAt: string;
  expiresAt: string; // '' = never
  issuedBy: string;
  uses: CardUse[];
}

export const normalizeCard = (number: string, raw: any): GiftCard => ({
  number,
  initial: Math.max(0, Number(raw?.initial) || 0),
  balance: Math.max(0, Number(raw?.balance) || 0),
  issuedAt: String(raw?.issuedAt || ''),
  expiresAt: String(raw?.expiresAt || ''),
  issuedBy: String(raw?.issuedBy || ''),
  uses: Array.isArray(raw?.uses) ? raw.uses.map((u: any) => ({ at: String(u?.at || ''), amount: Number(u?.amount) || 0, place: String(u?.place || '') })) : [],
});

export type CardState = 'ok' | 'expired' | 'empty';

export const cardState = (c: Pick<GiftCard, 'balance' | 'expiresAt'>, now = new Date()): CardState =>
  c.expiresAt && new Date(c.expiresAt).getTime() < now.getTime() ? 'expired' : c.balance <= 0 ? 'empty' : 'ok';

export const CARD_STATE_TEXT: Record<CardState, string> = {
  ok: '',
  expired: 'انتهت صلاحية هذه البطاقة',
  empty: 'لا يوجد رصيد في هذه البطاقة',
};

// What a card can pay towards a bill: never more than its balance.
export const cardPayable = (c: Pick<GiftCard, 'balance'>, due: number) => Math.round(Math.min(due, c.balance) * 100) / 100;

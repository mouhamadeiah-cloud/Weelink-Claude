// The deposit («عربون») of a booking (Eyad, 25 Oct). The page's «إعدادات الحجز» holds the e-wallet accounts
// the visitor pays to (the same ways the online shop uses: Syriatel / Sham / MTN Cash) and each schedule says
// if it asks for a deposit and how much: a percent of the price or a fixed amount. The visitor transfers it,
// sends the transaction number (and a screenshot), and the booking waits as «بانتظار العربون» until the
// owner confirms it. A booking nobody confirms within 24 hours is released (api/booking.ts, daily cron).
// The pure rules live here, used by the page (to show the amount) and by /api/booking (to decide).

export type DepositType = 'percent' | 'fixed';
export type DepositWalletId = 'syriatel' | 'sham' | 'mtn';

export interface DepositRule {
  on: boolean;
  type: DepositType;
  value: number;
}

export interface DepositWallet {
  enabled: boolean;
  account: string; // phone number (Syriatel, MTN) or account code (Sham Cash)
  holderName: string;
  qrImage: string; // image URL
  instructions: string;
}

export interface BookingPayments {
  currency: string; // shown after the amount, e.g. «ل.س» or «$»
  wallets: Record<DepositWalletId, DepositWallet>;
}

export const DEPOSIT_WALLETS: { id: DepositWalletId; label: string; accountLabel: string }[] = [
  { id: 'syriatel', label: 'سيريتل كاش', accountLabel: 'رقم الهاتف' },
  { id: 'sham', label: 'شام كاش', accountLabel: 'رمز الحساب / Address' },
  { id: 'mtn', label: 'MTN كاش', accountLabel: 'رقم الهاتف' },
];

export const HOLD_HOURS = 24;

const emptyWallet = (): DepositWallet => ({ enabled: false, account: '', holderName: '', qrImage: '', instructions: '' });

export const emptyPayments = (): BookingPayments => ({ currency: 'ل.س', wallets: { syriatel: emptyWallet(), sham: emptyWallet(), mtn: emptyWallet() } });

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : '');

export const normalizePayments = (raw: any): BookingPayments => {
  const base = emptyPayments();
  if (!raw || typeof raw !== 'object') return base;
  for (const { id } of DEPOSIT_WALLETS) {
    const w = raw.wallets?.[id];
    base.wallets[id] = {
      enabled: w?.enabled === true,
      account: str(w?.account, 60),
      holderName: str(w?.holderName, 60),
      qrImage: typeof w?.qrImage === 'string' && /^(https:\/\/|data:image\/)/.test(w.qrImage) && w.qrImage.length < 400000 ? w.qrImage : '',
      instructions: str(w?.instructions, 600),
    };
  }
  base.currency = str(raw.currency, 12) || base.currency;
  return base;
};

// The wallets a visitor can pay a deposit with: enabled and with an account to pay to.
export const usableWallets = (p: BookingPayments | null | undefined) => DEPOSIT_WALLETS.filter((w) => !!p && p.wallets[w.id].enabled && !!p.wallets[w.id].account);

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

// The first number in a free-text price: «25$ للشخص» → 25, «٥٠ ألف ل.س» → 50. null when there is none.
export const priceNumber = (text: unknown): number | null => {
  const latin = String(text ?? '').replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d))).replace(/٫/g, '.').replace(/,/g, '');
  const m = latin.match(/\d+(?:\.\d+)?/);
  const n = m ? Number(m[0]) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const normalizeRule = (raw: { depositOn?: unknown; depositType?: unknown; depositValue?: unknown } | null | undefined, canPercent: boolean): DepositRule => {
  const value = Math.max(0, Math.round((Number(raw?.depositValue) || 0) * 100) / 100);
  const type: DepositType = raw?.depositType === 'percent' && canPercent ? 'percent' : 'fixed';
  return { on: raw?.depositOn === true, type, value: type === 'percent' ? Math.min(100, value) : value };
};

// The deposit for a booking whose full price is `base` (null when the price is unknown): a fixed amount is
// asked as it is, a percent needs a known price. 0 = no deposit is asked.
export const depositAmount = (rule: DepositRule | null | undefined, base: number | null): number => {
  if (!rule || !rule.on || rule.value <= 0) return 0;
  if (rule.type === 'fixed') return Math.round(rule.value * 100) / 100;
  return base ? Math.round(((base * rule.value) / 100) * 100) / 100 : 0;
};

export interface DepositProof {
  wallet: DepositWalletId;
  txn: string;
  screenshot: string;
}

// What the visitor sent, or null when it is not usable.
export const parseProof = (raw: any, payments: BookingPayments | null | undefined): DepositProof | null => {
  const wallet = DEPOSIT_WALLETS.find((w) => w.id === raw?.wallet)?.id;
  if (!wallet || !usableWallets(payments).some((w) => w.id === wallet)) return null;
  const txn = str(raw?.txn, 60);
  if (txn.length < 3) return null;
  const screenshot = typeof raw?.screenshot === 'string' && /^(https:\/\/|\/img\/)/.test(raw.screenshot) ? raw.screenshot.slice(0, 600) : '';
  return { wallet, txn, screenshot };
};

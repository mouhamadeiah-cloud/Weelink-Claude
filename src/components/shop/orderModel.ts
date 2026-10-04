// Order helpers shared by the admin orders page and the store's checkout page: stock effect,
// order numbers, the payment methods a store offers and e-wallet fees.
import {
  ShopAdminData, ShopOrder, ShopOrderItem, PaymentMethodId, WalletId, WalletSettings, WALLETS, newId,
} from './shopTypes';
import { changeStock } from './productModel';

export const orderItemName = (i: ShopOrderItem) => (i.variant ? `${i.name} (${i.variant})` : i.name);

// Applies the stock and sales-ledger effect of an order (sign 1 = take out, -1 = put back).
export const applyOrderStock = (d: ShopAdminData, order: ShopOrder, sign: 1 | -1): ShopAdminData => ({
  ...d,
  products: d.products.map((p) =>
    order.items.filter((i) => i.productId === p.id).reduce((acc, i) => changeStock(acc, -sign * i.qty, i.variant), p)
  ),
  movements:
    sign === 1
      ? [
          ...order.items.map((i) => ({
            id: newId('mov'), type: 'sale' as const, productId: i.productId, name: orderItemName(i), qty: i.qty,
            unitAmount: i.price, orderId: order.id, createdAt: order.createdAt,
          })),
          ...d.movements,
        ]
      : d.movements.filter((m) => m.orderId !== order.id),
});

export const nextOrderNumber = (d: ShopAdminData) => d.orders.reduce((m, o) => Math.max(m, o.number), 1000) + 1;

// Adds an order and takes its items out of stock.
export const addOrder = (d: ShopAdminData, order: ShopOrder): ShopAdminData => {
  const next = applyOrderStock(d, order, 1);
  return { ...next, orders: [order, ...next.orders] };
};

export const walletOf = (method: PaymentMethodId) => WALLETS.find((w) => w.method === method);

// The e-wallets the visitor can choose (cash on delivery aside).
export const enabledWallets = (d: ShopAdminData) =>
  d.settings.payments.walletsEnabled ? WALLETS.filter((w) => d.settings.payments.wallets[w.id].enabled) : [];

export const enabledPaymentMethods = (d: ShopAdminData): PaymentMethodId[] => {
  const ids: PaymentMethodId[] = [];
  if (d.settings.payments.cash) ids.push('cash');
  enabledWallets(d).forEach((w) => ids.push(w.method));
  if (d.settings.payments.gateway) ids.push('gateway');
  return ids.length ? ids : ['cash'];
};

// The wallet's extra fee for an amount (a percentage of it, or a fixed amount).
export const walletFee = (w: WalletSettings, amount: number) => {
  if (!w.feeValue || w.feeValue <= 0) return 0;
  const fee = w.feeType === 'percent' ? (amount * w.feeValue) / 100 : w.feeValue;
  return Math.round(fee * 100) / 100;
};

export const walletSettings = (d: ShopAdminData, id: WalletId) => d.settings.payments.wallets[id];

// The visitor's WhatsApp message for an order, from the confirmation template.
export const orderConfirmationText = (d: ShopAdminData, order: ShopOrder) =>
  (d.settings.orderConfirmationMessage || '').split('{رقم_الطلب}').join(String(order.number));

// wa.me link to a phone number (digits only, international format) with a message.
export const whatsappLink = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(text)}`;

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Adds one visit for today, at most once per browser session.
export const recordVisit = (update: (fn: (d: ShopAdminData) => ShopAdminData) => void) => {
  const key = dayKey(new Date());
  try {
    if (sessionStorage.getItem(`weelink_visit_${key}`)) return;
    sessionStorage.setItem(`weelink_visit_${key}`, '1');
  } catch {
    // Session storage unavailable: count the visit anyway.
  }
  update((d) => ({ ...d, visits: { ...d.visits, [key]: (d.visits[key] || 0) + 1 } }));
};

// Data model for an "Online Shop" project's admin panel (لوحة إدارة المتجر).
// It is saved with the shop project in the user's design document (field `shopAdmin`).
import type { GalleryLayout } from '../../types';

export type ProjectType = 'page' | 'shop' | 'cars' | 'restaurant' | 'jobs';

export interface ShopCatalog {
  id: string;
  name: string;
  parentId: string | null; // null = top-level catalog, otherwise a sub-catalog
  images: string[]; // up to MAX_IMAGES
  createdAt: string;
}

// One choice of a product option, e.g. "أحمر" (with its colour) or "XL".
export interface OptionValue {
  label: string;
  color?: string;
}

// A product option such as size or colour. When it affects stock, every combination of the
// stock options gets its own quantity (see ShopProduct.variants). Otherwise it is descriptive:
// a single value is shown as a spec, several values let the customer choose without stock.
export interface ProductOption {
  id: string;
  name: string;
  kind: 'color' | 'size' | 'text';
  values: OptionValue[];
  affectsStock: boolean;
}

// One combination of the stock options, e.g. ["أحمر", "L"], with its own quantity.
export interface ProductVariant {
  values: string[]; // labels, in the order of the product's stock options
  stock: number;
  priceDelta: number; // added to the unit price for this combination
}

// "عند شراء 3 أو أكثر: 2500 للقطعة".
export interface PriceTier {
  minQty: number;
  price: number;
}

export type ProductBadge = '' | 'offer' | 'limited' | 'new' | 'bestseller' | 'discount';

export const PRODUCT_BADGES: { id: ProductBadge; label: string }[] = [
  { id: '', label: 'بدون وسم' },
  { id: 'offer', label: 'عرض خاص' },
  { id: 'limited', label: 'كمية محدودة' },
  { id: 'new', label: 'جديد' },
  { id: 'bestseller', label: 'الأكثر مبيعاً' },
  { id: 'discount', label: 'خصم (يُحسب تلقائياً)' },
];

export const MAX_STOCK_OPTIONS = 3;
export const MAX_PRICE_TIERS = 3;
export const MAX_RELATED = 5;

// 'card' = a card in the store grid; 'slide' = a full-width row: the main image as a fixed
// background, with the name, price and button in a narrow strip along its bottom.
export type ProductDisplay = 'card' | 'slide';

// A card's width on the store page: 100 = the original width, 50 (default) = half of it.
export type CardSize = 25 | 50 | 100;
export const CARD_SIZES: CardSize[] = [25, 50, 100];
export type CardCorners = 'rounded' | 'soft' | 'square' | 'leaf';

// The look of a product's card: optional frame, the text area's colours and the corners.
export interface CardStyle {
  border: boolean;
  borderColor: string;
  textColor: string; // '' = the store's colours
  textBg: string; // '' = white
  corners: CardCorners;
}

export const DEFAULT_CARD_STYLE: CardStyle = { border: false, borderColor: '#B4532A', textColor: '', textBg: '', corners: 'rounded' };

export interface ShopProduct {
  id: string;
  name: string;
  description: string; // rich text (HTML)
  shortDescription: string;
  showShortDescription: boolean; // shown under the name on the store page
  price: number; // selling price
  oldPrice: number; // shown struck through when higher than price (0 = none)
  currency: string;
  cost: number; // purchase cost per unit (for the accounts page)
  stock: number; // total; the sum of the variants when the product has stock options
  sku: string;
  images: string[]; // up to MAX_IMAGES; the first one is the main image
  galleryLayout: GalleryLayout;
  display: ProductDisplay; // how it sits on the store page: a grid card or a full-width slide
  cardSize: CardSize; // card width (display 'card')
  cardStyle: CardStyle;
  featured: boolean; // also shown in the store's «عروض مميزة» slides
  badge: ProductBadge;
  tiers: PriceTier[];
  deliveryPrice: number | null; // null = the store's delivery fee
  options: ProductOption[];
  variants: ProductVariant[];
  catalogIds: string[];
  published: boolean; // true = shown on the store page
  inWarehouse: boolean; // true = stock is counted; false = sold from the store without stock
  relatedIds: string[]; // up to MAX_RELATED products shown at the bottom of the floating card
  createdAt: string;
}

export interface ShopCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  registered?: boolean; // signed up from the checkout page
  province?: string;
  createdAt: string;
}

export type OrderStatus = 'awaiting-payment' | 'new' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUSES: { id: OrderStatus; label: string; color: string }[] = [
  { id: 'awaiting-payment', label: 'بانتظار تأكيد الدفع', color: '#bf5af2' },
  { id: 'new', label: 'جديد', color: '#0071e3' },
  { id: 'preparing', label: 'قيد التحضير', color: '#ff9f0a' },
  { id: 'shipped', label: 'تم الشحن', color: '#5e5ce6' },
  { id: 'delivered', label: 'تم التسليم', color: '#34c759' },
  { id: 'cancelled', label: 'ملغى', color: '#ff3b30' },
];

export interface ShopOrderItem {
  productId: string;
  name: string;
  variant?: string; // e.g. "أحمر / L" for products with stock options
  price: number;
  qty: number;
}

// The visitor's details from the checkout page, kept on the order even without an account.
export interface OrderContact {
  name: string;
  province?: string;
  address: string;
  email: string;
  whatsapp: string;
}

// What the visitor sent after paying with an e-wallet.
export interface OrderPayment {
  fee: number; // the wallet's extra fee, included in the order total
  transactionId: string;
  screenshot: string; // image URL
  paidAt: string;
  rejectReason?: string;
}

export interface ShopOrder {
  id: string;
  number: number;
  customerId: string; // '' for a visitor who ordered without an account
  contact?: OrderContact;
  items: ShopOrderItem[];
  total: number;
  deliveryFee?: number;
  status: OrderStatus;
  paymentMethod: PaymentMethodId;
  payment?: OrderPayment;
  deliveryMethod: 'delivery' | 'pickup';
  note: string;
  source?: 'admin' | 'checkout';
  createdAt: string;
}

// A stock movement: a purchase adds stock (cost), a sale removes it (price).
export interface ShopMovement {
  id: string;
  type: 'purchase' | 'sale';
  productId: string;
  name: string;
  qty: number;
  unitAmount: number;
  orderId?: string;
  createdAt: string;
}

// Profit or expense the merchant enters by hand, from outside the store page (الحسابات الجانبية).
export interface ShopEntry {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  reason: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export const SYRIAN_GOVERNORATES = [
  'دمشق', 'ريف دمشق', 'حلب', 'حمص', 'حماة', 'اللاذقية', 'طرطوس', 'إدلب', 'درعا', 'السويداء', 'القنيطرة', 'دير الزور', 'الحسكة', 'الرقة',
];

export type PaymentMethodId = 'cash' | 'syriatel-cash' | 'sham-cash' | 'mtn-cash' | 'gateway';

export const PAYMENT_METHODS: { id: PaymentMethodId; label: string }[] = [
  { id: 'cash', label: 'الدفع عند الاستلام' },
  { id: 'syriatel-cash', label: 'سيريتل كاش' },
  { id: 'sham-cash', label: 'شام كاش' },
  { id: 'mtn-cash', label: 'MTN كاش' },
  { id: 'gateway', label: 'مخدّم دفع إلكتروني' },
];

export type WalletId = 'syriatel' | 'sham' | 'mtn';

// An e-wallet the visitor can pay with: they transfer the amount to the merchant's account,
// then send the transaction number and a screenshot; the merchant confirms the payment.
export interface WalletSettings {
  enabled: boolean;
  account: string; // phone number (Syriatel, MTN) or account code / address (Sham Cash)
  holderName: string;
  qrImage: string;
  feeType: 'percent' | 'fixed';
  feeValue: number; // 0 = no extra fee
  minOrder: number; // 0 = no minimum
  instructions: string;
}

export const WALLETS: { id: WalletId; method: PaymentMethodId; label: string; accountLabel: string; phone: boolean }[] = [
  { id: 'syriatel', method: 'syriatel-cash', label: 'سيريتل كاش', accountLabel: 'رقم الهاتف', phone: true },
  { id: 'sham', method: 'sham-cash', label: 'شام كاش', accountLabel: 'رمز الحساب / Address', phone: false },
  { id: 'mtn', method: 'mtn-cash', label: 'MTN كاش', accountLabel: 'رقم الهاتف', phone: true },
];

const emptyWallet = (): WalletSettings => ({
  enabled: false, account: '', holderName: '', qrImage: '', feeType: 'fixed', feeValue: 0, minOrder: 0, instructions: '',
});

export interface ShopSettings {
  storeName: string;
  currency: string;
  senderEmail: string;
  orderConfirmationMessage: string;
  offersMessage: string;
  whatsappNumber: string;
  payments: {
    cash: boolean; // cash on delivery
    walletsEnabled: boolean;
    wallets: Record<WalletId, WalletSettings>;
    // Older single-field wallet settings, read once into `wallets` by normalizeShopAdmin.
    shamCash: boolean;
    shamCashAccount: string;
    syriatelCash: boolean;
    syriatelCashNumber: string;
    gateway: boolean;
    gatewayProvider: string;
    gatewayMerchantId: string;
  };
  notifications: {
    emailConfirmation: boolean; // template: orderConfirmationMessage
    whatsappNotify: boolean; // lets the merchant send the visitor a WhatsApp message per order
  };
  // Sham Cash API link. The API key itself never goes here (this document is readable by the
  // store page); it will live on the server when the link is built.
  api: {
    webhookUrl: string;
  };
  delivery: {
    delivery: boolean;
    deliveryFee: number;
    // An order with products of different delivery prices: 'highest' charges the highest one
    // once, 'sum' adds the delivery price of every product in the order.
    feeMode: DeliveryFeeMode;
    freeEnabled: boolean;
    freeFrom: number; // free delivery when the products total reaches this amount
    deliveryAreas: string;
    pickup: boolean;
    storeAddress: string;
  };
}

export type DeliveryFeeMode = 'highest' | 'sum';

export interface ShopAdminData {
  catalogs: ShopCatalog[];
  products: ShopProduct[];
  customers: ShopCustomer[];
  orders: ShopOrder[];
  movements: ShopMovement[];
  entries: ShopEntry[];
  visits: Record<string, number>; // store page visits per day (YYYY-MM-DD)
  settings: ShopSettings;
}

export const MAX_IMAGES = 5;

export const CURRENCIES = ['ل.س', '$', '€', 'ر.س', 'د.إ', 'د.أ', 'ج.م', 'د.ع', 'ل.ل', 'ل.ت', 'د.ك', 'ر.ق'];

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  storeName: '',
  currency: 'ل.س',
  senderEmail: '',
  orderConfirmationMessage: 'شكراً لطلبك من متجرنا! تم استلام طلبك رقم {رقم_الطلب} وسنتواصل معك قريباً لتأكيد التوصيل.',
  offersMessage: 'عروض جديدة بانتظارك في متجرنا! تفضّل بزيارتنا واكتشف أحدث المنتجات.',
  whatsappNumber: '',
  payments: {
    cash: true,
    walletsEnabled: false,
    wallets: { syriatel: emptyWallet(), sham: emptyWallet(), mtn: emptyWallet() },
    shamCash: false,
    shamCashAccount: '',
    syriatelCash: false,
    syriatelCashNumber: '',
    gateway: false,
    gatewayProvider: '',
    gatewayMerchantId: '',
  },
  notifications: {
    emailConfirmation: true,
    whatsappNotify: false,
  },
  api: {
    webhookUrl: '',
  },
  delivery: {
    delivery: true,
    deliveryFee: 0,
    feeMode: 'highest',
    freeEnabled: false,
    freeFrom: 0,
    deliveryAreas: '',
    pickup: false,
    storeAddress: '',
  },
};

export const createEmptyShopAdmin = (): ShopAdminData => ({
  catalogs: [],
  products: [],
  customers: [],
  orders: [],
  movements: [],
  entries: [],
  visits: {},
  settings: DEFAULT_SHOP_SETTINGS,
});

// Fills in product fields added after the first version of the panel.
export const normalizeProduct = (p: any, currency: string): ShopProduct => ({
  id: p.id,
  name: p.name || '',
  description: p.description || '',
  shortDescription: p.shortDescription || '',
  showShortDescription: p.showShortDescription ?? true,
  price: Number(p.price) || 0,
  oldPrice: Number(p.oldPrice) || 0,
  currency: p.currency || currency,
  cost: Number(p.cost) || 0,
  stock: Number(p.stock) || 0,
  sku: p.sku || '',
  images: Array.isArray(p.images) ? p.images : [],
  galleryLayout: p.galleryLayout || 'top-main',
  display: p.display === 'slide' ? 'slide' : 'card',
  cardSize: CARD_SIZES.includes(p.cardSize) ? p.cardSize : 50,
  cardStyle: { ...DEFAULT_CARD_STYLE, ...(p.cardStyle || {}) },
  featured: !!p.featured,
  badge: p.badge || '',
  tiers: Array.isArray(p.tiers) ? p.tiers : [],
  deliveryPrice: typeof p.deliveryPrice === 'number' ? p.deliveryPrice : null,
  options: Array.isArray(p.options) ? p.options : [],
  variants: Array.isArray(p.variants) ? p.variants : [],
  catalogIds: Array.isArray(p.catalogIds) ? p.catalogIds : [],
  published: p.published ?? true,
  inWarehouse: p.inWarehouse ?? true,
  relatedIds: Array.isArray(p.relatedIds) ? p.relatedIds : [],
  createdAt: p.createdAt || new Date().toISOString(),
});

// Fills in anything missing from data saved by an older version of the panel.
// Wallet settings, filling in fields and carrying over the older Sham Cash / Syriatel Cash fields.
const normalizePayments = (raw: any): ShopSettings['payments'] => {
  const base = DEFAULT_SHOP_SETTINGS.payments;
  const p = { ...base, ...(raw || {}) };
  const saved = raw?.wallets || {};
  const wallet = (id: WalletId, legacyOn: boolean, legacyAccount: string): WalletSettings => ({
    ...emptyWallet(),
    ...(saved[id] || { enabled: !!legacyOn, account: legacyAccount || '' }),
  });
  const wallets = {
    syriatel: wallet('syriatel', p.syriatelCash, p.syriatelCashNumber),
    sham: wallet('sham', p.shamCash, p.shamCashAccount),
    mtn: wallet('mtn', false, ''),
  };
  return {
    ...p,
    wallets,
    walletsEnabled: typeof raw?.walletsEnabled === 'boolean' ? raw.walletsEnabled : !!(p.shamCash || p.syriatelCash),
  };
};

export const normalizeShopAdmin = (raw: any): ShopAdminData => {
  const base = createEmptyShopAdmin();
  if (!raw || typeof raw !== 'object') return base;
  return {
    catalogs: Array.isArray(raw.catalogs) ? raw.catalogs : [],
    products: Array.isArray(raw.products) ? raw.products.map((p: any) => normalizeProduct(p, raw.settings?.currency || base.settings.currency)) : [],
    customers: Array.isArray(raw.customers) ? raw.customers : [],
    orders: Array.isArray(raw.orders) ? raw.orders : [],
    movements: Array.isArray(raw.movements) ? raw.movements : [],
    entries: Array.isArray(raw.entries) ? raw.entries : [],
    visits: raw.visits && typeof raw.visits === 'object' ? raw.visits : {},
    settings: {
      ...base.settings,
      ...(raw.settings || {}),
      payments: normalizePayments(raw.settings?.payments),
      notifications: { ...base.settings.notifications, ...(raw.settings?.notifications || {}) },
      api: { ...base.settings.api, ...(raw.settings?.api || {}) },
      delivery: { ...base.settings.delivery, ...(raw.settings?.delivery || {}) },
    },
  };
};

export const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// Data model for an "Online Shop" project's admin panel (لوحة إدارة المتجر).
// It is saved with the shop project in the user's design document (field `shopAdmin`).
import type { GalleryLayout } from '../../types';

export type ProjectType = 'page' | 'shop';

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
  createdAt: string;
}

export type OrderStatus = 'new' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUSES: { id: OrderStatus; label: string; color: string }[] = [
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

export interface ShopOrder {
  id: string;
  number: number;
  customerId: string;
  items: ShopOrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethodId;
  deliveryMethod: 'delivery' | 'pickup';
  note: string;
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

export type PaymentMethodId = 'cash' | 'sham-cash' | 'syriatel-cash' | 'gateway';

export const PAYMENT_METHODS: { id: PaymentMethodId; label: string }[] = [
  { id: 'cash', label: 'الدفع نقداً (كاش)' },
  { id: 'sham-cash', label: 'شام كاش' },
  { id: 'syriatel-cash', label: 'سيريتل كاش' },
  { id: 'gateway', label: 'مخدّم دفع إلكتروني' },
];

export interface ShopSettings {
  storeName: string;
  currency: string;
  senderEmail: string;
  orderConfirmationMessage: string;
  offersMessage: string;
  whatsappNumber: string;
  payments: {
    cash: boolean;
    shamCash: boolean;
    shamCashAccount: string;
    syriatelCash: boolean;
    syriatelCashNumber: string;
    gateway: boolean;
    gatewayProvider: string;
    gatewayMerchantId: string;
  };
  delivery: {
    delivery: boolean;
    deliveryFee: number;
    deliveryAreas: string;
    pickup: boolean;
    storeAddress: string;
  };
}

export interface ShopAdminData {
  catalogs: ShopCatalog[];
  products: ShopProduct[];
  customers: ShopCustomer[];
  orders: ShopOrder[];
  movements: ShopMovement[];
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
    shamCash: false,
    shamCashAccount: '',
    syriatelCash: false,
    syriatelCashNumber: '',
    gateway: false,
    gatewayProvider: '',
    gatewayMerchantId: '',
  },
  delivery: {
    delivery: true,
    deliveryFee: 0,
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
export const normalizeShopAdmin = (raw: any): ShopAdminData => {
  const base = createEmptyShopAdmin();
  if (!raw || typeof raw !== 'object') return base;
  return {
    catalogs: Array.isArray(raw.catalogs) ? raw.catalogs : [],
    products: Array.isArray(raw.products) ? raw.products.map((p: any) => normalizeProduct(p, raw.settings?.currency || base.settings.currency)) : [],
    customers: Array.isArray(raw.customers) ? raw.customers : [],
    orders: Array.isArray(raw.orders) ? raw.orders : [],
    movements: Array.isArray(raw.movements) ? raw.movements : [],
    settings: {
      ...base.settings,
      ...(raw.settings || {}),
      payments: { ...base.settings.payments, ...(raw.settings?.payments || {}) },
      delivery: { ...base.settings.delivery, ...(raw.settings?.delivery || {}) },
    },
  };
};

export const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

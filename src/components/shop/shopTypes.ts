// Data model for an "Online Shop" project's admin panel (لوحة إدارة المتجر).
// It is saved with the shop project in the user's design document (field `shopAdmin`).

export type ProjectType = 'page' | 'shop';

export interface ShopCatalog {
  id: string;
  name: string;
  parentId: string | null; // null = top-level catalog, otherwise a sub-catalog
  images: string[]; // up to MAX_IMAGES
  createdAt: string;
}

export interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: number; // selling price
  cost: number; // purchase cost per unit (for the accounts page)
  stock: number;
  sku: string;
  images: string[]; // up to MAX_IMAGES
  catalogIds: string[];
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

// Fills in anything missing from data saved by an older version of the panel.
export const normalizeShopAdmin = (raw: any): ShopAdminData => {
  const base = createEmptyShopAdmin();
  if (!raw || typeof raw !== 'object') return base;
  return {
    catalogs: Array.isArray(raw.catalogs) ? raw.catalogs : [],
    products: Array.isArray(raw.products) ? raw.products : [],
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

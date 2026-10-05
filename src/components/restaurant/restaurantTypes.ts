// Restaurant project (Weelink / Restaurant): the menu is the one source every channel reads. Phase 1
// is the website: main catalogs (أقسام المنيو), sub-catalogs (removable ingredients or paid extras)
// linked to one or more main catalogs, dishes, the orders the website hands in, and the settings.
// Built after the owner's GastroPOS app: a dish shows the sub-catalogs linked to its catalog, unless
// the dish picks its own.
import { newId } from '../shop/shopTypes';
import { Worker, normalizeWorker } from './staffTypes';

// A main catalog of the menu: مشاوي، سندويش، مشروبات...
export interface MenuCategory {
  id: string;
  name: string;
  icon: string; // an emoji shown on the menu's tabs
  image: string;
  hidden: boolean;
  stationId: string; // the kitchen section that prepares its dishes ('' = the first one)
}

export interface SubCatalogItem {
  id: string;
  name: string;
  price: number; // extras only: added to the dish's price when picked
}

// A sub-catalog: a group of ingredients the guest may remove (picked by default, free) or of paid
// extras the guest may add. It shows on every dish of the main catalogs it is linked to.
export type SubCatalogType = 'ingredients' | 'extras';

export interface SubCatalog {
  id: string;
  name: string;
  type: SubCatalogType;
  items: SubCatalogItem[];
  categoryIds: string[];
}

export type DishBadge = '' | 'new' | 'popular' | 'spicy' | 'offer' | 'vegetarian';

export const DISH_BADGES: { id: DishBadge; label: string; color: string }[] = [
  { id: '', label: 'بدون', color: '' },
  { id: 'popular', label: 'الأكثر طلبًا', color: '#E8590C' },
  { id: 'new', label: 'جديد', color: '#1971C2' },
  { id: 'offer', label: 'عرض', color: '#C2255C' },
  { id: 'spicy', label: 'حار', color: '#E03131' },
  { id: 'vegetarian', label: 'نباتي', color: '#2F9E44' },
];

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice: number; // shown struck through when higher than the price
  categoryId: string;
  image: string;
  badge: DishBadge;
  featured: boolean;
  available: boolean; // false = shown as «نفد اليوم», cannot be ordered
  published: boolean; // false = hidden from the website
  // null = the sub-catalogs linked to the dish's catalog; a list = only these sub-catalogs.
  subCatalogIds: string[] | null;
  hiddenItemIds: string[]; // items of its sub-catalogs this dish does not offer
  createdAt: string;
}

export interface RestaurantSettings {
  name: string;
  currency: string;
  whatsapp: string;
  phone: string;
  address: string;
  hours: string;
  acceptOrders: boolean;
  delivery: boolean;
  pickup: boolean;
  deliveryFee: number;
  minOrder: number;
  orderNote: string; // shown above the order form, e.g. delivery areas
  whatsappCopy: boolean; // also open WhatsApp with the order when a guest sends one
  tables: number; // how many tables get a QR code
  payAnyWorker: boolean; // a table's bill can be paid at any worker (false = only at the one who opened it)
  autoLockMinutes: number; // the cashier/waiter screen asks for a PIN again after this idle time (0 = never)
  boardShows: 'takeaway' | 'all'; // the waiting screen: only orders the guest collects, or every order
  kitchenLateMinutes: number; // an order not ready after this long flashes red in the kitchen
}

// ---------- Kitchen sections, halls, tables and devices (the staff side) ----------

// A section of the kitchen (المطبخ، المشاوي، البار...). Each menu catalog is prepared by one section,
// and a kitchen screen can show one section only.
export interface KitchenStation {
  id: string;
  name: string;
  color: string;
}

export interface RestTable {
  id: string;
  name: string; // what the guests and the staff call it: «5», «تراس 2»; also the QR code's table
  seats: number;
}

// A hall of the restaurant (الصالة الداخلية، التراس، الحديقة) with its tables.
export interface Hall {
  id: string;
  name: string;
  tables: RestTable[];
}

export type DeviceRole = 'kitchen' | 'cashier' | 'combo' | 'waiter' | 'display' | 'board';

export const DEVICE_ROLES: { id: DeviceRole; label: string; hint: string }[] = [
  { id: 'kitchen', label: 'شاشة مطبخ', hint: 'تعرض الطلبات للتحضير، لكل الأقسام أو لقسم واحد.' },
  { id: 'cashier', label: 'كاشير', hint: 'الطاولات والطلبات والدفع.' },
  { id: 'combo', label: 'كاشير ومطبخ', hint: 'للمطعم الصغير: الكاشير وشاشة المطبخ على جهاز واحد، وزر للتنقل بينهما.' },
  { id: 'waiter', label: 'تابلت نادل', hint: 'نفس برنامج الكاشير، يحمله النادل بين الطاولات.' },
  { id: 'display', label: 'شاشة الزبون', hint: 'تعرض للزبون طلبه والمبلغ عند الكاشير.' },
  { id: 'board', label: 'شاشة الانتظار', hint: 'تعرض للزبائن أرقام الطلبات قيد التحضير والجاهزة للاستلام، حسب حالة المطبخ.' },
];

// A tablet or screen of the restaurant. Its code opens only its own screen on that device.
export interface StaffDevice {
  id: string;
  name: string;
  role: DeviceRole;
  stationId: string; // kitchen screens: '' = every section
  code: string; // 6 digits
  displayFor: string; // customer screens: the cashier device whose bills it shows
  active: boolean;
  createdAt: string;
}

export const STATION_COLORS = ['#E8590C', '#1971C2', '#2F9E44', '#C2255C', '#7048E8', '#F08C00', '#0C8599', '#868E96'];

export const DEFAULT_STATIONS: KitchenStation[] = [
  { id: 'st-kitchen', name: 'المطبخ', color: '#E8590C' },
  { id: 'st-bar', name: 'البار والمشروبات', color: '#1971C2' },
];

const tablesOf = (prefix: string, from: number, count: number): RestTable[] =>
  Array.from({ length: count }, (_, i) => ({ id: `${prefix}-${from + i}`, name: String(from + i), seats: 4 }));

export const defaultHalls = (tables: number): Hall[] => [{ id: 'hall-main', name: 'الصالة الرئيسية', tables: tablesOf('tbl', 1, Math.max(0, Math.min(100, tables))) }];

export const allTables = (halls: Hall[]) => halls.flatMap((h) => h.tables.map((t) => ({ ...t, hallId: h.id, hallName: h.name })));

// The hall a table name belongs to ('' when no hall has it).
export const hallOfTable = (halls: Hall[], table: string) => halls.find((h) => h.tables.some((t) => t.name === table))?.name || '';

// A new six-digit code no other device has.
export const newDeviceCode = (devices: StaffDevice[]) => {
  for (;;) {
    const c = String(Math.floor(100000 + Math.random() * 900000));
    if (!devices.some((d) => d.code === c)) return c;
  }
};

// The kitchen section a dish goes to: its catalog's section, else the first section.
export const stationOfDish = (dishId: string, data: Pick<RestaurantAdminData, 'dishes' | 'categories' | 'stations'>) => {
  const dish = data.dishes.find((d) => d.id === dishId);
  const cat = dish && data.categories.find((c) => c.id === dish.categoryId);
  const id = cat?.stationId;
  return (id && data.stations.some((s) => s.id === id) ? id : data.stations[0]?.id) || '';
};

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'done' | 'cancelled';

export const ORDER_STATUSES: { id: OrderStatus; label: string; color: string }[] = [
  { id: 'new', label: 'جديد', color: '#E03131' },
  { id: 'preparing', label: 'قيد التحضير', color: '#E8590C' },
  { id: 'ready', label: 'جاهز', color: '#1971C2' },
  { id: 'done', label: 'تم التسليم', color: '#2F9E44' },
  { id: 'cancelled', label: 'ملغى', color: '#868E96' },
];

export interface OrderLine {
  dishId: string;
  name: string;
  unitPrice: number; // dish price plus the picked extras
  qty: number;
  removed: string[]; // names of the ingredients taken out
  extras: { name: string; price: number }[];
  notes: string;
}

export type OrderType = 'delivery' | 'pickup' | 'table';

// Where an order came from: the website, a table's QR code, or the staff (cashier, waiter).
export type OrderSource = 'website' | 'qr' | 'staff';

export interface MenuOrder {
  id: string;
  number: number;
  createdAt: string;
  status: OrderStatus;
  type: OrderType;
  source: OrderSource;
  table: string; // type 'table': the table's number
  name: string;
  phone: string;
  address: string;
  notes: string;
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  // Set by the kitchen only (never part of a guest's new order): the lines it has finished.
  doneLines?: number[];
  // Set by the staff only: the table's bill it was added to (its money is taken there, not here).
  tabId?: string;
}

export interface RestaurantAdminData {
  categories: MenuCategory[];
  subCatalogs: SubCatalog[];
  dishes: Dish[];
  orders: MenuOrder[];
  settings: RestaurantSettings;
  stations: KitchenStation[];
  halls: Hall[];
  devices: StaffDevice[];
  workers: Worker[];
}

export const DEFAULT_RESTAURANT_SETTINGS: RestaurantSettings = {
  name: '',
  currency: 'ل.س',
  whatsapp: '',
  phone: '',
  address: '',
  hours: '',
  acceptOrders: true,
  delivery: true,
  pickup: true,
  deliveryFee: 0,
  minOrder: 0,
  orderNote: '',
  whatsappCopy: true,
  tables: 10,
  payAnyWorker: true,
  autoLockMinutes: 0,
  boardShows: 'takeaway',
  kitchenLateMinutes: 5,
};

export const createEmptyRestaurantAdmin = (): RestaurantAdminData => ({
  categories: [],
  subCatalogs: [],
  dishes: [],
  orders: [],
  settings: { ...DEFAULT_RESTAURANT_SETTINGS },
  stations: DEFAULT_STATIONS.map((s) => ({ ...s })),
  halls: defaultHalls(DEFAULT_RESTAURANT_SETTINGS.tables),
  devices: [],
  workers: [],
});

export const emptyDish = (categoryId = ''): Dish => ({
  id: '',
  name: '',
  description: '',
  price: 0,
  oldPrice: 0,
  categoryId,
  image: '',
  badge: '',
  featured: false,
  available: true,
  published: true,
  subCatalogIds: null,
  hiddenItemIds: [],
  createdAt: '',
});

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : Number(v) || 0);
const strList = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

const normalizeCategory = (raw: any): MenuCategory => ({
  id: str(raw?.id) || newId('cat'),
  name: str(raw?.name),
  icon: str(raw?.icon),
  image: str(raw?.image),
  hidden: !!raw?.hidden,
  stationId: str(raw?.stationId),
});

const normalizeSubCatalog = (raw: any): SubCatalog => ({
  id: str(raw?.id) || newId('sub'),
  name: str(raw?.name),
  type: raw?.type === 'extras' ? 'extras' : 'ingredients',
  items: Array.isArray(raw?.items)
    ? raw.items.map((i: any) => ({ id: str(i?.id) || newId('itm'), name: str(i?.name), price: Math.max(0, num(i?.price)) }))
    : [],
  categoryIds: strList(raw?.categoryIds),
});

const normalizeDish = (raw: any): Dish => ({
  ...emptyDish(),
  id: str(raw?.id) || newId('dish'),
  name: str(raw?.name),
  description: str(raw?.description),
  price: Math.max(0, num(raw?.price)),
  oldPrice: Math.max(0, num(raw?.oldPrice)),
  categoryId: str(raw?.categoryId),
  image: str(raw?.image),
  badge: DISH_BADGES.some((b) => b.id === raw?.badge) ? raw.badge : '',
  featured: !!raw?.featured,
  available: raw?.available !== false,
  published: raw?.published !== false,
  subCatalogIds: Array.isArray(raw?.subCatalogIds) ? strList(raw.subCatalogIds) : null,
  hiddenItemIds: strList(raw?.hiddenItemIds),
  createdAt: str(raw?.createdAt) || new Date().toISOString(),
});

const normalizeOrder = (raw: any): MenuOrder => ({
  id: str(raw?.id) || newId('ord'),
  number: num(raw?.number),
  createdAt: str(raw?.createdAt) || new Date().toISOString(),
  status: ORDER_STATUSES.some((s) => s.id === raw?.status) ? raw.status : 'new',
  type: raw?.type === 'pickup' || raw?.type === 'table' ? raw.type : 'delivery',
  source: raw?.source === 'qr' || raw?.source === 'staff' ? raw.source : 'website',
  table: str(raw?.table),
  name: str(raw?.name),
  phone: str(raw?.phone),
  address: str(raw?.address),
  notes: str(raw?.notes),
  lines: Array.isArray(raw?.lines)
    ? raw.lines.map((l: any) => ({
        dishId: str(l?.dishId),
        name: str(l?.name),
        unitPrice: num(l?.unitPrice),
        qty: Math.max(1, num(l?.qty)),
        removed: strList(l?.removed),
        extras: Array.isArray(l?.extras) ? l.extras.map((e: any) => ({ name: str(e?.name), price: num(e?.price) })) : [],
        notes: str(l?.notes),
      }))
    : [],
  subtotal: num(raw?.subtotal),
  deliveryFee: num(raw?.deliveryFee),
  total: num(raw?.total),
  ...(Array.isArray(raw?.doneLines) ? { doneLines: raw.doneLines.filter((n: unknown) => typeof n === 'number') } : {}),
  ...(typeof raw?.tabId === 'string' && raw.tabId ? { tabId: raw.tabId } : {}),
});

const normalizeStation = (raw: any, i: number): KitchenStation => ({
  id: str(raw?.id) || newId('st'),
  name: str(raw?.name),
  color: str(raw?.color) || STATION_COLORS[i % STATION_COLORS.length],
});

const normalizeHall = (raw: any): Hall => ({
  id: str(raw?.id) || newId('hall'),
  name: str(raw?.name),
  tables: Array.isArray(raw?.tables)
    ? raw.tables.map((t: any) => ({ id: str(t?.id) || newId('tbl'), name: str(t?.name), seats: Math.max(0, Math.round(num(t?.seats))) }))
    : [],
});

const normalizeDevice = (raw: any): StaffDevice => ({
  id: str(raw?.id) || newId('dev'),
  name: str(raw?.name),
  role: DEVICE_ROLES.some((r) => r.id === raw?.role) ? raw.role : 'kitchen',
  stationId: str(raw?.stationId),
  displayFor: str(raw?.displayFor),
  code: /^\d{6}$/.test(str(raw?.code)) ? raw.code : '',
  active: raw?.active !== false,
  createdAt: str(raw?.createdAt) || new Date().toISOString(),
});

export const normalizeOrderRecord = (raw: any): MenuOrder => normalizeOrder(raw);

export const normalizeRestaurantAdmin = (raw: any): RestaurantAdminData => ({
  settings: { ...DEFAULT_RESTAURANT_SETTINGS, ...(raw?.settings || {}) },
  categories: Array.isArray(raw?.categories) ? raw.categories.map(normalizeCategory) : [],
  subCatalogs: Array.isArray(raw?.subCatalogs) ? raw.subCatalogs.map(normalizeSubCatalog) : [],
  dishes: Array.isArray(raw?.dishes) ? raw.dishes.map(normalizeDish) : [],
  orders: Array.isArray(raw?.orders) ? raw.orders.map(normalizeOrder) : [],
  // Older restaurants had only a number of tables and no kitchen sections.
  stations: Array.isArray(raw?.stations) && raw.stations.length ? raw.stations.map(normalizeStation) : DEFAULT_STATIONS.map((s) => ({ ...s })),
  halls: Array.isArray(raw?.halls) ? raw.halls.map(normalizeHall) : defaultHalls(num(raw?.settings?.tables ?? DEFAULT_RESTAURANT_SETTINGS.tables)),
  devices: Array.isArray(raw?.devices) ? raw.devices.map(normalizeDevice).filter((d: StaffDevice) => d.code) : [],
  workers: Array.isArray(raw?.workers) ? raw.workers.map(normalizeWorker).filter((w: Worker) => w.pin) : [],
});

// The sub-catalogs a dish offers, each with only the items this dish keeps.
export const dishSubCatalogs = (dish: Dish, subCatalogs: SubCatalog[]): SubCatalog[] => {
  const picked = dish.subCatalogIds
    ? dish.subCatalogIds.map((id) => subCatalogs.find((s) => s.id === id)).filter((s): s is SubCatalog => !!s)
    : subCatalogs.filter((s) => s.categoryIds.includes(dish.categoryId));
  return picked
    .map((s) => ({ ...s, items: s.items.filter((i) => i.name.trim() && !dish.hiddenItemIds.includes(i.id)) }))
    .filter((s) => s.items.length > 0);
};

// What a visitor's order needs to be recorded in the admin window.
export type OrderInput = Omit<MenuOrder, 'id' | 'number' | 'createdAt' | 'status'>;

// A short number the kitchen and the guest can say out loud. Orders come from many devices at once,
// so it is taken from the clock (a sequence would need a server); it repeats only every 10000 seconds.
export const orderNumberNow = () => Math.floor(Date.now() / 1000) % 10000;

export const buildOrder = (o: OrderInput): MenuOrder => ({ ...o, id: newId('ord'), number: orderNumberNow(), createdAt: new Date().toISOString(), status: 'new' });

// Records an order in the admin data itself (used when the live orders cannot be reached).
export const submitOrder = (d: RestaurantAdminData, order: MenuOrder): RestaurantAdminData => ({ ...d, orders: [order, ...d.orders] });

// ---------- Accounts (الحسابات) ----------
// One line of the restaurant's books. The website's delivered orders add their sales here by
// themselves (source 'order'); the cashier will add its sales the same way (source 'cashier').

export type LedgerKind = 'income' | 'expense';
export type LedgerSource = 'manual' | 'order' | 'cashier';

export interface LedgerEntry {
  id: string;
  kind: LedgerKind;
  date: string; // the day it counts for, YYYY-MM-DD
  createdAt: string;
  amount: number;
  category: string;
  method: string;
  note: string;
  source: LedgerSource;
  orderId: string;
}

export const INCOME_CATEGORIES = ['مبيعات الموقع', 'مبيعات الصالة', 'مبيعات التوصيل', 'إيرادات أخرى'];
export const EXPENSE_CATEGORIES = ['مواد غذائية', 'خضار ولحوم', 'مشروبات', 'رواتب', 'إيجار', 'كهرباء وماء', 'غاز ومحروقات', 'صيانة', 'تغليف', 'تسويق', 'مصاريف أخرى'];
export const PAYMENT_METHODS = ['نقدي', 'شام كاش', 'سيريتل كاش', 'MTN كاش', 'تحويل بنكي', 'بطاقة'];

export const todayKey = (d = new Date()) => {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

export const normalizeLedgerEntry = (id: string, raw: any): LedgerEntry => ({
  id,
  kind: raw?.kind === 'expense' ? 'expense' : 'income',
  date: /^\d{4}-\d{2}-\d{2}$/.test(str(raw?.date)) ? raw.date : todayKey(),
  createdAt: str(raw?.createdAt) || new Date().toISOString(),
  amount: Math.max(0, num(raw?.amount)),
  category: str(raw?.category),
  method: str(raw?.method),
  note: str(raw?.note),
  source: raw?.source === 'order' || raw?.source === 'cashier' ? raw.source : 'manual',
  orderId: str(raw?.orderId),
});

// The sales line a delivered order adds to the books.
export const orderLedgerEntry = (o: MenuOrder): Omit<LedgerEntry, 'id'> => ({
  kind: 'income',
  date: todayKey(new Date(o.createdAt)),
  createdAt: new Date().toISOString(),
  amount: o.total,
  category: o.type === 'delivery' ? 'مبيعات التوصيل' : o.type === 'table' ? 'مبيعات الصالة' : 'مبيعات الموقع',
  method: 'نقدي',
  note: `طلب #${o.number}${o.table ? ` · طاولة ${o.table}` : ''}${o.name ? ` · ${o.name}` : ''}`,
  source: 'order',
  orderId: o.id,
});

// ---------- Example menu (a first restaurant is not empty) ----------

export const foodPhoto = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const FOOD_PHOTOS = {
  grill: '1555939594-58d7cb561ad1',
  mezze: '1541518763669-27fef04b14ea',
  plates: '1490645935967-10de6ba17061',
  burger: '1568901346375-23c9450c58cd',
  pizza: '1565299624946-b28f40a0ae38',
  shawarma: '1662116765994-1e4200c43589',
  falafel: '1593001869807-9b07543c8688',
  baklava: '1598110750624-207050c4f28c',
  drinks: '1544145945-f90425340c7e',
  coffee: '1509042239860-f550ce710b93',
  juice: '1513558161293-cdaf765ed2fd',
  pastries: '1555507036-ab1f4038808a',
};

export const exampleRestaurantAdmin = (): RestaurantAdminData => {
  const now = Date.now();
  const at = (i: number) => new Date(now - i * 60000).toISOString();
  const cats: MenuCategory[] = [
    { id: 'cat-grill', name: 'مشاوي', icon: '🔥', image: '', hidden: false, stationId: 'st-kitchen' },
    { id: 'cat-sandwich', name: 'سندويش وبرغر', icon: '🍔', image: '', hidden: false, stationId: 'st-kitchen' },
    { id: 'cat-salad', name: 'سلطات ومقبلات', icon: '🥗', image: '', hidden: false, stationId: 'st-kitchen' },
    { id: 'cat-sweets', name: 'حلويات', icon: '🍰', image: '', hidden: false, stationId: 'st-kitchen' },
    { id: 'cat-drinks', name: 'مشروبات', icon: '🥤', image: '', hidden: false, stationId: 'st-bar' },
  ];
  const item = (id: string, name: string, price = 0): SubCatalogItem => ({ id, name, price });
  const subs: SubCatalog[] = [
    {
      id: 'sub-sandwich-ing', name: 'مكونات السندويش', type: 'ingredients', categoryIds: ['cat-sandwich'],
      items: [item('itm-garlic', 'ثوم'), item('itm-pickles', 'مخلل'), item('itm-tomato', 'بندورة'), item('itm-lettuce', 'خس'), item('itm-onion', 'بصل')],
    },
    {
      id: 'sub-sandwich-ext', name: 'إضافات', type: 'extras', categoryIds: ['cat-sandwich', 'cat-grill'],
      items: [item('itm-cheese', 'جبنة إضافية', 5000), item('itm-fries', 'بطاطا مقلية', 8000), item('itm-hummus', 'صحن حمص', 10000)],
    },
    {
      id: 'sub-grill-ing', name: 'مع الصحن', type: 'ingredients', categoryIds: ['cat-grill'],
      items: [item('itm-bread', 'خبز'), item('itm-grill-onion', 'بصل مشوي'), item('itm-grill-tomato', 'بندورة مشوية'), item('itm-toum', 'ثومية')],
    },
    {
      id: 'sub-drinks-ext', name: 'إضافات المشروب', type: 'extras', categoryIds: ['cat-drinks'],
      items: [item('itm-ice', 'ثلج إضافي', 0), item('itm-honey', 'عسل', 3000)],
    },
  ];
  const dish = (i: number, d: Partial<Dish>): Dish => ({ ...emptyDish(), id: `dish-ex-${i}`, createdAt: at(i), ...d });
  const dishes: Dish[] = [
    dish(1, { name: 'شيش طاووق', description: 'قطع دجاج متبلة على الفحم مع خبز وثومية.', price: 65000, categoryId: 'cat-grill', image: foodPhoto(FOOD_PHOTOS.grill), badge: 'popular', featured: true }),
    dish(2, { name: 'مشاوي مشكلة', description: 'كباب وشقف وطاووق لشخصين.', price: 140000, oldPrice: 160000, categoryId: 'cat-grill', image: foodPhoto(FOOD_PHOTOS.mezze), badge: 'offer', featured: true }),
    dish(3, { name: 'برغر لحم', description: 'لحم بلدي مشوي مع جبنة وخضار.', price: 55000, categoryId: 'cat-sandwich', image: foodPhoto(FOOD_PHOTOS.burger), featured: true }),
    dish(4, { name: 'سندويش شاورما', description: 'شاورما دجاج بخبز الصاج مع ثوم ومخلل.', price: 30000, categoryId: 'cat-sandwich', image: foodPhoto(FOOD_PHOTOS.shawarma), badge: 'popular' }),
    dish(5, { name: 'بيتزا خضار', description: 'عجينة رقيقة مع خضار وجبنة موزاريلا.', price: 60000, categoryId: 'cat-sandwich', image: foodPhoto(FOOD_PHOTOS.pizza), badge: 'vegetarian' }),
    dish(6, { name: 'فتوش', description: 'خضار طازجة مع خبز محمص ودبس رمان.', price: 25000, categoryId: 'cat-salad', image: foodPhoto(FOOD_PHOTOS.plates), badge: 'vegetarian' }),
    dish(7, { name: 'فلافل', description: 'أقراص فلافل مقرمشة مع طحينة وخضار.', price: 18000, categoryId: 'cat-salad', image: foodPhoto(FOOD_PHOTOS.falafel), badge: 'vegetarian' }),
    dish(8, { name: 'بقلاوة', description: 'بقلاوة بالفستق الحلبي.', price: 35000, categoryId: 'cat-sweets', image: foodPhoto(FOOD_PHOTOS.baklava), badge: 'new' }),
    dish(11, { name: 'معجنات حلوة', description: 'تشكيلة معجنات طازجة.', price: 25000, categoryId: 'cat-sweets', image: foodPhoto(FOOD_PHOTOS.pastries) }),
    dish(9, { name: 'عصير طبيعي', description: 'برتقال أو ليمون بالنعناع.', price: 20000, categoryId: 'cat-drinks', image: foodPhoto(FOOD_PHOTOS.juice) }),
    dish(10, { name: 'قهوة', description: 'إسبريسو أو قهوة عربية.', price: 12000, categoryId: 'cat-drinks', image: foodPhoto(FOOD_PHOTOS.coffee) }),
  ];
  return {
    ...createEmptyRestaurantAdmin(),
    categories: cats,
    subCatalogs: subs,
    dishes,
    halls: [
      { id: 'hall-main', name: 'الصالة الداخلية', tables: tablesOf('tbl', 1, 8) },
      { id: 'hall-terrace', name: 'التراس', tables: tablesOf('tbl', 9, 4) },
    ],
    settings: { ...DEFAULT_RESTAURANT_SETTINGS, name: 'مطعمك', whatsapp: '963991234567', deliveryFee: 10000, address: 'دمشق', hours: 'يوميًا من 11 صباحًا حتى 12 ليلًا' },
  };
};

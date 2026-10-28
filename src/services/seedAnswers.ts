// What the owner typed in Wee AI's questions (main groups and the first dishes with prices) becomes real menu data, so the
// page starts with his own list and not an empty one. Names already in the list are never added twice.
import { RestaurantAdminData, emptyDish } from '../components/restaurant/restaurantTypes';
import { ShopAdminData, newId, normalizeProduct } from '../components/shop/shopTypes';
import { CarAdminData, emptyCar } from '../components/cars/carTypes';

type Rows = Record<string, string>[] | undefined;

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
// "25,000", "٢٥٠٠٠ ل.س" and "25000" all give 25000; anything without digits gives 0.
export const priceOf = (text: unknown): number => {
  const latin = String(text ?? '').replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d))).replace(/[,٬،\s]/g, '');
  const n = Number(latin.match(/\d+(\.\d+)?/)?.[0]);
  return Number.isFinite(n) ? n : 0;
};

const filled = (rows: Rows) => (Array.isArray(rows) ? rows.filter((r) => r?.name?.trim()) : []);

export const seedRestaurant = (admin: RestaurantAdminData, answers: Record<string, any> | undefined): RestaurantAdminData => {
  const groups = filled(answers?.['restaurant:main.groups']);
  const dishes = filled(answers?.['restaurant:main.dishes']);
  if (!groups.length && !dishes.length) return admin;
  const categories = [...admin.categories];
  groups.forEach((g) => {
    const name = g.name.trim();
    if (!categories.some((c) => c.name === name)) categories.push({ id: newId('cat'), name, icon: '', image: '', hidden: false, stationId: '' });
  });
  const list = [...admin.dishes];
  const at = new Date().toISOString();
  dishes.forEach((d) => {
    const name = d.name.trim();
    if (list.some((x) => x.name === name)) return;
    list.push({ ...emptyDish(categories[0]?.id || ''), id: newId('dish'), name, price: priceOf(d.price), createdAt: at });
  });
  return { ...admin, categories, dishes: list };
};

export const seedShop = (admin: ShopAdminData, answers: Record<string, any> | undefined): ShopAdminData => {
  const groups = filled(answers?.['shop:main.groups']);
  const products = filled(answers?.['shop:main.products']);
  if (!groups.length && !products.length) return admin;
  const at = new Date().toISOString();
  const catalogs = [...admin.catalogs];
  groups.forEach((g) => {
    const name = g.name.trim();
    if (!catalogs.some((c) => c.name === name)) catalogs.push({ id: newId('cat'), name, parentId: null, images: [], createdAt: at });
  });
  const first = catalogs.find((c) => !c.parentId)?.id;
  const list = [...admin.products];
  products.forEach((p) => {
    const name = p.name.trim();
    if (list.some((x) => x.name === name)) return;
    list.push(normalizeProduct({ id: newId('prod'), name, price: priceOf(p.price), catalogIds: first ? [first] : [], createdAt: at }, admin.settings.currency));
  });
  return { ...admin, catalogs, products: list };
};

// A car typed as «تويوتا كورولا 2018»: the first word is the brand, a four-digit year is the year, the rest the model.
export const seedCars = (admin: CarAdminData, answers: Record<string, any> | undefined): CarAdminData => {
  const cars = filled(answers?.['cars:main.cars']);
  if (!cars.length) return admin;
  const at = new Date().toISOString();
  const list = [...admin.cars];
  cars.forEach((c) => {
    const text = c.name.trim();
    if (list.some((x) => `${x.brand} ${x.model}`.trim() === text.replace(/\s*(19|20)\d\d\s*/, ' ').trim())) return;
    const year = Number(text.match(/\b(19|20)\d\d\b/)?.[0]) || 0;
    const [brand, ...rest] = text.replace(/\b(19|20)\d\d\b/, '').split(/\s+/).filter(Boolean);
    list.push({ ...emptyCar(admin.settings.currency), id: newId('car'), brand: brand || text, model: rest.join(' '), ...(year ? { year } : {}), price: priceOf(c.price), createdAt: at, updatedAt: at });
  });
  return { ...admin, cars: list };
};

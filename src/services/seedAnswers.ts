// What the owner typed in Wee AI's questions (main groups and the first dishes with prices) becomes real menu data, so the
// page starts with his own list and not an empty one. Names already in the list are never added twice.
import { RestaurantAdminData, emptyDish } from '../components/restaurant/restaurantTypes';
import { newId } from '../components/shop/shopTypes';

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

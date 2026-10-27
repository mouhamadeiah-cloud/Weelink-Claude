// Five example items for a new page's warehouse, so its live lists are not empty and the owner sees how an entry
// looks (Eyad, 27 Oct). They carry `sample` and go with one button («احذف الأمثلة») or one by one.
import { ShopAdminData, ShopProduct, newId, normalizeProduct } from '../components/shop/shopTypes';

type Row = [name: string, note: string, price: number, extra?: Partial<ShopProduct>];

const SHOP: Row[] = [
  ['قميص قطني', 'قميص يومي مريح بألوان هادئة.', 85000],
  ['حذاء رياضي', 'خفيف ومناسب للمشي الطويل.', 240000, { oldPrice: 280000 }],
  ['حقيبة يد', 'حقيبة جلد بحجم عملي.', 175000],
  ['ساعة يد', 'ساعة أنيقة مقاومة للماء.', 320000],
  ['نظارة شمسية', 'عدسات بحماية كاملة من الأشعة.', 120000],
];
const RENTAL: Row[] = [
  ['خيمة عائلية', 'تتسع لـ 6 أشخاص مع أرضية.', 60000, { copies: 3 }],
  ['طاولة وكراسي', 'طاولة مع 8 كراسي للمناسبات.', 35000, { copies: 5 }],
  ['مكبر صوت', 'صوت واضح للحفلات الصغيرة.', 80000],
  ['شاشة عرض', 'شاشة مع حامل ووصلات.', 90000],
  ['مولّد كهرباء', 'مولد هادئ بقدرة 5 كيلو واط.', 150000],
];
const HOTEL: Row[] = [
  ['غرفة مفردة', 'سرير مفرد وحمام خاص.', 200000, { maxGuests: 1 }],
  ['غرفة مزدوجة', 'سرير مزدوج مع إطلالة.', 320000, { maxGuests: 2 }],
  ['غرفة عائلية', 'تتسع لأربعة أشخاص مع شرفة.', 480000, { maxGuests: 4 }],
  ['جناح ملكي', 'غرفة نوم وصالة جلوس.', 750000, { maxGuests: 3, featured: true }],
  ['فيلا مع مسبح', 'فيلا كاملة لـ 8 أشخاص.', 1500000, { maxGuests: 8, featured: true }],
];

export type ExampleKind = 'shop' | 'rental' | 'hotel';
const ROWS: Record<ExampleKind, Row[]> = { shop: SHOP, rental: RENTAL, hotel: HOTEL };

export const exampleProducts = (kind: ExampleKind, currency: string): ShopProduct[] =>
  ROWS[kind].map(([name, note, price, extra], i) =>
    normalizeProduct(
      { id: newId('prd'), name, shortDescription: note, price, stock: 10, inWarehouse: kind === 'shop', featured: i < 3, createdAt: new Date(Date.now() - i * 60000).toISOString(), ...extra, sample: true },
      currency
    )
  );

export const withExampleProducts = (shop: ShopAdminData, kind: ExampleKind): ShopAdminData =>
  shop.products.length ? shop : { ...shop, products: exampleProducts(kind, shop.settings.currency) };

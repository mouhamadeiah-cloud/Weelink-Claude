// What of a project's admin data a published site may show. The published copy is public, so
// everything private stays out: purchase costs, customers, orders, accounts, documents, and the
// showroom's purchase details (price paid, VIN, notes, expenses, sale, reservation).
import { CarAdminData, normalizeCarAdmin } from '../cars/carTypes';
import { ShopAdminData, normalizeShopAdmin } from '../shop/shopTypes';
import type { ProjectType } from '../shop/shopTypes';

export const publicShopData = (shop: ShopAdminData) => ({
  catalogs: shop.catalogs,
  products: shop.products.filter((p) => p.published).map(({ cost: _cost, ...p }) => ({ ...p, cost: 0 })),
  settings: shop.settings,
});

export const publicCarData = (cars: CarAdminData) => ({
  cars: cars.cars
    .filter((c) => c.published && (c.status !== 'sold' || cars.settings.showSold))
    .map((c) => ({
      ...c,
      purchasePrice: 0,
      purchaseDate: '',
      purchaseFrom: '',
      vin: '',
      internalNotes: '',
      purchaseAccount: 'none' as const,
      purchaseTxId: '',
      expenses: [],
      sale: null,
      reservation: null,
      engineNumber: '',
      plateNumber: '',
    })),
  settings: {
    ...cars.settings,
    ownerName: '',
    commercialRecord: '',
  },
});

export const publicDataFor = (project: ProjectType, shop: ShopAdminData, cars: CarAdminData) =>
  project === 'shop' ? publicShopData(shop) : project === 'cars' ? publicCarData(cars) : null;

// Back to the shape the store elements read (empty customers, orders and accounts).
export const shopFromPublic = (data: any): ShopAdminData => normalizeShopAdmin(data || {});
export const carsFromPublic = (data: any): CarAdminData => normalizeCarAdmin(data || {});

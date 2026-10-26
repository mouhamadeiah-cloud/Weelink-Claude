// «تأجير» (Eyad, 25 Oct): one kind of project for renting out cars, equipment, chalets, halls and other
// things. It is built from the platform's own parts: the cars are the showroom's cars (car entry,
// inventory, car cards, car page) and everything else is the shop's products (product entry,
// warehouse, catalogs, product cards). Both live in the project's `rentalAdmin` field:
//   rentalAdmin: { cars: CarAdminData, shop: ShopAdminData }
// The booking by hour or day, the extras, the special prices and the contract come in the next steps.
import { createContext, useContext } from 'react';
import { CarAdminData, createEmptyCarAdmin, normalizeCarAdmin } from '../cars/carTypes';
import { ShopAdminData, ShopCatalog, createEmptyShopAdmin, normalizeShopAdmin } from '../shop/shopTypes';

export interface RentalAdminData {
  cars: CarAdminData;
  shop: ShopAdminData;
}

export const createEmptyRentalAdmin = (): RentalAdminData => ({ cars: createEmptyCarAdmin(), shop: createEmptyShopAdmin() });

export const normalizeRentalAdmin = (raw: any): RentalAdminData => ({
  cars: normalizeCarAdmin(raw?.cars || {}),
  shop: normalizeShopAdmin(raw?.shop || {}),
});

// What can be rented (src/data/rentalCategories.json): Wee AI asks «شو بتأجّر؟» from this list.
export const RENTAL_CARS = 'سيارات';

/** The rental is mostly cars: its page lists car cards; otherwise product cards. */
export const rentsCars = (category: string | null | undefined) => !category || category.trim() === RENTAL_CARS;

// A new rental's catalogs for the things that are not cars: one per kind, with its sub kinds, so the
// product entry has them ready. The owner's own kind comes first.
export const rentalCatalogs = (list: { name: string; subs: string[] }[], first?: string): ShopCatalog[] => {
  const now = new Date().toISOString();
  const kinds = list.filter((c) => c.name !== RENTAL_CARS);
  kinds.sort((a, b) => (a.name === first ? -1 : b.name === first ? 1 : 0));
  return kinds.flatMap((c, i) => {
    const id = `rent-cat-${i + 1}`;
    return [
      { id, name: c.name, parentId: null, images: [], createdAt: now },
      ...c.subs.map((s, j) => ({ id: `${id}-${j + 1}`, name: s, parentId: id, images: [], createdAt: now })),
    ];
  });
};

// What a rental's items count in the package's limit: every copy of an item counts (5 tents = 5).
export const rentalItemCount = (products: { copies?: number }[]) => products.reduce((n, p) => n + Math.max(1, p.copies || 1), 0);

// The items as the rental's pages show them: renting is not selling stock, so an item is never «sold
// out» (how many of one can be booked at once comes with the booking step).
export const rentalShopView = (shop: ShopAdminData): ShopAdminData => ({ ...shop, products: shop.products.map((p) => (p.inWarehouse === false ? p : { ...p, inWarehouse: false })) });

// True inside a rental project and on its published page: the car and product pages ask to rent
// instead of offering a test drive, a purchase or the cart.
export const RentalModeContext = createContext(false);
export const useRentalMode = () => useContext(RentalModeContext);

// True inside a hotel-and-property rental («تأجير فنادق ومساحات عقارية», Eyad 26 Oct): the same rental pages and
// admin, for hotel rooms, halls, villas and other property (no cars; its kinds come from estateCategories.json).
export const EstateModeContext = createContext(false);
export const useEstateMode = () => useContext(EstateModeContext);

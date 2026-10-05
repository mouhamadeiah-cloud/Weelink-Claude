// Example data the ready-slide picker shows inside its previews, so a shop, showroom or menu slide
// looks filled (with stock photos) before the user adds it. It never reaches the project's data.
import { ShopAdminData, createEmptyShopAdmin, normalizeProduct, DEFAULT_SHOP_SETTINGS } from '../shop/shopTypes';
import { CarAdminData, createEmptyCarAdmin, exampleCars } from '../cars/carTypes';
import { RestaurantAdminData, exampleRestaurantAdmin } from '../restaurant/restaurantTypes';
import { PRODUCTS } from '../../data/onlineShopTemplate';

let shop: ShopAdminData | null = null;
let cars: CarAdminData | null = null;
let restaurant: RestaurantAdminData | null = null;

export const demoShopAdmin = (): ShopAdminData => {
  if (!shop) {
    const currency = '$';
    shop = {
      ...createEmptyShopAdmin(),
      settings: { ...DEFAULT_SHOP_SETTINGS, currency },
      products: PRODUCTS.map((p, i) =>
        normalizeProduct(
          {
            id: `demo-product-${i}`,
            name: p.name,
            price: p.price,
            oldPrice: p.oldPrice || 0,
            images: [`https://images.unsplash.com/photo-${p.image}?auto=format&fit=crop&w=600&q=80`],
            badge: p.tag === 'خصم' ? 'discount' : p.tag === 'جديد' ? 'new' : p.tag ? 'bestseller' : '',
            featured: i % 2 === 0,
            published: true,
            stock: 10,
            createdAt: new Date(2026, 0, i + 1).toISOString(),
          },
          currency,
        ),
      ),
    };
  }
  return shop;
};

export const demoCarAdmin = (): CarAdminData => {
  if (!cars) cars = { ...createEmptyCarAdmin(), cars: exampleCars() };
  return cars;
};

export const demoRestaurantAdmin = (): RestaurantAdminData => {
  if (!restaurant) restaurant = exampleRestaurantAdmin();
  return restaurant;
};

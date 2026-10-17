// What each package allows (the features listed in src/data/plans.ts), the same in the editor and on
// the server (api/build-page.ts). Limits apply only once paying is switched on in the admin site and
// never to test accounts; until then nothing is limited (src/services/billing.ts, projectLimits).
//   items        dishes, products or cars
//   gallery      photos in one gallery element
//   devices      tablets and screens of a restaurant, the package's own plus the extra ones bought
//   builds       «ابن صفحتي» per day (perDay) or once for the project (perDay false)
export interface PlanLimits {
  items: number;
  gallery: number;
  devices: number;
  builds: number;
  perDay: boolean;
}

const NONE = Number.POSITIVE_INFINITY;
export const UNLIMITED: PlanLimits = { items: NONE, gallery: NONE, devices: NONE, builds: NONE, perDay: true };

// 30 and 60 keep the free page's gallery and build once a day; Pro gets 15 photos and 5 builds a day.
// The restaurant's 30 has no tablet (online orders only), 60 one tablet for kitchen and cashier, Pro
// one for each role (cashier, kitchen, bar, waiter).
const LIMITS: Record<string, PlanLimits> = {
  'page-free': { items: NONE, gallery: 5, devices: 0, builds: 1, perDay: false },
  'page-pro': { items: NONE, gallery: 15, devices: 0, builds: 5, perDay: true },
  'restaurant-30': { items: 30, gallery: 5, devices: 0, builds: 1, perDay: true },
  'restaurant-60': { items: 60, gallery: 5, devices: 1, builds: 1, perDay: true },
  'restaurant-pro': { items: NONE, gallery: 15, devices: 4, builds: 5, perDay: true },
  'shop-30': { items: 30, gallery: 5, devices: 0, builds: 1, perDay: true },
  'shop-60': { items: 60, gallery: 5, devices: 0, builds: 1, perDay: true },
  'shop-pro': { items: NONE, gallery: 15, devices: 0, builds: 5, perDay: true },
  'cars-30': { items: 30, gallery: 5, devices: 0, builds: 1, perDay: true },
  'cars-60': { items: 60, gallery: 5, devices: 0, builds: 1, perDay: true },
  'cars-pro': { items: NONE, gallery: 15, devices: 0, builds: 5, perDay: true },
};

/** A package's limits, with the extra devices bought on top; an unknown package is the free page's. */
export const limitsOf = (planId: string, extraDevices = 0): PlanLimits => {
  const l = LIMITS[planId] || LIMITS['page-free'];
  return { ...l, devices: l.devices + Math.max(0, Math.floor(Number(extraDevices) || 0)) };
};

/** The smallest of the given packages whose items limit holds `items`, or '' when none does. */
export const smallestFitting = (planIds: string[], items: number) => planIds.find((id) => limitsOf(id).items >= items) || '';

/** «30 صنف», «60 منتج»... the word for a kind's items. */
export const ITEM_WORD: Record<string, string> = { restaurant: 'صنف', shop: 'منتج', cars: 'سيارة', page: 'عنصر' };

export const isLimited = (n: number) => Number.isFinite(n);

/** A change that grows a count past its limit (one that shrinks it, or stays under, is fine). */
export const overLimit = (before: number, after: number, max: number) => after > before && after > max;

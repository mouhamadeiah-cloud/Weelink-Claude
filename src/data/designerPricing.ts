// What an owner pays a designer to take over their page, and the platform's share (Eyad, 14 Oct).
// Prices in Syrian pounds, per design, by the package the owner's page has (the ids of data/plans.ts).
// Prices and the share live here only. Nothing is charged yet: the payments phase reads this file.

export const PLATFORM_SHARE = 0.3;

const TIER_FREE = 199000;
const TIER_PRO_INTRO_AND_30 = 699000;
const TIER_60 = 899000;
const TIER_PRO = 1400000;

export const DESIGNER_PRICES: Record<string, number> = {
  'page-free': TIER_FREE,
  'page-pro': TIER_PRO_INTRO_AND_30,
  'restaurant-30': TIER_PRO_INTRO_AND_30,
  'cars-30': TIER_PRO_INTRO_AND_30,
  'shop-30': TIER_PRO_INTRO_AND_30,
  'restaurant-60': TIER_60,
  'cars-60': TIER_60,
  'shop-60': TIER_60,
  'restaurant-pro': TIER_PRO,
  'cars-pro': TIER_PRO,
  'shop-pro': TIER_PRO,
};

// The price for a page on that package, or null for a package that has none.
export const designerPrice = (planId: string): number | null => DESIGNER_PRICES[planId] ?? null;

// The designer's part of a price, and the platform's.
export const splitPrice = (price: number) => {
  const platform = Math.round(price * PLATFORM_SHARE);
  return { designer: price - platform, platform };
};

// What an owner pays a designer to take over their page, and the platform's share (Eyad, 14 Oct).
// The numbers live in designerPricing.json, which the server (api/design-orders.ts) reads too, so a
// price shown here is the price the order is made at. Prices are in Syrian pounds, per design, by the
// package the owner's page has (the ids of data/plans.ts).
import pricing from './designerPricing.json';

const PLATFORM_SHARE: number = pricing.platformShare;

const DESIGNER_PRICES: Record<string, number> = pricing.prices;

// The price for a page on that package, or null for a package that has none.
const designerPrice = (planId: string): number | null => DESIGNER_PRICES[planId] ?? null;

// The designer's part of a price, and the platform's.
export const splitPrice = (price: number) => {
  const platform = Math.round(price * PLATFORM_SHARE);
  return { designer: price - platform, platform };
};

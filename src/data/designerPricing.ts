// What an owner pays a designer to take over their page, and the platform's share (Eyad, 14 Oct).
// Prices in Syrian pounds, per design, by the kind of page and package the owner has. Prices and the
// share live here only. Nothing is charged yet: the payments phase reads this file.
import type { ProjectType } from '../components/shop/shopTypes';

export const PLATFORM_SHARE = 0.3;

export type DesignerJob = 'page-free' | 'page-pro' | 'restaurant' | 'cars' | 'shop';

export const DESIGNER_PRICES: Record<DesignerJob, { label: string; price: number }> = {
  'page-free': { label: 'صفحة مجانية', price: 199000 },
  'page-pro': { label: 'صفحة تعريفية Pro وفئة 30', price: 699000 },
  restaurant: { label: 'مطعم Pro', price: 899000 },
  cars: { label: 'معرض سيارات Pro', price: 899000 },
  shop: { label: 'متجر Pro', price: 1400000 },
};

export const designerJobFor = (kind: ProjectType, paid: boolean): DesignerJob =>
  kind === 'page' ? (paid ? 'page-pro' : 'page-free') : kind;

// The designer's part of a price, and the platform's.
export const splitPrice = (price: number) => {
  const platform = Math.round(price * PLATFORM_SHARE);
  return { designer: price - platform, platform };
};

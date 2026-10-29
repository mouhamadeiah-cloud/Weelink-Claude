// The kinds of site a page model builds for. A rental is of cars or of things (its first answer, «التصنيف»), and each one has its own
// search and featured slides (Eyad, 29 Oct: the real kind picks them, a rental is never built as a free page).
export type SiteKind = 'page' | 'restaurant' | 'shop' | 'cars' | 'rental-cars' | 'rental-items' | 'hotel';

/** The site a package builds: its type, a rental by what it rents. */
export const siteKindOf = (planId: string, category?: string | null): SiteKind => {
  const type = planId.split('-')[0];
  if (type === 'rental') return !category || category.trim() === 'سيارات' ? 'rental-cars' : 'rental-items';
  return type === 'restaurant' || type === 'shop' || type === 'cars' || type === 'hotel' ? type : 'page';
};

/** The sites a model may build for (a rental model builds both rentals). */
export const siteKindsOfModel = (modelId: string): SiteKind[] => {
  const type = modelId.split('-')[0];
  return type === 'rental' ? ['rental-cars', 'rental-items'] : [siteKindOf(modelId)];
};

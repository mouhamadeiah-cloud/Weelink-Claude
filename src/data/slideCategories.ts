// The kinds of slide in the designers' gallery (Eyad, 14 Oct). A designer picks one when exporting a
// slide, and the gallery filters by it. The ids are what is stored; the lists live here only
// (api/admin.ts checks a design's category against the same ids before approving it).
export const SLIDE_CATEGORIES: { id: string; label: string }[] = [
  { id: 'hero', label: 'واجهة' },
  { id: 'about', label: 'من نحن' },
  { id: 'services', label: 'خدمات وأسعار' },
  { id: 'gallery', label: 'معرض صور' },
  { id: 'team', label: 'فريق' },
  { id: 'reviews', label: 'آراء الزبائن' },
  { id: 'offers', label: 'عروض' },
  { id: 'booking', label: 'حجز مواعيد' },
  { id: 'contact', label: 'تواصل' },
  { id: 'menu', label: 'منيو مطعم' },
  { id: 'cars', label: 'سيارات' },
  { id: 'products', label: 'منتجات متجر' },
  { id: 'legal', label: 'شروط وخصوصية' },
  { id: 'other', label: 'أخرى' },
];

// What a designer can design (Eyad, 14 Oct): one slide, or a page: three slides with a navbar.
export type DesignKind = 'slide' | 'page';
export const PAGE_SLIDES = 3;
export const DESIGN_KIND_LABEL: Record<DesignKind, string> = { slide: 'شريحة', page: 'صفحة' };

// The kinds of page in the gallery. Their ids start with «p-» so they never meet a slide category's id.
export const PAGE_CATEGORIES: { id: string; label: string }[] = [
  { id: 'p-business', label: 'صفحة تعريفية' },
  { id: 'p-shop', label: 'متجر' },
  { id: 'p-restaurant', label: 'مطعم' },
  { id: 'p-cars', label: 'معرض سيارات' },
  { id: 'p-other', label: 'أخرى' },
];

export const categoriesFor = (kind: DesignKind) => (kind === 'page' ? PAGE_CATEGORIES : SLIDE_CATEGORIES);

export const categoryLabel = (id: string) => [...SLIDE_CATEGORIES, ...PAGE_CATEGORIES].find((c) => c.id === id)?.label || 'أخرى';

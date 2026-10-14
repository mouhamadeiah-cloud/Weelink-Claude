// The kinds of slide in the designers' gallery (Eyad, 14 Oct). A designer picks one when exporting a
// slide, and the gallery filters by it. The ids are what is stored; the list lives here only
// (api/admin.ts checks a slide's category against the same ids before approving it).
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

export const categoryLabel = (id: string) => SLIDE_CATEGORIES.find((c) => c.id === id)?.label || 'أخرى';

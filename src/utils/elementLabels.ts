// The Arabic name of each kind of element. Elements made from templates are often named by their
// type ("heading", "image"); those show this name instead.
import type { CanvasElement, ElementType } from '../types';

export const ELEMENT_TYPE_LABEL: Record<ElementType, string> = {
  heading: 'عنوان',
  paragraph: 'نص',
  button: 'زر',
  image: 'صورة',
  card: 'بطاقة',
  badge: 'شارة',
  input: 'حقل إدخال',
  divider: 'فاصل',
  icon: 'أيقونة',
  table: 'جدول',
  shape: 'شكل',
  video: 'فيديو',
  map: 'خريطة',
  pricing: 'أسعار',
  calendar: 'حجوزات',
  html: 'كود HTML',
  gallery: 'معرض صور',
  mask: 'صورة بقناع',
  cart: 'السلة',
  shopProducts: 'منتجات المتجر',
  shopSearch: 'بحث المتجر',
  checkout: 'إتمام الطلب',
  carListings: 'السيارات',
  carSearch: 'بحث السيارات',
  menuList: 'المنيو',
  menuCart: 'سلة الطلب',
};

export const elementDisplayName = (el: Pick<CanvasElement, 'name' | 'type'>) => {
  const name = el.name?.trim();
  return !name || name === el.type ? ELEMENT_TYPE_LABEL[el.type] || el.type : name;
};

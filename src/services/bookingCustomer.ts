// The customer's details common to every kind of booking, and what must be filled before it is sent.
import { kindOf, type ProjectKey } from '../utils/projectKeys';
import type { PageKind } from './pageCustomers';

export interface CustomerDraft {
  name: string;
  address: string;
  phone: string;
  email: string;
  desc: string;
  register: boolean; // make a Weelink account after the booking
  password: string;
}

export const EMPTY_CUSTOMER: CustomerDraft = { name: '', address: '', phone: '', email: '', desc: '', register: false, password: '' };

export interface CustomerLabels {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  desc?: string;
}

// What is missing before the booking can be sent; '' when it is ready.
export const customerProblem = (d: CustomerDraft, live: boolean, signedIn = false) => {
  if (d.name.trim().length < 2) return 'اكتب اسمك الكامل.';
  if (d.phone.replace(/\D/g, '').length < 6) return 'تأكد من رقم الهاتف، لازم يكون 6 أرقام على الأقل.';
  if ((live || d.register) && !d.email.trim()) return d.register ? 'التسجيل بحساب Weelink يحتاج إيميل.' : 'اكتب إيميلك ليوصلك تأكيد الحجز والتذكير.';
  if (d.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) return 'تأكد من الإيميل.';
  if (d.register && !signedIn && d.password.length < 6) return 'كلمة المرور 6 أحرف على الأقل.';
  return '';
};

export const pageKindOf = (project: ProjectKey): PageKind => {
  const k = kindOf(project);
  return k === 'page' || k === 'rental' || k === 'hotel' ? 'site' : k;
};


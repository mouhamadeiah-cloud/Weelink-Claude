// The invoice of a paid project (package, monthly or yearly, a restaurant's extra devices), the same in
// «نشر» and on the server (server/billing.ts), which writes it into the order.
import { EXTRA_DEVICE, PLANS, yearlyPrice } from '../data/plans.js';
import { kindOf } from './projectKeys.js';
import type { ProjectType } from '../components/shop/shopTypes';

export type Period = 'monthly' | 'yearly';
export interface InvoiceItem { label: string; amount: number }
export interface Invoice { plan: string; planName: string; period: Period; devices: number; items: InvoiceItem[]; total: number }

export const MAX_DEVICES = 20;
const KIND_NAMES: Record<ProjectType, string> = { page: 'صفحة', restaurant: 'مطعم', shop: 'متجر', cars: 'معرض سيارات', rental: 'تأجير', hotel: 'فنادق ومساحات' };
const priceFor = (monthly: number, period: Period) => (period === 'yearly' ? yearlyPrice(monthly) : monthly);

/** The invoice of a package for a project, or null when the package is not a paid one of its kind. */
export const invoiceFor = (project: string, planId: string, period: Period, devicesIn = 0): Invoice | null => {
  const kind = kindOf(project);
  const plan = PLANS[kind]?.find((p) => p.id === planId);
  if (!plan || !(plan.monthly > 0) || (period !== 'monthly' && period !== 'yearly')) return null;
  const devices = kind === 'restaurant' ? Math.max(0, Math.min(MAX_DEVICES, Math.floor(Number(devicesIn) || 0))) : 0;
  const planName = `${KIND_NAMES[kind]} ${plan.name}`;
  const items: InvoiceItem[] = [{ label: `باقة ${planName} (${period === 'yearly' ? 'سنوي' : 'شهري'})`, amount: priceFor(plan.monthly, period) }];
  if (devices) items.push({ label: `${devices} ${devices === 1 ? 'جهاز إضافي' : 'أجهزة إضافية'}`, amount: priceFor(devices * EXTRA_DEVICE, period) });
  if (period === 'yearly') items.push({ label: 'دومين خاص باسم صفحتك', amount: 0 });
  return { plan: plan.id, planName, period, devices, items, total: items.reduce((n, i) => n + i.amount, 0) };
};

/** Whether a project is paid before it is published: a page only when Pro was picked. */
export const needsPayment = (project: string, planId = '') => kindOf(project) !== 'page' || planId === 'page-pro';

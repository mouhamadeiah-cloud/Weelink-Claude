// Paying before publishing, the browser side (the server side and the whole flow: server/billing.ts).
import { doc, getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import { kindOf } from '../utils/projectKeys';
import { PLANS, readPlan } from '../data/plans';
import { invoiceFor, type Invoice, type InvoiceItem, type Period } from '../utils/invoice';

export { invoiceFor };
export type { Invoice, InvoiceItem, Period };

export type OrderStatus = 'unpaid' | 'attached' | 'paid' | 'rejected' | 'cancelled' | 'deleted';

export interface BillingOrder extends Invoice {
  id: string;
  project: string;
  siteName: string;
  status: OrderStatus;
  way: string;
  transferNo: string;
  hasImage: boolean;
  renewal: boolean;
  createdAt: number;
  deleteAt: number;
  rejectReason: string;
}

export interface ProjectPeriod { plan: string; planName: string; period: Period; paidUntil: number }

// How the customer pays. The balance card comes later.
export const PAY_WAYS: { id: string; name: string; soon?: boolean }[] = [
  { id: 'card', name: 'بطاقة رصيد Weelink', soon: true },
  { id: 'syriatel', name: 'سيريتل كاش' },
  { id: 'mtn', name: 'MTN كاش' },
  { id: 'sham', name: 'شام كاش' },
  { id: 'transfer', name: 'حوالة مالية' },
  { id: 'office', name: 'دفع في المكتب' },
];
export const payWayName = (id: string) => PAY_WAYS.find((w) => w.id === id)?.name || id;

/** The paid packages a project can take, cheapest first. */
export const paidPlansOf = (project: string) => PLANS[kindOf(project)].filter((p) => p.monthly > 0);

/** The package the customer picked on the start page, or the cheapest paid one. */
export const chosenPlanOf = (owner: string, project: string) => {
  const picked = readPlan(owner, kindOf(project));
  const plans = paidPlansOf(project);
  return plans.find((p) => p.id === picked)?.id || plans.find((p) => p.popular)?.id || plans[0]?.id || '';
};

/** A page is free unless Pro was picked; the other kinds are paid. */
export const needsPayment = (owner: string, project: string) => kindOf(project) !== 'page' || readPlan(owner, 'page') === 'page-pro';

export interface Gate { enforce: boolean; test: boolean; paidUntil: number }

/** What «نشر» and the published page check: whether paying is on, a test account, and the paid period. */
export const readGate = async (owner: string, project: string): Promise<Gate> => {
  const [settings, test, access] = await Promise.all([
    getDoc(doc(db, 'platformSettings', 'billing')).catch(() => null),
    getDoc(doc(db, 'testAccounts', owner)).catch(() => null),
    getDoc(doc(db, 'projectAccess', `${owner}__${project}`)).catch(() => null),
  ]);
  return { enforce: settings?.data()?.enforce === true, test: !!test?.exists(), paidUntil: Number(access?.data()?.paidUntil) || 0 };
};

/** The page is shown: paying is off, a test account, its paid period runs, or a page that was never Pro. */
export const gateOpen = (g: Gate, project: string) => !g.enforce || g.test || g.paidUntil > Date.now() || (kindOf(project) === 'page' && !g.paidUntil);

const call = async <T,>(user: User, body: Record<string, unknown>): Promise<T> => {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(String(data.error || `http_${res.status}`));
  return data as T;
};

export const createOrder = (user: User, body: { project: string; plan: string; period: Period; devices: number; siteName?: string }) =>
  call<{ order: BillingOrder }>(user, { action: 'order-create', ...body });

export const attachProof = (user: User, body: { id: string; way: string; transferNo: string; image: string }) =>
  call<{ order: BillingOrder }>(user, { action: 'order-attach', ...body });

export const billingErrorText = (code: string) =>
  code === 'no-proof' ? 'اكتب رقم الحوالة أو ارفع صورة الإشعار.'
  : code === 'card-soon' ? 'الدفع ببطاقة الرصيد جاي قريباً. اختار طريقة تانية هلق.'
  : code === 'bad-image' ? 'ما قدرنا نقرأ الصورة. جرّب صورة JPG أو PNG.'
  : code === 'not-found' ? 'ما لقينا المشروع. احفظ مشروعك أول وجرّب مرة تانية.'
  : code === 'bad-state' ? 'هالفاتورة ما عاد فيها تعديل. حدّث الصفحة.'
  : 'صار خطأ. جرّب مرة تانية.';

/** A photo of the receipt, made small enough to send (longest side 1400 px, JPEG). */
export const shrinkReceipt = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      const ctx = c.getContext('2d');
      if (!ctx) return reject(new Error('canvas'));
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      let q = 0.75;
      let out = c.toDataURL('image/jpeg', q);
      while (out.length > 850_000 && q > 0.35) out = c.toDataURL('image/jpeg', (q -= 0.1));
      resolve(out);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image'));
    };
    img.src = url;
  });

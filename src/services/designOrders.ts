// Hiring a designer, the browser's side (Eyad, 14 Oct; the server's is api/design-orders.ts). The orders
// and their messages are read live from Firestore (the rules let the customer and the designer of an
// order read them); everything that changes them goes through the server.
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';

export type OrderStatus = 'awaiting_payment' | 'paid' | 'delivered' | 'confirmed' | 'paid_out' | 'cancelled' | 'disputed' | 'refunded';

export interface DesignOrder {
  id: string;
  customerUid: string;
  customerAlias: string;
  designerUid: string;
  designerName: string;
  slideId: string;
  slideName: string;
  planId: string;
  price: number;
  designerShare: number;
  platformShare: number;
  status: OrderStatus;
  brief: string;
  disputeReason: string;
  // The customer's rating of the finished work, once given.
  rating: { stars: number; text: string } | null;
  createdAt: number;
  updatedAt: number;
  deliveredAt: number;
}

export interface OrderMessage {
  id: string;
  role: 'customer' | 'designer' | 'system';
  text: string;
  at: number;
}

// What each status means, for the customer and for the designer.
export const STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_payment: 'بانتظار الدفع',
  paid: 'مدفوع: العمل جارٍ',
  delivered: 'سُلّم: بانتظار تأكيدك',
  confirmed: 'مؤكَّد: يُحوَّل للمصمم',
  paid_out: 'مكتمل',
  cancelled: 'ملغى',
  disputed: 'شكوى قيد المراجعة',
  refunded: 'مُسترد',
};

// The statuses in which the two may write to each other (the server checks too).
export const CAN_TALK: OrderStatus[] = ['paid', 'delivered', 'confirmed', 'disputed'];

const toOrder = (id: string, d: any): DesignOrder => ({
  id,
  customerUid: String(d.customerUid || ''),
  customerAlias: String(d.customerAlias || 'زبون'),
  designerUid: String(d.designerUid || ''),
  designerName: String(d.designerName || ''),
  slideId: String(d.slideId || ''),
  slideName: String(d.slideName || ''),
  planId: String(d.planId || ''),
  price: Number(d.price) || 0,
  designerShare: Number(d.designerShare) || 0,
  platformShare: Number(d.platformShare) || 0,
  status: String(d.status || 'awaiting_payment') as OrderStatus,
  brief: String(d.brief || ''),
  disputeReason: String(d.disputeReason || ''),
  rating: d.rating && Number(d.rating.stars) >= 1 ? { stars: Number(d.rating.stars), text: String(d.rating.text || '') } : null,
  createdAt: Number(d.createdAt) || 0,
  updatedAt: Number(d.updatedAt) || 0,
  deliveredAt: Number(d.deliveredAt) || 0,
});

// The orders the account made as a customer and the ones it got as a designer, live, newest first.
export const subscribeMyOrders = (uid: string, onChange: (asCustomer: DesignOrder[], asDesigner: DesignOrder[]) => void) => {
  let mine: DesignOrder[] = [];
  let theirs: DesignOrder[] = [];
  const emit = () => onChange(mine, theirs);
  const sorted = (a: DesignOrder, b: DesignOrder) => b.updatedAt - a.updatedAt;
  const a = onSnapshot(query(collection(db, 'designOrders'), where('customerUid', '==', uid)), (s) => {
    mine = s.docs.map((d) => toOrder(d.id, d.data())).sort(sorted);
    emit();
  }, () => {});
  const b = onSnapshot(query(collection(db, 'designOrders'), where('designerUid', '==', uid)), (s) => {
    theirs = s.docs.map((d) => toOrder(d.id, d.data())).sort(sorted);
    emit();
  }, () => {});
  return () => {
    a();
    b();
  };
};

export const subscribeMessages = (orderId: string, onChange: (rows: OrderMessage[]) => void) =>
  onSnapshot(query(collection(db, 'designOrders', orderId, 'messages'), orderBy('at')), (s) => {
    onChange(s.docs.map((d) => {
      const x: any = d.data();
      return { id: d.id, role: x.role === 'customer' || x.role === 'designer' ? x.role : 'system', text: String(x.text || ''), at: Number(x.at) || 0 };
    }));
  }, () => {});

export class OrderError extends Error {
  constructor(public code: string, public kinds: string[] = []) {
    super(code);
  }
}

const call = async <T,>(user: User, body: Record<string, unknown>): Promise<T> => {
  let res: Response;
  try {
    res = await fetch('/api/design-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new OrderError('network');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new OrderError(String(data.error || 'failed'), Array.isArray(data.kinds) ? data.kinds : []);
  return data as T;
};

export const quoteOrder = (user: User) => call<{ planId: string; price: number; paymentInfo: string }>(user, { action: 'quote' });
export const createOrder = (user: User, designerUid: string, slideId: string, brief: string) => call<{ id: string; price: number }>(user, { action: 'create', designerUid, slideId, brief });
export const cancelOrder = (user: User, id: string) => call<{ status: string }>(user, { action: 'cancel', id });
export const sendOrderMessage = (user: User, id: string, text: string) => call<{ ok: true }>(user, { action: 'message', id, text });
export const deliverOrder = (user: User, id: string) => call<{ status: string }>(user, { action: 'deliver', id });
export const confirmOrder = (user: User, id: string) => call<{ status: string }>(user, { action: 'confirm', id });
export const disputeOrder = (user: User, id: string, reason: string) => call<{ status: string }>(user, { action: 'dispute', id, reason });

export const rateOrder = (user: User, id: string, stars: number, text: string) => call<{ ok: true }>(user, { action: 'rate', id, stars, text });

export const orderErrorText = (e: unknown) => {
  const code = e instanceof OrderError ? e.code : 'network';
  const map: Record<string, string> = {
    unverified: 'أكّد بريدك الإلكتروني أولاً.',
    unauthorized: 'سجّل دخولك أولاً.',
    own: 'ما بتقدر تطلب تصميماً من نفسك.',
    contact: 'ممنوع كتابة رقم هاتف أو إيميل أو رابط أو اسم حساب. التواصل يتم هون داخل Weelink.',
    too_many: 'عندك طلبات كثيرة بانتظار الدفع. أكمل واحداً منها أو ألغِه.',
    no_designer: 'هذا المصمم غير موجود.',
    no_slide: 'هذا التصميم لم يعد متاحاً.',
    bad_state: 'ما بيصير تعمل هالإجراء على الطلب بحالته الحالية.',
    not_paid: 'الرسائل بتفتح بعد أن يؤكّد المكتب استلام المبلغ.',
    rated: 'قيّمت هذا الطلب من قبل.',
    too_fast: 'على مهلك، جرّب بعد لحظة.',
  };
  return map[code] || 'تعذّر تنفيذ الطلب. تأكد من اتصالك وجرّب مرة ثانية.';
};

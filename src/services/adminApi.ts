// The platform admin site's calls to /api/admin (see api/admin.ts). The session token lives in
// sessionStorage only, so closing the tab signs the admin out.
export interface AdminInfo {
  username: string;
  name: string;
  role: string;
  specialty: string;
  mustChange: boolean;
  /** The actions this admin may call (the server checks again). */
  can: string[];
}

export type SubscriberStatus = 'active' | 'frozen' | 'cancelled';

export interface SubscriberRow {
  uid: string;
  name: string;
  email: string;
  phone: string;
  createdAt: number;
  lastActive: number;
  verified: boolean;
  disabled: boolean;
  status: SubscriberStatus;
  sub: { planName: string; endsAt: number; freezeAt: number } | null;
  subState: 'none' | 'active' | 'expiring' | 'expired';
  active: boolean;
  sites: { name: string; project: string }[];
}

export interface SubscribersResult {
  rows: SubscriberRow[];
  matched: number;
  summary: { total: number; active: number; sleeping: number; withPage: number; sleepingAfterDays: number };
}

export interface SubscriberQuery {
  q: string;
  state: 'all' | 'active' | 'sleeping';
  published: 'all' | 'yes' | 'no';
  verified: 'all' | 'yes' | 'no';
  status: 'all' | SubscriberStatus;
  sub: 'all' | 'none' | 'active' | 'expiring' | 'expired';
}

const KEY = 'weelink_admin_token';
export const getAdminToken = () => {
  try {
    return sessionStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
};
export const setAdminToken = (token: string) => {
  try {
    if (token) sessionStorage.setItem(KEY, token);
    else sessionStorage.removeItem(KEY);
  } catch {
    // storage unavailable: the admin signs in again after a reload
  }
};

export class AdminError extends Error {
  constructor(public code: string, public extra: Record<string, unknown> = {}) {
    super(code);
  }
}

const call = async <T,>(body: Record<string, unknown>): Promise<T> => {
  const token = getAdminToken();
  let res: Response;
  try {
    res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AdminError('network');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AdminError(String(data.error || 'failed'), data);
  return data as T;
};

export const adminLogin = (username: string, password: string) => call<{ token: string; admin: AdminInfo }>({ action: 'login', username, password });
export const adminMe = () => call<{ admin: AdminInfo }>({ action: 'me' });
export const adminChangePassword = (current: string, next: string) => call<{ token: string; admin: AdminInfo }>({ action: 'change-password', current, next });
export const adminSubscribers = (query: SubscriberQuery) => call<SubscribersResult>({ action: 'subscribers', ...query });

export type Period = 'monthly' | 'yearly';
export type PayMethod = 'office' | 'cash' | 'transfer' | 'grant';
export const PAY_METHODS: Record<PayMethod, string> = { office: 'مكتب', cash: 'نقداً', transfer: 'حوالة', grant: 'منحة' };

export interface Payment {
  id: string; uid: string; invoiceNo: string; name: string; email: string; plan: string; planName: string; period: Period;
  amount: number; method: PayMethod; receiptNo: string; note: string; paidAt: number; coversFrom: number; coversTo: number;
  by: string; sentAt: number; key: string;
}

export interface Company { name: string; address: string; phone: string; email: string; taxNo: string; footer: string }

export type TaskStatus = 'new' | 'doing' | 'done';
export interface AiCall { at: number; kind: string; tokens: number; input: number; output: number; costUsd: number; ok: boolean; reason: string }
export interface TokensOverview {
  month: string;
  totals: { calls: number; failed: number; tokens: number; input: number; output: number; costUsd: number };
  kinds: { name: string; calls: number; tokens: number; costUsd: number }[];
  top: { uid: string; name: string; calls: number; tokens: number; costUsd: number }[];
  prices: { in: number; out: number };
  emails: number;
  truncated: boolean;
}

export interface SubscriberDetail {
  profile: { uid: string; name: string; email: string; phone: string; verified: boolean; createdAt: number; lastActive: number; providers: string[] };
  status: { status: SubscriberStatus; reason: string; at: number; by: string };
  sites: { name: string; project: string; publishedAt: string }[];
  subscription: { plan: string; planName: string; period: Period; endsAt: number; freezeAt: number } | null;
  payments: Payment[];
  tokens: { balance: number | null; used: number; free: number };
  calls: AiCall[];
  tasks: { id: string; title: string; status: TaskStatus; assignee: string; updatedAt: number }[];
  events: { id: string; at: number; admin: string; type: 'status' | 'note' | string; text: string; status: string }[];
}
export const adminSubscriber = (uid: string) => call<SubscriberDetail>({ action: 'subscriber', uid });
export const adminSetStatus = (uid: string, status: SubscriberStatus, reason: string) => call<{ status: SubscriberStatus }>({ action: 'set-status', uid, status, reason });
export const adminAddNote = (uid: string, text: string) => call<{ ok: true }>({ action: 'add-note', uid, text });

export const adminAddPayment = (body: { uid: string; plan: string; planName: string; period: Period; amount: number; method: PayMethod; receiptNo: string; note: string }) =>
  call<{ payment: Payment }>({ action: 'add-payment', ...body });
export const adminPostponeFreeze = (uid: string, date: string, reason: string) => call<{ freezeAt: number }>({ action: 'postpone-freeze', uid, date, reason });
export const adminPayments = (q: { month: string; method: string; q: string }) => call<{ rows: Payment[]; matched: number; total: number }>({ action: 'payments', ...q });
export const adminInvoiceSend = (paymentId: string) => call<{ sent: true }>({ action: 'invoice-send', paymentId });
export const adminGetCompany = () => call<{ company: Company }>({ action: 'get-company' });
export const adminSetCompany = (company: Company) => call<{ company: Company }>({ action: 'set-company', ...company });
export const invoiceUrl = (p: Payment) => `/api/admin?invoice=${encodeURIComponent(p.id)}&k=${encodeURIComponent(p.key)}`;
export const adminTokensOverview = (month: string) => call<TokensOverview>({ action: 'tokens-overview', month });
export const adminTokensAdjust = (uid: string, delta: number, reason: string) => call<{ balance: number }>({ action: 'tokens-adjust', uid, delta, reason });
export const adminSetPrices = (price: { in: number; out: number }) => call<{ prices: { in: number; out: number } }>({ action: 'set-prices', ...price });

export interface TeamAdmin { username: string; name: string; role: string; specialty: string; status: 'active' | 'frozen'; mustChange: boolean }
export const adminTeam = () => call<{ rows: TeamAdmin[]; specialties: Record<string, string> }>({ action: 'admins-list' });
export const adminAddAdmin = (b: { username: string; name: string; specialty: string }) => call<{ username: string; tempPassword: string }>({ action: 'admin-add', ...b });
export const adminUpdateAdmin = (username: string, patch: { name?: string; specialty?: string; status?: 'active' | 'frozen' }) => call<{ ok: true }>({ action: 'admin-update', username, ...patch });
export const adminResetPassword = (username: string) => call<{ username: string; tempPassword: string }>({ action: 'admin-reset-password', username });

export interface Task { id: string; title: string; instructions: string; type: string; uid: string; subscriber: string; assignee: string; assigneeName: string; status: TaskStatus; createdAt: number; updatedAt: number }
export interface TaskReply { id: string; at: number; by: string; byName: string; text: string }
export interface TasksResult { rows: Task[]; matched: number; counts: Record<TaskStatus, number>; types: Record<string, string> }
export const adminTasks = (q: { status: string; q: string; assignee?: string; mine?: boolean }) => call<TasksResult>({ action: 'tasks', ...q });
export const adminTask = (id: string) => call<{ task: Task; replies: TaskReply[] }>({ action: 'task', id });
export const adminTaskCreate = (b: { title: string; instructions: string; type: string; assignee: string; uid?: string }) => call<{ id: string }>({ action: 'task-create', ...b });
export const adminTaskUpdate = (id: string, patch: { title?: string; instructions?: string; type?: string; assignee?: string }) => call<{ ok: true }>({ action: 'task-update', id, ...patch });
export const adminTaskStatus = (id: string, status: TaskStatus) => call<{ status: TaskStatus }>({ action: 'task-status', id, status });
export const adminTaskReply = (id: string, text: string) => call<{ ok: true }>({ action: 'task-reply', id, text });

export interface ChatMessage { id: string; at: number; by: string; byName: string; text: string; uid: string; subscriber: string }
export const adminChat = (q: { after?: number; uid?: string }) => call<{ rows: ChatMessage[]; me: string }>({ action: 'chat', ...q });
export const adminChatSend = (text: string, uid?: string) => call<{ id: string; at: number }>({ action: 'chat-send', text, uid });

// The designers' gallery: the page's law (the only text a designer agrees to) and the review of the
// slides designers exported.
export interface PageLaw { text: string; version: number; updatedAt: number; updatedBy: string }
export const adminPageLaw = () => call<{ law: PageLaw | null }>({ action: 'page-law-get' });
export const adminSetPageLaw = (text: string) => call<{ law: PageLaw }>({ action: 'page-law-set', text });

export type SlideStatus = 'pending' | 'approved' | 'rejected';
export interface GallerySlideRow {
  id: string; name: string; category: string; designerUid: string; designerName: string; status: SlideStatus;
  lawVersion: number; acceptedAt: string; createdAt: number; reason: string; reviewedBy: string;
  kind: 'slide' | 'page'; slide: any; page: any; elements: any[];
}
export const adminSlides = (status: SlideStatus) => call<{ rows: GallerySlideRow[]; counts: { pending: number } }>({ action: 'slides-review-list', status });
export interface SeedStatus { total: number; published: number; searchesLeft: number; unsplash: boolean }
export interface SeedResult { published: string[]; waiting: string[]; limited: boolean; spent: number; failed: string[] }
export const adminSeedStatus = () => call<SeedStatus>({ action: 'gallery-seed-status' });
export const adminSeed = (opts: { overwrite?: boolean } = {}) => call<SeedResult>({ action: 'gallery-seed', overwrite: !!opts.overwrite });
export const adminSlideReview = (id: string, decision: 'approve' | 'reject', reason = '') => call<{ status: SlideStatus }>({ action: 'slide-review', id, decision, reason });

// Hiring a designer: the office takes the customer's money, holds it until the design is confirmed, then pays the
// designer their part (api/design-orders.ts makes the orders).
export type DesignOrderStatus = 'awaiting_payment' | 'paid' | 'delivered' | 'confirmed' | 'paid_out' | 'cancelled' | 'disputed' | 'refunded';
export interface AdminDesignOrder {
  id: string; customerUid: string; customerAlias: string; customerEmail: string; designerUid: string; designerName: string; designerEmail: string;
  slideName: string; planId: string; price: number; designerShare: number; platformShare: number; status: DesignOrderStatus; brief: string;
  disputeReason: string; createdAt: number; updatedAt: number; late?: boolean;
  payment: { at: number; by: string; method: string; receiptNo: string; note: string; amount: number } | null;
  payout: { at: number; by: string; amount: number; note: string } | null;
  refund: { at: number; by: string; amount: number; reason: string } | null;
  history?: { at: number; status: string; by: string }[];
  rating?: { stars: number; text: string } | null;
}
export interface AdminOrderMessage { id: string; role: string; text: string; at: number }
export const adminDesignOrders = (status: string) => call<{ rows: AdminDesignOrder[]; counts: Record<string, number> }>({ action: 'design-orders', status });
export const adminDesignOrder = (id: string) => call<{ order: AdminDesignOrder; messages: AdminOrderMessage[] }>({ action: 'design-order', id });
export const adminPaymentInfo = () => call<{ text: string; updatedAt: number; updatedBy: string }>({ action: 'payment-info-get' });
export const adminSetPaymentInfo = (text: string) => call<{ ok: true }>({ action: 'payment-info-set', text });
export const adminRecountDesigner = (uid: string) => call<{ stats: { completed: number; ratingCount: number; ratingSum: number; verified: boolean } }>({ action: 'designer-recount', uid });
export const adminOrderPaid = (id: string, method: PayMethod, receiptNo: string, note: string) => call<{ status: string }>({ action: 'design-order-paid', id, method, receiptNo, note });
export const adminOrderRelease = (id: string, note: string) => call<{ status: string }>({ action: 'design-order-release', id, note });
export const adminOrderRefund = (id: string, reason: string) => call<{ status: string }>({ action: 'design-order-refund', id, reason });

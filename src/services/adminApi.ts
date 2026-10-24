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

interface SubscriberRow {
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

import type { ModelSection, PageModel } from '../data/pageModels';
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
  if (!res.ok) throw new AdminError(String(data.error || 'failed'), { ...data, status: res.status });
  return data as T;
};

export const adminLogin = (username: string, password: string) => call<{ token: string; admin: AdminInfo }>({ action: 'login', username, password });
export const adminMe = () => call<{ admin: AdminInfo }>({ action: 'me' });
export const adminChangePassword = (current: string, next: string) => call<{ token: string; admin: AdminInfo }>({ action: 'change-password', current, next });
export const adminSubscribers = (query: SubscriberQuery) => call<SubscribersResult>({ action: 'subscribers', ...query });

export type Period = 'monthly' | 'yearly';
export type PayMethod = 'office' | 'cash' | 'transfer' | 'grant' | 'online';
export const PAY_METHODS: Record<PayMethod, string> = { office: 'مكتب', cash: 'نقداً', transfer: 'حوالة', grant: 'منحة', online: 'دفع إلكتروني' };

export interface Payment {
  id: string; uid: string; invoiceNo: string; name: string; email: string; plan: string; planName: string; period: Period;
  amount: number; method: PayMethod; receiptNo: string; note: string; paidAt: number; coversFrom: number; coversTo: number;
  by: string; sentAt: number; key: string;
}

export interface Company { name: string; address: string; phone: string; email: string; taxNo: string; footer: string }

export type TaskStatus = 'new' | 'doing' | 'done';
interface AiCall { at: number; kind: string; tokens: number; input: number; output: number; costUsd: number; ok: boolean; reason: string }
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
  test: boolean;
  projects: { project: string; planName: string; period: string; paidUntil: number }[];
}
export const adminSubscriber = (uid: string) => call<SubscriberDetail>({ action: 'subscriber', uid });
export const adminSetStatus = (uid: string, status: SubscriberStatus, reason: string) => call<{ status: SubscriberStatus }>({ action: 'set-status', uid, status, reason });
export const adminAddNote = (uid: string, text: string) => call<{ ok: true }>({ action: 'add-note', uid, text });

export const adminAddPayment = (body: { uid: string; plan: string; planName: string; period: Period; amount: number; method: PayMethod; receiptNo: string; note: string; coupon?: string }) =>
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
  // Made by Weelink itself («Weelink AI»); changed by hand by someone; a designer's change to an approved design waiting for review.
  official?: boolean; editedBy?: string; isEdit?: boolean;
  // The ready-slide category it was added to («شرائح جاهزة» in the editor), if any.
  ready?: string;
  // Can the page builder use it: its slots found from the elements (slides only).
  slots?: { eligible: boolean; slots: number; problems: string[] } | null;
}
export const adminSlides = (status: SlideStatus) => call<{ rows: GallerySlideRow[]; counts: { pending: number } }>({ action: 'slides-review-list', status });
// Editing a design in the gallery: the admin edits anything (it changes in place), in the designer's panel (src/App.tsx opens it
// with the session handed over by openGalleryEditor) or here for the name and category.
interface GalleryDoc { id: string; kind: 'slide' | 'page'; name: string; category: string; designerUid: string; designerName: string; status: SlideStatus; official: boolean; slide: any; page: any; elements: any[] }
export const adminGalleryDoc = (id: string) => call<{ design: GalleryDoc; pendingEdit: boolean }>({ action: 'gallery-doc', id });
export const adminGallerySave = (id: string, d: { page: any; elements: any[]; name?: string; category?: string; designerName?: string }) => call<{ ok: true }>({ action: 'gallery-doc-save', id, ...d });
export const adminGalleryDelete = (id: string) => call<{ ok: true }>({ action: 'gallery-doc-delete', id });
export const adminEditReview = (id: string, decision: 'approve' | 'reject', reason = '') => call<{ ok: true }>({ action: 'slide-edit-review', id, decision, reason });
// The editor opens in a new tab; it cannot read this tab's session, so the token is left for it for a few seconds.
export const HANDOFF_KEY = 'weelink_admin_edit';
export const openGalleryEditor = (id: string, ready?: { category: string }) => {
  // The designer's panel lives on the main site, not on admin.<domain>; the two addresses do not share storage, so the
  // hand-over travels in the address fragment (never sent to a server) and is erased by the editor tab on arrival.
  const payload = { id, token: getAdminToken(), at: Date.now() };
  const host = window.location.hostname.replace(/^admin\./i, '');
  const origin = `${window.location.protocol}//${host}${window.location.port ? `:${window.location.port}` : ''}`;
  try {
    localStorage.setItem(HANDOFF_KEY, JSON.stringify(payload));
  } catch { /* the fragment is enough */ }
  // A ready slide of the admin's own list: «ready» says so, and a new one carries its category (no id yet).
  const query = ready ? `edit-gallery=1&ready=1&cat=${encodeURIComponent(ready.category)}` : 'edit-gallery=1';
  return !!window.open(`${origin}/?${query}#h=${encodeURIComponent(JSON.stringify(payload))}`, '_blank');
};

export interface SeedStatus { total: number; published: number; staged: number; searchesLeft: number; unsplash: boolean }
export interface SeedResult { published: string[]; waiting: string[]; limited: boolean; spent: number; failed: string[] }
export const adminSeedStatus = () => call<SeedStatus>({ action: 'gallery-seed-status' });
export const adminSeed = (opts: { overwrite?: boolean; publish?: boolean } = {}) => call<SeedResult>({ action: 'gallery-seed', overwrite: !!opts.overwrite, publish: !!opts.publish });
export const adminReadyFromGallery = (id: string, category: string) => call<{ ok: true; id: string; category: string; eligible: boolean; slots: number; problems: string[] }>({ action: 'ready-from-gallery', id, category });
export interface ReadyItem { id: string; category: string; order: number; name: string; eligible: boolean; slots: number; problems: string[]; from: string }
export interface ReadyCategory { id: string; name: string; icon: string; items: ReadyItem[] }
export const adminReadyOverview = () => call<{ categories: ReadyCategory[] }>({ action: 'ready-overview' });
export const adminReadyDoc = (id: string) => call<{ design: { id: string; name: string; category: string; slide: any; elements: any[] } }>({ action: 'ready-doc', id });
export const adminReadyCategory = (id: string, category: string) => call<{ ok: true }>({ action: 'ready-category', id, category });
export const adminReadyMove = (id: string, dir: 'up' | 'down') => call<{ ok: true }>({ action: 'ready-move', id, dir });
export const adminModels = () => call<{ models: (PageModel & { custom: boolean })[] }>({ action: 'models-get' });
export const adminModelSave = (id: string, sections: ModelSection[]) => call<{ ok: true; sections: ModelSection[] }>({ action: 'models-save', id, sections });
export const adminModelReset = (id: string) => call<{ ok: true }>({ action: 'models-reset', id });
// Slides made outside the editor (a JSON file of {name, category, slide, elements}): each is saved as a new ready slide, the way the editor's save does it.
export const adminReadyImport = async (items: { name: string; category: string; slide: any; elements: any[] }[]) => {
  let saved = 0;
  for (const it of items) {
    await call<{ ok: true }>({ action: 'ready-doc-save', id: '', page: { slides: [it.slide] }, elements: it.elements, name: it.name, category: it.category });
    saved += 1;
  }
  return saved;
};
export const adminReadyRemove = (id: string) => call<{ ok: true }>({ action: 'ready-remove', id });
export type SlideDestination = 'gallery' | 'both' | 'ready';
export const adminSlideReview = (id: string, decision: 'approve' | 'reject', reason = '', to?: { destination: SlideDestination; readyCategory?: string }) => call<{ status: SlideStatus }>({ action: 'slide-review', id, decision, reason, ...(to || {}) });

// Hiring a designer: the office takes the customer's money, holds it until the design is confirmed, then pays the
// designer their part (api/design-orders.ts makes the orders).
type DesignOrderStatus = 'awaiting_payment' | 'paid' | 'delivered' | 'confirmed' | 'paid_out' | 'cancelled' | 'disputed' | 'refunded';
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

// ----- phase 6: accounts, dashboard, reports, health, coupons, announcements -----
export interface Dashboard {
  totals: { users: number; paidActive: number; expiring30: number; overdue: number; frozen: number; cancelled: number; due30: number; tokensUsedAll: number; newThisMonth: number; revenueThisMonth: number; revenue12: number; reportsOpen: number };
  chart: { month: string; newUsers: number; revenue: number; payments: number }[];
  renewal: { matured: number; renewed: number; rate: number | null; days: number };
  expiring: { uid: string; name: string; email: string; planName: string; freezeAt: number; left: number; amount: number }[];
  top: { uid: string; name: string; used: number; balance: number }[];
  truncated: boolean;
}
export const adminDashboard = () => call<Dashboard>({ action: 'dashboard' });
export const adminExport = (kind: 'subscribers' | 'payments') => call<{ filename: string; csv: string; rows: number }>({ action: 'export', kind });
export const adminBackup = () => call<{ filename: string; json: string; counts: Record<string, number> }>({ action: 'backup' });

export interface RatingReport { id: string; owner: string; project: string; stars: number; text: string; rater: string; reason: string; by: string; reporter: string; at: string }
export const adminReports = () => call<{ rows: RatingReport[] }>({ action: 'reports' });
export const adminReportDecide = (id: string, decision: 'keep' | 'remove', note: string) => call<{ ok: true }>({ action: 'report-decide', id, decision, note });

export interface Health {
  config: { serviceAccount: boolean; resend: boolean; emailFrom: boolean; cron: boolean; gemini: boolean };
  ai: { calls: number; failed: number; reasons: Record<string, number>; quotaHit: boolean; lastFailures: { at: number; kind: string; reason: string }[] };
  daily: { at: number; checked: number; frozen: number; reminded: number; skipped: number; failed: number }[];
  mailFails: { at: number; admin: string; action: string }[];
  loginFails: number;
}
export const adminHealth = () => call<Health>({ action: 'health' });

export type CouponKind = 'trial' | 'tokens' | 'discount';
export interface Coupon { code: string; kind: CouponKind; value: number; plan: string; planName: string; maxUses: number; used: number; expiresAt: number; active: boolean; note: string; createdAt: number; by: string }
export const adminCoupons = () => call<{ rows: Coupon[]; kinds: Record<CouponKind, string> }>({ action: 'coupons' });
export const adminCouponSave = (b: { code: string; kind: CouponKind; value: number; maxUses: number; expires: string; note: string }) => call<{ code: string }>({ action: 'coupon-save', ...b });
export const adminCouponToggle = (code: string, active: boolean) => call<{ ok: true }>({ action: 'coupon-toggle', code, active });
export const adminCouponApply = (uid: string, code: string) => call<{ ok: true; text: string }>({ action: 'coupon-apply', uid, code });

export interface AnnouncePreview { count: number; audiences: Record<string, string>; max: number; history: { id: string; at: number; subject: string; audience: string; count: number; sent: number; failed: number; by: string }[] }
export const adminAnnouncePreview = (audience: string) => call<AnnouncePreview>({ action: 'announce-preview', audience });
export const adminAnnounce = (b: { audience: string; subject: string; text: string; confirm?: number; testTo?: string }) => call<{ count?: number; sent: number; failed?: number; test?: boolean }>({ action: 'announce', ...b });

// A file the browser saves (a CSV with a byte-order mark so Excel reads Arabic right, or the JSON backup).
export const saveTextFile = (filename: string, text: string, type: string, bom = false) => {
  const url = URL.createObjectURL(new Blob([bom ? '﻿' : '', text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// ---------- paying before publishing (server/billing.ts) ----------

export type OrderStatus = 'unpaid' | 'attached' | 'paid' | 'rejected' | 'cancelled' | 'deleted';
export interface BillingOrder {
  id: string; uid: string; email: string; name: string; project: string; siteName: string; plan: string; planName: string; period: Period;
  devices: number; items: { label: string; amount: number }[]; total: number; status: OrderStatus; way: string; transferNo: string; hasImage: boolean;
  renewal: boolean; createdAt: number; updatedAt: number; deleteAt: number; rejectReason: string; decidedBy: string; decidedAt: number; paymentId: string;
}
export const ORDER_STATUS: Record<OrderStatus, string> = { unpaid: 'غير مدفوع', attached: 'بانتظار الفحص', paid: 'مدفوع', rejected: 'مرفوض', cancelled: 'مُستبدل', deleted: 'محذوف' };
export const PAY_WAYS: Record<string, string> = { syriatel: 'سيريتل كاش', mtn: 'MTN كاش', sham: 'شام كاش', transfer: 'حوالة مالية', office: 'دفع في المكتب', online: 'دفع إلكتروني' };
export const adminOrders = (status: string) => call<{ rows: BillingOrder[]; counts: Record<string, number> }>({ action: 'orders', status });
export const adminOrder = (id: string) => call<{ order: BillingOrder; image: string; paidUntil: number }>({ action: 'order', id });
export const adminOrderApprove = (id: string) => call<{ order: BillingOrder; paidUntil: number }>({ action: 'order-approve', id });
export const adminOrderReject = (id: string, reason: string) => call<{ order: BillingOrder }>({ action: 'order-reject', id, reason });
export const adminOrderExtend = (id: string, date: string) => call<{ deleteAt: number }>({ action: 'order-extend', id, date });
export const adminBillingSettings = () => call<{ enforce: boolean; since: number; by: string }>({ action: 'billing-settings' });
export const adminBillingEnforce = (on: boolean) => call<{ enforce: boolean; marked: number }>({ action: 'billing-enforce', on });
export const adminTestAccount = (uid: string, on: boolean) => call<{ test: boolean }>({ action: 'test-account', uid, on });
export const adminDeleteSubscriber = (uid: string, reason: string) => call<{ card: DeletedCustomer }>({ action: 'subscriber-delete', uid, reason });
export interface DeletedCustomer { uid: string; name: string; email: string; phone: string; address: string; createdAt: number; endsAt: number; deletedAt: number; by: string; reason: string }
export const adminDeletedList = () => call<{ rows: DeletedCustomer[] }>({ action: 'deleted-list' });

export interface CleanupReport { at: number; applied: boolean; orphanAccounts: number; orphanFiles: number; orphanBytes: number; orphanR2Files: number; orphanDocs: number; legacyFiles: number; legacyBytes: number; wiped: number; partial: boolean }
export const adminCleanupLast = () => call<{ report: CleanupReport | null }>({ action: 'cleanup', last: true });
export const adminCleanup = (apply: boolean) => call<{ report: CleanupReport }>({ action: 'cleanup', apply });

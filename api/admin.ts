// Vercel serverless function: the sign-in and the data of the platform admin site
// (admin.testweelink.de, Eyad's team). Everything here runs on the server with the Firebase Admin
// SDK; the browser never reads the subscribers or the admin accounts (the rules deny them).
//
//   POST /api/admin  { action: 'login', username, password }   → { token, admin }
//   POST /api/admin  { action: 'me' }                           → { admin }
//   POST /api/admin  { action: 'my-account' } with a subscriber's Firebase ID token → { status, subscription, tokens, payments }
//   POST /api/admin  { action: 'order-create', project, plan, period, devices?, siteName? } and
//                    { action: 'order-attach', id, way, transferNo?, image? }  with a subscriber's Firebase ID token:
//        the invoice before a paid project is published, and how it was paid (server/billing.ts)
//   POST /api/admin  { action: 'orders' | 'order' | 'order-approve' | 'order-reject' | 'order-extend' | 'billing-settings' }  (finance)
//                    { action: 'billing-enforce' | 'test-account' | 'subscriber-delete' }  (owner), { action: 'deleted-list' }
//   POST /api/admin  { action: 'change-password', current, next } → { token, admin }
//   POST /api/admin  { action: 'subscribers', q?, state?, published?, verified?, status? } → { rows, matched, summary }
//   POST /api/admin  { action: 'subscriber', uid }               → { profile, status, sites, events }
//   POST /api/admin  { action: 'set-status', uid, status: 'active'|'frozen'|'cancelled', reason } → { status }
//   POST /api/admin  { action: 'add-note', uid, text }           → { ok: true }
//   POST /api/admin  { action: 'add-payment', uid, plan, planName, period, amount, method, receiptNo?, note? } → { payment }
//   POST /api/admin  { action: 'postpone-freeze', uid, date: 'YYYY-MM-DD' | '', reason } → { freezeAt }
//   POST /api/admin  { action: 'payments', month?, method?, q? } → { rows, total }
//   POST /api/admin  { action: 'invoice-send', paymentId }       → { sent: true } | { error }
//   POST /api/admin  { action: 'get-company' | 'set-company', ...fields }
//   GET  /api/admin?invoice=<id>&k=<key>  → the invoice page (the key is in the invoice's email)
//   GET  /api/admin  with  Authorization: Bearer <CRON_SECRET>  (Vercel's daily cron)
//        → reminds subscribers 14, 7 and 1 day before their subscription ends, and freezes the ones
//          whose subscription ended
//   POST /api/admin  { action: 'admins-list' | 'admin-add' | 'admin-update' | 'admin-reset-password', ... }  (owner only)
//   POST /api/admin  { action: 'tasks' | 'task' | 'task-status' | 'task-reply' }  (an admin's own tasks) and
//                    { action: 'task-create' | 'task-update' }  (owner only): the workflow board
//   POST /api/admin  { action: 'chat', after?, uid? } and { action: 'chat-send', text, uid? }  (the team chat board)
//   POST /api/admin  { action: 'page-law-get' } → { law }  and { action: 'page-law-set', text } → { law }
//        (the designers' «قانون الصفحة»: platformSettings/pageLaw, the only text a designer agrees to)
//   POST /api/admin  { action: 'slides-review-list', status? } → { rows, counts }  (slides and pages)  and
//                    { action: 'slide-review', id, decision: 'approve'|'reject', reason? } → { status }
//        (the slides designers exported to the gallery wait as gallerySlides/{id}.status = 'pending')
//   POST /api/admin  { action: 'design-orders', status? } → { rows, counts }  and { action: 'design-order', id } → { order, messages }
//   POST /api/admin  { action: 'design-order-paid', id, method, receiptNo?, note? }  the office got the customer's money
//   POST /api/admin  { action: 'design-order-release', id, note? }                   pays the designer their part (after the customer confirmed, or a complaint)
//   POST /api/admin  { action: 'design-order-refund', id, reason }                   gives the customer their money back (or cancels an unpaid order)
//        (hiring a designer, api/design-orders.ts: the money is held by the office until the customer confirms)
//   POST /api/admin  { action: 'tokens-overview', month? }       → { totals, kinds, top, emails, prices }
//   POST /api/admin  { action: 'dashboard' }  → numbers and 12-month chart; { action: 'export', kind: 'subscribers'|'payments' } → CSV; { action: 'backup' } → one JSON file (owner)
//   POST /api/admin  { action: 'reports' | 'report-decide' }  rating reports;  'health' (owner);  'coupons' | 'coupon-save' | 'coupon-toggle' | 'coupon-apply';  'announce-preview' | 'announce' (owner)
//   POST /api/admin  { action: 'tokens-adjust', uid, delta, reason } → { balance }
//   POST /api/admin  { action: 'set-prices', in, out }           → { prices }
//   all but 'login' with  Authorization: Bearer <session token>
//   GET  /api/admin  → which settings this deployment sees (yes/no only, never their values)
//
// Admin accounts: platform_admins/{username} = { name, role, status, pass: 'salt:hash' (scrypt),
// v (password version), mustChange }. The very first sign-in of «admin» with the default password
// creates the main admin; that password only opens the «choose a new password» step, nothing else.
// A session token is signed with a key derived from the service account, lives 12 hours and stops
// working when the password changes or the admin is frozen.
// A frozen or cancelled subscriber: the Firebase user is disabled (no sign-in, tokens revoked),
// platform_subscribers/{uid} keeps the status and platform_subscribers/{uid}/events the history,
// and suspendedAccounts/{accountId} (public to read, server-only to write) tells the published
// pages and the restaurant's site to show «غير متاحة مؤقتاً». Activating undoes all of it.
// Subscriptions (Eyad, 14 Oct): a payment extends platform_subscribers/{uid}.subscription
// { plan, planName, period, endsAt, freezeAt, notified } and sets freezeAt = endsAt, the day the
// account freezes by itself. The admin can move freezeAt to a date (or remove it), and activating
// by hand removes it. Payments are platform_payments/{id}; invoice numbers come from
// platform_counters/invoice. Emails need EMAIL_FROM + RESEND_API_KEY (a verified domain to reach
// subscribers) and the cron needs CRON_SECRET.
// Failed sign-ins are counted per username and address (5 wrong → 15 minutes locked) and every
// sign-in and password change is written to platform_audit.
//
// Needs FIREBASE_SERVICE_ACCOUNT in Vercel (the same one /api/email-code uses).

import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cert, getApps, initializeApp, getAuth, FieldValue, getFirestore } from '../server/firebase.js';
import { Resend } from 'resend';
import { mailOrder } from '../server/orderMail.js';
import { recountDesigner } from '../server/designerStats.js';
import { gallerySeed, gallerySeedStatus } from '../server/gallerySeed.js';
import { PAGE_CATEGORY_IDS, SLIDE_CATEGORY_IDS, adminSave, deleteDesign, loadForEdit, pendingEditRows, reviewEdit } from '../server/galleryEdit.js';
import { approveOrder, attachProof, createOrder, deleteCustomer, enforceBilling, extendOrder, getOrder, listDeleted, listOrders, myBilling, readSettings, rejectOrder, runBillingDaily, setTestAccount } from '../server/billing.js';
import designTimers from '../src/data/designOrderTimers.json' with { type: 'json' };
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const DEFAULT_PASSWORD = '123456';
const FIRST_ADMIN = 'admin';
const SESSION_MS = 12 * 60 * 60 * 1000;
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const SLEEPING_AFTER_DAYS = 30;
const MAX_ROWS = 500;
const MAX_USERS = 5000;
const STATUSES = ['active', 'frozen', 'cancelled'];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

let account: { private_key?: string } | null | undefined;
const serviceAccount = () => {
  if (account !== undefined) return account;
  try {
    account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '');
  } catch {
    account = null;
  }
  return account;
};

const firebaseAdmin = () => {
  const acc = serviceAccount();
  if (!acc) return null;
  const app = getApps()[0] || initializeApp({ credential: cert(acc as object), projectId: firebaseConfig.projectId });
  const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
  return { auth: getAuth(app), db: databaseId ? getFirestore(app, databaseId) : getFirestore(app) };
};

// ---------- subscriptions, invoices and reminder emails (pure helpers) ----------

type Period = 'monthly' | 'yearly';
const PERIODS: Period[] = ['monthly', 'yearly'];
// Wee AI tokens (the same numbers as in api/build-page.ts): the first AI call
// grants FREE_TOKENS, a payment adds PAID_TOKENS for every month it covers.
const FREE_TOKENS = 30_000;
const PAID_TOKENS = 150_000;
const DEFAULT_PRICE = { in: 0.3, out: 2.5 }; // US dollars per million tokens
const KIND_NAMES: Record<string, string> = { 'build-page': 'ابن صفحتي', 'write-texts': 'اكتب النصوص' };
const getPrices = async (db: Fb['db']) => {
  const p = (await db.collection('platform_settings').doc('ai_prices').get()).data() as { in?: number; out?: number } | undefined;
  return { in: typeof p?.in === 'number' ? p.in : DEFAULT_PRICE.in, out: typeof p?.out === 'number' ? p.out : DEFAULT_PRICE.out };
};
const METHODS: Record<string, string> = { office: 'مكتب', cash: 'نقداً', transfer: 'حوالة', grant: 'منحة' };

// The end of a period that starts at `from` (a month or a year later, same day of the month).
const addPeriod = (from: number, period: Period) => {
  const d = new Date(from);
  if (period === 'yearly') d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d.getTime();
};

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const fmtDate = (ms: number) => new Date(ms).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Damascus' });
const fmtPounds = (n: number) => `${Number(n).toLocaleString('ar-SY')} ل.س`;

interface Company { name: string; address: string; phone: string; email: string; taxNo: string; footer: string }
const EMPTY_COMPANY: Company = { name: 'Weelink', address: '', phone: '', email: '', taxNo: '', footer: 'شكراً لثقتكم.' };

interface Payment {
  invoiceNo: string; name: string; email: string; planName: string; period: Period; amount: number;
  method: string; receiptNo: string; note: string; paidAt: number; coversFrom: number; coversTo: number;
}

const invoiceHtml = (p: Payment, c: Company, withPrint: boolean) => `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>فاتورة ${esc(p.invoiceNo)}</title>
<style>
  body{font-family:system-ui,Tahoma,sans-serif;background:#f6f7f9;color:#14171c;margin:0;padding:24px}
  .sheet{max-width:640px;margin:auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #e2e5ea}
  h1{font-size:22px;margin:0 0 4px} .muted{color:#5d6573;font-size:13px;line-height:1.7}
  table{width:100%;border-collapse:collapse;margin-top:20px;font-size:14px}
  th,td{padding:10px 8px;text-align:right;border-bottom:1px solid #e2e5ea} th{color:#5d6573;font-weight:500}
  .total{font-size:18px;font-weight:700} button{margin-top:20px;padding:10px 18px;border:0;border-radius:10px;background:#1d5bd8;color:#fff;font-size:14px;cursor:pointer}
  @media print{body{background:#fff;padding:0}.sheet{border:0}button{display:none}}
</style></head><body><div class="sheet">
  <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap">
    <div><h1>${esc(c.name)}</h1><div class="muted">${[c.address, c.phone, c.email, c.taxNo && `الرقم الضريبي: ${c.taxNo}`].filter(Boolean).map(esc).join('<br>')}</div></div>
    <div class="muted" style="text-align:left"><b style="font-size:16px;color:#14171c">فاتورة</b><br>${esc(p.invoiceNo)}<br>${esc(fmtDate(p.paidAt))}</div>
  </div>
  <div class="muted" style="margin-top:20px">إلى: <b style="color:#14171c">${esc(p.name || p.email)}</b>${p.email ? `<br>${esc(p.email)}` : ''}</div>
  <table>
    <tr><th>البند</th><th>الفترة</th><th>المبلغ</th></tr>
    <tr><td>اشتراك ${esc(p.planName)} (${p.period === 'yearly' ? 'سنوي' : 'شهري'})</td><td>${esc(fmtDate(p.coversFrom))} — ${esc(fmtDate(p.coversTo))}</td><td>${esc(fmtPounds(p.amount))}</td></tr>
    <tr><td colspan="2" class="total">المجموع</td><td class="total">${esc(fmtPounds(p.amount))}</td></tr>
  </table>
  <div class="muted" style="margin-top:16px">طريقة الدفع: ${esc(METHODS[p.method] || p.method)}${p.receiptNo ? ` · إيصال ${esc(p.receiptNo)}` : ''}${p.note ? `<br>${esc(p.note)}` : ''}</div>
  ${c.footer ? `<div class="muted" style="margin-top:20px">${esc(c.footer)}</div>` : ''}
  ${withPrint ? '<button onclick="window.print()">طباعة / حفظ PDF</button>' : ''}
</div></body></html>`;

type Reminder = 'd14' | 'd7' | 'd1' | 'frozen';
const reminderMail = (kind: Reminder, name: string, planName: string, endsAt: number) => {
  const when = fmtDate(endsAt);
  const copy: Record<Reminder, { subject: string; title: string; body: string; color: string }> = {
    d14: { subject: 'تنبيه: اشتراكك ينتهي خلال أسبوعين', title: 'تنبيه', color: '#1d5bd8', body: `اشتراكك في ${planName} ينتهي بتاريخ ${when}. جدّد قبلها لتبقى صفحتك شغالة بدون انقطاع.` },
    d7: { subject: 'تذكير: اشتراكك ينتهي خلال أسبوع', title: 'تذكير', color: '#b7791f', body: `باقي أسبوع على انتهاء اشتراكك في ${planName} بتاريخ ${when}. تواصل معنا للتجديد.` },
    d1: { subject: 'تحذير: اشتراكك ينتهي غداً', title: 'تحذير', color: '#c8322b', body: `اشتراكك في ${planName} ينتهي غداً ${when}. بعدها تتجمّد صفحتك وحسابك لحين التجديد.` },
    frozen: { subject: 'تم تجميد حسابك بعد انتهاء الاشتراك', title: 'تم التجميد', color: '#c8322b', body: `انتهى اشتراكك في ${planName} بتاريخ ${when} فتم تجميد حسابك وصفحاتك. بمجرد التجديد يرجع كل شي كما كان.` },
  };
  const c = copy[kind];
  return {
    subject: c.subject,
    html: `<!doctype html><html lang="ar" dir="rtl"><body style="font-family:system-ui,sans-serif;background:#f6f7f9;margin:0;padding:32px">
  <div style="max-width:460px;margin:auto;background:#fff;border-radius:16px;padding:32px">
    <h1 style="font-size:20px;margin:0 0 12px;color:${c.color}">${esc(c.title)}</h1>
    <p style="margin:0 0 8px">أهلاً ${esc(name || '')}،</p>
    <p style="color:#444;line-height:1.8;margin:0">${esc(c.body)}</p>
    <p style="color:#999;font-size:12px;margin:24px 0 0">رسالة من Weelink بخصوص اشتراكك.</p>
  </div></body></html>`,
  };
};

// ---------- passwords and sessions ----------

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};

const checkPassword = (password: string, stored: string) => {
  const [salt, hash] = (stored || '').split(':');
  const given = scryptSync(password, salt || 'x', 64);
  const want = Buffer.from(hash || '', 'hex');
  return want.length === given.length && timingSafeEqual(given, want);
};

const sessionKey = () => createHash('sha256').update(`weelink-admin:${serviceAccount()?.private_key || ''}`).digest();

const signToken = (username: string, v: number) => {
  const body = Buffer.from(JSON.stringify({ u: username, v, exp: Date.now() + SESSION_MS })).toString('base64url');
  return `${body}.${createHmac('sha256', sessionKey()).update(body).digest('base64url')}`;
};

const readToken = (token: string): { u: string; v: number } | null => {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const want = createHmac('sha256', sessionKey()).update(body).digest();
  const got = Buffer.from(sig, 'base64url');
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp > Date.now() && typeof p.u === 'string' ? { u: p.u, v: Number(p.v) } : null;
  } catch {
    return null;
  }
};

const cleanUsername = (raw: unknown) => String(raw || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);

type Admin = { username: string; name: string; role: string; specialty?: string; status: string; mustChange: boolean; v: number };

// The team (Eyad, 14 Oct): the main admin («owner») can do everything; the others have one specialty
// and only its actions. Checked here on every call; the site only hides what is not allowed.
const SPECIALTIES: Record<string, string> = { support: 'دعم المشتركين', finance: 'مالية', domains: 'دومينات', content: 'مراجعة المحتوى' };
const FINANCE_ONLY = ['design-orders', 'design-order', 'design-order-paid', 'design-order-release', 'design-order-refund', 'designer-recount', 'payment-info-get', 'payment-info-set', 'payments', 'add-payment', 'postpone-freeze', 'invoice-send', 'get-company', 'tokens-overview', 'tokens-adjust', 'dashboard', 'export', 'coupons', 'coupon-save', 'coupon-toggle', 'coupon-apply', 'orders', 'order', 'order-approve', 'order-reject', 'order-extend', 'billing-settings'];
// The designers' gallery and the rating reports are the content reviewers' work (the owner too).
const CONTENT_ONLY = ['page-law-get', 'page-law-set', 'slides-review-list', 'slide-review', 'gallery-seed-status', 'gallery-seed', 'gallery-doc', 'gallery-doc-save', 'gallery-doc-delete', 'slide-edit-review', 'reports', 'report-decide'];
const OWNER_ONLY = ['set-company', 'set-prices', 'set-status', 'admins-list', 'admin-add', 'admin-update', 'admin-reset-password', 'task-create', 'task-update', 'health', 'announce-preview', 'announce', 'backup', 'billing-enforce', 'test-account', 'subscriber-delete'];
// The tasks calls are open, but an admin who is not the owner only sees and touches the tasks given to them.
const OPEN_TO_ALL = ['subscribers', 'subscriber', 'add-note', 'deleted-list', 'tasks', 'task', 'task-status', 'task-reply', 'chat', 'chat-send'];
const TASK_TYPES: Record<string, string> = { payment: 'طلب دفع', domain: 'طلب دومين', complaint: 'شكوى', other: 'أخرى' };
const TASK_STATUSES = ['new', 'doing', 'done'];
const KNOWN_ACTIONS = [...OPEN_TO_ALL, ...FINANCE_ONLY, ...CONTENT_ONLY, ...OWNER_ONLY];
const can = (a: Pick<Admin, 'role' | 'specialty'>, action: string) =>
  a.role === 'owner' || OPEN_TO_ALL.includes(action) || (FINANCE_ONLY.includes(action) && a.specialty === 'finance') || (CONTENT_ONLY.includes(action) && a.specialty === 'content');
const publicAdmin = (a: Admin) => ({ username: a.username, name: a.name, role: a.role, specialty: a.specialty || '', mustChange: a.mustChange, can: KNOWN_ACTIONS.filter((x) => can(a, x)) });

// A temporary password the owner reads out once; the admin must change it at the first sign-in.
const tempPassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(randomBytes(12), (b) => chars[b % chars.length]).join('');
};


type Fb = NonNullable<ReturnType<typeof firebaseAdmin>>;
const DAY = 86400000;

// The workspace ids of a subscriber: the uid, and the old 'sim_' accounts it claimed.
const accountIdsOf = async (db: Fb['db'], uid: string) => {
  const claimed = await db.collection('accounts').where('owner', '==', uid).select().get();
  return [uid, ...claimed.docs.map((d) => d.id)];
};

// Freezes, cancels or activates a subscriber: the Firebase user, suspendedAccounts, the status and
// the history. An admin's activation also removes the automatic freeze date, so the cron does not
// freeze the account again the next morning.
const applyStatus = async (fb: Fb, uid: string, next: string, reason: string, by: string, clearFreeze = by !== 'system') => {
  const { db, auth } = fb;
  const off = next !== 'active';
  await auth.updateUser(uid, { disabled: off });
  if (off) await auth.revokeRefreshTokens(uid);
  const batch = db.batch();
  const now = Date.now();
  for (const id of await accountIdsOf(db, uid)) {
    const ref = db.collection('suspendedAccounts').doc(id);
    if (off) batch.set(ref, { status: next, at: now });
    else batch.delete(ref);
  }
  const sub = db.collection('platform_subscribers').doc(uid);
  batch.set(sub, { status: next, reason, at: now, by, autoFrozen: by === 'system' && next === 'frozen' }, { merge: true });
  if (next === 'active' && clearFreeze) batch.set(sub, { subscription: { freezeAt: FieldValue.delete() } }, { merge: true });
  batch.set(sub.collection('events').doc(), { at: now, admin: by, type: 'status', status: next, text: reason });
  await batch.commit();
};

// 'sent', 'skipped' (no sender set up in Vercel) or 'failed' (Resend refused, with its reason).
const sendMail = async (to: string, subject: string, html: string): Promise<{ result: 'sent' | 'skipped' | 'failed'; detail?: string }> => {
  const from = process.env.EMAIL_FROM;
  const key = process.env.RESEND_API_KEY;
  if (!from || !key || !to) return { result: 'skipped' };
  try {
    const { error } = await new Resend(key).emails.send({ from, to, subject, html });
    return error ? { result: 'failed', detail: error.message } : { result: 'sent' };
  } catch (e) {
    return { result: 'failed', detail: (e as Error)?.message };
  }
};

const callFromDoc = (d: Record<string, any>) => ({
  at: Number(d.at) || 0, kind: String(d.kind || ''), tokens: Number(d.tokens) || 0, input: Number(d.input) || 0, output: Number(d.output) || 0,
  costUsd: Number(d.costUsd) || 0, ok: d.ok !== false, reason: String(d.reason || ''),
});

const payFromDoc = (id: string, d: Record<string, any>) => ({
  id, uid: String(d.uid || ''), invoiceNo: String(d.invoiceNo || ''), name: String(d.name || ''), email: String(d.email || ''),
  plan: String(d.plan || ''), planName: String(d.planName || ''), period: (d.period === 'yearly' ? 'yearly' : 'monthly') as Period,
  amount: Number(d.amount) || 0, method: String(d.method || ''), receiptNo: String(d.receiptNo || ''), note: String(d.note || ''),
  paidAt: Number(d.paidAt) || 0, coversFrom: Number(d.coversFrom) || 0, coversTo: Number(d.coversTo) || 0,
  by: String(d.by || ''), sentAt: Number(d.sentAt) || 0, key: String(d.key || ''), project: String(d.project || ''),
});

const getCompany = async (db: Fb['db']): Promise<Company> => ({ ...EMPTY_COMPANY, ...((await db.collection('platform_settings').doc('company').get()).data() || {}) });

// Vercel's daily cron: reminders 14, 7 and 1 day before freezeAt, and the freeze itself.
const REMINDERS: { key: 'd14' | 'd7' | 'd1'; days: number }[] = [{ key: 'd1', days: 1 }, { key: 'd7', days: 7 }, { key: 'd14', days: 14 }];
const runDaily = async (fb: Fb) => {
  const { db, auth } = fb;
  const now = Date.now();
  const snap = await db.collection('platform_subscribers').where('subscription.freezeAt', '>', 0).get();
  const out = { checked: snap.size, frozen: 0, reminded: 0, skipped: 0, failed: 0 };
  for (const d of snap.docs) {
    const data = d.data() as { status?: string; subscription?: { planName?: string; freezeAt?: number; notified?: Record<string, number> } };
    const sub = data.subscription;
    if (!sub?.freezeAt || (data.status || 'active') !== 'active') continue;
    const user = await auth.getUser(d.id).catch(() => null);
    if (!user) continue;
    const planName = sub.planName || 'اشتراكك';
    const left = (sub.freezeAt - now) / DAY;

    if (left <= 0) {
      await applyStatus(fb, d.id, 'frozen', 'انتهى الاشتراك', 'system');
      out.frozen++;
      const m = reminderMail('frozen', user.displayName || '', planName, sub.freezeAt);
      if ((await sendMail(user.email || '', m.subject, m.html)).result === 'failed') out.failed++;
      continue;
    }
    // The most urgent reminder not sent yet; the milder ones that also apply are marked as sent.
    const due = REMINDERS.filter((r) => left <= r.days);
    const todo = due.find((r) => !sub.notified?.[r.key]);
    if (!todo) continue;
    const m = reminderMail(todo.key, user.displayName || '', planName, sub.freezeAt);
    const sent = await sendMail(user.email || '', m.subject, m.html);
    if (sent.result === 'sent') {
      out.reminded++;
      await d.ref.set({ subscription: { notified: Object.fromEntries(due.map((r) => [r.key, now])) } }, { merge: true });
    } else if (sent.result === 'failed') out.failed++;
    else out.skipped++;
  }
  const billing = await runBillingDaily(db, auth, now).catch((e) => ({ error: String((e as Error)?.message || e) }));
  await db.collection('platform_audit').add({ at: FieldValue.serverTimestamp(), admin: 'system', action: `daily:${JSON.stringify({ ...out, billing })}`, ok: true, ip: 'cron' });
  return { ...out, billing };
};

// ---------- accounts and dashboard (phase 6) ----------

type FbUser = Awaited<ReturnType<Fb['auth']['listUsers']>>['users'][number];
const listAllUsers = async (auth: Fb['auth']) => {
  const users: FbUser[] = [];
  let pageToken: string | undefined;
  do {
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken && users.length < MAX_USERS);
  return users;
};

// The last `n` calendar months as 'YYYY-MM', oldest first.
const lastMonths = (n: number, now = Date.now()) => {
  const d = new Date(now);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - (n - 1));
  return Array.from({ length: n }, () => {
    const key = d.toISOString().slice(0, 7);
    d.setUTCMonth(d.getUTCMonth() + 1);
    return key;
  });
};
const isoDay = (ms: number) => (ms ? new Date(ms).toISOString().slice(0, 10) : '');
const tsOf = (v: any): number => (typeof v?.toMillis === 'function' ? v.toMillis() : Number(v) || 0);
const createdOf = (u: FbUser) => Date.parse(u.metadata.creationTime || '') || 0;

// CSV for Excel: quotes where needed, and a leading quote on text that a spreadsheet would run as a formula.
const csvCell = (v: unknown) => {
  let s = String(v ?? '');
  if (typeof v !== 'number' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (head: string[], rows: unknown[][]) => [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');

// ---------- coupons (Eyad's extras): trial days, bonus tokens, a percent off a payment ----------

const COUPON_KINDS: Record<string, string> = { trial: 'فترة تجربة (أيام)', tokens: 'توكنز هدية', discount: 'خصم على دفعة (%)' };
const cleanCode = (raw: unknown) => String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24);
interface Coupon { code: string; kind: string; value: number; plan: string; planName: string; maxUses: number; used: number; expiresAt: number; active: boolean; note: string; createdAt: number; by: string }
const couponFromDoc = (id: string, d: Record<string, any>): Coupon => ({
  code: id, kind: String(d.kind || ''), value: Number(d.value) || 0, plan: String(d.plan || ''), planName: String(d.planName || ''),
  maxUses: Number(d.maxUses) || 0, used: Number(d.used) || 0, expiresAt: Number(d.expiresAt) || 0, active: d.active !== false,
  note: String(d.note || ''), createdAt: Number(d.createdAt) || 0, by: String(d.by || ''),
});
const couponProblem = (c: Coupon, now: number) =>
  !c.active ? 'inactive' : c.expiresAt && c.expiresAt < now ? 'expired' : c.maxUses && c.used >= c.maxUses ? 'used-up' : '';
// One use per subscriber; the counter and the subscriber's mark are written together.
const redeemCoupon = (db: Fb['db'], code: string, uid: string) =>
  db.runTransaction(async (t) => {
    const ref = db.collection('platform_coupons').doc(code);
    const useRef = ref.collection('uses').doc(uid);
    const [snap, useSnap] = await Promise.all([t.get(ref), t.get(useRef)]);
    if (!snap.exists) return { error: 'not-found' as const };
    const c = couponFromDoc(snap.id, snap.data() || {});
    const bad = couponProblem(c, Date.now());
    if (bad) return { error: bad };
    if (useSnap.exists) return { error: 'already-used' };
    t.set(ref, { used: c.used + 1 }, { merge: true });
    t.set(useRef, { at: Date.now() });
    return { coupon: c };
  });

// ---------- announcement emails ----------

const AUDIENCES: Record<string, string> = { all: 'كل المشتركين', paid: 'المشتركون باشتراك فعّال', free: 'بدون اشتراك مدفوع', expiring: 'اشتراكهم ينتهي خلال أسبوعين' };
const MAX_ANNOUNCE = 1000;
const announceHtml = (subject: string, text: string) => `<!doctype html><html lang="ar" dir="rtl"><body style="margin:0;background:#f5f5f7;font-family:Tahoma,Arial,sans-serif;color:#1d1d1f"><div style="max-width:560px;margin:0 auto;padding:24px"><div style="background:#fff;border-radius:14px;padding:24px"><h2 style="margin:0 0 14px;font-size:19px">${esc(subject)}</h2><div style="line-height:1.9;font-size:15px;white-space:pre-wrap">${esc(text)}</div></div><p style="color:#86868b;font-size:12px;text-align:center;margin:14px 0 0">وصلتك هذه الرسالة لأنك مشترك في Weelink.</p></div></body></html>`;

// ---------- handler ----------

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const invoiceId = url.searchParams.get('invoice');
      const secret = process.env.CRON_SECRET;
      const fbGet = firebaseAdmin();
      if (invoiceId) {
        if (!fbGet) return json({ error: 'not-configured' }, 503);
        const snap = await fbGet.db.collection('platform_payments').doc(invoiceId.slice(0, 128)).get();
        const key = String(url.searchParams.get('k') || '');
        const have = String(snap.data()?.key || '');
        const same = have.length > 0 && key.length === have.length && timingSafeEqual(Buffer.from(key), Buffer.from(have));
        if (!snap.exists || !same) return new Response('Not found', { status: 404 });
        const html = invoiceHtml(payFromDoc(snap.id, snap.data()!), await getCompany(fbGet.db), true);
        return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
      }
      if (secret && request.headers.get('authorization') === `Bearer ${secret}`) {
        if (!fbGet) return json({ error: 'not-configured' }, 503);
        return json(await runDaily(fbGet));
      }
      return json({ serviceAccount: !!serviceAccount(), cron: !!secret, email: !!process.env.EMAIL_FROM && !!process.env.RESEND_API_KEY });
    }
    if (request.method !== 'POST') return json({ error: 'method' }, 405);

    const fb = firebaseAdmin();
    if (!fb) return json({ error: 'not-configured' }, 503);
    const { db, auth } = fb;

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'bad-request' }, 400);
    }
    const action = String(body.action || '');
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const audit = (admin: string, what: string, ok = true) =>
      db.collection('platform_audit').add({ at: FieldValue.serverTimestamp(), admin, action: what, ok, ip }).catch(() => undefined);

    // ----- a subscriber's own account page (signed in with Firebase, not an admin) -----
    // The subscription, the AI balance and the payments with their invoice links, read on the server
    // because the browser never reads platform_subscribers or platform_payments.
    if (action === 'my-account' || action === 'order-create' || action === 'order-attach') {
      const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      const user = token ? await auth.verifyIdToken(token).catch(() => null) : null;
      if (!user) return json({ error: 'unauthorized' }, 401);
      // Paying for a project before it is published (server/billing.ts).
      if (action !== 'my-account') {
        const who = { uid: user.uid, email: String(user.email || ''), name: String(user.name || '') };
        const r = action === 'order-create' ? await createOrder(db, who, body) : await attachProof(db, who, body);
        return 'error' in r ? json({ error: r.error }, r.status) : json(r);
      }
      const [subSnap, paySnap, billing] = await Promise.all([
        db.collection('platform_subscribers').doc(user.uid).get(),
        db.collection('platform_payments').where('uid', '==', user.uid).limit(200).get(),
        myBilling(db, user.uid),
      ]);
      const st = subSnap.data() as Record<string, any> | undefined;
      const sub = st?.subscription;
      const origin = new URL(request.url).origin;
      const payments = paySnap.docs
        .map((d) => payFromDoc(d.id, d.data()))
        .sort((a, b) => b.paidAt - a.paidAt)
        .map((p) => ({
          id: p.id, invoiceNo: p.invoiceNo, planName: p.planName, period: p.period, amount: p.amount, method: p.method,
          paidAt: p.paidAt, coversFrom: p.coversFrom, coversTo: p.coversTo, project: p.project,
          invoiceUrl: p.key ? `${origin}/api/admin?invoice=${p.id}&k=${p.key}` : '',
        }));
      const info = (await db.collection('platformSettings').doc('paymentInfo').get()).data() as { text?: string } | undefined;
      return json({
        status: String(st?.status || 'active'),
        subscription: sub
          ? { plan: String(sub.plan || ''), planName: String(sub.planName || ''), period: sub.period === 'yearly' ? 'yearly' : 'monthly', endsAt: Number(sub.endsAt) || 0, freezeAt: Number(sub.freezeAt) || 0, trial: !!sub.trial }
          : null,
        tokens: { balance: typeof st?.tokens?.balance === 'number' ? st.tokens.balance : FREE_TOKENS, used: Number(st?.tokens?.used) || 0 },
        payments,
        ...billing,
        paymentInfo: String(info?.text || ''),
      });
    }

    // ----- sign in -----
    if (action === 'login') {
      const username = cleanUsername(body.username);
      const password = String(body.password || '').slice(0, 200);
      if (!username || !password) return json({ error: 'wrong' }, 401);

      const lockRef = db.collection('platform_admin_locks').doc(createHash('sha256').update(`${username}|${ip}`).digest('hex').slice(0, 40));
      const lock = (await lockRef.get()).data() as { fails?: number; until?: number } | undefined;
      if (lock?.until && lock.until > Date.now()) return json({ error: 'locked', minutes: Math.ceil((lock.until - Date.now()) / 60000) }, 429);

      const ref = db.collection('platform_admins').doc(username);
      let snap = await ref.get();
      // The main admin does not exist until its first sign-in with the default password.
      if (!snap.exists && username === FIRST_ADMIN && password === DEFAULT_PASSWORD) {
        const anyone = await db.collection('platform_admins').limit(1).get();
        if (anyone.empty) {
          await ref.set({ name: 'المدير', role: 'owner', status: 'active', pass: hashPassword(DEFAULT_PASSWORD), v: 1, mustChange: true, createdAt: FieldValue.serverTimestamp() });
          snap = await ref.get();
        }
      }
      const data = snap.data() as (Omit<Admin, 'username'> & { pass: string }) | undefined;
      // The same work for a name that does not exist, so the answer time does not tell.
      const right = checkPassword(password, data?.pass || '');
      if (!data || !right || data.status !== 'active') {
        const fails = (lock?.fails || 0) + 1;
        await lockRef.set(fails >= MAX_FAILS ? { fails: 0, until: Date.now() + LOCK_MS } : { fails, until: 0 });
        await audit(username, 'login', false);
        return json({ error: data && right && data.status !== 'active' ? 'frozen' : 'wrong' }, 401);
      }
      await lockRef.delete().catch(() => undefined);
      await audit(username, 'login');
      const admin: Admin = { username, name: data.name, role: data.role, specialty: data.specialty, status: data.status, mustChange: !!data.mustChange, v: data.v };
      return json({ token: signToken(username, data.v), admin: publicAdmin(admin) });
    }

    // ----- everything else needs a session -----
    const session = readToken((request.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''));
    if (!session) return json({ error: 'session' }, 401);
    const adminSnap = await db.collection('platform_admins').doc(session.u).get();
    const row = adminSnap.data() as (Omit<Admin, 'username'> & { pass: string }) | undefined;
    if (!row || row.status !== 'active' || row.v !== session.v) return json({ error: 'session' }, 401);
    const admin: Admin = { username: session.u, name: row.name, role: row.role, specialty: row.specialty, status: row.status, mustChange: !!row.mustChange, v: row.v };

    if (action === 'me') return json({ admin: publicAdmin(admin) });

    if (action === 'change-password') {
      const current = String(body.current || '');
      const next = String(body.next || '');
      if (!checkPassword(current, row.pass)) return json({ error: 'wrong' }, 401);
      if (next.length < 8 || next.length > 100) return json({ error: 'short' }, 400);
      if (next === DEFAULT_PASSWORD || next === current) return json({ error: 'same' }, 400);
      const v = row.v + 1;
      await adminSnap.ref.update({ pass: hashPassword(next), v, mustChange: false });
      await audit(session.u, 'change-password');
      return json({ token: signToken(session.u, v), admin: publicAdmin({ ...admin, v, mustChange: false }) });
    }

    // A default or temporary password only opens the step above.
    if (admin.mustChange) return json({ error: 'must-change' }, 403);
    if (!can(admin, action)) return json({ error: KNOWN_ACTIONS.includes(action) ? 'forbidden' : 'unknown-action' }, KNOWN_ACTIONS.includes(action) ? 403 : 400);

    // ----- the team (owner only) -----
    if (action === 'admins-list') {
      const snap = await db.collection('platform_admins').get();
      const rows = snap.docs.map((d) => {
        const x = d.data() as { name?: string; role?: string; specialty?: string; status?: string; mustChange?: boolean };
        return { username: d.id, name: x.name || d.id, role: x.role || 'admin', specialty: x.specialty || '', status: x.status || 'active', mustChange: !!x.mustChange };
      }).sort((a, b) => (a.role === 'owner' ? -1 : 0) - (b.role === 'owner' ? -1 : 0) || a.username.localeCompare(b.username));
      return json({ rows, specialties: SPECIALTIES });
    }

    if (action === 'admin-add') {
      const username = cleanUsername(body.username);
      const name = String(body.name || '').trim().slice(0, 60);
      const specialty = String(body.specialty || '');
      if (username.length < 3) return json({ error: 'bad-username' }, 400);
      if (!name) return json({ error: 'bad-name' }, 400);
      if (!SPECIALTIES[specialty]) return json({ error: 'bad-specialty' }, 400);
      const ref = db.collection('platform_admins').doc(username);
      if ((await ref.get()).exists) return json({ error: 'exists' }, 409);
      const temp = tempPassword();
      await ref.set({ name, role: 'admin', specialty, status: 'active', pass: hashPassword(temp), v: 1, mustChange: true, createdAt: FieldValue.serverTimestamp(), createdBy: session.u });
      await audit(session.u, `admin-add:${username}`);
      return json({ username, tempPassword: temp });
    }

    if (action === 'admin-update' || action === 'admin-reset-password') {
      const username = cleanUsername(body.username);
      const ref = db.collection('platform_admins').doc(username);
      const cur = (await ref.get()).data() as (Omit<Admin, 'username'> & { pass: string }) | undefined;
      if (!cur) return json({ error: 'not-found' }, 404);
      // The main admin cannot be changed from here (not even by itself): no lock-out.
      if (cur.role === 'owner') return json({ error: 'owner' }, 400);
      if (action === 'admin-reset-password') {
        const temp = tempPassword();
        await ref.update({ pass: hashPassword(temp), v: cur.v + 1, mustChange: true });
        await audit(session.u, `admin-reset-password:${username}`);
        return json({ username, tempPassword: temp });
      }
      const patch: Record<string, unknown> = {};
      if (body.name !== undefined) {
        const name = String(body.name).trim().slice(0, 60);
        if (!name) return json({ error: 'bad-name' }, 400);
        patch.name = name;
      }
      if (body.specialty !== undefined) {
        if (!SPECIALTIES[String(body.specialty)]) return json({ error: 'bad-specialty' }, 400);
        patch.specialty = String(body.specialty);
      }
      if (body.status !== undefined) {
        if (!['active', 'frozen'].includes(String(body.status))) return json({ error: 'bad-status' }, 400);
        patch.status = String(body.status);
      }
      if (!Object.keys(patch).length) return json({ error: 'bad-request' }, 400);
      // A frozen admin's open sessions stop at their next call (the status is read every time).
      await ref.update(patch);
      await audit(session.u, `admin-update:${username}:${Object.keys(patch).join(',')}`);
      return json({ ok: true });
    }

    if (action === 'subscribers') {
      const q = String(body.q || '').trim().toLowerCase().slice(0, 100);
      const state = ['active', 'sleeping'].includes(String(body.state)) ? String(body.state) : 'all';
      const published = ['yes', 'no'].includes(String(body.published)) ? String(body.published) : 'all';
      const verified = ['yes', 'no'].includes(String(body.verified)) ? String(body.verified) : 'all';
      const status = STATUSES.includes(String(body.status)) ? String(body.status) : 'all';
      const subFilter = ['none', 'active', 'expiring', 'expired'].includes(String(body.sub)) ? String(body.sub) : 'all';

      // Pages by owner: published sites carry the owner's workspace id, which for an old
      // account is not the Firebase uid (accounts/{id}.owner says whose it is).
      const [sitesSnap, accountsSnap] = await Promise.all([
        db.collection('publishedSites').select('name', 'owner', 'project').get(),
        db.collection('accounts').select('owner').get(),
      ]);
      const uidOf = new Map<string, string>();
      accountsSnap.forEach((d) => d.data().owner && uidOf.set(d.id, String(d.data().owner)));
      const sitesByUid = new Map<string, { name: string; project: string }[]>();
      sitesSnap.forEach((d) => {
        const s = d.data() as { name: string; owner: string; project: string };
        const uid = uidOf.get(s.owner) || s.owner;
        sitesByUid.set(uid, [...(sitesByUid.get(uid) || []), { name: s.name, project: s.project }]);
      });

      const statusSnap = await db.collection('platform_subscribers').select('status', 'subscription', 'deletedAt').get();
      // A customer the team deleted is listed in «الزبائن المحذوفين» only, until they publish a page again.
      const deleted = new Set<string>();
      statusSnap.forEach((d) => d.data().deletedAt && deleted.add(d.id));
      const statusOf = new Map<string, string>();
      const subOf = new Map<string, { planName: string; endsAt: number; freezeAt: number }>();
      statusSnap.forEach((d) => {
        statusOf.set(d.id, String(d.data().status || 'active'));
        const sb = d.data().subscription;
        if (sb?.endsAt) subOf.set(d.id, { planName: String(sb.planName || ''), endsAt: Number(sb.endsAt) || 0, freezeAt: Number(sb.freezeAt) || 0 });
      });

      const users: Awaited<ReturnType<typeof auth.listUsers>>['users'] = [];
      let pageToken: string | undefined;
      do {
        const page = await auth.listUsers(1000, pageToken);
        users.push(...page.users);
        pageToken = page.pageToken;
      } while (pageToken && users.length < MAX_USERS);

      const sleepingBefore = Date.now() - SLEEPING_AFTER_DAYS * 86400000;
      const all = users.map((u) => {
        const seen = Math.max(Date.parse(u.metadata.lastRefreshTime || '') || 0, Date.parse(u.metadata.lastSignInTime || '') || 0);
        const sites = sitesByUid.get(u.uid) || [];
        return {
          uid: u.uid,
          name: u.displayName || '',
          email: u.email || '',
          phone: u.phoneNumber || '',
          createdAt: Date.parse(u.metadata.creationTime || '') || 0,
          lastActive: seen,
          verified: u.emailVerified,
          disabled: u.disabled,
          status: statusOf.get(u.uid) || 'active',
          sub: subOf.get(u.uid) || null,
          subState: ((): string => {
            const sb = subOf.get(u.uid);
            if (!sb) return 'none';
            if (!sb.freezeAt) return 'active';
            const left = sb.freezeAt - Date.now();
            return left <= 0 ? 'expired' : left <= 14 * DAY ? 'expiring' : 'active';
          })(),
          active: seen >= sleepingBefore,
          sites,
        };
      });

      const matched = all.filter((r) => {
        if (deleted.has(r.uid) && !r.sites.length) return false;
        if (state === 'active' && !r.active) return false;
        if (state === 'sleeping' && r.active) return false;
        if (published === 'yes' && !r.sites.length) return false;
        if (published === 'no' && r.sites.length) return false;
        if (verified === 'yes' && !r.verified) return false;
        if (verified === 'no' && r.verified) return false;
        if (status !== 'all' && r.status !== status) return false;
        if (subFilter !== 'all' && r.subState !== subFilter) return false;
        return !q || [r.name, r.email, r.phone, r.uid, ...r.sites.map((s) => s.name)].some((v) => v.toLowerCase().includes(q));
      });
      matched.sort((a, b) => b.createdAt - a.createdAt);

      return json({
        rows: matched.slice(0, MAX_ROWS),
        matched: matched.length,
        summary: {
          total: all.length,
          active: all.filter((r) => r.active).length,
          sleeping: all.filter((r) => !r.active).length,
          withPage: all.filter((r) => r.sites.length).length,
          sleepingAfterDays: SLEEPING_AFTER_DAYS,
        },
      });
    }

    // ----- one subscriber -----
    const uid = String(body.uid || '').slice(0, 128);
    // The workspace ids of a subscriber: the uid, and the old 'sim_' accounts it claimed.
    const accountIds = (u: string) => accountIdsOf(db, u);
    const userOrNull = (u: string) => auth.getUser(u).catch(() => null);

    if (action === 'subscriber') {
      const user = uid ? await userOrNull(uid) : null;
      if (!user) return json({ error: 'not-found' }, 404);
      const ids = await accountIds(uid);
      const [statusSnap, eventsSnap, sitesSnap, paymentsSnap, callsSnap] = await Promise.all([
        db.collection('platform_subscribers').doc(uid).get(),
        db.collection('platform_subscribers').doc(uid).collection('events').orderBy('at', 'desc').limit(100).get(),
        db.collection('publishedSites').where('owner', 'in', ids.slice(0, 30)).select('name', 'project', 'publishedAt').get(),
        db.collection('platform_payments').where('uid', '==', uid).get(),
        db.collection('platform_ai_calls').where('uid', '==', uid).limit(500).get(),
      ]);
      const st = statusSnap.data() as { status?: string; reason?: string; at?: number; by?: string; subscription?: Record<string, any>; tokens?: { balance?: number; used?: number } } | undefined;
      const [testSnap, accessSnap] = await Promise.all([
        db.collection('testAccounts').doc(uid).get(),
        db.collection('projectAccess').where('owner', '==', uid).limit(100).get(),
      ]);
      return json({
        test: testSnap.exists,
        projects: accessSnap.docs.map((d) => ({ project: String(d.data().project || ''), planName: String(d.data().planName || ''), period: String(d.data().period || ''), paidUntil: Number(d.data().paidUntil) || 0 })),
        profile: {
          uid, name: user.displayName || '', email: user.email || '', phone: user.phoneNumber || '', verified: user.emailVerified,
          createdAt: Date.parse(user.metadata.creationTime || '') || 0,
          lastActive: Math.max(Date.parse(user.metadata.lastRefreshTime || '') || 0, Date.parse(user.metadata.lastSignInTime || '') || 0),
          providers: user.providerData.map((p) => p.providerId),
        },
        status: { status: st?.status || 'active', reason: st?.reason || '', at: st?.at || 0, by: st?.by || '' },
        subscription: st?.subscription?.endsAt ? { plan: String(st.subscription.plan || ''), planName: String(st.subscription.planName || ''), period: st.subscription.period === 'yearly' ? 'yearly' : 'monthly', endsAt: Number(st.subscription.endsAt) || 0, freezeAt: Number(st.subscription.freezeAt) || 0 } : null,
        payments: can(admin, 'payments') ? paymentsSnap.docs.map((d) => payFromDoc(d.id, d.data())).sort((a, b) => b.paidAt - a.paidAt) : [],
        tokens: { balance: typeof st?.tokens?.balance === 'number' ? st.tokens.balance : null, used: st?.tokens?.used || 0, free: FREE_TOKENS },
        tasks: await (async () => {
          const snap = await db.collection('platform_tasks').where('uid', '==', uid).limit(100).get();
          return snap.docs
            .filter((d) => admin.role === 'owner' || d.data().assignee === session.u)
            .map((d) => ({ id: d.id, title: String(d.data().title || ''), status: String(d.data().status || 'new'), assignee: String(d.data().assignee || ''), updatedAt: Number(d.data().updatedAt) || 0 }))
            .sort((a, b) => b.updatedAt - a.updatedAt);
        })(),
        calls: can(admin, 'tokens-overview') ? callsSnap.docs.map((d) => callFromDoc(d.data())).sort((a, b) => b.at - a.at).slice(0, 20) : [],
        sites: sitesSnap.docs.map((d) => ({ name: String(d.data().name), project: String(d.data().project), publishedAt: String(d.data().publishedAt || '') })),
        events: eventsSnap.docs.map((d) => {
          const e = d.data() as { at?: { toMillis?: () => number } | number; admin?: string; type?: string; text?: string; status?: string };
          return { id: d.id, at: typeof e.at === 'number' ? e.at : e.at?.toMillis?.() || 0, admin: e.admin || '', type: e.type || '', text: e.text || '', status: e.status || '' };
        }),
      });
    }

    if (action === 'set-status') {
      const next = String(body.status || '');
      const reason = String(body.reason || '').trim().slice(0, 300);
      if (!STATUSES.includes(next)) return json({ error: 'bad-status' }, 400);
      if (next !== 'active' && reason.length < 3) return json({ error: 'reason' }, 400);
      if (!uid || !(await userOrNull(uid))) return json({ error: 'not-found' }, 404);
      await applyStatus(fb, uid, next, reason, session.u);
      await audit(session.u, `set-status:${next}:${uid}`);
      return json({ status: next });
    }

    if (action === 'add-payment') {
      const user = uid ? await userOrNull(uid) : null;
      if (!user) return json({ error: 'not-found' }, 404);
      const plan = String(body.plan || '');
      const period = String(body.period || '') as Period;
      let amount = Number(body.amount);
      const method = String(body.method || '');
      if (!/^(page|restaurant|shop|cars)-(pro|30|60)$/.test(plan)) return json({ error: 'bad-plan' }, 400);
      if (!PERIODS.includes(period)) return json({ error: 'bad-period' }, 400);
      if (!(amount >= 0 && amount < 1e12)) return json({ error: 'bad-amount' }, 400);
      if (!METHODS[method]) return json({ error: 'bad-method' }, 400);

      // A percent-off coupon lowers the amount; the note keeps what was taken off.
      let couponNote = '';
      const couponCode = cleanCode(body.coupon);
      if (couponCode) {
        const peek = (await db.collection('platform_coupons').doc(couponCode).get()).data();
        if (!peek) return json({ error: 'coupon-not-found' }, 404);
        if (peek.kind !== 'discount') return json({ error: 'coupon-kind' }, 400);
        const r = await redeemCoupon(db, couponCode, uid);
        if ('error' in r) return json({ error: `coupon-${r.error}` }, 400);
        const off = Math.round((amount * r.coupon.value) / 100);
        couponNote = `كوبون ${couponCode} -${r.coupon.value}% (خُصم ${off.toLocaleString('en')})`;
        amount -= off;
      }

      const subRef = db.collection('platform_subscribers').doc(uid);
      const cur = (await subRef.get()).data() as { status?: string; autoFrozen?: boolean; subscription?: { endsAt?: number } } | undefined;
      const now = Date.now();
      // A subscription still running is extended from its end; an ended one starts today.
      const from = cur?.subscription?.endsAt && cur.subscription.endsAt > now ? cur.subscription.endsAt : now;
      const endsAt = addPeriod(from, period);
      const n = await db.runTransaction(async (t) => {
        const ref = db.collection('platform_counters').doc('invoice');
        const next = ((await t.get(ref)).data()?.n || 0) + 1;
        t.set(ref, { n: next });
        return next;
      });
      const planName = String(body.planName || '').trim().slice(0, 60) || plan;
      const payRef = db.collection('platform_payments').doc();
      const pay = {
        uid, email: user.email || '', name: user.displayName || '', plan, planName, period, amount, method,
        receiptNo: String(body.receiptNo || '').trim().slice(0, 40), note: [String(body.note || '').trim().slice(0, 300), couponNote].filter(Boolean).join(' · '),
        paidAt: now, coversFrom: from, coversTo: endsAt, by: session.u, key: randomBytes(12).toString('hex'),
        invoiceNo: `INV-${new Date(now).getUTCFullYear()}-${String(n).padStart(4, '0')}`,
      };
      const batch = db.batch();
      batch.set(payRef, pay);
      const granted = PAID_TOKENS * (period === 'yearly' ? 12 : 1);
      batch.set(subRef, { subscription: { plan, planName, period, endsAt, freezeAt: endsAt, notified: FieldValue.delete() }, tokens: { balance: FieldValue.increment(granted) } }, { merge: true });
      batch.set(subRef.collection('events').doc(), { at: now, admin: session.u, type: 'payment', text: `${planName} ${period === 'yearly' ? 'سنوي' : 'شهري'} · ${amount.toLocaleString('en')} ل.س · ${METHODS[method]} · حتى ${fmtDate(endsAt)} · +${granted.toLocaleString('en')} توكن` });
      await batch.commit();
      // Paying brings back an account the cron froze for the end of its subscription.
      if (cur?.status === 'frozen' && cur.autoFrozen) await applyStatus(fb, uid, 'active', 'تجديد الاشتراك', session.u, false);
      await audit(session.u, `add-payment:${uid}`);
      return json({ payment: payFromDoc(payRef.id, pay) });
    }

    if (action === 'postpone-freeze') {
      const reason = String(body.reason || '').trim().slice(0, 300);
      const date = String(body.date || '');
      if (reason.length < 3) return json({ error: 'reason' }, 400);
      const user = uid ? await userOrNull(uid) : null;
      if (!user) return json({ error: 'not-found' }, 404);
      let freezeAt = 0;
      if (date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: 'bad-date' }, 400);
        // The end of that day in Syria.
        freezeAt = Date.parse(`${date}T23:59:59+03:00`);
        if (!(freezeAt > Date.now())) return json({ error: 'past-date' }, 400);
      }
      const subRef = db.collection('platform_subscribers').doc(uid);
      const cur = (await subRef.get()).data() as { status?: string; autoFrozen?: boolean } | undefined;
      await subRef.set({ subscription: { freezeAt: freezeAt || FieldValue.delete(), notified: FieldValue.delete() } }, { merge: true });
      await subRef.collection('events').add({ at: Date.now(), admin: session.u, type: 'freeze-date', text: `${freezeAt ? `التجميد التلقائي يوم ${fmtDate(freezeAt)}` : 'بدون تجميد تلقائي'} · ${reason}` });
      if (cur?.status === 'frozen' && cur.autoFrozen) await applyStatus(fb, uid, 'active', reason, session.u, false);
      await audit(session.u, `postpone-freeze:${uid}`);
      return json({ freezeAt });
    }

    if (action === 'payments') {
      const month = /^\d{4}-\d{2}$/.test(String(body.month)) ? String(body.month) : '';
      const method = METHODS[String(body.method)] ? String(body.method) : '';
      const q = String(body.q || '').trim().toLowerCase().slice(0, 100);
      const snap = await db.collection('platform_payments').orderBy('paidAt', 'desc').limit(1000).get();
      const rows = snap.docs.map((d) => payFromDoc(d.id, d.data())).filter((r) => {
        if (month && new Date(r.paidAt).toISOString().slice(0, 7) !== month) return false;
        if (method && r.method !== method) return false;
        return !q || [r.name, r.email, r.invoiceNo, r.receiptNo, r.planName].some((v) => v.toLowerCase().includes(q));
      });
      return json({ rows: rows.slice(0, 300), matched: rows.length, total: rows.reduce((n, r) => n + r.amount, 0) });
    }

    // ----- paying before publishing (server/billing.ts) -----
    if (action === 'orders') return json(await listOrders(db, ['unpaid', 'attached', 'paid', 'rejected', 'deleted'].includes(String(body.status)) ? String(body.status) : 'all'));
    if (action === 'order') {
      const r = await getOrder(db, String(body.id || '').slice(0, 64));
      return r ? json(r) : json({ error: 'not-found' }, 404);
    }
    if (action === 'order-approve' || action === 'order-reject' || action === 'order-extend') {
      const id = String(body.id || '').slice(0, 64);
      const origin = new URL(request.url).origin;
      const r = action === 'order-approve'
        ? await approveOrder(db, id, session.u, (pid, key) => `${origin}/api/admin?invoice=${pid}&k=${key}`)
        : action === 'order-reject' ? await rejectOrder(db, id, session.u, body.reason) : await extendOrder(db, id, String(body.date || ''));
      if ('error' in r) return json({ error: r.error }, r.status);
      await audit(session.u, `${action}:${id}`);
      return json(r);
    }
    if (action === 'billing-settings') return json(await readSettings(db));
    if (action === 'billing-enforce') {
      const on = body.on === true;
      const uids = on ? (await listAllUsers(auth)).map((u) => u.uid) : [];
      const r = await enforceBilling(db, on, session.u, uids);
      await audit(session.u, `billing-enforce:${on}:${r.marked}`);
      return json(r);
    }
    if (action === 'test-account') {
      if (!uid || !(await userOrNull(uid))) return json({ error: 'not-found' }, 404);
      const r = await setTestAccount(db, uid, body.on === true, session.u);
      await audit(session.u, `test-account:${uid}:${r.test}`);
      return json(r);
    }
    if (action === 'subscriber-delete') {
      const r = await deleteCustomer(db, auth, uid, session.u, body.reason);
      if ('error' in r) return json({ error: r.error }, r.status);
      await audit(session.u, `subscriber-delete:${uid}`);
      return json(r);
    }
    if (action === 'deleted-list') return json({ rows: await listDeleted(db) });

    if (action === 'invoice-send') {
      const snap = await db.collection('platform_payments').doc(String(body.paymentId || '').slice(0, 128)).get();
      if (!snap.exists) return json({ error: 'not-found' }, 404);
      const pay = payFromDoc(snap.id, snap.data()!);
      if (!pay.email) return json({ error: 'no-email' }, 400);
      const link = `${new URL(request.url).origin}/api/admin?invoice=${snap.id}&k=${pay.key}`;
      const html = invoiceHtml(pay, await getCompany(db), false).replace('</div></body>', `<p style="margin-top:20px;font-size:13px"><a href="${link}">افتح الفاتورة للطباعة أو الحفظ PDF</a></p></div></body>`);
      const sent = await sendMail(pay.email, `فاتورة ${pay.invoiceNo}`, html);
      if (sent.result === 'skipped') return json({ error: 'email-not-configured' }, 503);
      if (sent.result === 'failed') {
        await audit(session.u, `invoice-send:${pay.invoiceNo}`, false);
        return json({ error: 'refused', detail: String(sent.detail || '').slice(0, 200) }, 502);
      }
      await snap.ref.update({ sentAt: Date.now() });
      await audit(session.u, `invoice-send:${snap.id}`);
      return json({ sent: true });
    }

    if (action === 'get-company') return json({ company: await getCompany(db) });
    if (action === 'set-company') {
      const clean = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n);
      const company: Company = { name: clean(body.name, 80) || 'Weelink', address: clean(body.address, 200), phone: clean(body.phone, 40), email: clean(body.email, 100), taxNo: clean(body.taxNo, 40), footer: clean(body.footer, 300) };
      await db.collection('platform_settings').doc('company').set(company);
      await audit(session.u, 'set-company');
      return json({ company });
    }

    // ----- hiring a designer: the orders and the money held by the office -----
    // designOrders/{id} (made by api/design-orders.ts). The office takes the customer's money (paid), holds it
    // until the customer confirms the design, and then pays the designer their part (release); a complaint
    // is decided here too: release to the designer, or refund the customer. Each step is in the order's
    // history and the audit log, and writes a system message the customer and the designer read.
    const orderRow = (id: string, d: Record<string, any>) => ({
      id, customerUid: String(d.customerUid || ''), customerAlias: String(d.customerAlias || ''), designerUid: String(d.designerUid || ''),
      designerName: String(d.designerName || ''), slideName: String(d.slideName || ''), planId: String(d.planId || ''),
      price: Number(d.price) || 0, designerShare: Number(d.designerShare) || 0, platformShare: Number(d.platformShare) || 0,
      status: String(d.status || ''), brief: String(d.brief || ''), disputeReason: String(d.disputeReason || ''),
      createdAt: Number(d.createdAt) || 0, updatedAt: Number(d.updatedAt) || 0, deliveredAt: Number(d.deliveredAt) || 0,
      late: String(d.status) === 'disputed' && Date.now() - (Number(d.disputedAt) || Number(d.updatedAt) || Date.now()) > designTimers.disputeLateDays * 86400000,
      payment: d.payment || null, payout: d.payout || null, refund: d.refund || null,
    });
    const emailsOf = async (uids: string[]) => {
      const list = [...new Set(uids.filter(Boolean))].slice(0, 100);
      const got = list.length ? await auth.getUsers(list.map((u) => ({ uid: u }))).catch(() => null) : null;
      return new Map((got?.users || []).map((u) => [u.uid, u.email || u.displayName || u.uid]));
    };

    if (action === 'design-orders') {
      const snap = await db.collection('designOrders').orderBy('updatedAt', 'desc').limit(200).get();
      const all = snap.docs.map((d) => orderRow(d.id, d.data()));
      const status = String(body.status || '');
      const rows = (status ? all.filter((o) => o.status === status) : all).slice(0, 100);
      const counts: Record<string, number> = {};
      for (const o of all) counts[o.status] = (counts[o.status] || 0) + 1;
      const emails = await emailsOf(rows.flatMap((o) => [o.customerUid, o.designerUid]));
      return json({ rows: rows.map((o) => ({ ...o, customerEmail: emails.get(o.customerUid) || '', designerEmail: emails.get(o.designerUid) || '' })), counts });
    }

    if (action === 'design-order') {
      const ref = db.collection('designOrders').doc(String(body.id || '').slice(0, 128));
      const snap = await ref.get();
      if (!snap.exists) return json({ error: 'not-found' }, 404);
      const o = orderRow(snap.id, snap.data()!);
      const emails = await emailsOf([o.customerUid, o.designerUid]);
      const msgs = await ref.collection('messages').orderBy('at').limit(500).get();
      return json({
        order: { ...o, customerEmail: emails.get(o.customerUid) || '', designerEmail: emails.get(o.designerUid) || '', history: snap.data()!.history || [], rating: snap.data()!.rating || null },
        messages: msgs.docs.map((m) => ({ id: m.id, role: String(m.data().role || ''), text: String(m.data().text || ''), at: Number(m.data().at) || 0 })),
      });
    }

    // How the customer pays the office for a design order (account numbers, transfer office, hours): written
    // here, shown to the customer beside the price and in the unpaid order.
    if (action === 'payment-info-get') {
      const d = (await db.collection('platformSettings').doc('paymentInfo').get()).data() as Record<string, any> | undefined;
      return json({ text: String(d?.text || ''), updatedAt: Number(d?.updatedAt) || 0, updatedBy: String(d?.updatedBy || '') });
    }
    if (action === 'payment-info-set') {
      const text = String(body.text ?? '').trim().slice(0, 1500);
      await db.collection('platformSettings').doc('paymentInfo').set({ text, updatedAt: Date.now(), updatedBy: session.u });
      await audit(session.u, 'payment-info-set');
      return json({ ok: true });
    }

    // The office recounts a designer's finished orders, ratings and badge from their orders.
    if (action === 'designer-recount') {
      const uid = String(body.uid || '').slice(0, 128);
      if (!uid) return json({ error: 'bad-request' }, 400);
      const stats = await recountDesigner(db, uid);
      await audit(session.u, `designer-recount:${uid}`);
      return json({ stats });
    }

    if (action === 'design-order-paid' || action === 'design-order-release' || action === 'design-order-refund') {
      const ref = db.collection('designOrders').doc(String(body.id || '').slice(0, 128));
      const snap = await ref.get();
      if (!snap.exists) return json({ error: 'not-found' }, 404);
      const o = snap.data() as Record<string, any>;
      const now = Date.now();
      const clean = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n);
      const say = (t: string) => ref.collection('messages').add({ role: 'system', text: t, at: now });
      const step = (status: string, extra: Record<string, unknown>) =>
        ref.update({ status, updatedAt: now, history: FieldValue.arrayUnion({ at: now, status, by: `admin:${session.u}` }), ...extra });

      if (action === 'design-order-paid') {
        const method = clean(body.method, 20);
        if (o.status !== 'awaiting_payment') return json({ error: 'bad-state' }, 409);
        if (!METHODS[method]) return json({ error: 'bad-method' }, 400);
        await step('paid', { payment: { at: now, by: session.u, method, receiptNo: clean(body.receiptNo, 40), note: clean(body.note, 300), amount: Number(o.price) || 0 } });
        await say('أكّد المكتب استلام المبلغ. تقدران تتواصلان هنا الآن، والمبلغ محفوظ عند Weelink إلى أن يستلم الزبون التصميم.');
        await mailOrder(auth, String(o.designerUid), 'paid', snap.id);
        await audit(session.u, `design-order-paid:${snap.id}`);
        return json({ status: 'paid' });
      }
      if (action === 'design-order-release') {
        if (!['confirmed', 'disputed'].includes(o.status)) return json({ error: 'bad-state' }, 409);
        await step('paid_out', { payout: { at: now, by: session.u, amount: Number(o.designerShare) || 0, note: clean(body.note, 300) } });
        await say('حوّل المكتب حصة المصمم. اكتمل الطلب.');
        await recountDesigner(db, String(o.designerUid));
        await mailOrder(auth, String(o.designerUid), 'paid_out', snap.id);
        await audit(session.u, `design-order-release:${snap.id}`);
        return json({ status: 'paid_out' });
      }
      const reason = clean(body.reason, 300);
      if (reason.length < 3) return json({ error: 'reason' }, 400);
      if (o.status === 'awaiting_payment') {
        await step('cancelled', { cancelledAt: now, refund: { at: now, by: session.u, amount: 0, reason } });
        await audit(session.u, `design-order-cancel:${snap.id}`);
        return json({ status: 'cancelled' });
      }
      if (!['paid', 'delivered', 'confirmed', 'disputed'].includes(o.status)) return json({ error: 'bad-state' }, 409);
      await step('refunded', { refund: { at: now, by: session.u, amount: Number(o.price) || 0, reason } });
      await say('ردّ المكتب المبلغ للزبون وأُغلق الطلب.');
      await recountDesigner(db, String(o.designerUid));
      await mailOrder(auth, String(o.designerUid), 'refunded', snap.id);
      await mailOrder(auth, String(o.customerUid), 'refunded', snap.id);
      await audit(session.u, `design-order-refund:${snap.id}`);
      return json({ status: 'refunded' });
    }

    // The «Weelink AI» pages (server/gallerySeed.ts): publish them in the gallery, finding their photos on Unsplash.
    if (action === 'gallery-seed-status') return json(await gallerySeedStatus(db));
    if (action === 'gallery-seed') {
      const result = await gallerySeed(db, { budget: Math.min(45, Math.max(1, Number(body.budget) || 40)), overwrite: body.overwrite === true, publish: body.publish === true, only: body.only ? String(body.only).slice(0, 40) : undefined });
      if ('error' in result) return json({ error: result.error }, 400);
      await audit(session.u, `gallery-seed:${result.published.length}`);
      return json(result);
    }

    // ----- the designers' gallery -----
    // platformSettings/pageLaw = { text, version, updatedAt, updatedBy }: the law a designer agrees to
    // when exporting a slide; every save raises the version, and a slide records the version it was
    // exported under. gallerySlides/{id} (written by the designer, status 'pending') is approved or
    // rejected here; the rules let nobody else change its status.
    const SLIDE_STATUSES = ['pending', 'approved', 'rejected'];
    const lawFromDoc = (d: Record<string, any> | undefined) =>
      d ? { text: String(d.text || ''), version: Number(d.version) || 0, updatedAt: Number(d.updatedAt) || 0, updatedBy: String(d.updatedBy || '') } : null;

    if (action === 'page-law-get') {
      return json({ law: lawFromDoc((await db.collection('platformSettings').doc('pageLaw').get()).data()) });
    }

    if (action === 'page-law-set') {
      const text = String(body.text || '').trim();
      if (text.length < 50 || text.length > 20000) return json({ error: 'bad-text' }, 400);
      const ref = db.collection('platformSettings').doc('pageLaw');
      const at = Date.now();
      const version = await db.runTransaction(async (t) => {
        const cur = (await t.get(ref)).data() as { version?: number } | undefined;
        const next = (Number(cur?.version) || 0) + 1;
        t.set(ref, { text, version: next, updatedAt: at, updatedBy: session.u });
        return next;
      });
      await audit(session.u, `page-law-set:v${version}`);
      return json({ law: { text, version, updatedAt: at, updatedBy: session.u } });
    }

    if (action === 'slides-review-list') {
      const status = SLIDE_STATUSES.includes(String(body.status)) ? String(body.status) : 'pending';
      const [snap, pendingCount] = await Promise.all([
        db.collection('gallerySlides').where('status', '==', status).limit(240).get(),
        db.collection('gallerySlides').where('status', '==', 'pending').select('derivedFrom').get(),
      ]);
      // The slides taken from a page follow the page's decision: they are listed only among the approved ones.
      const rows = snap.docs
        .filter((d) => !d.data().derivedFrom || status === 'approved')
        .slice(0, 60)
        .map((d) => {
          const x = d.data();
          return {
            id: d.id, name: String(x.name || ''), category: String(x.category || ''), designerUid: String(x.designerUid || ''),
            designerName: String(x.designerName || ''), status: String(x.status || 'pending'), lawVersion: Number(x.lawVersion) || 0,
            acceptedAt: String(x.acceptedAt || ''), createdAt: x.createdAt?.toMillis?.() || 0, reason: String(x.reason || ''),
            reviewedBy: String(x.reviewedBy || ''), official: x.official === true, editedBy: String(x.editedBy || ''), kind: x.kind === 'page' ? 'page' : 'slide', slide: x.slide || {}, page: x.kind === 'page' ? x.page || null : null,
            elements: Array.isArray(x.elements) ? x.elements : [],
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);
      // A designer's change to a design that is already approved waits here too, beside the new exports.
      const edits = status === 'pending' ? await pendingEditRows(db) : [];
      return json({ rows: [...edits, ...rows], counts: { pending: pendingCount.docs.filter((d) => !d.data().derivedFrom).length + (status === 'pending' ? edits.length : (await pendingEditRows(db)).length) } });
    }

    if (action === 'slide-review') {
      const id = String(body.id || '').slice(0, 128);
      const decision = String(body.decision || '');
      const reason = String(body.reason || '').trim().slice(0, 500);
      if (!id || !['approve', 'reject'].includes(decision)) return json({ error: 'bad-request' }, 400);
      if (decision === 'reject' && reason.length < 3) return json({ error: 'reason' }, 400);
      const ref = db.collection('gallerySlides').doc(id);
      const snap = await ref.get();
      if (!snap.exists) return json({ error: 'not-found' }, 404);
      const ids = snap.data()?.kind === 'page' ? PAGE_CATEGORY_IDS : SLIDE_CATEGORY_IDS;
      if (decision === 'approve' && !ids.includes(String(snap.data()?.category))) return json({ error: 'bad-category' }, 400);
      const status = decision === 'approve' ? 'approved' : 'rejected';
      const cur = snap.data() as { likes?: number; dislikes?: number } | undefined;
      // An approved slide starts its counters at zero (a withdrawn one that comes back keeps them);
      // «جديد» in the gallery counts from the approval.
      await ref.update({
        status, reason: decision === 'reject' ? reason : '', reviewedBy: session.u, reviewedAt: Date.now(),
        ...(decision === 'approve' ? { approvedAt: Date.now(), likes: Number(cur?.likes) || 0, dislikes: Number(cur?.dislikes) || 0 } : {}),
      });
      // The slides taken from this page (Weelink's own pages) get the same decision.
      const derived = await db.collection('gallerySlides').where('derivedFrom', '==', id).get();
      for (const d of derived.docs) {
        await d.ref.update({
          status, reason: decision === 'reject' ? reason : '', reviewedBy: session.u, reviewedAt: Date.now(),
          ...(decision === 'approve' ? { approvedAt: d.data().approvedAt || Date.now() } : {}),
        });
      }
      await audit(session.u, `slide-review:${id}:${status}`);
      return json({ status });
    }

    // The admin opens, edits, renames and deletes any design in the gallery (server/galleryEdit.ts).
    if (action === 'gallery-doc') {
      const r = await loadForEdit(db, String(body.id || '').slice(0, 128), { admin: true });
      return 'error' in r ? json({ error: 'not-found' }, 404) : json(r);
    }
    if (action === 'gallery-doc-save') {
      const id = String(body.id || '').slice(0, 128);
      const r = await adminSave(db, id, { page: body.page as any, elements: body.elements as any, name: body.name, category: body.category, designerName: body.designerName }, session.u);
      if ('error' in r) return json({ error: r.error, kinds: (r as any).kinds }, r.error === 'not_found' ? 404 : 400);
      await audit(session.u, `gallery-doc-save:${id}`);
      return json({ ok: true });
    }
    if (action === 'gallery-doc-delete') {
      const id = String(body.id || '').slice(0, 128);
      const r = await deleteDesign(db, id);
      if ('error' in r) return json({ error: 'not-found' }, 404);
      await audit(session.u, `gallery-doc-delete:${id}`);
      return json({ ok: true });
    }
    if (action === 'slide-edit-review') {
      const id = String(body.id || '').slice(0, 128);
      const decision = String(body.decision || '');
      const reason = String(body.reason || '').trim().slice(0, 500);
      if (!id || !['approve', 'reject'].includes(decision)) return json({ error: 'bad-request' }, 400);
      if (decision === 'reject' && reason.length < 3) return json({ error: 'reason' }, 400);
      const r = await reviewEdit(db, id, decision as 'approve' | 'reject', reason, session.u);
      if ('error' in r) return json({ error: 'not-found' }, 404);
      await audit(session.u, `slide-edit-review:${id}:${decision}`);
      return json({ ok: true });
    }

    // ----- tasks (the workflow board) -----
    // platform_tasks/{id} = { title, instructions, type, uid?, subscriber?, assignee, status, createdBy, createdAt,
    // updatedAt } with replies in platform_tasks/{id}/replies. The owner creates and hands them out; the
    // assignee changes the status and replies.
    const owner = admin.role === 'owner';
    const taskFromDoc = (id: string, d: Record<string, any>) => ({
      id, title: String(d.title || ''), instructions: String(d.instructions || ''), type: TASK_TYPES[d.type] ? String(d.type) : 'other',
      uid: String(d.uid || ''), subscriber: String(d.subscriber || ''), assignee: String(d.assignee || ''), status: TASK_STATUSES.includes(d.status) ? String(d.status) : 'new',
      createdAt: Number(d.createdAt) || 0, updatedAt: Number(d.updatedAt) || 0,
    });
    const myTask = (t: { assignee: string }) => owner || t.assignee === session.u;
    const loadTask = async (id: unknown) => {
      const snap = await db.collection('platform_tasks').doc(String(id || '').slice(0, 128)).get();
      if (!snap.exists) return null;
      const t = taskFromDoc(snap.id, snap.data()!);
      return myTask(t) ? { ref: snap.ref, t } : null;
    };
    const adminName = async (username: string) => (username ? ((await db.collection('platform_admins').doc(username).get()).data() as { name?: string } | undefined)?.name || username : '');
    const subscriberEvent = (t: { uid: string }, text: string) =>
      t.uid ? db.collection('platform_subscribers').doc(t.uid).collection('events').add({ at: Date.now(), admin: session.u, type: 'task', text }) : Promise.resolve();

    if (action === 'tasks') {
      const status = TASK_STATUSES.includes(String(body.status)) ? String(body.status) : '';
      const q = String(body.q || '').trim().toLowerCase().slice(0, 100);
      // The owner may look at one admin's tasks (or all); «مهامي» (mine) and everyone else see only their own.
      const who = owner && body.mine !== true ? cleanUsername(body.assignee) : session.u;
      const base = db.collection('platform_tasks');
      const snap = await (who ? base.where('assignee', '==', who) : base).limit(1000).get();
      const all = snap.docs.map((d) => taskFromDoc(d.id, d.data()));
      const rows = all
        .filter((t) => (!status || t.status === status) && (!q || [t.title, t.subscriber, t.instructions].some((v) => v.toLowerCase().includes(q))))
        .sort((a, b) => (a.status === 'done' ? 1 : 0) - (b.status === 'done' ? 1 : 0) || b.updatedAt - a.updatedAt);
      const names = new Map(((await db.collection('platform_admins').get()).docs).map((d) => [d.id, String((d.data() as { name?: string }).name || d.id)]));
      return json({
        rows: rows.slice(0, 300).map((t) => ({ ...t, assigneeName: names.get(t.assignee) || t.assignee })),
        matched: rows.length,
        counts: { new: all.filter((t) => t.status === 'new').length, doing: all.filter((t) => t.status === 'doing').length, done: all.filter((t) => t.status === 'done').length },
        types: TASK_TYPES,
      });
    }

    if (action === 'task') {
      const found = await loadTask(body.id);
      if (!found) return json({ error: 'not-found' }, 404);
      const replies = await found.ref.collection('replies').get();
      return json({
        task: { ...found.t, assigneeName: await adminName(found.t.assignee) },
        replies: replies.docs.map((d) => { const r = d.data() as { at?: number; by?: string; byName?: string; text?: string }; return { id: d.id, at: r.at || 0, by: r.by || '', byName: r.byName || r.by || '', text: r.text || '' }; }).sort((a, b) => a.at - b.at),
      });
    }

    if (action === 'task-create' || action === 'task-update') {
      const creating = action === 'task-create';
      const cur = creating ? null : await loadTask(body.id);
      if (!creating && !cur) return json({ error: 'not-found' }, 404);
      const patch: Record<string, unknown> = {};
      if (creating || body.title !== undefined) {
        const title = String(body.title || '').trim().slice(0, 120);
        if (title.length < 3) return json({ error: 'bad-title' }, 400);
        patch.title = title;
      }
      if (creating || body.instructions !== undefined) patch.instructions = String(body.instructions || '').trim().slice(0, 2000);
      if (creating || body.type !== undefined) {
        const type = String(body.type || 'other');
        if (!TASK_TYPES[type]) return json({ error: 'bad-type' }, 400);
        patch.type = type;
      }
      if (creating || body.assignee !== undefined) {
        const who = cleanUsername(body.assignee);
        if (who) {
          const row = (await db.collection('platform_admins').doc(who).get()).data() as { status?: string } | undefined;
          if (!row || row.status !== 'active') return json({ error: 'bad-assignee' }, 400);
        }
        patch.assignee = who;
      }
      if (creating && body.uid) {
        // The subscriber is given by email (what the team has at hand) or by uid.
        const given = String(body.uid).trim().slice(0, 128);
        const sub = given.includes('@') ? await auth.getUserByEmail(given).catch(() => null) : await userOrNull(given);
        if (!sub) return json({ error: 'no-subscriber' }, 404);
        patch.uid = sub.uid;
        patch.subscriber = sub.displayName || sub.email || sub.uid;
      }
      const now = Date.now();
      if (creating) {
        const ref = db.collection('platform_tasks').doc();
        await ref.set({ status: 'new', uid: '', subscriber: '', ...patch, createdBy: session.u, createdAt: now, updatedAt: now });
        const t = taskFromDoc(ref.id, { ...patch, status: 'new', createdAt: now, updatedAt: now });
        await subscriberEvent(t, `مهمة جديدة: ${t.title} (${TASK_TYPES[t.type]}) → ${await adminName(t.assignee) || 'بدون مسؤول'}`);
        await audit(session.u, `task-create:${ref.id}`);
        return json({ id: ref.id });
      }
      if (!Object.keys(patch).length) return json({ error: 'bad-request' }, 400);
      await cur!.ref.update({ ...patch, updatedAt: now });
      await audit(session.u, `task-update:${cur!.t.id}`);
      return json({ ok: true });
    }

    if (action === 'task-status' || action === 'task-reply') {
      const cur = await loadTask(body.id);
      if (!cur) return json({ error: 'not-found' }, 404);
      const now = Date.now();
      if (action === 'task-status') {
        const status = String(body.status || '');
        if (!TASK_STATUSES.includes(status)) return json({ error: 'bad-status' }, 400);
        if (status !== cur.t.status) {
          await cur.ref.update({ status, updatedAt: now });
          await subscriberEvent(cur.t, `المهمة «${cur.t.title}»: ${status === 'done' ? 'انتهت' : status === 'doing' ? 'قيد العمل' : 'جديدة'}`);
        }
        return json({ status });
      }
      const text = String(body.text || '').trim().slice(0, 1000);
      if (!text) return json({ error: 'bad-request' }, 400);
      await cur.ref.collection('replies').add({ at: now, by: session.u, byName: admin.name, text });
      await cur.ref.update({ updatedAt: now });
      return json({ ok: true });
    }

    // ----- the team chat board -----
    // platform_chat/{id} = { at, by, byName, text, uid?, subscriber? }: one channel for all admins. A message may
    // be about a subscriber (email or uid); it then also lands in that subscriber's history as a note.
    if (action === 'chat') {
      const after = Number(body.after) || 0;
      const about = String(body.uid || '').trim().slice(0, 128);
      const col = db.collection('platform_chat');
      const snap = await (about ? col.where('uid', '==', about).limit(200) : after ? col.where('at', '>', after).limit(200) : col.orderBy('at', 'desc').limit(100)).get();
      const rows = snap.docs
        .map((d) => { const m = d.data() as Record<string, any>; return { id: d.id, at: Number(m.at) || 0, by: String(m.by || ''), byName: String(m.byName || m.by || ''), text: String(m.text || ''), uid: String(m.uid || ''), subscriber: String(m.subscriber || '') }; })
        .filter((m) => m.at > after)
        .sort((a, b) => a.at - b.at);
      return json({ rows, me: session.u });
    }

    if (action === 'chat-send') {
      const text = String(body.text || '').trim().slice(0, 1000);
      if (!text) return json({ error: 'bad-request' }, 400);
      let uid = '', subscriber = '';
      const given = String(body.uid || '').trim().slice(0, 128);
      if (given) {
        const sub = given.includes('@') ? await auth.getUserByEmail(given).catch(() => null) : await userOrNull(given);
        if (!sub) return json({ error: 'no-subscriber' }, 404);
        uid = sub.uid;
        subscriber = sub.displayName || sub.email || sub.uid;
      }
      const at = Date.now();
      const ref = db.collection('platform_chat').doc();
      await ref.set({ at, by: session.u, byName: admin.name, text, uid, subscriber });
      if (uid) await db.collection('platform_subscribers').doc(uid).collection('events').add({ at, admin: session.u, type: 'note', text: `من لوحة التواصل: ${text}` });
      return json({ id: ref.id, at });
    }

    if (action === 'tokens-adjust') {
      const delta = Math.trunc(Number(body.delta));
      const reason = String(body.reason || '').trim().slice(0, 300);
      if (!delta || Math.abs(delta) > 100_000_000) return json({ error: 'bad-amount' }, 400);
      if (reason.length < 3) return json({ error: 'reason' }, 400);
      if (!uid || !(await userOrNull(uid))) return json({ error: 'not-found' }, 404);
      const ref = db.collection('platform_subscribers').doc(uid);
      // A balance never goes below zero; an account that never used Wee AI starts from the free amount.
      const balance = await db.runTransaction(async (t) => {
        const cur = (await t.get(ref)).data() as { tokens?: { balance?: number } } | undefined;
        const start = typeof cur?.tokens?.balance === 'number' ? cur.tokens.balance : FREE_TOKENS;
        const next = Math.max(0, start + delta);
        t.set(ref, { tokens: { balance: next } }, { merge: true });
        return next;
      });
      await ref.collection('events').add({ at: Date.now(), admin: session.u, type: 'tokens', text: `${delta > 0 ? 'شحن' : 'خصم'} ${Math.abs(delta).toLocaleString('en')} توكن · ${reason} · الرصيد ${balance.toLocaleString('en')}` });
      await audit(session.u, `tokens-adjust:${uid}:${delta}`);
      return json({ balance });
    }

    if (action === 'set-prices') {
      const pin = Number(body.in), pout = Number(body.out);
      if (!(pin >= 0 && pin < 1000 && pout >= 0 && pout < 1000)) return json({ error: 'bad-amount' }, 400);
      await db.collection('platform_settings').doc('ai_prices').set({ in: pin, out: pout });
      await audit(session.u, 'set-prices');
      return json({ prices: { in: pin, out: pout } });
    }

    if (action === 'tokens-overview') {
      const month = /^\d{4}-\d{2}$/.test(String(body.month)) ? String(body.month) : new Date().toISOString().slice(0, 7);
      const [y, m] = month.split('-').map(Number);
      const from = Date.UTC(y, m - 1, 1), to = Date.UTC(y, m, 1);
      const [callsSnap, mailsSnap, prices] = await Promise.all([
        db.collection('platform_ai_calls').where('at', '>=', from).where('at', '<', to).limit(20000).get(),
        db.collection('platform_payments').where('sentAt', '>=', from).where('sentAt', '<', to).select().get(),
        getPrices(db),
      ]);
      const totals = { calls: 0, failed: 0, tokens: 0, input: 0, output: 0, costUsd: 0 };
      const kinds: Record<string, { name: string; calls: number; tokens: number; costUsd: number }> = {};
      const perUser = new Map<string, { calls: number; tokens: number; costUsd: number }>();
      callsSnap.forEach((d) => {
        const c = callFromDoc(d.data());
        totals.calls++;
        if (!c.ok) totals.failed++;
        totals.tokens += c.tokens; totals.input += c.input; totals.output += c.output; totals.costUsd += c.costUsd;
        const k = (kinds[c.kind] ||= { name: KIND_NAMES[c.kind] || c.kind, calls: 0, tokens: 0, costUsd: 0 });
        k.calls++; k.tokens += c.tokens; k.costUsd += c.costUsd;
        const uidOfCall = String(d.data().uid || '');
        const u = perUser.get(uidOfCall) || { calls: 0, tokens: 0, costUsd: 0 };
        u.calls++; u.tokens += c.tokens; u.costUsd += c.costUsd;
        perUser.set(uidOfCall, u);
      });
      const top = [...perUser.entries()].sort((a, b) => b[1].costUsd - a[1].costUsd || b[1].tokens - a[1].tokens).slice(0, 10);
      const users = top.length ? await auth.getUsers(top.map(([u]) => ({ uid: u }))).catch(() => null) : null;
      const nameOf = new Map((users?.users || []).map((u) => [u.uid, u.displayName || u.email || u.uid]));
      return json({
        month, totals, prices,
        kinds: Object.values(kinds).sort((a, b) => b.costUsd - a.costUsd),
        top: top.map(([u, v]) => ({ uid: u, name: nameOf.get(u) || u, ...v })),
        // Invoice emails sent this month: an estimate, the email service gives no exact figure.
        emails: mailsSnap.size,
        truncated: callsSnap.size >= 20000,
      });
    }

    // ----- phase 6: accounts and dashboard -----
    if (action === 'dashboard') {
      const now = Date.now();
      const months = lastMonths(12, now);
      const from = Date.parse(`${months[0]}-01T00:00:00Z`);
      const [users, subSnap, paySnap, reportsSnap] = await Promise.all([
        listAllUsers(auth),
        db.collection('platform_subscribers').select('status', 'subscription', 'tokens').get(),
        db.collection('platform_payments').orderBy('paidAt', 'desc').limit(5000).get(),
        db.collection('ratingReports').select().get(),
      ]);
      const byUid = new Map(users.map((u) => [u.uid, u]));
      const nameOf = (u: string) => byUid.get(u)?.displayName || byUid.get(u)?.email || u;

      const chart = months.map((m) => ({ month: m, newUsers: 0, revenue: 0, payments: 0 }));
      const slot = new Map(chart.map((c) => [c.month, c]));
      users.forEach((u) => { const c = slot.get(new Date(createdOf(u)).toISOString().slice(0, 7)); if (c) c.newUsers++; });
      const pays = paySnap.docs.map((d) => payFromDoc(d.id, d.data()));
      pays.forEach((p) => { const c = p.paidAt >= from ? slot.get(new Date(p.paidAt).toISOString().slice(0, 7)) : undefined; if (c) { c.revenue += p.amount; c.payments++; } });

      // The last payment of every subscriber: what they are likely to pay again.
      const lastPay = new Map<string, number>();
      pays.forEach((p) => { if (!lastPay.has(p.uid)) lastPay.set(p.uid, p.amount); });

      const totals = { users: users.length, paidActive: 0, expiring30: 0, overdue: 0, frozen: 0, cancelled: 0, due30: 0, tokensUsedAll: 0 };
      const expiring: { uid: string; name: string; email: string; planName: string; freezeAt: number; left: number; amount: number }[] = [];
      const usage: { uid: string; name: string; used: number; balance: number }[] = [];
      subSnap.forEach((d) => {
        const x = d.data() as { status?: string; subscription?: { planName?: string; endsAt?: number; freezeAt?: number }; tokens?: { used?: number; balance?: number } };
        const status = x.status || 'active';
        if (status === 'frozen') totals.frozen++;
        if (status === 'cancelled') totals.cancelled++;
        if (x.tokens?.used) { totals.tokensUsedAll += x.tokens.used; usage.push({ uid: d.id, name: nameOf(d.id), used: x.tokens.used, balance: Number(x.tokens.balance) || 0 }); }
        const until = Number(x.subscription?.freezeAt || x.subscription?.endsAt) || 0;
        if (!until || status !== 'active') return;
        const left = until - now;
        if (left > 0) totals.paidActive++;
        if (left <= 30 * DAY) {
          if (left > 0) totals.expiring30++; else totals.overdue++;
          const amount = lastPay.get(d.id) || 0;
          totals.due30 += amount;
          expiring.push({ uid: d.id, name: byUid.get(d.id)?.displayName || '', email: byUid.get(d.id)?.email || '', planName: String(x.subscription?.planName || ''), freezeAt: until, left, amount });
        }
      });
      expiring.sort((a, b) => a.left - b.left);
      usage.sort((a, b) => b.used - a.used);

      // Renewal: of the subscriptions whose period ended in the last 90 days, how many were followed by a payment from the same subscriber.
      const matured = pays.filter((p) => p.coversTo <= now && p.coversTo >= now - 90 * DAY);
      const renewed = matured.filter((p) => pays.some((q) => q.uid === p.uid && q.paidAt > p.paidAt && q.coversFrom >= p.coversTo - 1000)).length;

      const thisMonth = chart[chart.length - 1];
      return json({
        totals: { ...totals, newThisMonth: thisMonth.newUsers, revenueThisMonth: thisMonth.revenue, revenue12: chart.reduce((n, c) => n + c.revenue, 0), reportsOpen: reportsSnap.size },
        chart,
        renewal: { matured: matured.length, renewed, rate: matured.length ? renewed / matured.length : null, days: 90 },
        expiring: expiring.slice(0, 50),
        top: usage.slice(0, 10),
        truncated: paySnap.size >= 5000 || users.length >= MAX_USERS,
      });
    }

    if (action === 'export') {
      const kind = String(body.kind || '');
      if (kind === 'payments') {
        const snap = await db.collection('platform_payments').orderBy('paidAt', 'desc').limit(5000).get();
        const rows = snap.docs.map((d) => payFromDoc(d.id, d.data()));
        const csv = toCsv(['رقم الفاتورة', 'التاريخ', 'المشترك', 'الإيميل', 'الباقة', 'الفترة', 'المبلغ (ل.س)', 'الطريقة', 'رقم الإيصال', 'من', 'إلى', 'سجّلها', 'ملاحظة'],
          rows.map((p) => [p.invoiceNo, isoDay(p.paidAt), p.name, p.email, p.planName, p.period === 'yearly' ? 'سنوي' : 'شهري', p.amount, METHODS[p.method] || p.method, p.receiptNo, isoDay(p.coversFrom), isoDay(p.coversTo), p.by, p.note]));
        await audit(session.u, 'export:payments');
        return json({ filename: `weelink-payments-${isoDay(Date.now())}.csv`, csv, rows: rows.length });
      }
      if (kind === 'subscribers') {
        const [users, subSnap] = await Promise.all([listAllUsers(auth), db.collection('platform_subscribers').select('status', 'subscription', 'tokens').get()]);
        const subs = new Map(subSnap.docs.map((d) => [d.id, d.data() as Record<string, any>]));
        const rows = users.map((u) => {
          const s = subs.get(u.uid);
          const seen = Math.max(Date.parse(u.metadata.lastRefreshTime || '') || 0, Date.parse(u.metadata.lastSignInTime || '') || 0);
          return [u.uid, u.displayName || '', u.email || '', u.phoneNumber || '', u.emailVerified ? 'نعم' : 'لا', isoDay(createdOf(u)), isoDay(seen), s?.status || 'active', s?.subscription?.planName || '', isoDay(Number(s?.subscription?.endsAt) || 0), isoDay(Number(s?.subscription?.freezeAt) || 0), s?.tokens?.balance ?? '', s?.tokens?.used ?? ''];
        });
        const csv = toCsv(['المعرّف', 'الاسم', 'الإيميل', 'الهاتف', 'إيميل مؤكَّد', 'تاريخ الاشتراك', 'آخر نشاط', 'الحالة', 'الباقة', 'ينتهي', 'التجميد التلقائي', 'رصيد التوكنز', 'المستهلك'], rows);
        await audit(session.u, 'export:subscribers');
        return json({ filename: `weelink-subscribers-${isoDay(Date.now())}.csv`, csv, rows: rows.length });
      }
      return json({ error: 'bad-request' }, 400);
    }

    // ----- phase 6: the full backup (owner only): one JSON file of the platform's own records; no passwords or admin accounts -----
    if (action === 'backup') {
      const dump = async (name: string) => (await db.collection(name).limit(10000).get()).docs.map((d) => ({ id: d.id, ...d.data() }));
      const [subscribers, payments, tasks, coupons, announcements, company, prices, counter] = await Promise.all([
        dump('platform_subscribers'), dump('platform_payments'), dump('platform_tasks'), dump('platform_coupons'), dump('platform_announcements'),
        db.collection('platform_settings').doc('company').get(), db.collection('platform_settings').doc('ai_prices').get(), db.collection('platform_counters').doc('invoice').get(),
      ]);
      const file = { exportedAt: new Date().toISOString(), by: session.u, subscribers, payments, tasks, coupons, announcements, settings: { company: company.data() || null, aiPrices: prices.data() || null, invoiceCounter: counter.data() || null } };
      await audit(session.u, 'backup');
      return json({ filename: `weelink-backup-${isoDay(Date.now())}.json`, json: JSON.stringify(file), counts: { subscribers: subscribers.length, payments: payments.length, tasks: tasks.length, coupons: coupons.length } });
    }

    // ----- phase 6: rating reports (the content reviewer, and the owner) -----
    if (action === 'reports') {
      const snap = await db.collection('ratingReports').limit(200).get();
      const rows = snap.docs.map((d) => {
        const x = d.data() as Record<string, any>;
        return { id: d.id, owner: String(x.owner || ''), project: String(x.project || ''), stars: Number(x.stars) || 0, text: String(x.text || ''), rater: String(x.name || ''), reason: String(x.reason || ''), by: String(x.by || ''), at: String(x.at || '') };
      }).sort((a, b) => b.at.localeCompare(a.at));
      const ids = [...new Set(rows.map((r) => r.by).filter(Boolean))].slice(0, 100);
      const found = ids.length ? await auth.getUsers(ids.map((u) => ({ uid: u }))).catch(() => null) : null;
      const names = new Map((found?.users || []).map((u) => [u.uid, u.displayName || u.email || u.uid]));
      return json({ rows: rows.map((r) => ({ ...r, reporter: names.get(r.by) || '' })) });
    }

    if (action === 'report-decide') {
      const id = String(body.id || '').slice(0, 300);
      const decision = String(body.decision || '');
      const note = String(body.note || '').trim().slice(0, 300);
      if (!['keep', 'remove'].includes(decision)) return json({ error: 'bad-request' }, 400);
      const reportRef = db.collection('ratingReports').doc(id);
      const rep = (await reportRef.get()).data() as { owner?: string; id?: string; project?: string; name?: string } | undefined;
      if (!rep?.owner || !rep.id) return json({ error: 'not-found' }, 404);
      const itemRef = db.collection('ratings').doc(rep.owner).collection('items').doc(rep.id);
      if (decision === 'keep') {
        await itemRef.set({ reported: false }, { merge: true }).catch(() => undefined);
      } else {
        // Removing a rating also takes it out of the stars under the page's name.
        const summaryRef = db.collection('ratingSummary').doc(`${rep.owner}_${rep.project}`);
        await db.runTransaction(async (t) => {
          const item = (await t.get(itemRef)).data() as { stars?: number } | undefined;
          if (!item) return;
          const stars = Number(item.stars) || 0;
          t.delete(itemRef);
          t.set(summaryRef, { count: FieldValue.increment(-1), sum: FieldValue.increment(-stars), [`s${stars}`]: FieldValue.increment(-1) }, { merge: true });
        });
        await db.collection('ratingPrivate').doc(`${rep.owner}_${rep.id}`).delete().catch(() => undefined);
        if (await userOrNull(rep.owner)) await db.collection('platform_subscribers').doc(rep.owner).collection('events').add({ at: Date.now(), admin: session.u, type: 'note', text: `حُذف تقييم من «${rep.name || ''}» بعد بلاغ${note ? ` · ${note}` : ''}` });
      }
      await reportRef.delete();
      await audit(session.u, `report-decide:${decision}:${id}`);
      return json({ ok: true });
    }

    // ----- phase 6: system health (owner only; only yes/no and counts, never a setting's value) -----
    if (action === 'health') {
      const now = Date.now();
      const [callsSnap, cronSnap, failSnap] = await Promise.all([
        db.collection('platform_ai_calls').where('at', '>=', now - DAY).limit(5000).get(),
        db.collection('platform_audit').where('ip', '==', 'cron').limit(60).get(),
        db.collection('platform_audit').where('ok', '==', false).limit(200).get(),
      ]);
      const calls = callsSnap.docs.map((d) => callFromDoc(d.data()));
      const reasons: Record<string, number> = {};
      calls.filter((c) => !c.ok).forEach((c) => { reasons[c.reason || 'failed'] = (reasons[c.reason || 'failed'] || 0) + 1; });
      const daily = cronSnap.docs.map((d) => {
        const x = d.data() as { at?: unknown; action?: string };
        let out: Record<string, number> = {};
        try { out = JSON.parse(String(x.action || '').replace(/^daily:/, '')); } catch { /* an old or odd row */ }
        return { at: tsOf(x.at), checked: out.checked || 0, frozen: out.frozen || 0, reminded: out.reminded || 0, skipped: out.skipped || 0, failed: out.failed || 0 };
      }).sort((a, b) => b.at - a.at).slice(0, 7);
      const fails = failSnap.docs.map((d) => d.data() as { at?: unknown; admin?: string; action?: string }).map((x) => ({ at: tsOf(x.at), admin: String(x.admin || ''), action: String(x.action || '') }));
      const loginFails = fails.filter((f) => f.action === 'login' && f.at >= now - DAY).length;
      const mailFails = fails.filter((f) => /^(invoice-send|announce)/.test(f.action)).sort((a, b) => b.at - a.at).slice(0, 10);
      return json({
        config: { serviceAccount: !!serviceAccount(), resend: !!process.env.RESEND_API_KEY, emailFrom: !!process.env.EMAIL_FROM, cron: !!process.env.CRON_SECRET, gemini: !!process.env.GEMINI_API_KEY },
        ai: { calls: calls.length, failed: calls.filter((c) => !c.ok).length, reasons, quotaHit: Object.keys(reasons).some((r) => r.includes('429')), lastFailures: calls.filter((c) => !c.ok).sort((a, b) => b.at - a.at).slice(0, 10).map((c) => ({ at: c.at, kind: KIND_NAMES[c.kind] || c.kind, reason: c.reason })) },
        daily, mailFails, loginFails,
      });
    }

    // ----- phase 6: coupons -----
    if (action === 'coupons') {
      const snap = await db.collection('platform_coupons').limit(300).get();
      return json({ rows: snap.docs.map((d) => couponFromDoc(d.id, d.data())).sort((a, b) => b.createdAt - a.createdAt), kinds: COUPON_KINDS });
    }

    if (action === 'coupon-save') {
      const code = cleanCode(body.code);
      const kind = String(body.kind || '');
      const value = Math.trunc(Number(body.value));
      const maxUses = Math.max(0, Math.trunc(Number(body.maxUses) || 0));
      const plan = String(body.plan || 'page-pro');
      if (code.length < 3) return json({ error: 'bad-code' }, 400);
      if (!COUPON_KINDS[kind]) return json({ error: 'bad-kind' }, 400);
      if (!(value >= 1) || (kind === 'discount' && value > 100) || (kind === 'trial' && value > 365) || value > 100_000_000) return json({ error: 'bad-value' }, 400);
      if (!/^(page|restaurant|shop|cars)-(pro|30|60)$/.test(plan)) return json({ error: 'bad-plan' }, 400);
      let expiresAt = 0;
      if (body.expires) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.expires))) return json({ error: 'bad-date' }, 400);
        expiresAt = Date.parse(`${body.expires}T23:59:59+03:00`);
      }
      const ref = db.collection('platform_coupons').doc(code);
      const old = (await ref.get()).data();
      await ref.set({ kind, value, plan, planName: String(body.planName || '').trim().slice(0, 60) || 'تجربة مجانية', maxUses, expiresAt, note: String(body.note || '').trim().slice(0, 200), active: old ? old.active !== false : true, used: Number(old?.used) || 0, createdAt: Number(old?.createdAt) || Date.now(), by: String(old?.by || session.u) });
      await audit(session.u, `coupon-save:${code}`);
      return json({ code });
    }

    if (action === 'coupon-toggle') {
      const code = cleanCode(body.code);
      const ref = db.collection('platform_coupons').doc(code || 'x');
      if (!(await ref.get()).exists) return json({ error: 'not-found' }, 404);
      await ref.set({ active: body.active !== false }, { merge: true });
      await audit(session.u, `coupon-toggle:${code}`);
      return json({ ok: true });
    }

    if (action === 'coupon-apply') {
      const code = cleanCode(body.code);
      const user = uid ? await userOrNull(uid) : null;
      if (!user) return json({ error: 'not-found' }, 404);
      const peek = (await db.collection('platform_coupons').doc(code || 'x').get()).data();
      if (!peek) return json({ error: 'coupon-not-found' }, 404);
      if (peek.kind === 'discount') return json({ error: 'coupon-discount' }, 400);
      const r = await redeemCoupon(db, code, uid);
      if ('error' in r) return json({ error: `coupon-${r.error}` }, 400);
      const c = r.coupon;
      const subRef = db.collection('platform_subscribers').doc(uid);
      const now = Date.now();
      let text = '';
      if (c.kind === 'tokens') {
        const balance = await db.runTransaction(async (t) => {
          const cur = (await t.get(subRef)).data() as { tokens?: { balance?: number } } | undefined;
          const next = (typeof cur?.tokens?.balance === 'number' ? cur.tokens.balance : FREE_TOKENS) + c.value;
          t.set(subRef, { tokens: { balance: next } }, { merge: true });
          return next;
        });
        text = `كوبون ${code}: +${c.value.toLocaleString('en')} توكن · الرصيد ${balance.toLocaleString('en')}`;
      } else {
        // A trial runs from today, or after a subscription that is still running (which keeps its own plan).
        const cur = (await subRef.get()).data() as { status?: string; autoFrozen?: boolean; subscription?: { endsAt?: number } } | undefined;
        const running = !!cur?.subscription?.endsAt && cur.subscription.endsAt > now;
        const endsAt = (running ? cur!.subscription!.endsAt! : now) + c.value * DAY;
        const granted = Math.round((PAID_TOKENS * c.value) / 30);
        await subRef.set({
          subscription: running ? { endsAt, freezeAt: endsAt, notified: FieldValue.delete() } : { plan: c.plan, planName: c.planName, period: 'monthly', endsAt, freezeAt: endsAt, notified: FieldValue.delete(), trial: true },
          tokens: { balance: FieldValue.increment(granted) },
        }, { merge: true });
        if (cur?.status === 'frozen' && cur.autoFrozen) await applyStatus(fb, uid, 'active', `كوبون ${code}`, session.u, false);
        text = `كوبون ${code}: تجربة ${c.value} يوم · حتى ${fmtDate(endsAt)} · +${granted.toLocaleString('en')} توكن`;
      }
      await subRef.collection('events').add({ at: now, admin: session.u, type: 'note', text });
      await audit(session.u, `coupon-apply:${code}:${uid}`);
      return json({ ok: true, text });
    }

    // ----- phase 6: announcement emails to the subscribers (owner only) -----
    const audienceOf = async (audience: string) => {
      const [users, subSnap] = await Promise.all([listAllUsers(auth), db.collection('platform_subscribers').select('status', 'subscription').get()]);
      const subs = new Map(subSnap.docs.map((d) => [d.id, d.data() as { status?: string; subscription?: { endsAt?: number; freezeAt?: number } }]));
      const now = Date.now();
      return users.filter((u) => {
        if (!u.email || u.disabled || !u.emailVerified) return false;
        const s = subs.get(u.uid);
        if ((s?.status || 'active') !== 'active') return false;
        const until = Number(s?.subscription?.freezeAt || s?.subscription?.endsAt) || 0;
        const running = until > now;
        return audience === 'paid' ? running : audience === 'free' ? !running : audience === 'expiring' ? running && until - now <= 14 * DAY : true;
      }).map((u) => u.email as string);
    };

    if (action === 'announce-preview') {
      const audience = AUDIENCES[String(body.audience)] ? String(body.audience) : 'all';
      const history = (await db.collection('platform_announcements').limit(30).get()).docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, any>) })) as { id: string; at?: number; subject?: string; audience?: string; count?: number; sent?: number; failed?: number; by?: string }[];
      return json({ count: (await audienceOf(audience)).length, audiences: AUDIENCES, max: MAX_ANNOUNCE, history: history.sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 10) });
    }

    if (action === 'announce') {
      const audience = AUDIENCES[String(body.audience)] ? String(body.audience) : 'all';
      const subject = String(body.subject || '').trim().slice(0, 120);
      const text = String(body.text || '').trim().slice(0, 4000);
      const testTo = String(body.testTo || '').trim().slice(0, 200);
      if (subject.length < 3 || text.length < 10) return json({ error: 'short' }, 400);
      if (!process.env.EMAIL_FROM || !process.env.RESEND_API_KEY) return json({ error: 'email-not-configured' }, 503);
      const html = announceHtml(subject, text);
      if (testTo) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testTo)) return json({ error: 'bad-email' }, 400);
        const sent = await sendMail(testTo, subject, html);
        if (sent.result === 'failed') return json({ error: 'refused', detail: String(sent.detail || '').slice(0, 200) }, 502);
        return json({ test: true, sent: 1 });
      }
      const list = await audienceOf(audience);
      if (!list.length) return json({ error: 'nobody' }, 400);
      if (list.length > MAX_ANNOUNCE) return json({ error: 'too-many', count: list.length, max: MAX_ANNOUNCE }, 400);
      // The count the owner confirmed must still be right, so a list that grew meanwhile is not mailed unseen.
      if (Number(body.confirm) !== list.length) return json({ error: 'count-changed', count: list.length }, 409);
      const resend = new Resend(process.env.RESEND_API_KEY);
      let sent = 0, failed = 0;
      for (let i = 0; i < list.length; i += 100) {
        const chunk = list.slice(i, i + 100);
        try {
          const { error } = await resend.batch.send(chunk.map((to) => ({ from: process.env.EMAIL_FROM as string, to, subject, html })));
          if (error) failed += chunk.length; else sent += chunk.length;
        } catch {
          failed += chunk.length;
        }
      }
      await db.collection('platform_announcements').add({ at: Date.now(), by: session.u, audience, subject, count: list.length, sent, failed });
      await audit(session.u, `announce:${audience}:${sent}/${list.length}`, failed === 0);
      return json({ count: list.length, sent, failed });
    }

    if (action === 'add-note') {
      const text = String(body.text || '').trim().slice(0, 1000);
      if (!uid || !text) return json({ error: 'bad-request' }, 400);
      if (!(await userOrNull(uid))) return json({ error: 'not-found' }, 404);
      await db.collection('platform_subscribers').doc(uid).collection('events').add({ at: Date.now(), admin: session.u, type: 'note', text });
      return json({ ok: true });
    }

    return json({ error: 'unknown-action' }, 400);
  },
};

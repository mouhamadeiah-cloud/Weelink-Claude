// Vercel serverless function: the sign-in and the data of the platform admin site
// (admin.testweelink.de, Eyad's team). Everything here runs on the server with the Firebase Admin
// SDK; the browser never reads the subscribers or the admin accounts (the rules deny them).
//
//   POST /api/admin  { action: 'login', username, password }   → { token, admin }
//   POST /api/admin  { action: 'me' }                           → { admin }
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
//   POST /api/admin  { action: 'slides-review-list', status? } → { rows, counts }  and
//                    { action: 'slide-review', id, decision: 'approve'|'reject', reason? } → { status }
//        (the slides designers exported to the gallery wait as gallerySlides/{id}.status = 'pending')
//   POST /api/admin  { action: 'tokens-overview', month? }       → { totals, kinds, top, emails, prices }
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
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { Resend } from 'resend';
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
// Wee AI tokens (the same numbers as in api/build-page.ts and api/write-texts.ts): the first AI call
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
const FINANCE_ONLY = ['payments', 'add-payment', 'postpone-freeze', 'invoice-send', 'get-company', 'tokens-overview', 'tokens-adjust'];
// The designers' gallery is the content reviewers' work (the owner too).
const CONTENT_ONLY = ['page-law-get', 'page-law-set', 'slides-review-list', 'slide-review'];
const OWNER_ONLY = ['set-company', 'set-prices', 'set-status', 'admins-list', 'admin-add', 'admin-update', 'admin-reset-password', 'task-create', 'task-update'];
// The tasks calls are open, but an admin who is not the owner only sees and touches the tasks given to them.
const OPEN_TO_ALL = ['subscribers', 'subscriber', 'add-note', 'tasks', 'task', 'task-status', 'task-reply', 'chat', 'chat-send'];
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
  by: String(d.by || ''), sentAt: Number(d.sentAt) || 0, key: String(d.key || ''),
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
  await db.collection('platform_audit').add({ at: FieldValue.serverTimestamp(), admin: 'system', action: `daily:${JSON.stringify(out)}`, ok: true, ip: 'cron' });
  return out;
};

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

      const statusSnap = await db.collection('platform_subscribers').select('status', 'subscription').get();
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
      return json({
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
      const amount = Number(body.amount);
      const method = String(body.method || '');
      if (!/^(page|restaurant|shop|cars)-(pro|30|60)$/.test(plan)) return json({ error: 'bad-plan' }, 400);
      if (!PERIODS.includes(period)) return json({ error: 'bad-period' }, 400);
      if (!(amount >= 0 && amount < 1e12)) return json({ error: 'bad-amount' }, 400);
      if (!METHODS[method]) return json({ error: 'bad-method' }, 400);

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
        receiptNo: String(body.receiptNo || '').trim().slice(0, 40), note: String(body.note || '').trim().slice(0, 300),
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

    if (action === 'invoice-send') {
      const snap = await db.collection('platform_payments').doc(String(body.paymentId || '').slice(0, 128)).get();
      if (!snap.exists) return json({ error: 'not-found' }, 404);
      const pay = payFromDoc(snap.id, snap.data()!);
      if (!pay.email) return json({ error: 'no-email' }, 400);
      const link = `${new URL(request.url).origin}/api/admin?invoice=${snap.id}&k=${pay.key}`;
      const html = invoiceHtml(pay, await getCompany(db), false).replace('</div></body>', `<p style="margin-top:20px;font-size:13px"><a href="${link}">افتح الفاتورة للطباعة أو الحفظ PDF</a></p></div></body>`);
      const sent = await sendMail(pay.email, `فاتورة ${pay.invoiceNo}`, html);
      if (sent.result === 'skipped') return json({ error: 'email-not-configured' }, 503);
      if (sent.result === 'failed') return json({ error: 'refused', detail: String(sent.detail || '').slice(0, 200) }, 502);
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

    // ----- the designers' gallery -----
    // platformSettings/pageLaw = { text, version, updatedAt, updatedBy }: the law a designer agrees to
    // when exporting a slide; every save raises the version, and a slide records the version it was
    // exported under. gallerySlides/{id} (written by the designer, status 'pending') is approved or
    // rejected here; the rules let nobody else change its status.
    const SLIDE_STATUSES = ['pending', 'approved', 'rejected'];
    const SLIDE_CATEGORY_IDS = ['hero', 'about', 'services', 'gallery', 'team', 'reviews', 'offers', 'booking', 'contact', 'menu', 'cars', 'products', 'legal', 'other'];
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
        db.collection('gallerySlides').where('status', '==', status).limit(60).get(),
        db.collection('gallerySlides').where('status', '==', 'pending').select().get(),
      ]);
      const rows = snap.docs
        .map((d) => {
          const x = d.data();
          return {
            id: d.id, name: String(x.name || ''), category: String(x.category || ''), designerUid: String(x.designerUid || ''),
            designerName: String(x.designerName || ''), status: String(x.status || 'pending'), lawVersion: Number(x.lawVersion) || 0,
            acceptedAt: String(x.acceptedAt || ''), createdAt: x.createdAt?.toMillis?.() || 0, reason: String(x.reason || ''),
            reviewedBy: String(x.reviewedBy || ''), slide: x.slide || {}, elements: Array.isArray(x.elements) ? x.elements : [],
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);
      return json({ rows, counts: { pending: pendingCount.size } });
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
      if (decision === 'approve' && !SLIDE_CATEGORY_IDS.includes(String(snap.data()?.category))) return json({ error: 'bad-category' }, 400);
      const status = decision === 'approve' ? 'approved' : 'rejected';
      const cur = snap.data() as { likes?: number; dislikes?: number } | undefined;
      // An approved slide starts its counters at zero (a withdrawn one that comes back keeps them);
      // «جديد» in the gallery counts from the approval.
      await ref.update({
        status, reason: decision === 'reject' ? reason : '', reviewedBy: session.u, reviewedAt: Date.now(),
        ...(decision === 'approve' ? { approvedAt: Date.now(), likes: Number(cur?.likes) || 0, dislikes: Number(cur?.dislikes) || 0 } : {}),
      });
      await audit(session.u, `slide-review:${id}:${status}`);
      return json({ status });
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

// Paying before publishing (Eyad, 17 Oct). A paid project (a restaurant, a shop, a car showroom, or a
// Pro page) goes live only once its invoice is paid, and each project has its own validity.
//
//   1. «نشر» shows the invoice: the package, monthly or yearly, the extras (a restaurant's extra devices)
//      and the bigger packages the customer could take instead. The customer picks how they pay.
//   2. The order is saved as 'unpaid'. With a transfer number or a photo of the receipt it becomes
//      'attached' and the office gets an email (ADMIN_EMAIL, weelinkclaud@gmail.com for now).
//   3. The admin site's «طلبات الدفع»: the team approves (→ 'paid': a payment and its invoice, and the
//      project's validity starts that day, or at the end of the running period for a renewal) or rejects
//      with a reason (→ 'rejected': the customer is told and can send a new receipt).
//   4. A project that was never paid is deleted 2 months after its first invoice, unless the team moves
//      the date; the customer is reminded a week and a day before.
//   5. Each paid project gets reminders 14, 7 and 1 day before its end, and its page closes at the end.
//
// Data (only the server writes it):
//   platform_orders/{id}       the invoices: uid, project, plan, period, devices, items, total, status, ...
//   platform_receipts/{id}     the receipt photo of an order (a small JPEG data URL), read by the team only
//   projectAccess/{uid}__{key} a project's paid period, public to read: the published page and the
//                              Firestore rules check paidUntil (and the reminders sent)
//   testAccounts/{uid}         an account that publishes without paying (the accounts made before this)
//   platformSettings/billing   { enforce }: nothing is asked to pay until the team turns it on
//   platform_deleted/{uid}     the card kept of a customer the team deleted
// Everything takes the db (and auth) from server/firebase.ts, so the tests can pass the in-memory one.
import { randomBytes } from 'node:crypto';
import { Resend } from 'resend';
import { FieldValue, getStorage } from './firebase.js';
import { deleteUserImages } from './images.js';
import { removeSite, searchDb } from './searchIndex.js';
import { placeFromAddress, placeLabel } from '../src/services/place.js';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };
import { invoiceFor, needsPayment, type InvoiceItem, type Period } from '../src/utils/invoice.js';
import { isFirstOfKind, isProjectKey, kindOf, restaurantIdOf } from '../src/utils/projectKeys.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = any;
type Auth = { getUser: (uid: string) => Promise<{ email?: string; displayName?: string; metadata?: { creationTime?: string } }> };

export const DAY = 86400000;
export const UNPAID_KEEP_DAYS = 60;
export const ADMIN_EMAIL_DEFAULT = 'weelinkclaud@gmail.com';
// The same number as api/admin.ts: a payment adds this many Wee AI tokens for every month it covers.
const PAID_TOKENS = 150_000;
const MAX_RECEIPT = 900_000; // characters of the data URL, about 650 KB

export type OrderStatus = 'unpaid' | 'attached' | 'paid' | 'rejected' | 'cancelled' | 'deleted';
const OPEN: OrderStatus[] = ['unpaid', 'attached', 'rejected'];

// How the customer pays. The balance card comes later (Eyad); the others need the transfer's number or a photo.
export const PAY_WAYS: Record<string, string> = {
  syriatel: 'سيريتل كاش',
  mtn: 'MTN كاش',
  sham: 'شام كاش',
  transfer: 'حوالة مالية',
  office: 'دفع في المكتب',
};
// Paid on the Stripe page (server/stripe.ts): the webhook approves it, the customer never sends a receipt.
const WAY_NAMES: Record<string, string> = { ...PAY_WAYS, online: 'دفع إلكتروني' };

export const accessId = (uid: string, project: string) => `${uid}__${project}`;

const monthsOf = (period: Period) => (period === 'yearly' ? 12 : 1);
export { invoiceFor, needsPayment };

// The end of a period that starts at `from` (the same day a month or a year later).
export const addPeriod = (from: number, period: Period) => {
  const d = new Date(from);
  if (period === 'yearly') d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d.getTime();
};

// ---------- mails ----------

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
export const fmtDate = (ms: number) => new Date(ms).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Damascus' });
const fmtPounds = (n: number) => `${Number(n).toLocaleString('ar-SY')} ل.س`;

const mailHtml = (title: string, lines: string[], color = '#1d5bd8') => `<!doctype html><html lang="ar" dir="rtl"><body style="font-family:system-ui,Tahoma,sans-serif;background:#f6f7f9;margin:0;padding:32px">
  <div style="max-width:480px;margin:auto;background:#fff;border-radius:16px;padding:28px">
    <h1 style="font-size:19px;margin:0 0 12px;color:${color}">${esc(title)}</h1>
    ${lines.map((l) => `<p style="color:#333;line-height:1.8;margin:0 0 8px">${l}</p>`).join('')}
    <p style="color:#999;font-size:12px;margin:20px 0 0">رسالة من Weelink.</p>
  </div></body></html>`;

// Tests record the mails through the same tap as server/orderMail.ts.
const holder = globalThis as { __mailTap?: ((entry: string) => void) | null };
export const sendMail = async (to: string, subject: string, html: string): Promise<'sent' | 'skipped' | 'failed'> => {
  if (holder.__mailTap) { holder.__mailTap(`${to}:${subject}`); return 'sent'; }
  const from = process.env.EMAIL_FROM;
  const key = process.env.RESEND_API_KEY;
  if (!from || !key || !to) return 'skipped';
  try {
    const { error } = await new Resend(key).emails.send({ from, to, subject, html });
    return error ? 'failed' : 'sent';
  } catch {
    return 'failed';
  }
};
const adminEmail = () => process.env.ADMIN_EMAIL || ADMIN_EMAIL_DEFAULT;

const itemsHtml = (o: { items: InvoiceItem[]; total: number }) =>
  `${o.items.map((i) => `${esc(i.label)}: <b>${i.amount ? esc(fmtPounds(i.amount)) : 'مجاناً'}</b>`).join('<br>')}<br>المجموع: <b>${esc(fmtPounds(o.total))}</b>`;

// ---------- settings ----------

export const readSettings = async (db: Db) => {
  const d = (await db.collection('platformSettings').doc('billing').get()).data() || {};
  return { enforce: d.enforce === true, since: Number(d.since) || 0, by: String(d.by || '') };
};

// Turning payment on marks every account that exists now as a test account, so their pages keep working
// and they publish without paying (Eyad, 17 Oct). `uids` comes from api/admin.ts (every Firebase user).
export const enforceBilling = async (db: Db, on: boolean, by: string, uids: string[]) => {
  const now = Date.now();
  let marked = 0;
  if (on) {
    for (let i = 0; i < uids.length; i += 400) {
      const batch = db.batch();
      for (const uid of uids.slice(i, i + 400)) {
        batch.set(db.collection('testAccounts').doc(uid), { at: now, by, auto: true }, { merge: true });
        marked++;
      }
      await batch.commit();
    }
  }
  await db.collection('platformSettings').doc('billing').set({ enforce: on, since: on ? now : 0, by });
  return { enforce: on, marked };
};

export const setTestAccount = async (db: Db, uid: string, on: boolean, by: string) => {
  const ref = db.collection('testAccounts').doc(uid);
  if (on) await ref.set({ at: Date.now(), by });
  else await ref.delete();
  return { test: on };
};

// ---------- orders ----------

const orderFromDoc = (id: string, d: Record<string, any>) => ({
  id, uid: String(d.uid || ''), email: String(d.email || ''), name: String(d.name || ''),
  project: String(d.project || ''), siteName: String(d.siteName || ''),
  plan: String(d.plan || ''), planName: String(d.planName || ''), period: (d.period === 'yearly' ? 'yearly' : 'monthly') as Period,
  devices: Number(d.devices) || 0, items: (Array.isArray(d.items) ? d.items : []) as InvoiceItem[], total: Number(d.total) || 0,
  status: String(d.status || 'unpaid') as OrderStatus, way: String(d.way || ''), transferNo: String(d.transferNo || ''), hasImage: !!d.hasImage,
  renewal: !!d.renewal, createdAt: Number(d.createdAt) || 0, updatedAt: Number(d.updatedAt) || 0, deleteAt: Number(d.deleteAt) || 0,
  rejectReason: String(d.rejectReason || ''), decidedBy: String(d.decidedBy || ''), decidedAt: Number(d.decidedAt) || 0,
  paymentId: String(d.paymentId || ''),
});
export type Order = ReturnType<typeof orderFromDoc>;

const openOrdersOf = async (db: Db, uid: string, project?: string) => {
  const snap = await db.collection('platform_orders').where('uid', '==', uid).limit(300).get();
  return snap.docs.map((d: any) => orderFromDoc(d.id, d.data())).filter((o: Order) => OPEN.includes(o.status) && (!project || o.project === project));
};

const readAccess = async (db: Db, uid: string, project: string) =>
  ((await db.collection('projectAccess').doc(accessId(uid, project)).get()).data() || null) as null | { paidUntil?: number; plan?: string; planName?: string; period?: Period };

// The project must be the customer's own: the first of a kind lives in designs/{uid}, a later one in its own doc.
const ownsProject = async (db: Db, uid: string, project: string) => {
  if (isFirstOfKind(project)) return (await db.collection('designs').doc(uid).get()).exists;
  return (await db.collection('designs').doc(uid).collection('projects').doc(project).get()).exists;
};

const cleanImage = (raw: unknown) => {
  const s = String(raw || '');
  return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s) && s.length <= MAX_RECEIPT ? s : '';
};

type User = { uid: string; email?: string; name?: string };

/**
 * A customer asks for the invoice of a project: a new order replaces the open one of the same project.
 * The 2 months before an unpaid project is deleted count from its first invoice (a new one does not reset them).
 */
export const createOrder = async (db: Db, user: User, body: Record<string, unknown>) => {
  const project = String(body.project || '');
  if (!isProjectKey(project)) return { error: 'bad-project', status: 400 };
  const inv = invoiceFor(project, String(body.plan || ''), String(body.period || '') as Period, Number(body.devices) || 0);
  if (!inv) return { error: 'bad-plan', status: 400 };
  if (!(await ownsProject(db, user.uid, project))) return { error: 'not-found', status: 404 };
  const siteName = String(body.siteName || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
  const now = Date.now();
  const access = await readAccess(db, user.uid, project);
  const renewal = !!access?.paidUntil;
  const open = await openOrdersOf(db, user.uid, project);
  const firstDeleteAt = open.map((o: Order) => o.deleteAt).filter(Boolean).sort((a: number, b: number) => a - b)[0];
  const deleteAt = renewal ? 0 : firstDeleteAt || now + UNPAID_KEEP_DAYS * DAY;
  const batch = db.batch();
  for (const o of open) batch.set(db.collection('platform_orders').doc(o.id), { status: 'cancelled', updatedAt: now }, { merge: true });
  const ref = db.collection('platform_orders').doc();
  const data = {
    uid: user.uid, email: user.email || '', name: user.name || '', project, siteName, ...inv,
    status: 'unpaid', way: '', transferNo: '', hasImage: false, renewal, createdAt: now, updatedAt: now, deleteAt, remind: {},
  };
  batch.set(ref, data);
  await batch.commit();
  return { order: orderFromDoc(ref.id, data) };
};

/** The customer sends how they paid: the transfer's number, a photo of the receipt, or both. */
export const attachProof = async (db: Db, user: User, body: Record<string, unknown>) => {
  const id = String(body.id || '').slice(0, 64);
  const ref = db.collection('platform_orders').doc(id);
  const snap = await ref.get();
  const o = snap.exists ? orderFromDoc(id, snap.data()) : null;
  if (!o || o.uid !== user.uid) return { error: 'not-found', status: 404 };
  if (!['unpaid', 'rejected', 'attached'].includes(o.status)) return { error: 'bad-state', status: 409 };
  const way = String(body.way || '');
  if (way === 'card') return { error: 'card-soon', status: 400 };
  if (!PAY_WAYS[way]) return { error: 'bad-way', status: 400 };
  const transferNo = String(body.transferNo || '').trim().slice(0, 60);
  const image = cleanImage(body.image);
  if (body.image && !image) return { error: 'bad-image', status: 400 };
  if (!transferNo && !image && !o.hasImage) return { error: 'no-proof', status: 400 };
  const now = Date.now();
  if (image) await db.collection('platform_receipts').doc(id).set({ image, at: now });
  const patch = { status: 'attached', way, transferNo, hasImage: o.hasImage || !!image, updatedAt: now, rejectReason: '' };
  await ref.set(patch, { merge: true });
  const next = { ...o, ...patch, status: 'attached' as OrderStatus };
  await sendMail(adminEmail(), `إشعار دفع جديد: ${o.planName}`, mailHtml('إشعار دفع ينتظر الفحص', [
    `${esc(o.name || o.email)}${o.email ? ` (<span dir="ltr">${esc(o.email)}</span>)` : ''}`,
    `المشروع: <b dir="ltr">${esc(o.siteName || o.project)}</b>`,
    itemsHtml(o),
    `الطريقة: ${esc(PAY_WAYS[way])}${transferNo ? ` · رقم الحوالة: <b dir="ltr">${esc(transferNo)}</b>` : ''}${next.hasImage ? ' · مرفق صورة' : ''}`,
    'افتح موقع الإدارة ← «طلبات الدفع» لتأكيده أو رفضه.',
  ]));
  return { order: next };
};

/** What the account page shows: each project's paid period, the open invoices, and whether it is a test account. */
export const myBilling = async (db: Db, uid: string) => {
  const [accessSnap, ordersSnap, test, settings] = await Promise.all([
    db.collection('projectAccess').where('owner', '==', uid).limit(100).get(),
    db.collection('platform_orders').where('uid', '==', uid).limit(300).get(),
    db.collection('testAccounts').doc(uid).get(),
    readSettings(db),
  ]);
  const projects: Record<string, { plan: string; planName: string; period: Period; paidUntil: number }> = {};
  for (const d of accessSnap.docs) {
    const a = d.data();
    projects[String(a.project)] = { plan: String(a.plan || ''), planName: String(a.planName || ''), period: a.period === 'yearly' ? 'yearly' : 'monthly', paidUntil: Number(a.paidUntil) || 0 };
  }
  const orders = ordersSnap.docs.map((d: any) => orderFromDoc(d.id, d.data()))
    .filter((o: Order) => OPEN.includes(o.status))
    .sort((a: Order, b: Order) => b.createdAt - a.createdAt)
    .map(({ email: _e, name: _n, decidedBy: _d, ...o }: Order) => o);
  return { projects, orders, test: test.exists, enforce: settings.enforce };
};

// ---------- the team ----------

export const listOrders = async (db: Db, status: string) => {
  const snap = await db.collection('platform_orders').orderBy('createdAt', 'desc').limit(1000).get();
  const all = snap.docs.map((d: any) => orderFromDoc(d.id, d.data())).filter((o: Order) => o.status !== 'cancelled');
  const counts: Record<string, number> = {};
  for (const o of all) counts[o.status] = (counts[o.status] || 0) + 1;
  return { rows: all.filter((o: Order) => status === 'all' || o.status === status).slice(0, 300), counts };
};

export const getOrder = async (db: Db, id: string) => {
  const snap = await db.collection('platform_orders').doc(id).get();
  if (!snap.exists) return null;
  const receipt = (await db.collection('platform_receipts').doc(id).get()).data();
  const order = orderFromDoc(id, snap.data());
  const access = await readAccess(db, order.uid, order.project);
  return { order, image: String(receipt?.image || ''), paidUntil: Number(access?.paidUntil) || 0 };
};

const nextInvoiceNo = async (db: Db, now: number) => {
  const n = await db.runTransaction(async (t: any) => {
    const ref = db.collection('platform_counters').doc('invoice');
    const next = ((await t.get(ref)).data()?.n || 0) + 1;
    t.set(ref, { n: next });
    return next;
  });
  return `INV-${new Date(now).getUTCFullYear()}-${String(n).padStart(4, '0')}`;
};

/**
 * The team got the money: the order is paid, a payment with its invoice is written (platform_payments, as
 * the admin site's «إضافة دفعة» does), and the project's paid period starts now, or at the end of the
 * period still running. `invoiceUrl` builds the link the customer gets.
 */
export const approveOrder = async (db: Db, id: string, by: string, invoiceUrl: (paymentId: string, key: string) => string) => {
  const ref = db.collection('platform_orders').doc(id);
  const snap = await ref.get();
  const o = snap.exists ? orderFromDoc(id, snap.data()) : null;
  if (!o) return { error: 'not-found', status: 404 };
  if (!['unpaid', 'attached', 'rejected'].includes(o.status)) return { error: 'bad-state', status: 409 };
  const now = Date.now();
  const access = await readAccess(db, o.uid, o.project);
  const from = access?.paidUntil && access.paidUntil > now ? access.paidUntil : now;
  const paidUntil = addPeriod(from, o.period);
  const invoiceNo = await nextInvoiceNo(db, now);
  const payRef = db.collection('platform_payments').doc();
  const key = randomBytes(12).toString('hex');
  const extras = o.items.slice(1).map((i) => i.label).join('، ');
  const pay = {
    uid: o.uid, email: o.email, name: o.name, plan: o.plan, planName: o.planName, period: o.period, amount: o.total,
    method: o.way === 'office' ? 'office' : o.way === 'online' ? 'online' : 'transfer', receiptNo: o.transferNo,
    note: [`مشروع ${o.siteName || o.project}`, extras, WAY_NAMES[o.way] || ''].filter(Boolean).join(' · '),
    paidAt: now, coversFrom: from, coversTo: paidUntil, by, key, invoiceNo, project: o.project, orderId: id,
  };
  const months = monthsOf(o.period);
  const sub = db.collection('platform_subscribers').doc(o.uid);
  const batch = db.batch();
  batch.set(payRef, pay);
  batch.set(db.collection('projectAccess').doc(accessId(o.uid, o.project)), {
    owner: o.uid, project: o.project, kind: kindOf(o.project), plan: o.plan, planName: o.planName, period: o.period,
    devices: o.devices, paidUntil, updatedAt: now, notified: {},
  });
  batch.set(ref, { status: 'paid', paymentId: payRef.id, decidedBy: by, decidedAt: now, updatedAt: now, deleteAt: 0 }, { merge: true });
  batch.set(sub, { tokens: { balance: FieldValue.increment(PAID_TOKENS * months) } }, { merge: true });
  batch.set(sub.collection('events').doc(), { at: now, admin: by, type: 'payment', text: `${o.planName} · ${o.siteName || o.project} · ${o.total.toLocaleString('en')} ل.س · حتى ${fmtDate(paidUntil)}` });
  await batch.commit();
  await sendMail(o.email, 'تم تأكيد دفعتك', mailHtml('تم تأكيد دفعتك', [
    `أهلاً ${esc(o.name)}، وصلتنا دفعة ${esc(o.planName)} لمشروعك <b dir="ltr">${esc(o.siteName || o.project)}</b>.`,
    `صلاحية المشروع حتى <b>${esc(fmtDate(paidUntil))}</b>. صار فيك تنشر صفحتك من زر «نشر».`,
    `<a href="${esc(invoiceUrl(payRef.id, key))}">افتح الفاتورة</a>`,
  ], '#1d6b34'));
  return { order: { ...o, status: 'paid' as OrderStatus, paymentId: payRef.id }, paidUntil };
};

export const rejectOrder = async (db: Db, id: string, by: string, reasonIn: unknown) => {
  const reason = String(reasonIn || '').trim().slice(0, 300);
  if (reason.length < 3) return { error: 'reason', status: 400 };
  const ref = db.collection('platform_orders').doc(id);
  const snap = await ref.get();
  const o = snap.exists ? orderFromDoc(id, snap.data()) : null;
  if (!o) return { error: 'not-found', status: 404 };
  if (o.status !== 'attached') return { error: 'bad-state', status: 409 };
  const now = Date.now();
  await ref.set({ status: 'rejected', rejectReason: reason, decidedBy: by, decidedAt: now, updatedAt: now }, { merge: true });
  await sendMail(o.email, 'ما قدرنا نأكد دفعتك', mailHtml('ما قدرنا نأكد دفعتك', [
    `أهلاً ${esc(o.name)}، راجعنا إشعار الدفع لمشروعك <b dir="ltr">${esc(o.siteName || o.project)}</b> وما قدرنا نأكده.`,
    `السبب: ${esc(reason)}`,
    'فيك ترفع إشعار جديد من صفحة «حسابي» ← «الدفعات».',
  ], '#c8322b'));
  return { order: { ...o, status: 'rejected' as OrderStatus, rejectReason: reason } };
};

/** The team gives an unpaid project more time before it is deleted. */
export const extendOrder = async (db: Db, id: string, date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'bad-date', status: 400 };
  const deleteAt = Date.parse(`${date}T23:59:59+03:00`);
  if (!(deleteAt > Date.now())) return { error: 'past-date', status: 400 };
  const ref = db.collection('platform_orders').doc(id);
  const snap = await ref.get();
  const o = snap.exists ? orderFromDoc(id, snap.data()) : null;
  if (!o) return { error: 'not-found', status: 404 };
  if (!OPEN.includes(o.status) || o.renewal) return { error: 'bad-state', status: 409 };
  await ref.set({ deleteAt, remind: {}, updatedAt: Date.now() }, { merge: true });
  return { deleteAt };
};

// ---------- deleting ----------

const FIELDS: Record<string, string[]> = {
  page: ['pages', 'elements'],
  shop: ['shopPages', 'shopElements', 'shopAdmin'],
  cars: ['carPages', 'carElements', 'carAdmin'],
  restaurant: ['restaurantPages', 'restaurantElements', 'restaurantAdmin'],
};
const RESTAURANT_SUBS = ['orders', 'ledger', 'cashDays', 'counters', 'deviceLinks', 'giftCards', 'handovers', 'log', 'private', 'screens', 'tabs', 'shifts', 'sessions'];

const deleteCollection = async (db: Db, col: any) => {
  for (;;) {
    const snap = await col.limit(300).get();
    if (!snap.docs.length) return;
    const batch = db.batch();
    for (const d of snap.docs) batch.delete(d.ref);
    await batch.commit();
    if (snap.docs.length < 300) return;
  }
};

const deleteRestaurant = async (db: Db, id: string) => {
  const ref = db.collection('restaurants').doc(id);
  for (const sub of RESTAURANT_SUBS) {
    if (sub === 'giftCards') {
      // The card numbers are unique across all restaurants (giftCardNumbers/{number}); free them too.
      const cards = await ref.collection('giftCards').limit(1000).get();
      for (const c of cards.docs) await db.collection('giftCardNumbers').doc(c.id).delete().catch(() => undefined);
    }
    await deleteCollection(db, ref.collection(sub));
  }
  await ref.delete().catch(() => undefined);
};

const unpublish = async (db: Db, uid: string, project: string) => {
  const site = db.collection('publishedSites').doc(accessId(uid, project));
  const snap = await site.get();
  const name = snap.exists ? String(snap.data().name || '') : '';
  if (name) await db.collection('siteNames').doc(name).delete().catch(() => undefined);
  await site.delete().catch(() => undefined);
  // Out of Weelink's search too (worker/index-site.ts keeps it); no database bound = nothing to remove.
  const index = searchDb();
  if (index) await removeSite(index, accessId(uid, project)).catch((err: Error) => console.error('search index remove failed:', err?.message));
};

/** Removes one project: its design, its live restaurant data, its published page and its paid period. */
export const deleteProject = async (db: Db, uid: string, project: string) => {
  const kind = kindOf(project);
  if (kind === 'restaurant') await deleteRestaurant(db, restaurantIdOf(uid, project));
  await unpublish(db, uid, project);
  if (isFirstOfKind(project)) {
    const design = db.collection('designs').doc(uid);
    if ((await design.get()).exists) await design.set(Object.fromEntries((FIELDS[kind] || []).map((f) => [f, FieldValue.delete()])), { merge: true });
  } else {
    await db.collection('designs').doc(uid).collection('projects').doc(project).delete().catch(() => undefined);
  }
  await db.collection('projectAccess').doc(accessId(uid, project)).delete().catch(() => undefined);
};

/** Every project key of an account: the first of each kind it has, and the later ones. */
export const projectKeysOf = async (db: Db, uid: string) => {
  const design = (await db.collection('designs').doc(uid).get()).data() || {};
  const keys = Object.keys(FIELDS).filter((k) => FIELDS[k].some((f) => f in design));
  const later = await db.collection('designs').doc(uid).collection('projects').limit(200).get();
  return [...keys, ...later.docs.map((d: any) => d.id).filter(isProjectKey)];
};

/**
 * The team deletes a customer (Eyad, 17 Oct): all their pages and everything about them go, but the Firebase
 * sign-in stays, since they may still be a customer of other pages. Their payments stay for the books, and a
 * card (name, phone, email, sign-up and end dates) is kept in platform_deleted for «الزبائن المحذوفين».
 */
export const deleteCustomer = async (db: Db, auth: Auth, uid: string, by: string, reasonIn: unknown) => {
  const reason = String(reasonIn || '').trim().slice(0, 300);
  if (reason.length < 3) return { error: 'reason', status: 400 };
  const user = await auth.getUser(uid).catch(() => null);
  if (!user) return { error: 'not-found', status: 404 };
  const design = (await db.collection('designs').doc(uid).get()).data() || {};
  const dir = (await db.collection('platform_directory').doc(uid).get()).data() || {};
  const accessSnap = await db.collection('projectAccess').where('owner', '==', uid).limit(100).get();
  const endsAt = Math.max(0, ...accessSnap.docs.map((d: any) => Number(d.data().paidUntil) || 0));
  const keys = await projectKeysOf(db, uid);
  for (const key of keys) await deleteProject(db, uid, key);
  for (const d of accessSnap.docs) await d.ref.delete().catch(() => undefined);
  // Pages published under a key the design no longer lists.
  const sites = await db.collection('publishedSites').where('owner', '==', uid).limit(100).get();
  for (const s of sites.docs) await unpublish(db, uid, String(s.data().project || ''));

  const now = Date.now();
  const orders = await db.collection('platform_orders').where('uid', '==', uid).limit(300).get();
  const batch = db.batch();
  for (const o of orders.docs) if (OPEN.includes(o.data().status)) batch.set(o.ref, { status: 'deleted', updatedAt: now }, { merge: true });
  await batch.commit();
  for (const col of [
    db.collection('designs').doc(uid).collection('projects'),
    db.collection('bookings').doc(uid).collection('items'),
    db.collection('ratings').doc(uid).collection('items'),
    db.collection('pageCustomers').doc(uid).collection('customers'),
    db.collection('siteStats').doc(uid).collection('days'),
    db.collection('accounts').doc(uid).collection('members'),
    db.collection('accounts').doc(uid).collection('invites'),
  ]) await deleteCollection(db, col);
  for (const ref of [db.collection('designs').doc(uid), db.collection('platform_directory').doc(uid), db.collection('restaurants').doc(uid)]) {
    await ref.delete().catch(() => undefined);
  }
  // Their photos (src/utils/storagePaths.ts keeps each account's under users/{uid}/). Older photos, from
  // before that, sit in shared folders and stay.
  await getStorage().bucket(firebaseConfig.storageBucket).deleteFiles({ prefix: `users/${uid}/` })
    .catch((err: Error) => console.error('photo delete failed:', err?.message));
  await deleteUserImages(uid).catch((err: Error) => console.error('R2 photo delete failed:', err?.message));

  const card = {
    uid, name: user.displayName || String(dir.personalInfo?.fullName || ''), email: user.email || '',
    phone: String(design.profile?.phone || dir.contactInfo?.phone || ''),
    address: placeLabel(placeFromAddress(dir.addressInfo)),
    createdAt: Date.parse(user.metadata?.creationTime || '') || 0, endsAt, deletedAt: now, by, reason, projects: keys,
  };
  await db.collection('platform_deleted').doc(uid).set(card);
  const sub = db.collection('platform_subscribers').doc(uid);
  await sub.set({ deletedAt: now, subscription: FieldValue.delete() }, { merge: true });
  await sub.collection('events').doc().set({ at: now, admin: by, type: 'deleted', text: `حُذف الزبون وصفحاته · ${reason}` });
  return { card };
};

export const listDeleted = async (db: Db) => {
  const snap = await db.collection('platform_deleted').orderBy('deletedAt', 'desc').limit(500).get();
  return snap.docs.map((d: any) => {
    const c = d.data();
    return { uid: d.id, name: String(c.name || ''), email: String(c.email || ''), phone: String(c.phone || ''), address: String(c.address || ''), createdAt: Number(c.createdAt) || 0, endsAt: Number(c.endsAt) || 0, deletedAt: Number(c.deletedAt) || 0, by: String(c.by || ''), reason: String(c.reason || '') };
  });
};

// ---------- the daily job ----------

const REMINDERS: { key: 'd14' | 'd7' | 'd1'; days: number }[] = [{ key: 'd1', days: 1 }, { key: 'd7', days: 7 }, { key: 'd14', days: 14 }];
const DELETE_REMINDERS: { key: 'w' | 'd'; days: number }[] = [{ key: 'd', days: 1 }, { key: 'w', days: 7 }];

const endMail = (key: 'd14' | 'd7' | 'd1' | 'ended', planName: string, project: string, paidUntil: number) => {
  const when = esc(fmtDate(paidUntil));
  const what = `${esc(planName)} لمشروعك <b dir="ltr">${esc(project)}</b>`;
  if (key === 'ended') return { subject: 'انتهت صلاحية مشروعك', html: mailHtml('انتهت صلاحية مشروعك', [`انتهت صلاحية ${what} بتاريخ ${when}، فتوقفت صفحته عن الظهور.`, 'جدّد من صفحة «حسابي» ← «مشاريعي» وبترجع الصفحة متل ما كانت.'], '#c8322b') };
  const days = key === 'd14' ? 'أسبوعين' : key === 'd7' ? 'أسبوع' : 'يوم';
  return { subject: `صلاحية مشروعك تنتهي خلال ${days}`, html: mailHtml('تذكير بالتجديد', [`صلاحية ${what} تنتهي بتاريخ ${when}.`, 'جدّد من صفحة «حسابي» ← «مشاريعي» قبلها لتضل صفحتك شغالة.'], key === 'd1' ? '#c8322b' : '#b7791f') };
};

/** Reminders before each project's end, the mail at its end, and deleting the projects never paid in time. */
export const runBillingDaily = async (db: Db, auth: Auth, now = Date.now()) => {
  const out = { reminded: 0, ended: 0, warned: 0, deleted: 0 };
  const access = await db.collection('projectAccess').where('paidUntil', '>', now - 3 * DAY).limit(5000).get();
  for (const d of access.docs) {
    const a = d.data();
    const paidUntil = Number(a.paidUntil) || 0;
    if (!paidUntil || paidUntil < now - 3 * DAY) continue;
    const notified = a.notified || {};
    const left = (paidUntil - now) / DAY;
    let key: 'd14' | 'd7' | 'd1' | 'ended' | undefined;
    let mark: string[] = [];
    if (left <= 0) {
      if (!notified.ended) { key = 'ended'; mark = ['ended']; }
    } else {
      const due = REMINDERS.filter((r) => left <= r.days);
      const todo = due.find((r) => !notified[r.key]);
      if (todo) { key = todo.key; mark = due.map((r) => r.key); }
    }
    if (!key) continue;
    const site = (await db.collection('publishedSites').doc(d.id).get()).data();
    const email = String((await auth.getUser(String(a.owner || '')).catch(() => null))?.email || '');
    const m = endMail(key, String(a.planName || ''), String(site?.name || a.project || ''), paidUntil);
    if ((await sendMail(email, m.subject, m.html)) === 'failed') continue;
    await d.ref.set({ notified: { ...notified, ...Object.fromEntries(mark.map((k) => [k, now])) } }, { merge: true });
    if (key === 'ended') out.ended++;
    else out.reminded++;
  }

  const orders = await db.collection('platform_orders').where('deleteAt', '>', 0).limit(5000).get();
  for (const d of orders.docs) {
    const o = orderFromDoc(d.id, d.data());
    // A receipt waiting for the team is the team's to answer; the project is not deleted meanwhile.
    if (!o.deleteAt || o.renewal || !['unpaid', 'rejected'].includes(o.status)) continue;
    const remind = d.data().remind || {};
    const left = (o.deleteAt - now) / DAY;
    if (left <= 0) {
      await deleteProject(db, o.uid, o.project);
      await d.ref.set({ status: 'deleted', updatedAt: now }, { merge: true });
      await sendMail(o.email, 'انحذف مشروعك غير المدفوع', mailHtml('انحذف مشروعك', [`مرّ شهرين على فاتورة مشروعك <b dir="ltr">${esc(o.siteName || o.project)}</b> بدون دفع، فانحذف.`, 'فيك تعمل مشروع جديد متى ما بدك.'], '#c8322b'));
      out.deleted++;
      continue;
    }
    const due = DELETE_REMINDERS.filter((r) => left <= r.days);
    const todo = due.find((r) => !remind[r.key]);
    if (!todo) continue;
    const r = await sendMail(o.email, todo.key === 'd' ? 'مشروعك بينحذف بكرا' : 'مشروعك بينحذف خلال أسبوع', mailHtml('مشروعك بانتظار الدفع', [
      `مشروعك <b dir="ltr">${esc(o.siteName || o.project)}</b> لسا ما اندفع، وبينحذف بتاريخ <b>${esc(fmtDate(o.deleteAt))}</b>.`,
      itemsHtml(o),
      'ادفع وارفع الإشعار من صفحة «حسابي» ← «الدفعات» لتحتفظ فيه.',
    ], '#b7791f'));
    if (r === 'failed') continue;
    await d.ref.set({ remind: { ...remind, ...Object.fromEntries(due.map((x) => [x.key, now])) } }, { merge: true });
    out.warned++;
  }
  return out;
};

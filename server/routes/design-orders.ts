// Vercel serverless function: hiring a designer (Eyad, 14 Oct). A customer asks a gallery designer to
// design their page; the price depends on the package of the customer's page and the platform keeps
// its share (data/designerPricing.json). The customer pays the Weelink office, which holds the money
// until the customer confirms the design (the admin site's «طلبات التصميم»), and the customer and the
// designer talk only through the order, only once it is paid: no phone number, email or link may be
// sent in it, so the two do not leave the platform before the designer is paid.
//
//   POST /api/design-orders  { action, ... }  with  Authorization: Bearer <ID token>  (a confirmed email)
//     { action: 'quote' }                                      → { planId, price }
//     { action: 'create', designerUid, slideId?, brief }       → { id, price }          (customer)
//     { action: 'cancel', id }                                 → { status }             (customer, before paying)
//     { action: 'message', id, text }                          → { ok: true }           (the two, once paid)
//     { action: 'deliver', id }                                → { status: 'delivered' } (designer)
//     { action: 'confirm', id }                                → { status: 'confirmed' } (customer)
//     { action: 'dispute', id, reason }                        → { status: 'disputed' } (customer)
//     { action: 'rate', id, stars, text? }                     → { ok: true }           (customer, once, after confirming)
//
// Status: awaiting_payment → paid (the admin, after the office got the money) → delivered (designer) →
// confirmed (customer) → paid_out (the admin pays the designer their part). Also cancelled, disputed
// (the admin decides: pay the designer or refund) and refunded.
//   designOrders/{id}            the order; the customer and the designer read it, only the server writes it
//   designOrders/{id}/messages   the messages; the same two read them
// A confirmed order counts as a successful one for the designer (designers/{uid}.completed); the customer's
// rating (1–5, only on a confirmed order, once) adds to ratingCount/ratingSum, and `verified` («معتمد من
// Weelink») is recomputed from them each time, so it is withdrawn when the average falls (designerBadge.json).
// The customer's name and email are never in the order: the designer sees «زبون ABCD».
// Needs FIREBASE_SERVICE_ACCOUNT (the same one the other functions use).

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };
import pricing from '../../src/data/designerPricing.json' with { type: 'json' };
import { mailOffice, mailOrder } from '../orderMail.js';
import timers from '../../src/data/designOrderTimers.json' with { type: 'json' };
import badge from '../../src/data/designerBadge.json' with { type: 'json' };

const MAX_OPEN_UNPAID = 5;
const MIN_GAP_MS = 700;
const MAIL_GAP_MS = 30 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const TALKING = ['paid', 'delivered', 'confirmed', 'disputed'];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const firebaseAdmin = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  let account: { private_key?: string };
  try {
    account = JSON.parse(raw);
  } catch {
    console.error('FIREBASE_SERVICE_ACCOUNT is not valid JSON; paste the whole service-account file.');
    return null;
  }
  if (!account.private_key) return null;
  const app = getApps()[0] || initializeApp({ credential: cert(account as object), projectId: firebaseConfig.projectId });
  const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
  return { auth: getAuth(app), db: databaseId ? getFirestore(app, databaseId) : getFirestore(app) };
};

const validId = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(v);
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u0009\u000b-\u001f]/g, ' ').trim().slice(0, max) : '');

// The same check the designer's export runs on a slide's texts (src/utils/contactCheck.ts, kept in
// step with it): a phone number, an email, a link or an @name.
const toLatin = (s: string) => s.replace(/[٠-٩۰-۹]/g, (d) => String(d.charCodeAt(0) >= 0x06f0 ? d.charCodeAt(0) - 0x06f0 : d.charCodeAt(0) - 0x0660));
const EMAIL = /[a-z0-9._%+-]+\s*@\s*[a-z0-9.-]+\.[a-z]{2,}/i;
const URL_LIKE = /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|net|org|de|sy|info|io|me|app|co|tv|shop|store|ly|link|site|online)\b/i;
const HANDLE = /(^|\s)@[a-z0-9_.]{3,}/i;
const PHONE = /(\+|00)?[\d][\d\s().-]{5,}\d/;
const contactIn = (raw: string): string[] => {
  const t = toLatin(raw);
  const kinds: string[] = [];
  if (EMAIL.test(t)) kinds.push('email');
  if (URL_LIKE.test(t.replace(EMAIL, ' '))) kinds.push('link');
  if (HANDLE.test(t.replace(EMAIL, ' '))) kinds.push('handle');
  if ((t.match(PHONE)?.[0].replace(/\D/g, '') || '').length >= 7) kinds.push('phone');
  return kinds;
};

const isVerified = (st: { completed: number; ratingCount: number; ratingSum: number }) =>
  st.completed >= badge.minCompleted && st.ratingCount >= badge.minRatings && st.ratingSum / Math.max(1, st.ratingCount) >= badge.minAverage;

const FREE_PLAN = 'page-free';
const prices = pricing.prices as Record<string, number>;
const splitPrice = (price: number) => {
  const platform = Math.round(price * pricing.platformShare);
  return { designer: price - platform, platform };
};

// Confirming a delivered order: the order becomes `confirmed` and the designer's finished-orders count (and
// the badge) is worked out, in one transaction. Used by the customer's «استلمت التصميم» and by the daily sweep.
const confirmOrderTx = async (db: any, ref: any, designerUid: string, now: number, by: string) => {
  await db.runTransaction(async (tx: any) => {
    const dref = db.collection('designers').doc(designerUid);
    const fresh = (await tx.get(ref)).data() as Record<string, any> | undefined;
    if (!fresh || fresh.status !== 'delivered') throw new Error('bad_state');
    const d = ((await tx.get(dref)).data() || {}) as Record<string, any>;
    const st = { completed: (Number(d.completed) || 0) + 1, ratingCount: Number(d.ratingCount) || 0, ratingSum: Number(d.ratingSum) || 0 };
    tx.update(ref, { status: 'confirmed', updatedAt: now, confirmedAt: now, history: FieldValue.arrayUnion({ at: now, status: 'confirmed', by }) });
    tx.set(dref, { ...st, verified: isVerified(st) }, { merge: true });
  });
};

// An unpaid order is cancelled after `unpaidCancelDays`; a delivered one the customer never answered is
// confirmed by itself after `autoConfirmDays`, so a designer is not left unpaid by silence (a customer who
// has a problem opens a complaint, which stops the clock).
const sweepOrders = async (db: any, auth: any, now: number) => {
  const out = { cancelled: 0, confirmed: 0, reminded: 0, alerted: 0, failed: 0 };
  const note = (ref: any, text: string) => ref.collection('messages').add({ role: 'system', text, at: now });
  const unpaid = await db.collection('designOrders').where('status', '==', 'awaiting_payment').get();
  for (const d of unpaid.docs) {
    const o = d.data() as Record<string, any>;
    if (now - (Number(o.createdAt) || now) < timers.unpaidCancelDays * DAY) continue;
    try {
      await d.ref.update({ status: 'cancelled', updatedAt: now, cancelledAt: now, history: FieldValue.arrayUnion({ at: now, status: 'cancelled', by: 'system' }) });
      await note(d.ref, 'أُلغي الطلب تلقائياً لأنه لم يُدفع خلال المدة المحددة.');
      await mailOrder(auth, String(o.customerUid), 'cancelled_unpaid', d.id);
      out.cancelled++;
    } catch (e) {
      console.error('sweep cancel failed:', e);
      out.failed++;
    }
  }
  const delivered = await db.collection('designOrders').where('status', '==', 'delivered').get();
  for (const d of delivered.docs) {
    const o = d.data() as Record<string, any>;
    const age = now - (Number(o.deliveredAt) || now);
    if (age < timers.autoConfirmDays * DAY) {
      if (age >= (timers.autoConfirmDays - timers.reminderDaysBefore) * DAY && !o.reminded) {
        await d.ref.update({ reminded: now });
        await mailOrder(auth, String(o.customerUid), 'confirm_reminder', d.id);
        out.reminded++;
      }
      continue;
    }
    try {
      await confirmOrderTx(db, d.ref, String(o.designerUid), now, 'system');
      await note(d.ref, `مرّت ${timers.autoConfirmDays} أيام على التسليم دون ردّ، فاعتُبر الطلب مستلَماً. سيحوّل المكتب حصة المصمم.`);
      await mailOrder(auth, String(o.designerUid), 'auto_confirmed', d.id);
      await mailOrder(auth, String(o.customerUid), 'auto_confirmed', d.id);
      out.confirmed++;
    } catch (e) {
      console.error('sweep confirm failed:', e);
      out.failed++;
    }
  }
  // A complaint nobody answered for `disputeLateDays`: the office is told once.
  const disputed = await db.collection('designOrders').where('status', '==', 'disputed').get();
  for (const d of disputed.docs) {
    const o = d.data() as Record<string, any>;
    if (o.lateAlerted || now - (Number(o.disputedAt) || now) < timers.disputeLateDays * DAY) continue;
    await d.ref.update({ lateAlerted: now });
    await mailOffice(d.id, `شكوى على طلب تصميم مفتوحة منذ أكثر من ${timers.disputeLateDays} أيام. راجعها في «طلبات التصميم».`);
    out.alerted++;
  }
  return out;
};

export default {
  async fetch(request: Request): Promise<Response> {
    const admin = firebaseAdmin();
    if (request.method === 'GET') {
      // Vercel's daily cron: the orders that were left waiting (see designOrderTimers.json).
      const secret = process.env.CRON_SECRET;
      if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return json({ error: 'unauthorized' }, 401);
      if (!admin) return json({ error: 'not_configured' }, 503);
      return json(await sweepOrders(admin.db, admin.auth, Date.now()));
    }
    if (request.method !== 'POST') return json({ error: 'method' }, 405);
    if (!admin) return json({ error: 'not_configured' }, 503);

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'bad_request' }, 400);
    }
    const action = String(body.action || '');
    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const user = token ? await admin.auth.verifyIdToken(token).catch(() => null) : null;
    if (!user) return json({ error: 'unauthorized' }, 401);
    if (!user.email_verified) return json({ error: 'unverified' }, 403);
    const { db } = admin;
    const now = Date.now();

    // The package of the customer's page decides the price: the subscription the office recorded, or the free page.
    const planOf = async (uid: string) => {
      const sub = (await db.collection('platform_subscribers').doc(uid).get()).data() as { subscription?: { plan?: string } } | undefined;
      const plan = String(sub?.subscription?.plan || '');
      return plan && prices[plan] !== undefined ? plan : FREE_PLAN;
    };

    if (action === 'quote') {
      const planId = await planOf(user.uid);
      return json({ planId, price: prices[planId] });
    }

    if (action === 'create') {
      const designerUid = body.designerUid;
      const brief = text(body.brief, 1000);
      if (!validId(designerUid) || brief.length < 10) return json({ error: 'bad_request' }, 400);
      if (designerUid === user.uid) return json({ error: 'own' }, 400);
      if (contactIn(brief).length) return json({ error: 'contact', kinds: contactIn(brief) }, 400);
      const designer = (await db.collection('designers').doc(designerUid).get()).data() as { name?: string } | undefined;
      if (!designer) return json({ error: 'no_designer' }, 404);
      const open = await db.collection('designOrders').where('customerUid', '==', user.uid).where('status', '==', 'awaiting_payment').select().get();
      if (open.size >= MAX_OPEN_UNPAID) return json({ error: 'too_many' }, 429);
      let slideName = '';
      let slideId = '';
      if (body.slideId !== undefined && body.slideId !== '') {
        if (!validId(body.slideId)) return json({ error: 'bad_request' }, 400);
        const slide = (await db.collection('gallerySlides').doc(body.slideId).get()).data();
        if (!slide || slide.status !== 'approved' || slide.designerUid !== designerUid) return json({ error: 'no_slide' }, 404);
        slideId = body.slideId;
        slideName = String(slide.name || '').slice(0, 60);
      }
      const planId = await planOf(user.uid);
      const price = prices[planId];
      const split = splitPrice(price);
      const ref = db.collection('designOrders').doc();
      await ref.set({
        customerUid: user.uid, customerAlias: `زبون ${ref.id.slice(0, 4).toUpperCase()}`,
        designerUid, designerName: String(designer.name || '').slice(0, 60), slideId, slideName,
        planId, price, designerShare: split.designer, platformShare: split.platform,
        status: 'awaiting_payment', brief, createdAt: now, updatedAt: now,
        history: [{ at: now, status: 'awaiting_payment', by: 'customer' }],
      });
      return json({ id: ref.id, price });
    }

    // The rest work on an order the caller is part of.
    const id = body.id;
    if (!validId(id)) return json({ error: 'bad_request' }, 400);
    const ref = db.collection('designOrders').doc(id);
    const system = (t: string) => ref.collection('messages').add({ role: 'system', text: t, at: now });
    const step = (status: string, by: string, extra: Record<string, unknown> = {}) =>
      ref.update({ status, updatedAt: now, history: FieldValue.arrayUnion({ at: now, status, by }), ...extra });

    try {
      const order = (await ref.get()).data() as Record<string, any> | undefined;
      if (!order) return json({ error: 'not_found' }, 404);
      const isCustomer = order.customerUid === user.uid;
      const isDesigner = order.designerUid === user.uid;
      if (!isCustomer && !isDesigner) return json({ error: 'not_found' }, 404);

      if (action === 'cancel') {
        if (!isCustomer || order.status !== 'awaiting_payment') return json({ error: 'bad_state' }, 409);
        await step('cancelled', 'customer', { cancelledAt: now });
        return json({ status: 'cancelled' });
      }

      if (action === 'message') {
        const msg = text(body.text, 1000);
        if (!msg) return json({ error: 'bad_request' }, 400);
        if (!TALKING.includes(order.status)) return json({ error: 'not_paid' }, 409);
        const kinds = contactIn(msg);
        if (kinds.length) return json({ error: 'contact', kinds }, 400);
        const role = isCustomer ? 'customer' : 'designer';
        if (now - (Number(order.lastMessage?.[role]) || 0) < MIN_GAP_MS) return json({ error: 'too_fast' }, 429);
        await ref.collection('messages').add({ role, text: msg, at: now });
        await ref.update({ updatedAt: now, [`lastMessage.${role}`]: now });
        // One mail per half hour to the other side, so a long chat is not a stream of emails.
        const other = isCustomer ? order.designerUid : order.customerUid;
        if (now - (Number(order.lastMail?.[other]) || 0) > MAIL_GAP_MS) {
          await ref.update({ [`lastMail.${other}`]: now });
          await mailOrder(admin.auth, other, 'new_message', id);
        }
        return json({ ok: true });
      }

      if (action === 'deliver') {
        if (!isDesigner || order.status !== 'paid') return json({ error: 'bad_state' }, 409);
        await step('delivered', 'designer', { deliveredAt: now });
        await system('سلّم المصمم العمل. راجع صفحتك ثم اضغط «استلمت التصميم» ليصل المبلغ للمصمم، أو «لدي مشكلة» إن كان فيه ما يحتاج حلاً.');
        await mailOrder(admin.auth, order.customerUid, 'delivered', id);
        return json({ status: 'delivered' });
      }

      if (action === 'confirm') {
        if (!isCustomer || order.status !== 'delivered') return json({ error: 'bad_state' }, 409);
        await confirmOrderTx(db, ref, order.designerUid, now, 'customer');
        await system('أكّد الزبون استلام التصميم. سيحوّل المكتب حصة المصمم.');
        await mailOrder(admin.auth, order.designerUid, 'confirmed', id);
        return json({ status: 'confirmed' });
      }

      if (action === 'dispute') {
        const reason = text(body.reason, 500);
        if (!isCustomer || !['paid', 'delivered'].includes(order.status) || reason.length < 5) return json({ error: 'bad_state' }, 409);
        await step('disputed', 'customer', { disputedAt: now, disputeReason: reason });
        await system('فتح الزبون شكوى على الطلب. سيراجعه فريق Weelink ويقرر.');
        await mailOrder(admin.auth, order.designerUid, 'disputed', id);
        return json({ status: 'disputed' });
      }

      if (action === 'rate') {
        const stars = Number(body.stars);
        const comment = text(body.text, 500);
        if (!isCustomer || !['confirmed', 'paid_out'].includes(order.status)) return json({ error: 'bad_state' }, 409);
        if (!Number.isInteger(stars) || stars < 1 || stars > 5) return json({ error: 'bad_request' }, 400);
        const kinds = contactIn(comment);
        if (kinds.length) return json({ error: 'contact', kinds }, 400);
        await db.runTransaction(async (tx) => {
          const dref = db.collection('designers').doc(order.designerUid);
          const fresh = (await tx.get(ref)).data() as Record<string, any> | undefined;
          if (!fresh || fresh.rating) throw new Error('rated');
          const d = ((await tx.get(dref)).data() || {}) as Record<string, any>;
          const st = { completed: Number(d.completed) || 0, ratingCount: (Number(d.ratingCount) || 0) + 1, ratingSum: (Number(d.ratingSum) || 0) + stars };
          tx.update(ref, { rating: { stars, text: comment, at: now }, updatedAt: now });
          tx.set(dref, { ...st, verified: isVerified(st) }, { merge: true });
        });
        return json({ ok: true });
      }

      return json({ error: 'unknown_action' }, 400);
    } catch (e) {
      if (e instanceof Error && e.message === 'rated') return json({ error: 'rated' }, 409);
      if (e instanceof Error && e.message === 'bad_state') return json({ error: 'bad_state' }, 409);
      console.error('design order failed:', e);
      return json({ error: 'failed' }, 500);
    }
  },
};

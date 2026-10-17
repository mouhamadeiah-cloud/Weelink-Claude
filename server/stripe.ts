// Paying an invoice online with Stripe (Eyad, 17 Oct): cards, and PayPal, Apple/Google Pay or a SEPA
// transfer when they are switched on in the Stripe dashboard. Ready but off: nothing shows until these
// are set in Cloudflare (Settings → Variables and Secrets):
//   STRIPE_SECRET_KEY      sk_live_… (or sk_test_… to try it)
//   STRIPE_WEBHOOK_SECRET  whsec_… of the webhook pointing at /api/admin?stripe=webhook
//   STRIPE_RATE            how many Syrian pounds one unit of STRIPE_CURRENCY is (11000 for one euro, say)
//   STRIPE_CURRENCY        eur (the default) or usd
// The invoice stays in pounds; Stripe is asked for the same amount in the currency at that rate.
//
//   1. The customer picks «دفع إلكتروني» in Checkout: order-card makes a Stripe Checkout page for the
//      order and the browser goes there.
//   2. Stripe tells us when the money is in (checkout.session.completed, or async_payment_succeeded for a
//      bank transfer that clears later). The webhook checks Stripe's signature and the amount, then
//      approves the order as the team would (server/billing.ts approveOrder), so the project can publish
//      at once and the customer gets the invoice email.
import { ADMIN_EMAIL_DEFAULT, approveOrder, sendMail } from './billing.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = any;

const API = 'https://api.stripe.com/v1';
const TOLERANCE = 300; // seconds a signed event may be old

export const stripeConfig = () => {
  const key = process.env.STRIPE_SECRET_KEY || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  const rate = Number(process.env.STRIPE_RATE);
  const currency = (process.env.STRIPE_CURRENCY || 'eur').toLowerCase();
  if (!key || !webhookSecret || !(rate > 0) || !/^[a-z]{3}$/.test(currency)) return null;
  return { key, webhookSecret, rate, currency };
};

/** The invoice's pounds in the currency's smallest unit (cents), never under Stripe's 0.50 minimum. */
export const amountFor = (pounds: number, rate: number) => Math.max(50, Math.round((pounds / rate) * 100));

const form = (data: Record<string, string>) => new URLSearchParams(data).toString();

// Only an address of our own site may be the page the customer comes back to.
const backTo = (raw: unknown, origin: string) => {
  try {
    const u = new URL(String(raw || ''), origin);
    return u.origin === origin ? u : new URL('/', origin);
  } catch {
    return new URL('/', origin);
  }
};
const withParam = (u: URL, value: string) => {
  const next = new URL(u.toString());
  next.searchParams.set('stripe', value);
  return next.toString();
};

type User = { uid: string; email?: string };

/** A Stripe Checkout page for one of the customer's open invoices; returns its address. */
export const createCheckout = async (db: Db, user: User, body: Record<string, unknown>, origin: string) => {
  const cfg = stripeConfig();
  if (!cfg) return { error: 'online-off', status: 503 };
  const id = String(body.id || '').slice(0, 64);
  const ref = db.collection('platform_orders').doc(id);
  const snap = await ref.get();
  const o = snap.exists ? snap.data() : null;
  if (!o || o.uid !== user.uid) return { error: 'not-found', status: 404 };
  if (!['unpaid', 'rejected', 'attached'].includes(String(o.status))) return { error: 'bad-state', status: 409 };
  const amount = amountFor(Number(o.total) || 0, cfg.rate);
  const back = backTo(body.returnUrl, origin);
  const res = await fetch(`${API}/checkout/sessions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.key}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': `${id}-${amount}-${o.updatedAt || 0}` },
    body: form({
      mode: 'payment',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': cfg.currency,
      'line_items[0][price_data][unit_amount]': String(amount),
      'line_items[0][price_data][product_data][name]': `Weelink · ${o.planName || o.plan} · ${o.siteName || o.project}`,
      client_reference_id: id,
      'metadata[orderId]': id,
      'metadata[amount]': String(amount),
      'payment_intent_data[metadata][orderId]': id,
      ...(user.email || o.email ? { customer_email: String(user.email || o.email) } : {}),
      success_url: withParam(back, 'ok'),
      cancel_url: withParam(back, 'cancel'),
    }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) return { error: 'stripe-refused', status: 502 };
  await ref.set({ stripeSession: String(data.id || ''), updatedAt: Date.now() }, { merge: true });
  return { url: String(data.url) };
};

const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');

/** Stripe's Stripe-Signature header: t=<seconds>,v1=<HMAC-SHA256 of "t.body">, checked in constant time. */
export const verifySignature = async (payload: string, header: string, secret: string, now = Date.now()) => {
  const parts = header.split(',').map((p) => p.split('='));
  const t = Number(parts.find(([k]) => k === 't')?.[1]);
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || !sigs.length || Math.abs(now / 1000 - t) > TOLERANCE) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const want = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`)));
  return sigs.some((s) => s.length === want.length && [...s].reduce((d, c, i) => d | (c.charCodeAt(0) ^ want.charCodeAt(i)), 0) === 0);
};

/**
 * Stripe's event. A paid Checkout page approves its order; anything else is acknowledged and ignored, and
 * an order already paid stays as it is (Stripe may send the same event twice).
 */
export const handleWebhook = async (db: Db, payload: string, signature: string, invoiceUrl: (paymentId: string, key: string) => string) => {
  const cfg = stripeConfig();
  if (!cfg) return { status: 503, body: { error: 'online-off' } };
  if (!(await verifySignature(payload, signature, cfg.webhookSecret))) return { status: 400, body: { error: 'bad-signature' } };
  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    return { status: 400, body: { error: 'bad-request' } };
  }
  const type = String(event?.type || '');
  const s = event?.data?.object || {};
  const paid = (type === 'checkout.session.completed' && s.payment_status === 'paid') || type === 'checkout.session.async_payment_succeeded';
  if (!paid) return { status: 200, body: { ignored: type } };
  const id = String(s.metadata?.orderId || s.client_reference_id || '');
  const ref = db.collection('platform_orders').doc(id);
  const snap = id ? await ref.get() : null;
  const o = snap?.exists ? snap.data() : null;
  if (o?.status === 'paid') return { status: 200, body: { already: true } };
  const money = `${(Number(s.amount_total) / 100).toFixed(2)} ${String(s.currency || '').toUpperCase()}`;
  // Money came in that can't approve an invoice by itself (the invoice was replaced, or the amount is off):
  // the team gets an email and settles it by hand in «طلبات الدفع» or in Stripe.
  const tellTeam = async (why: string) => {
    await sendMail(process.env.ADMIN_EMAIL || ADMIN_EMAIL_DEFAULT, 'دفعة إلكترونية تحتاج مراجعة', `<p dir="rtl">وصلت دفعة ${money} عن طريق Stripe للطلب <b dir="ltr">${id || '—'}</b> وما تأكدت تلقائياً (${why}). راجعها بموقع الإدارة ← «طلبات الدفع» أو بـ Stripe.</p>`);
    return { status: 200, body: { ignored: why } };
  };
  if (!o) return tellTeam('الطلب مو موجود');
  // The money that came in must be the invoice's, at the rate the page was made with.
  if (String(s.currency || '').toLowerCase() !== cfg.currency || !(Number(s.amount_total) >= Number(s.metadata?.amount))) return tellTeam('المبلغ مختلف');
  await ref.set({ way: 'online', transferNo: String(s.payment_intent || s.id || '').slice(0, 60), updatedAt: Date.now() }, { merge: true });
  const r: any = await approveOrder(db, id, 'stripe', invoiceUrl);
  return r.error ? tellTeam(r.error === 'bad-state' ? 'الفاتورة انلغت أو تغيّرت' : r.error) : { status: 200, body: { approved: id } };
};


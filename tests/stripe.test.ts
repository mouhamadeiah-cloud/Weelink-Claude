import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { store, getFirestore } from './fakeAdmin.ts';
import { sent } from './mailRecorder.ts';
import { createOrder } from '../server/billing.ts';
import { amountFor, createCheckout, handleWebhook, verifySignature } from '../server/stripe.ts';

const db = getFirestore();
const user = { uid: 's1', email: 's1@x.de', name: 'إياد' };
const link = (id: string, key: string) => `https://x/inv/${id}/${key}`;
const SECRET = 'whsec_test';

// Stripe's Checkout Sessions API, answered from memory.
const posted: URLSearchParams[] = [];
globalThis.fetch = (async (url: string, init: RequestInit = {}) => {
  assert.equal(new URL(url).pathname, '/v1/checkout/sessions');
  posted.push(new URLSearchParams(String(init.body)));
  return new Response(JSON.stringify({ id: 'cs_1', url: 'https://checkout.stripe.com/c/pay/cs_1' }), { status: 200 });
}) as typeof fetch;

const sign = (payload: string, t = Math.floor(Date.now() / 1000)) => `t=${t},v1=${createHmac('sha256', SECRET).update(`${t}.${payload}`).digest('hex')}`;
const event = (type: string, object: Record<string, unknown>) => JSON.stringify({ id: 'evt_1', type, data: { object } });

test('stripe: off until its keys are set', async () => {
  delete process.env.STRIPE_SECRET_KEY;
  assert.equal((await createCheckout(db, user, { id: 'x' }, 'https://weelink.de') as any).error, 'online-off');
  assert.equal((await handleWebhook(db, '{}', '', link)).status, 503);
});

test('stripe: signature', async () => {
  const body = '{"a":1}';
  assert.ok(await verifySignature(body, sign(body), SECRET));
  assert.ok(!(await verifySignature(body + ' ', sign(body), SECRET)), 'changed body');
  assert.ok(!(await verifySignature(body, sign(body), 'whsec_other')), 'other secret');
  assert.ok(!(await verifySignature(body, sign(body, Math.floor(Date.now() / 1000) - 600), SECRET)), 'too old');
  assert.ok(!(await verifySignature(body, '', SECRET)));
  assert.equal(amountFor(299000, 11000), 2718);
  assert.equal(amountFor(100, 11000), 50, "Stripe's minimum");
});

test('stripe: checkout page → paid event approves the order once', async () => {
  Object.assign(process.env, { STRIPE_SECRET_KEY: 'sk_test_1', STRIPE_WEBHOOK_SECRET: SECRET, STRIPE_RATE: '11000' });
  store.set('designs/s1', { profile: {} });
  const { order }: any = await createOrder(db, user, { project: 'shop', plan: 'shop-30', period: 'monthly', siteName: 'nour' });

  assert.equal((await createCheckout(db, { uid: 'other' }, { id: order.id }, 'https://weelink.de') as any).error, 'not-found', "someone else's invoice");
  const c: any = await createCheckout(db, user, { id: order.id, returnUrl: 'https://evil.com/x' }, 'https://weelink.de');
  assert.equal(c.url, 'https://checkout.stripe.com/c/pay/cs_1');
  const p = posted.at(-1)!;
  const cents = amountFor(order.total, 11000);
  assert.equal(p.get('line_items[0][price_data][unit_amount]'), String(cents));
  assert.equal(p.get('line_items[0][price_data][currency]'), 'eur');
  assert.equal(p.get('metadata[orderId]'), order.id);
  assert.equal(p.get('success_url'), 'https://weelink.de/?stripe=ok', 'only our own site to come back to');

  const paid = (extra: Record<string, unknown> = {}) => event('checkout.session.completed', {
    id: 'cs_1', payment_status: 'paid', payment_intent: 'pi_1', currency: 'eur', amount_total: cents, metadata: { orderId: order.id, amount: String(cents) }, ...extra,
  });
  const forged = paid();
  assert.equal((await handleWebhook(db, forged, 'bad', link)).status, 400);
  assert.equal(store.get(`platform_orders/${order.id}`).status, 'unpaid');

  // A SEPA transfer that hasn't cleared yet does nothing.
  const pending = paid({ payment_status: 'unpaid' });
  assert.deepEqual((await handleWebhook(db, pending, sign(pending), link)).body, { ignored: 'checkout.session.completed' });

  const ok = paid();
  const r = await handleWebhook(db, ok, sign(ok), link);
  assert.deepEqual(r.body, { approved: order.id });
  const o = store.get(`platform_orders/${order.id}`);
  assert.equal(o.status, 'paid');
  assert.equal(o.way, 'online');
  assert.equal(store.get(`platform_payments/${o.paymentId}`).method, 'online');
  assert.ok(store.get('projectAccess/s1__shop').paidUntil > Date.now());
  assert.ok(sent.some((m) => m.startsWith('s1@x.de:')), 'the customer got the invoice mail');

  assert.deepEqual((await handleWebhook(db, ok, sign(ok), link)).body, { already: true }, 'Stripe sends it again');
});

test('stripe: money that does not match goes to the team', async () => {
  const { order }: any = await createOrder(db, user, { project: 'shop', plan: 'shop-60', period: 'monthly' });
  const cents = amountFor(order.total, 11000);
  const low = event('checkout.session.completed', { payment_status: 'paid', currency: 'eur', amount_total: cents - 100, metadata: { orderId: order.id, amount: String(cents) } });
  const before = sent.length;
  assert.deepEqual((await handleWebhook(db, low, sign(low), link)).body, { ignored: 'المبلغ مختلف' });
  assert.equal(store.get(`platform_orders/${order.id}`).status, 'unpaid');
  assert.ok(sent.slice(before).some((m) => m.includes('دفعة إلكترونية تحتاج مراجعة')));

  // The invoice was replaced after the page was made: paid, but not approved by itself.
  await createOrder(db, user, { project: 'shop', plan: 'shop-30', period: 'yearly' });
  const late = event('checkout.session.completed', { payment_status: 'paid', currency: 'eur', amount_total: cents, metadata: { orderId: order.id, amount: String(cents) } });
  assert.deepEqual((await handleWebhook(db, late, sign(late), link)).body, { ignored: 'الفاتورة انلغت أو تغيّرت' });
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../server/design-orders.ts';
import { store, tokens } from './fakeAdmin.ts';
import { sent } from './mailRecorder.ts';
import { recountDesigner } from '../server/designerStats.ts';
import { getFirestore } from './fakeAdmin.ts';

tokens['tc'] = { uid: 'cust', email_verified: true };
tokens['td'] = { uid: 'desg', email_verified: true };
tokens['tu'] = { uid: 'unv', email_verified: false };
tokens['tx'] = { uid: 'other', email_verified: true };
store.set('designers/desg', { name: 'سارة' });
store.set('designers/cust', { name: 'عميل مصمم' });
store.set('gallerySlides/sl1', { status: 'approved', designerUid: 'desg', name: 'واجهة' });
store.set('platform_subscribers/cust', { subscription: { plan: 'restaurant-60' } });

const call = async (tok: string, body: any) => { const r = await handler.fetch(new Request('http://x/api/design-orders', { method: 'POST', headers: { authorization: `Bearer ${tok}` }, body: JSON.stringify(body) })); return { s: r.status, ...(await r.json()) }; };
process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ private_key: 'x' });
const results: [string, boolean, any][] = [];
const check = (label: string, cond: boolean, extra: any = '') => { results.push([label, cond, extra]); };

check('no token → 401', (await call('zz', { action: 'quote' })).s === 401);
check('unverified → 403', (await call('tu', { action: 'quote' })).s === 403);
const q = await call('tc', { action: 'quote' }); check('quote uses the subscription plan (899000)', q.price === 899000 && q.planId === 'restaurant-60', q);
const qx = await call('tx', { action: 'quote' }); check('no subscription → free page price (199000)', qx.price === 199000, qx);

check('own order refused', (await call('td', { action: 'create', designerUid: 'desg', brief: 'أريد صفحة لمطعمي' })).error === 'own');
check('contact in the brief refused', (await call('tc', { action: 'create', designerUid: 'desg', brief: 'كلمني على 0933123456 لو سمحت' })).error === 'contact');
check('short brief refused', (await call('tc', { action: 'create', designerUid: 'desg', brief: 'قصير' })).error === 'bad_request');
check('unknown designer', (await call('tc', { action: 'create', designerUid: 'nobody', brief: 'أريد صفحة لمطعمي' })).error === 'no_designer');
check('slide of another designer refused', (await call('tx', { action: 'create', designerUid: 'cust', slideId: 'sl1', brief: 'أريد صفحة لمطعمي' })).error === 'no_slide');
const c = await call('tc', { action: 'create', designerUid: 'desg', slideId: 'sl1', brief: 'أريد صفحة لمطعم بألوان دافئة' });
check('create ok at the plan price', c.s === 200 && c.price === 899000, c);
const orderPath = [...store.keys()].find((k) => /^designOrders\/[^/]+$/.test(k))!;
const id = orderPath.split('/')[1];
const o = store.get(orderPath);
check('split 70/30', o.designerShare === 629300 && o.platformShare === 269700 && o.designerShare + o.platformShare === o.price, o);
check('order keeps no customer email/name', !('customerEmail' in o) && o.customerAlias.startsWith('زبون '), o);

check('message before payment refused', (await call('tc', { action: 'message', id, text: 'مرحبا' })).error === 'not_paid');
check('stranger sees not_found', (await call('tx', { action: 'message', id, text: 'مرحبا' })).error === 'not_found');
check('designer cannot deliver unpaid', (await call('td', { action: 'deliver', id })).error === 'bad_state');
// the admin marks it paid (done by api/admin.ts): emulate its write
store.set(orderPath, { ...o, status: 'paid' });
check('message after payment ok', (await call('tc', { action: 'message', id, text: 'أريد اللون الأخضر' })).ok === true);
check('contact in message refused (phone)', (await call('td', { action: 'message', id, text: 'اتصل بي 0933 123 456' })).error === 'contact');
check('contact in message refused (arabic digits)', (await call('td', { action: 'message', id, text: 'رقمي ٠٩٣٣١٢٣٤٥٦٧' })).error === 'contact');
check('contact in message refused (link)', (await call('td', { action: 'message', id, text: 'شوف www.mysite.com' })).error === 'contact');
check('too fast refused', (await call('tc', { action: 'message', id, text: 'ثاني' })).error === 'too_fast');
check('price in text is not contact', (await call('td', { action: 'message', id, text: 'السعر 25000 ل.س للشريحة' })).ok === true);
check('customer cannot deliver', (await call('tc', { action: 'deliver', id })).error === 'bad_state');
check('designer delivers', (await call('td', { action: 'deliver', id })).status === 'delivered');
check('designer cannot confirm', (await call('td', { action: 'confirm', id })).error === 'bad_state');
check('customer confirms', (await call('tc', { action: 'confirm', id })).status === 'confirmed');
check('no dispute after confirm', (await call('tc', { action: 'dispute', id, reason: 'سبب طويل كفاية' })).error === 'bad_state');
const msgs = [...store.entries()].filter(([k]) => k.startsWith(`designOrders/${id}/messages/`)).map(([, v]) => v);
check('system messages written (deliver, confirm) and 2 chat messages', msgs.filter((m) => m.role === 'system').length === 2 && msgs.filter((m) => m.role !== 'system').length === 2, msgs);
const h = store.get(orderPath).history.map((x: any) => x.status).join('>');
check('history awaiting_payment>delivered>confirmed (paid was the admin\'s)', h === 'awaiting_payment>delivered>confirmed', h);

// a second order: cancel, dispute, limit
const c2 = await call('tc', { action: 'create', designerUid: 'desg', brief: 'طلب ثاني لصفحة' }); const id2 = c2.id;
check('cancel before paying', (await call('tc', { action: 'cancel', id: id2 })).status === 'cancelled');
check('cannot cancel twice', (await call('tc', { action: 'cancel', id: id2 })).error === 'bad_state');
for (let i = 0; i < 5; i++) await call('tc', { action: 'create', designerUid: 'desg', brief: 'طلب رقم ' + i + ' لصفحة' });
check('sixth unpaid refused', (await call('tc', { action: 'create', designerUid: 'desg', brief: 'طلب سادس لصفحة' })).error === 'too_many');
// dispute path on a paid order
const c3 = await call('tx', { action: 'create', designerUid: 'desg', brief: 'طلب للشكوى لصفحة' });
const p3 = `designOrders/${c3.id}`; store.set(p3, { ...store.get(p3), status: 'paid' });
check('dispute needs a reason', (await call('tx', { action: 'dispute', id: c3.id, reason: 'x' })).error === 'bad_state');
check('customer disputes a paid order', (await call('tx', { action: 'dispute', id: c3.id, reason: 'لم يلتزم بالألوان المتفق عليها' })).status === 'disputed');
check('can still talk while disputed', (await call('td', { action: 'message', id: c3.id, text: 'سأعدّل الألوان اليوم' })).ok === true);

// ratings and the badge
check('no rating before confirm', (await call('tx', { action: 'rate', id: c3.id, stars: 5 })).error === 'bad_state');
check('designer stats after one confirm', store.get('designers/desg').completed === 1 && store.get('designers/desg').verified === false, store.get('designers/desg'));
check('designer cannot rate', (await call('td', { action: 'rate', id, stars: 5 })).error === 'bad_state');
check('stars out of range', (await call('tc', { action: 'rate', id, stars: 6 })).error === 'bad_request');
check('contact in rating text refused', (await call('tc', { action: 'rate', id, stars: 5, text: 'اتصل 0933123456' })).error === 'contact');
check('rate ok', (await call('tc', { action: 'rate', id, stars: 5, text: 'ممتاز' })).ok === true);
check('rate twice refused', (await call('tc', { action: 'rate', id, stars: 1 })).error === 'rated');
check('stats updated', store.get('designers/desg').ratingCount === 1 && store.get('designers/desg').ratingSum === 5);
// nine more finished orders by other customers, rated 5 / 5 / 5 / 5 → badge
let last = '';
for (let i = 0; i < 9; i++) {
  tokens['k' + i] = { uid: 'k' + i, email_verified: true };
  const o2 = await call('k' + i, { action: 'create', designerUid: 'desg', brief: 'طلب جديد لصفحة رقم ' + i });
  store.set('designOrders/' + o2.id, { ...store.get('designOrders/' + o2.id), status: 'delivered' });
  await call('k' + i, { action: 'confirm', id: o2.id });
  last = o2.id;
  if (i < 4) await call('k' + i, { action: 'rate', id: o2.id, stars: 5 });
}
let d = store.get('designers/desg');
check('10 completed, 5 ratings avg 5 → verified', d.completed === 10 && d.ratingCount === 5 && d.verified === true, d);
// bad ratings pull the average under 4.5 → withdrawn
await call('k8', { action: 'rate', id: last, stars: 1 });
d = store.get('designers/desg');
check('a low rating that drops the average below 4.5 withdraws the badge', d.ratingCount === 6 && d.verified === false, d);

// the daily sweep
process.env.CRON_SECRET = 'cs';
const sweep = async (auth?: string) => { const r = await handler.fetch(new Request('http://x', { method: 'GET', headers: auth ? { authorization: auth } : {} })); return { s: r.status, ...(await r.json()) }; };
check('sweep needs the cron secret', (await sweep()).s === 401 && (await sweep('Bearer no')).s === 401);
const DAYMS = 86400000;
store.set('designOrders/u_old', { status: 'awaiting_payment', createdAt: Date.now() - 4 * DAYMS, designerUid: 'desg', customerUid: 'cust' });
store.set('designOrders/u_new', { status: 'awaiting_payment', createdAt: Date.now() - 1 * DAYMS, designerUid: 'desg', customerUid: 'cust' });
store.set('designOrders/d_old', { status: 'delivered', deliveredAt: Date.now() - 8 * DAYMS, designerUid: 'desg', customerUid: 'cust' });
store.set('designOrders/d_new', { status: 'delivered', deliveredAt: Date.now() - 2 * DAYMS, designerUid: 'desg', customerUid: 'cust' });
store.set('designOrders/x_disp', { status: 'disputed', designerUid: 'desg', customerUid: 'cust' });
const before = store.get('designers/desg').completed;
const sw = await sweep('Bearer cs');
check('sweep cancels only the old unpaid one', store.get('designOrders/u_old').status === 'cancelled' && store.get('designOrders/u_new').status === 'awaiting_payment', sw);
check('sweep confirms only the old delivered one and counts it', store.get('designOrders/d_old').status === 'confirmed' && store.get('designOrders/d_new').status === 'delivered' && store.get('designers/desg').completed === before + 1, sw);
check('a disputed order is left alone', store.get('designOrders/x_disp').status === 'disputed');
check('history says system', store.get('designOrders/d_old').history?.at(-1)?.by === 'system');
const sw2 = await sweep('Bearer cs');
check('second sweep changes nothing', sw2.cancelled === 0 && sw2.confirmed === 0, sw2);

// mails
check('delivered mails the customer', sent.includes('cust:delivered'), sent);
check('confirm mails the designer', sent.includes('desg:confirmed'));
check('dispute mails the designer', sent.includes('desg:disputed'));
check('first chat message mails the other side once (throttled)', sent.filter((x) => x === 'desg:new_message').length === 1 || sent.filter((x) => x === 'cust:new_message').length === 1, sent);
sent.length = 0;
store.set('designOrders/r1', { status: 'delivered', deliveredAt: Date.now() - 5.5 * DAYMS, designerUid: 'desg', customerUid: 'cust' });
store.set('designOrders/dl', { status: 'disputed', disputedAt: Date.now() - 3 * DAYMS, designerUid: 'desg', customerUid: 'cust' });
const s3 = await sweep('Bearer cs');
check('reminder 2 days before auto-confirm, once', s3.reminded === 1 && sent.includes('cust:confirm_reminder') && store.get('designOrders/r1').status === 'delivered', [s3, sent]);
check('late complaint alerts the office once', s3.alerted >= 1 && sent.some((x) => x.startsWith('office:')), [s3, sent]);
sent.length = 0;
const s4 = await sweep('Bearer cs');
check('no repeated reminder/alert', s4.reminded === 0 && s4.alerted === 0 && sent.length === 0, [s4, sent]);

// recount from the orders
const db = getFirestore() as any;
let st = await recountDesigner(db, 'desg');
const done = [...store.entries()].filter(([k, v]) => /^designOrders\/[^/]+$/.test(k) && v.designerUid === 'desg' && ['confirmed', 'paid_out'].includes(v.status)).length;
check('recount = orders that ended well', st.completed === done, [st, done]);
const stored = store.get('designers/desg');
check('recount writes the same numbers to the designer', stored.completed === st.completed && stored.ratingCount === st.ratingCount && stored.verified === st.verified);
// a refund after confirm takes the order (and its rating) out
const victim = [...store.entries()].find(([k, v]) => /^designOrders\/[^/]+$/.test(k) && v.designerUid === 'desg' && v.status === 'confirmed' && v.rating);
store.set(victim![0], { ...victim![1], status: 'refunded' });
const st2 = await recountDesigner(db, 'desg');
check('refund lowers completed and ratings', st2.completed === st.completed - 1 && st2.ratingCount === st.ratingCount - 1, [st, st2]);
// a disputed order the office ruled for the designer (paid_out) counts
store.set('designOrders/x_disp', { ...store.get('designOrders/x_disp'), status: 'paid_out' });
const st3 = await recountDesigner(db, 'desg');
check('a complaint paid out to the designer counts', st3.completed === st2.completed + 1, [st2, st3]);
check('recount is idempotent', JSON.stringify(await recountDesigner(db, 'desg')) === JSON.stringify(st3));


// payment instructions
check('quote has no payment text until the office writes it', (await call('tc', { action: 'quote' })).paymentInfo === '');
store.set('platformSettings/paymentInfo', { text: 'حوّل إلى الحساب 123 واذكر رقم الطلب', updatedAt: 1, updatedBy: 'admin' });
check('quote carries the office payment text', (await call('tc', { action: 'quote' })).paymentInfo === 'حوّل إلى الحساب 123 واذكر رقم الطلب');
for (const [label, ok, extra] of results) test(label, () => assert.ok(ok, JSON.stringify(extra)));

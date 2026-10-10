// Vercel serverless function: a restaurant customer's order confirmation and its status page.
//
//   POST /api/order-status  { r: <restaurant uid>, o: <order id> }  with  Authorization: Bearer <ID token>
//        → emails the order's confirmation to the signed-in customer who placed it, once, with a link
//          to the order's status page                                → { sent: true } | { skipped: true }
//   GET  /api/order-status?r=<uid>&o=<order id>&k=<key>
//        → the order's status, dishes and totals for that page (no name, phone or address)
//
// The key in the link is an HMAC of the restaurant and the order made with the service account's
// private key, so nobody can open another order's page by guessing. The orders themselves stay
// closed to browsers (firestore.rules); this function reads them with the admin SDK.
// Needs FIREBASE_SERVICE_ACCOUNT, EMAIL_FROM and RESEND_API_KEY, as /api/email-code does.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

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
  return {
    auth: getAuth(app),
    db: databaseId ? getFirestore(app, databaseId) : getFirestore(app),
    secret: account.private_key,
  };
};

const linkKey = (secret: string, r: string, o: string) => createHmac('sha256', secret).update(`order-status:${r}:${o}`).digest('hex').slice(0, 32);

const sameKey = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

const validId = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(v);

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const money = (n: unknown, currency: string) => `${Number(n || 0).toLocaleString('en-US')} ${currency}`;

const TYPE_LABELS: Record<string, string> = { delivery: 'توصيل', pickup: 'استلام من المطعم', table: 'على الطاولة' };

const mailHtml = (o: any, restaurant: string, currency: string, link: string) => `<!doctype html>
<html lang="ar" dir="rtl"><body style="font-family:system-ui,sans-serif;background:#f5f5f7;margin:0;padding:24px">
  <div style="max-width:480px;margin:auto;background:#fff;border-radius:16px;padding:28px">
    <h1 style="font-size:20px;margin:0 0 6px">وصل طلبك${restaurant ? ` إلى ${esc(restaurant)}` : ''}</h1>
    <p style="color:#555;margin:0 0 18px">رقم طلبك <b style="font-size:18px;color:#B5562B">${esc(o.number)}</b> · ${esc(TYPE_LABELS[o.type] || '')}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${(Array.isArray(o.lines) ? o.lines : [])
        .map((l: any) => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${esc(l.qty)} × ${esc(l.name)}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:left;direction:ltr">${esc(money((Number(l.unitPrice) || 0) * (Number(l.qty) || 0), currency))}</td></tr>`)
        .join('')}
      ${Number(o.deliveryFee) ? `<tr><td style="padding:6px 0">التوصيل</td><td style="padding:6px 0;text-align:left;direction:ltr">${esc(money(o.deliveryFee, currency))}</td></tr>` : ''}
      <tr><td style="padding:8px 0;font-weight:800">المجموع</td><td style="padding:8px 0;font-weight:800;text-align:left;direction:ltr">${esc(money(o.total, currency))}</td></tr>
    </table>
    <a href="${esc(link)}" style="display:block;margin:22px 0 0;padding:14px;border-radius:12px;background:#B5562B;color:#fff;text-align:center;font-weight:800;text-decoration:none">تابع حالة طلبك</a>
    <p style="color:#999;font-size:12px;margin:18px 0 0">وصلتك هذه الرسالة لأنك طلبت من حسابك على Weelink.</p>
  </div>
</body></html>`;

export default {
  async fetch(request: Request): Promise<Response> {
    const admin = firebaseAdmin();

    if (request.method === 'GET') {
      const url = new URL(request.url);
      const r = url.searchParams.get('r');
      const o = url.searchParams.get('o');
      const k = url.searchParams.get('k') || '';
      if (!admin) return json({ error: 'not_configured' }, 503);
      if (!validId(r) || !validId(o) || !sameKey(k, linkKey(admin.secret, r, o))) return json({ error: 'not_found' }, 404);
      const [orderSnap, siteSnap] = await Promise.all([
        admin.db.collection('restaurants').doc(r).collection('orders').doc(o).get(),
        admin.db.collection('restaurants').doc(r).get(),
      ]);
      if (!orderSnap.exists) return json({ error: 'not_found' }, 404);
      const d: any = orderSnap.data();
      const settings: any = siteSnap.data()?.settings || {};
      return json({
        number: d.number,
        status: d.status,
        type: d.type,
        table: d.type === 'table' ? d.table : '',
        createdAt: d.createdAt,
        lines: (Array.isArray(d.lines) ? d.lines : []).map((l: any) => ({ name: l.name, qty: l.qty, unitPrice: l.unitPrice })),
        subtotal: d.subtotal,
        deliveryFee: d.deliveryFee,
        total: d.total,
        restaurant: { name: settings.name || '', currency: settings.currency || '', phone: settings.phone || '', whatsapp: settings.whatsapp || '' },
      });
    }

    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const from = process.env.EMAIL_FROM;
    const resendKey = process.env.RESEND_API_KEY;
    if (!admin || !from || !resendKey) return json({ skipped: true });

    const body = (await request.json().catch(() => ({}))) as { r?: unknown; o?: unknown };
    if (!validId(body.r) || !validId(body.o)) return json({ error: 'bad_request' }, 400);
    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const user = token ? await admin.auth.verifyIdToken(token).catch(() => null) : null;
    if (!user?.email || !user.email_verified) return json({ error: 'unauthorized' }, 401);

    const orderRef = admin.db.collection('restaurants').doc(body.r).collection('orders').doc(body.o);
    // Only the customer who placed the order, and only once.
    const claimed = await admin.db
      .runTransaction(async (tx) => {
        const snap = await tx.get(orderRef);
        const d: any = snap.data();
        if (!snap.exists || d.customerUid !== user.uid || d.confirmationSentAt) return null;
        tx.update(orderRef, { confirmationSentAt: new Date().toISOString() });
        return d;
      })
      .catch(() => null);
    if (!claimed) return json({ error: 'not_found' }, 404);

    const settings: any = (await admin.db.collection('restaurants').doc(body.r).get()).data()?.settings || {};
    const origin = new URL(request.url).origin;
    const link = `${origin}/?r=${encodeURIComponent(body.r)}&order=${encodeURIComponent(body.o)}&k=${linkKey(admin.secret, body.r, body.o)}`;
    const { error } = await new Resend(resendKey).emails.send({
      from: settings.name ? `${String(settings.name).replace(/[<>"\r\n]/g, '').slice(0, 60)} <${(from.match(/<([^>]+)>/)?.[1] || from).trim()}>` : from,
      to: user.email,
      subject: `تأكيد طلبك رقم ${claimed.number}${settings.name ? ` من ${String(settings.name).slice(0, 60)}` : ''}`,
      html: mailHtml(claimed, String(settings.name || ''), String(settings.currency || ''), link),
    });
    if (error) {
      console.error('Resend refused the order confirmation:', error.message);
      await orderRef.update({ confirmationSentAt: null }).catch(() => {});
      return json({ error: 'send_failed' }, 502);
    }
    return json({ sent: true });
  },
};

// Server function (routed by worker/index.ts as /api/contact; it lives in server/ so Vercel's 12-function limit still holds): messages sent from the «نموذج تواصل» on a page.
//
//   POST /api/contact  { owner, project, pageName, name, phone, email?, message, website? }
//        → the message is saved for the page's owner and emailed to them      → { ok: true } | { error }
//
// inquiries/{owner}/items/{id} holds the message (the owner and members read, mark read and delete it,
// firestore.rules; only this function creates them). Abuse is limited per hour: a visitor (a hash of their
// address) may send 5, a page 40. `website` is a field real visitors never see: a bot that fills it gets
// an "ok" and nothing is saved.
// Needs FIREBASE_SERVICE_ACCOUNT; EMAIL_FROM and RESEND_API_KEY for the email (without them the message is
// still saved and shows in the page's admin).

import { cert, getApps, initializeApp, getAuth, FieldValue, getFirestore } from './firebase.js';
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
    return null;
  }
  if (!account.private_key) return null;
  const app = getApps()[0] || initializeApp({ credential: cert(account as object), projectId: firebaseConfig.projectId });
  const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
  return { auth: getAuth(app), db: databaseId ? getFirestore(app, databaseId) : getFirestore(app) };
};
type Admin = NonNullable<ReturnType<typeof firebaseAdmin>>;

export const PER_VISITOR_HOUR = 5;
export const PER_PAGE_HOUR = 40;

const validId = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(v);
const isProjectKey = (p: unknown): p is string => typeof p === 'string' && /^(page|shop|cars|restaurant|rental)(-[a-z0-9]{4,12})?$/.test(p);
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').trim().slice(0, max) : '');
const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const hashOf = async (s: string) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');

// Counts one more use of `key` this hour; false once it passed `limit`.
const withinLimit = (admin: Admin, key: string, limit: number) => {
  const ref = admin.db.collection('contactLimits').doc(key);
  return admin.db.runTransaction(async (tx: any) => {
    const n = Number((await tx.get(ref)).data()?.n) || 0;
    if (n >= limit) return false;
    tx.set(ref, { n: n + 1, at: new Date().toISOString() });
    return true;
  });
};

// The page owner's email: their own Firebase user, or the user that claimed an old account.
const ownerEmail = async (admin: Admin, owner: string) => {
  const user = await admin.auth.getUser(owner).catch(() => null);
  if (user?.email) return user.email;
  const claimedBy = (await admin.db.collection('accounts').doc(owner).get()).data()?.owner;
  if (!validId(claimedBy)) return '';
  return (await admin.auth.getUser(claimedBy).catch(() => null))?.email || '';
};

const row = (label: string, value: string) =>
  value ? `<tr><td style="padding:6px 0;color:#888;width:90px;vertical-align:top">${esc(label)}</td><td style="padding:6px 0;font-weight:700">${esc(value)}</td></tr>` : '';

const KIND_SUBJECT = { inquiry: 'رسالة جديدة من', order: 'طلب جديد من', car: 'طلب سيارة جديد من', restaurant: 'طلب جديد من' };
const KIND_TITLE = { inquiry: 'رسالة جديدة من صفحتك', order: 'طلب جديد من متجرك', car: 'طلب جديد على سيارة', restaurant: 'طلب جديد من موقع مطعمك' };

export const inquiryMail = (m: { pageName: string; name: string; phone: string; email: string; message: string }, kind: keyof typeof KIND_TITLE = 'inquiry') => `<!doctype html>
<html lang="ar" dir="rtl"><body style="font-family:system-ui,sans-serif;background:#f5f5f7;margin:0;padding:24px">
  <div style="max-width:480px;margin:auto;background:#fff;border-radius:16px;padding:28px">
    <h1 style="font-size:20px;margin:0 0 6px">${KIND_TITLE[kind]}</h1>
    <p style="color:#555;margin:0 0 18px;line-height:1.7">${esc(m.name)} وصلك من ${esc(m.pageName || 'صفحتك')}.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${row('الاسم', m.name)}${row('الهاتف', m.phone)}${row('الإيميل', m.email)}
    </table>
    <div style="background:#f5f5f7;border-radius:12px;padding:14px 16px;margin:14px 0 0;line-height:1.8;white-space:pre-wrap">${esc(m.message)}</div>
    <p style="color:#999;font-size:12px;margin:18px 0 0">بتلاقيه بـ «إدارة الصفحة» على Weelink.</p>
  </div>
</body></html>`;

const create = async (admin: Admin, request: Request, body: any) => {
  if (text(body.website, 100)) return json({ ok: true });
  const { owner, project } = body;
  if (!validId(owner) || !isProjectKey(project)) return json({ error: 'bad_request' }, 400);
  // 'order' (a shop order) and 'car' (a car request) are saved with the messages; 'restaurant' is only
  // emailed, since the restaurant's orders already reach its admin.
  const kind: 'inquiry' | 'order' | 'car' | 'restaurant' = ['order', 'car', 'restaurant'].includes(body.kind) ? body.kind : 'inquiry';
  const msg = {
    pageName: text(body.pageName, 80),
    name: text(body.name, 80),
    phone: text(body.phone, 30),
    email: text(body.email, 120).toLowerCase(),
    message: text(body.message, kind === 'inquiry' ? 1500 : 3000),
  };
  if (msg.name.length < 2 || msg.message.length < 3 || msg.phone.replace(/\D/g, '').length < 6) return json({ error: 'missing_fields' }, 400);
  if (msg.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.email)) return json({ error: 'bad_email' }, 400);

  const hour = new Date().toISOString().slice(0, 13);
  const visitor = await hashOf(request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown');
  const okVisitor = await withinLimit(admin, `v_${visitor}_${hour}`, PER_VISITOR_HOUR).catch(() => true);
  const okPage = okVisitor && (await withinLimit(admin, `p_${owner}_${project}_${hour}`, PER_PAGE_HOUR).catch(() => true));
  if (!okVisitor || !okPage) return json({ error: 'too_many' }, 429);

  const toOwner = await ownerEmail(admin, owner);
  if (!toOwner && !(await admin.auth.getUser(owner).then(() => true, () => false))) return json({ error: 'not_found' }, 404);

  if (kind !== 'restaurant') await admin.db.collection('inquiries').doc(owner).collection('items').add({ ...msg, project, kind, read: false, createdAt: new Date().toISOString() });

  const from = process.env.EMAIL_FROM;
  const key = process.env.RESEND_API_KEY;
  if (from && key && toOwner) {
    const clean = msg.pageName.replace(/[<>"\r\n]/g, '').slice(0, 60);
    const address = (from.match(/<([^>]+)>/)?.[1] || from).trim();
    await new Resend(key).emails
      .send({
        from: clean ? `${clean} <${address}>` : from,
        to: toOwner,
        replyTo: msg.email || undefined,
        subject: `${KIND_SUBJECT[kind]} ${msg.name}`,
        html: inquiryMail(msg, kind),
      })
      .then(({ error }) => error && console.error('Resend refused a contact email:', error.message))
      .catch((e) => console.error('A contact email failed:', e?.message));
  }
  return json({ ok: true });
};

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const admin = firebaseAdmin();
    if (!admin) return json({ error: 'not_configured' }, 503);
    const body = (await request.json().catch(() => ({}))) as any;
    return create(admin, request, body);
  },
};

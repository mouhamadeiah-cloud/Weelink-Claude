// Server function: the ratings on a page (Eyad, 13 Oct).
//
//   POST /api/rating  { action: 'start', owner, project, pageName, stars, text, name, email }
//        → emails the rater a 6-digit code; the rating waits unpublished      → { id } | { error }
//   POST /api/rating  { action: 'verify', id, code }
//        → a right code publishes the rating (one per email and page: rating again replaces it)
//          and tells the page's owner                                          → { ok: true }
//   POST /api/rating  { action: 'reply' | 'report', owner, id, text }  with  Authorization: Bearer <ID token>
//        → the owner (or a member) answers a rating (the rater gets an email), or reports it to
//          Weelink. Nobody can delete a rating from the page.                  → { ok: true }
//
//   ratings/{owner}/items/{id}        the published rating (stars, text, name, reply); anyone reads it
//   ratingSummary/{owner}_{project}   { count, sum, s1..s5 }; anyone reads it (the stars under the name)
//   ratingPending/{id}, ratingPrivate/{owner}_{id}, ratingReports/{owner}_{id}   server only
// The id is a hash of the page and the rater's email, so the email itself is never public.
// Needs FIREBASE_SERVICE_ACCOUNT, EMAIL_FROM and RESEND_API_KEY.

import { createHash, randomInt } from 'node:crypto';
import { cert, getApps, initializeApp, getAuth, FieldValue, getFirestore } from '../server/firebase.js';
import { Resend } from 'resend';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const VALID_MS = 15 * 60 * 1000;
const RESEND_AFTER_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

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
type Admin = NonNullable<ReturnType<typeof firebaseAdmin>>;

const validId = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(v);
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u0009\u000b-\u001f]/g, ' ').trim().slice(0, max) : '');
const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const sha = (s: string) => createHash('sha256').update(s).digest('hex');

// A project key: the kind, or the kind and the project's own id (src/utils/projectKeys.ts).
const isProjectKey = (p: unknown): p is string => typeof p === 'string' && /^(page|shop|cars|restaurant)(-[a-z0-9]{4,12})?$/.test(p);
const starsText = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

const ownerEmail = async (admin: Admin, owner: string) => {
  const user = await admin.auth.getUser(owner).catch(() => null);
  if (user?.email) return user.email;
  const claimedBy = (await admin.db.collection('accounts').doc(owner).get()).data()?.owner;
  if (!validId(claimedBy)) return '';
  return (await admin.auth.getUser(claimedBy).catch(() => null))?.email || '';
};

const canManage = async (admin: Admin, owner: string, uid: string) => {
  if (uid === owner) return true;
  const account = await admin.db.collection('accounts').doc(owner).get();
  if (account.data()?.owner === uid) return true;
  return (await admin.db.collection('accounts').doc(owner).collection('members').doc(uid).get()).exists;
};

const send = async (to: string, fromName: string, subject: string, html: string) => {
  const from = process.env.EMAIL_FROM;
  const key = process.env.RESEND_API_KEY;
  if (!from || !key || !to) return 'not_configured';
  const clean = fromName.replace(/[<>"\r\n]/g, '').slice(0, 60);
  const { error } = await new Resend(key).emails
    .send({ from: clean ? `${clean} <${(from.match(/<([^>]+)>/)?.[1] || from).trim()}>` : from, to, subject, html })
    .catch((e) => ({ error: { message: e?.message || 'failed' } }));
  if (error) console.error('Resend refused a rating email:', error.message);
  return error ? 'failed' : 'sent';
};

const mail = (title: string, body: string) => `<!doctype html>
<html lang="ar" dir="rtl"><body style="font-family:system-ui,sans-serif;background:#f5f5f7;margin:0;padding:24px">
  <div style="max-width:460px;margin:auto;background:#fff;border-radius:16px;padding:28px">
    <h1 style="font-size:20px;margin:0 0 12px">${esc(title)}</h1>
    ${body}
    <p style="color:#999;font-size:12px;margin:22px 0 0">رسالة من Weelink.</p>
  </div>
</body></html>`;

const quote = (r: { stars: number; text: string; name: string }) =>
  `<div style="background:#f5f5f7;border-radius:12px;padding:14px 16px;margin:0 0 12px">
     <div style="color:#f5a623;font-size:18px;letter-spacing:2px">${starsText(r.stars)}</div>
     <div style="font-weight:700;margin-top:4px">${esc(r.name)}</div>
     ${r.text ? `<div style="color:#444;margin-top:6px;line-height:1.7;white-space:pre-wrap">${esc(r.text)}</div>` : ''}
   </div>`;

const start = async (admin: Admin, body: any) => {
  const { owner, project } = body;
  const stars = Number(body.stars);
  const email = text(body.email, 120).toLowerCase();
  const name = text(body.name, 60);
  const words = text(body.text, 800);
  if (!validId(owner) || !isProjectKey(project) || !Number.isInteger(stars) || stars < 1 || stars > 5) return json({ error: 'bad_request' }, 400);
  if (name.length < 2) return json({ error: 'missing_name' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'bad_email' }, 400);
  if (!(await admin.auth.getUser(owner).catch(() => null)) && !(await admin.db.collection('accounts').doc(owner).get()).exists) return json({ error: 'not_found' }, 404);

  const id = sha(`${owner}:${project}:${email}`).slice(0, 40);
  const ref = admin.db.collection('ratingPending').doc(id);
  const prev = (await ref.get()).data();
  const now = Date.now();
  if (prev && now - prev.sentAt < RESEND_AFTER_MS) return json({ error: 'too_soon', waitSeconds: Math.ceil((RESEND_AFTER_MS - (now - prev.sentAt)) / 1000) }, 429);

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const pageName = text(body.pageName, 80);
  const sent = await send(
    email,
    pageName,
    `${code} رمز تأكيد تقييمك`,
    mail('رمز تأكيد تقييمك', `<p style="color:#555;margin:0 0 18px;line-height:1.7">اكتب هذا الرمز على ${esc(pageName || 'الصفحة')} لينتشر تقييمك. صالح لمدة 15 دقيقة.</p>
      <div style="font-size:34px;font-weight:800;letter-spacing:10px;direction:ltr;text-align:center;margin:0 0 18px">${code}</div>
      ${quote({ stars, text: words, name })}
      <p style="color:#999;font-size:12px">إذا ما كتبت هذا التقييم، تجاهل هذه الرسالة.</p>`)
  );
  if (sent !== 'sent') return json({ error: 'send_failed' }, 502);
  await ref.set({ owner, project, pageName, stars, text: words, name, email, hash: sha(`${id}:${code}`), sentAt: now, expiresAt: now + VALID_MS, attempts: 0 });
  return json({ id });
};

const verify = async (admin: Admin, body: any) => {
  const code = typeof body.code === 'string' ? body.code.replace(/\D/g, '') : '';
  if (!validId(body.id)) return json({ error: 'bad_request' }, 400);
  const pendingRef = admin.db.collection('ratingPending').doc(body.id);
  const p = (await pendingRef.get()).data();
  if (!p || Date.now() > p.expiresAt) return json({ error: 'expired' }, 400);
  if (p.attempts >= MAX_ATTEMPTS) return json({ error: 'too_many_attempts' }, 429);
  if (code.length !== 6 || sha(`${body.id}:${code}`) !== p.hash) {
    await pendingRef.update({ attempts: p.attempts + 1 });
    return json({ error: 'wrong_code', attemptsLeft: MAX_ATTEMPTS - p.attempts - 1 }, 400);
  }

  const ratingRef = admin.db.collection('ratings').doc(p.owner).collection('items').doc(body.id);
  const summaryRef = admin.db.collection('ratingSummary').doc(`${p.owner}_${p.project}`);
  const now = new Date().toISOString();
  await admin.db.runTransaction(async (tx) => {
    const old = (await tx.get(ratingRef)).data();
    const change: Record<string, unknown> = {};
    if (!old) {
      change.count = FieldValue.increment(1);
      change.sum = FieldValue.increment(p.stars);
      change[`s${p.stars}`] = FieldValue.increment(1);
    } else if (old.stars !== p.stars) {
      change.sum = FieldValue.increment(p.stars - old.stars);
      change[`s${p.stars}`] = FieldValue.increment(1);
      change[`s${old.stars}`] = FieldValue.increment(-1);
    }
    tx.set(summaryRef, { owner: p.owner, project: p.project, ...change }, { merge: true });
    // Rating again replaces the old words; the owner's reply to them goes with them.
    tx.set(ratingRef, { project: p.project, stars: p.stars, text: p.text, name: p.name, createdAt: old?.createdAt || now, updatedAt: now, reply: null, reported: false });
    tx.set(admin.db.collection('ratingPrivate').doc(`${p.owner}_${body.id}`), { email: p.email, pageName: p.pageName });
    tx.delete(pendingRef);
  });

  await send(
    await ownerEmail(admin, p.owner),
    'Weelink',
    `تقييم جديد ${starsText(p.stars)} على ${p.pageName || 'صفحتك'}`,
    mail('وصلك تقييم جديد', `${quote(p as any)}<p style="color:#555;line-height:1.7;margin:0">فيك ترد عليه من «الإدارة» على صفحتك، وبيوصل ردك لصاحب التقييم بالإيميل.</p>`)
  );
  return json({ ok: true });
};

const ownerAction = async (admin: Admin, request: Request, body: any) => {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const user = token ? await admin.auth.verifyIdToken(token).catch(() => null) : null;
  if (!user) return json({ error: 'unauthorized' }, 401);
  if (!validId(body.owner) || !validId(body.id)) return json({ error: 'bad_request' }, 400);
  if (!(await canManage(admin, body.owner, user.uid))) return json({ error: 'not_found' }, 404);
  const ref = admin.db.collection('ratings').doc(body.owner).collection('items').doc(body.id);
  const r = (await ref.get()).data();
  if (!r) return json({ error: 'not_found' }, 404);
  const words = text(body.text, 800);
  const now = new Date().toISOString();

  if (body.action === 'report') {
    await admin.db.collection('ratingReports').doc(`${body.owner}_${body.id}`).set({ owner: body.owner, id: body.id, project: r.project, reason: words, by: user.uid, at: now, stars: r.stars, text: r.text, name: r.name });
    await ref.update({ reported: true });
    return json({ ok: true });
  }

  // reply: one per rating, it can be changed; an empty one removes it.
  const hadReply = !!r.reply?.text;
  await ref.update({ reply: words ? { text: words, at: now } : null });
  if (words && !hadReply) {
    const priv = (await admin.db.collection('ratingPrivate').doc(`${body.owner}_${body.id}`).get()).data();
    if (priv?.email) {
      await send(
        priv.email,
        priv.pageName || '',
        `رد ${priv.pageName || 'صاحب الصفحة'} على تقييمك`,
        mail(`رد ${priv.pageName || 'صاحب الصفحة'} على تقييمك`, `${quote(r as any)}<div style="border-right:3px solid #0071e3;padding:4px 12px;margin:0;line-height:1.7;white-space:pre-wrap">${esc(words)}</div>`)
      );
    }
  }
  return json({ ok: true });
};

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const admin = firebaseAdmin();
    if (!admin) return json({ error: 'not_configured' }, 503);
    const body = (await request.json().catch(() => ({}))) as any;
    if (body?.action === 'start') return start(admin, body);
    if (body?.action === 'verify') return verify(admin, body);
    if (body?.action === 'reply' || body?.action === 'report') return ownerAction(admin, request, body);
    return json({ error: 'bad_request' }, 400);
  },
};

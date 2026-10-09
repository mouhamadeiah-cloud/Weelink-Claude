// Vercel serverless function: confirms a new owner's email with a 6-digit code.
//
//   POST /api/email-code  { action: 'send' }                 → { sent: true } | { skipped: true }
//   POST /api/email-code  { action: 'verify', code: '123456' } → { verified: true }
//   both with  Authorization: Bearer <Firebase ID token>
//
// Firebase itself only sends confirmation links, so the code is made here: it is sent through
// Resend, its hash is kept in emailCodes/{uid} (the rules let no browser read or write that), and
// a right code marks the Firebase user's email as verified.
//
// Needs two Vercel environment variables besides RESEND_API_KEY:
//   FIREBASE_SERVICE_ACCOUNT  the service-account JSON from Firebase (Project settings → Service accounts)
//   EMAIL_FROM                the sender, e.g. "Weelink <code@testweelink.de>" once the domain is
//                             verified in Resend ("onboarding@resend.dev" reaches only the Resend
//                             account owner's own address, which is enough for a test)
// While either is missing, 'send' answers { skipped: true } and the sign-up goes on without a code.

import { createHash, randomInt } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const VALID_MS = 10 * 60 * 1000;
const RESEND_AFTER_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_DAY = 10;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const firebaseAdmin = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  const app = getApps()[0] || initializeApp({ credential: cert(JSON.parse(raw)), projectId: firebaseConfig.projectId });
  const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
  return { auth: getAuth(app), db: databaseId ? getFirestore(app, databaseId) : getFirestore(app) };
};

const hashCode = (uid: string, code: string) => createHash('sha256').update(`${uid}:${code}`).digest('hex');

const mailHtml = (code: string) => `<!doctype html>
<html lang="ar" dir="rtl"><body style="font-family:system-ui,sans-serif;background:#f5f5f7;margin:0;padding:32px">
  <div style="max-width:420px;margin:auto;background:#fff;border-radius:16px;padding:32px;text-align:center">
    <h1 style="font-size:20px;margin:0 0 12px">رمز تأكيد بريدك في Weelink</h1>
    <p style="color:#555;margin:0 0 24px">أدخل هذا الرمز في صفحة التسجيل. صالح لمدة 10 دقائق.</p>
    <div style="font-size:34px;font-weight:800;letter-spacing:10px;direction:ltr">${code}</div>
    <p style="color:#999;font-size:12px;margin:24px 0 0">إذا لم تطلب هذا الرمز فتجاهل هذه الرسالة.</p>
  </div>
</body></html>`;

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const admin = firebaseAdmin();
    const from = process.env.EMAIL_FROM;
    const resendKey = process.env.RESEND_API_KEY;
    const body = (await request.json().catch(() => ({}))) as { action?: string; code?: unknown };
    if (!admin || !from || !resendKey) {
      return body.action === 'send' ? json({ skipped: true }) : json({ error: 'not_configured' }, 503);
    }

    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const user = token ? await admin.auth.verifyIdToken(token).catch(() => null) : null;
    if (!user?.email) return json({ error: 'unauthorized' }, 401);
    if (user.email_verified) return json({ verified: true });

    const ref = admin.db.collection('emailCodes').doc(user.uid);
    const now = Date.now();

    if (body.action === 'send') {
      const prev = (await ref.get()).data();
      if (prev && now - prev.sentAt < RESEND_AFTER_MS) {
        return json({ error: 'too_soon', waitSeconds: Math.ceil((RESEND_AFTER_MS - (now - prev.sentAt)) / 1000) }, 429);
      }
      const day = new Date(now).toISOString().slice(0, 10);
      const sendsToday = prev?.day === day ? prev.sendsToday : 0;
      if (sendsToday >= MAX_SENDS_PER_DAY) return json({ error: 'too_many' }, 429);

      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      const { error } = await new Resend(resendKey).emails.send({
        from,
        to: user.email,
        subject: `${code} رمز تأكيد بريدك في Weelink`,
        html: mailHtml(code),
      });
      if (error) return json({ error: 'send_failed', detail: error.message }, 502);
      await ref.set({ hash: hashCode(user.uid, code), sentAt: now, expiresAt: now + VALID_MS, attempts: 0, day, sendsToday: sendsToday + 1 });
      return json({ sent: true });
    }

    if (body.action === 'verify') {
      const code = typeof body.code === 'string' ? body.code.replace(/\D/g, '') : '';
      const saved = (await ref.get()).data();
      if (!saved || now > saved.expiresAt) return json({ error: 'expired' }, 400);
      if (saved.attempts >= MAX_ATTEMPTS) return json({ error: 'too_many_attempts' }, 429);
      if (code.length !== 6 || hashCode(user.uid, code) !== saved.hash) {
        await ref.update({ attempts: saved.attempts + 1 });
        return json({ error: 'wrong_code', attemptsLeft: MAX_ATTEMPTS - saved.attempts - 1 }, 400);
      }
      await admin.auth.updateUser(user.uid, { emailVerified: true });
      await ref.delete();
      return json({ verified: true });
    }

    return json({ error: 'unknown_action' }, 400);
  },
};

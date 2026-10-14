// Vercel serverless function: a hired designer enters the customer's page (Eyad, 14 Oct, last phase).
// The customer gives the designer a code that works for three days; with it the designer opens the
// customer's page in the editor, edits it and saves. Nothing else of the customer is reachable:
//   - the designer never reads or writes designs/{customerUid} directly (the rules do not let them); this
//     function reads and writes only the page's own `pages` and `elements` fields. The shop, cars and
//     restaurant projects, their admin data (customers, orders, staff, bookings), the account and the
//     email are not touched and never sent. What the designer sees is what visitors of the page see.
//   - the code is random (80 bits), stored only as a hash, shown to the customer once, tied to one paid
//     order, and dies by itself after three days, when the customer withdraws it, when a new one is made,
//     when the order stops being «paid» or «delivered», or after 8 wrong tries.
//   - the page as it was when the designer first opened it is kept (designAccess/{orderId}/backups) so the
//     customer or the office can bring it back; every save is counted.
//
//   POST /api/design-access  { action, id, ... }  with  Authorization: Bearer <ID token>  (a confirmed email)
//     { action: 'issue', id }              → { code, expiresAt }          (customer; replaces any earlier code)
//     { action: 'revoke', id }             → { ok: true }                 (customer)
//     { action: 'status', id }             → { active, expiresAt, saves } (customer or designer)
//     { action: 'open', id, code }         → { pages, elements }          (designer)
//     { action: 'save', id, code, pages, elements } → { ok: true }        (designer)
//   designAccess/{orderId} is read and written by this function only.
// Needs FIREBASE_SERVICE_ACCOUNT (the same one the other functions use).

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const TTL_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_WRONG = 8;
const MAX_SAVES = 500;
const MAX_JSON_BYTES = 900_000; // a Firestore document is 1 MiB, with the rest of the page's fields
const ALLOWED = ['paid', 'delivered'];
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

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
const hash = (code: string) => createHash('sha256').update(code).digest('hex');
const newCode = () => {
  const b = randomBytes(16);
  let s = '';
  for (let i = 0; i < 16; i++) s += ALPHABET[b[i] % 32];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}-${s.slice(12)}`;
};
const normalise = (v: unknown) => (typeof v === 'string' ? v.toUpperCase().replace(/[^A-Z0-9]/g, '') : '');
const sameHash = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'method' }, 405);
    const admin = firebaseAdmin();
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
    const id = body.id;
    if (!validId(id)) return json({ error: 'bad_request' }, 400);
    const { db } = admin;
    const now = Date.now();

    try {
      const orderRef = db.collection('designOrders').doc(id);
      const accessRef = db.collection('designAccess').doc(id);
      const order = (await orderRef.get()).data() as Record<string, any> | undefined;
      if (!order) return json({ error: 'not_found' }, 404);
      const isCustomer = order.customerUid === user.uid;
      const isDesigner = order.designerUid === user.uid;
      if (!isCustomer && !isDesigner) return json({ error: 'not_found' }, 404);
      const access = (await accessRef.get()).data() as Record<string, any> | undefined;
      const live = !!access && !access.revoked && Number(access.expiresAt) > now && ALLOWED.includes(order.status);

      if (action === 'issue') {
        if (!isCustomer || !ALLOWED.includes(order.status)) return json({ error: 'bad_state' }, 409);
        const page = (await db.collection('designs').doc(order.customerUid).get()).data() as Record<string, any> | undefined;
        if (!page || !Array.isArray(page.pages) || page.pages.length === 0) return json({ error: 'no_page' }, 404);
        const code = newCode();
        const expiresAt = now + TTL_MS;
        await accessRef.set({
          codeHash: hash(normalise(code)), expiresAt, issuedAt: now, wrong: 0, saves: 0, revoked: false,
          customerUid: order.customerUid, designerUid: order.designerUid,
        });
        await orderRef.collection('messages').add({ role: 'system', text: 'أعطى الزبون المصمم رمز دخول إلى صفحته لمدة 3 أيام. يستطيع المصمم تعديل تصميم الصفحة فقط، ولا يرى بيانات الزبون.', at: now });
        return json({ code, expiresAt });
      }

      if (action === 'revoke') {
        if (!isCustomer || !access) return json({ error: 'bad_state' }, 409);
        await accessRef.update({ revoked: true, revokedAt: now });
        return json({ ok: true });
      }

      if (action === 'status') {
        return json({ active: live, expiresAt: live ? Number(access!.expiresAt) : 0, saves: Number(access?.saves) || 0 });
      }

      if (action === 'open' || action === 'save') {
        if (!isDesigner) return json({ error: 'forbidden' }, 403);
        if (!access || access.revoked || Number(access.expiresAt) <= now) return json({ error: 'expired' }, 403);
        if (!ALLOWED.includes(order.status)) return json({ error: 'expired' }, 403);
        if ((Number(access.wrong) || 0) >= MAX_WRONG) return json({ error: 'locked' }, 429);
        const given = normalise(body.code);
        if (given.length !== 16 || !sameHash(hash(given), String(access.codeHash))) {
          await accessRef.update({ wrong: (Number(access.wrong) || 0) + 1 });
          return json({ error: 'wrong_code' }, 403);
        }
        const pageRef = db.collection('designs').doc(order.customerUid);

        if (action === 'open') {
          const page = (await pageRef.get()).data() as Record<string, any> | undefined;
          if (!page || !Array.isArray(page.pages)) return json({ error: 'no_page' }, 404);
          // The page as it was before the designer's first change on this code.
          if (!access.backedUp) {
            await accessRef.collection('backups').add({ at: now, pages: page.pages, elements: Array.isArray(page.elements) ? page.elements : [] });
            await accessRef.update({ backedUp: true });
          }
          return json({ pages: page.pages, elements: Array.isArray(page.elements) ? page.elements : [], expiresAt: Number(access.expiresAt) });
        }

        const { pages, elements } = body;
        if (!Array.isArray(pages) || pages.length === 0 || pages.length > 30 || !Array.isArray(elements) || elements.length > 3000) return json({ error: 'bad_request' }, 400);
        if (JSON.stringify({ pages, elements }).length > MAX_JSON_BYTES) return json({ error: 'too_big' }, 413);
        if ((Number(access.saves) || 0) >= MAX_SAVES) return json({ error: 'too_many_saves' }, 429);
        // A designer may not bring in a raw-HTML container (script would run in the customer's and the
        // visitors' browsers); one the customer already had stays as it was.
        const before = await pageRef.get().then((d) => (d.data() as Record<string, any> | undefined)?.elements);
        const had = new Set((Array.isArray(before) ? before : []).filter((e: any) => e?.type === 'html').map((e: any) => `${e.id}:${e.htmlCode ?? ''}:${e.content ?? ''}`));
        if (elements.some((e: any) => e?.type === 'html' && !had.has(`${e.id}:${e.htmlCode ?? ''}:${e.content ?? ''}`))) return json({ error: 'html_not_allowed' }, 400);
        // Only the two fields of the page; nothing else of the customer's document is written.
        await pageRef.set({ pages, elements, updatedAt: new Date().toISOString() }, { merge: true });
        await accessRef.update({ saves: (Number(access.saves) || 0) + 1, lastSaveAt: now });
        return json({ ok: true });
      }

      return json({ error: 'unknown_action' }, 400);
    } catch (e) {
      console.error('design access failed:', e);
      return json({ error: 'failed' }, 500);
    }
  },
};

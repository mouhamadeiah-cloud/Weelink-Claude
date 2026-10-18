// Server function: the public number of an item (a car, a dish, a product, a service).
//
//   POST /api/item-numbers  { kind: 'car' | 'dish' | 'product' | 'service', count }  with  Authorization: Bearer <ID token>
//        → { from, count }: the next `count` numbers of that kind, from, from+1, …
//
// Every item gets one number, once, that no other item of its kind has, on any page: Weelink's admin
// types it to put the item in an ad, and the search finds the item by it. The counter is
// platform_counters/items_{kind} { next }, server only (firestore.rules denies everything by default).
// The first number is 10001, so a number always has five digits at least.
// Needs FIREBASE_SERVICE_ACCOUNT.

import { cert, getApps, initializeApp, getAuth, getFirestore } from '../server/firebase.js';
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
  return { auth: getAuth(app), db: databaseId ? getFirestore(app, databaseId) : getFirestore(app) };
};

const KINDS = ['car', 'dish', 'product', 'service'];
const FIRST = 10001;
const MAX_PER_CALL = 200;

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const admin = firebaseAdmin();
    if (!admin) return json({ error: 'not_configured' }, 503);
    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const user = token ? await admin.auth.verifyIdToken(token).catch(() => null) : null;
    // Guests (anonymous sign-in) own no items.
    if (!user || (user as { firebase?: { sign_in_provider?: string } }).firebase?.sign_in_provider === 'anonymous') return json({ error: 'unauthorized' }, 401);
    const body = (await request.json().catch(() => ({}))) as { kind?: unknown; count?: unknown };
    const count = Math.floor(Number(body.count));
    if (typeof body.kind !== 'string' || !KINDS.includes(body.kind) || !(count >= 1 && count <= MAX_PER_CALL)) return json({ error: 'bad_request' }, 400);

    const ref = admin.db.collection('platform_counters').doc(`items_${body.kind}`);
    const from = await admin.db.runTransaction(async (t) => {
      const next = Number((await t.get(ref)).data()?.next);
      const start = Number.isFinite(next) && next >= FIRST ? next : FIRST;
      t.set(ref, { next: start + count });
      return start;
    });
    return json({ from, count });
  },
};

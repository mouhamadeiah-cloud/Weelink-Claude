// Worker function: keeps Weelink's search index (server/searchIndex.ts, D1) in step with a published site.
//
//   GET  /api/index-site   with the cron secret: rebuilds every published site (daily Cron Trigger).
//   POST /api/index-site  { owner, project }   Authorization: Bearer <ID token>
//        → { indexed: true, items } after reading the site's published copy from Firestore, or
//          { indexed: false } when there is none (unpublished): its rows are dropped.
//
// The owner, or a member of the account, calls it right after «نشر» / «إلغاء النشر». The index is built
// from what Firestore holds, never from the request, so a caller can only refresh a site they manage.
// 503 { error: 'not_configured' } while there is no D1 binding.

import { cert, getApps, initializeApp, getAuth, getFirestore } from '../server/firebase.js';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };
import { type SearchDb, indexSite, itemsOf, removeSite, searchDb, type IndexedPage } from '../server/searchIndex.js';
import { restaurantIdOf, kindOf } from '../src/utils/projectKeys.js';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const firebaseAdmin = () => {
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

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

// Visits over the last 30 days, from the day counters (services/siteStats.ts).
const visitsLast30 = async (db: any, owner: string, project: string) => {
  const from = new Date(Date.now() - 29 * 86400000);
  const first = `${project}_${dayKey(from)}`;
  const last = `${project}_~`;
  const snap = await db.collection('siteStats').doc(owner).collection('days').get().catch(() => null);
  let n = 0;
  for (const d of snap?.docs || []) {
    if (d.id >= first && d.id <= last) n += Number(d.data()?.visits) || 0;
  }
  return n;
};

const VALID_KEY = /^[a-z]+(-[a-z0-9]+)?$/;

// Rebuilds one site's rows from its published copy in Firestore (or drops them when it is not published).
const refreshSite = async (db: any, d1: SearchDb, owner: string, project: string): Promise<{ indexed: boolean; items?: number }> => {
  const siteId = `${owner}__${project}`;
  const site = await db.doc(`publishedSites/${siteId}`).get();
  if (!site.exists) {
    await removeSite(d1, siteId);
    return { indexed: false };
  }
  const s = site.data();
  const kind = kindOf(project) as IndexedPage['kind'];
  let data = s.data;
  if (kind === 'restaurant') {
    const menu = await db.doc(`restaurants/${restaurantIdOf(owner, project)}`).get();
    data = menu.exists ? menu.data()?.menu : null;
  }
  const items = itemsOf(kind, data);
  await indexSite(d1, {
    siteId,
    name: String(s.name || ''),
    owner,
    project,
    kind,
    title: String(s.seo?.title || s.name || ''),
    description: String(s.seo?.description || ''),
    keywords: Array.isArray(s.seo?.keywords) ? s.seo.keywords.map(String) : [],
    place: s.place || null,
    publishedAt: String(s.publishedAt || ''),
    visits30: await visitsLast30(db, owner, project),
  }, items);
  return { indexed: true, items: items.length };
};

// The daily job (a Cron Trigger → GET with the cron secret): rebuilds every published site's rows, which
// refreshes the visit counts and fills in what sites published earlier lack.
const reindexAll = async (db: any, d1: SearchDb) => {
  const snap = await db.collection('publishedSites').select('owner', 'project').limit(2000).get();
  let n = 0;
  for (const doc of snap.docs) {
    const { owner, project } = doc.data();
    if (typeof owner !== 'string' || typeof project !== 'string' || !VALID_KEY.test(project)) continue;
    await refreshSite(db, d1, owner, project).then(() => n++).catch((err: Error) => console.error('index failed', doc.id, err?.message));
  }
  return n;
};

export default {
  async fetch(request: Request): Promise<Response> {
    const d1 = searchDb();
    const admin = firebaseAdmin();
    if (!d1 || !admin) return json({ error: 'not_configured' }, 503);
    if (request.method === 'GET') {
      const secret = process.env.CRON_SECRET;
      const sent = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      if (!secret || sent !== secret) return json({ error: 'unauthorized' }, 401);
      return json({ reindexed: await reindexAll(admin.db, d1) });
    }
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const user = token ? await admin.auth.verifyIdToken(token).catch(() => null) : null;
    if (!user || (user as { firebase?: { sign_in_provider?: string } }).firebase?.sign_in_provider === 'anonymous') return json({ error: 'unauthorized' }, 401);

    const body = (await request.json().catch(() => ({}))) as { owner?: unknown; project?: unknown };
    const owner = typeof body.owner === 'string' ? body.owner : '';
    const project = typeof body.project === 'string' ? body.project : '';
    if (!owner || !/^[\w-]{1,128}$/.test(owner) || !VALID_KEY.test(project)) return json({ error: 'bad_request' }, 400);
    if (owner !== user.uid && !(await admin.db.doc(`accounts/${owner}/members/${user.uid}`).get()).exists) return json({ error: 'forbidden' }, 403);

    const result = await refreshSite(admin.db, d1, owner, project);
    return json(result);
  },
};

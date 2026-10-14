// Vercel serverless function: the sign-in and the data of the platform admin site
// (admin.testweelink.de, Eyad's team). Everything here runs on the server with the Firebase Admin
// SDK; the browser never reads the subscribers or the admin accounts (the rules deny them).
//
//   POST /api/admin  { action: 'login', username, password }   → { token, admin }
//   POST /api/admin  { action: 'me' }                           → { admin }
//   POST /api/admin  { action: 'change-password', current, next } → { token, admin }
//   POST /api/admin  { action: 'subscribers', q?, state?, published?, verified? } → { rows, matched, summary }
//   all but 'login' with  Authorization: Bearer <session token>
//   GET  /api/admin  → which settings this deployment sees (yes/no only, never their values)
//
// Admin accounts: platform_admins/{username} = { name, role, status, pass: 'salt:hash' (scrypt),
// v (password version), mustChange }. The very first sign-in of «admin» with the default password
// creates the main admin; that password only opens the «choose a new password» step, nothing else.
// A session token is signed with a key derived from the service account, lives 12 hours and stops
// working when the password changes or the admin is frozen.
// Failed sign-ins are counted per username and address (5 wrong → 15 minutes locked) and every
// sign-in and password change is written to platform_audit.
//
// Needs FIREBASE_SERVICE_ACCOUNT in Vercel (the same one /api/email-code uses).

import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const DEFAULT_PASSWORD = '123456';
const FIRST_ADMIN = 'admin';
const SESSION_MS = 12 * 60 * 60 * 1000;
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const SLEEPING_AFTER_DAYS = 30;
const MAX_ROWS = 500;
const MAX_USERS = 5000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

let account: { private_key?: string } | null | undefined;
const serviceAccount = () => {
  if (account !== undefined) return account;
  try {
    account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '');
  } catch {
    account = null;
  }
  return account;
};

const firebaseAdmin = () => {
  const acc = serviceAccount();
  if (!acc) return null;
  const app = getApps()[0] || initializeApp({ credential: cert(acc as object), projectId: firebaseConfig.projectId });
  const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
  return { auth: getAuth(app), db: databaseId ? getFirestore(app, databaseId) : getFirestore(app) };
};

// ---------- passwords and sessions ----------

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};

const checkPassword = (password: string, stored: string) => {
  const [salt, hash] = (stored || '').split(':');
  const given = scryptSync(password, salt || 'x', 64);
  const want = Buffer.from(hash || '', 'hex');
  return want.length === given.length && timingSafeEqual(given, want);
};

const sessionKey = () => createHash('sha256').update(`weelink-admin:${serviceAccount()?.private_key || ''}`).digest();

const signToken = (username: string, v: number) => {
  const body = Buffer.from(JSON.stringify({ u: username, v, exp: Date.now() + SESSION_MS })).toString('base64url');
  return `${body}.${createHmac('sha256', sessionKey()).update(body).digest('base64url')}`;
};

const readToken = (token: string): { u: string; v: number } | null => {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const want = createHmac('sha256', sessionKey()).update(body).digest();
  const got = Buffer.from(sig, 'base64url');
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp > Date.now() && typeof p.u === 'string' ? { u: p.u, v: Number(p.v) } : null;
  } catch {
    return null;
  }
};

const cleanUsername = (raw: unknown) => String(raw || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);

type Admin = { username: string; name: string; role: string; status: string; mustChange: boolean; v: number };
const publicAdmin = (a: Admin) => ({ username: a.username, name: a.name, role: a.role, mustChange: a.mustChange });

// ---------- handler ----------

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === 'GET') {
      return json({ serviceAccount: !!serviceAccount() });
    }
    if (request.method !== 'POST') return json({ error: 'method' }, 405);

    const fb = firebaseAdmin();
    if (!fb) return json({ error: 'not-configured' }, 503);
    const { db, auth } = fb;

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'bad-request' }, 400);
    }
    const action = String(body.action || '');
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const audit = (admin: string, what: string, ok = true) =>
      db.collection('platform_audit').add({ at: FieldValue.serverTimestamp(), admin, action: what, ok, ip }).catch(() => undefined);

    // ----- sign in -----
    if (action === 'login') {
      const username = cleanUsername(body.username);
      const password = String(body.password || '').slice(0, 200);
      if (!username || !password) return json({ error: 'wrong' }, 401);

      const lockRef = db.collection('platform_admin_locks').doc(createHash('sha256').update(`${username}|${ip}`).digest('hex').slice(0, 40));
      const lock = (await lockRef.get()).data() as { fails?: number; until?: number } | undefined;
      if (lock?.until && lock.until > Date.now()) return json({ error: 'locked', minutes: Math.ceil((lock.until - Date.now()) / 60000) }, 429);

      const ref = db.collection('platform_admins').doc(username);
      let snap = await ref.get();
      // The main admin does not exist until its first sign-in with the default password.
      if (!snap.exists && username === FIRST_ADMIN && password === DEFAULT_PASSWORD) {
        const anyone = await db.collection('platform_admins').limit(1).get();
        if (anyone.empty) {
          await ref.set({ name: 'المدير', role: 'owner', status: 'active', pass: hashPassword(DEFAULT_PASSWORD), v: 1, mustChange: true, createdAt: FieldValue.serverTimestamp() });
          snap = await ref.get();
        }
      }
      const data = snap.data() as (Omit<Admin, 'username'> & { pass: string }) | undefined;
      // The same work for a name that does not exist, so the answer time does not tell.
      const right = checkPassword(password, data?.pass || '');
      if (!data || !right || data.status !== 'active') {
        const fails = (lock?.fails || 0) + 1;
        await lockRef.set(fails >= MAX_FAILS ? { fails: 0, until: Date.now() + LOCK_MS } : { fails, until: 0 });
        await audit(username, 'login', false);
        return json({ error: data && right && data.status !== 'active' ? 'frozen' : 'wrong' }, 401);
      }
      await lockRef.delete().catch(() => undefined);
      await audit(username, 'login');
      const admin: Admin = { username, name: data.name, role: data.role, status: data.status, mustChange: !!data.mustChange, v: data.v };
      return json({ token: signToken(username, data.v), admin: publicAdmin(admin) });
    }

    // ----- everything else needs a session -----
    const session = readToken((request.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''));
    if (!session) return json({ error: 'session' }, 401);
    const adminSnap = await db.collection('platform_admins').doc(session.u).get();
    const row = adminSnap.data() as (Omit<Admin, 'username'> & { pass: string }) | undefined;
    if (!row || row.status !== 'active' || row.v !== session.v) return json({ error: 'session' }, 401);
    const admin: Admin = { username: session.u, name: row.name, role: row.role, status: row.status, mustChange: !!row.mustChange, v: row.v };

    if (action === 'me') return json({ admin: publicAdmin(admin) });

    if (action === 'change-password') {
      const current = String(body.current || '');
      const next = String(body.next || '');
      if (!checkPassword(current, row.pass)) return json({ error: 'wrong' }, 401);
      if (next.length < 8 || next.length > 100) return json({ error: 'short' }, 400);
      if (next === DEFAULT_PASSWORD || next === current) return json({ error: 'same' }, 400);
      const v = row.v + 1;
      await adminSnap.ref.update({ pass: hashPassword(next), v, mustChange: false });
      await audit(session.u, 'change-password');
      return json({ token: signToken(session.u, v), admin: publicAdmin({ ...admin, v, mustChange: false }) });
    }

    // A default or temporary password only opens the step above.
    if (admin.mustChange) return json({ error: 'must-change' }, 403);

    if (action === 'subscribers') {
      const q = String(body.q || '').trim().toLowerCase().slice(0, 100);
      const state = ['active', 'sleeping'].includes(String(body.state)) ? String(body.state) : 'all';
      const published = ['yes', 'no'].includes(String(body.published)) ? String(body.published) : 'all';
      const verified = ['yes', 'no'].includes(String(body.verified)) ? String(body.verified) : 'all';

      // Pages by owner: published sites carry the owner's workspace id, which for an old
      // account is not the Firebase uid (accounts/{id}.owner says whose it is).
      const [sitesSnap, accountsSnap] = await Promise.all([
        db.collection('publishedSites').select('name', 'owner', 'project').get(),
        db.collection('accounts').select('owner').get(),
      ]);
      const uidOf = new Map<string, string>();
      accountsSnap.forEach((d) => d.data().owner && uidOf.set(d.id, String(d.data().owner)));
      const sitesByUid = new Map<string, { name: string; project: string }[]>();
      sitesSnap.forEach((d) => {
        const s = d.data() as { name: string; owner: string; project: string };
        const uid = uidOf.get(s.owner) || s.owner;
        sitesByUid.set(uid, [...(sitesByUid.get(uid) || []), { name: s.name, project: s.project }]);
      });

      const users: Awaited<ReturnType<typeof auth.listUsers>>['users'] = [];
      let pageToken: string | undefined;
      do {
        const page = await auth.listUsers(1000, pageToken);
        users.push(...page.users);
        pageToken = page.pageToken;
      } while (pageToken && users.length < MAX_USERS);

      const sleepingBefore = Date.now() - SLEEPING_AFTER_DAYS * 86400000;
      const all = users.map((u) => {
        const seen = Math.max(Date.parse(u.metadata.lastRefreshTime || '') || 0, Date.parse(u.metadata.lastSignInTime || '') || 0);
        const sites = sitesByUid.get(u.uid) || [];
        return {
          uid: u.uid,
          name: u.displayName || '',
          email: u.email || '',
          phone: u.phoneNumber || '',
          createdAt: Date.parse(u.metadata.creationTime || '') || 0,
          lastActive: seen,
          verified: u.emailVerified,
          disabled: u.disabled,
          active: seen >= sleepingBefore,
          sites,
        };
      });

      const matched = all.filter((r) => {
        if (state === 'active' && !r.active) return false;
        if (state === 'sleeping' && r.active) return false;
        if (published === 'yes' && !r.sites.length) return false;
        if (published === 'no' && r.sites.length) return false;
        if (verified === 'yes' && !r.verified) return false;
        if (verified === 'no' && r.verified) return false;
        return !q || [r.name, r.email, r.phone, r.uid, ...r.sites.map((s) => s.name)].some((v) => v.toLowerCase().includes(q));
      });
      matched.sort((a, b) => b.createdAt - a.createdAt);

      return json({
        rows: matched.slice(0, MAX_ROWS),
        matched: matched.length,
        summary: {
          total: all.length,
          active: all.filter((r) => r.active).length,
          sleeping: all.filter((r) => !r.active).length,
          withPage: all.filter((r) => r.sites.length).length,
          sleepingAfterDays: SLEEPING_AFTER_DAYS,
        },
      });
    }

    return json({ error: 'unknown-action' }, 400);
  },
};

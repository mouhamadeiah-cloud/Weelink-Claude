// Vercel serverless function: a customer's own domain for their published page, and domain prices.
//
//   POST /api/domains  with  Authorization: Bearer <Firebase ID token>
//     { action: 'connect', owner, project, domain }  adds the domain to Weelink's Vercel project and
//                                                    returns the DNS records the customer must set
//     { action: 'check', owner, project }            whether the domain points to Vercel yet
//     { action: 'remove', owner, project }           takes the domain off the page
//     { action: 'price', domain }                    whether it can be bought, and its price
//
// The caller must be the page's owner or one of its management members. The domain is mapped to the
// page in siteDomains/{domain} (read by the visitors' browser) and kept in the published site's
// customDomain. Buying a domain is not automatic yet: the page saves a request (domainOrders).
//
// Needs, besides FIREBASE_SERVICE_ACCOUNT:
//   VERCEL_TOKEN        a Vercel access token (Account settings → Tokens), scoped to the team
//   VERCEL_PROJECT_ID   the project that serves the published pages (prj_...)
//   VERCEL_TEAM_ID      the team (team_...), when the project belongs to one
// While any is missing, every action answers 503 { error: 'not_configured' }.

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const PROJECTS = ['page', 'shop', 'cars', 'restaurant'];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const firebaseAdmin = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  let account: object;
  try {
    account = JSON.parse(raw);
  } catch {
    console.error('FIREBASE_SERVICE_ACCOUNT is not valid JSON; paste the whole service-account file.');
    return null;
  }
  const app = getApps()[0] || initializeApp({ credential: cert(account), projectId: firebaseConfig.projectId });
  const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
  return { auth: getAuth(app), db: databaseId ? getFirestore(app, databaseId) : getFirestore(app) };
};

const validDomain = (d: unknown): d is string =>
  typeof d === 'string' && /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(d);

const vercel = async (path: string, init: RequestInit = {}) => {
  const team = process.env.VERCEL_TEAM_ID;
  const url = `https://api.vercel.com${path}${team ? `${path.includes('?') ? '&' : '?'}teamId=${encodeURIComponent(team)}` : ''}`;
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const data: any = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
};

// The DNS records the customer sets at the company they bought the domain from.
const recordsFor = (domain: string, verification: any[]) => {
  const apex = domain.split('.').length === 2;
  const records = apex
    ? [{ type: 'A', name: '@', value: '76.76.21.21' }, { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' }]
    : [{ type: 'CNAME', name: domain.split('.')[0], value: 'cname.vercel-dns.com' }];
  // A domain already used on another Vercel account needs a TXT record to prove it is the customer's.
  (verification || []).forEach((v) => records.push({ type: String(v.type), name: String(v.domain), value: String(v.value) }));
  return records;
};

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const admin = firebaseAdmin();
    const project = process.env.VERCEL_PROJECT_ID;
    if (!admin || !process.env.VERCEL_TOKEN || !project) return json({ error: 'not_configured' }, 503);

    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const user = token ? await admin.auth.verifyIdToken(token).catch(() => null) : null;
    if (!user) return json({ error: 'unauthorized' }, 401);
    const body = (await request.json().catch(() => ({}))) as { action?: string; owner?: unknown; project?: unknown; domain?: unknown };

    if (body.action === 'price') {
      const domain = typeof body.domain === 'string' ? body.domain.toLowerCase() : '';
      if (!validDomain(domain)) return json({ error: 'bad_domain' }, 400);
      const [avail, price] = await Promise.all([
        vercel(`/v1/registrar/domains/${encodeURIComponent(domain)}/availability`),
        vercel(`/v1/registrar/domains/${encodeURIComponent(domain)}/price`),
      ]);
      if (!avail.ok) return json({ error: 'check_failed' }, 502);
      const p = price.data || {};
      return json({
        available: avail.data?.available === true,
        price: typeof p.purchasePrice === 'number' ? p.purchasePrice : typeof p.price === 'number' ? p.price : null,
        years: typeof p.years === 'number' ? p.years : typeof p.period === 'number' ? p.period : 1,
        currency: 'USD',
      });
    }

    // The page's owner or a management member.
    const owner = typeof body.owner === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(body.owner) ? body.owner : '';
    const kind = typeof body.project === 'string' && PROJECTS.includes(body.project) ? body.project : '';
    if (!owner || !kind) return json({ error: 'bad_request' }, 400);
    const allowed =
      owner === user.uid ||
      (await admin.db.doc(`accounts/${owner}`).get()).data()?.owner === user.uid ||
      (await admin.db.doc(`accounts/${owner}/members/${user.uid}`).get()).exists;
    if (!allowed) return json({ error: 'forbidden' }, 403);

    const siteRef = admin.db.doc(`publishedSites/${owner}__${kind}`);
    const site = (await siteRef.get()).data();
    if (!site?.name) return json({ error: 'not_published' }, 409);
    const current = site.customDomain?.name as string | undefined;

    if (body.action === 'connect') {
      const domain = typeof body.domain === 'string' ? body.domain.toLowerCase() : '';
      if (!validDomain(domain)) return json({ error: 'bad_domain' }, 400);
      const used = (await admin.db.doc(`siteDomains/${domain}`).get()).data();
      if (used && used.name !== site.name) return json({ error: 'domain_taken' }, 409);
      const added = await vercel(`/v10/projects/${encodeURIComponent(project)}/domains`, { method: 'POST', body: JSON.stringify({ name: domain }) });
      // Already on the project (added before) is fine.
      if (!added.ok && added.data?.error?.code !== 'domain_already_in_use_by_project' && added.status !== 409) {
        console.error('Vercel refused the domain:', added.status, added.data?.error?.message);
        return json({ error: 'vercel_refused', detail: String(added.data?.error?.message || '') }, 502);
      }
      if (domain.split('.').length === 2) {
        // www.<domain> sends visitors to the domain itself.
        await vercel(`/v10/projects/${encodeURIComponent(project)}/domains`, { method: 'POST', body: JSON.stringify({ name: `www.${domain}`, redirect: domain, redirectStatusCode: 308 }) });
      }
      const state = { name: domain, status: 'pending', records: recordsFor(domain, added.data?.verification), at: new Date().toISOString() };
      await admin.db.doc(`siteDomains/${domain}`).set({ name: site.name, owner, project: kind });
      if (current && current !== domain) await admin.db.doc(`siteDomains/${current}`).delete().catch(() => {});
      await siteRef.update({ customDomain: state });
      return json({ domain: state });
    }

    if (body.action === 'check') {
      if (!current) return json({ error: 'no_domain' }, 409);
      const [config, info] = await Promise.all([
        vercel(`/v6/domains/${encodeURIComponent(current)}/config`),
        vercel(`/v9/projects/${encodeURIComponent(project)}/domains/${encodeURIComponent(current)}`),
      ]);
      if (info.data?.verified === false) await vercel(`/v9/projects/${encodeURIComponent(project)}/domains/${encodeURIComponent(current)}/verify`, { method: 'POST' });
      const active = config.ok && config.data?.misconfigured === false && info.data?.verified !== false;
      const state = {
        ...site.customDomain,
        status: active ? 'active' : 'pending',
        message: active ? '' : 'لم تصل السجلات بعد. قد يأخذ ذلك من دقائق حتى 48 ساعة.',
        at: new Date().toISOString(),
      };
      await siteRef.update({ customDomain: state });
      return json({ domain: state });
    }

    if (body.action === 'remove') {
      if (current) {
        await vercel(`/v9/projects/${encodeURIComponent(project)}/domains/${encodeURIComponent(current)}`, { method: 'DELETE' });
        if (current.split('.').length === 2) await vercel(`/v9/projects/${encodeURIComponent(project)}/domains/www.${encodeURIComponent(current)}`, { method: 'DELETE' });
        await admin.db.doc(`siteDomains/${current}`).delete().catch(() => {});
      }
      await siteRef.update({ customDomain: null });
      return json({ removed: true });
    }

    return json({ error: 'unknown_action' }, 400);
  },
};

// A customer's own domain for their published page, and whether a domain is free to buy.
//
//   POST /api/domains  with  Authorization: Bearer <Firebase ID token>
//     { action: 'connect', owner, project, domain }  adds the domain to Weelink's Cloudflare zone as a
//                                                    custom hostname (Cloudflare for SaaS) and returns
//                                                    the DNS records the customer must set
//     { action: 'check', owner, project }            whether the domain points to Weelink yet
//     { action: 'remove', owner, project }           takes the domain off the page
//     { action: 'price', domain }                    whether it can be bought (RDAP); no price, the
//                                                    office confirms it
//
// The caller must be the page's owner or one of its management members. The domain is mapped to the
// page in siteDomains/{domain} (read by the visitors' browser) and kept in the published site's
// customDomain. A domain with no subdomain also gets www.<domain>, which the browser maps to the same page.
// Buying a domain is not automatic: the page saves a request (domainOrders) and the office buys it.
//
// Needs, besides FIREBASE_SERVICE_ACCOUNT:
//   CF_API_TOKEN      a Cloudflare API token with Zone → SSL and Certificates → Edit on the zone
//   CF_ZONE_ID        the zone of testweelink.de (Overview page, right column)
//   CF_CNAME_TARGET   the address customers point their CNAME to (default customers.testweelink.de),
//                     the zone's Custom Hostnames fallback origin
// While a Cloudflare one is missing, connect/check/remove answer 503 { error: 'not_configured' }.

import { cert, getApps, initializeApp, getAuth, getFirestore } from '../server/firebase.js';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

// A project key: the kind, or the kind and the project's own id (src/utils/projectKeys.ts).
const isProjectKey = (p: unknown): p is string => typeof p === 'string' && /^(page|shop|cars|restaurant|rental|hotel)(-[a-z0-9]{4,12})?$/.test(p);

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

const target = () => process.env.CF_CNAME_TARGET || 'customers.testweelink.de';
const configured = () => !!(process.env.CF_API_TOKEN && process.env.CF_ZONE_ID);

const cloudflare = async (path: string, init: RequestInit = {}) => {
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE_ID}/custom_hostnames${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.CF_API_TOKEN}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const data: any = await res.json().catch(() => ({}));
  return { ok: res.ok && data?.success !== false, status: res.status, data };
};

type Hostname = { id: string; hostname: string; status?: string; ssl?: { status?: string }; ownership_verification?: { type?: string; name?: string; value?: string } };

const findHostname = async (hostname: string): Promise<Hostname | null> => {
  const r = await cloudflare(`?hostname=${encodeURIComponent(hostname)}`);
  return (r.data?.result || []).find((h: Hostname) => h.hostname === hostname) || null;
};

// Adds the hostname, or finds it when it was added before.
const addHostname = async (hostname: string): Promise<Hostname | { error: string }> => {
  const added = await cloudflare('', { method: 'POST', body: JSON.stringify({ hostname, ssl: { method: 'http', type: 'dv' } }) });
  if (added.ok) return added.data.result as Hostname;
  const found = await findHostname(hostname);
  if (found) return found;
  console.error('Cloudflare refused the domain:', added.status, JSON.stringify(added.data?.errors || []));
  return { error: String(added.data?.errors?.[0]?.message || '') };
};

const removeHostname = async (hostname: string) => {
  const found = await findHostname(hostname);
  if (found) await cloudflare(`/${found.id}`, { method: 'DELETE' });
};

const isActive = (h: Hostname | null) => !!h && h.status === 'active' && h.ssl?.status === 'active';

// The DNS records the customer sets at the company they bought the domain from.
const recordsFor = (domain: string, hosts: Hostname[]) => {
  const apex = domain.split('.').length === 2;
  const records = apex
    ? [{ type: 'CNAME', name: '@', value: target() }, { type: 'CNAME', name: 'www', value: target() }]
    : [{ type: 'CNAME', name: domain.split('.')[0], value: target() }];
  // Proves the domain is the customer's before the CNAME reaches Cloudflare.
  hosts.forEach((h) => {
    const v = h.ownership_verification;
    if (v?.name && v.value) records.push({ type: String(v.type || 'txt').toUpperCase(), name: v.name, value: v.value });
  });
  return records;
};

const hostsOf = (domain: string) => (domain.split('.').length === 2 ? [domain, `www.${domain}`] : [domain]);

// Whether nobody has registered the domain yet: RDAP answers 404 for a free one.
const isFree = async (domain: string): Promise<boolean | null> => {
  const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, { headers: { Accept: 'application/rdap+json' } }).catch(() => null);
  if (!res) return null;
  if (res.status === 404) return true;
  return res.ok ? false : null;
};

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const admin = firebaseAdmin();
    if (!admin) return json({ error: 'not_configured' }, 503);

    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const user = token ? await admin.auth.verifyIdToken(token).catch(() => null) : null;
    if (!user) return json({ error: 'unauthorized' }, 401);
    const body = (await request.json().catch(() => ({}))) as { action?: string; owner?: unknown; project?: unknown; domain?: unknown };

    if (body.action === 'price') {
      const domain = typeof body.domain === 'string' ? body.domain.toLowerCase() : '';
      if (!validDomain(domain)) return json({ error: 'bad_domain' }, 400);
      const available = await isFree(domain);
      if (available === null) return json({ error: 'check_failed' }, 502);
      return json({ available, price: null, years: 1, currency: 'USD' });
    }

    // The page's owner or a management member.
    const owner = typeof body.owner === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(body.owner) ? body.owner : '';
    const kind = isProjectKey(body.project) ? body.project : '';
    if (!owner || !kind) return json({ error: 'bad_request' }, 400);
    const allowed =
      owner === user.uid ||
      (await admin.db.doc(`accounts/${owner}`).get()).data()?.owner === user.uid ||
      (await admin.db.doc(`accounts/${owner}/members/${user.uid}`).get()).exists;
    if (!allowed) return json({ error: 'forbidden' }, 403);

    const siteRef = admin.db.doc(`publishedSites/${owner}__${kind}`);
    const site = (await siteRef.get()).data();
    if (!site?.name) return json({ error: 'not_published' }, 409);
    if (!configured()) return json({ error: 'not_configured' }, 503);
    const current = site.customDomain?.name as string | undefined;

    if (body.action === 'connect') {
      const domain = typeof body.domain === 'string' ? body.domain.toLowerCase() : '';
      if (!validDomain(domain)) return json({ error: 'bad_domain' }, 400);
      const used = (await admin.db.doc(`siteDomains/${domain}`).get()).data();
      if (used && used.name !== site.name) return json({ error: 'domain_taken' }, 409);
      const hosts: Hostname[] = [];
      for (const h of hostsOf(domain)) {
        const added = await addHostname(h);
        if ('error' in added) return json({ error: 'cloudflare_refused', detail: added.error }, 502);
        hosts.push(added);
      }
      const state = { name: domain, status: 'pending', records: recordsFor(domain, hosts), at: new Date().toISOString() };
      await admin.db.doc(`siteDomains/${domain}`).set({ name: site.name, owner, project: kind });
      if (current && current !== domain) await admin.db.doc(`siteDomains/${current}`).delete().catch(() => {});
      await siteRef.update({ customDomain: state });
      return json({ domain: state });
    }

    if (body.action === 'check') {
      if (!current) return json({ error: 'no_domain' }, 409);
      const found = await findHostname(current);
      // Asks Cloudflare to look at the records again instead of waiting for its next round.
      if (found && !isActive(found)) await cloudflare(`/${found.id}`, { method: 'PATCH', body: JSON.stringify({ ssl: { method: 'http', type: 'dv' } }) });
      const active = isActive(found);
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
        for (const h of hostsOf(current)) await removeHostname(h);
        await admin.db.doc(`siteDomains/${current}`).delete().catch(() => {});
      }
      await siteRef.update({ customDomain: null });
      return json({ removed: true });
    }

    return json({ error: 'unknown_action' }, 400);
  },
};

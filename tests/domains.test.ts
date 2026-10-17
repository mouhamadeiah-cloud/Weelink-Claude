import { test } from 'node:test';
import assert from 'node:assert/strict';
import { store, tokens } from './fakeAdmin.ts';
import domains from '../api/domains.ts';

// Cloudflare's custom hostnames API and RDAP, answered from memory.
const hostnames = new Map<string, any>();
const calls: string[] = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (async (url: string, init: RequestInit = {}) => {
  const u = new URL(url);
  const method = init.method || 'GET';
  calls.push(`${method} ${u.pathname}${u.search}`);
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
  if (u.host === 'rdap.org') return reply({}, u.pathname.endsWith('/free-name.com') ? 404 : 200);
  const id = u.pathname.split('/custom_hostnames')[1]?.replace('/', '');
  if (method === 'POST') {
    const { hostname } = JSON.parse(String(init.body));
    if ([...hostnames.values()].some((h) => h.hostname === hostname)) return reply({ success: false, errors: [{ code: 1406, message: 'Duplicate custom hostname found.' }] }, 409);
    const h = { id: `h${hostnames.size + 1}`, hostname, status: 'pending', ssl: { status: 'pending_validation' }, ownership_verification: { type: 'txt', name: `_cf-custom-hostname.${hostname}`, value: 'abc' } };
    hostnames.set(h.id, h);
    return reply({ success: true, result: h });
  }
  if (method === 'DELETE') { hostnames.delete(id); return reply({ success: true }); }
  if (method === 'PATCH') return reply({ success: true, result: hostnames.get(id) });
  const name = u.searchParams.get('hostname');
  return reply({ success: true, result: [...hostnames.values()].filter((h) => h.hostname === name) });
}) as typeof fetch;

const call = (body: object, token = 't1') =>
  domains.fetch(new Request('https://x/api/domains', { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify(body) })).then(async (r) => ({ status: r.status, data: await r.json() as any }));

test('domains: Cloudflare for SaaS connect, check, remove', async () => {
  process.env.FIREBASE_SERVICE_ACCOUNT = '{}';
  tokens.t1 = { uid: 'u1' };
  tokens.t2 = { uid: 'u2' };
  store.set('publishedSites/u1__shop', { name: 'alnour' });

  assert.equal((await call({ action: 'connect', owner: 'u1', project: 'shop', domain: 'alnour.com' })).data.error, 'not_configured');
  process.env.CF_API_TOKEN = 'tok';
  process.env.CF_ZONE_ID = 'zone';

  assert.equal((await call({ action: 'connect', owner: 'u1', project: 'shop', domain: 'alnour.com' }, 't2')).status, 403, 'not the owner');
  const c = await call({ action: 'connect', owner: 'u1', project: 'shop', domain: 'alnour.com' });
  assert.equal(c.status, 200);
  assert.deepEqual([...hostnames.values()].map((h) => h.hostname), ['alnour.com', 'www.alnour.com']);
  const recs = c.data.domain.records;
  assert.deepEqual(recs.slice(0, 2), [{ type: 'CNAME', name: '@', value: 'customers.testweelink.de' }, { type: 'CNAME', name: 'www', value: 'customers.testweelink.de' }]);
  assert.equal(recs.filter((r: any) => r.type === 'TXT').length, 2);
  assert.equal(store.get('siteDomains/alnour.com').name, 'alnour');

  // Connecting again finds the hostnames added before.
  assert.equal((await call({ action: 'connect', owner: 'u1', project: 'shop', domain: 'alnour.com' })).status, 200);
  assert.equal(hostnames.size, 2);

  assert.equal((await call({ action: 'check', owner: 'u1', project: 'shop' })).data.domain.status, 'pending');
  for (const h of hostnames.values()) { h.status = 'active'; h.ssl.status = 'active'; }
  assert.equal((await call({ action: 'check', owner: 'u1', project: 'shop' })).data.domain.status, 'active');

  assert.equal((await call({ action: 'remove', owner: 'u1', project: 'shop' })).data.removed, true);
  assert.equal(hostnames.size, 0);
  assert.equal(store.get('siteDomains/alnour.com'), undefined);
  assert.equal(store.get('publishedSites/u1__shop').customDomain, null);
});

test('domains: a sub-domain gets one CNAME, price says only whether it is free', async () => {
  store.set('publishedSites/u1__page', { name: 'jaber' });
  const c = await call({ action: 'connect', owner: 'u1', project: 'page', domain: 'shop.jaber.net' });
  assert.deepEqual(c.data.domain.records[0], { type: 'CNAME', name: 'shop', value: 'customers.testweelink.de' });
  assert.equal(c.data.domain.records.length, 2);
  assert.deepEqual((await call({ action: 'price', domain: 'free-name.com' })).data, { available: true, price: null, years: 1, currency: 'USD' });
  assert.equal((await call({ action: 'price', domain: 'google.com' })).data.available, false);
  globalThis.fetch = realFetch;
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FieldValue, getAuth, getFirestore, initializeApp } from '../server/firebase.ts';

// The REST layer talks to Google with fetch; here fetch is a stub that answers like Google and records requests.
const pair = (await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
const pkcs8 = Buffer.from(await crypto.subtle.exportKey('pkcs8', pair.privateKey)).toString('base64');
const pem = `-----BEGIN PRIVATE KEY-----\n${pkcs8.match(/.{1,64}/g)!.join('\n')}\n-----END PRIVATE KEY-----\n`;
const jwk = { ...(await crypto.subtle.exportKey('jwk', pair.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };

const b64 = (x: string | Uint8Array) => Buffer.from(x).toString('base64url');
const sign = async (payload: object, header: object = { alg: 'RS256', kid: 'k1' }) => {
  const unsigned = `${b64(JSON.stringify(header))}.${b64(JSON.stringify(payload))}`;
  return `${unsigned}.${b64(new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, new TextEncoder().encode(unsigned))))}`;
};

const requests: { url: string; body: any; auth: string | null }[] = [];
let tokenCalls = 0;
globalThis.fetch = (async (input: string, init: RequestInit = {}) => {
  const url = String(input);
  const body = typeof init.body === 'string' ? (url.includes('oauth2') ? init.body : JSON.parse(init.body)) : undefined;
  requests.push({ url, body, auth: new Headers(init.headers).get('authorization') });
  const json = (x: unknown, status = 200) => new Response(JSON.stringify(x), { status, headers: { 'Cache-Control': 'max-age=3600' } });
  if (url.includes('securetoken@system')) return json({ keys: [jwk] });
  if (url.includes('oauth2.googleapis.com')) {
    tokenCalls++;
    const assertion = new URLSearchParams(body).get('assertion')!.split('.');
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', pair.publicKey, Buffer.from(assertion[2], 'base64url'), new TextEncoder().encode(`${assertion[0]}.${assertion[1]}`));
    const claims = JSON.parse(Buffer.from(assertion[1], 'base64url').toString());
    return ok && claims.iss === 'svc@p1.iam.gserviceaccount.com' ? json({ access_token: 'tok', expires_in: 3600 }) : json({ error_description: 'bad' }, 400);
  }
  if (url.endsWith(':commit')) return json({});
  if (url.endsWith(':batchGet')) return json([{ found: { name: body.documents[0], fields: { n: { integerValue: '4' }, at: { timestampValue: '2026-10-16T10:00:00.123456Z' }, m: { mapValue: { fields: { a: { arrayValue: { values: [{ stringValue: 'x' }] } } } } } } } }]);
  if (url.includes('accounts:lookup')) return json({ users: body.localId?.includes('u1') ? [{ localId: 'u1', email: 'a@b.de', emailVerified: true, createdAt: '1700000000000', lastLoginAt: '1700000100000', providerUserInfo: [{ providerId: 'google.com', rawId: 'g1' }] }] : [] });
  return json({ error: { message: 'unexpected', status: 'NOT_FOUND' } }, 404);
}) as typeof fetch;

delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
const app = initializeApp({ credential: { client_email: 'svc@p1.iam.gserviceaccount.com', private_key: pem }, projectId: 'p1' });
const db = getFirestore(app);
const auth = getAuth(app);
const now = Math.floor(Date.now() / 1000);
const claims = { aud: 'p1', iss: 'https://securetoken.google.com/p1', sub: 'u1', iat: now - 10, auth_time: now - 10, exp: now + 600, email: 'a@b.de', email_verified: true };

test('verifyIdToken accepts a token signed by the securetoken key', async () => {
  const user = await auth.verifyIdToken(await sign(claims));
  assert.equal(user.uid, 'u1');
  assert.equal(user.email_verified, true);
});

test('verifyIdToken refuses wrong audience, expiry, issuer, tampering and junk', async () => {
  await assert.rejects(auth.verifyIdToken(await sign({ ...claims, aud: 'other' })));
  await assert.rejects(auth.verifyIdToken(await sign({ ...claims, exp: now - 1 })));
  await assert.rejects(auth.verifyIdToken(await sign({ ...claims, iss: 'https://evil' })));
  await assert.rejects(auth.verifyIdToken(await sign(claims, { alg: 'none', kid: 'k1' })));
  const good = (await sign(claims)).split('.');
  await assert.rejects(auth.verifyIdToken(`${good[0]}.${b64(JSON.stringify({ ...claims, sub: 'admin' }))}.${good[2]}`));
  await assert.rejects(auth.verifyIdToken('not-a-token'));
});

test('writes become Firestore commits with masks and transforms, signed with one cached token', async () => {
  requests.length = 0;
  const ref = db.collection('accounts').doc('u-1');
  await ref.set({ plan: { name: 'pro', since: 5 }, tokens: FieldValue.increment(3), old: FieldValue.delete() }, { merge: true });
  await ref.update({ 'plan.name': 'free', 'list': FieldValue.arrayUnion('a'), at: FieldValue.serverTimestamp() });
  const [w1, w2] = requests.filter((r) => r.url.endsWith(':commit')).map((r) => r.body.writes[0]);
  assert.equal(w1.update.name, 'projects/p1/databases/(default)/documents/accounts/u-1');
  assert.deepEqual(w1.update.fields, { plan: { mapValue: { fields: { name: { stringValue: 'pro' }, since: { integerValue: '5' } } } } });
  assert.deepEqual(w1.updateMask.fieldPaths, ['plan.name', 'plan.since', 'old']);
  assert.deepEqual(w1.updateTransforms, [{ fieldPath: 'tokens', increment: { integerValue: '3' } }]);
  assert.deepEqual(w2.updateMask.fieldPaths, ['plan.name']);
  assert.deepEqual(w2.currentDocument, { exists: true });
  assert.deepEqual(w2.updateTransforms.map((t: any) => Object.keys(t)[1]), ['appendMissingElements', 'setToServerValue']);
  assert.ok(requests.filter((r) => r.url.endsWith(':commit')).every((r) => r.auth === 'Bearer tok'));
  assert.equal(tokenCalls, 1);
});

test('field paths that are not identifiers are quoted', async () => {
  requests.length = 0;
  await db.doc('x/y').update({ 'tokens.2026-10': 5 });
  assert.deepEqual(requests.at(-1)!.body.writes[0].updateMask.fieldPaths, ['tokens.`2026-10`']);
});

test('reads decode numbers, timestamps, maps and arrays', async () => {
  const snap = await db.doc('x/y').get();
  assert.equal(snap.exists, true);
  assert.equal(snap.get('n'), 4);
  assert.equal(snap.data().at.toMillis(), Date.parse('2026-10-16T10:00:00.123Z'));
  assert.deepEqual(snap.data().m, { a: ['x'] });
});

test('queries build structured queries', async () => {
  requests.length = 0;
  await db.collection('subs').where('status', '==', 'active').where('subscription.freezeAt', '>', 10).orderBy('at', 'desc').limit(5).select('name').get().catch(() => undefined);
  const q = requests.at(-1)!.body.structuredQuery;
  assert.deepEqual(q.from, [{ collectionId: 'subs' }]);
  assert.equal(q.where.compositeFilter.filters.length, 2);
  assert.equal(q.where.compositeFilter.filters[1].fieldFilter.op, 'GREATER_THAN');
  assert.deepEqual(q.orderBy, [{ field: { fieldPath: 'at' }, direction: 'DESCENDING' }]);
  assert.equal(q.limit, 5);
  assert.deepEqual(q.select, { fields: [{ fieldPath: 'name' }] });
});

test('auth lookups map users like firebase-admin', async () => {
  const u = await auth.getUser('u1');
  assert.equal(u.email, 'a@b.de');
  assert.equal(u.metadata.creationTime, new Date(1700000000000).toUTCString());
  assert.deepEqual(u.providerData.map((p) => p.providerId), ['google.com']);
  await assert.rejects(auth.getUser('nobody'), (e: any) => e.code === 'auth/user-not-found');
  assert.deepEqual((await auth.getUsers([{ uid: 'u1' }, { uid: 'u2' }])).notFound, [{ uid: 'u2' }]);
});

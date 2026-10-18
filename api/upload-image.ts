// Server function: a photo into the R2 store (server/images.ts).
//
//   POST /api/upload-image?folder=images|backgrounds|gallery&name=<file name>
//        body: the image bytes (Content-Type image/*)   Authorization: Bearer <ID token>
//        → { url: '/img/users/{uid}/{folder}/{file}' }
//
// Any signed-in account (a guest's anonymous sign-in too) writes under its own users/{uid}/ folder, as
// storage.rules did. 503 { error: 'not_configured' } while there is no R2 binding: the client then
// uses Firebase Storage as before. The photos are read through GET /img/<key> (worker/index.ts).

import { cert, getApps, initializeApp, getAuth } from '../server/firebase.js';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };
import { FOLDERS, IMAGE_TYPES, MAX_IMAGE_BYTES, imagesBucket } from '../server/images.js';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const authOf = () => {
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
  return getAuth(app);
};

// A file name safe for a key: letters, digits, dot, dash, underscore.
const safeName = (name: string) => name.normalize('NFKD').replace(/[^\w.-]+/g, '_').replace(/^\.+/, '').slice(-60) || 'image';

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const bucket = imagesBucket();
    const auth = authOf();
    if (!bucket || !auth) return json({ error: 'not_configured' }, 503);
    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const user = token ? await auth.verifyIdToken(token).catch(() => null) : null;
    if (!user) return json({ error: 'unauthorized' }, 401);

    const url = new URL(request.url);
    const folder = url.searchParams.get('folder') || 'images';
    const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!FOLDERS.includes(folder) || !IMAGE_TYPES[type]) return json({ error: 'bad_request' }, 400);
    const size = Number(request.headers.get('content-length') || 0);
    if (size > MAX_IMAGE_BYTES) return json({ error: 'too_large' }, 413);
    const bytes = await request.arrayBuffer();
    if (!bytes.byteLength || bytes.byteLength > MAX_IMAGE_BYTES) return json({ error: bytes.byteLength ? 'too_large' : 'bad_request' }, bytes.byteLength ? 413 : 400);

    const name = safeName(url.searchParams.get('name') || 'image');
    const key = `users/${user.uid}/${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${name}`;
    await bucket.put(key, bytes, { httpMetadata: { contentType: type, cacheControl: 'public, max-age=31536000, immutable' } });
    return json({ url: `/img/${key}` });
  },
};

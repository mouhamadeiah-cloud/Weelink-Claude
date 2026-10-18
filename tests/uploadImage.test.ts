import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../worker/upload-image.ts';
import { tokens } from './fakeAdmin.ts';
import { deleteUserImages, setImagesBucket, type ImagesBucket } from '../server/images.ts';

process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ private_key: 'x' });
tokens['owner'] = { uid: 'u1', firebase: { sign_in_provider: 'password' } };
tokens['guest'] = { uid: 'g1', firebase: { sign_in_provider: 'anonymous' } };

const files = new Map<string, { type?: string; size: number }>();
const bucket: ImagesBucket = {
  async put(key, value, options) {
    files.set(key, { type: options?.httpMetadata?.contentType, size: (value as ArrayBuffer).byteLength });
  },
  async get() {
    return null;
  },
  async list({ prefix }) {
    return { objects: [...files.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key })), truncated: false };
  },
  async delete(keys) {
    for (const k of Array.isArray(keys) ? keys : [keys]) files.delete(k);
  },
};

const post = (token: string | null, query: string, type: string, body: BodyInit = new Uint8Array([1, 2, 3])) =>
  handler.fetch(new Request(`https://x.test/api/upload-image?${query}`, { method: 'POST', headers: { 'Content-Type': type, ...(token ? { authorization: `Bearer ${token}` } : {}) }, body }));

test('without an R2 bucket the answer is 503, so the client uses Firebase Storage', async () => {
  setImagesBucket(null);
  assert.equal((await post('owner', 'folder=images', 'image/png')).status, 503);
});

test('a signed-in account stores a photo under its own folder', async () => {
  setImagesBucket(bucket);
  files.clear();
  const res = await post('owner', 'folder=gallery&name=%D9%85%D8%B7%D8%B9%D9%85 1.png', 'image/png');
  assert.equal(res.status, 200);
  const { url } = (await res.json()) as { url: string };
  assert.match(url, /^\/img\/users\/u1\/gallery\/\d+_[a-z0-9]+_[\w.-]+$/);
  assert.equal(files.size, 1);
  assert.equal([...files.values()][0].type, 'image/png');
  assert.equal((await post('guest', 'folder=images', 'image/jpeg')).status, 200);
});

test('no token, a bad folder, a non-image or a too big file is refused', async () => {
  setImagesBucket(bucket);
  assert.equal((await post(null, 'folder=images', 'image/png')).status, 401);
  assert.equal((await post('owner', 'folder=../x', 'image/png')).status, 400);
  assert.equal((await post('owner', 'folder=images', 'text/html')).status, 400);
  assert.equal((await post('owner', 'folder=images', 'image/png', new Uint8Array(0))).status, 400);
  assert.equal((await post('owner', 'folder=images', 'image/png', new Uint8Array(10 * 1024 * 1024 + 1))).status, 413);
});

test('deleting a customer removes their photos only', async () => {
  setImagesBucket(bucket);
  files.clear();
  files.set('users/u1/images/a', { size: 1 });
  files.set('users/u2/images/b', { size: 1 });
  await deleteUserImages('u1');
  assert.deepEqual([...files.keys()], ['users/u2/images/b']);
});

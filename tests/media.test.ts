import test from 'node:test';
import assert from 'node:assert/strict';
import { serveMedia } from '../worker/media';
import { setImagesBucket } from '../server/images';

const store = new Map<string, { data: Uint8Array; type: string }>();
const bucket: any = {
  async put(key: string, value: ArrayBuffer, o: any) { store.set(key, { data: new Uint8Array(value), type: o?.httpMetadata?.contentType }); },
  async head(key: string) { const v = store.get(key); return v ? { size: v.data.length, httpEtag: 'x', httpMetadata: { contentType: v.type } } : null; },
  async get(key: string, o?: any) {
    const v = store.get(key); if (!v) return null;
    const d = o?.range ? v.data.slice(o.range.offset, o.range.offset + o.range.length) : v.data;
    return { body: new Response(d as any).body, size: v.data.length, httpEtag: 'x', httpMetadata: { contentType: v.type } };
  },
};
const assets = { fetch: async () => new Response(new Uint8Array([1, 2, 3, 4, 5, 6]), { headers: { 'Content-Type': 'video/mp4' } }) };
const req = (u: string, headers: Record<string, string> = {}) => new Request(`https://x.test/media?u=${encodeURIComponent(u)}`, { headers });

test('a library video is copied into R2 on first request, then served with ranges', async () => {
  setImagesBucket(bucket);
  const first = await serveMedia(req('/bg-videos/a.mp4'), assets);
  assert.equal(first.status, 200);
  assert.equal(store.size, 1);
  const part = await serveMedia(req('/bg-videos/a.mp4', { range: 'bytes=2-3' }), assets);
  assert.equal(part.status, 206);
  assert.equal(part.headers.get('content-range'), 'bytes 2-3/6');
  assert.deepEqual([...new Uint8Array(await part.arrayBuffer())], [3, 4]);
});

test('other hosts and paths are refused', async () => {
  setImagesBucket(bucket);
  assert.equal((await serveMedia(req('https://evil.example/x.jpg'), assets)).status, 404);
  assert.equal((await serveMedia(req('/secret/x.mp4'), assets)).status, 404);
});

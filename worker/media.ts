// GET /media?u=<link>: a template photo or library video from our own R2 store instead of its original
// place (Eyad, 18 Oct: everything on Cloudflare). Published pages point here (src/services/mirror.ts).
// The first request copies the file into R2 under shared/<sha256 of the link>, later ones read it from there.
// Only Unsplash photos (squeezed to about 300 KB as WebP), Pixabay files (as they are, up to 15 MB) and the library files under /bg-videos/ and
// /graphics/ of our own site are copied; any other link is refused.
import { imagesBucket, type ImagesBucket } from '../server/images.js';

const MAX_BYTES = 300 * 1024;
const MAX_PIXABAY_BYTES = 15 * 1024 * 1024;
const OWN_PATH = /^\/(bg-videos|graphics)\/[\w.-]+$/;

const sha256 = async (text: string) => {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
};

const fail = (status: number) => new Response(null, { status });

// An Unsplash photo as WebP of at most ~300 KB: width 1280 at quality 70, then smaller if still too big.
const fetchUnsplash = async (link: URL): Promise<{ body: ArrayBuffer; type: string } | null> => {
  for (const [w, q] of [[1280, 70], [1000, 55], [800, 45]]) {
    const u = new URL(link.toString());
    u.searchParams.set('w', String(Math.min(Number(link.searchParams.get('w')) || w, w)));
    u.searchParams.set('q', String(q));
    u.searchParams.set('fm', 'webp');
    u.searchParams.set('auto', 'format');
    const res = await fetch(u.toString());
    if (!res.ok) return null;
    const body = await res.arrayBuffer();
    const type = (res.headers.get('content-type') || '').split(';')[0];
    if (!type.startsWith('image/')) return null;
    if (body.byteLength <= MAX_BYTES || q === 45) return { body, type };
  }
  return null;
};

// A Pixabay photo or video (or its poster, which Pixabay serves from Vimeo's image host) as it is (its videos are the small size), up to 15 MB; Pixabay asks that pages do not hotlink its files.
const fetchPixabay = async (link: URL): Promise<{ body: ArrayBuffer; type: string } | null> => {
  const res = await fetch(link.toString());
  if (!res.ok) return null;
  const type = (res.headers.get('content-type') || '').split(';')[0];
  if (!/^(image|video)\//.test(type)) return null;
  const body = await res.arrayBuffer();
  return body.byteLength <= MAX_PIXABAY_BYTES ? { body, type } : null;
};

const copyIn = async (link: string, assets: { fetch(request: Request): Promise<Response> }, origin: string): Promise<{ body: ArrayBuffer; type: string } | null> => {
  if (link.startsWith('/')) {
    if (!OWN_PATH.test(link)) return null;
    const res = await assets.fetch(new Request(origin + link));
    const type = (res.headers.get('content-type') || '').split(';')[0];
    return res.ok && /^(video|image)\//.test(type) ? { body: await res.arrayBuffer(), type } : null;
  }
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  if (url.protocol === 'https:' && url.hostname === 'images.unsplash.com') return fetchUnsplash(url);
  if (url.protocol === 'https:' && (url.hostname === 'cdn.pixabay.com' || url.hostname === 'i.vimeocdn.com')) return fetchPixabay(url);
  return null;
};

const serve = async (bucket: ImagesBucket, key: string, request: Request): Promise<Response | null> => {
  const head = await bucket.head(key);
  if (!head) return null;
  const headers: Record<string, string> = {
    'Content-Type': head.httpMetadata?.contentType || 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
  };
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') || '');
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, head.size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), head.size - 1) : head.size - 1;
    if (start > end || start >= head.size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${head.size}` } });
    const part = await bucket.get(key, { range: { offset: start, length: end - start + 1 } });
    if (!part) return null;
    return new Response(request.method === 'HEAD' ? null : part.body, {
      status: 206,
      headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${head.size}`, 'Content-Length': String(end - start + 1) },
    });
  }
  const whole = request.method === 'HEAD' ? null : await bucket.get(key);
  return new Response(whole ? whole.body : null, { headers: { ...headers, 'Content-Length': String(head.size) } });
};

export const serveMedia = async (request: Request, assets: { fetch(request: Request): Promise<Response> }): Promise<Response> => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return fail(405);
  const url = new URL(request.url);
  const link = url.searchParams.get('u') || '';
  const bucket = imagesBucket();
  if (!link || link.length > 2000) return fail(400);
  // Without the R2 binding the original link still works for the visitor.
  if (!bucket) return Response.redirect(link.startsWith('/') ? url.origin + link : link, 302);
  const key = `shared/${await sha256(link)}`;
  const hit = await serve(bucket, key, request);
  if (hit) return hit;
  const copy = await copyIn(link, assets, url.origin);
  if (!copy) return fail(404);
  await bucket.put(key, copy.body, { httpMetadata: { contentType: copy.type, cacheControl: 'public, max-age=31536000, immutable' } });
  return (await serve(bucket, key, request)) || fail(502);
};

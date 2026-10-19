// Cloudflare entry for Weelink, the live host (testweelink.de, its subdomains and customers' own domains).
// The site itself is the Vite build in dist/, served by Workers Static Assets (wrangler.jsonc);
// /api/<name> goes to the api/*.ts handlers, which speak fetch(Request) → Response.
// The daily jobs are Cron Triggers (wrangler.jsonc, CRONS below).
// Secrets and vars reach the handlers as process.env through the nodejs_compat flag.
// Firebase goes through server/firebase.ts (REST + fetch), since firebase-admin's Firestore cannot run here.
import admin from '../api/admin.js';
import booking from '../api/booking.js';
import buildPage from '../api/build-page.js';
import contact from '../api/contact.js';
import designers from '../api/designers.js';
import domains from '../api/domains.js';
import emailCode from '../api/email-code.js';
import geocode from '../api/geocode.js';
import itemNumbers from '../api/item-numbers.js';
import orderStatus from '../api/order-status.js';
import photos from '../api/photos.js';
import rating from '../api/rating.js';
import sendEmail from '../api/send-email.js';
import uploadImage from './upload-image.js';
import indexSite from './index-site.js';
import { serveMedia } from './media.js';
import { serveSiteHead } from './site-head.js';
import { setSearchDb, type SearchDb } from '../server/searchIndex.js';
import { imagesBucket, setImagesBucket, type ImagesBucket } from '../server/images.js';

type Handler = { fetch(request: Request): Promise<Response> };

const ROUTES: Record<string, Handler> = {
  admin, booking, 'build-page': buildPage, contact, designers, domains, 'email-code': emailCode,
  geocode, 'item-numbers': itemNumbers, 'order-status': orderStatus, photos, rating, 'send-email': sendEmail, 'upload-image': uploadImage, 'index-site': indexSite,
};
// These addresses share the designers handler, which reads the area from the path.
for (const name of ['gallery', 'design-orders', 'design-access']) ROUTES[name] = designers;

// The daily jobs, keyed by their schedule in wrangler.jsonc (UTC).
const CRONS: Record<string, string> = {
  '0 6 * * *': '/api/booking',
  '0 7 * * *': '/api/admin',
  '0 8 * * *': '/api/designers?area=orders',
  '0 3 * * *': '/api/index-site',
};

const notFound = () => new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

const route = (request: Request): Promise<Response> => {
  const name = new URL(request.url).pathname.replace(/^\/api\//, '').replace(/\/+$/, '');
  const handler = ROUTES[name];
  return handler ? handler.fetch(request) : Promise.resolve(notFound());
};

interface Env { ASSETS: { fetch(request: Request): Promise<Response> }; CRON_SECRET?: string; IMAGES?: ImagesBucket; SEARCH?: SearchDb }

// GET /img/<key>: a photo from the R2 store (api/upload-image.ts writes them). Keys are never reused, so
// browsers and Cloudflare may keep them for good.
const servePhoto = async (request: Request, pathname: string): Promise<Response> => {
  const bucket = imagesBucket();
  if (!bucket || (request.method !== 'GET' && request.method !== 'HEAD')) return notFound();
  const object = await bucket.get(decodeURIComponent(pathname.slice('/img/'.length)));
  if (!object) return notFound();
  return new Response(request.method === 'HEAD' ? null : object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: object.httpEtag,
      'X-Content-Type-Options': 'nosniff',
    },
  });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    setImagesBucket(env.IMAGES);
    setSearchDb(env.SEARCH);
    if (pathname.startsWith('/img/')) return servePhoto(request, pathname);
    if (pathname === '/media') return serveMedia(request, env.ASSETS);
    if (pathname.startsWith('/api/')) return route(request);
    const site = await serveSiteHead(request, env.ASSETS);
    return site || env.ASSETS.fetch(request);
  },

  async scheduled(event: { cron: string }, env: Env): Promise<void> {
    setImagesBucket(env.IMAGES);
    setSearchDb(env.SEARCH);
    const path = CRONS[event.cron];
    if (!path || !env.CRON_SECRET) return;
    // A GET with the cron secret as a bearer token, as the handlers expect.
    const response = await route(new Request(`https://cron.internal${path}`, { headers: { authorization: `Bearer ${env.CRON_SECRET}` } }));
    if (!response.ok) throw new Error(`${path} → ${response.status} ${await response.text()}`);
  },
};

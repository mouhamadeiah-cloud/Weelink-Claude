// Cloudflare entry for Weelink (trial; Vercel stays the live host until the move is approved).
// The site itself is the Vite build in dist/, served by Workers Static Assets (wrangler.jsonc);
// /api/<name> goes to the same api/*.ts handlers Vercel runs, since they already speak
// fetch(Request) → Response. The daily jobs in vercel.json's "crons" become Cron Triggers here.
// Secrets and vars reach the handlers as process.env through the nodejs_compat flag.
// Known gap: handlers that use firebase-admin's Firestore do not run on Workers yet
// (see /mnt/project-files/cloudflare/plan.md); geocode, photos and send-email do.
import admin from '../api/admin.js';
import booking from '../api/booking.js';
import buildPage from '../api/build-page.js';
import designers from '../api/designers.js';
import domains from '../api/domains.js';
import emailCode from '../api/email-code.js';
import geocode from '../api/geocode.js';
import orderStatus from '../api/order-status.js';
import photos from '../api/photos.js';
import rating from '../api/rating.js';
import sendEmail from '../api/send-email.js';

type Handler = { fetch(request: Request): Promise<Response> };

const ROUTES: Record<string, Handler> = {
  admin, booking, 'build-page': buildPage, designers, domains, 'email-code': emailCode,
  geocode, 'order-status': orderStatus, photos, rating, 'send-email': sendEmail,
};
// vercel.json's rewrites: these addresses share the designers handler, which reads the area from the path.
for (const name of ['gallery', 'design-orders', 'design-access']) ROUTES[name] = designers;

// vercel.json's crons, keyed by their schedule (UTC).
const CRONS: Record<string, string> = {
  '0 6 * * *': '/api/booking',
  '0 7 * * *': '/api/admin',
  '0 8 * * *': '/api/designers?area=orders',
};

const notFound = () => new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

const route = (request: Request): Promise<Response> => {
  const name = new URL(request.url).pathname.replace(/^\/api\//, '').replace(/\/+$/, '');
  const handler = ROUTES[name];
  return handler ? handler.fetch(request) : Promise.resolve(notFound());
};

interface Env { ASSETS: { fetch(request: Request): Promise<Response> }; CRON_SECRET?: string }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/api/')) return route(request);
    return env.ASSETS.fetch(request);
  },

  async scheduled(event: { cron: string }, env: Env): Promise<void> {
    const path = CRONS[event.cron];
    if (!path || !env.CRON_SECRET) return;
    // Same request Vercel's cron sends: a GET with the cron secret as a bearer token.
    const response = await route(new Request(`https://cron.internal${path}`, { headers: { authorization: `Bearer ${env.CRON_SECRET}` } }));
    if (!response.ok) throw new Error(`${path} → ${response.status} ${await response.text()}`);
  },
};

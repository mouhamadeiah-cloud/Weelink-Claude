/*
 * One Vercel function for the small API routes.
 *
 * The Hobby plan allows at most 12 functions per deployment, so the small routes live in
 * server/routes/ (not counted as functions) and this file answers all of them. The URLs stay
 * the same: /api/photos, /api/rating, /api/design-orders (cron) and so on all land here, and
 * the matching route module is loaded only when it is called. admin, booking and build-page
 * stay their own functions because they need the longer time limit in vercel.json.
 *
 * A new small route: add server/routes/<name>.ts (default export with fetch) and one line below.
 */

type Route = { default: { fetch(request: Request): Promise<Response> } };

const routes: Record<string, () => Promise<Route>> = {
  'design-access': () => import('../server/routes/design-access.js'),
  'design-orders': () => import('../server/routes/design-orders.js'),
  domains: () => import('../server/routes/domains.js'),
  'email-code': () => import('../server/routes/email-code.js'),
  gallery: () => import('../server/routes/gallery.js'),
  geocode: () => import('../server/routes/geocode.js'),
  'order-status': () => import('../server/routes/order-status.js'),
  photos: () => import('../server/routes/photos.js'),
  rating: () => import('../server/routes/rating.js'),
  'send-email': () => import('../server/routes/send-email.js'),
  'write-texts': () => import('../server/routes/write-texts.js'),
};

const routeName = (request: Request): string => {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');
  const fromPath = path.startsWith('/api/') ? path.slice(5) : '';
  if (fromPath && fromPath !== '[fn]' && Object.hasOwn(routes, fromPath)) return fromPath;
  return url.searchParams.get('fn') || '';
};

export default {
  async fetch(request: Request): Promise<Response> {
    const name = routeName(request);
    const load = Object.hasOwn(routes, name) ? routes[name] : undefined;
    if (!load) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const route = await load();
    return route.default.fetch(request);
  },
};

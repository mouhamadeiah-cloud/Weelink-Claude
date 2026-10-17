// One function for the designers' programme: the gallery, the design orders and the access codes
// (server/*.ts) share this entry; worker/index.ts routes /api/gallery, /api/design-orders and
// /api/design-access to it. The area comes from `?area=`, or from the path that was asked for.
import gallery from '../server/gallery.js';
import orders from '../server/design-orders.js';
import access from '../server/design-access.js';

const AREAS: Record<string, { fetch(request: Request): Promise<Response> }> = { gallery, orders, access };
const BY_PATH: Record<string, string> = { gallery: 'gallery', 'design-orders': 'orders', 'design-access': 'access' };

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const area = url.searchParams.get('area') || BY_PATH[url.pathname.split('/').filter(Boolean).pop() || ''] || '';
    const handler = AREAS[area];
    if (!handler) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    return handler.fetch(request);
  },
};

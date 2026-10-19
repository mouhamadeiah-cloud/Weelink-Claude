// Search-engine and link-preview tags for published pages, written by the server.
// Google can run the page's JavaScript, but WhatsApp, Facebook and Telegram read only the HTML they are
// sent, so the title, description and og tags that PublicSite sets in the browser never reach their
// previews. For <name>.<site domain> and a customer's own domain this puts them into index.html before it
// leaves the Worker, and answers /robots.txt and /sitemap.xml for those hosts. Weelink's own address gets
// a plain robots.txt. The tags come from siteNames/{name} (title, description, keywords), one read.

import { firebaseAdmin } from './index-site.js';

type Assets = { fetch(request: Request): Promise<Response> };
export type SiteTarget = { name: string } | { host: string };

const siteDomain = () => (typeof process !== 'undefined' && process.env.SITE_DOMAIN) || 'testweelink.de';

// Which published page this address shows, as src/services/sites.ts siteFromLocation decides it in the browser.
export const siteTargetOf = (url: URL, domain = siteDomain()): SiteTarget | null => {
  const host = url.hostname.toLowerCase();
  if (host.endsWith(`.${domain}`)) {
    const sub = host.slice(0, -(domain.length + 1));
    return sub && sub !== 'www' && sub !== 'admin' && !sub.includes('.') ? { name: sub } : null;
  }
  const ours = host === domain || host === 'localhost' || host === '127.0.0.1' || host.endsWith('.workers.dev') || host.endsWith('.vercel.app') || host === 'weelink.de' || host.endsWith('.weelink.de');
  return ours ? null : { host: host.replace(/^www\./, '') };
};

export const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export interface HeadInfo { title: string; description: string; keywords: string[]; url: string; image?: boolean; shareText?: string }

// index.html with the page's own tags in place of Weelink's.
export const injectHead = (html: string, info: HeadInfo) => {
  const title = escapeAttr(info.title);
  const description = escapeAttr(info.description);
  const tags = [
    `<meta name="description" content="${description}" />`,
    info.keywords.length ? `<meta name="keywords" content="${escapeAttr(info.keywords.join(', '))}" />` : '',
    `<meta property="og:title" content="${title}" />`,
    // The owner's own line for shared links, or the short description when there is none.
    `<meta property="og:description" content="${info.shareText ? escapeAttr(info.shareText) : description}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escapeAttr(info.url)}" />`,
    // The customer's logo, a small square PNG: shown as the thumbnail beside the link.
    info.image ? `<meta property="og:image" content="${escapeAttr(new URL('/og-image.png', info.url).href)}" />` : '',
    info.image ? `<meta name="twitter:card" content="summary" />` : '',
    `<link rel="canonical" href="${escapeAttr(info.url)}" />`,
  ].filter(Boolean);
  const out = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
    .replace(/<meta\s+(?:name="(?:description|keywords)"|property="og:[a-z:]+")[^>]*>\s*/gi, '')
    .replace('</head>', `    ${tags.join('\n    ')}\n  </head>`);
  // A square logo reads as a small card, not the large banner Weelink's own page declares.
  return info.image ? out.replace(/<meta\s+name="twitter:card"\s+content="summary_large_image"[^>]*>\s*/i, '') : out;
};

export const robotsFor = (origin: string | null) =>
  ['User-agent: *', 'Disallow: /api/', ...(origin ? [`Sitemap: ${origin}/sitemap.xml`] : [])].join('\n') + '\n';

export const sitemapFor = (origin: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escapeAttr(origin)}/</loc></url></urlset>\n`;

const text = (body: string, type: string) =>
  new Response(body, { headers: { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'public, max-age=3600' } });

// The page's tags for a name or a connected domain, kept a minute per Worker instance. null when no page has it.
type Found = Omit<HeadInfo, 'url' | 'image'> & { icon: string };
const PNG_DATA_URL = 'data:image/png;base64,';
const cache = new Map<string, { at: number; info: Found | null }>();
const lookup = async (target: SiteTarget): Promise<Found | null> => {
  const key = 'name' in target ? `n:${target.name}` : `h:${target.host}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 60000) return hit.info;
  let info: Found | null = null;
  const admin = firebaseAdmin();
  if (admin) {
    try {
      let name = 'name' in target ? target.name : '';
      if ('host' in target) name = String((await admin.db.doc(`siteDomains/${target.host}`).get()).data()?.name || '');
      const d = name ? await admin.db.doc(`siteNames/${name}`).get() : null;
      if (d?.exists) {
        const s = d.data();
        const site = s.owner && s.project ? (await admin.db.doc(`publishedSites/${s.owner}__${s.project}`).get()).data() : undefined;
        info = {
          icon: typeof site?.icon === 'string' && site.icon.startsWith(PNG_DATA_URL) ? site.icon : '',
          title: String(s.title || name),
          description: String(s.description || ''),
          shareText: String(s.shareText || ''),
          keywords: Array.isArray(s.keywords) ? s.keywords.map(String) : [],
        };
      }
    } catch (err) {
      console.error('site head lookup failed', (err as Error)?.message);
    }
  }
  cache.set(key, { at: Date.now(), info });
  return info;
};

// null when the request is not for a published page's HTML, robots.txt or sitemap.xml.
export const serveSiteHead = async (request: Request, assets: Assets): Promise<Response | null> => {
  if (request.method !== 'GET') return null;
  const url = new URL(request.url);
  const target = siteTargetOf(url);
  if (url.pathname === '/robots.txt') return text(robotsFor(target ? url.origin : null), 'text/plain');
  if (!target) return null;
  if (url.pathname === '/sitemap.xml') return (await lookup(target)) ? text(sitemapFor(url.origin), 'application/xml') : null;
  if (url.pathname === '/og-image.png') {
    const icon = (await lookup(target))?.icon;
    if (!icon) return null;
    const bytes = Uint8Array.from(atob(icon.slice(PNG_DATA_URL.length)), (c) => c.charCodeAt(0));
    return new Response(bytes, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' } });
  }
  if (url.pathname !== '/' || url.searchParams.has('r')) return null;
  const info = await lookup(target);
  if (!info) return null;
  const page = await assets.fetch(new Request(new URL('/', url), { headers: { accept: 'text/html' } }));
  if (!page.ok || !(page.headers.get('content-type') || '').includes('text/html')) return page;
  const headers = new Headers(page.headers);
  headers.set('Cache-Control', 'public, max-age=300');
  headers.delete('content-length');
  headers.delete('etag');
  return new Response(injectHead(await page.text(), { ...info, image: !!info.icon, url: `${url.origin}/` }), { status: 200, headers });
};

import test from 'node:test';
import assert from 'node:assert/strict';
import { siteTargetOf, injectHead, robotsFor, sitemapFor, serveSiteHead } from '../worker/site-head';

const html = `<!doctype html><html><head><title>Weelink</title>
<meta name="description" content="old" />
<meta property="og:title" content="old" />
<meta name="twitter:card" content="summary_large_image" />
</head><body></body></html>`;

test('an address is a page by subdomain or by its own domain, never Weelink itself', () => {
  const t = (u: string) => siteTargetOf(new URL(u), 'testweelink.de');
  assert.deepEqual(t('https://alnour.testweelink.de/'), { name: 'alnour' });
  assert.deepEqual(t('https://www.shop.example.com/'), { host: 'shop.example.com' });
  assert.equal(t('https://testweelink.de/'), null);
  assert.equal(t('https://www.testweelink.de/'), null);
  assert.equal(t('https://admin.testweelink.de/'), null);
  assert.equal(t('https://weelink-claude.x.workers.dev/'), null);
});

test('the page title, description and og tags replace Weelink\'s and are escaped', () => {
  const out = injectHead(html, { title: 'مطعم "النور"', description: 'a<b>', keywords: ['x', 'y'], url: 'https://a.testweelink.de/' });
  assert.match(out, /<title>مطعم &quot;النور&quot;<\/title>/);
  assert.equal(out.match(/name="description"/g)?.length, 1);
  assert.equal(out.match(/property="og:title"/g)?.length, 1);
  assert.match(out, /content="a&lt;b&gt;"/);
  assert.match(out, /name="keywords" content="x, y"/);
  assert.match(out, /rel="canonical" href="https:\/\/a\.testweelink\.de\/"/);
  assert.match(out, /twitter:card/);
});

test('robots and sitemap', () => {
  assert.match(robotsFor('https://a.testweelink.de'), /Sitemap: https:\/\/a\.testweelink\.de\/sitemap\.xml/);
  assert.doesNotMatch(robotsFor(null), /Sitemap/);
  assert.match(sitemapFor('https://a.testweelink.de'), /<loc>https:\/\/a\.testweelink\.de\/<\/loc>/);
});

test('Weelink\'s own address is left to the static assets, except robots.txt', async () => {
  const assets = { fetch: async () => new Response(html, { headers: { 'Content-Type': 'text/html' } }) };
  assert.equal(await serveSiteHead(new Request('https://testweelink.de/'), assets), null);
  const robots = await serveSiteHead(new Request('https://testweelink.de/robots.txt'), assets);
  assert.equal(robots?.status, 200);
  assert.equal(await serveSiteHead(new Request('https://a.testweelink.de/', { method: 'POST' }), assets), null);
});

test('a page with a logo gets og:image and the small card; without one nothing is added', () => {
  const base = { title: 'a', description: 'b', keywords: [], url: 'https://a.testweelink.de/' };
  const withLogo = injectHead(html, { ...base, image: true });
  assert.match(withLogo, /property="og:image" content="https:\/\/a\.testweelink\.de\/og-image\.png"/);
  assert.match(withLogo, /name="twitter:card" content="summary"/);
  assert.doesNotMatch(withLogo, /summary_large_image/);
  const without = injectHead(html, base);
  assert.doesNotMatch(without, /og:image/);
  assert.match(without, /summary_large_image/);
});

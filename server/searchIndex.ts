// Weelink's search index on Cloudflare D1 (Eyad, 18 Oct): one row per published page (with its place)
// and one per item (car, dish, product, service), plus FTS5 tables over their normalized text. The pages
// «خدماتنا» (food. car. shop. service.) search it; Firebase stays the home of the data. An index row is
// rebuilt from the published copy whenever the owner publishes (worker/index-site.ts) and dropped on
// unpublish; `visits30` comes from the page's day counters (services/siteStats.ts).
//
// The tables are created on first use (`ensureSchema`), so no migration has to be run by hand.
import { normalizeSearchText } from './searchText.js';

export interface SearchDb {
  prepare(sql: string): { bind(...values: unknown[]): { run(): Promise<unknown>; all<T = any>(): Promise<{ results: T[] }> } };
  batch(statements: unknown[]): Promise<unknown>;
  exec(sql: string): Promise<unknown>;
}

let db: SearchDb | null = null;
export const setSearchDb = (d: SearchDb | null | undefined) => {
  db = d || null;
};
export const searchDb = () => db;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS pages (site_id TEXT PRIMARY KEY, name TEXT NOT NULL, owner TEXT NOT NULL, project TEXT NOT NULL, kind TEXT NOT NULL, title TEXT, description TEXT, keywords TEXT, gov TEXT, city TEXT, area TEXT, village TEXT, lat REAL, lng REAL, plan_rank INTEGER NOT NULL DEFAULT 0, published_at TEXT, visits30 INTEGER NOT NULL DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS pages_kind_gov ON pages (kind, gov, city)`,
  `CREATE TABLE IF NOT EXISTS items (site_id TEXT NOT NULL, item_id TEXT NOT NULL, kind TEXT NOT NULL, no INTEGER NOT NULL DEFAULT 0, name TEXT, description TEXT, price REAL, currency TEXT, image TEXT, category TEXT, PRIMARY KEY (site_id, item_id))`,
  `CREATE INDEX IF NOT EXISTS items_kind_no ON items (kind, no)`,
  `CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(site_id UNINDEXED, text)`,
  `CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(site_id UNINDEXED, item_id UNINDEXED, text)`,
];

let ready = new WeakSet<object>();
export const ensureSchema = async (d: SearchDb) => {
  if (ready.has(d)) return;
  for (const sql of SCHEMA) await d.exec(sql);
  ready.add(d);
};
export const resetSchemaCache = () => {
  ready = new WeakSet();
};

// ---------- what a published site puts in the index ----------

export interface IndexedPage {
  siteId: string;
  name: string;
  owner: string;
  project: string;
  kind: 'page' | 'shop' | 'cars' | 'restaurant';
  title: string;
  description: string;
  keywords: string[];
  place: { governorate?: string; city?: string; area?: string; village?: string; lat?: number | null; lng?: number | null } | null;
  publishedAt: string;
  visits30: number;
}

export interface IndexedItem {
  itemId: string;
  kind: 'car' | 'dish' | 'product' | 'service';
  no: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  category: string; // words that describe it: catalog names, kind of food, make and model…
}

const str = (v: unknown, max = 400) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const plain = (html: unknown) => str(html, 2000).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);

// The items of a published page, by its kind. `data` is the published copy's data (publicData.ts), or for
// a restaurant its published menu.
export const itemsOf = (kind: IndexedPage['kind'], data: any): IndexedItem[] => {
  if (kind === 'page') {
    return (Array.isArray(data?.services) ? data.services : [])
      .filter((s: any) => str(s?.name) && s?.published !== false)
      .map((s: any): IndexedItem => ({ itemId: str(s.id, 80), kind: 'service', no: num(s.publicNo), name: str(s.name, 120), description: plain(s.description), price: 0, currency: '', image: str(s.image, 600), category: str(s.price, 60) }));
  }
  if (kind === 'shop') {
    const names = new Map<string, string>((Array.isArray(data?.catalogs) ? data.catalogs : []).map((c: any) => [str(c?.id, 80), str(c?.name, 80)]));
    return (Array.isArray(data?.products) ? data.products : [])
      .filter((p: any) => str(p?.name) && p?.published !== false)
      .map((p: any): IndexedItem => ({
        itemId: str(p.id, 80), kind: 'product', no: num(p.publicNo), name: str(p.name, 160), description: plain(p.shortDescription || p.description),
        price: num(p.price), currency: str(p.currency, 8), image: str(p.images?.[0], 600),
        category: (Array.isArray(p.catalogIds) ? p.catalogIds : []).map((id: string) => names.get(id) || '').filter(Boolean).join(' '),
      }));
  }
  if (kind === 'cars') {
    return (Array.isArray(data?.cars) ? data.cars : [])
      .filter((c: any) => c?.published !== false && c?.status !== 'sold')
      .map((c: any): IndexedItem => ({
        itemId: str(c.id, 80), kind: 'car', no: num(c.publicNo), name: [str(c.brand, 60), str(c.model, 60), str(c.trim, 60), num(c.year) || ''].filter(Boolean).join(' '),
        description: plain(c.description), price: c.showPrice === false ? 0 : num(c.price), currency: str(c.currency, 8), image: str(c.images?.[0], 600),
        category: [c.vehicleKind, c.vehicleCategory, c.bodyType, c.fuel, c.transmission, c.condition, c.color].map((v) => str(v, 60)).filter(Boolean).join(' '),
      }));
  }
  return (Array.isArray(data?.dishes) ? data.dishes : [])
    .filter((d: any) => str(d?.name) && d?.published !== false)
    .map((d: any): IndexedItem => ({ itemId: str(d.id, 80), kind: 'dish', no: num(d.publicNo), name: str(d.name, 160), description: plain(d.description), price: num(d.price), currency: '', image: str(d.image, 600), category: str(d.cuisine, 80) }));
};

// ---------- writing ----------

const pageText = (p: IndexedPage) => normalizeSearchText([p.name, p.title, p.description, p.keywords.join(' '), p.place?.governorate, p.place?.city, p.place?.area, p.place?.village].join(' '));
const itemText = (i: IndexedItem) => normalizeSearchText([i.name, i.description, i.category].join(' '));

// Replaces everything the index holds for one site with `page` and `items`.
export const indexSite = async (d: SearchDb, page: IndexedPage, items: IndexedItem[]) => {
  await ensureSchema(d);
  const id = page.siteId;
  const place = page.place || {};
  const statements = [
    d.prepare('DELETE FROM pages WHERE site_id = ?').bind(id),
    d.prepare('DELETE FROM pages_fts WHERE site_id = ?').bind(id),
    d.prepare('DELETE FROM items WHERE site_id = ?').bind(id),
    d.prepare('DELETE FROM items_fts WHERE site_id = ?').bind(id),
    d.prepare('INSERT INTO pages (site_id, name, owner, project, kind, title, description, keywords, gov, city, area, village, lat, lng, plan_rank, published_at, visits30) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?)')
      .bind(id, page.name, page.owner, page.project, page.kind, page.title, page.description.slice(0, 300), page.keywords.join(' '), place.governorate || '', place.city || '', place.area || '', place.village || '', place.lat ?? null, place.lng ?? null, page.publishedAt, page.visits30),
    d.prepare('INSERT INTO pages_fts (site_id, text) VALUES (?, ?)').bind(id, pageText(page)),
  ];
  for (const i of items.slice(0, 500)) {
    statements.push(
      d.prepare('INSERT INTO items (site_id, item_id, kind, no, name, description, price, currency, image, category) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id, i.itemId, i.kind, i.no, i.name, i.description, i.price, i.currency, i.image, i.category),
      d.prepare('INSERT INTO items_fts (site_id, item_id, text) VALUES (?, ?, ?)').bind(id, i.itemId, itemText(i))
    );
  }
  await d.batch(statements);
};

export const removeSite = async (d: SearchDb, siteId: string) => {
  await ensureSchema(d);
  await d.batch(['pages', 'pages_fts', 'items', 'items_fts'].map((t) => d.prepare(`DELETE FROM ${t} WHERE site_id = ?`).bind(siteId)));
};

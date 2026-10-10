// Publishing a project as a public website.
//   siteNames/{name}                      the page's name (its address name.testweelink.de); the doc
//                                         id makes it unique. { owner, project, at }
//   publishedSites/{owner}__{project}     the published copy: pages, elements and only the public part
//                                         of the project's data (no costs, customers, orders,
//                                         accounts). Changes in the editor show only after «نشر».
//                                         A restaurant's site stays live in restaurants/{uid}; its
//                                         doc here only gives it a name.
//   siteDomains/{host}                    a customer's own domain → the site's name (written by
//                                         api/domains.ts once the domain is added to Vercel).
//   domainOrders/{id}                     a request to buy a domain through Weelink.
// See firestore.rules.
import { collection, deleteDoc, doc, getDoc, runTransaction, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { CanvasElement, Page } from '../types';
import type { ProjectType } from '../components/shop/shopTypes';

// The domain under which every published page gets its free address. Changing it changes every
// address at once (only the short names are stored).
export const SITE_DOMAIN = (import.meta.env.VITE_SITE_DOMAIN as string | undefined) || 'testweelink.de';

const RESERVED = new Set([
  'www', 'api', 'app', 'admin', 'mail', 'email', 'smtp', 'ftp', 'ns1', 'ns2', 'dns', 'cdn', 'static', 'assets',
  'blog', 'help', 'support', 'status', 'docs', 'dev', 'test', 'staging', 'preview', 'weelink', 'wee', 'login',
  'signup', 'register', 'account', 'dashboard', 'billing', 'pay', 'shop', 'shops', 'store', 'cars', 'restaurant',
]);

export const normalizeSiteName = (raw: string) =>
  raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').slice(0, 30);

// '' when the name may be used, otherwise why not.
export const siteNameProblem = (name: string) => {
  if (!name) return 'اكتب اسماً لصفحتك.';
  if (name.length < 3) return 'الاسم 3 أحرف على الأقل.';
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(name)) return 'استعمل أحرفاً إنجليزية صغيرة وأرقاماً وشرطة (-) في الوسط فقط.';
  if (RESERVED.has(name)) return 'هذا الاسم محجوز لـ Weelink. اختر اسماً آخر.';
  return '';
};

export const siteUrl = (name: string) => `https://${name}.${SITE_DOMAIN}`;
// Works before the free addresses (*.testweelink.de) are set up in Vercel.
export const siteFallbackUrl = (name: string) => `${window.location.origin}/?s=${encodeURIComponent(name)}`;

const siteId = (owner: string, project: ProjectType) => `${owner}__${project}`;

export type NameState = 'free' | 'mine' | 'taken';

export const checkSiteName = async (name: string, owner: string, project: ProjectType): Promise<NameState> => {
  const snap = await getDoc(doc(db, 'siteNames', name));
  if (!snap.exists()) return 'free';
  const d = snap.data();
  return d.owner === owner && d.project === project ? 'mine' : 'taken';
};

export interface CustomDomainState {
  name: string;
  status: 'pending' | 'active' | 'error';
  records?: { type: string; name: string; value: string }[];
  message?: string;
  at: string;
}

export interface PublishedSite {
  name: string;
  project: ProjectType;
  owner: string;
  pages: Page[];
  elements: CanvasElement[];
  data: any; // the project's public data (shop catalog, showroom cars), null for a free page
  publishedAt: string;
  hash: string; // of what was published, to tell the editor whether there are unpublished changes
  customDomain?: CustomDomainState | null;
  icon?: string; // the browser tab's icon (a small PNG data URL), '' = the name's first letter
}

export const readMySite = async (owner: string, project: ProjectType): Promise<PublishedSite | null> => {
  const snap = await getDoc(doc(db, 'publishedSites', siteId(owner, project)));
  return snap.exists() ? (snap.data() as PublishedSite) : null;
};

// A short hash, enough to notice that the editor's content changed since the last «نشر».
export const contentHash = (v: unknown) => {
  const s = JSON.stringify(v);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${s.length}:${(h >>> 0).toString(36)}`;
};

// Firestore rejects undefined values; JSON drops them.
const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

// Publishes (or republishes) the project under `name`, taking the name over from the old one.
export const publishSite = async (
  owner: string,
  project: ProjectType,
  name: string,
  content: { pages: Page[]; elements: CanvasElement[]; data: any }
) => {
  const ref = doc(db, 'publishedSites', siteId(owner, project));
  const nameRef = doc(db, 'siteNames', name);
  const now = new Date().toISOString();
  await runTransaction(db, async (tx) => {
    const [taken, current] = await Promise.all([tx.get(nameRef), tx.get(ref)]);
    if (taken.exists() && (taken.data().owner !== owner || taken.data().project !== project)) throw new Error('name-taken');
    const oldName = current.exists() ? current.data().name : '';
    if (!taken.exists()) tx.set(nameRef, { owner, project, at: now });
    if (oldName && oldName !== name) tx.delete(doc(db, 'siteNames', oldName));
    tx.set(ref, {
      name,
      project,
      owner,
      pages: clean(content.pages),
      elements: clean(content.elements),
      data: content.data === undefined ? null : clean(content.data),
      publishedAt: now,
      hash: contentHash(content),
      customDomain: current.exists() ? current.data().customDomain ?? null : null,
      icon: current.exists() ? current.data().icon || '' : '',
    });
  });
};

// The browser tab's icon, changed without publishing again.
export const setSiteIcon = (owner: string, project: ProjectType, icon: string) =>
  updateDoc(doc(db, 'publishedSites', siteId(owner, project)), { icon });

// A logo picked by the customer, as a 192×192 PNG (the image fills the square, centred).
export const makeSiteIcon = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 192;
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d');
      if (!ctx) return reject(new Error('no-canvas'));
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('bad-image'));
    };
    img.src = url;
  });

// The first letter of the page's name on a blue square, when there is no logo.
export const letterIcon = (name: string) => {
  const c = document.createElement('canvas');
  c.width = 192;
  c.height = 192;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#0071e3';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(0, 0, 192, 192, 40);
  else ctx.rect(0, 0, 192, 192);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 110px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((name[0] || 'W').toUpperCase(), 96, 104);
  return c.toDataURL('image/png');
};

export const unpublishSite = async (owner: string, project: ProjectType) => {
  const ref = doc(db, 'publishedSites', siteId(owner, project));
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const name = snap.data().name;
  await deleteDoc(ref);
  if (name) await deleteDoc(doc(db, 'siteNames', name)).catch(() => {});
};

// ---------- Visitors ----------

// Which published site this address shows: ?s=<name>, <name>.testweelink.de, or a customer's
// own domain. null for Weelink itself.
export const siteFromLocation = (): { name: string } | { host: string } | null => {
  const s = new URLSearchParams(window.location.search).get('s');
  if (s) return { name: normalizeSiteName(s) };
  const host = window.location.hostname.toLowerCase();
  if (host.endsWith(`.${SITE_DOMAIN}`)) {
    const sub = host.slice(0, -(SITE_DOMAIN.length + 1));
    return sub && sub !== 'www' && !sub.includes('.') ? { name: sub } : null;
  }
  const ours = host === SITE_DOMAIN || host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app') || host === 'weelink.de' || host.endsWith('.weelink.de');
  return ours ? null : { host: host.replace(/^www\./, '') };
};

export const loadPublishedSite = async (where: { name: string } | { host: string }): Promise<PublishedSite | null> => {
  let name = 'name' in where ? where.name : '';
  if ('host' in where) {
    const d = await getDoc(doc(db, 'siteDomains', where.host));
    name = d.exists() ? String(d.data().name || '') : '';
  }
  if (!name) return null;
  const n = await getDoc(doc(db, 'siteNames', name));
  if (!n.exists()) return null;
  const { owner, project } = n.data();
  const snap = await getDoc(doc(db, 'publishedSites', siteId(owner, project)));
  return snap.exists() ? (snap.data() as PublishedSite) : null;
};

// ---------- Domains (api/domains.ts) ----------

export type DomainAnswer<T> = T | { error: string };

const callDomains = async <T,>(body: object): Promise<DomainAnswer<T>> => {
  try {
    const user = auth.currentUser;
    const res = await fetch('/api/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${await user.getIdToken()}` } : {}) },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? (data as T) : { error: String(data.error || 'network') };
  } catch {
    return { error: 'network' };
  }
};

export const normalizeDomain = (raw: string) =>
  raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');

export const isValidDomain = (d: string) => /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(d);

// The customer's own domain: added to Weelink's Vercel project; returns the DNS records to set.
export const connectDomain = (owner: string, project: ProjectType, domain: string) =>
  callDomains<{ domain: CustomDomainState }>({ action: 'connect', owner, project, domain });

export const checkDomain = (owner: string, project: ProjectType) => callDomains<{ domain: CustomDomainState }>({ action: 'check', owner, project });

export const removeDomain = (owner: string, project: ProjectType) => callDomains<{ removed: true }>({ action: 'remove', owner, project });

// Whether a domain can be bought, and for how much (through Weelink's Vercel account).
export const domainPrice = (domain: string) =>
  callDomains<{ available: boolean; price: number | null; years: number; currency: string }>({ action: 'price', domain });

export interface DomainContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  country: string; // ISO code, e.g. SY, DE
}

// A request to buy a domain through Weelink. It is paid at the office and bought by Weelink; the
// purchase itself is not automatic yet.
export const requestDomainPurchase = async (owner: string, project: ProjectType, domain: string, years: number, contact: DomainContact, price: number | null) => {
  const ref = doc(collection(db, 'domainOrders'));
  await setDoc(ref, {
    owner,
    project,
    domain,
    years,
    contact,
    price,
    status: 'requested',
    by: auth.currentUser?.uid || '',
    at: new Date().toISOString(),
  });
  return ref.id;
};

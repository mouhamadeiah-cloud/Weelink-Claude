// Publishing the «Weelink AI» gallery pages (scripts/gallery/pages → src/data/galleryPages/pages.json) from the
// admin site. The pages carry photos as `photo:<english search>` or `photo:<search>#<n>` (the n-th result);
// each search is run once on Unsplash and its first ten results are kept in platformSettings/galleryPhotos, so a
// page is published only when all its photos are found, and a rate limit (a demo Unsplash key allows 50 searches an
// hour) only means «run it again later»: what was found is not asked for twice.
// A page is saved as gallerySlides/weelink-ai_<key>: designer «Weelink AI», official (it cannot be hired). It is staged as
// «بانتظار المراجعة» (Eyad, 15 Oct: the owner looks at each, edits it in the designer's panel, then approves it); `publish`
// saves it approved at once. A page the admin edited by hand (editedBy) is never rebuilt, whatever `overwrite` says.
import { FieldValue } from 'firebase-admin/firestore';
import pagesFile from '../src/data/galleryPages/pages.json' with { type: 'json' };

export const OFFICIAL_UID = 'weelink-ai';
export const OFFICIAL_NAME = 'Weelink AI';

interface Found { id: string; url: string; by: string; link: string }
type Cache = Record<string, Found[]>;
interface PageDoc { key: string; name: string; category: string; page: any; elements: any[] }

const PAGES = pagesFile as unknown as PageDoc[];
const PHOTO = /photo:([^"#]+?)(?:#(\d+))?(?=")/g;

const queriesOf = (p: PageDoc): string[] => {
  const out = new Set<string>();
  for (const m of JSON.stringify([p.page, p.elements]).matchAll(PHOTO)) out.add(m[1].trim());
  return [...out];
};

// Each slide of a page is also a slide of its own in the gallery (gallerySlides/weelink-ai_<key>_s<n>, `derivedFrom` = the page's doc),
// so «إضافة شريحة» finds them too. A link inside a slide to another slide of its page leads nowhere on its own, so it is dropped. The
// slide is saved with the page's status; the admin's decision on the page is applied to them (api/admin.ts), and a slide the
// admin edited by hand (editedBy) is never rebuilt.
const plain = (html: unknown) => String(html || '').replace(/<[^>]*>/g, ' ');
export const slideRole = (els: any[], index: number, count: number): string => {
  const types = new Set(els.map((e) => e.type));
  const text = els.filter((e) => e.type === 'heading' || e.type === 'paragraph').map((e) => plain(e.content)).join(' ');
  if (types.has('calendar')) return 'booking';
  if (types.has('menuList') || types.has('menuCart')) return 'menu';
  if (types.has('carListings') || types.has('carSearch')) return 'cars';
  if (types.has('shopProducts') || types.has('shopSearch') || types.has('cart') || types.has('checkout')) return 'products';
  if (types.has('ratings')) return 'reviews';
  if (types.has('pricing') || types.has('table')) return 'services';
  if (els.filter((e) => e.type === 'input').length >= 2) return 'contact';
  if (/عرض خاص|عروض|خصم|تخفيض/.test(text)) return 'offers';
  if (/من نحن|قصتنا|فريقنا/.test(text)) return 'about';
  if (types.has('gallery')) return 'gallery';
  if (index === 0) return 'hero';
  return index === count - 1 ? 'contact' : 'services';
};

const unlink = (e: any) => {
  if (e.linkType !== 'slide' && e.linkType !== 'page') return e;
  const { linkType: _t, linkTargetId: _id, linkUrl: _u, ...rest } = e;
  return rest;
};

export const derivedSlides = (pageId: string, p: { key: string; name: string }, page: any, elements: any[]) => {
  const slides: any[] = page?.slides || [];
  return slides.map((slide, i) => {
    const els = elements.filter((e) => e.slideId === slide.id);
    return {
      id: `${pageId}_s${i + 1}`,
      doc: {
        key: `${p.key}_s${i + 1}`, derivedFrom: pageId, designerUid: OFFICIAL_UID, designerName: OFFICIAL_NAME, official: true,
        name: `${p.name} · ${String(slide.name || `شريحة ${i + 1}`).slice(0, 40)}`, category: slideRole(els, i, slides.length), kind: 'slide', page: null, draftSlot: '',
        slide, elements: els.map(unlink),
      },
    };
  });
};

const accessKey = () => process.env.UNSPLASH_ACCESS_KEY || process.env.VITE_UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_KEY || '';

const search = async (q: string, key: string): Promise<{ found?: Found[]; limited?: boolean; failed?: string }> => {
  const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=10&orientation=landscape&content_filter=high`, {
    headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' },
  });
  if (res.status === 403 || res.status === 429) return { limited: true };
  if (!res.ok) return { failed: `unsplash ${res.status}` };
  const data: any = await res.json();
  const found: Found[] = (data.results || []).slice(0, 10).map((p: any) => ({
    id: String(p.id),
    url: `${p.urls?.raw}&w=1600&q=72&fm=jpg&fit=crop`,
    by: String(p.user?.name || ''),
    link: String(p.links?.html || ''),
  }));
  return found.length ? { found } : { failed: 'no results' };
};

const withPhotos = (p: PageDoc, cache: Cache) => {
  const credits = new Map<string, Found>();
  const text = JSON.stringify([p.page, p.elements]).replace(PHOTO, (_all, q: string, n?: string) => {
    const list = cache[q.trim()] || [];
    const pick = list[(n ? Number(n) : 0) % Math.max(1, list.length)];
    if (!pick) return _all;
    credits.set(pick.id, pick);
    return pick.url;
  });
  const [page, elements] = JSON.parse(text);
  return { page, elements, credits: [...credits.values()].map((c) => ({ by: c.by, link: c.link })) };
};

export const gallerySeedStatus = async (db: any) => {
  const cache = ((await db.collection('platformSettings').doc('galleryPhotos').get()).data()?.items || {}) as Cache;
  const done = await db.collection('gallerySlides').where('designerUid', '==', OFFICIAL_UID).get();
  const have = new Set<string>(done.docs.map((d: any) => String(d.data().key || '')));
  const need = new Set<string>();
  for (const p of PAGES) for (const q of queriesOf(p)) if (!cache[q]) need.add(q);
  const state = new Map<string, string>(done.docs.map((d: any) => [String(d.data().key || ''), String(d.data().status || '')]));
  return {
    total: PAGES.length, published: PAGES.filter((p) => state.get(p.key) === 'approved').length, staged: PAGES.filter((p) => have.has(p.key) && state.get(p.key) !== 'approved').length,
    searchesLeft: need.size, unsplash: !!accessKey(),
  };
};

// Writes the slides of a page as gallery slides: the missing ones always, all of them when the page was rebuilt.
const writeDerived = async (db: any, pageId: string, p: PageDoc, pageData: any, rebuild: boolean) => {
  const now = Date.now();
  for (const d of derivedSlides(pageId, p, pageData.page, pageData.elements || [])) {
    const ref = db.collection('gallerySlides').doc(d.id);
    const existing = (await ref.get()).data();
    if (existing && (!rebuild || existing.editedBy)) continue;
    const status = String(pageData.status || 'pending');
    await ref.set({
      ...d.doc, photoCredits: pageData.photoCredits || [], status, lawVersion: 0,
      ...(status === 'approved' ? { approvedAt: existing?.approvedAt || pageData.approvedAt || now, reviewedBy: 'weelink-ai' } : {}),
      likes: Number(existing?.likes) || 0, dislikes: Number(existing?.dislikes) || 0, uses: Number(existing?.uses) || 0,
      createdAt: existing?.createdAt || FieldValue.serverTimestamp(),
    });
  }
};

// Runs the missing searches (at most `budget`), then publishes every page whose photos are all found.
export const gallerySeed = async (db: any, opts: { budget: number; overwrite: boolean; only?: string; publish?: boolean }) => {
  const key = accessKey();
  if (!key) return { error: 'no-unsplash-key' as const };
  const cacheRef = db.collection('platformSettings').doc('galleryPhotos');
  const cache = ((await cacheRef.get()).data()?.items || {}) as Cache;
  const pages = PAGES.filter((p) => !opts.only || p.key === opts.only);
  let limited = false;
  let spent = 0;
  const failed: string[] = [];
  for (const p of pages) {
    for (const q of queriesOf(p)) {
      if (cache[q] || limited || spent >= opts.budget) continue;
      spent += 1;
      const r = await search(q, key);
      if (r.found) cache[q] = r.found;
      else if (r.limited) limited = true;
      else failed.push(`${q}: ${r.failed}`);
    }
  }
  if (spent) await cacheRef.set({ items: cache, updatedAt: Date.now() });

  const published: string[] = [];
  const waiting: string[] = [];
  const now = Date.now();
  for (const p of pages) {
    if (queriesOf(p).some((q) => !cache[q])) {
      waiting.push(p.key);
      continue;
    }
    const ref = db.collection('gallerySlides').doc(`${OFFICIAL_UID}_${p.key}`);
    const existing = (await ref.get()).data();
    if (existing && (!opts.overwrite || existing.editedBy)) {
      await writeDerived(db, ref.id, p, existing, false);
      published.push(p.key);
      continue;
    }
    const built = withPhotos(p, cache);
    await ref.set({
      key: p.key, designerUid: OFFICIAL_UID, designerName: OFFICIAL_NAME, official: true,
      name: p.name, category: p.category, kind: 'page', draftSlot: '', slide: built.page.slides[0], page: built.page, elements: built.elements,
      photoCredits: built.credits, status: opts.publish ? 'approved' : (existing?.status || 'pending'), lawVersion: 0, ...(opts.publish ? { approvedAt: existing?.approvedAt || now, reviewedBy: 'weelink-ai', reviewedAt: now } : {}),
      likes: Number(existing?.likes) || 0, dislikes: Number(existing?.dislikes) || 0, uses: Number(existing?.uses) || 0,
      createdAt: existing?.createdAt || FieldValue.serverTimestamp(),
    });
    await writeDerived(db, ref.id, p, { page: built.page, elements: built.elements, status: opts.publish ? 'approved' : (existing?.status || 'pending'), approvedAt: opts.publish ? (existing?.approvedAt || now) : existing?.approvedAt, photoCredits: built.credits }, true);
    published.push(p.key);
  }
  return { published, waiting, limited, spent, failed };
};

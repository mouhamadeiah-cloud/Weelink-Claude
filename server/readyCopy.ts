// Copying the editor's ready slides into the gallery (Eyad, 21 Oct; docs/READY_SLIDES_PLAN.md, step 2): the ready slides of the code
// (src/data/galleryReady/ready.json, written by `npm run ready-to-gallery`) become gallery slides of Weelink («Weelink AI», official),
// each one remembering the ready category and place it came from (`seededFrom`). Nothing changes for the editor yet: its panel still
// shows the code's slides. Staged as «بانتظار المراجعة» (the admin looks at them, edits them in the designer's panel and approves), or
// published at once. A slide the admin edited by hand (editedBy) is never rebuilt.
import { FieldValue } from './firebase.js';
import readyFile from '../src/data/galleryReady/ready.json' with { type: 'json' };
import { OFFICIAL_UID } from './gallerySeed.js';

const OFFICIAL_NAME = 'Weelink AI';

interface ReadyItem { key: string; readyCategory: string; index: number; name: string; category: string; slide: any; elements: any[] }
const ITEMS = readyFile as unknown as ReadyItem[];

export const readyDocId = (key: string) => `weelink-ready_${key}`;

export const readyCopyStatus = async (db: any) => {
  const snap = await db.collection('gallerySlides').where('designerUid', '==', OFFICIAL_UID).get();
  const state = new Map<string, string>(snap.docs.filter((d: any) => d.data().seededFrom).map((d: any) => [d.id, String(d.data().status || '')]));
  return {
    total: ITEMS.length,
    copied: ITEMS.filter((i) => state.has(readyDocId(i.key))).length,
    published: ITEMS.filter((i) => state.get(readyDocId(i.key)) === 'approved').length,
  };
};

// Writes a slice of the ready slides as gallery slides (the missing ones always, all of them when `overwrite` is on): a call does at most
// `limit` of them from `from`, and says where the next one starts (null when done), so a long copy is many short calls.
export const readyCopy = async (db: any, opts: { publish: boolean; overwrite: boolean; from?: number; limit?: number }) => {
  const now = Date.now();
  const from = Math.max(0, Math.floor(opts.from || 0));
  const limit = Math.min(60, Math.max(1, Math.floor(opts.limit || 30)));
  const slice = ITEMS.slice(from, from + limit);
  const have = new Map<string, any>();
  for (const d of (await db.collection('gallerySlides').where('designerUid', '==', OFFICIAL_UID).get()).docs) have.set(d.id, d.data());
  let written = 0;
  let kept = 0;
  const batch = db.batch();
  for (const item of slice) {
    const id = readyDocId(item.key);
    const existing = have.get(id);
    if (existing && (!opts.overwrite || existing.editedBy)) {
      kept += 1;
      continue;
    }
    const status = opts.publish ? 'approved' : String(existing?.status || 'pending');
    batch.set(db.collection('gallerySlides').doc(id), {
      key: id, designerUid: OFFICIAL_UID, designerName: OFFICIAL_NAME, official: true,
      name: item.name, category: item.category, kind: 'slide', page: null, draftSlot: '', slide: item.slide, elements: item.elements,
      seededFrom: { category: item.readyCategory, index: item.index },
      status, lawVersion: 0, ...(status === 'approved' ? { approvedAt: existing?.approvedAt || now, reviewedBy: 'weelink-ai', reviewedAt: now } : {}),
      likes: Number(existing?.likes) || 0, dislikes: Number(existing?.dislikes) || 0, uses: Number(existing?.uses) || 0,
      createdAt: existing?.createdAt || FieldValue.serverTimestamp(),
    });
    written += 1;
  }
  if (written) await batch.commit();
  const next = from + slice.length < ITEMS.length ? from + slice.length : null;
  return { written, kept, next, total: ITEMS.length };
};

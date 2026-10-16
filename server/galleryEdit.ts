// Editing a design that is already in the gallery (Eyad, 15 Oct): the admin edits anything, a designer edits only
// their own, and both go through the same checks as an export (a page of one to three slides, no raw HTML, no
// contact details, safe links, a size the document can hold). Used by api/admin.ts and server/gallery.ts.
//   admin   → the design changes in place (its status, likes and uses stay).
//   designer, design not approved yet (pending or rejected) → changes in place and goes back to «بانتظار المراجعة».
//   designer, design approved → the change waits in galleryEdits/{id} (server only) while the approved version stays
//           in the gallery; the admin approves it (it replaces the live one) or rejects it with a reason.
import { findContactInfo, findNavbarContact } from '../src/utils/contactCheck.js';

export const SLIDE_CATEGORY_IDS = ['hero', 'about', 'services', 'gallery', 'team', 'reviews', 'offers', 'booking', 'contact', 'menu', 'cars', 'products', 'legal', 'other'];
export const PAGE_CATEGORY_IDS = ['p-business', 'p-restaurant', 'p-cars', 'p-shop'];

const MAX_BYTES = 900_000;
const MAX_ELEMENTS = 400;
const SAFE_LINK = /^(#|https?:\/\/|mailto:|tel:|sms:|whatsapp:|tg:)/i;

export interface DesignInput {
  kind: 'slide' | 'page';
  page?: { navbar?: any; slides?: any[] };
  elements?: any[];
  name?: unknown;
  category?: unknown;
  designerName?: unknown;
}

export type Checked = { error: string; kinds?: string[] } | { slide: any; page: any; elements: any[]; name?: string; category?: string; designerName?: string };

const clean = (v: unknown): any => JSON.parse(JSON.stringify(v ?? null));

// A design as the editor holds it, made ready to store; or why it cannot be stored.
export const checkDesign = (input: DesignInput): Checked => {
  const slides = input.page?.slides;
  const elements = input.elements;
  if (!Array.isArray(slides) || slides.length < 1 || !Array.isArray(elements)) return { error: 'bad_request' };
  if (input.kind === 'slide' ? slides.length !== 1 : slides.length > 3) return { error: input.kind === 'slide' ? 'bad_request' : 'too_many_slides' };
  if (elements.length > MAX_ELEMENTS) return { error: 'too_many_elements' };
  if (JSON.stringify({ slides, elements, navbar: input.page?.navbar }).length > MAX_BYTES) return { error: 'too_big' };
  const ids = new Set<string>();
  for (const s of slides) {
    if (!s || typeof s.id !== 'string' || !s.id) return { error: 'bad_request' };
    ids.add(s.id);
  }
  for (const e of elements) {
    if (!e || typeof e.type !== 'string' || typeof e.slideId !== 'string' || !ids.has(e.slideId)) return { error: 'bad_request' };
    if (e.type === 'html') return { error: 'html_not_allowed' };
    if (typeof e.linkUrl === 'string' && e.linkUrl && !SAFE_LINK.test(e.linkUrl.trim())) return { error: 'unsafe_link' };
  }
  const found = [...findContactInfo(elements), ...(input.kind === 'page' ? findNavbarContact(input.page?.navbar) : [])];
  if (found.length) return { error: 'contact', kinds: [...new Set(found.map((f) => f.kind))] };

  const out: any = { slide: clean(slides[0]), page: input.kind === 'page' ? clean({ navbar: input.page?.navbar, slides }) : undefined, elements: clean(elements) };
  if (input.name !== undefined) {
    const name = String(input.name).replace(/[\u0000-\u001f]/g, ' ').trim();
    if (name.length < 2 || name.length > 60) return { error: 'bad_name' };
    out.name = name;
  }
  if (input.category !== undefined) {
    if (!(input.kind === 'page' ? PAGE_CATEGORY_IDS : SLIDE_CATEGORY_IDS).includes(String(input.category))) return { error: 'bad_category' };
    out.category = String(input.category);
  }
  if (input.designerName !== undefined) {
    const n = String(input.designerName).trim().slice(0, 60);
    if (n.length < 2) return { error: 'bad_name' };
    out.designerName = n;
  }
  return out;
};

const toRow = (id: string, x: Record<string, any>) => ({
  id, kind: x.kind === 'page' ? 'page' : 'slide', name: String(x.name || ''), category: String(x.category || ''),
  designerUid: String(x.designerUid || ''), designerName: String(x.designerName || ''), status: String(x.status || 'pending'),
  official: x.official === true, slide: x.slide || {}, page: x.kind === 'page' ? x.page || null : null, elements: Array.isArray(x.elements) ? x.elements : [],
});

// What the editor opens: the design as it is (the admin) or as the designer last left it (their pending change, if any).
export const loadForEdit = async (db: any, id: string, who: { admin: true } | { designerUid: string }) => {
  const snap = await db.collection('gallerySlides').doc(id).get();
  const live = snap.data() as Record<string, any> | undefined;
  if (!live) return { error: 'not_found' as const };
  if ('designerUid' in who && live.designerUid !== who.designerUid) return { error: 'not_found' as const };
  const edit = (await db.collection('galleryEdits').doc(id).get()).data() as Record<string, any> | undefined;
  const useEdit = !!edit && edit.status === 'pending' && 'designerUid' in who;
  return {
    design: toRow(id, useEdit ? { ...live, ...edit, status: live.status } : live),
    pendingEdit: !!edit && edit.status === 'pending',
    editRejected: edit && edit.status === 'rejected' ? String(edit.reason || '') : '',
  };
};

export const adminSave = async (db: any, id: string, input: Omit<DesignInput, 'kind'>, by: string) => {
  const ref = db.collection('gallerySlides').doc(id);
  const live = (await ref.get()).data() as Record<string, any> | undefined;
  if (!live) return { error: 'not_found' };
  const kind = live.kind === 'page' ? 'page' : 'slide';
  const checked = checkDesign({ ...input, kind });
  if ('error' in checked) return checked;
  const { page, ...rest } = checked;
  await ref.update({ ...rest, ...(kind === 'page' ? { page } : {}), editedBy: `admin:${by}`, editedAt: Date.now() });
  return { ok: true as const };
};

export const designerSave = async (db: any, uid: string, id: string, input: Omit<DesignInput, 'kind'>) => {
  const ref = db.collection('gallerySlides').doc(id);
  const live = (await ref.get()).data() as Record<string, any> | undefined;
  if (!live || live.designerUid !== uid) return { error: 'not_found' };
  const kind = live.kind === 'page' ? 'page' : 'slide';
  const checked = checkDesign({ kind, page: input.page, elements: input.elements, name: input.name ?? live.name, category: input.category ?? live.category });
  if ('error' in checked) return checked;
  const { page, designerName: _ignored, ...rest } = checked;
  const now = Date.now();
  if (live.status === 'approved') {
    await db.collection('galleryEdits').doc(id).set({ ...rest, ...(kind === 'page' ? { page } : {}), kind, designerUid: uid, designerName: String(live.designerName || ''), status: 'pending', at: now });
    return { ok: true as const, mode: 'review' as const };
  }
  await ref.update({ ...rest, ...(kind === 'page' ? { page } : {}), status: 'pending', reason: '', editedBy: `designer:${uid}`, editedAt: now });
  return { ok: true as const, mode: 'direct' as const };
};

// The admin's answer to a designer's change of an approved design.
export const reviewEdit = async (db: any, id: string, decision: 'approve' | 'reject', reason: string, by: string) => {
  const editRef = db.collection('galleryEdits').doc(id);
  const edit = (await editRef.get()).data() as Record<string, any> | undefined;
  if (!edit || edit.status !== 'pending') return { error: 'not_found' };
  if (decision === 'reject') {
    await editRef.update({ status: 'rejected', reason, reviewedBy: by, reviewedAt: Date.now() });
    return { ok: true as const };
  }
  const ref = db.collection('gallerySlides').doc(id);
  if (!(await ref.get()).exists) return { error: 'not_found' };
  const { status: _s, reason: _r, at: _a, designerUid: _d, designerName: _n, kind, ...content } = edit;
  await ref.update({ ...content, editedBy: `designer:${edit.designerUid}`, editedAt: Date.now(), reviewedBy: by, reviewedAt: Date.now(), reason: '' });
  await editRef.delete();
  return { ok: true as const };
};

// Pending designer changes, shaped like the review list's rows so the admin site shows them beside the new exports.
export const pendingEditRows = async (db: any) => {
  const snap = await db.collection('galleryEdits').where('status', '==', 'pending').get();
  return snap.docs.map((d: any) => ({ ...toRow(d.id, { ...d.data(), status: 'pending' }), isEdit: true, createdAt: Number(d.data().at) || 0, reason: '', reviewedBy: '', lawVersion: 0, acceptedAt: '' }));
};

export const deleteDesign = async (db: any, id: string) => {
  const ref = db.collection('gallerySlides').doc(id);
  if (!(await ref.get()).exists) return { error: 'not_found' };
  await ref.delete();
  await db.collection('galleryEdits').doc(id).delete();
  // A page's own slides in the gallery go with it.
  const derived = await db.collection('gallerySlides').where('derivedFrom', '==', id).get();
  for (const d of derived.docs) await d.ref.delete();
  return { ok: true as const };
};

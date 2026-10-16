import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adminSave, checkDesign, deleteDesign, designerSave, loadForEdit, pendingEditRows, reviewEdit } from '../server/galleryEdit.ts';
import { getFirestore, store } from './fakeAdmin.ts';

const db = getFirestore() as any;
const slide = (id: string) => ({ id, name: 'شريحة', height: 600, backgroundColor: '#fff' });
const el = (id: string, slideId: string, extra: any = {}) => ({ id, slideId, type: 'heading', name: 'عنوان', x: 0, y: 0, width: 100, height: 50, content: 'مرحبا بكم', styles: {}, ...extra });
const page = (n = 1) => ({ navbar: { brandName: 'اسم', items: [], ctaText: '', ctaHref: '', bgColor: '#fff', textColor: '#000', isSticky: true }, slides: Array.from({ length: n }, (_, i) => slide(`s${i + 1}`)) });

const seed = (status: string, extra: any = {}) => store.set('gallerySlides/g1', { kind: 'page', name: 'صفحة', category: 'p-business', designerUid: 'des', designerName: 'سارة', status, likes: 5, dislikes: 1, uses: 3, slide: slide('s1'), page: page(), elements: [el('e1', 's1')], ...extra });

test('a good page passes and comes back ready to store', () => {
  const r: any = checkDesign({ kind: 'page', page: page(2), elements: [el('e1', 's1')], name: 'اسم جديد', category: 'p-shop' });
  assert.ok(!r.error, JSON.stringify(r));
  assert.equal(r.slide.id, 's1');
  assert.equal(r.name, 'اسم جديد');
});

test('refused: raw HTML, contact details, a fourth slide, a javascript link, an unknown category, a foreign slide id', () => {
  const bad = (input: any, code: string) => assert.equal((checkDesign(input) as any).error, code, code);
  bad({ kind: 'page', page: page(), elements: [el('e1', 's1', { type: 'html', htmlCode: '<img onerror=1>' })] }, 'html_not_allowed');
  bad({ kind: 'page', page: page(), elements: [el('e1', 's1', { content: 'اتصل 0933 123 456' })] }, 'contact');
  bad({ kind: 'page', page: page(4), elements: [el('e1', 's1')] }, 'too_many_slides');
  bad({ kind: 'page', page: page(), elements: [el('e1', 's1', { linkUrl: 'javascript:alert(1)' })] }, 'unsafe_link');
  bad({ kind: 'page', page: page(), elements: [el('e1', 's1')], category: 'nope' }, 'bad_category');
  bad({ kind: 'page', page: page(), elements: [el('e1', 'other')] }, 'bad_request');
  bad({ kind: 'slide', page: page(2), elements: [el('e1', 's1')] }, 'bad_request');
});

test('the admin saves in place: status, likes and uses stay, the editor is recorded', async () => {
  seed('approved');
  const r: any = await adminSave(db, 'g1', { page: page(2), elements: [el('e2', 's1', { content: 'جديد' })], name: 'معدّل' }, 'eyad');
  assert.ok(r.ok);
  const d = store.get('gallerySlides/g1');
  assert.equal(d.status, 'approved');
  assert.equal(d.likes, 5);
  assert.equal(d.uses, 3);
  assert.equal(d.name, 'معدّل');
  assert.equal(d.page.slides.length, 2);
  assert.equal(d.editedBy, 'admin:eyad');
});

test('the admin save is checked like an export', async () => {
  seed('approved');
  const r: any = await adminSave(db, 'g1', { page: page(), elements: [el('e1', 's1', { content: 'www.mysite.com' })] }, 'eyad');
  assert.equal(r.error, 'contact');
  assert.equal(store.get('gallerySlides/g1').elements[0].content, 'مرحبا بكم');
});

test('a designer edits only their own design', async () => {
  seed('approved');
  assert.equal(((await designerSave(db, 'someone-else', 'g1', { page: page(), elements: [el('e1', 's1')] })) as any).error, 'not_found');
  assert.equal(((await loadForEdit(db, 'g1', { designerUid: 'someone-else' })) as any).error, 'not_found');
});

test('an approved design: the designer\'s change waits for review, the live one stays', async () => {
  seed('approved');
  store.delete('galleryEdits/g1');
  const r: any = await designerSave(db, 'des', 'g1', { page: page(), elements: [el('e1', 's1', { content: 'نسخة المصمم' })] });
  assert.equal(r.mode, 'review');
  assert.equal(store.get('gallerySlides/g1').elements[0].content, 'مرحبا بكم');
  assert.equal(store.get('galleryEdits/g1').status, 'pending');
  const opened: any = await loadForEdit(db, 'g1', { designerUid: 'des' });
  assert.equal(opened.pendingEdit, true);
  assert.equal(opened.design.elements[0].content, 'نسخة المصمم');
  assert.equal(((await loadForEdit(db, 'g1', { admin: true })) as any).design.elements[0].content, 'مرحبا بكم');
  assert.equal((await pendingEditRows(db)).length, 1);
});

test('the admin approves the change: it replaces the live design and keeps the counters', async () => {
  const r: any = await reviewEdit(db, 'g1', 'approve', '', 'eyad');
  assert.ok(r.ok);
  const d = store.get('gallerySlides/g1');
  assert.equal(d.elements[0].content, 'نسخة المصمم');
  assert.equal(d.likes, 5);
  assert.equal(d.status, 'approved');
  assert.equal(store.has('galleryEdits/g1'), false);
});

test('the admin can reject a change with a reason, and the designer is told', async () => {
  await designerSave(db, 'des', 'g1', { page: page(), elements: [el('e1', 's1', { content: 'محاولة ثانية' })] });
  assert.ok(((await reviewEdit(db, 'g1', 'reject', 'الألوان لا تناسب', 'eyad')) as any).ok);
  assert.equal(store.get('gallerySlides/g1').elements[0].content, 'نسخة المصمم');
  assert.equal(((await loadForEdit(db, 'g1', { designerUid: 'des' })) as any).editRejected, 'الألوان لا تناسب');
});

test('a design not approved yet is changed in place and goes back to review', async () => {
  seed('rejected', { reason: 'قديم' });
  const r: any = await designerSave(db, 'des', 'g1', { page: page(), elements: [el('e1', 's1', { content: 'بعد الرفض' })] });
  assert.equal(r.mode, 'direct');
  const d = store.get('gallerySlides/g1');
  assert.equal(d.status, 'pending');
  assert.equal(d.reason, '');
  assert.equal(d.elements[0].content, 'بعد الرفض');
});

test('the admin deletes a design for good', async () => {
  assert.ok(((await deleteDesign(db, 'g1')) as any).ok);
  assert.equal(store.has('gallerySlides/g1'), false);
  assert.equal(((await deleteDesign(db, 'g1')) as any).error, 'not_found');
});

test('deleting a page also deletes the slides taken from it, and only those', async () => {
  seed('approved');
  store.set('gallerySlides/g1_s1', { kind: 'slide', derivedFrom: 'g1', name: 'ش1', status: 'approved' });
  store.set('gallerySlides/g1_s2', { kind: 'slide', derivedFrom: 'g1', name: 'ش2', status: 'approved' });
  store.set('gallerySlides/other_s1', { kind: 'slide', derivedFrom: 'other', name: 'غريبة', status: 'approved' });
  assert.ok(((await deleteDesign(db, 'g1')) as any).ok);
  assert.ok(!store.has('gallerySlides/g1_s1') && !store.has('gallerySlides/g1_s2'));
  assert.ok(store.has('gallerySlides/other_s1'));
});

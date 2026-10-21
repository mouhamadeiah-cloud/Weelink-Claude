import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPageFromPlan } from '../src/services/pageBuilder.ts';
// Importing the builder starts Firebase's browser client, which keeps the process alive: close it when the test is over.
after(async () => {
  const { getApps, deleteApp } = await import('firebase/app');
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

// The browser's builder (src/services/pageBuilder.ts) builds a section from a gallery slide the server chose, filling its marked texts.
test('a gallery slide in the plan is built with the AI\'s texts in its marked places', async () => {
  const extra = { 'g:abc': { name: 'تجربة', slide: { id: 's1', height: 500, backgroundColor: '#ffffff' }, elements: [
    { id: 'a', type: 'heading', slideId: 's1', x: 100, y: 80, width: 600, height: 60, content: 'عنوان تجريبي', aiSlot: 'title', styles: { fontSize: 30, color: '#111111' } },
    { id: 'b', type: 'paragraph', slideId: 's1', x: 100, y: 160, width: 600, height: 60, content: 'وصف', aiSlot: 'sub', styles: { fontSize: 16, color: '#444444' } },
    { id: 'c', type: 'button', slideId: 's1', x: 100, y: 260, width: 200, height: 44, content: 'اطلب', aiSlot: 'cta', styles: { backgroundColor: '#ff0000', color: '#ffffff' } },
  ] } };
  const plan: any = { look: 'clear', navbar: { layout: 'horizontal', sticky: true, tone: 'light' }, motion: false, extra, sections: [{ section: 'intro', template: 'g:abc', tone: 'light', slots: { title: 'مرحبا بكم في مطعمنا', sub: 'أطيب الأكلات' , cta: 'احجز'}, icons: {}, links: {}, images: {}, entrance: 'none' }] };
  const page: any = { id: 'p1', name: 'الرئيسية', slug: '/', slides: [{ id: 'old', name: 'x', height: 500, backgroundColor: '#fff' }], navbar: { brandName: 'x' } };
  const r = await buildPageFromPlan(plan, { kind: 'free', answers: {} as any, siteName: 'تجربة', pages: [page], elements: [], activePageId: 'p1' }, async () => null);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.deepEqual(r.elements.map((e) => [e.type, e.content]), [['heading', 'مرحبا بكم في مطعمنا'], ['paragraph', 'أطيب الأكلات'], ['button', 'احجز']]);
    assert.equal(r.sections, 1);
  }
});

import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPageFromPlan, socialLinks } from '../src/services/pageBuilder.ts';
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

const basic = (answers: any, sections: string[]) => {
  const planned = sections.map((section) => ({ section, template: 'g:abc', tone: 'light', slots: { title: `عنوان ${section}`, sub: 'نص القسم' }, icons: {}, links: {}, images: {}, entrance: 'none' }));
  const extra = { 'g:abc': { name: 't', slide: { height: 400, backgroundColor: '#ffffff' }, elements: [{ id: 'a', type: 'heading', slideId: 's', x: 100, y: 80, width: 600, height: 60, content: 'x', aiSlot: 'title', styles: { fontSize: 30, color: '#111111' } }, { id: 'b', type: 'paragraph', slideId: 's', x: 100, y: 160, width: 600, height: 60, content: 'y', aiSlot: 'sub', styles: { fontSize: 16, color: '#444444' } }] } };
  const plan: any = { look: 'clear', navbar: { layout: 'horizontal', sticky: true, tone: 'light' }, motion: false, extra, sections: planned };
  const page: any = { id: 'p1', name: 'الرئيسية', slug: '/', slides: [{ id: 'old', name: 'x', height: 500, backgroundColor: '#fff' }], navbar: { brandName: 'x' } };
  return buildPageFromPlan(plan, { kind: 'free', answers, siteName: 'تجربة', pages: [page], elements: [], activePageId: 'p1' }, async () => null);
};

test('a ticked «التقييمات» comes before the contact and the terms; unticked, the page has none', async () => {
  const yes: any = await basic({ aiAnswers: { optionalSections: ['ratings', 'privacy'] } }, ['intro', 'about', 'contact', 'privacy']);
  const slides = yes.pages[0].slides.map((s: any) => s.name);
  assert.equal(slides.length, 5);
  assert.equal(slides[2], 'التقييمات');
  assert.ok(yes.elements.some((e: any) => e.type === 'ratings'));
  assert.equal(yes.pages[0].ratingsSuggested, true);
  const no: any = await basic({ aiAnswers: { optionalSections: ['privacy'] } }, ['intro', 'about', 'contact', 'privacy']);
  assert.equal(no.pages[0].slides.length, 4);
  assert.ok(!no.elements.some((e: any) => e.type === 'ratings'));
  const unanswered: any = await basic({}, ['intro', 'contact']); // old answers: the defaults, no ratings
  assert.ok(!unanswered.elements.some((e: any) => e.type === 'ratings'));
});

test('the contact section shows the owner\'s Facebook and TikTok as buttons; a bad address or another section does not', async () => {
  const contactInfo = { facebook: 'facebook.com/shawarma.homs', tiktok: 'https://www.tiktok.com/@shawarma', phone: '0933123456' };
  const r: any = await basic({ contactInfo }, ['intro', 'contact']);
  const buttons = r.elements.filter((e: any) => e.type === 'button');
  assert.deepEqual(buttons.map((b: any) => [b.content, b.contactType, b.linkUrl]), [['فيسبوك', 'facebook', 'https://facebook.com/shawarma.homs'], ['تيك توك', 'tiktok', 'https://www.tiktok.com/@shawarma']]);
  assert.ok(buttons.every((b: any) => b.slideId === r.pages[0].slides[1].id)); // on the contact slide only
  assert.ok(r.pages[0].slides[1].height > r.pages[0].slides[0].height || buttons.length === 2);
  const bad: any = await basic({ contactInfo: { facebook: 'hello', tiktok: 'javascript:alert(1)' } }, ['intro', 'contact']);
  assert.equal(bad.elements.filter((e: any) => e.type === 'button').length, 0);
  assert.deepEqual(socialLinks(undefined), []);
});

test('the photos of a gallery section open in the viewer: its photo frames share a group', async () => {
  const frame = (id: string, x: number, slot: string) => ({ id, type: 'image', slideId: 's', x, y: 140, width: 300, height: 260, content: 'u', imageUrl: 'u', aiSlot: slot, styles: { objectFit: 'cover' } });
  const extra = { 'g:gal': { name: 'معرض', slide: { height: 520, backgroundColor: '#ffffff' }, elements: [
    { id: 't', type: 'heading', slideId: 's', x: 100, y: 40, width: 600, height: 60, content: 'x', aiSlot: 'title', styles: { fontSize: 30, color: '#111111' } },
    frame('p0', 100, 'photos.0'), frame('p1', 450, 'photos.1'), frame('p2', 800, 'photos.2'),
    { id: 'logo', type: 'image', slideId: 's', x: 20, y: 20, width: 40, height: 40, content: 'l', imageUrl: 'l', aiSlot: 'image', styles: {} },
  ] } };
  const plan: any = { look: 'clear', navbar: { layout: 'horizontal', sticky: true, tone: 'light' }, motion: false, extra, sections: [
    { section: 'gallery', template: 'g:gal', tone: 'light', slots: { title: 'أعمالنا' }, icons: {}, links: {}, images: { 'photos.0': 'user:gallery:1', 'photos.1': 'user:gallery:2', 'photos.2': 'user:gallery:3' }, entrance: 'none' },
    { section: 'about', template: 'g:gal', tone: 'light', slots: { title: 'من نحن' }, icons: {}, links: {}, images: {}, entrance: 'none' },
  ] };
  const answers: any = { aiAnswers: { galleryImages: ['https://x/1.jpg', 'https://x/2.jpg', 'https://x/3.jpg'] } };
  const page: any = { id: 'p1', name: 'الرئيسية', slug: '/', slides: [{ id: 'old', name: 'x', height: 500, backgroundColor: '#fff' }], navbar: { brandName: 'x' } };
  const r: any = await buildPageFromPlan(plan, { kind: 'free', answers, siteName: 'تجربة', pages: [page], elements: [], activePageId: 'p1' }, async () => 'https://x/search.jpg');
  const [galleryId, aboutId] = r.pages[0].slides.map((s: any) => s.id);
  const grouped = r.elements.filter((e: any) => e.lightboxGroup);
  assert.deepEqual(grouped.map((e: any) => e.aiSlot).sort(), ['photos.0', 'photos.1', 'photos.2']);
  assert.ok(grouped.every((e: any) => e.slideId === galleryId));
  assert.ok(!r.elements.some((e: any) => e.slideId === aboutId && e.lightboxGroup)); // another section's photos are not in it
});

test('the photo-viewer gallery takes the owner\'s photos in order and goes when there are none', async () => {
  const build = (galleryImages: string[]) => {
    const plan: any = { look: 'clear', navbar: { layout: 'horizontal', sticky: true, tone: 'light' }, motion: false, sections: [
      { section: 'intro', template: 'hero.cover', tone: 'light', slots: { title: 'مرحبا', sub: 'أهلاً بكم في مطعمنا', eyebrow: 'مطعم' }, icons: {}, links: {}, images: {}, entrance: 'none' },
      { section: 'gallery', template: 'gallery.block1', tone: 'light', slots: { title: 'أعمالنا' }, icons: {}, links: {}, images: {}, entrance: 'none' },
    ] };
    const page: any = { id: 'p1', name: 'الرئيسية', slug: '/', slides: [{ id: 'old', name: 'x', height: 500, backgroundColor: '#fff' }], navbar: { brandName: 'x' } };
    return buildPageFromPlan(plan, { kind: 'free', answers: { aiAnswers: { galleryImages } } as any, siteName: 'تجربة', pages: [page], elements: [], activePageId: 'p1' }, async () => 'https://x/s.jpg') as Promise<any>;
  };
  const withPhotos = await build(['https://x/1.jpg', 'https://x/2.jpg', 'https://x/3.jpg']);
  const block = withPhotos.elements.find((e: any) => e.type === 'gallery');
  assert.deepEqual(block.galleryConfig.items.map((i: any) => i.url), ['https://x/1.jpg', 'https://x/2.jpg', 'https://x/3.jpg']);
  assert.equal(block.galleryConfig.layout, 'top-main'); // gallery.block1
  const without = await build([]);
  assert.ok(!without.elements.some((e: any) => e.type === 'gallery'));
  assert.equal(without.pages[0].slides.length, 1); // the empty gallery section is not built
});

test('a gallery of up to 15 photos: the 15-photo viewer takes them all in order; a smaller package cuts the list', async () => {
  const urls = Array.from({ length: 15 }, (_, i) => `https://x/${i + 1}.jpg`);
  const build = (maxPhotos?: number) => {
    const plan: any = { look: 'clear', navbar: { layout: 'horizontal', sticky: true, tone: 'light' }, motion: false, sections: [
      { section: 'intro', template: 'hero.cover', tone: 'light', slots: { title: 'مرحبا', sub: 'أهلاً بكم', eyebrow: 'مطعم' }, icons: {}, links: {}, images: {}, entrance: 'none' },
      { section: 'gallery', template: 'gallery.block4', tone: 'light', slots: { title: 'أعمالنا' }, icons: {}, links: {}, images: {}, entrance: 'none' },
    ] };
    const page: any = { id: 'p1', name: 'الرئيسية', slug: '/', slides: [{ id: 'old', name: 'x', height: 500, backgroundColor: '#fff' }], navbar: { brandName: 'x' } };
    return buildPageFromPlan(plan, { kind: 'free', answers: { aiAnswers: { galleryImages: urls } } as any, siteName: 'تجربة', pages: [page], elements: [], activePageId: 'p1', ...(maxPhotos ? { maxPhotos } : {}) }, async () => null) as Promise<any>;
  };
  assert.equal((await build()).elements.find((e: any) => e.type === 'gallery').galleryConfig.items.length, 15);
  const five = (await build(5)).elements.find((e: any) => e.type === 'gallery').galleryConfig.items;
  assert.deepEqual(five.map((i: any) => i.url), urls.slice(0, 5));
});

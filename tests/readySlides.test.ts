import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readyFromGallery, readyGet, readyImportOnce, readyMap, readyMove, readyOverview, readyPool, readyRemove, readySave, readySetCategory } from '../server/readySlides.ts';
import { autoSlots } from '../src/data/autoSlots.ts';
import { isSlotName, slideEligibility } from '../src/data/aiSlots.ts';
import { FIXED_READY_CATEGORIES, GALLERY_READY_CATEGORIES, READY_SLIDE_CATEGORIES } from '../src/data/readyCategories.ts';
import { getFirestore, store } from './fakeAdmin.ts';

const db = getFirestore() as any;
const reset = () => { for (const k of [...store.keys()]) if (/^(gallerySlides|readySlides|readyConfig)\//.test(k)) store.delete(k); };
const el = (id: string, type: string, o: any = {}) => ({ id, type, slideId: 's1', x: 100, y: 100, width: 600, height: 60, content: '', styles: {}, ...o });
const design = () => ({
  page: { slides: [{ id: 's1', background: '#fff' }] },
  elements: [
    el('e1', 'paragraph', { content: 'حضانة الأمل · دمشق', y: 80, width: 300, height: 28, styles: { fontSize: 14 } }),
    el('e2', 'heading', { content: 'كل خطوة تقود إلى مغامرة', y: 120, height: 120, styles: { fontSize: 72 } }),
    el('e3', 'paragraph', { content: 'صفوف صغيرة ومعلّمات يعرفن كل طفل باسمه.', y: 260, height: 60, styles: { fontSize: 20 } }),
    el('e4', 'button', { content: 'سجّل طفلك', y: 340, width: 200, height: 54 }),
  ],
});

test('the shop, showroom, menu, featured and search categories stay in the code; the others are the admin\'s', () => {
  assert.deepEqual([...FIXED_READY_CATEGORIES].sort(), ['cars', 'featured', 'restaurant', 'search', 'shop']);
  assert.equal(GALLERY_READY_CATEGORIES.length, READY_SLIDE_CATEGORIES.length - 5);
});

test('the slots of a slide are found from its elements: title, eyebrow, sub, cta', () => {
  const out = autoSlots(design().elements as any[]);
  assert.deepEqual(out.map((e: any) => e.aiSlot), ['eyebrow', 'title', 'sub', 'cta']);
  assert.ok(out.every((e: any) => e.aiSlotAuto === true));
  assert.equal(slideEligibility(out as any).eligible, true);
});

test('a slot set by hand stays, and the automatic ones are found again', () => {
  const first = autoSlots(design().elements as any[]);
  const edited = first.map((e: any) => (e.id === 'e3' ? { ...e, aiSlot: 'note', aiSlotAuto: undefined } : e));
  const again = autoSlots(edited as any[]);
  assert.equal((again.find((e: any) => e.id === 'e3') as any).aiSlot, 'note');
  assert.equal((again.find((e: any) => e.id === 'e3') as any).aiSlotAuto, undefined);
  assert.equal((again.find((e: any) => e.id === 'e2') as any).aiSlot, 'title');
});

test('three cards of the same size become a list, numbers with labels become facts, the built-in pictures stay decoration', () => {
  const cards = [0, 1, 2].flatMap((i) => [
    el(`t${i}`, 'heading', { content: `ميزة ${i}`, x: 900 - i * 320, y: 300, width: 280, height: 40, styles: { fontSize: 24 } }),
    el(`p${i}`, 'paragraph', { content: `شرح الميزة ${i}`, x: 900 - i * 320, y: 350, width: 280, height: 60, styles: { fontSize: 16 } }),
  ]);
  const out = autoSlots([el('h', 'heading', { content: 'لماذا نحن', y: 100, styles: { fontSize: 60 } }), ...cards, el('pic', 'image', { content: '/Library/scenes/a.svg', width: 300, height: 300 })] as any[]);
  const slot = (id: string) => (out.find((e: any) => e.id === id) as any).aiSlot;
  assert.deepEqual(['t0', 'p0', 't1', 'p1', 't2', 'p2'].map(slot), ['points.0.title', 'points.0.text', 'points.1.title', 'points.1.text', 'points.2.title', 'points.2.text']);
  assert.equal(slot('h'), 'title');
  assert.equal(slot('pic'), undefined);
  const facts = autoSlots([el('n1', 'heading', { content: '+500', x: 800, y: 300, width: 200, styles: { fontSize: 48 } }), el('l1', 'paragraph', { content: 'عميل', x: 800, y: 360, width: 200, styles: { fontSize: 16 } }), el('n2', 'heading', { content: '12', x: 500, y: 300, width: 200, styles: { fontSize: 48 } }), el('l2', 'paragraph', { content: 'سنة خبرة', x: 500, y: 360, width: 200, styles: { fontSize: 16 } })] as any[]);
  assert.deepEqual(facts.map((e: any) => e.aiSlot), ['facts.0.number', 'facts.0.label', 'facts.1.number', 'facts.1.label']);
});

test('a ready slide is saved with its slots found, at the end of its category', async () => {
  reset();
  const a = await readySave(db, null, { ...design(), name: 'مدخل الحضانة', category: 'intro' }, 'admin:eyad') as any;
  const b = await readySave(db, null, { ...design(), name: 'مدخل ثان', category: 'intro' }, 'admin:eyad') as any;
  assert.equal(a.ok, true);
  assert.equal(a.eligible, true);
  assert.equal(a.slots, 4);
  assert.equal(store.get(`readySlides/${a.id}`).order, 1);
  assert.equal(store.get(`readySlides/${b.id}`).order, 2);
  assert.equal(store.get(`readySlides/${a.id}`).createdBy, 'admin:eyad');
  assert.equal((await readyGet(db, a.id))?.elements.length, 4);
});

test('saving again changes the slide in place; a new category puts it at the end of that one', async () => {
  reset();
  const a = await readySave(db, null, { ...design(), name: 'شريحة أ', category: 'intro' }, 'x') as any;
  await readySave(db, null, { ...design(), name: 'شريحة ب', category: 'about' }, 'x');
  const edited = design();
  edited.elements[1].content = 'عنوان جديد';
  assert.equal(((await readySave(db, a.id, { ...edited, name: 'شريحة معدّلة', category: 'intro' }, 'y')) as any).id, a.id);
  assert.equal(store.get(`readySlides/${a.id}`).name, 'شريحة معدّلة');
  assert.equal(store.get(`readySlides/${a.id}`).order, 1);
  await readySave(db, a.id, { ...edited, name: 'شريحة أ', category: 'about' }, 'y');
  assert.equal(store.get(`readySlides/${a.id}`).category, 'about');
  assert.equal(store.get(`readySlides/${a.id}`).order, 2);
});

test('refused: an unknown category or slide, a page of three slides, raw html', async () => {
  reset();
  assert.deepEqual(await readySave(db, null, { ...design(), category: 'shop' }, 'x'), { error: 'bad_category' });
  assert.deepEqual(await readySave(db, null, { ...design(), category: 'nope' }, 'x'), { error: 'bad_category' });
  assert.deepEqual(await readySave(db, 'missing', { ...design(), category: 'intro' }, 'x'), { error: 'not_found' });
  const html = design();
  html.elements.push(el('h', 'html', { content: '<b>x</b>' }));
  assert.deepEqual(await readySave(db, null, { ...html, category: 'intro' }, 'x'), { error: 'html_not_allowed' });
  const two = { ...design(), page: { slides: [{ id: 's1' }, { id: 's2' }] } };
  assert.deepEqual(await readySave(db, null, { ...two, category: 'intro' }, 'x'), { error: 'bad_request' });
});

test('a gallery slide is copied into a category; the gallery keeps its own', async () => {
  reset();
  store.set('gallerySlides/g1', { kind: 'slide', status: 'pending', name: 'من المعرض', slide: design().page.slides[0], elements: design().elements });
  store.set('gallerySlides/pg', { kind: 'page', status: 'approved', name: 'صفحة', slide: {}, elements: [] });
  const r = await readyFromGallery(db, 'g1', 'about', 'admin:eyad') as any;
  assert.equal(r.ok, true);
  assert.equal(store.get(`readySlides/${r.id}`).from, 'g1');
  assert.ok(store.has('gallerySlides/g1'));
  assert.deepEqual(await readyMap(db), { g1: 'about' });
  assert.deepEqual(await readyFromGallery(db, 'pg', 'about', 'x'), { error: 'not_a_slide' });
  assert.deepEqual(await readyFromGallery(db, 'nope', 'about', 'x'), { error: 'not_found' });
  assert.deepEqual(await readyFromGallery(db, 'g1', 'cars', 'x'), { error: 'bad_category' });
});

test('slides move up and down, change category, and are deleted', async () => {
  reset();
  const ids: string[] = [];
  for (const n of ['شريحة أ', 'شريحة ب', 'شريحة ج']) ids.push(((await readySave(db, null, { ...design(), name: n, category: 'intro' }, 'x')) as any).id);
  assert.deepEqual(await readyMove(db, ids[2], 'up'), { ok: true, order: 2 });
  assert.deepEqual((await readyOverview(db)).find((c: any) => c.id === 'intro')!.items.map((i: any) => i.name), ['شريحة أ', 'شريحة ج', 'شريحة ب']);
  assert.deepEqual(await readyMove(db, ids[0], 'up'), { ok: true, order: 1 });
  assert.deepEqual(await readySetCategory(db, ids[0], 'team'), { ok: true });
  assert.deepEqual((await readyOverview(db)).find((c: any) => c.id === 'team')!.items.map((i: any) => i.id), [ids[0]]);
  assert.deepEqual(await readySetCategory(db, ids[0], 'cars'), { error: 'bad_category' });
  assert.deepEqual(await readyRemove(db, ids[1]), { ok: true });
  assert.deepEqual(await readyRemove(db, ids[1]), { error: 'not_found' });
  assert.deepEqual(await readyMove(db, 'missing', 'up'), { error: 'not_found' });
});

test('documents of the earlier way (no slide in them) are ignored', async () => {
  reset();
  store.set('readySlides/old', { category: 'intro', order: 1, galleryId: 'x' });
  assert.deepEqual((await readyOverview(db)).flatMap((c: any) => c.items), []);
  assert.equal((await readyPool(db)).size, 0);
});

test('the builder\'s pool holds only the slides whose slots are complete', async () => {
  reset();
  const ok = await readySave(db, null, { ...design(), name: 'جيدة', category: 'intro' }, 'x') as any;
  const bare = await readySave(db, null, { page: { slides: [{ id: 's1' }] }, elements: [el('i', 'shape')], name: 'بلا خانات', category: 'intro' }, 'x') as any;
  assert.equal(bare.eligible, false);
  const pool = await readyPool(db);
  assert.deepEqual((pool.get('intro') || []).map((r: any) => r.id), [ok.id]);
});

test('the code\'s ready slides become the admin\'s once, and only once', async () => {
  reset();
  const first = await readyImportOnce(db, 'admin:eyad');
  assert.ok(first.imported > 100);
  assert.ok(store.has('readyConfig/imported'));
  const docs = [...store.entries()].filter(([k]) => k.startsWith('readySlides/code-'));
  assert.equal(docs.length, first.imported);
  assert.ok(docs.some(([, v]) => v.eligible === true));
  assert.deepEqual(await readyImportOnce(db, 'admin:eyad'), { imported: 0 });
  assert.equal([...store.keys()].filter((k) => k.startsWith('readySlides/code-')).length, first.imported);
});

// Cards: a set of same-size group boxes is one list, each card named as a whole (Eyad, 22 Oct).
const card = (x: number, name: string, role: string, bio: string, extra: any[] = []) => [
  { ...el(`c${x}`, 'shape'), isGroupContainer: true, x, y: 250, width: 248, height: 320 },
  { ...el(`im${x}`, 'image'), x: x + 60, y: 270, width: 112, height: 112, content: 'https://images.unsplash.com/a', aiSlot: 'image' },
  { ...el(`n${x}`, 'heading'), x: x + 16, y: 404, width: 216, height: 32, content: name, styles: { fontSize: 22 } },
  { ...el(`r${x}`, 'paragraph'), x: x + 16, y: 438, width: 216, height: 24, content: role, styles: { fontSize: 15 } },
  { ...el(`b${x}`, 'paragraph'), x: x + 24, y: 468, width: 200, height: 50, content: bio, styles: { fontSize: 15 } },
  ...extra,
];

test('team cards become points with a title, role and text, and no shared photo slot', () => {
  const out = autoSlots([
    ...card(900, 'سامر', 'مدير', 'يتابع كل مشروع من أول فكرة حتى التسليم'),
    ...card(600, 'ليلى', 'تصميم', 'تحوّل الأفكار إلى شكل يُحَس به ويُفهم'),
    ...card(300, 'أحمد', 'جودة', 'لا يسلّم شيئاً قبل أن يجربه بنفسه مرتين'),
  ] as any[]);
  const slots = out.map((e: any) => e.aiSlot).filter(Boolean).sort();
  assert.deepEqual(slots, ['points.0.role', 'points.0.text', 'points.0.title', 'points.1.role', 'points.1.text', 'points.1.title', 'points.2.role', 'points.2.text', 'points.2.title']);
  assert.equal(out.find((e: any) => e.id === 'n900')?.aiSlot, 'points.0.title');
});

test('plain shape boxes make a list too, so no text keeps its example wording', () => {
  const box = (x: number, t: string, d: string) => [
    { ...el(`s${x}`, 'shape'), x, y: 250, width: 248, height: 200 },
    { ...el(`t${x}`, 'heading'), x: x + 16, y: 280, width: 216, height: 32, content: t, styles: { fontSize: 22 } },
    { ...el(`d${x}`, 'paragraph'), x: x + 16, y: 330, width: 216, height: 60, content: d, styles: { fontSize: 15 } },
  ];
  const out = autoSlots([
    { ...el('h', 'heading'), y: 120, content: 'خدماتنا', styles: { fontSize: 48 } },
    ...box(900, 'تصميم', 'نرسم لك هوية كاملة تناسب عملك'),
    ...box(600, 'برمجة', 'نبني موقعك بأحدث الأدوات المتاحة'),
    ...box(300, 'دعم', 'نتابع معك بعد التسليم كل أسبوع'),
  ] as any[]);
  const texts = out.filter((e: any) => e.type === 'heading' || e.type === 'paragraph');
  assert.deepEqual(texts.filter((e: any) => !e.aiSlot).map((e: any) => e.id), []);
});

test('a left-over text gets an extra slot, a bare step number does not', () => {
  const out = autoSlots([
    { ...el('h', 'heading'), y: 120, content: 'عرض الصيف', styles: { fontSize: 48 } },
    { ...el('s', 'paragraph'), y: 200, content: 'خصم على كل الطلبات هذا الشهر', styles: { fontSize: 20 } },
    { ...el('p', 'paragraph'), y: 260, content: 'بدل ٨٠ دولاراً', styles: { fontSize: 17 } },
    { ...el('n', 'heading'), y: 330, width: 44, height: 32, content: '1', styles: { fontSize: 20 } },
  ] as any[]);
  assert.equal(out.find((e: any) => e.id === 'p')?.aiSlot, 'extra.0');
  assert.equal(out.find((e: any) => e.id === 'n')?.aiSlot, undefined);
  assert.ok(isSlotName('extra.3'));
});

test('the builder\'s own names for price cards and the send button are accepted', () => {
  for (const n of ['packages.0.features.2', 'groups.1.name', 'groups.0.rows.3.price', 'send']) assert.ok(isSlotName(n), n);
  assert.equal(isSlotName('groups.0.rows.x'), false);
});

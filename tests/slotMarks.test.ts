import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSlotName, slideEligibility, slotKindOf } from '../src/data/aiSlots.ts';
import { markSlots } from '../server/slotMarks.ts';
import { addReady, readyOverview } from '../server/readySlides.ts';
import { getFirestore, store } from './fakeAdmin.ts';

const db = getFirestore() as any;
const reset = () => { for (const k of [...store.keys()]) if (k.startsWith('gallerySlides/') || k.startsWith('readySlides/')) store.delete(k); };
const els = () => [
  { id: 'h', type: 'heading', content: '<b>عنوان</b>' }, { id: 'p', type: 'paragraph', content: 'وصف' },
  { id: 'b', type: 'button', content: 'اتصل' }, { id: 'i', type: 'image', content: '' }, { id: 's', type: 'shape' },
];
const gallery = (id: string, extra: any = {}) => store.set(`gallerySlides/${id}`, { kind: 'slide', name: id, category: 'hero', status: 'approved', slide: { id: 'sl' }, elements: els(), ...extra });

test('slot names the builder knows, and which elements can carry one', () => {
  for (const n of ['title', 'sub', 'cta', 'image', 'points.0.title', 'chips.2', 'photos.3', 'phone.value']) assert.ok(isSlotName(n), n);
  for (const n of ['', 'heading', 'points.title', 'x.0']) assert.ok(!isSlotName(n), n);
  assert.deepEqual(['heading', 'paragraph', 'button', 'image', 'shape', 'icon'].map(slotKindOf), ['text', 'text', 'button', 'image', null, null]);
});

test('eligible: a title or text, known names used once, lists counted from 0 without gaps', () => {
  assert.equal(slideEligibility([{ type: 'heading' }]).eligible, false); // nothing marked
  assert.equal(slideEligibility([{ type: 'heading', aiSlot: 'title' }, { type: 'button', aiSlot: 'cta' }]).eligible, true);
  assert.equal(slideEligibility([{ type: 'button', aiSlot: 'cta' }]).eligible, false); // nothing to write
  assert.equal(slideEligibility([{ type: 'heading', aiSlot: 'title' }, { type: 'paragraph', aiSlot: 'title' }]).eligible, false); // repeated
  assert.equal(slideEligibility([{ type: 'heading', aiSlot: 'title' }, { type: 'paragraph', aiSlot: 'points.1.text' }]).eligible, false); // list starts at 1
  assert.equal(slideEligibility([{ type: 'paragraph', aiSlot: 'points.0.text' }, { type: 'paragraph', aiSlot: 'points.1.text' }]).eligible, true);
});

test('marking slots writes aiSlot on the elements only, and says whether it can be used', async () => {
  reset(); gallery('a');
  const r = await markSlots(db, 'a', { h: 'title', p: 'sub', b: 'cta', i: 'image' }, 'admin:eyad');
  assert.deepEqual(r, { ok: true, eligible: true, slots: 4, problems: [] });
  const doc = store.get('gallerySlides/a');
  assert.deepEqual(doc.elements.map((e: any) => e.aiSlot), ['title', 'sub', 'cta', 'image', undefined]);
  assert.equal(doc.slide.aiTemplate, undefined); // the slide stays as designed
  assert.equal(doc.slotsMarkedBy, 'admin:eyad');
});

test('a mark can be changed and taken off', async () => {
  reset(); gallery('a');
  await markSlots(db, 'a', { h: 'title' }, 'x');
  await markSlots(db, 'a', { h: 'text' }, 'x');
  assert.equal(store.get('gallerySlides/a').elements[0].aiSlot, 'text');
  const r: any = await markSlots(db, 'a', { h: '' }, 'x');
  assert.equal(r.slots, 0);
});

test('refused: a missing slide, a page, an unknown element, an unknown name, a name that does not fit the element', async () => {
  reset(); gallery('a'); gallery('pg', { kind: 'page' });
  assert.deepEqual(await markSlots(db, 'zz', { h: 'title' }, 'x'), { error: 'not_found' });
  assert.deepEqual(await markSlots(db, 'pg', { h: 'title' }, 'x'), { error: 'not_a_slide' });
  assert.equal(((await markSlots(db, 'a', { nope: 'title' }, 'x')) as any).error, 'bad_marks');
  assert.equal(((await markSlots(db, 'a', { h: 'wat' }, 'x')) as any).error, 'bad_marks');
  assert.equal(((await markSlots(db, 'a', { h: 'cta' }, 'x')) as any).error, 'bad_marks'); // a heading is not a button
  assert.equal(((await markSlots(db, 'a', { s: 'title' }, 'x')) as any).error, 'bad_marks'); // a shape carries nothing
  assert.equal(((await markSlots(db, 'a', ['x'], 'x')) as any).error, 'bad_marks');
  assert.equal(store.get('gallerySlides/a').elements[0].aiSlot, undefined); // nothing was written
});

test('the ready overview tells which slides are marked for the AI', async () => {
  reset(); gallery('a'); gallery('b');
  await addReady(db, 'a', 'intro', 'x'); await addReady(db, 'b', 'intro', 'x');
  await markSlots(db, 'a', { h: 'title', b: 'cta' }, 'x');
  const items = (await readyOverview(db)).find((c) => c.id === 'intro')!.items;
  assert.deepEqual(items.map((i) => [i.id, i.eligible, i.slots]), [['a', true, 2], ['b', false, 0]]);
});

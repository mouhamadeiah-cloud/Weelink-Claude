import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slideOfSection, slideParts } from '../src/data/slideParts.ts';
import { questionsFor } from '../src/data/sectionQuestions.ts';
import { partsOf } from '../src/data/slideParts.ts';
import { autoSlots } from '../src/data/autoSlots.ts';
import { sectionFacts, businessFacts } from '../src/services/weeWriter.ts';

test('a slide\'s places: its slots with N for numbers, the elements the builder fills, and its background', () => {
  const parts = slideParts({
    slide: { backgroundImage: 'x.jpg' },
    elements: [{ type: 'heading', aiSlot: 'title' }, { type: 'paragraph', aiSlot: 'points.0.title' }, { type: 'paragraph', aiSlot: 'points.1.title' }, { type: 'video' }, { type: 'shape' }],
  });
  assert.deepEqual(parts, ['background', 'points.N.title', 'title', 'video']);
});

test('a section is built from the first eligible slide in order, of those the admin allowed, not taken by an earlier section', () => {
  const list = [{ id: 'a', eligible: false, parts: [] }, { id: 'b', eligible: true, parts: ['title'] }, { id: 'c', eligible: true, parts: ['sub'] }];
  assert.equal(slideOfSection({}, list, new Set())?.id, 'b');
  assert.equal(slideOfSection({}, list, new Set(['b']))?.id, 'c');
  assert.equal(slideOfSection({ slides: ['c'] }, list, new Set())?.id, 'c');
  assert.equal(slideOfSection({ slides: ['gone'] }, list, new Set())?.id, 'b', 'allowed slides that are gone: the category as a whole');
  assert.equal(slideOfSection({}, [], new Set()), undefined);
});

const model = {
  sections: [],
  pages: [{ id: 'home', name: 'الرئيسية', sections: [
    { id: 'intro', category: 'intro', mode: 'always' as const },
    { id: 'team', category: 'team', mode: 'always' as const },
    { id: 'video', category: 'video', mode: 'always' as const },
    { id: 'contact', category: 'contact', mode: 'always' as const },
  ] }],
};

test('a question whose answer has no place on the section\'s slide is not asked; without the slide all are', async () => {
  const lists: Record<string, any[]> = {
    intro: [{ id: 'i1', eligible: true, parts: ['title', 'sub', 'cta'] }],
    team: [{ id: 't1', eligible: true, parts: ['title', 'image'] }],
    video: [{ id: 'v1', eligible: true, parts: ['title', 'video'] }],
    contact: [{ id: 'c1', eligible: true, parts: ['title', 'phone.value', 'address.value'] }],
  };
  const parts = await partsOf(model.pages, async (c) => lists[c] || []);
  assert.deepEqual(parts.intro, ['title', 'sub', 'cta']);
  const asked = questionsFor({ ...model, parts }, undefined);
  const ids = asked.flatMap((s) => s.ask.questions.map((q) => `${s.id}.${q.id}`));
  assert.ok(ids.includes('intro.tagline'), 'the front has a line under its title');
  assert.ok(!ids.includes('intro.heroPhoto'), 'no photo on the front slide: no photo asked');
  assert.ok(!ids.includes('team.team'), 'a team slide with no cards: no names asked');
  assert.ok(ids.includes('video.video'));
  assert.ok(!ids.includes('contact.hours'), 'no hours on the contact slide');
  const all = questionsFor(model, undefined).flatMap((s) => s.ask.questions.map((q) => `${s.id}.${q.id}`));
  assert.ok(all.includes('team.team') && all.includes('contact.hours') && all.includes('intro.heroPhoto'));
});

test('the slide picked for the questions is the one built: two sections of a page never share a slide', async () => {
  const two = { pages: [{ id: 'p', name: 'x', sections: [{ id: 'about', category: 'about', mode: 'always' as const }, { id: 'about2', category: 'about', mode: 'always' as const, part: undefined }] }] };
  const parts = await partsOf(two.pages, async () => [{ id: 'a1', eligible: true, parts: ['title'] }, { id: 'a2', eligible: true, parts: ['text'] }]);
  assert.deepEqual(parts.about, ['title'], 'the first occurrence keeps its slide');
});

test('a video player and an email line get their places on the slide', () => {
  const els = autoSlots([
    { type: 'video', x: 0, y: 0, width: 600, height: 340 },
    { type: 'heading', x: 0, y: 400, width: 600, height: 60, content: 'تواصل معنا', styles: { fontSize: 40 } },
    { type: 'paragraph', x: 700, y: 500, width: 100, height: 30, content: 'البريد' },
    { type: 'paragraph', x: 300, y: 500, width: 300, height: 30, content: 'info@example.com' },
  ]);
  assert.deepEqual(els.map((e) => (e as { aiSlot?: string }).aiSlot), ['video', 'title', 'email.label', 'email.value']);
});

test('the owner\'s front line, store note, email and map pin reach the builder', () => {
  const f = sectionFacts({ 'intro.tagline': ' أبواب بمقاس طلبك ', 'restaurant:front.dishNote': 'المندي' });
  assert.equal(f['جملة_الواجهة'], 'أبواب بمقاس طلبك');
  assert.equal(f['ميزة_الواجهة'], 'المندي');
  const b = businessFacts({ contactInfo: { email: 'a@b.co' }, addressInfo: { governorate: 'دمشق', city: 'دمشق', details: 'جانب الجامع', coordinates: { lat: 33.5, lng: 36.3 } } }, 'x');
  assert.equal(b['بريد'], 'a@b.co');
  assert.equal(b['الموقع'], '33.500000,36.300000');
  assert.ok(b['العنوان'].endsWith('جانب الجامع'));
});

test('every example photo of a slide is replaced, the design\'s drawings are not', async () => {
  const { isStockPhoto } = await import('../src/data/autoSlots.ts');
  assert.ok(isStockPhoto('/Library/compressed/wee-k2.jpg'), 'the example business\'s own photo');
  assert.ok(isStockPhoto('/Library/ben-wicks-GjBPLkTDzt4-unsplash.jpg'));
  assert.ok(isStockPhoto('https://images.unsplash.com/photo-1'));
  assert.ok(!isStockPhoto('/Library/scenes/paper-warm.svg'));
  assert.ok(!isStockPhoto(''));
});

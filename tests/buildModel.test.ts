import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPrompt, checkPlan } from '../api/build-page.ts';
import { pickSections, sectionsFor, type CodeSection, type GalleryPool } from '../server/pagePicker.ts';
import { DEFAULT_MODELS } from '../src/data/pageModels.ts';
import catalog from '../src/data/ai/buildCatalog.json' with { type: 'json' };

const codeSections = (catalog.sections as any).free as CodeSection[];
const noGallery: GalleryPool = { ids: () => [], useGallery: () => false, load: async () => null };
const galleryOnly = (byCat: Record<string, string[]>): GalleryPool => ({
  ids: (c) => byCat[c] || [], useGallery: () => true,
  load: async (id) => ({ name: 'تصميم', slide: { height: 500 }, elements: [{ id: 'a', type: 'heading', aiSlot: 'title' }, { id: 'b', type: 'paragraph', aiSlot: 'sub' }] }),
});
const assets = { heroBg: false, gallery: 0, logo: false };
const profile = { 'الوصف': 'مطعم شاورما في حمص', 'التصنيف': 'مطعم' };
const free = DEFAULT_MODELS[0].sections;
const owner = { services: false, priced: false, photos: false };

test('a model plan keeps the sections and slides the server chose, whatever the AI answered', async () => {
  const picked = await pickSections({ sections: sectionsFor(free, owner), codeSections, gallery: noGallery });
  // The AI names another slide for «من نحن», adds a section nobody asked for, and leaves the contact out.
  const raw = {
    look: 'fresh', navbar: { layout: 'horizontal', sticky: true, tone: 'light' },
    sections: [
      { section: 'about', template: 'hero.cover', tone: 'tint', entrance: 'fade', slots: [{ key: 'title', value: 'عن مطعمنا' }] },
      { section: 'numbers', template: 'cars.numbers', tone: 'dark', slots: [{ key: 'title', value: 'أرقام' }] },
      { section: 'intro', template: 'hero.cover', tone: 'light', slots: [{ key: 'title', value: 'شاورما حمص' }] },
    ],
  };
  const plan = checkPlan(raw, 'free', profile, assets, picked);
  assert.deepEqual(plan.sections.map((s) => s.section), picked.pool.map((p) => p.id)); // the model's order, nothing added
  assert.deepEqual(plan.sections.map((s) => s.template), picked.pool.map((p) => p.templates[0])); // the chosen slides
  assert.equal(plan.sections.find((s) => s.section === 'intro')!.slots.title, 'شاورما حمص');
  assert.ok(plan.sections.some((s) => s.section === 'contact')); // left out by the AI, still there
});

test('a gallery slide chosen by the server takes the AI\'s texts by its marked slots and cuts them to its limits', async () => {
  const picked = await pickSections({ sections: sectionsFor(free, owner), codeSections, gallery: galleryOnly({ intro: ['g1'] }) });
  const tid = picked.pool[0].templates[0];
  assert.equal(tid, 'g:g1');
  const raw = { sections: [{ section: 'intro', template: tid, tone: 'light', slots: [{ key: 'title', value: 'ع'.repeat(200) }, { key: 'sub', value: 'وصف قصير' }, { key: 'nope', value: 'x' }] }] };
  const plan = checkPlan(raw, 'free', profile, assets, picked);
  const s = plan.sections[0];
  assert.equal(s.template, tid);
  assert.equal(s.slots.title.length, 60); // the title limit of a slot
  assert.equal(s.slots.sub, 'وصف قصير');
  assert.ok(!('nope' in s.slots)); // not a slot of this slide
});

test('the prompt of a model plan names only the chosen sections and tells the AI not to change them', async () => {
  const picked = await pickSections({ sections: sectionsFor(free, owner), codeSections, gallery: noGallery });
  const prompt = buildPrompt('free', profile, assets, picked);
  assert.match(prompt, /اختارها الخادم مسبقاً/);
  assert.doesNotMatch(prompt, /الكتالوج \(الأقسام المتاحة/);
  assert.doesNotMatch(prompt, /الأنسب لهذا النوع عادةً|صمّم الآن صفحة/, 'the AI never chooses sections: the old way is gone');
});

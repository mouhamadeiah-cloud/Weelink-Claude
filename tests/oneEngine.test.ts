// Eyad, 29 Oct: the old way of building is gone for good, the page model is the only source and there is one engine.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildFormPlan, inventedActivity, onSubject, photoSubject, type FormEnv, type FormSection } from '../server/formBuild.ts';
import * as picker from '../server/pagePicker.ts';
import * as page from '../src/services/pageBuilder.ts';
import { codeSlide, codeSlides, roleOf } from '../src/data/codeReady.ts';
import { siteKindOf, siteKindsOfModel } from '../src/data/siteKinds.ts';
import { DEFAULT_MODELS, modelProblems, pagesOf } from '../src/data/pageModels.ts';
import { slideEligibility } from '../src/data/aiSlots.ts';

const root = new URL('../', import.meta.url);
const read = (p: string) => fs.readFileSync(new URL(p, root), 'utf8');

test('the old catalogue, its script, its prompt and its checker are gone, and nothing calls them', () => {
  for (const f of ['src/data/ai/buildCatalog.json', 'scripts/build-ai-catalog.ts', 'src/data/storeSlideAi.ts', 'src/data/optionalSections.ts']) assert.ok(!fs.existsSync(new URL(f, root)), f);
  const build = read('api/build-page.ts');
  for (const old of ['buildCatalog', 'buildPrompt', 'checkPlan', 'RESPONSE_SCHEMA', 'EXAMPLE', 'catalogOf', 'mergePlans', 'codePool', 'SECTIONS', 'TEMPLATES']) assert.ok(!build.includes(old), old);
  for (const old of ['codeSections', 'fromCode', 'useGallery', 'planSectionId', 'FIXED_READY_CATEGORIES']) assert.ok(!read('server/pagePicker.ts').includes(old), old);
  for (const old of ['WEE_SLIDE_BY_ID', 'STORE_SLIDE_IDS', 'HOME_PAGE', "'order'", "'request'"]) assert.ok(!read('src/services/pageBuilder.ts').includes(old), old);
  assert.ok(!read('server/formBuild.ts').includes('mergePlans'));
  assert.ok(!('planSectionId' in picker) && !('galleryPool' in picker));
  assert.ok(!JSON.parse(read('package.json')).scripts['ai-catalog']);
  assert.ok('keepModelPages' in page);
});

test('every slide of search, featured and the live lists has an id the model can tick, and loads as a slide', () => {
  for (const c of ['search', 'featured', 'shop', 'cars', 'restaurant']) {
    const list = codeSlides(c);
    assert.ok(list.length > 0, c);
    for (const x of list) {
      assert.match(x.id, new RegExp(`^code:${c}:\\d+$`));
      const s = codeSlide(x.id)!;
      assert.ok(s && s.elements.length, x.id);
      assert.equal(roleOf(s.elements), x.role);
    }
  }
  assert.equal(codeSlide('code:intro:0'), null);
  assert.equal(codeSlide('code:search:99'), null);
  // A slide made of a live element alone (the search bar, the full menu) can be built: it is kept as it is.
  assert.ok(codeSlides('search').every((x) => x.eligible));
  assert.equal(slideEligibility([{ type: 'shopProducts' }]).eligible, true);
  assert.equal(slideEligibility([{ type: 'heading' }]).eligible, false);
});

test('the site\'s real kind: a rental is of cars or of things, never a free page', () => {
  assert.equal(siteKindOf('rental-60', 'سيارات'), 'rental-cars');
  assert.equal(siteKindOf('rental-pro', 'معدات بناء'), 'rental-items');
  assert.equal(siteKindOf('hotel-30'), 'hotel');
  assert.equal(siteKindOf('page-free'), 'page');
  assert.equal(siteKindOf('restaurant-free'), 'restaurant');
  assert.deepEqual(siteKindsOfModel('rental-pro'), ['rental-cars', 'rental-items']);
});

test('a model is saved only when each section has a slide that fits its sites: search on a rental yes, on a free page no', () => {
  const eligible = (c: string) => codeSlides(c).filter((x) => x.eligible);
  const withSearch = (id: string) => pagesOf({ id, sections: [{ id: 'search', category: 'search', mode: 'always' }] });
  assert.deepEqual(modelProblems(withSearch('rental'), eligible, siteKindsOfModel('rental')), []);
  assert.equal(modelProblems(withSearch('page-free'), eligible, siteKindsOfModel('page-free')).length, 1);
  // A store's front must be a front slide, and the ratings box needs none.
  const rest = DEFAULT_MODELS.find((m) => m.id === 'restaurant')!;
  assert.deepEqual(modelProblems(pagesOf(rest).map((p) => ({ ...p, sections: p.sections.filter((s) => s.category === 'restaurant' || s.category === 'ratings') })), eligible, ['restaurant']), []);
});

test('an activity the owner never named is refused, unless it is what the site does', () => {
  assert.equal(inventedActivity('نؤجر ونبيع أفضل السيارات', 'rental-cars', 'تأجير سيارات في دمشق'), 'البيع');
  assert.equal(inventedActivity('نؤجر لك سيارتك بيوم', 'rental-cars', 'سيارات'), undefined);
  assert.equal(inventedActivity('توصيل لباب البيت', 'restaurant', 'مطعم شاورما'), 'التوصيل');
  assert.equal(inventedActivity('توصيل لباب البيت', 'restaurant', 'مطعم شاورما مع توصيل'), undefined);
  assert.equal(inventedActivity('أجواء الربيع في مطعمنا', 'restaurant', 'مطعم'), undefined, 'a word that only holds the letters is not the activity');
  assert.equal(inventedActivity('للبيع بأسعار واضحة', 'shop', 'متجر ألبسة'), undefined);
});

test('every photo search is of the business: its subject leads, the site\'s own word is kept', () => {
  assert.equal(photoSubject('rental-cars', 'rental fleet'), 'car rental fleet');
  assert.equal(photoSubject('rental-cars', 'car rental agency'), 'car rental agency');
  assert.equal(photoSubject('page', ''), 'small local business');
  assert.equal(onSubject('shoes on shelf soft light', 'car rental agency'), 'car rental agency shoes on shelf soft light');
  assert.equal(onSubject('modern car interior soft light', 'car rental agency'), 'modern car interior soft light');
});

const env = (ask: FormEnv['ask']): FormEnv => ({
  ask, looks: { clear: { name: 'واضح', forWho: 'الكل', bg: '#fff', ink: '#111', accent: '#07f', head: 'A', body: 'B' } }, defaultLook: 'clear',
  icons: ['mdi:star-outline'], tones: ['light', 'tint', 'dark'], entrances: ['none', 'fade'], navLayouts: ['horizontal'], navTones: ['light'],
});
const photoSlide = (id: string): FormSection => ({ id, name: id, template: `g:${id}`, elements: [
  { id: 't', type: 'heading', aiSlot: 'title', content: 'عنوان المثال هنا', x: 0, y: 0, width: 600, height: 60 },
  { id: 'p', type: 'image', aiSlot: 'image', content: 'https://images.unsplash.com/x', x: 700, y: 0, width: 400, height: 300 },
] });

test('the owner\'s own photos come first, the searches are of the business, and the live slides go in as they are', async () => {
  const search = codeSlide(codeSlides('search')[3].id)!;
  const sections = [photoSlide('intro'), photoSlide('about'), { id: 'search', name: 'بحث', template: codeSlides('search')[3].id, slide: search.slide, elements: search.elements }];
  const plan = await buildFormPlan({
    env: env(async (prompt) => (/اكتب الآن ملخص الصفحة/.test(prompt)
      ? { look: 'clear', navbar: { layout: 'horizontal', sticky: true, tone: 'light' }, voice: 'واضحة', imageSubject: 'equipment rental', sections: sections.map((s) => ({ section: s.id, angle: s.id, tone: 'light', entrance: 'none' })) }
      : { values: { title: 'معدات بناء جاهزة بيومها', image: 'shoes on a shelf' }, links: {} })),
    kind: 'rental-items', profile: { 'التصنيف': 'معدات بناء', 'الوصف': 'تأجير معدات بناء' }, assets: { heroBg: false, gallery: 1, logo: false }, sections, motion: false,
  });
  assert.deepEqual(plan.sections.map((s) => s.section), ['intro', 'about', 'search']);
  assert.equal(plan.sections[0].images.image, 'user:gallery:1', 'his photo first');
  assert.equal(plan.sections[1].images.image, 'equipment rental shoes on a shelf');
  assert.deepEqual(plan.sections[2].slots, {}, 'the search bar has nothing to write');
});

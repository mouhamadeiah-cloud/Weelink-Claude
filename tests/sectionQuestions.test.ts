import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MODELS } from '../src/data/pageModels.ts';
import { STEP_HELP } from '../src/data/stepExplain.ts';
import { SECTION_ASKS, firstNameOf, missingEntries, previewCategoryOf, pruneAnswers, questionPlan, questionsFor, summarizeAnswer, summarizeSection, unknownSections, withName } from '../src/data/sectionQuestions.ts';

const model = (id: string) => DEFAULT_MODELS.find((m) => m.id === id)!;

test('every section a model can hold has its questions (or an empty entry), so a new section cannot be forgotten', () => {
  assert.deepEqual(missingEntries(), []);
  for (const m of DEFAULT_MODELS) assert.deepEqual(unknownSections(m), [], m.id);
});

test('the sections the owner ticks and those always asked come from the model', () => {
  const pro = questionPlan(model('page-pro'));
  assert.deepEqual(pro.choices.map((c) => c.id), ['features', 'team', 'projects', 'video', 'booking', 'ratings', 'privacy']);
  assert.ok(pro.fixed.some((c) => c.id === 'prices'));
  const free = questionPlan(model('page-free'));
  assert.ok(!free.choices.some((c) => c.id === 'team'), 'the free page offers no team');
});

test('ticking a section brings its questions, and leaving it out takes them away', () => {
  const ids = (ticked?: string[]) => questionsFor(model('page-pro'), ticked).map((s) => s.id);
  assert.ok(ids(['team']).includes('team') && !ids(['team']).includes('booking'));
  assert.ok(!ids([]).includes('team'));
  assert.ok(ids(undefined).includes('privacy') === false, 'privacy has no question of its own');
});

test('a price list asks for five rows to start with', () => {
  const prices = SECTION_ASKS.prices.questions[0];
  assert.equal(prices.count, 5);
  assert.deepEqual(prices.fields, ['name', 'price']);
});

test('a restaurant asks for its dishes through its menu section, a package without it does not', () => {
  assert.ok(questionsFor(model('restaurant'), []).some((s) => s.id === 'restaurant:main'));
  assert.ok(!questionsFor(model('restaurant-free'), []).some((s) => s.id === 'restaurant:main'));
});

test('every section explains itself to the owner, in Wee AI\'s words', () => {
  for (const [id, ask] of Object.entries(SECTION_ASKS)) assert.ok(ask.explain && ask.explain.length > 40, `${id} has no explanation`);
});

test('the owner is called by his first name once he gave it, and the sentence loses it while Wee AI does not know it', () => {
  assert.equal(firstNameOf('أحمد محمد العلي'), 'أحمد');
  assert.equal(firstNameOf('أحمد محمد', 'شركة'), '', 'a company has no first name');
  assert.equal(firstNameOf(''), '');
  assert.equal(withName('يا {name}، هاد قسمك', 'أحمد'), 'يا أحمد، هاد قسمك');
  assert.equal(withName('يا {name}، هاد قسمك', ''), 'هاد قسمك');
  assert.equal(withName('اسمك {name}', 'سارة'), 'اسمك سارة');
});

test('an answer is shown to the owner in a line: names with prices, his choice, or the booking hours', () => {
  const list = SECTION_ASKS['restaurant:main'].questions[1];
  assert.equal(summarizeAnswer(list, [{ name: 'شيش طاووق', price: '25000' }, { name: '' }, { name: 'كبة' }]), 'شيش طاووق (25000)، كبة');
  assert.equal(summarizeAnswer(list, []), '');
  const booking = SECTION_ASKS.booking.questions[1];
  assert.equal(summarizeAnswer(booking, { now: false }), 'أضبطها لاحقاً من الإدارة');
  assert.match(summarizeAnswer(booking, { now: true, days: [6, 0], from: '09:00', to: '17:00', minutes: 30 }), /السبت، الأحد من 09:00 إلى 17:00، مدة الموعد 30 دقيقة/);
  assert.equal(summarizeAnswer(SECTION_ASKS.booking.questions[0], 'موعد أو استشارة'), 'موعد أو استشارة');
  assert.equal(summarizeSection('video', SECTION_ASKS.video, {}), '');
});

test('unticking a section removes its answers and no other', () => {
  const answers = { 'team.team': [{ name: 'سامر' }], 'booking.bookingKind': 'موعد أو استشارة', 'booking.bookingSettings': { now: false }, 'video.video': 'x' };
  assert.deepEqual(pruneAnswers(answers, ['booking']), { 'team.team': [{ name: 'سامر' }], 'video.video': 'x' });
  assert.deepEqual(pruneAnswers(answers, []), answers);
});

test('a section previews with the ready slides of its own category; the store sections with their store slide, ratings with none', () => {
  assert.equal(previewCategoryOf('about'), 'about');
  assert.equal(previewCategoryOf('booking'), 'booking');
  assert.equal(previewCategoryOf('restaurant:front'), 'intro');
  assert.equal(previewCategoryOf('shop:main'), 'shop');
  assert.equal(previewCategoryOf('cars:main'), 'cars');
  assert.equal(previewCategoryOf('search'), 'search');
  assert.equal(previewCategoryOf('ratings'), undefined);
});

test('every one of Wee AI\'s fixed questions (the rest come from the page model) has its explanation and note for the panel beside the chat', () => {
  for (const n of [1, 2, 3, 4, 5, 6, 7, 9]) assert.ok(STEP_HELP[n]?.explain.length > 60 && STEP_HELP[n]?.note, `step ${n}`);
  assert.match(withName(STEP_HELP[2].explain, 'أحمد'), /يا أحمد، وين/);
});

test('the gallery, the front photo, the services and the features are asked by the sections of the model, each form once', () => {
  const forms = (id: string) => questionsFor(model(id), undefined).flatMap((s) => s.ask.questions.map((q) => q.custom)).filter(Boolean);
  const free = forms('page-free');
  assert.deepEqual(free.filter((f) => f === 'services'), ['services'], 'services and the price list share one form');
  assert.ok(free.includes('gallery') && free.includes('hero'));
});

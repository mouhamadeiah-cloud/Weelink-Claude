import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MODELS } from '../src/data/pageModels.ts';
import { SECTION_ASKS, missingEntries, questionPlan, questionsFor, unknownSections } from '../src/data/sectionQuestions.ts';

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

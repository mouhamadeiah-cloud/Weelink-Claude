import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OPTIONAL_SECTIONS, tickedSections } from '../src/data/optionalSections.ts';
import { DEFAULT_MODELS } from '../src/data/pageModels.ts';

test('every section offered in the questions is an «يختاره الزبون» section of the free page model, with the same default', () => {
  const asked = DEFAULT_MODELS[0].sections.filter((s) => s.mode === 'ask');
  for (const o of OPTIONAL_SECTIONS) {
    const s = asked.find((x) => x.category === o.id);
    assert.ok(s, `${o.id} is asked in the free model`);
    assert.equal(!!s!.defaultOn, o.defaultOn, `${o.id} default`);
  }
});

test('nothing saved takes the defaults; a saved choice, even an empty one, is kept; unknown ids go', () => {
  assert.deepEqual(tickedSections(undefined), ['privacy']);
  assert.deepEqual(tickedSections([]), []);
  assert.deepEqual(tickedSections(['ratings', 'nope', 'privacy']), ['ratings', 'privacy']);
});

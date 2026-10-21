import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { WEE_SLIDES } from '../src/data/weeSlideTemplates';
import { buildElementAnimation } from '../src/utils/elementAnimation';

const forest = () => WEE_SLIDES.intro[0]();

test('the forest cover leads the «مدخل» slides and its art files exist', () => {
  const slide = forest();
  assert.equal(slide.aiTemplate, 'hero.forest');
  const files = new Set<string>([slide.backgroundImage || '', ...slide.elements.filter((e: any) => e.type === 'image').map((e: any) => e.imageUrl)]);
  assert.ok(files.size >= 4);
  for (const f of files) assert.ok(existsSync(new URL(`../public${f}`, import.meta.url)), f);
});

test('its leaves, bush and headline leave at their own pace as the page is scrolled, resting where drawn', () => {
  const layers = forest().elements.filter((e: any) => e.styles.animationTrigger === 'scrub');
  assert.ok(layers.length >= 5); // branch, flowers, bush, headline, sub text
  for (const e of layers as any[]) {
    assert.equal(e.styles.animationScrub, 'leave');
    // the first state is the element as drawn, not the default «coming in» state
    assert.equal(e.styles.animationFrom.opacity, 1);
    assert.equal(e.styles.animationFrom.x, 0);
    const b = buildElementAnimation(e.styles, { x: e.x, width: e.width, pageWidth: 1280, bleed: 0, phone: false, waits: true, scrub: true });
    assert.equal(b.style.animationRange, 'exit 0% exit 100%');
  }
  const paces = new Set((layers as any[]).map((e) => JSON.stringify(e.styles.animationTo)));
  assert.equal(paces.size, layers.length); // every layer has its own movement
});

test('every element of the forest cover has its own phone layout', () => {
  for (const e of forest().elements as any[]) assert.ok(e.mobile, e.name);
});

const COVERS = ['hero.forest', 'hero.paper', 'hero.disc'];

test('the three cinematic covers lead «مدخل», keep their art files and move with the scrolling', () => {
  const slides = WEE_SLIDES.intro.map((make) => make());
  assert.deepEqual(slides.slice(0, 3).map((s) => s.aiTemplate), COVERS);
  for (const slide of slides.slice(0, 3)) {
    const files = new Set<string>([slide.backgroundImage || '', ...slide.elements.filter((e: any) => e.type === 'image').map((e: any) => e.imageUrl)]);
    for (const f of files) assert.ok(existsSync(new URL(`../public${f}`, import.meta.url)), f);
    const scrubbed = slide.elements.filter((e: any) => e.styles.animationTrigger === 'scrub');
    assert.ok(scrubbed.length >= 4, slide.aiTemplate);
    for (const e of slide.elements as any[]) assert.ok(e.mobile, `${slide.aiTemplate} ${e.name}`);
  }
});

test('the disc cover grows its disc out of a dot as it comes up, stones float over it', () => {
  const disc = WEE_SLIDES.intro[2]();
  const circle = disc.elements.find((e: any) => e.name === 'قرص') as any;
  assert.equal(circle.styles.animationScrub, 'enter');
  assert.ok(circle.styles.animationFrom.scale < 0.1);
  assert.equal(circle.styles.animationTo.scale, 1);
  const stones = disc.elements.filter((e: any) => e.name.startsWith('حجر')) as any[];
  assert.equal(stones.length, 3);
  for (const s of stones) assert.equal(s.styles.animationLayers[0].animation, 'float'); // two animations on one element
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { autoSlots } from '../src/data/autoSlots.ts';
import { slideForm } from '../src/data/slideForm.ts';
import { buildFormPlan, checkValues, mergePlans, type FormEnv, type FormSection } from '../server/formBuild.ts';

const ready: any[] = JSON.parse(fs.readFileSync(new URL('../src/data/galleryReady/ready.json', import.meta.url), 'utf8'));
const slideOf = (key: string) => {
  const r = ready.find((x) => x.key === key);
  return { r, elements: autoSlots(r.elements) as any[] };
};
const section = (key: string, id = 'intro'): FormSection => {
  const { r, elements } = slideOf(key);
  return { id, name: r.name, template: `g:${key}`, slide: r.slide, elements };
};

const env = (ask: FormEnv['ask']): FormEnv => ({
  ask,
  looks: { clear: { name: 'واضح', forWho: 'الكل', bg: '#fff', ink: '#111', accent: '#07f', head: 'A', body: 'B' } },
  defaultLook: 'clear',
  icons: ['mdi:star-outline', 'mdi:shield-check-outline'],
  tones: ['light', 'tint', 'dark'],
  entrances: ['none', 'fade'],
  navLayouts: ['horizontal'],
  navTones: ['light'],
});

const profile = { 'التصنيف': 'نجارة', 'الوصف': 'ورشة أبواب وشبابيك خشب وألمنيوم في دمشق' };
const assets = { heroBg: false, gallery: 0, logo: false };

// An answer that fills every part with words of about the example's length.
const fill = (section: FormSection) => {
  const form = slideForm(section.slide, section.elements);
  const values: Record<string, string> = {};
  const links: Record<string, string> = {};
  for (const f of form.fields) {
    if (f.kind === 'icon') values[f.key] = 'mdi:star-outline';
    else if (f.kind === 'image') values[f.key] = 'wooden doors workshop soft light';
    else values[f.key] = 'ورشة الأبواب والشبابيك'.repeat(Math.ceil(Math.max(1, f.target) / 20)).slice(0, Math.max(3, f.target)).trim() + (f.figure ? '' : '');
    if (f.kind === 'button') links[f.key] = 'whatsapp';
  }
  return { values, links };
};

const brief = (sections: FormSection[]) => ({ look: 'clear', navbar: { layout: 'horizontal', sticky: true, tone: 'light' }, voice: 'دافئة', imageSubject: 'wooden doors workshop', sections: sections.map((s) => ({ section: s.id, angle: `فكرة ${s.id}`, tone: 'light', entrance: 'fade' })) });

test('the form of the three-card intro lists every part, with the example and its length', () => {
  const { r, elements } = slideOf('intro-10');
  const form = slideForm(r.slide, elements);
  const keys = form.fields.map((f) => f.key);
  for (const k of ['title', 'sub', 'cta', 'points.0.title', 'points.2.text', 'extra.0']) assert.ok(keys.includes(k), k);
  assert.equal(form.lists.points, 3);
  const title = form.fields.find((f) => f.key === 'title')!;
  assert.equal(title.example, 'كل ما تحتاجه في مكان واحد');
  assert.ok(title.min < title.target && title.target < title.max);
});

test('every part of every ready slide has a role, and figures and photos are marked', () => {
  let photos = 0, figures = 0;
  for (const r of ready) {
    const form = slideForm(r.slide, autoSlots(r.elements));
    assert.ok(form.fields.length > 0, r.key);
    for (const f of form.fields) {
      assert.ok(f.role, `${r.key} ${f.key}`);
      if (f.kind === 'image') photos++;
      if (f.figure) figures++;
    }
  }
  assert.ok(photos > 30 && figures > 10);
});

test('a plan has every part of the slide filled and none of the example\'s words', async () => {
  const intro = section('intro-10');
  const plan = await buildFormPlan({
    env: env(async (prompt: string) => (prompt.includes('ملخص الصفحة:') && !prompt.includes('أجزاء الشريحة') ? brief([intro]) : fill(intro))),
    kind: 'free', profile, assets, sections: [intro], motion: false,
  });
  assert.equal(plan.sections.length, 1);
  const s = plan.sections[0];
  const form = slideForm(intro.slide, intro.elements);
  for (const f of form.fields.filter((x) => x.kind === 'text' || x.kind === 'button')) assert.ok(s.slots[f.key], f.key);
  assert.equal(s.template, 'g:intro-10');
  assert.equal(s.entrance, 'none');
});

test('a missing, copied or invented-figure answer is asked again, and what still fails goes without text', async () => {
  const intro = section('intro-10');
  const form = slideForm(intro.slide, intro.elements);
  const asked: string[] = [];
  const first = fill(intro);
  delete first.values['points.0.text'];
  first.values['points.1.text'] = form.fields.find((f) => f.key === 'points.1.text')!.example;
  first.values.sub = 'خبرة ٣٠ سنة في صناعة الأبواب والشبابيك';
  const plan = await buildFormPlan({
    env: env(async (prompt: string) => {
      asked.push(prompt);
      if (!prompt.includes('أجزاء الشريحة') && !prompt.includes('كانت إجاباتها غير صالحة')) return brief([intro]);
      if (prompt.includes('كانت إجاباتها غير صالحة')) {
        assert.ok(prompt.includes('points.0.text') && prompt.includes('points.1.text') && prompt.includes('sub'));
        assert.ok(!prompt.includes('\ncta '));
        return { values: { 'points.0.text': 'أبواب خشب متينة تُصنع على القياس', 'points.1.text': 'نركّب أبواب ألمنيوم تدوم سنين طويلة' } }; // sub stays wrong
      }
      return first;
    }),
    kind: 'free', profile, assets, sections: [intro], motion: false,
  });
  assert.equal(asked.length, 3);
  const s = plan.sections[0];
  assert.equal(s.slots['points.0.text'], 'أبواب خشب متينة تُصنع على القياس');
  assert.equal(s.slots['points.1.text'], 'نركّب أبواب ألمنيوم تدوم سنين طويلة');
  assert.equal(s.slots.sub, undefined, 'a figure the owner never wrote does not stay');
});

test('figures the owner wrote are kept, and a price without them is «حسب الطلب»', () => {
  const prices = section('prices-1', 'prices');
  const form = slideForm(prices.slide, prices.elements);
  const priceKey = form.fields.find((f) => f.key.endsWith('.price'))?.key;
  if (!priceKey) return;
  const owners = new Set(['500']);
  const ok = checkValues(form, { [priceKey]: '500 ل.س' }, { owners, assets, icons: new Set(), section: 'prices' });
  assert.equal(ok.slots[priceKey], '500 ل.س');
  const bad = checkValues(form, { [priceKey]: '900 ل.س' }, { owners, assets, icons: new Set(), section: 'prices' });
  assert.equal(bad.slots[priceKey], 'حسب الطلب');
});

test('buttons lead only to sections that are on the page, renumbered', async () => {
  const intro = section('intro-10');
  const about = section('about-1', 'about');
  const contact = section('contact-1', 'contact');
  const buttons = slideForm(intro.slide, intro.elements).fields.filter((f) => f.kind === 'button').map((f) => f.key);
  const plan = await buildFormPlan({
    env: env(async (prompt: string) => {
      if (!prompt.includes('أجزاء الشريحة')) return brief([intro, about, contact]);
      if (prompt.includes(`هذا القسم: «${about.name}»`)) return { values: {}, links: {} }; // fails to answer fully: dropped
      const a = fill(intro);
      for (const b of buttons) a.links[b] = 'slide:2';
      return a;
    }),
    kind: 'free', profile, assets, sections: [intro, about, contact], motion: false,
  });
  assert.deepEqual(plan.sections.map((s) => s.section), ['intro', 'contact'], 'a section whose answer holds nothing is not built');
  const toContact = Object.values(plan.sections[0].links);
  assert.ok(toContact.length > 0 && toContact.every((l) => l === 'slide:1'), 'slide:2 became slide:1 once the about section went');
});

test('form sections and a code-slide section are merged in the model\'s order, with buttons renumbered', () => {
  const sec = (section: string, links: Record<string, string> = {}) => ({ section, template: `t-${section}`, tone: 'light' as const, slots: {}, icons: {}, links, images: {}, entrance: 'none' });
  const formPlan: any = { look: 'clear', navbar: { layout: 'horizontal', sticky: true, tone: 'light' }, motion: false, sections: [sec('intro', { cta: 'slide:1', send: 'whatsapp' }), sec('contact')] };
  const merged = mergePlans(formPlan, [sec('featured')], ['intro', 'featured', 'contact']);
  assert.deepEqual(merged.sections.map((s) => s.section), ['intro', 'featured', 'contact']);
  assert.equal(merged.sections[0].links.cta, 'slide:2');
  assert.equal(merged.sections[0].links.send, 'whatsapp');
});

test('a card title shorter than the example is accepted, only a scrap is asked again', () => {
  const { elements } = slideOf('features-9');
  const form = slideForm(undefined, elements);
  const o = { owners: new Set<string>(), assets: { heroBg: false, gallery: 0, logo: false }, icons: new Set<string>(), section: 'why' };
  const key = form.fields.find((f) => /^points\.\d+\.title$/.test(f.key))!.key;
  assert.equal(checkValues(form, { [key]: 'جودة عالية' }, o).slots[key], 'جودة عالية');
  assert.equal(checkValues(form, { [key]: 'ج' }, o).problems.some((p) => p.key === key), true);
});

test('the example\'s stock photo is a photo slot (about-12), a plain library picture is not', () => {
  const { elements } = slideOf('about-12');
  assert.ok(elements.some((e: any) => e.type === 'image' && e.aiSlot === 'image'));
});

test('the navbar is drawn by the server, so it differs from page to page', async () => {
  const { elements } = slideOf('about-12');
  const mk = (rng: () => number): FormEnv => ({
    ask: async (prompt: string) => (/ملخص الصفحة:/.test(prompt) ? { values: {} } : { look: 'clear', navbar: { layout: 'horizontal', sticky: true, tone: 'light' }, voice: 'دافئة', imageSubject: 'shop', sections: [{ section: 'about', angle: 'x', tone: 'light', entrance: 'none' }] }),
    looks: { clear: { name: 'x', forWho: 'x', bg: '#fff', ink: '#000', accent: '#f00', head: 'a', body: 'b' } }, defaultLook: 'clear', icons: ['mdi:star'], tones: ['light', 'tint', 'dark'], entrances: ['none', 'fade'],
    navLayouts: ['horizontal', 'hamburger', 'vertical'], navTones: ['light', 'tint', 'accent', 'dark'], rng,
  });
  const run = (rng: () => number) => buildFormPlan({ env: mk(rng), kind: 'free', profile: { 'الوصف': 'x' }, assets: { heroBg: false, gallery: 0, logo: false }, sections: [{ id: 'about', name: 'من نحن', template: 'g:a', slide: undefined, elements }], motion: false });
  const a = await run(() => 0.01);
  const b = await run(() => 0.99);
  assert.notDeepEqual(a.navbar, b.navbar);
});

test('a booking slide goes into the plan as designed, with nothing for the AI to write', async () => {
  const booking: FormSection = { id: 'booking', name: 'حجز طاولة', template: 'g:table-booking', elements: [{ id: 'c1', type: 'calendar', x: 0, y: 0, width: 780, height: 500, content: '', calendarBookingType: 'table' }] };
  const intro = section('intro-10');
  const plan = await buildFormPlan({
    env: env(async (prompt: string) => (/values/.test(prompt) ? { values: fill(intro).values, links: fill(intro).links } : brief([intro, booking]))),
    kind: 'restaurant', profile, assets, sections: [intro, booking], motion: false,
  });
  const kept = plan.sections.find((s) => s.section === 'booking');
  assert.ok(kept);
  assert.deepEqual(kept!.slots, {});
});

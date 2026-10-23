import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanFreeDesign, freeToBuilt, patchFreeDesign, FREE_FONTS } from '../src/utils/freeDesign.ts';
import { freeTurn, freePrompt, FREE_SCHEMA } from '../server/freeDesign.ts';

const ctx = { icons: new Set(['mdi:star-outline', 'mdi:phone']), figuresOk: (t: string) => !/\d/.test(t) || t.includes('24') };
const hero = (extra: any = {}) => ({
  key: 'hero', name: 'الرئيسية', height: 620, bg: '#101820', photo: 'modern restaurant interior', overlay: '#000000',
  elements: [
    { kind: 'heading', x: 600, y: 160, w: 580, h: 90, text: 'مطعم الياسمين', size: 56, color: '#ffffff', font: 'head', effect: 'gold', motion: 'fade', trigger: 'once' },
    { kind: 'text', x: 600, y: 270, w: 580, h: 90, text: 'مأكولات شامية بنكهة البيت', size: 20, color: '#e5e5e5' },
    { kind: 'button', x: 880, y: 400, w: 300, h: 60, text: 'اطلب الآن', bg: '#d4af37', color: '#101820', link: 'whatsapp', motion: 'pulse' },
    { kind: 'icon', x: 100, y: 100, w: 48, h: 48, icon: 'mdi:star-outline', color: '#d4af37' },
    ...(extra.more || []),
  ],
});
const answer = (sections: any[]) => ({ reply: 'صممتلك الصفحة', look: { head: 'El Messiri', body: 'Tajawal' }, sections });

test('free design: only platform parts survive, numbers are clamped and colours checked', () => {
  const d = cleanFreeDesign(answer([hero({ more: [
    { kind: 'video', x: 0, y: 0, w: 10, h: 10 }, // not a platform kind
    { kind: 'icon', x: 0, y: 0, w: 40, h: 40, icon: 'mdi:made-up' }, // unknown icon
    { kind: 'heading', x: 5000, y: 99999, w: 9000, h: 10, text: '<b>سعر</b> 5000', size: 900, color: 'red' }, // invented figure
    { kind: 'text', x: 5000, y: 99999, w: 9000, h: 10, text: 'قسم <script>x</script>مفتوح 24 ساعة', size: 900, color: 'red', effect: 'not-an-effect', motion: 'explode' },
  ] })]), ctx);
  const els = d.sections[0].elements;
  assert.equal(els.length, 5);
  const last = els[4];
  assert.ok(last.x + last.w <= 1280 && last.size === 120 && last.color === undefined && last.effect === undefined && last.motion === undefined);
  assert.ok(!last.text!.includes('<'));
  assert.equal(d.look.head, 'El Messiri');
  assert.ok(FREE_FONTS.includes(d.look.body));
});

test('free design: unknown fonts fall back and an empty answer is refused', () => {
  const d = cleanFreeDesign({ look: { head: 'Comic Sans', body: 'Nope' }, sections: [hero()] }, ctx);
  assert.equal(d.look.head, FREE_FONTS[0]);
  assert.throws(() => cleanFreeDesign({ sections: [] }, ctx), /empty_design/);
});

test('free design becomes slides with elements, a phone layout, motions, effects and a button link', () => {
  const d = cleanFreeDesign(answer([hero(), { key: 'contact', name: 'تواصل', height: 400, bg: '#ffffff', elements: [{ kind: 'heading', x: 200, y: 80, w: 880, h: 70, text: 'تواصل معنا', size: 40, align: 'center' }] }]), ctx);
  const b = freeToBuilt(d, { idPrefix: 'free', linkFor: (l) => (l === 'whatsapp' ? { linkType: 'contact', contactType: 'whatsapp' } : null) });
  assert.equal(b.slides.length, 2);
  assert.ok(b.slides.every((s) => s.mobileHeight && s.dividerShape === 'straight'));
  assert.deepEqual(b.photos.map((p) => p.words), ['modern restaurant interior']);
  const ids = new Set(b.elements.map((e) => e.id));
  assert.equal(ids.size, b.elements.length);
  assert.ok(b.elements.every((e) => e.mobile));
  const title = b.elements.find((e) => e.content === 'مطعم الياسمين')!;
  assert.equal(title.styles.textEffect, 'gold');
  assert.equal(title.styles.animation, 'fade');
  assert.equal(title.styles.fontFamily, 'El Messiri');
  const btn = b.elements.find((e) => e.type === 'button')!;
  assert.equal(btn.contactType, 'whatsapp');
  assert.equal(btn.styles.animationTrigger, 'loop');
  assert.ok(b.elements.some((e) => e.content === 'iconify:mdi:star-outline'));
  // a found photo is used and no longer asked for
  assert.equal(freeToBuilt(d, { idPrefix: 'f', photoUrl: () => '/p.jpg' }).photos.length, 0);
});

test('chat edits: only the changed sections come back and are laid over the page', async () => {
  const first = await freeTurn({ ask: async () => answer([hero(), { key: 'contact', name: 'تواصل', height: 400, bg: '#ffffff', elements: [{ kind: 'text', x: 200, y: 80, w: 880, h: 70, text: 'اتصل بنا', size: 20 }] }]), system: 's', ctx, profile: { 'الوصف': 'مطعم' }, icons: ['mdi:star-outline'], message: 'ابنِ الصفحة' });
  assert.equal(first.design.sections.length, 2);
  let prompt = '';
  const second = await freeTurn({
    ask: async (p) => { prompt = p; return { ...answer([{ ...hero(), bg: '#223344' }, { key: 'menu', name: 'القائمة', height: 500, bg: '#fff', elements: [{ kind: 'heading', x: 100, y: 50, w: 600, h: 60, text: 'قائمتنا', size: 36 }] }]), remove: ['contact'] }; },
    system: 's', ctx, profile: { 'الوصف': 'مطعم' }, icons: [], current: first.design, history: [{ role: 'user', text: 'ابنِ الصفحة' }, { role: 'ai', text: 'تم' }], message: 'غيّر الخلفية وأضف قائمة',
  });
  assert.deepEqual(second.design.sections.map((s) => s.key), ['hero', 'menu']);
  assert.equal(second.design.sections[0].bg, '#223344');
  assert.deepEqual(second.changed, ['hero', 'menu']);
  assert.ok(prompt.includes('التصميم الحالي') && prompt.includes('غيّر الخلفية') && prompt.includes('ابنِ الصفحة'));
  // a turn that only removes a section is fine once a page exists
  const third = await freeTurn({ ask: async () => ({ ...answer([]), remove: ['menu'] }), system: 's', ctx, profile: {}, icons: [], current: second.design, message: 'احذف القائمة' });
  assert.deepEqual(third.design.sections.map((s) => s.key), ['hero']);
});

test('the same chat works for every kind of page and the schema/prompt carry the platform lists', () => {
  const p = freePrompt({ profile: { 'الوصف': 'معرض سيارات' }, icons: ['mdi:phone'], structure: ['الرئيسية', 'السيارات', 'تواصل'], message: 'ابنِ' });
  assert.ok(p.includes('mdi:phone') && p.includes('السيارات') && p.includes('معرض سيارات'));
  assert.ok((FREE_SCHEMA.properties.sections.items.properties.elements.items.properties.motion.enum as string[]).includes('slide-up'));
  const merged = patchFreeDesign({ look: { head: 'A', body: 'B' }, sections: [] }, { look: { head: 'C', body: 'D' }, sections: [] });
  assert.equal(merged.look.head, 'C');
});

test('the free design replaces the page slides, finds its photos once and links a button to the owner WhatsApp', async () => {
  const { applyFreeDesign } = await import('../src/services/pageBuilder.ts');
  const d = cleanFreeDesign(answer([hero()]), ctx);
  const page: any = { id: 'p1', name: 'الرئيسية', slug: '/', slides: [{ id: 'old', name: 'x', height: 500, backgroundColor: '#fff' }], navbar: { brandName: 'x' } };
  const old: any = { id: 'o1', slideId: 'old', type: 'heading', x: 0, y: 0, width: 10, height: 10, content: 'قديم', styles: {} };
  const asked: string[] = [];
  const answers: any = { contactInfo: { whatsapp: '0933123456' }, personalInfo: {} };
  const r: any = await applyFreeDesign(d, { kind: 'free', answers, siteName: 'تجربة', pages: [page], elements: [old], activePageId: 'p1' }, async (q) => { asked.push(q); return '/p.jpg'; });
  assert.ok(r.ok);
  assert.deepEqual(asked, ['modern restaurant interior']);
  assert.equal(r.pages[0].slides.length, 1);
  assert.equal(r.pages[0].slides[0].backgroundImage, '/p.jpg');
  assert.ok(!r.elements.some((e: any) => e.id === 'o1'));
  const btn = r.elements.find((e: any) => e.type === 'button');
  assert.equal(btn.contactType, 'whatsapp');
});

// Importing the builder starts Firebase's browser client, which keeps the process alive.
after(async () => {
  const { getApps, deleteApp } = await import('firebase/app');
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

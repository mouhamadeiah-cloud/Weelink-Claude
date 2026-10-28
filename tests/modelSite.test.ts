import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keepModelPages, keptAsIs, twinOf } from '../src/services/pageBuilder.ts';
import { pageRole } from '../src/data/pageModels.ts';

const page = (id: string, name: string, slides: string[]) => ({ id, name, slug: `/${id}`, navbar: { brandName: '', items: [], ctaText: 'اطلب', ctaHref: '#', ctaLinkType: 'page', ctaLinkTargetId: 'shop-page-order' }, slides: slides.map((s) => ({ id: s, name: s, height: 500 })) }) as any;
const el = (id: string, slideId: string, more = {}) => ({ id, slideId, type: 'button', x: 0, y: 0, width: 10, height: 10, content: '', styles: {}, ...more }) as any;

test('a page of the model knows what it is to a store: its cart, its live list, its contact page', () => {
  assert.equal(pageRole({ name: 'السلة', sections: [], system: 'cart' }), 'cart');
  assert.equal(pageRole({ name: 'المنيو', sections: [{ id: 'restaurant:main', category: 'restaurant', part: 'main', mode: 'always' }] }), 'menu');
  assert.equal(pageRole({ name: 'تواصل معنا', sections: [{ id: 'about', category: 'about', mode: 'always' }] }), 'contact');
  assert.equal(pageRole({ name: 'اتصل', sections: [{ id: 'contact', category: 'contact', mode: 'always' }] }), 'contact');
  assert.equal(pageRole({ name: 'من نحن', sections: [{ id: 'about', category: 'about', mode: 'always' }] }), undefined);
  assert.equal(pageRole({ name: 'الشروط', sections: [{ id: 'privacy', category: 'privacy', mode: 'always' }] }), undefined);
  assert.ok(keptAsIs({ role: 'cart' }) && keptAsIs({ role: 'menu' }) && !keptAsIs({ role: 'contact' }) && !keptAsIs({}));
});

test('a page of the model takes the store\'s own page of its kind, once', () => {
  const pages = [page('shop-page-home', 'الرئيسية', ['h']), page('shop-page-cart', 'السلة', ['c']), page('shop-page-contact', 'تواصل', ['t'])];
  assert.equal(twinOf({ role: 'cart' }, pages, []), 'shop-page-cart');
  assert.equal(twinOf({ role: 'contact' }, pages, ['shop-page-contact']), null);
  assert.equal(twinOf({}, pages, []), null);
});

test('the site keeps exactly the model\'s pages in its order and names; what led to a page that went leads to the first', () => {
  const pages = [page('shop-page-home', 'الرئيسية', ['h']), page('shop-page-order', 'طريقة الطلب', ['o']), page('shop-page-cart', 'السلة', ['c']), page('page-ai-1', 'من نحن', ['a'])];
  const elements = [el('1', 'h', { linkType: 'page', linkTargetId: 'shop-page-order' }), el('2', 'o'), el('3', 'c'), el('4', 'a')];
  const out = keepModelPages(pages, elements, [{ pageId: 'shop-page-home', name: 'البيت' }, { pageId: 'page-ai-1', name: 'من نحن' }, { pageId: 'shop-page-cart', name: 'السلة' }]);
  assert.deepEqual(out.pages.map((p) => [p.id, p.name]), [['shop-page-home', 'البيت'], ['page-ai-1', 'من نحن'], ['shop-page-cart', 'السلة']]);
  assert.deepEqual(out.elements.map((e) => e.id), ['1', '3', '4'], '«طريقة الطلب» goes with its elements');
  assert.equal(out.elements[0].linkTargetId, 'shop-page-home');
  assert.ok(out.pages.every((p) => p.navbar.ctaLinkTargetId === 'shop-page-home'));
});

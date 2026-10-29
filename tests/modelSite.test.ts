import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keepModelPages } from '../src/services/pageBuilder.ts';
import { modelSkeleton } from '../src/services/modelSite.ts';
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
  const both = [{ id: 'shop:main', category: 'shop', part: 'main', mode: 'always' }, { id: 'cars:main', category: 'cars', part: 'main', mode: 'always' }] as any;
  assert.equal(pageRole({ name: 'المعرض', sections: both }, 'rental-cars'), 'cars', 'a rental of cars: its showroom');
  assert.equal(pageRole({ name: 'المعرض', sections: both }, 'rental-items'), 'products', 'a rental of things: its shop');
});

test('the site starts as exactly the model\'s pages, each empty, the cart the system\'s own; a live list takes the id its slides open', () => {
  const navbar = { brandName: '', items: [], ctaText: '', ctaHref: '#' } as any;
  const site = [{ id: 'home', name: 'الرئيسية' }, { id: 'p2', name: 'المنيو', role: 'menu' as const }, { id: 'p3', name: 'من نحن' }, { id: 'cart', name: 'السلة', system: 'cart' as const, role: 'cart' as const }];
  const out = modelSkeleton('restaurant', site, navbar, 7);
  assert.deepEqual(out.pages.map((p) => p.name), ['الرئيسية', 'المنيو', 'من نحن', 'السلة']);
  assert.equal(out.pages[1].id, 'rest-page-menu');
  assert.equal(out.cartId, 'rest-page-cart');
  assert.ok(out.pages.filter((p) => p.id !== out.cartId).every((p) => p.slides.length === 1 && p.slides[0].name === 'شريحة فارغة'));
  const cartSlides = new Set(out.pages.find((p) => p.id === out.cartId)!.slides.map((s) => s.id));
  assert.ok(out.elements.length > 0 && out.elements.every((e) => cartSlides.has(e.slideId)), 'only the cart is drawn');
  assert.equal(new Set(out.pages.map((p) => p.id)).size, out.pages.length);
  const rental = modelSkeleton('rental', [{ id: 'home', name: 'الرئيسية' }, { id: 'cart', name: 'سلة الحجز', system: 'cart' }], navbar, 8);
  assert.equal(rental.cartId, 'rental-page-cart');
  assert.equal(rental.pages[1].name, 'سلة الحجز');
  assert.ok(rental.elements.some((e) => e.type === 'cart') && rental.elements.some((e) => e.type === 'checkout'));
  assert.equal(modelSkeleton('cars', [{ id: 'home', name: 'الرئيسية' }, { id: 'cart', name: 'السلة', system: 'cart' }], navbar, 9).pages.length, 1, 'a showroom has no cart');
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

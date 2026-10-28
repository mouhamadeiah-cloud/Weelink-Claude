import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MODELS } from '../src/data/pageModels.ts';
import { questionsFor } from '../src/data/sectionQuestions.ts';
import { createEmptyRestaurantAdmin } from '../src/components/restaurant/restaurantTypes.ts';
import { priceOf, seedRestaurant } from '../src/services/seedAnswers.ts';

test('prices typed in any digits and with separators', () => {
  assert.equal(priceOf('25,000'), 25000);
  assert.equal(priceOf('٢٥٠٠٠ ل.س'), 25000);
  assert.equal(priceOf('مجاناً'), 0);
});

test('the restaurant questions are keyed the way the seed reads them', () => {
  const m = DEFAULT_MODELS.find((x) => x.id === 'restaurant')!;
  const ids = questionsFor(m, undefined, 'restaurant').flatMap((s) => s.ask.questions.map((q) => `${s.id}.${q.id}`));
  assert.ok(ids.includes('restaurant:main.groups') && ids.includes('restaurant:main.dishes'), ids.join(','));
});

test('the groups and dishes he typed fill the menu once', () => {
  const a = { 'restaurant:main.groups': [{ name: 'مشاوي' }, { name: ' ' }, { name: 'حلويات' }], 'restaurant:main.dishes': [{ name: 'شيش طاووق', price: '45000' }, { name: '' }] };
  const admin = seedRestaurant(createEmptyRestaurantAdmin(), a);
  assert.deepEqual(admin.categories.map((c) => c.name), ['مشاوي', 'حلويات']);
  assert.equal(admin.dishes.length, 1);
  assert.equal(admin.dishes[0].categoryId, admin.categories[0].id);
  assert.equal(admin.dishes[0].price, 45000);
  const again = seedRestaurant(admin, a);
  assert.equal(again.categories.length, 2);
  assert.equal(again.dishes.length, 1);
  assert.equal(seedRestaurant(admin, undefined), admin);
});

test('shop groups and products fill the store, cars split brand, model and year', async () => {
  const { createEmptyShopAdmin } = await import('../src/components/shop/shopTypes.ts');
  const { createEmptyCarAdmin } = await import('../src/components/cars/carTypes.ts');
  const { seedShop, seedCars } = await import('../src/services/seedAnswers.ts');
  const shop = seedShop(createEmptyShopAdmin(), { 'shop:main.groups': [{ name: 'أحذية' }], 'shop:main.products': [{ name: 'حذاء رياضي', price: '120000' }] });
  assert.equal(shop.catalogs.length, 1);
  assert.equal(shop.products[0].price, 120000);
  assert.deepEqual(shop.products[0].catalogIds, [shop.catalogs[0].id]);
  const cars = seedCars(createEmptyCarAdmin(), { 'cars:main.cars': [{ name: 'تويوتا كورولا 2018', price: '9000' }] });
  assert.equal(cars.cars[0].brand, 'تويوتا');
  assert.equal(cars.cars[0].model, 'كورولا');
  assert.equal(cars.cars[0].year, 2018);
  assert.equal(seedCars(cars, { 'cars:main.cars': [{ name: 'تويوتا كورولا 2018' }] }).cars.length, 1);
});

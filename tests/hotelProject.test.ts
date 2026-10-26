import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isProjectKey, kindOf, localPrefixOf, newProjectKey } from '../src/utils/projectKeys.ts';
import { createEmptyHotelAdmin, hotelCatalogs, hotelShopView, normalizeHotelAdmin, roomsOfType, stayRoomsOf, typeCapacity } from '../src/components/hotel/hotelTypes.ts';
import { syncedHotelSettings } from '../src/components/hotel/hotelUnits.ts';
import { getHotelTemplate } from '../src/data/hotelTemplate.ts';
import { itemsOf } from '../server/searchIndex.ts';
import { limitsOf } from '../src/utils/planLimits.ts';
import { flavorOf, PLANS } from '../src/data/plans.ts';
import { publicDataFor } from '../src/components/publish/publicData.ts';
import { createEmptyShopAdmin } from '../src/components/shop/shopTypes.ts';
import { createEmptyCarAdmin } from '../src/components/cars/carTypes.ts';
import { normalizeSchedule } from '../src/services/bookingSettings.ts';
import categories from '../src/data/hotelCategories.json' with { type: 'json' };

const product = (id: string, name: string, extra: object = {}) => ({ id, name, price: 80, currency: '$', images: ['https://x/a.jpg'], published: true, inWarehouse: true, ...extra });

const withTypes = () => {
  const d = createEmptyHotelAdmin();
  d.shop.products = [product('t1', 'غرفة مزدوجة'), product('t2', 'جناح', { price: 200 })] as any;
  d.floors = [{ id: 'f1', name: 'الطابق الأول' }];
  d.rooms = [
    { id: 'r1', number: '101', floor: 'f1', type: 't1', closed: false },
    { id: 'r2', number: '102', floor: 'f1', type: 't1', closed: true },
    { id: 'r3', number: '201', floor: '', type: 't2', closed: false },
    { id: 'r4', number: '301', floor: '', type: 'gone', closed: false },
  ];
  d.capacity = { t1: 2, t2: 4 };
  return d;
};

test('a hotel is a project kind of its own', () => {
  assert.ok(isProjectKey('hotel'));
  const key = newProjectKey('hotel');
  assert.ok(isProjectKey(key));
  assert.equal(kindOf(key), 'hotel');
  assert.equal(localPrefixOf('hotel'), 'weelink_hotel_');
});

test('the packages: free is a page with the hotel flavour, rooms are the limit, Pro is open', () => {
  assert.deepEqual(PLANS.hotel.map((p) => p.id), ['hotel-free', 'hotel-30', 'hotel-60', 'hotel-pro']);
  assert.equal(flavorOf('hotel-free'), 'hotel');
  assert.equal(limitsOf('hotel-30').items, 30);
  assert.equal(limitsOf('hotel-60').items, 60);
  assert.equal(limitsOf('hotel-pro').items, Infinity);
  assert.equal(limitsOf('hotel-30').bookings, true);
});

test('floors and rooms load clean: bad ids, duplicates and a floor that is gone', () => {
  const d = normalizeHotelAdmin({
    floors: [{ id: 'f1', name: 'الأول' }, { id: 'f1', name: 'مكرر' }, { id: 'BAD ID', name: 'x' }],
    rooms: [{ id: 'r1', number: '101', floor: 'f1', type: 't1' }, { id: 'r1', number: '102' }, { id: 'r2', number: '103', floor: 'nope', type: 't1', closed: true }, { id: 'r3', number: '' }],
    capacity: { t1: 3, t2: 0, t3: 99 },
  });
  assert.equal(d.floors.length, 1);
  assert.deepEqual(d.rooms.map((r) => [r.id, r.floor, r.closed]), [['r1', 'f1', false], ['r2', '', true]]);
  assert.deepEqual(d.capacity, { t1: 3, t3: 20 });
  assert.deepEqual(normalizeHotelAdmin(undefined).rooms, []);
});

test('the open rooms of published types are the rooms the booking offers, each with its type', () => {
  const d = withTypes();
  const rooms = stayRoomsOf(d);
  assert.deepEqual(rooms.map((r) => r.id), ['r1', 'r3']); // closed and typeless rooms are left out
  assert.equal(rooms[0].name, 'غرفة 101 · غرفة مزدوجة · الطابق الأول');
  assert.equal(rooms[0].capacity, 2);
  assert.equal(rooms[1].capacity, 4);
  assert.equal(rooms[1].price, '200 $ / ليلة');
  assert.equal(rooms[0].photo, 'https://x/a.jpg');
  assert.equal(roomsOfType(d, 't1'), 2);
  assert.equal(roomsOfType(d, 't1', true), 1);
  assert.equal(typeCapacity(d, 'zz'), 2);
});

test('the rooms go into the stay schedule, other schedules and the payments stay, and nothing changes twice', () => {
  const d = withTypes();
  const rooms = stayRoomsOf(d);
  assert.equal(syncedHotelSettings(null, []), null);
  const first = syncedHotelSettings(null, rooms)!;
  assert.equal(first.schedules.length, 1);
  assert.equal(first.schedules[0].type, 'stay');
  assert.equal(first.schedules[0].rental, false);
  assert.equal(first.schedules[0].rooms.length, 2);
  assert.equal(syncedHotelSettings(first, rooms), null);
  const other = normalizeSchedule({ id: 'main', type: 'appointment' });
  const mixed = { schedules: [other, ...first.schedules], payments: { currency: '$', wallets: {} } as any };
  const again = syncedHotelSettings(mixed, rooms.slice(0, 1))!;
  assert.equal(again.schedules[0].id, 'main');
  assert.equal(again.schedules[1].rooms.length, 1);
  assert.ok(again.payments);
  // a hotel with 120 rooms keeps all of them
  const many = Array.from({ length: 120 }, (_, i) => ({ id: `m${i}`, name: `غرفة ${i}`, capacity: 2, price: '', photo: '' }));
  assert.equal(normalizeSchedule({ type: 'stay', rooms: many }).rooms.length, 120);
});

test('the room types are shop cards never sold out, and the catalogs are ready', () => {
  const view = hotelShopView(withTypes().shop);
  assert.ok(view.products.every((p) => p.inWarehouse === false));
  const cats = hotelCatalogs();
  assert.equal(cats.filter((c) => !c.parentId).length, 1);
  assert.ok(cats.length > 3);
});

test('the published copy holds the room types and the guests each takes; the search lists the room types', () => {
  const d = withTypes();
  const pub: any = publicDataFor('hotel', d.shop, createEmptyCarAdmin(), undefined, d.capacity);
  assert.equal(pub.capacity.t2, 4);
  assert.equal(pub.shop.products.length, 2);
  assert.equal(itemsOf('hotel', pub).length, 2);
});

test('the hotel template: 4 pages in the words of a stay, with product cards for the room types', () => {
  const t = getHotelTemplate();
  assert.equal(t.pages.length, 4);
  assert.ok(t.elements.some((e) => e.type === 'shopProducts'));
  assert.ok(!t.elements.some((e) => e.type === 'carListings' || e.type === 'carSearch'));
  assert.ok(t.pages.some((p) => p.name === 'الغرف'));
  assert.ok(categories.length >= 3 && categories.every((c) => c.subs.length > 0));
});

// The first «فندق» (Eyad, 25 Oct) kept room types as shop products, with floors and rooms in a
// `hotelAdmin` field. Since 26 Oct a hotel project is a «تأجير فنادق ومساحات عقارية»: a rental's
// warehouse (rentalAdmin) where a room type is an item with as many copies as it has rooms. This file
// only reads that older shape and turns it into the new one (`rentalFromHotel`, used when such a
// project is opened); the old stay-room helpers stay for the bookings it already holds.
import { normalizeUnit, type SpecialPrice } from '../../services/rentalBooking';
import { ShopAdminData, createEmptyShopAdmin, normalizeShopAdmin } from '../shop/shopTypes';
import { createEmptyCarAdmin } from '../cars/carTypes';
import type { RentalAdminData } from '../rental/rentalTypes';

export interface HotelFloor {
  id: string;
  name: string; // «الطابق الأول», «الجناح الشرقي»
}

export interface HotelRoom {
  id: string; // the booking's room id: [a-z0-9]{1,20}
  number: string; // «101»
  floor: string; // a floor id, '' = none
  type: string; // a room type: a shop product id
  closed: boolean; // out of service: not offered for booking
}

export interface HotelAdminData {
  shop: ShopAdminData; // the room types
  floors: HotelFloor[];
  rooms: HotelRoom[];
  capacity: Record<string, number>; // guests a room of the type takes, by product id
  specials: Record<string, SpecialPrice[]>; // special prices per night by weekday or date range, by product id
}

export const MAX_ROOMS = 300;
export const MAX_FLOORS = 40;

export const createEmptyHotelAdmin = (): HotelAdminData => ({ shop: createEmptyShopAdmin(), floors: [], rooms: [], capacity: {}, specials: {} });

const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
const idOk = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9]{1,20}$/.test(v);

export const normalizeHotelAdmin = (raw: any): HotelAdminData => {
  const seen = new Set<string>();
  const floors: HotelFloor[] = (Array.isArray(raw?.floors) ? raw.floors : [])
    .slice(0, MAX_FLOORS)
    .map((f: any) => ({ id: idOk(f?.id) ? f.id : '', name: str(f?.name, 40) }))
    .filter((f: HotelFloor) => f.id && f.name && !seen.has(f.id) && !!seen.add(f.id));
  const roomIds = new Set<string>();
  const rooms: HotelRoom[] = (Array.isArray(raw?.rooms) ? raw.rooms : [])
    .slice(0, MAX_ROOMS)
    .map((r: any) => ({
      id: idOk(r?.id) ? r.id : '',
      number: str(r?.number, 20),
      floor: floors.some((f) => f.id === r?.floor) ? r.floor : '',
      type: str(r?.type, 60),
      closed: r?.closed === true,
    }))
    .filter((r: HotelRoom) => r.id && r.number && !roomIds.has(r.id) && !!roomIds.add(r.id));
  const capacity: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw?.capacity && typeof raw.capacity === 'object' ? raw.capacity : {})) {
    const n = Math.round(Number(v));
    if (k && n >= 1) capacity[k.slice(0, 60)] = Math.min(20, n);
  }
  const specials: Record<string, SpecialPrice[]> = {};
  for (const [k, v] of Object.entries(raw?.specials && typeof raw.specials === 'object' ? raw.specials : {})) {
    const list = normalizeUnit({ prices: v }).prices.filter((p) => p.for === 'day' && p.kind !== 'hours');
    if (k && list.length) specials[k.slice(0, 60)] = list;
  }
  return { shop: normalizeShopAdmin(raw?.shop || {}), floors, rooms, capacity, specials };
};

export const newHotelId = () => `h${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const typeCapacity = (d: HotelAdminData, typeId: string) => d.capacity[typeId] || 2;

/** How many rooms of a type (open ones only with `openOnly`). */
export const roomsOfType = (d: HotelAdminData, typeId: string, openOnly = false) => d.rooms.filter((r) => r.type === typeId && (!openOnly || !r.closed)).length;

const priceText = (p: { price: number; currency: string }) => (p.price > 0 ? `${p.price}${p.currency ? ` ${p.currency}` : ''} / ليلة` : '');

/** The rooms as the booking's `StayRoom`s: every open room whose type is a published one. */
export const stayRoomsOf = (d: HotelAdminData) => {
  const floorName = (id: string) => d.floors.find((f) => f.id === id)?.name || '';
  return d.rooms
    .filter((r) => !r.closed)
    .map((r) => {
      const t = d.shop.products.find((p) => p.id === r.type);
      if (!t || !t.published) return null;
      const where = floorName(r.floor);
      return { id: r.id, name: `غرفة ${r.number} · ${t.name}${where ? ` · ${where}` : ''}`.slice(0, 60), capacity: typeCapacity(d, t.id), price: priceText(t).slice(0, 40), photo: t.images[0] || '', item: t.id, dayPrice: t.price > 0 ? t.price : 0, currency: t.currency || '', prices: d.specials[t.id] || [] };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
};


/** An older hotel as a rental's warehouse: each room type is an item with a copy per open room and the guests it takes. */
export const rentalFromHotel = (h: HotelAdminData): RentalAdminData => ({
  cars: createEmptyCarAdmin(),
  shop: {
    ...h.shop,
    products: h.shop.products.map((p) => ({ ...p, copies: Math.min(100, Math.max(1, roomsOfType(h, p.id, true))), maxGuests: h.capacity[p.id] || 0, inWarehouse: false })),
  },
});

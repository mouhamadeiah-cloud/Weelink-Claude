// «فندق» (Eyad, 25 Oct): rooms in floors or sections, booked by the night. It is built from the platform's
// own parts: a room TYPE is a shop product (its card, photos, price per night, the product entry and the
// warehouse), and the hotel adds only what the shop does not have: the floors (or sections) and the
// rooms in them. Both live in the project's `hotelAdmin` field:
//   hotelAdmin: { shop: ShopAdminData, floors, rooms, capacity }
// The rooms are kept in step with the page's room stay schedule (hotelUnits.ts), so the booking that
// exists already (StayBookingWidget, /api/booking) books them.
import { createContext, useContext } from 'react';
import { ShopAdminData, ShopCatalog, createEmptyShopAdmin, normalizeShopAdmin } from '../shop/shopTypes';

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
}

export const MAX_ROOMS = 300;
export const MAX_FLOORS = 40;

export const createEmptyHotelAdmin = (): HotelAdminData => ({ shop: createEmptyShopAdmin(), floors: [], rooms: [], capacity: {} });

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
  return { shop: normalizeShopAdmin(raw?.shop || {}), floors, rooms, capacity };
};

export const newHotelId = () => `h${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// A new hotel's catalogs for the room types, so the product entry has them ready.
export const HOTEL_TYPE_NAMES = ['غرفة مفردة', 'غرفة مزدوجة', 'غرفة ثلاثية', 'جناح', 'شقة عائلية'];
export const hotelCatalogs = (): ShopCatalog[] => {
  const now = new Date().toISOString();
  return [
    { id: 'hotel-cat-1', name: 'أنواع الغرف', parentId: null, images: [], createdAt: now },
    ...HOTEL_TYPE_NAMES.map((n, i) => ({ id: `hotel-cat-1-${i + 1}`, name: n, parentId: 'hotel-cat-1', images: [], createdAt: now })),
  ];
};

// The room types as the hotel's pages show them: a room is rented by the night, not sold from a stock.
export const hotelShopView = (shop: ShopAdminData): ShopAdminData => ({ ...shop, products: shop.products.map((p) => (p.inWarehouse === false ? p : { ...p, inWarehouse: false })) });

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
      return { id: r.id, name: `غرفة ${r.number} · ${t.name}${where ? ` · ${where}` : ''}`.slice(0, 60), capacity: typeCapacity(d, t.id), price: priceText(t).slice(0, 40), photo: t.images[0] || '' };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
};

// Set inside a hotel project and on its published page (null elsewhere): the room cards ask for a stay
// instead of the cart, and know how many guests a room type takes.
export interface HotelMode { capacity: Record<string, number> }
export const HotelModeContext = createContext<HotelMode | null>(null);
export const useHotelMode = () => useContext(HotelModeContext);

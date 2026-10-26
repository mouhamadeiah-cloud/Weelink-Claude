// A rental's booking cart (Eyad, 26 Oct): the visitor adds several cars or items, then books them all at once on the
// same days or hours, all or nothing (api/booking.ts, rent.items). The cart keeps only the warehouse ids, per page, in
// the visitor's browser; the price and the free times are worked out when the cart is booked.
import React, { useContext, useSyncExternalStore } from 'react';
import { ShoppingCart } from 'lucide-react';
import { BookingPageContext } from '../../services/bookings';
import { RentalBookingView, useRentalUnits } from './RentalBookingForm';

const CHANGE = 'weelink-rental-cart-change';
export const RENTAL_CART_OPEN = 'weelink-rental-cart-open';
const OPEN = RENTAL_CART_OPEN;
const MAX_ITEMS = 8;

const read = (key: string): string[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string').slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
};
const write = (key: string, ids: string[]) => {
  try { localStorage.setItem(key, JSON.stringify(ids)); } catch { /* private mode: the cart lasts this page view only */ }
  window.dispatchEvent(new Event(CHANGE));
};

const subscribe = (cb: () => void) => {
  window.addEventListener(CHANGE, cb);
  window.addEventListener('storage', cb);
  return () => { window.removeEventListener(CHANGE, cb); window.removeEventListener('storage', cb); };
};

/** The cart of the page being viewed (in the editor, a preview cart of its own). */
export const useRentalCart = () => {
  const page = useContext(BookingPageContext);
  const key = `weelink_rental_cart_${page ? `${page.owner}_${page.project}` : 'preview'}`;
  const snapshot = useSyncExternalStore(subscribe, () => localStorage.getItem(key) || '[]', () => '[]');
  const ids = read(key);
  void snapshot;
  return {
    ids,
    has: (id: string) => ids.includes(id),
    add: (id: string) => { if (!ids.includes(id) && ids.length < MAX_ITEMS) write(key, [...ids, id]); },
    remove: (id: string) => write(key, ids.filter((x) => x !== id)),
    clear: () => write(key, []),
    full: ids.length >= MAX_ITEMS,
  };
};

export const openRentalCart = () => window.dispatchEvent(new Event(OPEN));

/** «أضف للسلة» on a car or item: in the cart it says so and opens the cart page (`onClose` closes the card first). */
export const RentalCartAdd: React.FC<{ itemId: string; accent: string; className?: string; onClose?: () => void }> = ({ itemId, accent, className = '', onClose }) => {
  const cart = useRentalCart();
  const inCart = cart.has(itemId);
  return (
    <button
      type="button"
      onClick={() => { if (!inCart) return cart.add(itemId); onClose?.(); openRentalCart(); }}
      disabled={!inCart && cart.full}
      className={`h-12 rounded-full border-2 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 ${className}`}
      style={{ borderColor: accent, color: accent }}
    >
      <ShoppingCart size={18} /> {inCart ? 'في السلة ✓ افتح السلة' : 'أضف للسلة'}
    </button>
  );
};

/**
 * The rental's cart page (the 'cart' element in a rental, like the shop's cart page): what the visitor added, each with
 * a remove chip, and below it the one booking form for all of it (days or hours, a driver and extras per item, one deposit).
 */
export const RentalCartPage: React.FC<{ accent: string; isPreviewActive: boolean }> = ({ accent, isPreviewActive }) => {
  const cart = useRentalCart();
  const found = useRentalUnits(cart.ids);
  const count = found ? found.units.length : 0;
  return (
    <div
      dir="rtl"
      className="w-full h-full bg-white rounded-3xl border border-black/[0.06] flex flex-col overflow-hidden font-['IBM_Plex_Sans_Arabic',sans-serif]"
      style={{ pointerEvents: isPreviewActive ? 'auto' : 'none' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] shrink-0">
        <div className="flex items-center gap-2 text-[#2A1F1A] font-bold text-lg">
          <ShoppingCart size={20} style={{ color: accent }} />
          <span>سلة الحجز{count > 0 ? ` (${count})` : ''}</span>
        </div>
        {count > 0 && <button type="button" onClick={cart.clear} className="text-xs text-neutral-400 hover:text-red-500 cursor-pointer">إفراغ السلة</button>}
      </div>
      {count === 0 || !found ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6">
          <ShoppingCart size={44} className="text-neutral-200" />
          <span className="text-base font-semibold text-neutral-600">سلة الحجز فارغة</span>
          <span className="text-sm text-neutral-400">{isPreviewActive ? 'اضغط «أضف للسلة» على أي عنصر لتحجز عدة عناصر معاً.' : 'تظهر هنا العناصر التي يضيفها الزبون للسلة.'}</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <RentalBookingView
            key={found.units.map((u) => u.id).join('|')}
            found={{ schedule: found.schedule, unit: found.units[0], payments: found.payments }}
            more={found.units.slice(1)}
            accent={accent}
            onRemove={(unitId) => { const u = found.units.find((x) => x.id === unitId); if (u) cart.remove(u.item); }}
            onBooked={cart.clear}
          />
        </div>
      )}
    </div>
  );
};

// A rental's booking cart (Eyad, 26 Oct): the visitor adds several cars or items, then books them all at once on the
// same days or hours, all or nothing (api/booking.ts, rent.items). The cart keeps only the warehouse ids, per page, in
// the visitor's browser; the price and the free times are worked out when the cart is booked.
import React, { useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { ShoppingCart, X } from 'lucide-react';
import { BookingPageContext } from '../../services/bookings';
import { RentalBookingView, useRentalUnits } from './RentalBookingForm';

const CHANGE = 'weelink-rental-cart-change';
const OPEN = 'weelink-rental-cart-open';
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

/** «أضف للسلة» on a car or item: in the cart it says so and opens the cart. */
export const RentalCartAdd: React.FC<{ itemId: string; accent: string; className?: string }> = ({ itemId, accent, className = '' }) => {
  const cart = useRentalCart();
  const inCart = cart.has(itemId);
  return (
    <button
      type="button"
      onClick={() => (inCart ? openRentalCart() : cart.add(itemId))}
      disabled={!inCart && cart.full}
      className={`h-12 rounded-full border-2 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 ${className}`}
      style={{ borderColor: accent, color: accent }}
    >
      <ShoppingCart size={18} /> {inCart ? 'في السلة ✓ افتح السلة' : 'أضف للسلة'}
    </button>
  );
};

/** The cart's button (shown while it holds something) and the window that books it. */
export const RentalCartLauncher: React.FC<{ accent?: string }> = ({ accent = '#1d1d1f' }) => {
  const cart = useRentalCart();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener(OPEN, on);
    return () => window.removeEventListener(OPEN, on);
  }, []);
  const found = useRentalUnits(cart.ids);
  const count = found ? found.units.length : 0;
  // The booking window closes when the cart empties (every item removed or booked).
  useEffect(() => { if (open && count === 0) setOpen(false); }, [open, count]);
  if (count === 0) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-[900] h-12 px-4 rounded-full text-white text-sm font-bold shadow-xl flex items-center gap-2 cursor-pointer"
        style={{ backgroundColor: accent }}
      >
        <ShoppingCart size={18} /> سلة الحجز ({count})
      </button>
      {open && found && (
        <div role="dialog" aria-modal="true" dir="rtl" className="fixed inset-0 z-[1000] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-6" onMouseDown={() => setOpen(false)}>
          <div className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl p-3 sm:p-4" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black">سلة الحجز</h3>
              <button type="button" onClick={() => setOpen(false)} className="w-9 h-9 rounded-xl hover:bg-neutral-100 flex items-center justify-center cursor-pointer" aria-label="إغلاق"><X size={18} /></button>
            </div>
            <RentalBookingView
              key={found.units.map((u) => u.id).join('|')}
              found={{ schedule: found.schedule, unit: found.units[0], payments: found.payments }}
              more={found.units.slice(1)}
              accent={accent}
              onRemove={(unitId) => { const u = found.units.find((x) => x.id === unitId); if (u) cart.remove(u.item); }}
              onBooked={cart.clear}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

// «قارن» in the rental cart (Eyad, 26 Oct: add to the cart to compare later): the cars and items of the cart side by side, with
// what the visitor decides by: the price, the way it is rented, the people it takes, what it is (the car's facts or the item's
// description), its services and what it costs for the dates already set. «احجز هذا فقط» leaves the one chosen in the booking.
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { GitCompareArrows, Trash2, X } from 'lucide-react';
import { useCarData } from '../cars/store/CarDataContext';
import { useShopData } from '../shop/store/ShopDataContext';
import { extraPriceFor, extrasFor, type Quote, type RentBy, type RentalExtra, type RentalUnit } from '../../services/rentalBooking';
import type { StayRoom } from '../../services/stayBooking';
import { lookVars } from '../shop/store/checkoutStore';
import type { PartProps } from '../shop/store/CheckoutView';
import type { RentLine } from './rentalCart';

export interface CompareRow {
  line: RentLine;
  unit: StayRoom & RentalUnit;
  mode: RentBy;
  q: Quote | null;
  total: number;
}

const WAY: Record<RentBy, string> = { day: 'باليوم', hour: 'بالساعة', period: 'بالفترة' };
const money = (n: number, cur: string) => `${Math.round(n * 100) / 100}${cur ? ` ${cur}` : ''}`;
const plain = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const cut = (s: string, n = 140) => (s.length > n ? `${s.slice(0, n)}…` : s);

/** The price of the way a unit is rented by, as the cart shows it. */
export const priceText = (u: RentalUnit, mode: RentBy) =>
  (mode === 'day' && u.dayPrice > 0 ? `${money(u.dayPrice, u.currency)} لليوم` : mode === 'hour' && u.hourPrice > 0 ? `${money(u.hourPrice, u.currency)} للساعة` : mode === 'period' ? u.periods.map((p) => `${p.name}: ${money(p.price, u.currency)}`).join(' · ') : '') + (u.perPerson ? ' للشخص' : '');

type Item = {
  id: string; name: string; photo: string; price: string; ways: string; guests: string; facts: string[]; services: string[]; copies: number;
  total: number | null; currency: string; on: boolean;
};

export const RentalCompare: React.FC<{
  rows: CompareRow[];
  extras: RentalExtra[];
  look: PartProps['look'];
  only: (id: string) => void; // books this one only
  remove: (id: string) => void;
}> = ({ rows, extras, look, only, remove }) => {
  const [open, setOpen] = useState(false);
  const cars = useCarData();
  const shop = useShopData();
  if (rows.length < 2) return null;

  const items: Item[] = rows.map(({ line, unit, mode, q, total }) => {
    const car = cars?.cars.find((c) => c.id === line.id);
    const product = shop?.products.find((p) => p.id === line.id);
    const facts = car
      ? [car.year ? `الموديل ${car.year}` : '', car.fuel, car.transmission, car.seats ? `${car.seats} مقاعد` : '', car.engineCc ? `${car.engineCc} سي سي` : '', car.color].filter(Boolean)
      : product ? [cut(product.shortDescription || plain(product.description))].filter(Boolean) : [];
    const ways = [unit.byDay ? WAY.day : '', unit.byHour ? WAY.hour : '', unit.periods.length ? WAY.period : ''].filter(Boolean).join(' · ');
    return {
      id: line.id, name: unit.name, photo: car?.images[0] || product?.images[0] || unit.photo, price: priceText(unit, mode) || '—', ways,
      guests: unit.maxGuests > 0 ? `حتى ${unit.maxGuests} أشخاص` : '', facts,
      services: extrasFor(extras, unit.id).map((x) => `${x.name} ${money(extraPriceFor(x, unit.id), unit.currency)}`),
      copies: unit.copies, total: q ? total : null, currency: unit.currency, on: line.on,
    };
  });
  const cheapest = Math.min(...items.filter((i) => i.total !== null).map((i) => i.total as number));
  const cell = 'px-3 py-2 text-xs align-top border-t border-(--line)';

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-bold text-(--accent) cursor-pointer">
        <GitCompareArrows size={15} /> قارن العناصر ({rows.length})
      </button>
      {open && createPortal(
        <div dir="rtl" role="dialog" aria-modal="true" className="fixed inset-0 z-[2000000] bg-black/40 flex items-center justify-center p-3" style={{ ...lookVars(look), '--accent': look.accent } as React.CSSProperties} onMouseDown={() => setOpen(false)}>
          <div className="bg-white text-(--ink) rounded-2xl shadow-2xl w-full max-w-5xl max-h-full overflow-auto" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-(--line) sticky top-0 bg-white">
              <div className="font-bold">مقارنة العناصر</div>
              <button type="button" aria-label="إغلاق" onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center cursor-pointer"><X size={16} /></button>
            </div>
            <table className="w-full table-fixed border-collapse">
              <tbody>
                <tr>
                  {items.map((i) => (
                    <td key={i.id} className="px-3 py-3 align-top">
                      {i.photo ? <img src={i.photo} alt="" referrerPolicy="no-referrer" className="w-full h-28 object-cover rounded-xl bg-neutral-100" /> : <div className="w-full h-28 rounded-xl bg-neutral-100" />}
                      <div className="font-bold text-sm mt-2">{i.name}</div>
                    </td>
                  ))}
                </tr>
                <tr>{items.map((i) => <td key={i.id} className={`${cell} font-bold`}>{i.price}</td>)}</tr>
                <tr>{items.map((i) => <td key={i.id} className={`${cell} text-(--muted)`}>{i.ways}{i.copies > 1 ? ` · ${i.copies} نسخ` : ''}</td>)}</tr>
                <tr>{items.map((i) => <td key={i.id} className={cell}>{i.guests || '—'}</td>)}</tr>
                <tr>{items.map((i) => <td key={i.id} className={`${cell} text-(--muted)`}>{i.facts.length ? i.facts.map((f, k) => <div key={k}>{f}</div>) : '—'}</td>)}</tr>
                <tr>{items.map((i) => <td key={i.id} className={`${cell} text-(--muted)`}>{i.services.length ? i.services.map((s, k) => <div key={k}>{s}</div>) : 'بلا خدمات إضافية'}</td>)}</tr>
                <tr>
                  {items.map((i) => (
                    <td key={i.id} className={`${cell} font-bold ${i.total !== null && i.total === cheapest ? 'text-emerald-700' : ''}`}>
                      {i.total !== null ? `${money(i.total, i.currency)}${i.total === cheapest ? ' · الأوفر' : ''}` : <span className="font-normal text-(--muted)">اختر التواريخ لتعرف السعر</span>}
                    </td>
                  ))}
                </tr>
                <tr>
                  {items.map((i) => (
                    <td key={i.id} className={`${cell} space-y-1.5`}>
                      <button type="button" onClick={() => { only(i.id); setOpen(false); }} className="w-full h-9 rounded-full text-white text-xs font-bold cursor-pointer" style={{ background: look.accent }}>احجز هذا فقط</button>
                      <button type="button" onClick={() => remove(i.id)} className="w-full h-8 rounded-full border border-(--line) text-xs text-(--muted) flex items-center justify-center gap-1 cursor-pointer"><Trash2 size={12} /> إزالة من السلة</button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <div className="px-4 py-2 text-[11px] text-(--muted) border-t border-(--line)">السعر الأخير حسب التواريخ والأشخاص والخدمات المحدّدة في السلة.</div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

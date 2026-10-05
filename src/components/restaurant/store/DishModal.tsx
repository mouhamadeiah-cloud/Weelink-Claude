// The dish window that floats over the menu when a guest opens a dish: its photo, description and
// price, the ingredients of its linked sub-catalogs (picked, the guest may take any out), the paid
// extras (the guest may add any), a note, the quantity and «أضف إلى الطلب».
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus, Plus, Check, ImageOff } from 'lucide-react';
import { Dish, DISH_BADGES, RestaurantAdminData, dishSubCatalogs } from '../restaurantTypes';
import { addMenuLine } from '../menuCartStore';
import { formatMoney } from '../../shop/adminUi';

export interface MenuLook {
  accent: string;
  cardBg: string;
  text: string;
  radius: number;
  font: string;
}

interface DishModalProps {
  dish: Dish;
  data: RestaurantAdminData;
  look: MenuLook;
  onClose: () => void;
  onAdded: (name: string) => void;
}

export const DishModal: React.FC<DishModalProps> = ({ dish, data, look, onClose, onAdded }) => {
  const groups = useMemo(() => dishSubCatalogs(dish, data.subCatalogs), [dish, data.subCatalogs]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [extras, setExtras] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [qty, setQty] = useState(1);
  const currency = data.settings.currency;
  const canOrder = dish.available && data.settings.acceptOrders;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const allItems = groups.flatMap((g) => g.items.map((i) => ({ ...i, type: g.type })));
  const pickedExtras = allItems.filter((i) => i.type === 'extras' && extras.includes(i.id));
  const unitPrice = dish.price + pickedExtras.reduce((s, e) => s + e.price, 0);
  const badge = DISH_BADGES.find((b) => b.id === dish.badge && b.id);
  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const add = () => {
    addMenuLine({
      dishId: dish.id,
      name: dish.name,
      image: dish.image,
      unitPrice,
      qty,
      removed: allItems.filter((i) => i.type === 'ingredients' && removed.includes(i.id)).map((i) => i.name),
      extras: pickedExtras.map((e) => ({ name: e.name, price: e.price })),
      notes: notes.trim(),
    });
    onAdded(dish.name);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[2000000] bg-black/55 flex items-end sm:items-center justify-center sm:p-6" onMouseDown={onClose}>
      <div
        dir="rtl"
        className="w-full sm:max-w-lg max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl text-right"
        style={{ fontFamily: look.font, color: '#1d1d1f' }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={dish.name}
      >
        <div className="relative h-56 shrink-0 bg-neutral-100">
          {dish.image ? (
            <img src={dish.image} alt={dish.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300"><ImageOff size={44} /></div>
          )}
          <button type="button" onClick={onClose} aria-label="إغلاق" className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/95 shadow flex items-center justify-center cursor-pointer">
            <X size={20} />
          </button>
          {badge && <span className="absolute top-3 right-3 px-3 h-7 rounded-full text-white text-xs font-bold flex items-center" style={{ backgroundColor: badge.color }}>{badge.label}</span>}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-black leading-snug">{dish.name}</h3>
              <div className="text-left shrink-0">
                <div className="text-lg font-black" style={{ color: look.accent }}>{formatMoney(dish.price, currency)}</div>
                {dish.oldPrice > dish.price && <div className="text-xs text-neutral-400 line-through">{formatMoney(dish.oldPrice, currency)}</div>}
              </div>
            </div>
            {dish.description && <p className="text-sm text-neutral-500 leading-relaxed">{dish.description}</p>}
          </div>

          {groups.map((g) => (
            <section key={g.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black">{g.name}</h4>
                <span className="text-[11px] text-neutral-400 font-bold">{g.type === 'ingredients' ? 'أزل ما لا تريده' : 'اختياري'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {g.items.map((i) => {
                  const on = g.type === 'ingredients' ? !removed.includes(i.id) : extras.includes(i.id);
                  return (
                    <button
                      key={i.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => (g.type === 'ingredients' ? toggle(removed, setRemoved, i.id) : toggle(extras, setExtras, i.id))}
                      className={`h-9 px-3 rounded-full border text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${on ? 'text-white border-transparent' : 'bg-white border-neutral-200 text-neutral-600'} ${g.type === 'ingredients' && !on ? 'line-through' : ''}`}
                      style={on ? { backgroundColor: look.accent } : undefined}
                    >
                      {on && <Check size={14} />}
                      {i.name}
                      {g.type === 'extras' && i.price > 0 && <span className={on ? 'text-white/85' : 'text-neutral-400'}>+{formatMoney(i.price, currency)}</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          <section className="space-y-2">
            <h4 className="text-sm font-black">ملاحظة للمطبخ</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={200}
              placeholder="مثلاً: بدون ملح، استواء جيد..."
              className="w-full min-h-[70px] p-3 rounded-2xl border border-neutral-200 text-sm outline-none focus:border-neutral-400 resize-none"
            />
          </section>
        </div>

        <footer className="shrink-0 border-t border-neutral-100 p-4 flex items-center gap-3">
          {canOrder ? (
            <>
              <div className="flex items-center gap-1 rounded-full border border-neutral-200 p-1">
                <button type="button" aria-label="زيادة" onClick={() => setQty((q) => Math.min(50, q + 1))} className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center cursor-pointer"><Plus size={16} /></button>
                <span className="w-7 text-center font-black">{qty}</span>
                <button type="button" aria-label="إنقاص" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center cursor-pointer"><Minus size={16} /></button>
              </div>
              <button type="button" onClick={add} className="flex-1 h-12 rounded-full text-white font-black flex items-center justify-between px-5 cursor-pointer active:scale-[0.98] transition" style={{ backgroundColor: look.accent }}>
                <span>أضف إلى الطلب</span>
                <span>{formatMoney(unitPrice * qty, currency)}</span>
              </button>
            </>
          ) : (
            <div className="flex-1 h-12 rounded-full bg-neutral-100 text-neutral-500 font-bold flex items-center justify-center">
              {dish.available ? 'الطلب أونلاين متوقف الآن' : 'نفد اليوم'}
            </div>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
};

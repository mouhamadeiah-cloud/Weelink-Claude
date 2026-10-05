// The cashier's dish window: take out ingredients, add paid extras, a note for the kitchen and the
// quantity, as the guest does on the website, but compact for a tablet.
import React, { useMemo, useState } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import { Dish, OrderLine, SubCatalog, dishSubCatalogs } from '../restaurantTypes';
import { formatMoney } from '../../shop/adminUi';
import { Modal, BigButton } from './posUi';

export const lineOfDish = (dish: Dish): OrderLine => ({ dishId: dish.id, name: dish.name, unitPrice: dish.price, qty: 1, removed: [], extras: [], notes: '' });

export const DishOptions: React.FC<{ dish: Dish; subCatalogs: SubCatalog[]; currency: string; onAdd: (line: OrderLine) => void; onClose: () => void }> = ({ dish, subCatalogs, currency, onAdd, onClose }) => {
  const groups = useMemo(() => dishSubCatalogs(dish, subCatalogs), [dish, subCatalogs]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [extras, setExtras] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [qty, setQty] = useState(1);
  const all = groups.flatMap((g) => g.items.map((i) => ({ ...i, type: g.type })));
  const picked = all.filter((i) => i.type === 'extras' && extras.includes(i.id));
  const unitPrice = dish.price + picked.reduce((s, e) => s + e.price, 0);
  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const add = () => {
    onAdd({
      dishId: dish.id,
      name: dish.name,
      unitPrice,
      qty,
      removed: all.filter((i) => i.type === 'ingredients' && removed.includes(i.id)).map((i) => i.name),
      extras: picked.map((e) => ({ name: e.name, price: e.price })),
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <Modal
      title={dish.name}
      onClose={onClose}
      footer={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-2xl bg-neutral-100 p-1">
            <button type="button" aria-label="زيادة" onClick={() => setQty((q) => Math.min(50, q + 1))} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center cursor-pointer"><Plus size={16} /></button>
            <span className="w-8 text-center font-black text-lg">{qty}</span>
            <button type="button" aria-label="إنقاص" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center cursor-pointer"><Minus size={16} /></button>
          </div>
          <BigButton tone="dark" className="flex-1 justify-between" onClick={add}><span>أضف</span><span>{formatMoney(unitPrice * qty, currency)}</span></BigButton>
        </div>
      }
    >
      {groups.map((g) => (
        <section key={g.id} className="space-y-2">
          <div className="flex items-center justify-between text-sm font-black">
            {g.name}
            <span className="text-[11px] font-bold text-neutral-400">{g.type === 'ingredients' ? 'اضغط لإزالة' : 'إضافات'}</span>
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
                  className={`h-11 px-4 rounded-2xl border text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer ${on ? 'bg-[#1d1d1f] border-[#1d1d1f] text-white' : 'bg-white border-neutral-200 text-neutral-500'} ${g.type === 'ingredients' && !on ? 'line-through' : ''}`}
                >
                  {on && <Check size={14} />}
                  {i.name}
                  {g.type === 'extras' && i.price > 0 && <span className="opacity-70">+{formatMoney(i.price, currency)}</span>}
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <section className="space-y-2">
        <div className="text-sm font-black">ملاحظة للمطبخ</div>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} placeholder="مثلاً: بدون ملح" className="w-full h-12 px-3 rounded-2xl border border-neutral-200 text-sm outline-none focus:border-neutral-400" />
      </section>
    </Modal>
  );
};

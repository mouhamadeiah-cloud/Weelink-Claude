// «إضافة للمعرض»: one tab to add to a rental's gallery. First what is added (a car, or a chalet, hall,
// machine or anything else), then the entry of that kind, and when it is saved the rental prices
// (by the day or the hour, special days and hours) of the new item come next.
import React, { useEffect, useRef, useState } from 'react';
import { Boxes, CarFront, CheckCircle2, Plus } from 'lucide-react';
import type { CarAdminData } from '../cars/carTypes';
import type { ShopAdminData } from '../shop/shopTypes';
import { CarEditor } from '../cars/tabs/CarEditor';
import { AddProductTab } from '../shop/tabs/AddProductTab';
import { PrimaryButton } from '../shop/adminUi';
import { RentalPricing } from './RentalPricing';
import type { RentalAdminData } from './rentalTypes';

type Kind = 'car' | 'item';

interface RentalAddTabProps {
  data: RentalAdminData;
  onCarsChange: (fn: (d: CarAdminData) => CarAdminData) => void;
  onShopChange: (fn: (d: ShopAdminData) => ShopAdminData) => void;
  editingId: string | null;
  onEditingChange: (id: string | null) => void;
}

export const RentalAddTab: React.FC<RentalAddTabProps> = ({ data, onCarsChange, onShopChange, editingId, onEditingChange }) => {
  const [kind, setKind] = useState<Kind>(editingId || data.cars.cars.length || !data.shop.products.length ? 'car' : 'item');
  // The id of what was just saved (empty while it is not known yet), and the ids known before the save.
  const [done, setDone] = useState<{ id: string } | null>(null);
  const [watch, setWatch] = useState<string[] | null>(null);
  const [round, setRound] = useState(0);
  const ids = kind === 'car' ? data.cars.cars.map((c) => c.id) : data.shop.products.map((p) => p.id);
  const idsRef = useRef(ids);
  idsRef.current = ids;

  // A new item shows up in the data a moment after the save: that is the one to price.
  useEffect(() => {
    if (!watch) return;
    const fresh = ids.find((id) => !watch.includes(id));
    if (fresh) {
      setDone({ id: fresh });
      setWatch(null);
      return;
    }
    const t = window.setTimeout(() => { setDone({ id: '' }); setWatch(null); }, 1500);
    return () => window.clearTimeout(t);
  }, [watch, ids.join('|')]);

  const saved = () => {
    if (kind === 'car' && editingId) {
      setDone({ id: editingId });
      return;
    }
    setWatch(idsRef.current);
  };
  const another = () => {
    setDone(null);
    onEditingChange(null);
    setRound((r) => r + 1);
  };

  if (done) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold">
          <CheckCircle2 size={15} /> تم الحفظ. حدّد الآن كيف بيتأجّر: باليوم أو بالساعة، الفترات، والأيام والساعات المميزة بسعر آخر.
        </div>
        {done.id ? <RentalPricing only={done.id} focusItem={done.id} /> : <RentalPricing />}
        <PrimaryButton onClick={another} className="h-11 flex items-center gap-1.5"><Plus size={15} /> إضافة عنصر آخر</PrimaryButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!editingId && (
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-neutral-500">شو بدك تضيف؟</div>
          <div className="flex gap-2 p-1 bg-neutral-100 rounded-2xl w-full sm:w-fit">
            {([
              { id: 'car', label: 'سيارة', icon: CarFront },
              { id: 'item', label: 'فيلا، صالة، معدة أو غيرها', icon: Boxes },
            ] as const).map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                className={`flex-1 sm:flex-none h-9 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${kind === k.id ? 'bg-white text-brand shadow-sm' : 'text-neutral-500'}`}
              >
                <k.icon size={14} />
                {k.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {kind === 'car' ? (
        <CarEditor key={`car-${round}-${editingId || 'new'}`} data={data.cars} update={onCarsChange} editingId={editingId} onEdit={onEditingChange} onSaved={saved} />
      ) : (
        <AddProductTab key={`item-${round}`} data={data.shop} update={onShopChange} onAdded={saved} />
      )}
    </div>
  );
};

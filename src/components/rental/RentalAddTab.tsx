// «إضافة للمعرض»: one tab to add to a rental's gallery. First what is added (a car, or a chalet, hall,
// machine or anything else), then the entry of that kind; its rental prices, periods and availability are in its price step.
import React, { useState } from 'react';
import { Boxes, CarFront, CheckCircle2, Plus } from 'lucide-react';
import type { CarAdminData } from '../cars/carTypes';
import type { ShopAdminData } from '../shop/shopTypes';
import { CarEditor } from '../cars/tabs/CarEditor';
import { AddProductTab } from '../shop/tabs/AddProductTab';
import { PrimaryButton } from '../shop/adminUi';
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
  const [done, setDone] = useState(false);
  const [round, setRound] = useState(0);
  const saved = () => setDone(true);
  const another = () => {
    setDone(false);
    onEditingChange(null);
    setRound((r) => r + 1);
  };

  if (done) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold">
          <CheckCircle2 size={15} /> تم الحفظ.
        </div>
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

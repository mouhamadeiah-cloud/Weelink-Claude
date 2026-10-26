// «المستودع» of a rental: its cars, its other items, and how each is rented, in one tab.
import React, { useState } from 'react';
import type { CarAdminData } from '../cars/carTypes';
import type { ShopAdminData } from '../shop/shopTypes';
import { InventoryTab } from '../cars/tabs/InventoryTab';
import { WarehouseTab } from '../shop/tabs/WarehouseTab';
import { RentalPricing } from './RentalPricing';
import { useEstateMode, type RentalAdminData } from './rentalTypes';

type Part = 'cars' | 'items' | 'prices';

interface RentalWarehouseTabProps {
  data: RentalAdminData;
  onCarsChange: (fn: (d: CarAdminData) => CarAdminData) => void;
  onShopChange: (fn: (d: ShopAdminData) => ShopAdminData) => void;
  onEditCar: (id: string | null) => void;
}

export const RentalWarehouseTab: React.FC<RentalWarehouseTabProps> = ({ data, onCarsChange, onShopChange, onEditCar }) => {
  const estate = useEstateMode();
  const [part, setPart] = useState<Part>(!estate && (data.cars.cars.length || !data.shop.products.length) ? 'cars' : 'items');
  const parts: { id: Part; label: string; count?: number }[] = [
    ...(estate ? [] : [{ id: 'cars' as const, label: 'السيارات', count: data.cars.cars.length }]),
    { id: 'items', label: estate ? 'الغرف والصالات والفلل' : 'العناصر والصالات', count: data.shop.products.length },
    { id: 'prices', label: 'أسعار التأجير' },
  ];
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-neutral-100 rounded-2xl w-full sm:w-fit overflow-x-auto">
        {parts.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPart(p.id)}
            className={`flex-1 sm:flex-none shrink-0 h-9 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${part === p.id ? 'bg-white text-brand shadow-sm' : 'text-neutral-500'}`}
          >
            {p.label}
            {!!p.count && <span className="text-neutral-400">{p.count}</span>}
          </button>
        ))}
      </div>
      {part === 'cars' && <InventoryTab data={data.cars} update={onCarsChange} editingId={null} onEdit={onEditCar} onSaved={() => undefined} />}
      {part === 'items' && <WarehouseTab data={data.shop} update={onShopChange} />}
      {part === 'prices' && <RentalPricing />}
    </div>
  );
};

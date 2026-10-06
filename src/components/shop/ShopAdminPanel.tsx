// Online Shop admin: a large floating gear (bottom-left) that opens a floating admin window.
import React, { useEffect, useState } from 'react';
import { Settings, X, FolderTree, PackagePlus, Warehouse, Users, ClipboardList, BarChart3, SlidersHorizontal } from 'lucide-react';
import { ShopAdminData } from './shopTypes';
import { CatalogsTab } from './tabs/CatalogsTab';
import { AddProductTab } from './tabs/AddProductTab';
import { WarehouseTab } from './tabs/WarehouseTab';
import { CustomersTab } from './tabs/CustomersTab';
import { OrdersTab } from './tabs/OrdersTab';
import { AccountsTab } from './tabs/AccountsTab';
import { SettingsTab } from './tabs/SettingsTab';
import { AdminTabProps } from './tabs/tabProps';

type TabId = 'catalogs' | 'add-product' | 'warehouse' | 'customers' | 'orders' | 'accounts' | 'settings';

const TABS: { id: TabId; label: string; icon: React.ElementType; Component: React.FC<AdminTabProps> }[] = [
  { id: 'add-product', label: 'إضافة منتج', icon: PackagePlus, Component: AddProductTab },
  { id: 'warehouse', label: 'المستودع', icon: Warehouse, Component: WarehouseTab },
  { id: 'catalogs', label: 'التصنيفات', icon: FolderTree, Component: CatalogsTab },
  { id: 'customers', label: 'الزبائن', icon: Users, Component: CustomersTab },
  { id: 'orders', label: 'الطلبات', icon: ClipboardList, Component: OrdersTab },
  { id: 'accounts', label: 'الحسابات', icon: BarChart3, Component: AccountsTab },
  { id: 'settings', label: 'الإعدادات', icon: SlidersHorizontal, Component: SettingsTab },
];

interface ShopAdminPanelProps {
  data: ShopAdminData;
  onChange: (fn: (d: ShopAdminData) => ShopAdminData) => void;
  // Asks the admin to open (counted); the editor's column has an "admin" button for this.
  openRequest?: number;
  // The floating gear is left out where the column's button opens the admin instead.
  hideGear?: boolean;
}

export const ShopAdminPanel: React.FC<ShopAdminPanelProps> = ({ data, onChange, openRequest = 0, hideGear = false }) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (openRequest > 0) setOpen(true);
  }, [openRequest]);
  const [tab, setTab] = useState<TabId>('add-product');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const newOrders = data.orders.filter((o) => o.status === 'new').length;
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <>
      {!hideGear && (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-[1000000] w-16 h-16 rounded-full bg-[#1d1d1f] text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition flex items-center justify-center cursor-pointer"
        title="إدارة المتجر"
        aria-label="إدارة المتجر"
      >
        <Settings size={30} strokeWidth={1.8} />
        {newOrders > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full bg-[#ff3b30] text-[11px] font-black flex items-center justify-center border-2 border-white">
            {newOrders}
          </span>
        )}
      </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[1000001] bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-6" onMouseDown={() => setOpen(false)}>
          <div
            dir="rtl"
            className="w-full max-w-6xl h-full max-h-[880px] bg-[#f5f5f7] rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden text-right font-sans"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="flex items-center gap-3 px-4 sm:px-6 h-16 bg-white border-b border-neutral-200 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[#1d1d1f] text-white flex items-center justify-center"><Settings size={18} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-[#1d1d1f] truncate">إدارة المتجر{data.settings.storeName ? ` · ${data.settings.storeName}` : ''}</div>
                <div className="text-[10px] text-neutral-400 font-bold">Weelink / Shops</div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="w-9 h-9 rounded-xl hover:bg-neutral-100 text-neutral-500 flex items-center justify-center cursor-pointer" aria-label="إغلاق">
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              <nav className="md:w-52 shrink-0 bg-white md:border-l border-b md:border-b-0 border-neutral-200 p-2 flex md:flex-col gap-1 overflow-x-auto">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`shrink-0 flex items-center gap-2.5 h-10 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                      tab === t.id ? 'bg-[#0071e3] text-white' : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    <t.icon size={16} />
                    <span>{t.label}</span>
                    {t.id === 'orders' && newOrders > 0 && (
                      <span className={`mr-auto min-w-[20px] h-5 px-1 rounded-full text-[10px] flex items-center justify-center ${tab === t.id ? 'bg-white text-[#0071e3]' : 'bg-[#ff3b30] text-white'}`}>{newOrders}</span>
                    )}
                  </button>
                ))}
              </nav>
              <main className="flex-1 min-w-0 overflow-y-auto p-3 sm:p-6">
                <h2 className="text-lg font-black text-[#1d1d1f] mb-4">{active.label}</h2>
                <active.Component data={data} update={onChange} />
              </main>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

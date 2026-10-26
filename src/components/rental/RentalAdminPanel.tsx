// Rental admin (Weelink / Rental): the same floating gear and window as the other admins, made of
// their tabs. Cars are added and kept with the showroom's car tabs, everything else (equipment,
// chalets, halls, other things) with the shop's product tabs; each tab gets its half of the rental's
// data. The common tabs (bookings, messages, ratings, team) are the same as everywhere.
import React, { useEffect, useState } from 'react';
import { Settings, X, PencilLine, CarFront, Warehouse, SlidersHorizontal, Users, Wallet, Inbox, CalendarDays, Star, MessageSquare, UserCog, CalendarCog, PackagePlus, Boxes, FolderTree, KeyRound } from 'lucide-react';
import type { CarAdminData } from '../cars/carTypes';
import type { ShopAdminData } from '../shop/shopTypes';
import { RentalModeContext, rentalItemCount, type RentalAdminData } from './rentalTypes';
import { CarEditor, CarTabProps } from '../cars/tabs/CarEditor';
import { InventoryTab } from '../cars/tabs/InventoryTab';
import { CarSettingsTab } from '../cars/tabs/CarSettingsTab';
import { CarCustomersTab } from '../cars/tabs/CarCustomersTab';
import { CarAccountsTab } from '../cars/tabs/CarAccountsTab';
import { CarRequestsTab } from '../cars/tabs/CarRequestsTab';
import { AddProductTab } from '../shop/tabs/AddProductTab';
import { WarehouseTab } from '../shop/tabs/WarehouseTab';
import { CatalogsTab } from '../shop/tabs/CatalogsTab';
import type { AdminTabProps } from '../shop/tabs/tabProps';
import { BookingsTab } from '../pageAdmin/BookingsTab';
import { InquiriesTab } from '../pageAdmin/InquiriesTab';
import { PageCustomersTab } from '../pageAdmin/PageCustomersTab';
import { RatingsTab } from '../pageAdmin/RatingsTab';
import { TeamTab } from '../pageAdmin/TeamTab';
import { BookingSettingsTab } from '../pageAdmin/BookingSettingsSection';
import { useRentalUnitsSync } from './rentalUnits';

type TabId = 'add-car' | 'cars' | 'add-item' | 'items' | 'catalogs' | 'requests' | 'bookings' | 'booking-settings' | 'signups' | 'inquiries' | 'ratings' | 'customers' | 'team' | 'accounts' | 'settings';

// Which half of the data a tab works on.
type Tab =
  | { id: TabId; label: string; icon: React.ElementType; part: 'cars'; Component: React.FC<CarTabProps> }
  | { id: TabId; label: string; icon: React.ElementType; part: 'shop'; Component: React.FC<AdminTabProps> }
  | { id: TabId; label: string; icon: React.ElementType; part: 'none'; Component: React.FC };

const TABS: Tab[] = [
  { id: 'add-car', label: 'إضافة سيارة', icon: CarFront, part: 'cars', Component: CarEditor },
  { id: 'cars', label: 'السيارات', icon: Warehouse, part: 'cars', Component: InventoryTab },
  { id: 'add-item', label: 'إضافة عنصر', icon: PackagePlus, part: 'shop', Component: AddProductTab },
  { id: 'items', label: 'العناصر والصالات', icon: Boxes, part: 'shop', Component: WarehouseTab },
  { id: 'catalogs', label: 'التصنيفات', icon: FolderTree, part: 'shop', Component: CatalogsTab },
  { id: 'requests', label: 'طلبات الإيجار', icon: Inbox, part: 'cars', Component: CarRequestsTab },
  { id: 'bookings', label: 'المواعيد', icon: CalendarDays, part: 'none', Component: BookingsTab as React.FC },
  { id: 'booking-settings', label: 'إعدادات الحجز', icon: CalendarCog, part: 'none', Component: BookingSettingsTab as React.FC },
  { id: 'signups', label: 'مشتركو الصفحة', icon: Users, part: 'none', Component: PageCustomersTab as React.FC },
  { id: 'inquiries', label: 'الرسائل', icon: MessageSquare, part: 'none', Component: InquiriesTab as React.FC },
  { id: 'ratings', label: 'التقييمات', icon: Star, part: 'none', Component: RatingsTab as React.FC },
  { id: 'customers', label: 'الزبائن', icon: Users, part: 'cars', Component: CarCustomersTab },
  { id: 'team', label: 'فريق العمل', icon: UserCog, part: 'none', Component: TeamTab as React.FC },
  { id: 'accounts', label: 'الحسابات', icon: Wallet, part: 'cars', Component: CarAccountsTab },
  { id: 'settings', label: 'الإعدادات', icon: SlidersHorizontal, part: 'cars', Component: CarSettingsTab },
];

interface RentalAdminPanelProps {
  data: RentalAdminData;
  onCarsChange: (fn: (d: CarAdminData) => CarAdminData) => void;
  onShopChange: (fn: (d: ShopAdminData) => ShopAdminData) => void;
  // The package's limit of cars and items together (Infinity = none), for the count beside the tabs.
  maxItems?: number;
  openRequest?: number;
  hideGear?: boolean;
  onEditPage?: () => void;
  tabRequest?: { tab: string; n: number } | null;
}

export const RentalAdminPanel: React.FC<RentalAdminPanelProps> = ({ data, onCarsChange, onShopChange, maxItems = Infinity, openRequest = 0, hideGear = false, onEditPage, tabRequest }) => {
  const [open, setOpen] = useState(false);
  // The warehouse's cars and items are the units the page books (rentalUnits.ts).
  useRentalUnitsSync(data);
  useEffect(() => {
    if (openRequest > 0) setOpen(true);
  }, [openRequest]);
  const [tab, setTab] = useState<TabId>(data.cars.cars.length || !data.shop.products.length ? 'cars' : 'items');
  useEffect(() => {
    if (!tabRequest?.n || !TABS.some((t) => t.id === tabRequest.tab)) return;
    setTab(tabRequest.tab as TabId);
    setOpen(true);
  }, [tabRequest?.n]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const newRequests = data.cars.requests.filter((r) => r.status === 'new').length;
  const total = data.cars.cars.length + rentalItemCount(data.shop.products);
  const active = TABS.find((t) => t.id === tab)!;
  const editing = tab === 'add-car' && editingId ? data.cars.cars.find((c) => c.id === editingId) : undefined;
  const name = data.cars.settings.showroomName;

  const body = () => {
    if (active.part === 'cars') {
      const C = active.Component;
      return (
        <C
          data={data.cars}
          update={onCarsChange}
          editingId={editingId}
          onEdit={(id) => { setEditingId(id || null); setTab('add-car'); }}
          onSaved={() => setTab('cars')}
        />
      );
    }
    if (active.part === 'shop') {
      const C = active.Component;
      return <C data={data.shop} update={onShopChange} />;
    }
    const C = active.Component;
    return <C />;
  };

  return (
    <>
      {!hideGear && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 left-6 z-[1000000] w-16 h-16 rounded-full bg-ink text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition flex items-center justify-center cursor-pointer"
          title="إدارة التأجير"
          aria-label="إدارة التأجير"
        >
          <Settings size={30} strokeWidth={1.8} />
        </button>
      )}

      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000001] bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-6" onMouseDown={() => setOpen(false)}>
          <div
            dir="rtl"
            className="w-full max-w-6xl h-full max-h-[880px] bg-bg rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden text-right font-sans"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="flex items-center gap-3 px-4 sm:px-6 h-16 bg-white border-b border-neutral-200 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-ink text-white flex items-center justify-center"><KeyRound size={18} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-ink truncate">إدارة التأجير{name ? ` · ${name}` : ''}</div>
                <div className="text-xs text-neutral-400 font-bold">
                  Weelink / Rental · {Number.isFinite(maxItems) ? `${total} من ${maxItems} سيارة وعنصر` : `${total} سيارة وعنصر`}
                </div>
              </div>
              {onEditPage && (
                <button type="button" onClick={() => { setOpen(false); onEditPage(); }} className="h-9 px-3 rounded-xl bg-ink text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                  <PencilLine size={14} /> تعديل الصفحة
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} className="w-9 h-9 rounded-xl hover:bg-neutral-100 text-neutral-500 flex items-center justify-center cursor-pointer" aria-label="إغلاق">
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              <nav className="md:w-52 shrink-0 bg-white md:border-l border-b md:border-b-0 border-neutral-200 p-2 flex md:flex-col gap-1 overflow-x-auto">
                {TABS.map((t) => {
                  const count = t.id === 'cars' ? data.cars.cars.length : t.id === 'items' ? data.shop.products.length : 0;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { setTab(t.id); if (t.id === 'add-car') setEditingId(null); }}
                      className={`shrink-0 flex items-center gap-2.5 h-10 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${tab === t.id ? 'bg-brand text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
                    >
                      <t.icon size={16} />
                      <span>{t.label}</span>
                      {t.id === 'requests' && newRequests > 0 && (
                        <span className="mr-auto min-w-[20px] h-5 px-1 rounded-full text-xs flex items-center justify-center bg-[#ff3b30] text-white">{newRequests}</span>
                      )}
                      {count > 0 && (
                        <span className={`mr-auto min-w-[20px] h-5 px-1 rounded-full text-xs flex items-center justify-center ${tab === t.id ? 'bg-white text-brand' : 'bg-neutral-100 text-neutral-500'}`}>{count}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
              <main className="flex-1 min-w-0 overflow-y-auto p-3 sm:p-6">
                <h2 className="text-lg font-black text-ink mb-4">{editing ? 'تعديل سيارة' : active.label}</h2>
                <RentalModeContext.Provider value>{body()}</RentalModeContext.Provider>
              </main>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

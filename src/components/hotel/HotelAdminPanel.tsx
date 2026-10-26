// Hotel admin (Weelink / Hotel): the same floating gear and window as the other admins, made of
// their tabs. The room types are added and kept with the shop's product tabs, the floors and rooms
// have their own tab (HotelRoomsTab), and the common tabs (bookings, messages, ratings, team) are the
// same as everywhere. The rooms are kept in step with the booking's stay schedule (hotelUnits.ts).
import React, { useEffect, useState } from 'react';
import { Settings, X, PencilLine, BedDouble, Building2, PackagePlus, Boxes, SlidersHorizontal, Users, CalendarDays, Star, MessageSquare, UserCog, CalendarCog, LayoutGrid } from 'lucide-react';
import type { ShopAdminData } from '../shop/shopTypes';
import { HotelModeContext, type HotelAdminData } from './hotelTypes';
import { HotelRoomsTab } from './HotelRoomsTab';
import { HotelGridTab } from './HotelGridTab';
import { useHotelRoomsSync } from './hotelUnits';
import { AddProductTab } from '../shop/tabs/AddProductTab';
import { WarehouseTab } from '../shop/tabs/WarehouseTab';
import { SettingsTab } from '../shop/tabs/SettingsTab';
import type { AdminTabProps } from '../shop/tabs/tabProps';
import { BookingsTab } from '../pageAdmin/BookingsTab';
import { InquiriesTab } from '../pageAdmin/InquiriesTab';
import { PageCustomersTab } from '../pageAdmin/PageCustomersTab';
import { RatingsTab } from '../pageAdmin/RatingsTab';
import { TeamTab } from '../pageAdmin/TeamTab';
import { BookingSettingsTab } from '../pageAdmin/BookingSettingsSection';

type TabId = 'add-type' | 'types' | 'rooms' | 'grid' | 'bookings' | 'booking-settings' | 'signups' | 'inquiries' | 'ratings' | 'team' | 'settings';

type Tab =
  | { id: TabId; label: string; icon: React.ElementType; part: 'shop'; Component: React.FC<AdminTabProps> }
  | { id: TabId; label: string; icon: React.ElementType; part: 'hotel'; Component: React.FC<{ data: HotelAdminData; update: (fn: (d: HotelAdminData) => HotelAdminData) => void }> }
  | { id: TabId; label: string; icon: React.ElementType; part: 'grid'; Component: React.FC<{ data: HotelAdminData }> }
  | { id: TabId; label: string; icon: React.ElementType; part: 'none'; Component: React.FC };

const TABS: Tab[] = [
  { id: 'add-type', label: 'إضافة نوع غرفة', icon: PackagePlus, part: 'shop', Component: AddProductTab },
  { id: 'types', label: 'أنواع الغرف', icon: BedDouble, part: 'shop', Component: WarehouseTab },
  { id: 'rooms', label: 'الطوابق والغرف', icon: Building2, part: 'hotel', Component: HotelRoomsTab },
  { id: 'grid', label: 'جدول الغرف', icon: LayoutGrid, part: 'grid', Component: HotelGridTab },
  { id: 'bookings', label: 'المواعيد', icon: CalendarDays, part: 'none', Component: BookingsTab as React.FC },
  { id: 'booking-settings', label: 'إعدادات الحجز', icon: CalendarCog, part: 'none', Component: BookingSettingsTab as React.FC },
  { id: 'signups', label: 'مشتركو الصفحة', icon: Users, part: 'none', Component: PageCustomersTab as React.FC },
  { id: 'inquiries', label: 'الرسائل', icon: MessageSquare, part: 'none', Component: InquiriesTab as React.FC },
  { id: 'ratings', label: 'التقييمات', icon: Star, part: 'none', Component: RatingsTab as React.FC },
  { id: 'team', label: 'فريق العمل', icon: UserCog, part: 'none', Component: TeamTab as React.FC },
  { id: 'settings', label: 'الإعدادات', icon: SlidersHorizontal, part: 'shop', Component: SettingsTab },
];

interface HotelAdminPanelProps {
  data: HotelAdminData;
  onShopChange: (fn: (d: ShopAdminData) => ShopAdminData) => void;
  onHotelChange: (fn: (d: HotelAdminData) => HotelAdminData) => void;
  // The package's limit of rooms (Infinity = none), for the count beside the tabs.
  maxItems?: number;
  openRequest?: number;
  hideGear?: boolean;
  onEditPage?: () => void;
  tabRequest?: { tab: string; n: number } | null;
}

export const HotelAdminPanel: React.FC<HotelAdminPanelProps> = ({ data, onShopChange, onHotelChange, maxItems = Infinity, openRequest = 0, hideGear = false, onEditPage, tabRequest }) => {
  const [open, setOpen] = useState(false);
  // The rooms are the rooms the page books (hotelUnits.ts).
  useHotelRoomsSync(data);
  useEffect(() => {
    if (openRequest > 0) setOpen(true);
  }, [openRequest]);
  const [tab, setTab] = useState<TabId>(data.shop.products.length ? 'rooms' : 'add-type');
  useEffect(() => {
    if (!tabRequest?.n || !TABS.some((t) => t.id === tabRequest.tab)) return;
    setTab(tabRequest.tab as TabId);
    setOpen(true);
  }, [tabRequest?.n]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const active = TABS.find((t) => t.id === tab)!;
  const name = data.shop.settings.storeName;

  const body = () => {
    if (active.part === 'shop') {
      const C = active.Component;
      return <C data={data.shop} update={onShopChange} />;
    }
    if (active.part === 'grid') {
      const C = active.Component;
      return <C data={data} />;
    }
    if (active.part === 'hotel') {
      const C = active.Component;
      return <C data={data} update={onHotelChange} />;
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
          title="إدارة الفندق"
          aria-label="إدارة الفندق"
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
              <div className="w-9 h-9 rounded-xl bg-ink text-white flex items-center justify-center"><BedDouble size={18} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-ink truncate">إدارة الفندق{name ? ` · ${name}` : ''}</div>
                <div className="text-xs text-neutral-400 font-bold">
                  Weelink / Hotel · {Number.isFinite(maxItems) ? `${data.rooms.length} من ${maxItems} غرفة` : `${data.rooms.length} غرفة`}
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
                  const count = t.id === 'types' ? data.shop.products.length : t.id === 'rooms' ? data.rooms.length : 0;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={`shrink-0 flex items-center gap-2.5 h-10 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${tab === t.id ? 'bg-brand text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
                    >
                      <t.icon size={16} />
                      <span>{t.label}</span>
                      {count > 0 && (
                        <span className={`mr-auto min-w-[20px] h-5 px-1 rounded-full text-xs flex items-center justify-center ${tab === t.id ? 'bg-white text-brand' : 'bg-neutral-100 text-neutral-500'}`}>{count}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
              <main className="flex-1 min-w-0 overflow-y-auto p-3 sm:p-6">
                <h2 className="text-lg font-black text-ink mb-4">{active.label}</h2>
                <HotelModeContext.Provider value={{ capacity: data.capacity }}>{body()}</HotelModeContext.Provider>
              </main>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

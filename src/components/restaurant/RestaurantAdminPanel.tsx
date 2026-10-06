// Restaurant admin: the large floating gear (bottom-left) that opens the admin window, as in the
// shop and the showroom. The menu (main catalogs, sub-catalogs, dishes), the website's orders and
// the settings are managed here; the restaurant's pages are edited in the editor like any page.
import React, { useEffect, useState } from 'react';
import { Settings, X, UtensilsCrossed, LayoutList, Layers, Inbox, SlidersHorizontal, QrCode, Wallet, Armchair, MonitorSmartphone, Users, UserCog } from 'lucide-react';
import { RestaurantAdminData, setDayStartHour } from './restaurantTypes';
import { RestaurantTabProps, RestaurantTabId } from './tabs/shared';
import { TablesTab } from './tabs/TablesTab';
import { HallsTab } from './tabs/HallsTab';
import { DevicesTab } from './tabs/DevicesTab';
import { WorkersTab } from './tabs/WorkersTab';
import { AccountsTab } from './tabs/AccountsTab';
import { useLiveOrders } from './restaurantCloud';
import { DishesTab } from './tabs/DishesTab';
import { CategoriesTab } from './tabs/CategoriesTab';
import { SubCatalogsTab } from './tabs/SubCatalogsTab';
import { OrdersTab } from './tabs/OrdersTab';
import { RestaurantSettingsTab } from './tabs/RestaurantSettingsTab';
import { MembersTab } from './tabs/MembersTab';
import { Access, OWNER_ACCESS, PermId } from '../../services/members';

type TabId = RestaurantTabId;

// `perm` is what a management member needs to see the tab (the owner sees all); 'owner' is for the owner only.
const TABS: { id: TabId; label: string; icon: React.ElementType; Component: React.FC<RestaurantTabProps>; perm: PermId | 'owner' }[] = [
  { id: 'orders', label: 'الطلبات', icon: Inbox, Component: OrdersTab, perm: 'orders' },
  { id: 'dishes', label: 'الأطباق', icon: UtensilsCrossed, Component: DishesTab, perm: 'menu' },
  { id: 'categories', label: 'أقسام المنيو', icon: LayoutList, Component: CategoriesTab, perm: 'menu' },
  { id: 'subcatalogs', label: 'مجموعات المكونات', icon: Layers, Component: SubCatalogsTab, perm: 'menu' },
  { id: 'halls', label: 'الصالات والطاولات', icon: Armchair, Component: HallsTab, perm: 'tables' },
  { id: 'devices', label: 'الأجهزة والأكواد', icon: MonitorSmartphone, Component: DevicesTab, perm: 'staff' },
  { id: 'workers', label: 'العمال والصناديق', icon: Users, Component: WorkersTab, perm: 'staff' },
  { id: 'tables', label: 'رابط الموقع ورموز QR', icon: QrCode, Component: TablesTab, perm: 'tables' },
  { id: 'accounts', label: 'الحسابات', icon: Wallet, Component: AccountsTab, perm: 'accounts' },
  { id: 'settings', label: 'الإعدادات', icon: SlidersHorizontal, Component: RestaurantSettingsTab, perm: 'settings' },
  { id: 'members', label: 'أعضاء الإدارة', icon: UserCog, Component: MembersTab, perm: 'owner' },
];

interface RestaurantAdminPanelProps {
  data: RestaurantAdminData;
  onChange: (fn: (d: RestaurantAdminData) => RestaurantAdminData) => void;
  ownerUid: string;
  access?: Access;
  // Asks the admin to open (counted); the editor's column has an "admin" button for this.
  openRequest?: number;
  // The floating gear is left out where the column's button opens the admin instead.
  hideGear?: boolean;
}

export const RestaurantAdminPanel: React.FC<RestaurantAdminPanelProps> = ({ data, onChange, ownerUid, access = OWNER_ACCESS, openRequest = 0, hideGear = false }) => {
  // Before anything below reads «today»: the owner's business day.
  setDayStartHour(data.settings.dayStartHour);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (openRequest > 0) setOpen(true);
  }, [openRequest]);
  const tabs = TABS.filter((t) => (t.perm === 'owner' ? access.owner : access.owner || access.perms[t.perm]));
  const [chosen, setTab] = useState<TabId>('dishes');
  const tab = tabs.some((t) => t.id === chosen) ? chosen : tabs[0]?.id;
  const liveOrders = useLiveOrders(access.owner || access.perms.orders ? ownerUid : null);
  const liveIds = new Set(liveOrders.items.map((o) => o.id));
  const newOrders = [...liveOrders.items, ...data.orders.filter((o) => !liveIds.has(o.id))].filter((o) => o.status === 'new' && o.source !== 'staff').length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const active = tabs.find((t) => t.id === tab);
  const count = (id: TabId) => (id === 'dishes' ? data.dishes.length : id === 'categories' ? data.categories.length : id === 'subcatalogs' ? data.subCatalogs.length : 0);

  return (
    <>
      {!hideGear && (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-[1000000] w-16 h-16 rounded-full bg-[#1d1d1f] text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition flex items-center justify-center cursor-pointer"
        title="إدارة المطعم"
        aria-label="إدارة المطعم"
      >
        <Settings size={30} strokeWidth={1.8} />
        {newOrders > 0 && <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full bg-[#ff3b30] text-white text-[11px] font-bold flex items-center justify-center">{newOrders}</span>}
      </button>
      )}

      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000001] bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-6" onMouseDown={() => setOpen(false)}>
          <div
            dir="rtl"
            className="w-full max-w-6xl h-full max-h-[880px] bg-[#f5f5f7] rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden text-right font-sans"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="flex items-center gap-3 px-4 sm:px-6 h-16 bg-white border-b border-neutral-200 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[#B5562B] text-white flex items-center justify-center"><UtensilsCrossed size={18} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-[#1d1d1f] truncate">إدارة المطعم{data.settings.name ? ` · ${data.settings.name}` : ''}</div>
                <div className="text-[10px] text-neutral-400 font-bold">Weelink / Restaurant</div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="w-9 h-9 rounded-xl hover:bg-neutral-100 text-neutral-500 flex items-center justify-center cursor-pointer" aria-label="إغلاق">
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              <nav className="md:w-56 shrink-0 bg-white md:border-l border-b md:border-b-0 border-neutral-200 p-2 flex md:flex-col gap-1 overflow-x-auto">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`shrink-0 flex items-center gap-2.5 h-10 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${tab === t.id ? 'bg-[#0071e3] text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
                  >
                    <t.icon size={16} />
                    <span>{t.label}</span>
                    {t.id === 'orders' && newOrders > 0 && (
                      <span className="mr-auto min-w-[20px] h-5 px-1 rounded-full text-[10px] flex items-center justify-center bg-[#ff3b30] text-white">{newOrders}</span>
                    )}
                    {count(t.id) > 0 && (
                      <span className={`mr-auto min-w-[20px] h-5 px-1 rounded-full text-[10px] flex items-center justify-center ${tab === t.id ? 'bg-white text-[#0071e3]' : 'bg-neutral-100 text-neutral-500'}`}>{count(t.id)}</span>
                    )}
                  </button>
                ))}
              </nav>
              <main className="flex-1 min-w-0 overflow-y-auto p-3 sm:p-6">
                {active ? (
                  <>
                    <h2 className="text-lg font-black text-[#1d1d1f] mb-4">{active.label}</h2>
                    <active.Component key={active.id} data={data} update={onChange} onGoTo={setTab} ownerUid={ownerUid} liveOrders={liveOrders} />
                  </>
                ) : (
                  <div className="py-16 text-center text-sm text-neutral-500 font-bold">لم يسمح لك صاحب الحساب بأي قسم بعد.</div>
                )}
              </main>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

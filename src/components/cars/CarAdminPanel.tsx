// Car showroom admin: a large floating gear (bottom-left) that opens the floating admin window,
// as in the Online Shop. All entries and management live here; the showroom's pages are edited in
// the editor like any other page.
import React, { useEffect, useState } from 'react';
import { Settings, X, CarFront, Warehouse, SlidersHorizontal, Users, Wallet, FileText, Inbox } from 'lucide-react';
import { CarAdminData } from './carTypes';
import { CarEditor, CarTabProps } from './tabs/CarEditor';
import { InventoryTab } from './tabs/InventoryTab';
import { CarSettingsTab } from './tabs/CarSettingsTab';
import { CarCustomersTab } from './tabs/CarCustomersTab';
import { CarAccountsTab } from './tabs/CarAccountsTab';
import { CarDocumentsTab } from './tabs/CarDocumentsTab';
import { CarRequestsTab } from './tabs/CarRequestsTab';
import { CarDocEditor, DocEditorTarget } from './tabs/CarDocEditor';

type TabId = 'add' | 'inventory' | 'requests' | 'customers' | 'documents' | 'accounts' | 'settings';

const TABS: { id: TabId; label: string; icon: React.ElementType; Component: React.FC<CarTabProps> }[] = [
  { id: 'add', label: 'إضافة سيارة', icon: CarFront, Component: CarEditor },
  { id: 'inventory', label: 'المخزون', icon: Warehouse, Component: InventoryTab },
  { id: 'requests', label: 'طلبات الزوار', icon: Inbox, Component: CarRequestsTab },
  { id: 'customers', label: 'الزبائن', icon: Users, Component: CarCustomersTab },
  { id: 'documents', label: 'الأوراق والعقود', icon: FileText, Component: CarDocumentsTab },
  { id: 'accounts', label: 'الحسابات', icon: Wallet, Component: CarAccountsTab },
  { id: 'settings', label: 'إعدادات المعرض', icon: SlidersHorizontal, Component: CarSettingsTab },
];

interface CarAdminPanelProps {
  data: CarAdminData;
  onChange: (fn: (d: CarAdminData) => CarAdminData) => void;
  // Asks the admin to open (counted); the editor's column has an "admin" button for this.
  openRequest?: number;
  // The floating gear is left out where the column's button opens the admin instead.
  hideGear?: boolean;
}

export const CarAdminPanel: React.FC<CarAdminPanelProps> = ({ data, onChange, openRequest = 0, hideGear = false }) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (openRequest > 0) setOpen(true);
  }, [openRequest]);
  const [tab, setTab] = useState<TabId>('inventory');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [docTarget, setDocTarget] = useState<DocEditorTarget | null>(null);
  const newRequests = data.requests.filter((r) => r.status === 'new').length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('[data-car-doc-editor]')) setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const active = TABS.find((t) => t.id === tab)!;
  const editing = tab === 'add' && editingId ? data.cars.find((c) => c.id === editingId) : undefined;

  return (
    <>
      {!hideGear && (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-[1000000] w-16 h-16 rounded-full bg-[#1d1d1f] text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition flex items-center justify-center cursor-pointer"
        title="إدارة معرض السيارات"
        aria-label="إدارة معرض السيارات"
      >
        <Settings size={30} strokeWidth={1.8} />
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
              <div className="w-9 h-9 rounded-xl bg-[#1d1d1f] text-white flex items-center justify-center"><CarFront size={18} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-[#1d1d1f] truncate">إدارة معرض السيارات{data.settings.showroomName ? ` · ${data.settings.showroomName}` : ''}</div>
                <div className="text-[10px] text-neutral-400 font-bold">Weelink / Cars</div>
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
                    onClick={() => { setTab(t.id); if (t.id === 'add') setEditingId(null); }}
                    className={`shrink-0 flex items-center gap-2.5 h-10 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${tab === t.id ? 'bg-[#0071e3] text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
                  >
                    <t.icon size={16} />
                    <span>{t.label}</span>
                    {t.id === 'requests' && newRequests > 0 && (
                      <span className="mr-auto min-w-[20px] h-5 px-1 rounded-full text-[10px] flex items-center justify-center bg-[#ff3b30] text-white">{newRequests}</span>
                    )}
                    {t.id === 'inventory' && data.cars.length > 0 && (
                      <span className={`mr-auto min-w-[20px] h-5 px-1 rounded-full text-[10px] flex items-center justify-center ${tab === t.id ? 'bg-white text-[#0071e3]' : 'bg-neutral-100 text-neutral-500'}`}>{data.cars.length}</span>
                    )}
                  </button>
                ))}
              </nav>
              <main className="flex-1 min-w-0 overflow-y-auto p-3 sm:p-6">
                <h2 className="text-lg font-black text-[#1d1d1f] mb-4">{editing ? 'تعديل سيارة' : active.label}</h2>
                <active.Component
                  data={data}
                  update={onChange}
                  editingId={editingId}
                  onEdit={(id) => { setEditingId(id || null); setTab('add'); }}
                  onSaved={() => setTab('inventory')}
                  onNewDocument={(type, carId, customerId) => setDocTarget({ type, carId, customerId })}
                  onOpenDocument={(docId) => {
                    const doc = data.documents.find((d) => d.id === docId);
                    if (doc) setDocTarget({ type: doc.type, carId: doc.carId, customerId: doc.customerId, docId });
                  }}
                />
              </main>
            </div>
          </div>
        </div>
      )}
      {open && docTarget && <CarDocEditor key={docTarget.docId || `${docTarget.type}-${docTarget.carId}`} data={data} update={onChange} target={docTarget} onClose={() => setDocTarget(null)} />}
    </>
  );
};

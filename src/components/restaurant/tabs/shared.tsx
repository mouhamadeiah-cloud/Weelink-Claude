// Shared bits of the restaurant admin window's tabs.
import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, X, CloudOff } from 'lucide-react';
import type { MenuOrder, RestaurantAdminData } from '../restaurantTypes';
import type { LiveState } from '../restaurantCloud';
import { cloudErrorText } from '../restaurantCloud';
import { uploadImageFile, inputClass } from '../../shop/adminUi';

export type RestaurantTabId = 'orders' | 'dishes' | 'categories' | 'subcatalogs' | 'halls' | 'devices' | 'workers' | 'tables' | 'accounts' | 'settings';

export interface RestaurantTabProps {
  data: RestaurantAdminData;
  update: (fn: (d: RestaurantAdminData) => RestaurantAdminData) => void;
  onGoTo: (tab: RestaurantTabId) => void;
  ownerUid: string;
  liveOrders: LiveState<MenuOrder>;
  onOpenKitchen: () => void;
}

export const parseAmount = (v: string) => {
  const n = parseFloat(v.replace(/[,\s]/g, ''));
  return isFinite(n) && n > 0 ? n : 0;
};

// Shown when the live database refuses or cannot be reached.
export const CloudNotice: React.FC<{ error: string }> = ({ error }) =>
  error ? (
    <div className="flex items-start gap-2 p-3 rounded-2xl bg-[#FFF4E6] border border-[#FFD8A8] text-[#A34A00] text-xs font-bold leading-relaxed">
      <CloudOff size={16} className="shrink-0 mt-0.5" />
      <span>{cloudErrorText(error)}</span>
    </div>
  ) : null;

// One photo: upload from the device or paste a link.
export const ImagePicker: React.FC<{ value: string; onChange: (url: string) => void }> = ({ value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    const url = await uploadImageFile(file);
    setBusy(false);
    if (url) onChange(url);
  };
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-28 h-24 shrink-0 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 hover:border-[#0071e3] overflow-hidden flex items-center justify-center text-neutral-400 cursor-pointer"
        aria-label="اختر صورة"
      >
        {busy ? <Loader2 size={22} className="animate-spin" /> : value ? <img src={value} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <ImagePlus size={24} />}
      </button>
      <div className="flex-1 space-y-2">
        <input className={inputClass} dir="ltr" placeholder="أو الصق رابط صورة" value={value.startsWith('data:') ? '' : value} onChange={(e) => onChange(e.target.value.trim())} />
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-[11px] font-bold text-[#E03131] inline-flex items-center gap-1 cursor-pointer">
            <X size={12} /> إزالة الصورة
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
};

// Chips that pick several ids from a list.
export const MultiChips: React.FC<{ options: { id: string; label: string }[]; value: string[]; onChange: (ids: string[]) => void; empty?: string }> = ({ options, value, onChange, empty }) =>
  options.length === 0 ? (
    <div className="text-[11px] text-neutral-400 font-bold">{empty}</div>
  ) : (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o.id) : [...value, o.id])}
            className={`h-8 px-3 rounded-full text-xs font-bold border cursor-pointer transition ${on ? 'bg-[#0071e3] border-[#0071e3] text-white' : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );

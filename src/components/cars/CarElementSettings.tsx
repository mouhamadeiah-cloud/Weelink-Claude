// Settings for the car showroom's live elements, shown in the animation panel like the store's:
// how a car list lays out its cars (layout, source, how many per page, filter bar, card colours and
// corners), and how a car search bar looks. Renders nothing for any other element.
import React from 'react';
import { CarFront } from 'lucide-react';
import type { CanvasElement, ShopSearchStyle } from '../../types';
import { CARD_ANIMATIONS } from '../ShopElementSettings';

interface CarElementSettingsProps {
  element: CanvasElement;
  onUpdateElement: (updates: Partial<CanvasElement>) => void;
}

const inputClass =
  'w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-[#C8102E] text-right';

const LAYOUTS: { id: NonNullable<CanvasElement['carLayout']>; label: string }[] = [
  { id: 'grid', label: 'شبكة بطاقات' },
  { id: 'wide', label: 'صفوف عرضية' },
  { id: 'large', label: 'صور كبيرة' },
  { id: 'marquee', label: 'شريط متحرك' },
];

const SEARCH_STYLES: { id: ShopSearchStyle; label: string }[] = [
  { id: 'minimal', label: 'بسيط' },
  { id: 'pill', label: 'بارز' },
  { id: 'glass', label: 'زجاجي' },
];

function Choices<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (id: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer transition ${
            value === o.id ? 'bg-[#C8102E] border-[#C8102E] text-white' : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="text-[11px] font-bold text-neutral-600 pt-1">{children}</div>;

const ColorRow: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <label className="flex items-center justify-between gap-2 text-[11px] font-bold text-neutral-600">
    <span>{label}</span>
    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-8 h-7 rounded-md border border-neutral-200 cursor-pointer bg-white" aria-label={label} />
  </label>
);

const Box: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-2 p-3 rounded-2xl border border-[#C8102E]/20 bg-[#C8102E]/[0.04]" dir="rtl">
    <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
      <CarFront size={14} className="text-[#C8102E]" />
      <span>{title}</span>
    </div>
    {children}
  </div>
);

export const CarElementSettings: React.FC<CarElementSettingsProps> = ({ element, onUpdateElement }) => {
  if (element.type === 'carSearch') {
    return (
      <Box title="شريط البحث عن سيارة">
        <Label>الشكل</Label>
        <Choices options={SEARCH_STYLES} value={element.shopSearchStyle || 'pill'} onChange={(id) => onUpdateElement({ shopSearchStyle: id })} />
        <Label>النص داخل الشريط</Label>
        <input className={inputClass} value={element.content} onChange={(e) => onUpdateElement({ content: e.target.value })} />
        <p className="text-[10px] text-neutral-500 leading-relaxed">يبحث في الماركة والموديل والسنة واللون. إذا لم تكن في الصفحة قائمة سيارات، ينقل الزائر إلى صفحة المعرض ويعرض النتائج هناك.</p>
      </Box>
    );
  }

  if (element.type !== 'carListings') return null;
  const layout = element.carLayout || 'grid';
  return (
    <Box title="عرض سيارات المعرض">
      <Label>السيارات المعروضة</Label>
      <Choices
        options={[{ id: 'all', label: 'كل السيارات المنشورة' }, { id: 'featured', label: 'المميزة فقط' }]}
        value={element.carSource || 'all'}
        onChange={(id) => onUpdateElement({ carSource: id as 'all' | 'featured' })}
      />
      <Label>طريقة العرض</Label>
      <Choices options={LAYOUTS} value={layout} onChange={(id) => onUpdateElement({ carLayout: id })} />
      {layout === 'marquee' ? (
        <>
          <Label>سرعة الشريط: دورة كل {element.carSpeed || 35} ثانية</Label>
          <input type="range" min={10} max={120} value={element.carSpeed || 35} onChange={(e) => onUpdateElement({ carSpeed: Number(e.target.value) })} className="w-full accent-[#C8102E]" dir="ltr" />
        </>
      ) : (
        <>
          <Label>حركة البطاقات</Label>
          <Choices options={CARD_ANIMATIONS} value={element.shopCardAnimation || 'none'} onChange={(id) => onUpdateElement({ shopCardAnimation: id })} />
          <label className="flex items-center justify-between gap-2 text-[11px] font-bold text-neutral-600 pt-1 cursor-pointer">
            <span>شريط تصفية (الماركة، الهيكل، الترتيب)</span>
            <input type="checkbox" checked={!!element.carFilters} onChange={(e) => onUpdateElement({ carFilters: e.target.checked })} className="w-4 h-4 accent-[#C8102E]" />
          </label>
          <Label>عدد السيارات في الصفحة الواحدة (حتى 30)</Label>
          <input
            className={inputClass}
            type="number"
            min={0}
            max={30}
            placeholder="9"
            value={element.carLimit || ''}
            onChange={(e) => onUpdateElement({ carLimit: Math.min(30, Math.max(0, parseInt(e.target.value, 10) || 0)) || undefined })}
          />
        </>
      )}
      <Label>ألوان البطاقة</Label>
      <ColorRow label="لون الأسعار والأزرار" value={element.styles.color || '#C8102E'} onChange={(v) => onUpdateElement({ styles: { ...element.styles, color: v } })} />
      <ColorRow label="خلفية البطاقة" value={element.carCardBg || '#FFFFFF'} onChange={(v) => onUpdateElement({ carCardBg: v })} />
      <ColorRow label="لون نص البطاقة" value={element.carCardText || '#1d1d1f'} onChange={(v) => onUpdateElement({ carCardText: v })} />
      <Label>استدارة الزوايا: {element.carCardRadius ?? 22}px</Label>
      <input type="range" min={0} max={40} value={element.carCardRadius ?? 22} onChange={(e) => onUpdateElement({ carCardRadius: Number(e.target.value) })} className="w-full accent-[#C8102E]" dir="ltr" />
      <p className="text-[10px] text-neutral-500 leading-relaxed">السيارات نفسها تُضاف وتُعدّل من ترس الإدارة أسفل الشاشة. الخط يتغير من أداة الخطوط مثل أي عنصر، وفي الصفحة المنشورة تتمدد الشريحة لتتسع لكل البطاقات.</p>
    </Box>
  );
};

// Settings for the restaurant's live elements, shown in the format and animation panels like the
// showroom's: which dishes a menu shows (all, featured or one catalog), the catalog tabs, the layout,
// how many dishes, the card colours and corners; and the cart's accent colour. Renders nothing for
// any other element.
import React from 'react';
import { UtensilsCrossed } from 'lucide-react';
import type { CanvasElement } from '../../types';
import { useRestaurantData } from './store/RestaurantDataContext';

interface RestaurantElementSettingsProps {
  element: CanvasElement;
  onUpdateElement: (updates: Partial<CanvasElement>) => void;
}

const ACCENT = '#B5562B';

const inputClass =
  'w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-[#B5562B] text-right';

const LAYOUTS: { id: NonNullable<CanvasElement['menuLayout']>; label: string }[] = [
  { id: 'grid', label: 'بطاقات' },
  { id: 'list', label: 'صفوف منيو' },
  { id: 'large', label: 'صور كبيرة' },
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
            value === o.id ? 'text-white' : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
          }`}
          style={value === o.id ? { backgroundColor: ACCENT, borderColor: ACCENT } : undefined}
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
  <div className="space-y-2 p-3 rounded-2xl border border-[#B5562B]/25 bg-[#B5562B]/[0.05]" dir="rtl">
    <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
      <UtensilsCrossed size={14} className="text-[#B5562B]" />
      <span>{title}</span>
    </div>
    {children}
  </div>
);

export const RestaurantElementSettings: React.FC<RestaurantElementSettingsProps> = ({ element, onUpdateElement }) => {
  const data = useRestaurantData();

  if (element.type === 'menuCart') {
    return (
      <Box title="سلة الطلب">
        <ColorRow label="لون الأزرار والأسعار" value={element.styles.color || ACCENT} onChange={(v) => onUpdateElement({ styles: { ...element.styles, color: v } })} />
        <p className="text-[10px] text-neutral-500 leading-relaxed">رسوم التوصيل والحد الأدنى للطلب ورقم واتساب المطعم تُضبط من ترس الإدارة ← الإعدادات. كل طلب يصل إلى قائمة «الطلبات» ويُفتح واتساب برسالة فيها الطلب كاملًا.</p>
      </Box>
    );
  }

  if (element.type !== 'menuList') return null;
  const source = element.menuSource || 'all';
  const categories = (data?.categories || []).filter((c) => c.name.trim());
  return (
    <Box title="عرض المنيو">
      <Label>الأطباق المعروضة</Label>
      <Choices
        options={[{ id: 'all', label: 'كل المنيو' }, { id: 'featured', label: 'المميزة فقط' }, { id: 'category', label: 'قسم واحد' }]}
        value={source}
        onChange={(id) => onUpdateElement({ menuSource: id, ...(id === 'category' && !element.menuCategoryId && categories[0] ? { menuCategoryId: categories[0].id } : {}) })}
      />
      {source === 'category' && (
        <select className={inputClass} value={element.menuCategoryId || ''} onChange={(e) => onUpdateElement({ menuCategoryId: e.target.value })}>
          {categories.length === 0 && <option value="">أضف أقسامًا من ترس الإدارة</option>}
          {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      )}
      {source === 'all' && (
        <label className="flex items-center justify-between gap-2 text-[11px] font-bold text-neutral-600 pt-1 cursor-pointer">
          <span>أقسام المنيو كأزرار فوق الأطباق</span>
          <input type="checkbox" checked={element.menuTabs !== false} onChange={(e) => onUpdateElement({ menuTabs: e.target.checked })} className="w-4 h-4 accent-[#B5562B]" />
        </label>
      )}
      <Label>طريقة العرض</Label>
      <Choices options={LAYOUTS} value={element.menuLayout || 'grid'} onChange={(id) => onUpdateElement({ menuLayout: id })} />
      <Label>أقصى عدد للأطباق (فارغ = الكل)</Label>
      <input
        className={inputClass}
        type="number"
        min={0}
        max={200}
        placeholder="الكل"
        value={element.menuLimit || ''}
        onChange={(e) => onUpdateElement({ menuLimit: Math.min(200, Math.max(0, parseInt(e.target.value, 10) || 0)) || undefined })}
      />
      <Label>ألوان البطاقة</Label>
      <ColorRow label="لون الأسعار والأزرار" value={element.styles.color || ACCENT} onChange={(v) => onUpdateElement({ styles: { ...element.styles, color: v } })} />
      <ColorRow label="خلفية البطاقة" value={element.menuCardBg || '#FFFFFF'} onChange={(v) => onUpdateElement({ menuCardBg: v })} />
      <ColorRow label="لون نص البطاقة" value={element.menuCardText || '#2B2118'} onChange={(v) => onUpdateElement({ menuCardText: v })} />
      <Label>استدارة الزوايا: {element.menuCardRadius ?? 20}px</Label>
      <input type="range" min={0} max={40} value={element.menuCardRadius ?? 20} onChange={(e) => onUpdateElement({ menuCardRadius: Number(e.target.value) })} className="w-full accent-[#B5562B]" dir="ltr" />
      <p className="text-[10px] text-neutral-500 leading-relaxed">الأطباق والأقسام تُضاف من ترس الإدارة أسفل الشاشة. الخط يتغير من أداة الخطوط مثل أي عنصر، وفي الصفحة المنشورة تتمدد الشريحة لتتسع لكل الأطباق.</p>
    </Box>
  );
};

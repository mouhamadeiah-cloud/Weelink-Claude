// Settings for the investments project's live project list, shown beside the other element tools:
// which projects it shows, grid cards or wide rows, how many per page, the sector / status bar, and
// the card colours and corners. Renders nothing for any other element.
import React from 'react';
import { Briefcase } from 'lucide-react';
import type { CanvasElement } from '../../types';

interface InvestElementSettingsProps {
  element: CanvasElement;
  onUpdateElement: (updates: Partial<CanvasElement>) => void;
}

const ACCENT = '#0F6B4F';
const inputClass = 'w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-[#0F6B4F] text-right';

function Choices<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (id: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer transition ${
            value === o.id ? 'bg-[#0F6B4F] border-[#0F6B4F] text-white' : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
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

export const InvestElementSettings: React.FC<InvestElementSettingsProps> = ({ element, onUpdateElement }) => {
  if (element.type !== 'investProjects') return null;
  return (
    <div className="space-y-2 p-3 rounded-2xl border border-[#0F6B4F]/20 bg-[#0F6B4F]/[0.04]" dir="rtl">
      <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
        <Briefcase size={14} style={{ color: ACCENT }} />
        <span>عرض مشاريع الشركة</span>
      </div>
      <Label>المشاريع المعروضة</Label>
      <Choices
        options={[
          { id: 'all', label: 'كل المشاريع' },
          { id: 'featured', label: 'المميزة' },
          { id: 'open', label: 'المفتوحة للاستثمار' },
          { id: 'completed', label: 'المنجزة' },
        ]}
        value={element.investSource || 'all'}
        onChange={(id) => onUpdateElement({ investSource: id as CanvasElement['investSource'] })}
      />
      <Label>طريقة العرض</Label>
      <Choices options={[{ id: 'grid', label: 'شبكة بطاقات' }, { id: 'wide', label: 'صفوف عرضية' }]} value={element.investLayout || 'grid'} onChange={(id) => onUpdateElement({ investLayout: id as 'grid' | 'wide' })} />
      <label className="flex items-center justify-between gap-2 text-[11px] font-bold text-neutral-600 pt-1 cursor-pointer">
        <span>شريط تصفية (القطاع، الحالة)</span>
        <input type="checkbox" checked={!!element.investFilters} onChange={(e) => onUpdateElement({ investFilters: e.target.checked })} className="w-4 h-4 accent-[#0F6B4F]" />
      </label>
      <Label>عدد المشاريع في الصفحة الواحدة (حتى 30)</Label>
      <input
        className={inputClass}
        type="number"
        min={0}
        max={30}
        placeholder="9"
        value={element.investLimit || ''}
        onChange={(e) => onUpdateElement({ investLimit: Math.min(30, Math.max(0, parseInt(e.target.value, 10) || 0)) || undefined })}
      />
      <Label>ألوان البطاقة</Label>
      <ColorRow label="لون شريط التمويل والأزرار" value={element.styles.color || ACCENT} onChange={(v) => onUpdateElement({ styles: { ...element.styles, color: v } })} />
      <ColorRow label="خلفية البطاقة" value={element.investCardBg || '#FFFFFF'} onChange={(v) => onUpdateElement({ investCardBg: v })} />
      <ColorRow label="لون نص البطاقة" value={element.investCardText || '#1d1d1f'} onChange={(v) => onUpdateElement({ investCardText: v })} />
      <Label>استدارة الزوايا: {element.investCardRadius ?? 22}px</Label>
      <input type="range" min={0} max={40} value={element.investCardRadius ?? 22} onChange={(e) => onUpdateElement({ investCardRadius: Number(e.target.value) })} className="w-full accent-[#0F6B4F]" dir="ltr" />
      <p className="text-[10px] text-neutral-500 leading-relaxed">المشاريع نفسها تُضاف وتُعدّل من ترس الإدارة أسفل الشاشة. في الصفحة المنشورة تتمدد الشريحة لتتسع لكل البطاقات.</p>
    </div>
  );
};

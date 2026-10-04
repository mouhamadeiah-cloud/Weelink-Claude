// The small «إعدادات البطاقة» panel under the product preview: it opens downwards with a few
// simple choices for the product's card (frame, text colour, text background, corner shape).
import React, { useState } from 'react';
import { Settings2, ChevronDown } from 'lucide-react';
import { CardCorners, CardStyle, DEFAULT_CARD_STYLE } from '../shopTypes';
import { Toggle } from '../adminUi';

const CORNERS: { id: CardCorners; label: string }[] = [
  { id: 'rounded', label: 'حواف دائرية' },
  { id: 'soft', label: 'حواف خفيفة' },
  { id: 'square', label: 'مربعة' },
  { id: 'leaf', label: 'ورقة' },
];

const ColorRow: React.FC<{ label: string; value: string; fallback: string; onChange: (v: string) => void }> = ({ label, value, fallback, onChange }) => (
  <label className="flex items-center justify-between gap-2 text-xs font-bold text-neutral-700">
    <span>{label}</span>
    <span className="flex items-center gap-1.5">
      {value && (
        <button type="button" onClick={() => onChange('')} className="text-[10px] text-neutral-400 hover:text-neutral-600 cursor-pointer">
          افتراضي
        </button>
      )}
      <input
        type="color"
        value={value || fallback}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-7 rounded-md border border-neutral-200 cursor-pointer bg-white"
        aria-label={label}
      />
    </span>
  </label>
);

export const CardStyleSettings: React.FC<{ value: CardStyle; onChange: (v: CardStyle) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const st = { ...DEFAULT_CARD_STYLE, ...value };
  const set = (changes: Partial<CardStyle>) => onChange({ ...st, ...changes });

  return (
    <div className="rounded-xl border border-neutral-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full h-9 px-3 flex items-center justify-between text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
      >
        <span className="flex items-center gap-1.5"><Settings2 size={14} /> إعدادات البطاقة</span>
        <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-2.5 border-t border-neutral-100">
          <Toggle checked={st.border} onChange={(border) => set({ border })} label="إطار" />
          {st.border && <ColorRow label="لون الإطار" value={st.borderColor} fallback="#B4532A" onChange={(borderColor) => set({ borderColor: borderColor || '#B4532A' })} />}
          <ColorRow label="لون النص" value={st.textColor} fallback="#2A1F1A" onChange={(textColor) => set({ textColor })} />
          <ColorRow label="خلفية النص" value={st.textBg} fallback="#FFFFFF" onChange={(textBg) => set({ textBg })} />
          <div>
            <div className="text-xs font-bold text-neutral-700 mb-1">شكل البطاقة</div>
            <div className="grid grid-cols-2 gap-1.5">
              {CORNERS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => set({ corners: c.id })}
                  className={`h-8 rounded-lg border text-[11px] font-bold cursor-pointer transition ${st.corners === c.id ? 'border-[#0071e3] bg-blue-50 text-[#0071e3]' : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

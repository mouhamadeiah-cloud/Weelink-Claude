// «ألوان شخصية» in the Wee AI questions: the same five colours as the editor's page-colour panel
// (background, boxes, frames, text, brand), with the light and dark presets and one picker.

import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

export type Palette5 = [string, string, string, string, string];

export const DEFAULT_PERSONAL_PALETTE: Palette5 = ['#fbfbfd', '#ffffff', '#e5e5ea', '#1d1d1f', '#0071e3'];

const SLOT_LABELS = ['الخلفية', 'الصناديق', 'الإطارات', 'النصوص', 'البراند'];
const HEX = /^#[0-9a-f]{6}$/i;

export const asPalette5 = (v: unknown): Palette5 | null =>
  Array.isArray(v) && v.length === 5 && v.every((c) => typeof c === 'string' && HEX.test(c)) ? (v as Palette5) : null;

export const PersonalPalette: React.FC<{ value: Palette5; onChange: (p: Palette5) => void }> = ({ value, onChange }) => {
  const [slot, setSlot] = useState(4);
  const [draft, setDraft] = useState(value[4]);
  useEffect(() => setDraft(value[slot]), [slot, value]);
  const setColor = (idx: number, hex: string) => {
    const next = [...value] as Palette5;
    next[idx] = hex;
    onChange(next);
  };
  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-around p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
        {value.map((c, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSlot(idx)}
            className={`flex flex-col items-center gap-1 transition-transform cursor-pointer ${slot === idx ? 'scale-110' : 'opacity-85 hover:opacity-100'}`}
          >
            <span
              className={`w-7 h-7 rounded-full border border-black/15 shadow-xs flex items-center justify-center ${slot === idx ? 'ring-2 ring-brand ring-offset-2' : ''}`}
              style={{ backgroundColor: c }}
            >
              {slot === idx && <Check size={12} className={c === '#ffffff' || c === '#fbfbfd' ? 'text-black' : 'text-white'} />}
            </span>
            <span className="text-xs font-medium text-neutral-500">{SLOT_LABELS[idx]}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(['#fbfbfd', '#ffffff', '#e5e5ea', '#1d1d1f', value[4] || '#0071e3'])}
          className="py-1.5 px-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 text-center cursor-pointer"
        >
          فاتح
        </button>
        <button
          type="button"
          onClick={() => onChange(['#0f172a', '#1e293b', '#334155', '#f8fafc', value[4] || '#38bdf8'])}
          className="py-1.5 px-3 rounded-lg bg-neutral-900 text-white hover:bg-black text-xs font-semibold text-center cursor-pointer"
        >
          غامق
        </button>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-bold text-neutral-700 block">تحديد رقم اللون للتعديل:</span>
        <div className="flex items-center rounded-full bg-neutral-100 p-1 border border-neutral-200">
          {[0, 1, 2, 3, 4].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSlot(idx)}
              className={`flex-1 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${slot === idx ? 'bg-brand text-white shadow-2xs' : 'text-neutral-600 hover:text-black'}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-800">اختيار اللون للخانة ({slot + 1}: {SLOT_LABELS[slot]}):</span>
          <span className="w-5 h-5 rounded-md border border-black/10" style={{ backgroundColor: value[slot] }} />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value[slot]}
            onChange={(e) => setColor(slot, e.target.value)}
            className="w-9 h-9 rounded-xl cursor-pointer border-0 bg-transparent shrink-0"
          />
          <input
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (HEX.test(e.target.value)) setColor(slot, e.target.value);
            }}
            className="flex-1 text-xs px-2.5 py-1.5 bg-white rounded-lg border border-neutral-300 font-mono text-left"
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
};

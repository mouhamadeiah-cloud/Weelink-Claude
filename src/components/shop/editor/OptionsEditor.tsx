// المواصفات والمخزون: product options (size, colour, weight…) and the stock of each combination.
// Options that affect stock (up to MAX_STOCK_OPTIONS) generate the combination table; the others
// are descriptive.
import React, { useState } from 'react';
import { Plus, Trash2, X, Sparkles, Package } from 'lucide-react';
import { ProductOption, ProductVariant, OptionValue, MAX_STOCK_OPTIONS, newId } from '../shopTypes';
import { buildVariants, stockOptions, variantLabel } from '../productModel';
import { COLOR_PALETTE, SPEC_PRESETS, optionFromPreset } from '../artikel';
import { Field, inputClass, inputFitClass, GhostButton, Toggle } from '../adminUi';

interface OptionsEditorProps {
  options: ProductOption[];
  variants: ProductVariant[];
  stock: number;
  suggested: string[]; // preset keys suggested for this kind of product
  linkedToWarehouse: boolean;
  currency: string;
  onChange: (patch: { options?: ProductOption[]; variants?: ProductVariant[]; stock?: number }) => void;
}

const num = (v: string) => {
  const n = parseFloat(v);
  return isFinite(n) ? n : 0;
};

const ValuesInput: React.FC<{ option: ProductOption; onChange: (values: OptionValue[]) => void }> = ({ option, onChange }) => {
  const [draft, setDraft] = useState('');
  const [color, setColor] = useState('#0071e3');
  const has = (label: string) => option.values.some((v) => v.label === label);
  const add = () => {
    const parts = draft.split(/[,،]/).map((s) => s.trim()).filter((s) => s && !has(s));
    if (!parts.length) return;
    onChange([...option.values, ...parts.map((label) => (option.kind === 'color' ? { label, color } : { label }))]);
    setDraft('');
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {option.values.map((v) => (
          <span key={v.label} className="inline-flex items-center gap-1 h-7 pr-2.5 pl-1 rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-700">
            {v.color && <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: v.color }} />}
            {v.label}
            <button type="button" onClick={() => onChange(option.values.filter((x) => x.label !== v.label))} className="w-5 h-5 rounded-full hover:bg-neutral-200 flex items-center justify-center cursor-pointer" aria-label={`حذف ${v.label}`}>
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      {option.kind === 'color' && (
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PALETTE.filter((c) => !has(c.label)).map((c) => (
            <button
              key={c.label}
              type="button"
              title={c.label}
              onClick={() => onChange([...option.values, { ...c }])}
              className="w-6 h-6 rounded-full border border-black/10 hover:scale-110 transition cursor-pointer"
              style={{ backgroundColor: c.color }}
              aria-label={`إضافة ${c.label}`}
            />
          ))}
        </div>
      )}
      <div className="flex gap-2">
        {option.kind === 'color' && (
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-9 rounded-lg border border-neutral-200 cursor-pointer shrink-0" aria-label="لون مخصص" />
        )}
        <input
          className={`${inputClass} h-9`}
          placeholder={option.kind === 'color' ? 'اسم لون آخر' : option.values.length ? 'قيمة أخرى' : 'القيمة، أو عدة قيم مفصولة بفاصلة'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <GhostButton onClick={add} className="shrink-0"><Plus size={13} /></GhostButton>
      </div>
    </div>
  );
};

export const OptionsEditor: React.FC<OptionsEditorProps> = ({ options, variants, stock, suggested, linkedToWarehouse, currency, onChange }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const stockCount = options.filter((o) => o.affectsStock).length;

  const setOptions = (next: ProductOption[]) => onChange({ options: next, variants: buildVariants(next, variants) });
  const patchOption = (id: string, patch: Partial<ProductOption>) => setOptions(options.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  const addPreset = (key: string) => {
    const opt = optionFromPreset(key);
    if (opt.affectsStock && stockCount >= MAX_STOCK_OPTIONS) opt.affectsStock = false;
    setOptions([...options, opt]);
    setMenuOpen(false);
  };
  const addCustom = () => {
    setOptions([...options, { id: newId('opt'), name: '', kind: 'text', values: [], affectsStock: false }]);
    setMenuOpen(false);
  };

  const present = new Set(options.map((o) => o.name));
  const suggestions = suggested.filter((k) => !present.has(SPEC_PRESETS[k].name));
  const stockOpts = stockOptions(options);
  const setVariant = (i: number, patch: Partial<ProductVariant>) =>
    onChange({ variants: variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) });

  return (
    <div className="space-y-3">
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-blue-50/60">
          <span className="text-[11px] font-bold text-[#0071e3] flex items-center gap-1"><Sparkles size={12} /> مقترح لهذا النوع:</span>
          {suggestions.map((k) => (
            <button key={k} type="button" onClick={() => addPreset(k)} className="h-7 px-2.5 rounded-full bg-white border border-blue-100 text-[11px] font-bold text-[#0071e3] hover:bg-blue-50 cursor-pointer">
              + {SPEC_PRESETS[k].name}
            </button>
          ))}
        </div>
      )}

      {options.map((o) => (
        <div key={o.id} className="p-3 rounded-xl border border-neutral-200 bg-[#fbfbfd] space-y-2.5">
          <div className="flex items-center gap-2">
            <input className={`${inputClass} h-9 font-bold`} value={o.name} placeholder="اسم المواصفة، مثلاً: الخامة" onChange={(e) => patchOption(o.id, { name: e.target.value })} />
            <select className={`${inputFitClass} h-9 w-28 shrink-0`} value={o.kind} onChange={(e) => patchOption(o.id, { kind: e.target.value as ProductOption['kind'] })}>
              <option value="text">نص</option>
              <option value="size">مقاس</option>
              <option value="color">لون</option>
            </select>
            <button type="button" onClick={() => setOptions(options.filter((x) => x.id !== o.id))} className="w-9 h-9 shrink-0 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer" aria-label="حذف المواصفة">
              <Trash2 size={14} />
            </button>
          </div>
          <ValuesInput option={o} onChange={(values) => patchOption(o.id, { values })} />
          <div className={!o.affectsStock && stockCount >= MAX_STOCK_OPTIONS ? 'opacity-50 pointer-events-none' : ''}>
            <Toggle checked={o.affectsStock} onChange={(affectsStock) => patchOption(o.id, { affectsStock })} label="تؤثر على المخزون (لكل قيمة كمية خاصة)" />
          </div>
        </div>
      ))}

      <div className="relative">
        <GhostButton onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-1"><Plus size={13} /> إضافة مواصفات</GhostButton>
        {menuOpen && (
          <div className="absolute z-20 top-full mt-1 right-0 w-48 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden">
            {Object.values(SPEC_PRESETS).filter((p) => !present.has(p.name)).map((p) => (
              <button key={p.key} type="button" onClick={() => addPreset(p.key)} className="w-full text-right px-3 py-2 text-xs font-bold hover:bg-neutral-50 cursor-pointer">
                {p.name}{p.key === 'shoeSize' ? ' (أحذية)' : ''}
              </button>
            ))}
            <button type="button" onClick={addCustom} className="w-full text-right px-3 py-2 text-xs font-bold text-[#0071e3] hover:bg-neutral-50 border-t border-neutral-100 cursor-pointer">
              مواصفات أخرى…
            </button>
          </div>
        )}
      </div>

      {stockOpts.length > 0 ? (
        <div className="rounded-xl border border-neutral-200 overflow-hidden">
          <div className="grid grid-cols-[1fr_90px_110px] gap-2 px-3 py-2 bg-neutral-100 text-[10px] font-bold text-neutral-500">
            <span>{stockOpts.map((o) => o.name || 'مواصفة').join(' / ')}</span>
            <span>الكمية</span>
            <span>فرق السعر ({currency})</span>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100">
            {variants.map((v, i) => (
              <div key={variantLabel(v.values)} className={`grid grid-cols-[1fr_90px_110px] gap-2 px-3 py-1.5 items-center ${linkedToWarehouse && v.stock <= 0 ? 'bg-neutral-50' : 'bg-white'}`}>
                <span className="text-xs font-bold text-[#1d1d1f] flex items-center gap-1.5 min-w-0">
                  <span className="truncate">{variantLabel(v.values)}</span>
                  {linkedToWarehouse && v.stock <= 0 && <span className="text-[9px] text-neutral-400 font-bold shrink-0">غير متوفر</span>}
                </span>
                <input className={`${inputClass} h-8`} type="number" min="0" inputMode="numeric" value={v.stock || ''} placeholder="0" onChange={(e) => setVariant(i, { stock: Math.max(0, Math.floor(num(e.target.value))) })} aria-label={`كمية ${variantLabel(v.values)}`} />
                <input className={`${inputClass} h-8`} type="number" inputMode="decimal" value={v.priceDelta || ''} placeholder="0" onChange={(e) => setVariant(i, { priceDelta: num(e.target.value) })} aria-label={`فرق سعر ${variantLabel(v.values)}`} />
              </div>
            ))}
          </div>
          <div className="px-3 py-2 bg-neutral-50 text-[11px] font-bold text-neutral-600 flex items-center gap-1.5">
            <Package size={13} /> المجموع في المستودع: {variants.reduce((s, v) => s + v.stock, 0)} قطعة
          </div>
        </div>
      ) : (
        <Field label="الكمية في المستودع" hint="فعّل «تؤثر على المخزون» على مواصفة مثل اللون أو المقاس لتحديد كمية كل تركيبة.">
          <input className={`${inputFitClass} w-40`} type="number" min="0" inputMode="numeric" value={stock || ''} placeholder="0" onChange={(e) => onChange({ stock: Math.max(0, Math.floor(num(e.target.value))) })} />
        </Field>
      )}
    </div>
  );
};

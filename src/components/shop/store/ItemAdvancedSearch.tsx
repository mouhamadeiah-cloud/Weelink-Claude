// «بحث متقدم» for the cards of a shop, a rental, a hotel or a restaurant menu: the visitor narrows the
// list by catalog, price, people, kind of food, badge, options (colour, size...), discount, featured
// and stock, and sorts it. Every choice offers only what the page's items really have, and the button
// shows how many match before it is applied.
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { EMPTY_ITEM_FILTERS, ItemFilters, SORTS, SearchItem, itemMatches } from './itemSearch';
import { DISH_BADGES } from '../../restaurant/restaurantTypes';
import { PRODUCT_BADGES } from '../shopTypes';

export interface SearchNoun {
  one: string;
  two: string;
  few: string;
  many: string;
}

interface Props {
  items: SearchItem[];
  groups: { id: string; name: string }[];
  groupTitle: string; // «القسم»، «التصنيف»
  noun: SearchNoun;
  currency: string;
  initial: ItemFilters;
  accent: string;
  font: string;
  matches: (it: SearchItem) => boolean; // the typed word, when one is already asked for
  onApply: (f: ItemFilters) => void;
  onClose: () => void;
}

const field = 'w-full h-11 px-3 rounded-xl border border-black/10 bg-white text-sm text-[#1d1d1f] outline-none focus:border-black/30';
const label = 'block text-[12px] font-bold text-neutral-500 mb-1.5';

const Chips: React.FC<{ title: string; values: { id: string; label: string }[]; value: string; accent: string; onPick: (v: string) => void }> = ({ title, values, value, accent, onPick }) =>
  values.length ? (
    <div>
      <span className={label}>{title}</span>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <button key={v.id} type="button" onClick={() => onPick(value === v.id ? '' : v.id)} aria-pressed={value === v.id}
            className="h-9 px-3.5 rounded-full border text-[13px] font-semibold cursor-pointer transition"
            style={value === v.id ? { backgroundColor: accent, borderColor: accent, color: '#fff' } : { borderColor: 'rgba(0,0,0,0.1)', color: '#1d1d1f', backgroundColor: '#fff' }}>
            {v.label}
          </button>
        ))}
      </div>
    </div>
  ) : null;

const uniq = (values: string[]) => [...new Set(values.filter((v) => v && v.trim()))];

export const ItemAdvancedSearch: React.FC<Props> = ({ items, groups, groupTitle, noun, currency, initial, accent, font, matches, onApply, onClose }) => {
  const [f, setF] = useState<ItemFilters>(initial);
  const set = (changes: Partial<ItemFilters>) => setF((prev) => ({ ...prev, ...changes }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const usedGroups = useMemo(() => groups.filter((g) => items.some((it) => it.group.includes(g.id))), [groups, items]);
  const kinds = useMemo(() => uniq(items.map((it) => it.kind)).sort((a, b) => a.localeCompare(b, 'ar')), [items]);
  const badges = useMemo(() => {
    const used = new Set(items.map((it) => it.badge).filter(Boolean));
    return [...PRODUCT_BADGES, ...DISH_BADGES].filter((b, i, all) => b.id && used.has(b.id) && all.findIndex((x) => x.id === b.id) === i).map((b) => ({ id: b.id, label: b.label }));
  }, [items]);
  const optionNames = useMemo(() => {
    const map = new Map<string, string[]>();
    items.forEach((it) => Object.entries(it.options).forEach(([name, values]) => map.set(name, uniq([...(map.get(name) || []), ...values]))));
    return [...map.entries()].filter(([, values]) => values.length > 1);
  }, [items]);
  const maxGuests = Math.max(0, ...items.map((it) => it.guests));
  const hasSale = items.some((it) => it.oldPrice > it.price);
  const hasFeatured = items.some((it) => it.featured);
  const hasSoldOut = items.some((it) => !it.available);
  const count = useMemo(() => items.filter((it) => matches(it) && itemMatches(it, f)).length, [items, f, matches]);
  const countText = count === 0 ? `لا توجد نتائج` : `عرض ${count} ${count === 1 ? noun.one : count === 2 ? noun.two : count <= 10 ? noun.few : noun.many}`;

  return createPortal(
    <div className="fixed inset-0 z-[2000001] bg-black/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center sm:p-6" onMouseDown={onClose}>
      <div dir="rtl" role="dialog" aria-label="بحث متقدم" className="w-full max-w-2xl max-h-[92vh] bg-[#f7f7f8] rounded-t-3xl sm:rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden text-right text-[#1d1d1f]" style={{ fontFamily: font }} onMouseDown={(e) => e.stopPropagation()}>
        <header className="flex items-center gap-3 px-5 h-16 bg-white border-b border-black/[0.06] shrink-0">
          <SlidersHorizontal size={20} style={{ color: accent }} />
          <h2 className="flex-1 text-lg font-black">بحث متقدم</h2>
          <button type="button" onClick={() => setF(EMPTY_ITEM_FILTERS)} className="h-9 px-3 rounded-full text-[13px] font-bold text-neutral-500 hover:bg-black/[0.04] flex items-center gap-1 cursor-pointer"><RotateCcw size={14} /> مسح الكل</button>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="w-9 h-9 rounded-full hover:bg-black/[0.05] flex items-center justify-center text-neutral-500 cursor-pointer"><X size={18} /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {usedGroups.length > 1 && <Chips title={groupTitle} values={usedGroups.map((g) => ({ id: g.id, label: g.name }))} value={f.group} accent={accent} onPick={(group) => set({ group })} />}

          <div className="grid sm:grid-cols-2 gap-4">
            {items.some((it) => it.price > 0) && (
              <div>
                <span className={label}>السعر{currency ? ` (${currency})` : ''}</span>
                <div className="flex items-center gap-2">
                  <input className={field} dir="ltr" inputMode="numeric" placeholder="من" aria-label="السعر من" value={f.priceFrom} onChange={(e) => set({ priceFrom: e.target.value.replace(/[^\d.]/g, '') })} />
                  <span className="text-neutral-400 text-sm">-</span>
                  <input className={field} dir="ltr" inputMode="numeric" placeholder="إلى" aria-label="السعر إلى" value={f.priceTo} onChange={(e) => set({ priceTo: e.target.value.replace(/[^\d.]/g, '') })} />
                </div>
              </div>
            )}
            {maxGuests > 0 && (
              <div>
                <label className={label} htmlFor="adv-guests">عدد الأشخاص</label>
                <select id="adv-guests" className={field} value={f.guests} onChange={(e) => set({ guests: e.target.value })}>
                  <option value="">أي عدد</option>
                  {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? 'شخص' : 'أشخاص'} فأكثر</option>)}
                </select>
              </div>
            )}
          </div>

          <Chips title="نوع الأكل" values={kinds.map((k) => ({ id: k, label: k }))} value={f.kind} accent={accent} onPick={(kind) => set({ kind })} />
          <Chips title="الوسم" values={badges} value={f.badge} accent={accent} onPick={(badge) => set({ badge })} />
          {optionNames.map(([name, values]) => (
            <Chips key={name} title={name} values={values.map((v) => ({ id: v, label: v }))} value={f.options[name] || ''} accent={accent} onPick={(v) => set({ options: { ...f.options, [name]: v } })} />
          ))}

          {(hasSale || hasFeatured || hasSoldOut) && (
            <div className="flex flex-wrap gap-4">
              {hasSale && (
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" style={{ accentColor: accent }} checked={f.onSale} onChange={(e) => set({ onSale: e.target.checked })} /> عليه خصم
                </label>
              )}
              {hasFeatured && (
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" style={{ accentColor: accent }} checked={f.featured} onChange={(e) => set({ featured: e.target.checked })} /> المميز فقط
                </label>
              )}
              {hasSoldOut && (
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" style={{ accentColor: accent }} checked={f.available} onChange={(e) => set({ available: e.target.checked })} /> المتوفر فقط
                </label>
              )}
            </div>
          )}

          <Chips title="الترتيب" values={SORTS.filter((s) => s.id).map((s) => ({ id: s.id, label: s.label }))} value={f.sort} accent={accent} onPick={(sort) => set({ sort: sort as ItemFilters['sort'] })} />
        </div>

        <footer className="p-4 bg-white border-t border-black/[0.06] shrink-0">
          <button type="button" onClick={() => onApply(f)} disabled={count === 0} className="w-full h-12 rounded-full text-white text-[15px] font-bold cursor-pointer disabled:opacity-50 disabled:cursor-default" style={{ backgroundColor: accent }}>
            {countText}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
};

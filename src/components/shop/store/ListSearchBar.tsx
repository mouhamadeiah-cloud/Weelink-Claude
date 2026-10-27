// The search built into the top of a live list (the shop's, hotel's and rental's cards, the menu's dishes and the
// showroom's cars), so the visitor searches where the cards are: a word that filters the cards as it is typed, and
// «بحث متقدم» that opens the filters window of the page's kind.
import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface Props {
  value: string;
  placeholder: string;
  accent: string;
  filterCount: number; // advanced choices in force
  onChange: (v: string) => void;
  onAdvanced: () => void;
  onClear?: () => void; // clears the word and the choices
}

export const ListSearchBar: React.FC<Props> = ({ value, placeholder, accent, filterCount, onChange, onAdvanced, onClear }) => (
  <div className="flex items-center gap-2 shrink-0 w-full max-w-[760px] mx-auto h-12 pr-4 pl-1.5 rounded-full bg-white border border-black/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.05)]" data-list-search>
    <Search size={18} className="shrink-0" style={{ color: accent }} />
    <input
      type="text"
      inputMode="search"
      aria-label={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex-1 min-w-0 h-full bg-transparent outline-none text-[15px] text-[#1d1d1f] placeholder:text-neutral-400"
    />
    {(value || filterCount > 0) && onClear && (
      <button type="button" onClick={onClear} aria-label="مسح البحث" className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:bg-black/[0.05] cursor-pointer">
        <X size={16} />
      </button>
    )}
    <button
      type="button"
      onClick={onAdvanced}
      className="relative shrink-0 h-9 px-4 rounded-full text-[13px] font-bold inline-flex items-center gap-1.5 cursor-pointer text-white"
      style={{ backgroundColor: accent }}
    >
      <SlidersHorizontal size={15} /> بحث متقدم
      {filterCount > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[10px] font-black inline-flex items-center justify-center" style={{ color: accent }}>{filterCount}</span>}
    </button>
  </div>
);

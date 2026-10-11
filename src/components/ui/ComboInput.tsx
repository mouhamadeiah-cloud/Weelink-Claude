// A text field with its own drop-down list: it opens on focus or on its arrow, narrows the list as
// the person types (ignoring hamza forms, ة/ه, ى/ي and a leading «ال»), and still takes any typed
// text. Used where the browser's own suggestion list is unreliable (it does not open on phones and
// struggles with long lists).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface ComboOption {
  value: string;
  note?: string; // shown beside the value, e.g. a village's district
}

const MAX_SHOWN = 80;

export const normalizeArabic = (s: string) =>
  s
    .trim()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase();

const withoutAl = (s: string) => s.replace(/^ال/, '');

export const ComboInput: React.FC<{
  value: string;
  options: (string | ComboOption)[];
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}> = ({ value, options, onChange, placeholder, disabled, className, ariaLabel }) => {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState(false); // filter only after the person types, so a filled field still shows the whole list
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const items = useMemo(() => options.map((o) => (typeof o === 'string' ? { value: o } : o)), [options]);
  const shown = useMemo(() => {
    const q = typed ? withoutAl(normalizeArabic(value)) : '';
    const matches = q ? items.filter((o) => normalizeArabic(o.value).includes(q)) : items;
    // Names starting with what was typed come first.
    if (q) matches.sort((a, b) => Number(!withoutAl(normalizeArabic(a.value)).startsWith(q)) - Number(!withoutAl(normalizeArabic(b.value)).startsWith(q)));
    return matches.slice(0, MAX_SHOWN);
  }, [items, value, typed]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [open]);

  useEffect(() => {
    if (active >= 0) list.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setTyped(false);
    setActive(-1);
  };

  return (
    <div ref={box} className="relative">
      <input
        type="text"
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        placeholder={placeholder}
        onFocus={() => { setOpen(true); setTyped(false); }}
        onClick={() => setOpen(true)}
        onChange={(e) => { onChange(e.target.value); setTyped(true); setOpen(true); setActive(-1); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, shown.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === 'Enter' && open && active >= 0 && shown[active]) { e.preventDefault(); pick(shown[active].value); }
          else if (e.key === 'Escape' || e.key === 'Tab') setOpen(false);
        }}
        className={className || 'w-full text-xs font-semibold py-1.5 pr-2 pl-7 bg-neutral-50 border border-neutral-200 rounded-lg disabled:opacity-50'}
      />
      {items.length > 0 && !disabled && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="عرض القائمة"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { setOpen((o) => !o); setTyped(false); }}
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-neutral-400 cursor-pointer"
        >
          <ChevronDown size={13} />
        </button>
      )}
      {open && shown.length > 0 && (
        <ul ref={list} role="listbox" className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-lg py-1 text-right">
          {shown.map((o, i) => (
            <li
              key={o.value + (o.note || '') + i}
              role="option"
              aria-selected={o.value === value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(o.value)}
              onMouseEnter={() => setActive(i)}
              className={`px-2.5 py-1.5 text-xs cursor-pointer flex items-center justify-between gap-2 ${i === active ? 'bg-blue-50' : ''} ${o.value === value ? 'font-bold text-[#0071e3]' : 'text-neutral-700'}`}
            >
              <span>{o.value}</span>
              {o.note && <span className="text-[10px] text-neutral-400 truncate">{o.note}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

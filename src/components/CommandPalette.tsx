// Quick search (Ctrl/⌘+K): one box to reach anything in the editor by typing a few letters of its
// name: a setting of the selection, something to add, a page, a slide, an element on this page, or
// an action like preview or undo. Arrow keys move, Enter runs, Esc closes.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';

export interface PaletteCommand {
  id: string;
  title: string;
  // Where it belongs, shown on the right of the row and used to group the empty-search list.
  section: string;
  icon?: React.ReactNode;
  // Other words people may type for it.
  keywords?: string;
  hint?: string;
  run: () => void;
}

// Arabic is typed many ways: drop the short vowels and tatweel, and make the hamza forms, taa
// marbuta and alif maqsura match their plain letters.
export const normalizeSearch = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .trim();

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: PaletteCommand[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose, commands }) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const results = useMemo(() => {
    const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
    if (!words.length) return commands;
    return commands
      .map((c) => {
        const title = normalizeSearch(c.title);
        const hay = `${title} ${normalizeSearch(c.section)} ${normalizeSearch(c.keywords || '')}`;
        if (!words.every((w) => hay.includes(w))) return null;
        // Names that start with what was typed come first, then names that contain it.
        const score = title.startsWith(words[0]) ? 0 : title.includes(words[0]) ? 1 : 2;
        return { c, score };
      })
      .filter((x): x is { c: PaletteCommand; score: number } => !!x)
      .sort((a, b) => a.score - b.score)
      .map((x) => x.c);
  }, [query, commands]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const run = (c: PaletteCommand | undefined) => {
    if (!c) return;
    onClose();
    c.run();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="بحث سريع"
      className="fixed inset-0 z-[1000002] bg-black/25 backdrop-blur-[2px] flex items-start justify-center pt-[12vh] px-4 animate-[fade_0.15s_ease-out]"
      onMouseDown={onClose}
    >
      <div
        dir="rtl"
        className="w-full max-w-[560px] bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.25)] overflow-hidden border border-black/[0.06]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-neutral-200">
          <Search size={18} className="text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((i) => Math.min(results.length - 1, i + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((i) => Math.max(0, i - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                run(results[active]);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
            placeholder="ابحث عن إعداد، عنصر، صفحة أو أمر…"
            aria-label="ابحث"
            className="flex-1 h-full bg-transparent text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none"
          />
          <kbd className="text-[10px] font-mono text-neutral-400 border border-neutral-200 rounded-md px-1.5 py-0.5">Esc</kbd>
        </div>
        <div ref={listRef} role="listbox" className="max-h-[52vh] overflow-y-auto p-1.5">
          {results.length === 0 && <div className="py-10 text-center text-sm text-neutral-400">ما في نتائج. جرّب كلمة تانية.</div>}
          {results.map((c, i) => {
            const showSection = !query.trim() && (i === 0 || results[i - 1].section !== c.section);
            return (
              <React.Fragment key={c.id}>
                {showSection && <div className="px-3 pt-2.5 pb-1 text-[11px] font-bold text-neutral-400">{c.section}</div>}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => run(c)}
                  className={`w-full flex items-center gap-3 px-3 h-11 rounded-xl text-right cursor-pointer transition-colors ${i === active ? 'bg-[#0071e3]/10' : ''}`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${i === active ? 'bg-[#0071e3] text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                    {c.icon || <Search size={14} />}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-[13.5px] font-semibold text-neutral-900">{c.title}</span>
                  {c.hint && <kbd className="text-[10.5px] font-mono text-neutral-400">{c.hint}</kbd>}
                  {query.trim() && <span className="text-[11px] text-neutral-400 shrink-0">{c.section}</span>}
                  {i === active && <CornerDownLeft size={14} className="text-[#0071e3] shrink-0" />}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <div className="flex items-center gap-3 px-4 h-9 border-t border-neutral-100 text-[11px] text-neutral-400">
          <span>↑ ↓ للتنقل</span>
          <span>Enter للفتح</span>
        </div>
      </div>
    </div>
  );
};

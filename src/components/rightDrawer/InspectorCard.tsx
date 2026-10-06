// One group of settings in the docked panel: a card with an icon, a title and a one-line summary of
// the current values, that opens smoothly to show its settings. Its contents are drawn the first time
// it opens and kept afterwards, so closing and reopening animates both ways.
import React, { useEffect, useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface InspectorCardProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  summary?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  // Its place in the list: the cards come in one after another.
  index: number;
  flash?: boolean;
  // A short explanation, shown by the «؟» button.
  help?: string;
  children: React.ReactNode;
}

export const InspectorCard: React.FC<InspectorCardProps> = ({ id, icon, title, summary, open, onToggle, index, flash, help, children }) => {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(open);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Draw the contents closed first, then open them, so the height can animate.
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
  }, [open]);

  return (
    <section
      data-inspector-group={id}
      className={`inspector-card rounded-2xl border bg-white transition-[box-shadow,border-color,transform] duration-300 ${
        flash ? 'border-[#0071e3]' : shown ? 'border-transparent shadow-[0_1px_2px_rgba(16,24,40,0.05),0_8px_24px_rgba(16,24,40,0.08)]' : 'border-neutral-200 hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(16,24,40,0.07)]'
      }`}
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <div className="relative">
      <button type="button" onClick={onToggle} aria-expanded={open} className={`w-full flex items-center gap-2.5 p-3 text-right cursor-pointer ${help ? 'pl-16' : ''}`}>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${shown ? 'bg-[#0071e3]/10 text-[#0071e3]' : 'bg-neutral-100 text-neutral-500'}`}>
          {icon}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-bold text-neutral-900">{title}</span>
          {summary && (
            <span className={`block text-[11px] text-neutral-500 truncate transition-opacity duration-200 ${shown ? 'opacity-0 h-0' : 'opacity-100'}`}>{summary}</span>
          )}
        </span>
        <ChevronDown size={16} className={`text-neutral-400 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${shown ? 'rotate-180' : ''}`} />
      </button>
      {help && (
        <button
          type="button"
          onClick={() => setShowHelp((v) => !v)}
          aria-expanded={showHelp}
          aria-label={`شو هي ${title}؟`}
          title="شو هاد؟"
          className={`absolute left-9 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${showHelp ? 'bg-[#0071e3]/10 text-[#0071e3]' : 'text-neutral-300 hover:text-neutral-600 hover:bg-neutral-100'}`}
        >
          <HelpCircle size={15} />
        </button>
      )}
      </div>
      {help && showHelp && (
        <p className="mx-3 mb-2.5 -mt-1 rounded-xl bg-[#0071e3]/[0.06] px-3 py-2 text-[11.5px] leading-relaxed text-neutral-700 animate-[fade_0.2s_ease-out]">{help}</p>
      )}
      <div className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ gridTemplateRows: shown ? '1fr' : '0fr' }}>
        <div className="overflow-hidden min-h-0">
          {mounted && (
            <div className={`px-3 pb-3.5 space-y-4 transition-[opacity,transform] duration-300 ${shown ? 'opacity-100 translate-y-0 delay-75' : 'opacity-0 -translate-y-1.5'}`}>
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// A small heading between the sections inside one card (e.g. "الإطار" then "الظل").
export const InspectorSubheading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-2 pt-1 text-[11px] font-bold text-neutral-400">
    <span>{children}</span>
    <span className="flex-1 h-px bg-neutral-200" />
  </div>
);

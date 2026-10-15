// The tools over a design (gallery and admin): a light row of icons along the bottom edge, no background, that appears
// when the pointer is over the design (always there on a touch screen). An icon with choices opens a small pop-up menu.
// The parent must be `relative group`; the design itself stays alone on its card.
import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

const SHADOW = 'drop-shadow-[0_1px_3px_rgba(0,0,0,0.75)]';

export const ToolBar: React.FC<{ children: React.ReactNode; pinned?: boolean }> = ({ children, pinned }) => (
  <div dir="rtl" onClick={(e) => e.stopPropagation()} className={`tool-bar absolute inset-x-0 bottom-0 z-10 flex items-center gap-0.5 bg-gradient-to-t from-black/40 to-transparent px-2 pb-1.5 pt-7 text-white transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100 ${pinned ? 'opacity-100' : 'opacity-0'}`}>
    {children}
  </div>
);

export const ToolSpacer: React.FC = () => <span className="flex-1" />;

export const ToolButton: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void; count?: number | string; active?: boolean; disabled?: boolean }> = ({ label, icon, onClick, count, active, disabled }) => (
  <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled} onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-full px-1.5 text-xs font-bold transition hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 ${SHADOW} ${active ? 'text-[#7dd3fc]' : ''}`}>
    <span className={active ? '[&_svg]:fill-current' : ''}>{icon}</span>
    {count !== undefined && <span className="tabular-nums">{count}</span>}
  </button>
);

export interface MenuItem { id: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean; checked?: boolean; hint?: string }

// A small pop-up opening upwards from its icon; closes on a click outside, on Escape, or after a choice.
export const ToolMenu: React.FC<{ label?: string; header?: React.ReactNode; items: MenuItem[]; icon?: React.ReactNode }> = ({ label = 'المزيد', header, items, icon }) => {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', key, true);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', key, true); };
  }, [open]);
  return (
    <div ref={box} className="relative">
      <ToolButton label={label} icon={icon || <MoreHorizontal size={18} />} onClick={() => setOpen((v) => !v)} active={false} />
      {open && (
        <div role="menu" dir="rtl" className="absolute bottom-full left-0 z-30 mb-1 w-56 max-w-[70vw] overflow-hidden rounded-xl border border-line bg-surface text-ink shadow-xl">
          {header && <div className="border-b border-line px-3 py-2 text-xs">{header}</div>}
          <ul className="max-h-64 overflow-y-auto py-1">
            {items.map((it) => (
              <li key={it.id}>
                <button type="button" role="menuitem" disabled={it.disabled} onClick={(e) => { e.stopPropagation(); setOpen(false); it.onClick(); }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-start text-xs transition-colors hover:bg-bg disabled:opacity-40 ${it.danger ? 'text-danger' : ''}`}>
                  {it.icon && <span className="shrink-0 text-muted">{it.icon}</span>}
                  <span className="flex-1 truncate">{it.label}</span>
                  {it.checked !== undefined && <span className={`h-3.5 w-3.5 rounded-sm border ${it.checked ? 'border-brand bg-brand' : 'border-line'}`} aria-hidden />}
                  {it.hint && <span className="text-tiny text-faint">{it.hint}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// The column beside the docked panel (wide screens). At its head four fixed buttons: add, the page's
// structure, the restaurant/shop/showroom admin and Wee AI. Under them, the groups of settings of
// what is selected, each with its name, which scroll the panel to that group. A soft highlight
// slides to the group showing in the panel.
import React, { useLayoutEffect, useRef, useState } from 'react';
import { FolderTree, Layers, Move, PanelRightClose, PanelRightOpen, PanelTop, Palette, Plus, Shapes, SlidersHorizontal, Store, Type, Zap } from 'lucide-react';
import type { InspectorGroup, InspectorGroupId } from './rightDrawer/inspectorGroups';
import { WeeDots } from './ui/WeeDots';

export const EDITOR_COLUMN_WIDTH = 76;

const groupIcon = (g: InspectorGroup) => {
  switch (g.id) {
    case 'content': return g.sections.includes('navbar-settings') ? <PanelTop size={19} /> : <SlidersHorizontal size={19} />;
    case 'font': return <Type size={19} />;
    case 'colors': return <Palette size={19} />;
    case 'shape': return <Shapes size={19} />;
    case 'layout': return g.sections.length === 1 ? <Layers size={19} /> : <Move size={19} />;
    case 'motion': return <Zap size={19} />;
  }
};

interface EditorColumnProps {
  groups: InspectorGroup[];
  activeGroup: InspectorGroupId | null;
  onPickGroup: (id: InspectorGroupId) => void;
  onAdd: () => void;
  isAddShown: boolean;
  onStructure: () => void;
  isStructureShown: boolean;
  // The admin of the restaurant, shop or car showroom; absent for a plain website.
  admin?: { label: string; onOpen: () => void } | null;
  onWeeAi: () => void;
  isWeeAiOpen: boolean;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
}

const Tile: React.FC<{
  label: string;
  title?: string;
  icon: React.ReactNode;
  tint: string;
  active?: boolean;
  onClick: () => void;
}> = ({ label, title, icon, tint, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={title || label}
    aria-pressed={active || undefined}
    className={`group w-16 shrink-0 rounded-2xl pt-1.5 pb-1 flex flex-col items-center gap-1 text-[10.5px] font-semibold transition-colors cursor-pointer active:scale-95 ${
      active ? 'bg-black/[0.05] text-neutral-900' : 'text-neutral-700 hover:bg-black/[0.04] hover:text-neutral-900'
    }`}
  >
    <span className={`w-[38px] h-[38px] rounded-xl flex items-center justify-center transition-[transform,box-shadow] duration-200 ease-out group-hover:scale-110 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] ${tint}`}>
      {icon}
    </span>
    <span className="leading-tight">{label}</span>
  </button>
);

export const EditorColumn: React.FC<EditorColumnProps> = ({
  groups,
  activeGroup,
  onPickGroup,
  onAdd,
  isAddShown,
  onStructure,
  isStructureShown,
  admin,
  onWeeAi,
  isWeeAiOpen,
  isPanelOpen,
  onTogglePanel,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ top: number; height: number } | null>(null);

  // The highlight follows the group showing in the panel.
  useLayoutEffect(() => {
    const btn = activeGroup ? listRef.current?.querySelector<HTMLElement>(`[data-group="${activeGroup}"]`) : null;
    setPill(btn ? { top: btn.offsetTop, height: btn.offsetHeight } : null);
  }, [activeGroup, groups]);

  const groupKey = groups.map((g) => g.id + g.label).join('|');

  return (
    <nav dir="rtl" aria-label="أدوات التعديل" className="h-full w-full bg-white/95 backdrop-blur-xl border-l border-black/[0.07] flex flex-col items-center select-none">
      <div className="flex-1 w-full overflow-y-auto scrollbar-none flex flex-col items-center gap-0.5 py-2">
        <Tile label="إضافة" title="إضافة عنصر أو شريحة أو صفحة" icon={<Plus size={20} strokeWidth={2.2} />} tint="bg-emerald-50 text-emerald-600" active={isAddShown} onClick={onAdd} />
        <Tile label="الهيكل" title="هيكل الموقع: الصفحات والشرائح والعناصر" icon={<FolderTree size={19} />} tint="bg-amber-50 text-amber-600" active={isStructureShown} onClick={onStructure} />
        {admin && <Tile label="إدارة" title={admin.label} icon={<Store size={19} />} tint="bg-cyan-50 text-cyan-700" onClick={admin.onOpen} />}
        <Tile
          label="Wee AI"
          title="Wee AI: يكتب نصوص صفحتك من معلومات مشروعك"
          icon={<WeeDots size={26} />}
          tint="bg-gradient-to-br from-violet-50 to-blue-50"
          active={isWeeAiOpen}
          onClick={onWeeAi}
        />

        {groups.length > 0 && <div className="w-10 h-px bg-black/[0.08] my-1.5 shrink-0" />}

        <div ref={listRef} key={groupKey} className="relative flex flex-col items-center gap-0.5 animate-[fade_0.25s_ease-out]">
          {pill && (
            <span
              aria-hidden="true"
              className="absolute right-0 w-16 rounded-2xl bg-[#0071e3]/10 transition-[top,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ top: pill.top, height: pill.height }}
            />
          )}
          {groups.map((g) => {
            const on = g.id === activeGroup;
            return (
              <button
                key={g.id}
                type="button"
                data-group={g.id}
                onClick={() => onPickGroup(g.id)}
                title={g.title}
                aria-pressed={on || undefined}
                className={`group relative w-16 shrink-0 rounded-2xl pt-1.5 pb-1 flex flex-col items-center gap-1 text-[10.5px] font-semibold transition-colors cursor-pointer active:scale-95 ${
                  on ? 'text-[#0071e3]' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <span className="w-[38px] h-[38px] rounded-xl flex items-center justify-center transition-transform duration-200 ease-out group-hover:scale-110">
                  {groupIcon(g)}
                </span>
                <span className="leading-tight">{g.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full flex flex-col items-center py-2 border-t border-black/[0.06] shrink-0">
        <Tile
          label={isPanelOpen ? 'إخفاء' : 'إظهار'}
          title={isPanelOpen ? 'إخفاء لوحة التحكم' : 'إظهار لوحة التحكم'}
          icon={isPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          tint={isPanelOpen ? 'text-neutral-500' : 'bg-[#0071e3]/10 text-[#0071e3]'}
          onClick={onTogglePanel}
        />
      </div>
    </nav>
  );
};

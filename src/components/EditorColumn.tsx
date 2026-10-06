// The column beside the docked panel (wide screens). At its head four fixed buttons: add, the page's
// structure, the restaurant/shop/showroom admin and Wee AI. Under them, the groups of settings of
// what is selected, each with its name, which scroll the panel to that group. A soft highlight
// slides to the group showing in the panel.
import React, { useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, FolderTree, Layers, Move, PanelRightClose, PanelRightOpen, PanelTop, Palette, Plus, Search, Shapes, SlidersHorizontal, Sparkles, Store, Type, Zap } from 'lucide-react';
import type { InspectorGroup, InspectorGroupId } from './rightDrawer/inspectorGroups';
import { WeeDots } from './ui/WeeDots';

export const EDITOR_COLUMN_WIDTH = 76;
// The same icons as a bar along the bottom of a phone.
export const EDITOR_BAR_HEIGHT = 64;

const groupIcon = (g: InspectorGroup) => {
  switch (g.id) {
    case 'content': return g.sections.includes('navbar-settings') ? <PanelTop size={19} /> : <SlidersHorizontal size={19} />;
    case 'font': return <Type size={19} />;
    case 'effects': return <Sparkles size={19} />;
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
  onSearch?: () => void;
  // On a phone the icons lie in a bar along the bottom instead of a column on the side.
  horizontal?: boolean;
}

const Tile: React.FC<{
  label: string;
  title?: string;
  icon: React.ReactNode;
  tint: string;
  active?: boolean;
  compact?: boolean;
  onClick: () => void;
}> = ({ label, title, icon, tint, active, compact, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={title || label}
    aria-pressed={active || undefined}
    className={`group shrink-0 rounded-2xl flex flex-col items-center gap-1 font-semibold transition-colors cursor-pointer active:scale-95 ${
      compact ? 'w-[58px] py-1 text-[9.5px]' : 'w-16 pt-1.5 pb-1 text-[10.5px]'
    } ${active ? 'bg-black/[0.05] text-neutral-900' : 'text-neutral-700 hover:bg-black/[0.04] hover:text-neutral-900'}`}
  >
    <span className={`rounded-xl flex items-center justify-center transition-[transform,box-shadow] duration-200 ease-out group-hover:scale-110 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] ${compact ? 'w-8 h-8' : 'w-[38px] h-[38px]'} ${tint}`}>
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
  onSearch,
  horizontal,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ start: number; size: number } | null>(null);

  // The highlight follows the group showing in the panel.
  useLayoutEffect(() => {
    const btn = activeGroup ? listRef.current?.querySelector<HTMLElement>(`[data-group="${activeGroup}"]`) : null;
    if (!btn) {
      setPill(null);
      // In the bottom bar the settings of what was picked sit past the fixed buttons, so bring them
      // into view when the selection changes.
      if (horizontal) listRef.current?.querySelector<HTMLElement>('[data-group]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      return;
    }
    btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    setPill(horizontal ? { start: btn.offsetLeft, size: btn.offsetWidth } : { start: btn.offsetTop, size: btn.offsetHeight });
  }, [activeGroup, groups, horizontal]);

  const groupKey = groups.map((g) => g.id + g.label).join('|');

  return (
    <nav
      dir="rtl"
      aria-label="أدوات التعديل"
      className={`h-full w-full bg-white/95 backdrop-blur-xl select-none flex ${
        horizontal
          ? 'flex-row-reverse items-center border-t border-black/[0.07] shadow-[0_-6px_20px_rgba(0,0,0,0.08)] px-1'
          : 'flex-col items-center border-l border-black/[0.07]'
      }`}
    >
      <div
        className={`flex gap-0.5 scrollbar-none ${
          horizontal ? 'flex-1 min-w-0 h-full flex-row-reverse items-center overflow-x-auto px-1' : 'flex-1 w-full flex-col items-center overflow-y-auto py-2'
        }`}
      >
        <Tile label="إضافة" title="إضافة عنصر أو شريحة أو صفحة" icon={<Plus size={20} strokeWidth={2.2} />} tint="bg-emerald-50 text-emerald-600" active={isAddShown} compact={horizontal} onClick={onAdd} />
        <Tile label="الهيكل" title="هيكل الموقع: الصفحات والشرائح والعناصر" icon={<FolderTree size={19} />} tint="bg-amber-50 text-amber-600" active={isStructureShown} compact={horizontal} onClick={onStructure} />
        {admin && <Tile label="إدارة" title={admin.label} icon={<Store size={19} />} tint="bg-cyan-50 text-cyan-700" compact={horizontal} onClick={admin.onOpen} />}
        <Tile
          label="Wee AI"
          title="Wee AI: يكتب نصوص صفحتك من معلومات مشروعك"
          icon={<WeeDots size={horizontal ? 22 : 26} />}
          tint="bg-gradient-to-br from-violet-50 to-blue-50"
          active={isWeeAiOpen}
          compact={horizontal}
          onClick={onWeeAi}
        />

        {groups.length > 0 && <div className={`bg-black/[0.08] shrink-0 ${horizontal ? 'w-px h-9 mx-1.5' : 'w-10 h-px my-1.5'}`} />}

        <div
          ref={listRef}
          key={groupKey}
          className={`relative flex gap-0.5 animate-[fade_0.25s_ease-out] ${horizontal ? 'flex-row-reverse items-center' : 'flex-col items-center'}`}
        >
          {pill && (
            <span
              aria-hidden="true"
              className={`absolute rounded-2xl bg-[#0071e3]/10 transition-[top,height,right,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                horizontal ? 'top-0 bottom-0' : 'right-0 w-16'
              }`}
              style={horizontal ? { right: pill.start, width: pill.size } : { top: pill.start, height: pill.size }}
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
                className={`group relative shrink-0 rounded-2xl flex flex-col items-center gap-1 font-semibold transition-colors cursor-pointer active:scale-95 ${
                  horizontal ? 'w-[58px] py-1 text-[9.5px]' : 'w-16 pt-1.5 pb-1 text-[10.5px]'
                } ${on ? 'text-[#0071e3]' : 'text-neutral-500 hover:text-neutral-900'}`}
              >
                <span className={`rounded-xl flex items-center justify-center transition-transform duration-200 ease-out group-hover:scale-110 ${horizontal ? 'w-8 h-8' : 'w-[38px] h-[38px]'}`}>
                  {groupIcon(g)}
                </span>
                <span className="leading-tight">{g.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={`flex items-center shrink-0 ${
          horizontal ? 'h-full flex-row-reverse border-r border-black/[0.06] bg-white pr-1 pl-0.5' : 'w-full flex-col py-2 border-t border-black/[0.06]'
        }`}
      >
        {onSearch && (
          <Tile
            label="بحث"
            title={`بحث سريع (${(typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl')}+K)`}
            icon={<Search size={18} />}
            tint="text-neutral-600"
            compact={horizontal}
            onClick={onSearch}
          />
        )}
        <Tile
          label={isPanelOpen ? 'إخفاء' : 'إظهار'}
          title={isPanelOpen ? 'إخفاء لوحة التحكم' : 'إظهار لوحة التحكم'}
          icon={horizontal ? (isPanelOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />) : isPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          tint={isPanelOpen ? 'text-neutral-500' : 'bg-[#0071e3]/10 text-[#0071e3]'}
          compact={horizontal}
          onClick={onTogglePanel}
        />
      </div>
    </nav>
  );
};

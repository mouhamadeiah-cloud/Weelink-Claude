// A small dark bar that floats above the selected element on the canvas, with what is used most for
// that kind of element: the font for a text, swapping and shaping for a picture, and for everything
// copy, lock and delete. "More" opens the element's full settings in the panel.
import React from 'react';
import { AlignCenter, AlignLeft, AlignRight, Bold, Copy, Image as ImageIcon, Italic, Lock, MoreHorizontal, PaintRoller, Palette, Shapes, Trash2, Unlock } from 'lucide-react';
import type { CanvasElement } from '../types';
import type { InspectorGroupId } from './rightDrawer/inspectorGroups';

const TEXT_TYPES = ['heading', 'paragraph', 'button'];
const ALIGN_NEXT = { right: 'center', center: 'left', left: 'right' } as const;

// Shown in the buttons' tooltips; the shortcuts themselves live in App.
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
export const MOD_KEY = isMac ? '⌘' : 'Ctrl';

interface SelectionBarProps {
  element: CanvasElement;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onSetAlign: (align: 'right' | 'center' | 'left') => void;
  onFontSize: (size: number) => void;
  onReplaceImage: () => void;
  onOpenGroup: (group: InspectorGroupId | null) => void;
  onDuplicate: () => void;
  onCopyFormat: () => void;
  isFormatCopied: boolean;
  onToggleLock: () => void;
  onDelete: () => void;
}

const Btn: React.FC<{ title: string; on?: boolean; danger?: boolean; onClick: () => void; children: React.ReactNode }> = ({ title, on, danger, onClick, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={on || undefined}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`h-7 min-w-7 px-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer ${
      on ? 'bg-white/20 text-white' : danger ? 'text-white/80 hover:bg-red-500/80 hover:text-white' : 'text-white/80 hover:bg-white/15 hover:text-white'
    }`}
  >
    {children}
  </button>
);

const Sep = () => <span className="w-px h-4 bg-white/15 mx-0.5 shrink-0" />;

export const SelectionBar: React.FC<SelectionBarProps> = ({
  element,
  onToggleBold,
  onToggleItalic,
  onSetAlign,
  onFontSize,
  onReplaceImage,
  onOpenGroup,
  onDuplicate,
  onCopyFormat,
  isFormatCopied,
  onToggleLock,
  onDelete,
}) => {
  const st = element.styles || {};
  const isText = TEXT_TYPES.includes(element.type);
  const isImage = element.type === 'image';
  const size = Number(st.fontSize) || 16;
  const align = (st.textAlign || 'right') as 'right' | 'center' | 'left';
  const AlignIcon = align === 'center' ? AlignCenter : align === 'left' ? AlignLeft : AlignRight;

  return (
    <div
      dir="rtl"
      role="toolbar"
      aria-label="أدوات العنصر"
      className="selection-bar flex items-center gap-0.5 bg-[#1d1d1f]/95 backdrop-blur-md text-white rounded-xl p-1 shadow-[0_8px_24px_rgba(0,0,0,0.25)] whitespace-nowrap select-none"
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {isText && (
        <>
          <Btn title="تصغير الخط" onClick={() => onFontSize(Math.max(8, size - 2))}>
            <span className="text-[13px] font-bold leading-none">−</span>
          </Btn>
          <button
            type="button"
            title="حجم الخط"
            onClick={(e) => {
              e.stopPropagation();
              onOpenGroup('font');
            }}
            className="h-7 px-1 rounded-lg text-[11px] font-mono text-white/90 hover:bg-white/15 cursor-pointer"
          >
            {size}
          </button>
          <Btn title="تكبير الخط" onClick={() => onFontSize(Math.min(200, size + 2))}>
            <span className="text-[13px] font-bold leading-none">+</span>
          </Btn>
          <Sep />
          <Btn title={`عريض (${MOD_KEY}+B)`} on={st.fontWeight === 'bold'} onClick={onToggleBold}>
            <Bold size={14} />
          </Btn>
          <Btn title={`مائل (${MOD_KEY}+I)`} on={st.fontStyle === 'italic'} onClick={onToggleItalic}>
            <Italic size={14} />
          </Btn>
          <Btn title="المحاذاة" onClick={() => onSetAlign(ALIGN_NEXT[align])}>
            <AlignIcon size={14} />
          </Btn>
          <Btn title="الألوان" onClick={() => onOpenGroup('colors')}>
            <Palette size={14} />
          </Btn>
          <Sep />
        </>
      )}
      {isImage && (
        <>
          <Btn title="تبديل الصورة" onClick={onReplaceImage}>
            <ImageIcon size={14} />
            <span className="text-[11px] font-semibold">تبديل</span>
          </Btn>
          <Btn title="صورة بشكل" onClick={() => onOpenGroup('content')}>
            <Shapes size={14} />
          </Btn>
          <Sep />
        </>
      )}
      <Btn title={`تكرار (${MOD_KEY}+D)`} onClick={onDuplicate}>
        <Copy size={14} />
      </Btn>
      <Btn title={isFormatCopied ? 'انقر عنصراً لتطبيق التنسيق' : 'نسخ التنسيق'} on={isFormatCopied} onClick={onCopyFormat}>
        <PaintRoller size={14} />
      </Btn>
      <Btn title={element.isLocked ? 'فتح القفل' : 'قفل'} on={element.isLocked} onClick={onToggleLock}>
        {element.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
      </Btn>
      <Btn title="حذف (Delete)" danger onClick={onDelete}>
        <Trash2 size={14} />
      </Btn>
      <Sep />
      <Btn title="كل الإعدادات" onClick={() => onOpenGroup(null)}>
        <MoreHorizontal size={15} />
      </Btn>
    </div>
  );
};

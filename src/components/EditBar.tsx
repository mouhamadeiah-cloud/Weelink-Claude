import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Palette,
  Square,
  Sun,
  BoxSelect,
  SlidersHorizontal,
  PaintRoller,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Italic,
  Bold,
  Underline,
  List,
  ListOrdered,
  Zap,
  Layers,
  Link2,
  Grid3X3,
  ChevronUp,
  ChevronDown,
  Copy,
  Lock,
  Unlock,
  Plus,
  Sparkles,
  CreditCard,
  Settings,
  Scissors,
  Shapes,
  PanelRightOpen,
  PanelRightClose,
} from 'lucide-react';
import { CanvasElement, ElementType, Slide } from '../types';
import { DrawerSection } from './RightDrawer';
import { MASK_SHAPES } from '../utils/maskShapes';
import { CLIP_GROUPS } from '../utils/clipShapes';
import { elementDisplayName } from '../utils/elementLabels';

// The editing icons for what is selected: the navbar, a slide (nothing selected on it) or an element.
// Every icon either opens a section of the control panel (and closes it again when that section is
// already showing) or applies its change at once (bold, lock, duplicate...). An element shows only
// the icons that do something for its type.
//
// On a wide screen the bar is a vertical rail docked beside the control panel, and the selected
// element's name is edited at the head of the panel (SelectionNameInput); on a narrow screen it is the
// horizontal bar under the top bar, with the name at its start.

interface EditBarProps {
  selectedElement: CanvasElement | null;
  selectedSlide: Slide | null;
  onUpdateElementName: (newName: string) => void;
  onSelectTool: (tool: DrawerSection) => void;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleUnderline: () => void;
  onCycleAlignment: () => void;
  onToggleBulletList?: () => void;
  onToggleNumericList?: () => void;
  onToggleLock: () => void;
  onDuplicate: () => void;
  onMoveLayerUp: () => void;
  onMoveLayerDown: () => void;
  onCopyFormat?: () => void;
  isFormatCopied?: boolean;
  onToggleGroupContainer?: () => void;
  onUpdateElement?: (id: string, updates: Partial<CanvasElement>) => void;
  isNavbarSelected?: boolean;
  orientation?: 'horizontal' | 'vertical';
  // The control panel section showing right now (null when the panel is closed or shows the structure).
  shownSection?: DrawerSection | null;
  isPanelOpen?: boolean;
  onTogglePanel?: () => void;
}

// The name of what is selected, as shown to the user.
export const selectionName = (selectedElement: CanvasElement | null, selectedSlide: Slide | null, isNavbarSelected = false) =>
  isNavbarSelected ? 'النافبار' : selectedElement ? elementDisplayName(selectedElement) : selectedSlide ? selectedSlide.name : 'شريحة ١';

// The name of the selected element or slide, renamed on Enter or when leaving the field.
export const SelectionNameInput: React.FC<{ name: string; onRename: (name: string) => void; disabled?: boolean; className?: string }> = ({
  name,
  onRename,
  disabled = false,
  className = '',
}) => {
  const [value, setValue] = useState(name);
  useEffect(() => setValue(name), [name]);
  const commit = () => {
    if (value.trim()) onRename(value.trim());
    else setValue(name);
  };
  return (
    <input
      type="text"
      value={value}
      disabled={disabled}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit();
          (e.target as HTMLElement).blur();
        }
      }}
      title={disabled ? name : 'اسم العنصر أو الشريحة (اضغط Enter للحفظ)'}
      placeholder="اسم العنصر..."
      className={`text-xs font-semibold text-[#1d1d1f] bg-neutral-100/80 hover:bg-neutral-100 focus:bg-white px-2.5 py-1.5 rounded-lg border border-transparent focus:border-[#0071e3] focus:outline-none transition-all truncate text-right disabled:hover:bg-neutral-100/80 ${className}`}
    />
  );
};

// Elements whose own settings (in the panel's format section) are more than size and rotation.
const SETTINGS_TITLE: Partial<Record<ElementType, string>> = {
  gallery: 'إعدادات معرض الصور (الصور وترتيبها وتنسيقاتها)',
  table: 'إعدادات الجدول',
  calendar: 'إعدادات التقويم والحجز',
  video: 'إعدادات الفيديو',
  map: 'إعدادات الخريطة',
  cart: 'إعدادات السلة',
  checkout: 'إعدادات الطلب',
  carListings: 'إعدادات قائمة السيارات',
  carSearch: 'إعدادات بحث السيارات',
  menuList: 'إعدادات المنيو',
  menuCart: 'إعدادات سلة المطعم',
};

type Popover = 'clip' | 'mask';

type Tool =
  | { kind: 'sep' }
  | {
      kind: 'tool';
      id: string;
      title: string;
      icon: React.ReactNode;
      section?: DrawerSection;
      onClick?: () => void;
      popover?: Popover;
      on?: boolean;
      tone?: 'accent' | 'amber' | 'purple';
      pulse?: boolean;
    };

const sep: Tool = { kind: 'sep' };

// A square of 15px drawn like the background (filled) or the opacity (fading) icon.
const BackgroundIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="14" height="14" rx="2.5" fill="#8e8e93" />
  </svg>
);
const OpacityIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <defs>
      <linearGradient id="fadeSquareGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#636366" stopOpacity="1" />
        <stop offset="45%" stopColor="#8e8e93" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#aeaeb2" stopOpacity="0.08" />
      </linearGradient>
    </defs>
    <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" fill="url(#fadeSquareGrad)" stroke="#8e8e93" strokeWidth="1" strokeDasharray="2 1.5" />
  </svg>
);

export const EditBar: React.FC<EditBarProps> = ({
  selectedElement,
  selectedSlide,
  onUpdateElementName,
  onSelectTool,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onCycleAlignment,
  onToggleBulletList,
  onToggleNumericList,
  onToggleLock,
  onDuplicate,
  onMoveLayerUp,
  onMoveLayerDown,
  onCopyFormat,
  isFormatCopied,
  onToggleGroupContainer,
  onUpdateElement,
  isNavbarSelected = false,
  orientation = 'horizontal',
  shownSection = null,
  isPanelOpen = false,
  onTogglePanel,
}) => {
  const vertical = orientation === 'vertical';
  const el = isNavbarSelected ? null : selectedElement;
  const type = el?.type;
  const isText = type === 'heading' || type === 'paragraph' || type === 'button';

  // A short fade when the selection changes, so the new set of icons reads as new.
  const [isBlinking, setIsBlinking] = useState(false);
  useEffect(() => {
    setIsBlinking(true);
    const timer = setTimeout(() => setIsBlinking(false), 200);
    return () => clearTimeout(timer);
  }, [el?.id, type, selectedSlide?.id, isNavbarSelected]);

  // The image's clipping shapes and the mask's shapes open in a small list beside their icon.
  const [popover, setPopover] = useState<{ id: Popover; style: React.CSSProperties } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  useEffect(() => setPopover(null), [el?.id, isNavbarSelected]);
  useEffect(() => {
    if (!popover) return;
    const close = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (popoverRef.current?.contains(t) || t.closest('[data-popover-toggle]')) return;
      setPopover(null);
    };
    document.addEventListener('mousedown', close, true);
    return () => document.removeEventListener('mousedown', close, true);
  }, [popover]);

  const openPopover = (id: Popover, button: HTMLElement) => {
    if (popover?.id === id) {
      setPopover(null);
      return;
    }
    const r = button.getBoundingClientRect();
    const maxHeight = Math.min(420, window.innerHeight - 24);
    const style: React.CSSProperties = vertical
      ? { top: Math.max(12, Math.min(r.top, window.innerHeight - maxHeight - 12)), right: window.innerWidth - r.left + 8, maxHeight }
      : { top: r.bottom + 6, right: Math.max(12, window.innerWidth - r.right), maxHeight: Math.min(maxHeight, window.innerHeight - r.bottom - 18) };
    setPopover({ id, style });
  };

  const tools: Tool[] = [];
  const add = (...t: Tool[]) => tools.push(...t);

  // 1. What only this kind of target has.
  if (isNavbarSelected) {
    add({ kind: 'tool', id: 'navbar-settings', title: 'إعدادات النافبار (التثبيت، الطول، وأسماء الصفحات)', icon: <Settings size={15} />, section: 'navbar-settings', tone: 'accent' });
  } else if (el) {
    if (type === 'image') {
      add({ kind: 'tool', id: 'add-image', title: 'تبديل الصورة (من الجهاز، مكتبة الصور، أو رسومات)', icon: <Settings size={15} />, section: 'add-image', tone: 'accent' });
      if (onUpdateElement) add({ kind: 'tool', id: 'clip', title: 'قص الحواف الفني', icon: <Scissors size={15} />, popover: 'clip', on: !!el.clipPath });
    } else if (type === 'mask' && onUpdateElement) {
      add({ kind: 'tool', id: 'mask', title: 'شكل الصورة', icon: <Shapes size={15} />, popover: 'mask' });
    }
    const settings = type ? SETTINGS_TITLE[type] : undefined;
    if (settings) {
      const section: DrawerSection = type === 'gallery' ? 'gallery' : 'format';
      add({ kind: 'tool', id: section, title: settings, icon: type === 'table' ? <Grid3X3 size={15} /> : <Settings size={15} />, section, tone: 'accent' });
    }
    if (isText) {
      const align = el.styles?.textAlign || 'right';
      add(
        sep,
        { kind: 'tool', id: 'fontSize', title: 'حجم الخط', icon: <span className="font-serif font-bold text-[14px] leading-none">T</span>, section: 'fontSize' },
        {
          kind: 'tool',
          id: 'fontFamily',
          title: 'نوع الخط',
          icon: (
            <span className="font-sans font-bold leading-none tracking-tight flex items-baseline">
              <span className="text-[13px]">a</span>
              <span className="text-[11px] font-extrabold text-[#0071e3]">A</span>
            </span>
          ),
          section: 'fontFamily',
        },
        {
          kind: 'tool',
          id: 'align',
          title: `محاذاة النص: ${align === 'right' ? 'يمين' : align === 'center' ? 'وسط' : 'يسار'}`,
          icon: align === 'center' ? <AlignCenter size={15} /> : align === 'left' ? <AlignLeft size={15} /> : <AlignRight size={15} />,
          onClick: onCycleAlignment,
        },
        { kind: 'tool', id: 'bold', title: 'عريض', icon: <Bold size={15} strokeWidth={2.4} />, onClick: onToggleBold, on: el.styles?.fontWeight === 'bold' },
        { kind: 'tool', id: 'italic', title: 'مائل', icon: <Italic size={15} />, onClick: onToggleItalic, on: el.styles?.fontStyle === 'italic' },
        { kind: 'tool', id: 'underline', title: 'تسطير', icon: <Underline size={15} />, onClick: onToggleUnderline, on: el.styles?.textDecoration === 'underline' }
      );
      // Only a paragraph draws its lines as a list.
      if (type === 'paragraph') {
        add(
          { kind: 'tool', id: 'bullet', title: 'تعداد نقطي', icon: <List size={15} />, onClick: onToggleBulletList, on: el.styles?.listStyle === 'bullet' },
          { kind: 'tool', id: 'numeric', title: 'تعداد رقمي', icon: <ListOrdered size={15} />, onClick: onToggleNumericList, on: el.styles?.listStyle === 'numeric' }
        );
      }
    }
    if (type === 'shape' && onToggleGroupContainer) {
      add({
        kind: 'tool',
        id: 'group',
        title: el.isGroupContainer ? 'إلغاء تفعيل المجموعة' : 'تحويل لمجموعة (سحب العناصر فوقها يضمهم إليها)',
        icon: <CreditCard size={15} />,
        onClick: onToggleGroupContainer,
        on: !!el.isGroupContainer,
      });
    }
    if (!settings && type !== 'gallery') {
      add({ kind: 'tool', id: 'format', title: 'الأبعاد والتدوير', icon: <SlidersHorizontal size={15} />, section: 'format' });
    }
  }

  // 2. Appearance. A slide is coloured by its background; an image by its filters (no background).
  add(sep);
  if (isNavbarSelected || el) add({ kind: 'tool', id: 'color', title: type === 'image' ? 'الفلاتر والتلوين' : 'اللون', icon: <Palette size={15} />, section: 'color' });
  if (type !== 'image') {
    add({ kind: 'tool', id: 'background', title: type === 'mask' ? 'لون إطار الصورة (طابقه مع خلفية الشريحة)' : 'الخلفية', icon: <BackgroundIcon />, section: 'background' });
  }
  add(
    { kind: 'tool', id: 'border', title: 'الإطار', icon: <Square size={15} />, section: 'border' },
    { kind: 'tool', id: 'opacity', title: 'الشفافية', icon: <OpacityIcon />, section: 'opacity' },
    { kind: 'tool', id: 'lighting', title: 'الإضاءة والسطوع', icon: <Sun size={15} />, section: 'lighting' },
    { kind: 'tool', id: 'shadow', title: 'الظلال', icon: <BoxSelect size={15} />, section: 'shadow' }
  );
  if (onCopyFormat) {
    add({
      kind: 'tool',
      id: 'painter',
      title: isFormatCopied ? 'نشط: انقر على أي عنصر لتطبيق هذا التنسيق' : 'نسخ التنسيق',
      icon: <PaintRoller size={15} />,
      onClick: onCopyFormat,
      on: !!isFormatCopied,
      pulse: !!isFormatCopied,
    });
  }

  // 3. The element as a whole.
  add(sep);
  if (el) {
    add(
      { kind: 'tool', id: 'link', title: 'رابط', icon: <Link2 size={15} />, section: 'link', on: !!el.linkUrl },
      { kind: 'tool', id: 'animation', title: 'الحركات والتأثيرات', icon: <Zap size={15} />, section: 'animation' }
    );
  }
  if (!isNavbarSelected) add({ kind: 'tool', id: 'layers', title: 'الطبقات', icon: <Layers size={15} />, section: 'layers' });
  if (el) {
    add(
      { kind: 'tool', id: 'up', title: 'طبقة لأعلى', icon: <ChevronUp size={15} />, onClick: onMoveLayerUp },
      { kind: 'tool', id: 'down', title: 'طبقة لأسفل', icon: <ChevronDown size={15} />, onClick: onMoveLayerDown },
      { kind: 'tool', id: 'duplicate', title: 'تكرار العنصر', icon: <Copy size={15} />, onClick: onDuplicate },
      {
        kind: 'tool',
        id: 'lock',
        title: el.isLocked ? 'إلغاء القفل' : 'قفل العنصر',
        icon: el.isLocked ? <Lock size={15} /> : <Unlock size={15} />,
        onClick: onToggleLock,
        on: !!el.isLocked,
        tone: 'amber',
      }
    );
  }
  add({ kind: 'tool', id: 'elements', title: 'إضافة عنصر', icon: <Plus size={16} strokeWidth={2.2} />, section: 'elements' });
  if (el) add({ kind: 'tool', id: 'wee-ai', title: 'مساعد Wee AI', icon: <Sparkles size={15} />, section: 'wee-ai', tone: 'purple' });

  const size = vertical ? 'w-9 h-9' : 'w-8 h-8';

  const renderTool = (t: Tool, i: number) => {
    if (t.kind === 'sep') {
      const prev = tools[i - 1];
      if (!prev || prev.kind === 'sep') return null;
      return <div key={`sep-${i}`} className={vertical ? 'w-6 h-px bg-black/[0.08] my-1 shrink-0' : 'h-4 w-px bg-black/[0.08] mx-0.5 shrink-0'} />;
    }
    const shown = !!t.section && t.section === shownSection;
    const active = shown || t.on || (t.popover && popover?.id === t.popover);
    const tone =
      t.tone === 'purple'
        ? active ? 'bg-purple-100 text-purple-700' : 'text-purple-600 hover:bg-purple-50'
        : t.tone === 'amber' && t.on
          ? 'bg-amber-500/15 text-amber-600'
          : active
            ? 'bg-[#0071e3]/15 text-[#0071e3] ring-1 ring-[#0071e3]/40'
            : t.tone === 'accent'
              ? 'text-[#0071e3] hover:bg-[#0071e3]/10'
              : 'text-neutral-600 hover:text-black hover:bg-black/[0.05]';
    return (
      <button
        key={t.id}
        type="button"
        data-popover-toggle={t.popover ? '' : undefined}
        aria-pressed={active ? true : undefined}
        onClick={(e) => {
          if (t.popover) openPopover(t.popover, e.currentTarget);
          else if (t.section) onSelectTool(t.section);
          else t.onClick?.();
        }}
        className={`${size} shrink-0 rounded-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer relative ${tone} ${t.pulse ? 'animate-pulse' : ''}`}
        title={t.section && shown ? `${t.title} (انقر لإغلاق اللوحة)` : t.title}
        aria-label={t.title}
      >
        {t.icon}
      </button>
    );
  };

  // In a portal: the bars' blur and transforms would otherwise clip and move a fixed list.
  const popoverList =
    popover && el && onUpdateElement ? createPortal(
      <div
        ref={popoverRef}
        dir="rtl"
        style={popover.style}
        className="fixed z-[1000000] w-64 overflow-y-auto bg-white rounded-2xl border border-black/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.16)] p-1.5 text-right"
      >
        {popover.id === 'clip' ? (
          <>
            <div className="text-[11px] font-bold text-emerald-700 px-2 py-1">قص الحواف الفني</div>
            <PopoverOption label="🔲 بدون قص (مستطيل طبيعي)" on={!el.clipPath} onPick={() => onUpdateElement(el.id, { clipPath: undefined })} />
            {CLIP_GROUPS.map((g) => (
              <div key={g.label} className="mt-1">
                <div className="text-[10px] font-bold text-neutral-400 px-2 pt-1.5 pb-0.5">{g.label}</div>
                {g.options.map(([value, label]) => (
                  <PopoverOption key={value} label={label} on={el.clipPath === value} onPick={() => onUpdateElement(el.id, { clipPath: value })} />
                ))}
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="text-[11px] font-bold text-neutral-500 px-2 py-1">شكل الصورة</div>
            {MASK_SHAPES.map((m) => (
              <PopoverOption key={m.id} label={m.name} on={(el.content || 'circle') === m.id} onPick={() => onUpdateElement(el.id, { content: m.id })} />
            ))}
          </>
        )}
      </div>,
      document.body
    ) : null;

  const items = <>{tools.map(renderTool)}</>;

  if (vertical) {
    return (
      <nav
        dir="rtl"
        aria-label="أدوات التعديل"
        className="h-full w-full bg-white/95 backdrop-blur-xl border-l border-black/[0.07] flex flex-col items-center select-none"
      >
        {onTogglePanel && (
          <div className="w-full flex flex-col items-center py-2 border-b border-black/[0.06] shrink-0">
            <button
              type="button"
              onClick={onTogglePanel}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                isPanelOpen ? 'text-neutral-600 hover:text-black hover:bg-black/[0.05]' : 'text-[#0071e3] bg-[#0071e3]/10 hover:bg-[#0071e3]/15'
              }`}
              title={isPanelOpen ? 'إخفاء لوحة التحكم' : 'إظهار لوحة التحكم'}
              aria-label={isPanelOpen ? 'إخفاء لوحة التحكم' : 'إظهار لوحة التحكم'}
            >
              {isPanelOpen ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
            </button>
          </div>
        )}
        <div
          className={`flex-1 w-full overflow-y-auto scrollbar-none flex flex-col items-center gap-1 py-2 transition-opacity duration-200 ${
            isBlinking ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {items}
        </div>
        {popoverList}
      </nav>
    );
  }

  return (
    <div
      className="w-full bg-white/95 backdrop-blur-xl border-b border-black/[0.06] px-3 sm:px-6 h-12 flex items-center justify-between z-30 transition-all select-none overflow-x-auto scrollbar-none"
      dir="rtl"
    >
      <div
        className={`flex items-center gap-1 sm:gap-1.5 min-w-max transition-all duration-200 ${
          isBlinking ? 'opacity-0 scale-95 translate-y-0.5 pointer-events-none' : 'opacity-100 scale-100 translate-y-0'
        }`}
      >
        <div className="flex items-center pl-2 ml-1 border-l border-black/[0.08]">
          <SelectionNameInput
            name={selectionName(selectedElement, selectedSlide, isNavbarSelected)}
            onRename={onUpdateElementName}
            disabled={isNavbarSelected}
            className="w-28 sm:w-36"
          />
        </div>
        {items}
      </div>
      {popoverList}
    </div>
  );
};

const PopoverOption: React.FC<{ label: string; on: boolean; onPick: () => void }> = ({ label, on, onPick }) => (
  <button
    type="button"
    onClick={onPick}
    className={`w-full text-right px-2.5 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer ${
      on ? 'bg-[#0071e3] text-white' : 'text-neutral-700 hover:bg-neutral-100'
    }`}
  >
    {label}
  </button>
);

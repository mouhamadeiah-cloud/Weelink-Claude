import React, { useState, useEffect } from 'react';
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
  Settings
} from 'lucide-react';
import { CanvasElement, Slide } from '../types';
import { DrawerSection } from './RightDrawer';
import { MASK_SHAPES } from '../utils/maskShapes';

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
}

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
}) => {
  const currentTargetName = selectedElement 
    ? selectedElement.name 
    : (selectedSlide ? selectedSlide.name : 'شريحة ١');

  const [nameInput, setNameInput] = useState(currentTargetName);

  useEffect(() => {
    setNameInput(currentTargetName);
  }, [currentTargetName]);

  const handleNameBlur = () => {
    if (nameInput.trim()) {
      onUpdateElementName(nameInput.trim());
    } else {
      setNameInput(currentTargetName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameBlur();
      (e.target as HTMLElement).blur();
    }
  };

  const isBold = selectedElement?.styles?.fontWeight === 'bold';
  const isItalic = selectedElement?.styles?.fontStyle === 'italic';
  const isUnderline = selectedElement?.styles?.textDecoration === 'underline';
  const isBulletList = selectedElement?.styles?.listStyle === 'bullet';
  const isNumericList = selectedElement?.styles?.listStyle === 'numeric';
  const isLocked = selectedElement ? !!selectedElement.isLocked : false;
  const textAlign = selectedElement?.styles?.textAlign || 'right';

  // Determine if a text element is currently in editing mode
  const isTextEditing = Boolean(
    selectedElement && (
      selectedElement.type === 'heading' ||
      selectedElement.type === 'paragraph' ||
      selectedElement.type === 'button'
    )
  );

  // State for blink animation: disappears for a brief moment then displays icons
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    setIsBlinking(true);
    const timer = setTimeout(() => {
      setIsBlinking(false);
    }, 200); // Disappears for a moment (200ms)
    return () => clearTimeout(timer);
  }, [selectedElement?.id, selectedElement?.type, selectedSlide?.id, isTextEditing]);

  const isSlideSelected = selectedElement === null;

  return (
    <div 
      className="w-full bg-white/95 backdrop-blur-xl border-b border-black/[0.06] px-3 sm:px-6 h-12 flex items-center justify-between z-30 transition-all select-none overflow-x-auto scrollbar-none"
      dir="rtl"
    >
      {/* Container wrapper for brief blink/transition effect */}
      <div 
        className={`flex items-center gap-1 sm:gap-1.5 min-w-max transition-all duration-200 ${
          isBlinking ? 'opacity-0 scale-95 translate-y-0.5 pointer-events-none' : 'opacity-100 scale-100 translate-y-0'
        }`}
      >
        
        {/* Name of active element / slide */}
        <div className="flex items-center pl-2 ml-1 border-l border-black/[0.08]">
          <div className="relative flex items-center">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={handleKeyDown}
              title="اسم العنصر أو الشريحة (اضغط Enter للحفظ)"
              placeholder="اسم العنصر..."
              className="w-28 sm:w-36 text-xs font-semibold text-[#1d1d1f] bg-neutral-100/80 hover:bg-neutral-100 focus:bg-white px-2.5 py-1.5 rounded-lg border border-transparent focus:border-[#0071e3] focus:outline-none transition-all truncate text-right shadow-2xs"
            />
          </div>
        </div>

        {/* 1. أيقونة اللون */}
        {!isSlideSelected && (
          <button
            type="button"
            onClick={() => onSelectTool('color')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-black hover:bg-black/[0.05] active:scale-95 transition-all cursor-pointer"
            title="اللون (فتح في لوحة التحكم)"
            aria-label="لون"
          >
            <Palette size={15} strokeWidth={2} />
          </button>
        )}

        {/* 2. أيقونة الخلفية: مربع رمادي - تُخفى عند تعديل صورة */}
        {selectedElement?.type !== 'image' && (
          <button
            type="button"
            onClick={() => onSelectTool('background')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-black hover:bg-black/[0.05] active:scale-95 transition-all cursor-pointer"
            title="الخلفية (فتح في لوحة التحكم)"
            aria-label="خلفية"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="14" height="14" rx="2.5" fill="#8e8e93" />
            </svg>
          </button>
        )}

        {/* 3. أيقونة الإطار */}
        <button
          type="button"
          onClick={() => onSelectTool('border')}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-black hover:bg-black/[0.05] active:scale-95 transition-all cursor-pointer"
          title="الإطار (فتح في لوحة التحكم)"
          aria-label="إطار"
        >
          <Square size={15} strokeWidth={2} />
        </button>

        {/* 4. نسخ التصميم (رول الدهان) - لا يفتح لوحة التحكم */}
        {onCopyFormat && (
          <button
            type="button"
            onClick={onCopyFormat}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
              isFormatCopied 
                ? 'bg-[#0071e3]/15 text-[#0071e3] ring-1 ring-[#0071e3]/40 animate-pulse' 
                : 'text-neutral-600 hover:text-black hover:bg-black/[0.05] active:scale-95'
            }`}
            title={isFormatCopied ? "نشط: انقر على أي عنصر لتطبيق هذا التنسيق فوراً" : "نسخ التصميم (رول الدهان)"}
            aria-label="نسخ التصميم"
          >
            <PaintRoller size={15} strokeWidth={2} />
            {isFormatCopied && (
              <span className="absolute -top-1 -left-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0071e3] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0071e3]"></span>
              </span>
            )}
          </button>
        )}

        {/* 5. أيقونة الشفافية: مربع متلاشي */}
        <button
          type="button"
          onClick={() => onSelectTool('opacity')}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-black hover:bg-black/[0.05] active:scale-95 transition-all cursor-pointer"
          title="الشفافية (فتح في لوحة التحكم)"
          aria-label="شفافية"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <defs>
              <linearGradient id="fadeSquareGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#636366" stopOpacity="1" />
                <stop offset="45%" stopColor="#8e8e93" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#aeaeb2" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            <rect 
              x="1.5" 
              y="1.5" 
              width="13" 
              height="13" 
              rx="2.5" 
              fill="url(#fadeSquareGrad)" 
              stroke="#8e8e93" 
              strokeWidth="1" 
              strokeDasharray="2 1.5" 
            />
          </svg>
        </button>

        {/* 6. أيقونة الإضاءة */}
        <button
          type="button"
          onClick={() => onSelectTool('lighting')}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-black hover:bg-black/[0.05] active:scale-95 transition-all cursor-pointer"
          title="الإضاءة والسطوع (فتح في لوحة التحكم)"
          aria-label="إضاءة"
        >
          <Sun size={15} strokeWidth={2} />
        </button>

        {/* 7. أيقونة الظلال */}
        <button
          type="button"
          onClick={() => onSelectTool('shadow')}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-black hover:bg-black/[0.05] active:scale-95 transition-all cursor-pointer"
          title="الظلال (فتح في لوحة التحكم)"
          aria-label="ظلال"
        >
          <BoxSelect size={15} strokeWidth={2} />
        </button>

        {/* ترس إعدادات المعرض - يظهر عند تحديد معرض صور */}
        {selectedElement?.type === 'gallery' && (
          <button
            type="button"
            onClick={() => onSelectTool('gallery')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[#0071e3] bg-[#0071e3]/12 hover:bg-[#0071e3]/20 active:scale-95 transition-all cursor-pointer ring-1 ring-[#0071e3]/30"
            title="إعدادات المعرض (الصور الـ 5 وترتيبها وتنسيقاتها)"
            aria-label="إعدادات المعرض"
          >
            <Settings size={15} strokeWidth={2} />
          </button>
        )}

        {/* ترس إعدادات الصورة - يظهر عند تحديد صورة لتغيير مصدرها وتبديلها من لوحة الإعدادات */}
        {selectedElement?.type === 'image' && (
          <button
            type="button"
            onClick={() => onSelectTool('add-image')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[#0071e3] bg-[#0071e3]/12 hover:bg-[#0071e3]/20 active:scale-95 transition-all cursor-pointer ring-1 ring-[#0071e3]/30"
            title="تبديل الصورة (رفع من الجهاز، المعرض، أو جرافيك)"
            aria-label="تبديل الصورة"
          >
            <Settings size={15} strokeWidth={2} />
          </button>
        )}

        {/* ميزة قص حواف الصورة الفنية (Geometric Clipping Mask) */}
        {selectedElement?.type === 'image' && onUpdateElement && (
          <>
            <div className="h-4 w-px bg-black/[0.08] mx-0.5" />
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/50">
              <span className="text-[10px] font-bold text-emerald-700 whitespace-nowrap">قص الحواف الفني:</span>
              <select
                value={selectedElement.clipPath || ''}
                onChange={(e) => onUpdateElement(selectedElement.id, { clipPath: e.target.value || undefined })}
                className="text-[11px] font-bold text-emerald-900 bg-white hover:bg-neutral-50 px-2 py-0.5 rounded-md border border-emerald-200 focus:border-emerald-500 focus:outline-none cursor-pointer transition-all"
                title="اختر شكلاً هندسياً أو بقعة فنية لقص حواف الصورة بها"
              >
                <option value="">🔲 بدون قص (مستطيل طبيعي)</option>
                
                {/* 1. الأشكال الهندسية المعروفة */}
                <optgroup label="📐 أشكال هندسية معروفة">
                  <option value="clip-shape-geo-circle">⚪ دائرة مثالية منتظمة</option>
                  <option value="clip-shape-geo-capsule">💊 كبسولة مستديرة الأطراف</option>
                  <option value="clip-shape-geo-hexagon">⬡ سداسي أضلاع متناسق</option>
                  <option value="clip-shape-geo-octagon">🛑 ثماني أضلاع معماري</option>
                  <option value="clip-shape-geo-triangle">🔺 مثلث متساوي الأضلاع</option>
                  <option value="clip-shape-geo-three-quarters">🍰 ثلاث أرباع الدائرة</option>
                  <option value="clip-shape-geo-leaf-opposite">🍃 حواف منحنية متعاكسة (ورقة شجر)</option>
                </optgroup>

                {/* 2. أطقم البازل والقطع المتداخلة */}
                <optgroup label="🧩 أشكال بازل (Puzzle & Bezier)">
                  <option value="clip-shape-geo-puzzle-a">🧩 قطعة أحجية كلاسيكية</option>
                  <option value="clip-shape-geo-puzzle-b">🧩 قطعة أحجية بارزة ثلاثية الأبعاد</option>
                </optgroup>

                {/* 3. العمارة والأقواس الفاخرة */}
                <optgroup label="🏛️ أقواس وعمارة فاخرة">
                  <option value="clip-shape-arch-classic">🏛️ قوس كلاسيكي</option>
                  <option value="clip-shape-arch-gothic">🛕 قوس قوطي مدبب</option>
                  <option value="clip-shape-window-arch">🪟 نافذة مقوسة مزدوجة</option>
                  <option value="clip-shape-arch-dome">🕌 قبة إسلامية دائرية</option>
                  <option value="clip-shape-mosque">🕌 قبة مسجد مدببة</option>
                </optgroup>

                {/* 4. ضربات الفرشاة الفوضوية والأطراف العشوائية */}
                <optgroup label="🎨 ضربات فرشاة خشنة وأطراف عشوائية">
                  <option value="clip-shape-brush-messy">🖌️ ضربة فرشاة فوضوية خشنة</option>
                  <option value="clip-shape-brush-scratch">⚡ مسحة خدش حادة</option>
                  <option value="clip-shape-brush-dripping">💧 أطراف متقطرة منسابة</option>
                  <option value="clip-shape-brush-corona">☀️ وهج فرشاة عشوائي متموج</option>
                  <option value="clip-shape-brush-splodge">🎨 بقعة طلاء فنية حرة</option>
                  <option value="clip-shape-brush-watercolor">🎨 ضربة فرشاة ألوان مائية ناعمة</option>
                  <option value="clip-shape-brush-splatter">🌌 بقعة حبر متناثرة</option>
                  <option value="clip-shape-brush-swipe">🖌️ مسحة فرشاة عريضة</option>
                </optgroup>

                {/* 5. الطبيعة والقلوب الرومانسية */}
                <optgroup label="🌿 الطبيعة والجماليات">
                  <option value="clip-shape-dew-drop">💧 قطرة الندى</option>
                  <option value="clip-shape-leaf-classic">🍃 ورقة شجر كلاسيكية</option>
                  <option value="clip-shape-petal">🌸 بتلة زهرة ناعمة</option>
                  <option value="clip-shape-lotus">🪷 زهرة اللوتس الفاخرة</option>
                  <option value="clip-shape-blob-splash">💦 بقعة مائية متموجة (Blob)</option>
                  <option value="clip-shape-blob-org-a">🌊 تموج مائي منساب A</option>
                  <option value="clip-shape-blob-org-b">🌊 تموج مائي منساب B</option>
                  <option value="clip-shape-blob-cloud">☁️ سحابة كرتونية لطيفة</option>
                  <option value="clip-shape-blob-bubble">🫧 فقاعة ناعمة دائرية</option>
                  <option value="clip-shape-blob-amoeba">🦠 بقعة أميبية حرة</option>
                  <option value="clip-shape-heart">❤️ قلب رومانسي دافئ</option>
                  <option value="clip-shape-crescent-moon">🌙 هلال ناعم فريد</option>
                </optgroup>
              </select>
            </div>
          </>
        )}

        {/* إذا كان العنصر غير نصي، نظهر أداة التنسيق العامة */}
        {!isTextEditing && !isSlideSelected && (
          <button
            type="button"
            onClick={() => onSelectTool('format')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-black hover:bg-black/[0.05] active:scale-95 transition-all cursor-pointer"
            title="التنسيق العام (فتح في لوحة التحكم)"
            aria-label="تنسيق"
          >
            <SlidersHorizontal size={15} strokeWidth={2} />
          </button>
        )}

        {/* 8. أيقونات تعديل النص - تظهر عند تحديد نص */}
        {isTextEditing && (
          <>
            <div className="h-4 w-px bg-black/[0.08] mx-0.5" />

            {/* تنسيق/محاذاة النص: يطبق مباشرة دون فتح اللوحة */}
            <button
              type="button"
              onClick={onCycleAlignment}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:text-black hover:bg-black/[0.05] active:scale-95 transition-all cursor-pointer"
              title={`محاذاة النص: ${textAlign === 'right' ? 'يمين' : textAlign === 'center' ? 'وسط' : 'يسار'} (تعديل مباشر)`}
              aria-label="محاذاة النص"
            >
              {textAlign === 'right' && <AlignRight size={15} strokeWidth={2} />}
              {textAlign === 'center' && <AlignCenter size={15} strokeWidth={2} />}
              {textAlign === 'left' && <AlignLeft size={15} strokeWidth={2} />}
            </button>

            {/* ميلان النص (Italic): يطبق مباشرة دون فتح اللوحة */}
            <button
              type="button"
              onClick={onToggleItalic}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isItalic 
                  ? 'bg-[#0071e3]/15 text-[#0071e3] font-bold' 
                  : 'text-neutral-700 hover:text-black hover:bg-black/[0.05] active:scale-95'
              }`}
              title="ميلان النص (تعديل مباشر)"
              aria-label="ميلان"
            >
              <Italic size={15} strokeWidth={2} />
            </button>

            {/* سمك الخط (Bold): يطبق مباشرة دون فتح اللوحة */}
            <button
              type="button"
              onClick={onToggleBold}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isBold 
                  ? 'bg-[#0071e3]/15 text-[#0071e3] font-bold' 
                  : 'text-neutral-700 hover:text-black hover:bg-black/[0.05] active:scale-95'
              }`}
              title="سمك الخط (تعديل مباشر)"
              aria-label="عريض"
            >
              <Bold size={15} strokeWidth={2.4} />
            </button>

            {/* الخط تحت النص (Underline): يطبق مباشرة دون فتح اللوحة */}
            <button
              type="button"
              onClick={onToggleUnderline}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isUnderline 
                  ? 'bg-[#0071e3]/15 text-[#0071e3] font-bold' 
                  : 'text-neutral-700 hover:text-black hover:bg-black/[0.05] active:scale-95'
              }`}
              title="تسطير النص (تعديل مباشر)"
              aria-label="تسطير"
            >
              <Underline size={15} strokeWidth={2} />
            </button>

            {/* التعداد النقطي: يطبق مباشرة دون فتح اللوحة */}
            <button
              type="button"
              onClick={onToggleBulletList}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isBulletList 
                  ? 'bg-[#0071e3]/15 text-[#0071e3] font-bold' 
                  : 'text-neutral-700 hover:text-black hover:bg-black/[0.05] active:scale-95'
              }`}
              title="تعداد نقطي (تعديل مباشر)"
              aria-label="تعداد نقطي"
            >
              <List size={15} strokeWidth={2} />
            </button>

            {/* التعداد الرقمي: يطبق مباشرة دون فتح اللوحة */}
            <button
              type="button"
              onClick={onToggleNumericList}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isNumericList 
                  ? 'bg-[#0071e3]/15 text-[#0071e3] font-bold' 
                  : 'text-neutral-700 hover:text-black hover:bg-black/[0.05] active:scale-95'
              }`}
              title="تعداد رقمي (تعديل مباشر)"
              aria-label="تعداد رقمي"
            >
              <ListOrdered size={15} strokeWidth={2} />
            </button>

            {/* حجم الخط (T) - يفتح لوحة التحكم على تعديل النص */}
            <button
              type="button"
              onClick={() => onSelectTool('fontSize')}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:text-[#0071e3] hover:bg-black/[0.05] active:scale-95 transition-all cursor-pointer"
              title="حجم الخط (T) - فتح في لوحة التحكم"
              aria-label="حجم الخط"
            >
              <span className="font-serif font-bold text-[14px] leading-none select-none">
                T
              </span>
            </button>

            {/* نوع الخط (aA) - يفتح لوحة التحكم على تعديل النص */}
            <button
              type="button"
              onClick={() => onSelectTool('fontFamily')}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:text-[#0071e3] hover:bg-black/[0.05] active:scale-95 transition-all cursor-pointer"
              title="نوع الخط (aA) - فتح في لوحة التحكم"
              aria-label="نوع الخط"
            >
              <span className="font-sans font-bold leading-none tracking-tight flex items-baseline select-none">
                <span className="text-[13px]">a</span>
                <span className="text-[11px] font-extrabold text-[#0071e3]">A</span>
              </span>
            </button>

            {/* إضافة رابط (Link) */}
            <button
              type="button"
              onClick={() => onSelectTool('link')}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                selectedElement?.linkUrl
                  ? 'bg-[#0071e3]/15 text-[#0071e3] ring-1 ring-[#0071e3]/40'
                  : 'text-neutral-700 hover:text-[#0071e3] hover:bg-black/[0.05] active:scale-95'
              }`}
              title="إضافة رابط (Link) - فتح في لوحة التحكم"
              aria-label="رابط"
            >
              <Link2 size={15} strokeWidth={2} />
            </button>
          </>
        )}

        {/* 8b. خيارات تعديل الماسك - تظهر عند تحديد عنصر ماسك مفرغ */}
        {selectedElement?.type === 'mask' && onUpdateElement && (
          <>
            <div className="h-4 w-px bg-black/[0.08] mx-0.5" />
            
            <div className="flex items-center gap-1.5 bg-neutral-100/80 px-2 py-1 rounded-lg">
              <span className="text-[10px] font-bold text-neutral-500 whitespace-nowrap">شكل الماسك:</span>
              <select
                value={selectedElement.content || 'circle'}
                onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
                className="text-[11px] font-bold text-neutral-800 bg-white hover:bg-neutral-50 px-2 py-1 rounded-md border border-black/[0.06] focus:border-[#0071e3] focus:outline-none cursor-pointer transition-all"
                title="اختر شكل التفريغ والقص الفني"
              >
                {MASK_SHAPES.map(mask => (
                  <option key={mask.id} value={mask.id}>
                    {mask.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-black/[0.08] mx-0.5" />
            <button
              type="button"
              onClick={() => onSelectTool('background')}
              className="h-7 px-2.5 text-[10px] font-extrabold bg-[#0071e3]/10 text-[#0071e3] hover:bg-[#0071e3]/15 rounded-lg flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-3xs"
              title="تغيير لون الإطار المصمت (مطابقة مع خلفية الشريحة لتبدو مفرغة بالكامل)"
            >
              <Palette size={11} strokeWidth={2.4} />
              <span>لون إطار الماسك</span>
            </button>
          </>
        )}

        {/* إذا كان عنصراً عاماً غير نصي، نظهر الروابط والجدول والمجموعة */}
        {!isTextEditing && !isSlideSelected && (
          <>
            <div className="h-4 w-px bg-black/[0.08] mx-0.5" />
            <button
              type="button"
              onClick={() => onSelectTool('link')}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                selectedElement?.linkUrl
                  ? 'bg-[#0071e3]/15 text-[#0071e3] ring-1 ring-[#0071e3]/40'
                  : 'text-neutral-600 hover:text-black hover:bg-black/[0.05] active:scale-95'
              }`}
              title="إضافة رابط (Link)"
              aria-label="رابط"
            >
              <Link2 size={15} strokeWidth={2} />
            </button>
            {selectedElement?.type !== 'image' && (
              <button
                type="button"
                onClick={() => onSelectTool('format')}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-black hover:bg-black/[0.05] active:scale-95 transition-all cursor-pointer"
                title="جدول (Table Grid)"
                aria-label="جدول"
              >
                <Grid3X3 size={15} strokeWidth={2} />
              </button>
            )}
            {selectedElement?.type === 'shape' && (
              <button
                type="button"
                onClick={onToggleGroupContainer}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  selectedElement?.isGroupContainer
                    ? 'bg-[#0071e3]/15 text-[#0071e3] ring-1 ring-[#0071e3]/40'
                    : 'text-neutral-600 hover:text-black hover:bg-black/[0.05] active:scale-95'
                }`}
                title={selectedElement?.isGroupContainer ? "إلغاء تفعيل المجموعة" : "تحويل لمجموعة (سحب العناصر فوقها يضمهم إليها)"}
                aria-label="تفعيل المجموعة"
              >
                <CreditCard size={15} strokeWidth={2} />
              </button>
            )}
          </>
        )}

        <div className="h-4 w-px bg-black/[0.08] mx-0.5" />

        {/* 9. أيقونة Animation */}
        {!isSlideSelected && (
          <button
            type="button"
            onClick={() => onSelectTool('animation')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-black hover:bg-black/[0.05] active:scale-95 transition-all cursor-pointer"
            title="الحركات والتأثيرات (Animation)"
            aria-label="حركات"
          >
            <Zap size={15} strokeWidth={2} />
          </button>
        )}

        {/* 10. أيقونة الطبقات */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onSelectTool('layers')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-black hover:bg-black/[0.05] active:scale-95 transition-all cursor-pointer"
            title="الطبقات (Layers)"
            aria-label="طبقات"
          >
            <Layers size={15} strokeWidth={2} />
          </button>

          {!isSlideSelected && selectedElement?.type !== 'image' && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={onMoveLayerUp}
                className="w-6 h-7 sm:w-7 sm:h-8 rounded-md flex items-center justify-center text-neutral-600 hover:text-black hover:bg-black/[0.05] active:scale-95 transition-all cursor-pointer"
                title="تحريك لأعلى الطبقة"
                aria-label="طبقة لأعلى"
              >
                <ChevronUp size={14} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={onMoveLayerDown}
                className="w-6 h-7 sm:w-7 sm:h-8 rounded-md flex items-center justify-center text-neutral-600 hover:text-black hover:bg-black/[0.05] active:scale-95 transition-all cursor-pointer"
                title="تحريك لأسفل الطبقة"
                aria-label="طبقة لأسفل"
              >
                <ChevronDown size={14} strokeWidth={2.2} />
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-black/[0.08] mx-0.5" />

        {/* 11. أيقونة Copy (تكرار ومضاعفة) - لا تفتح لوحة التحكم */}
        <button
          type="button"
          onClick={onDuplicate}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-black hover:bg-black/[0.05] active:scale-95 transition-all cursor-pointer"
          title="مضاعفة العنصر (Copy - تعديل مباشر)"
          aria-label="مضاعفة"
        >
          <Copy size={15} strokeWidth={2} />
        </button>

        {/* 12. أيقونة القفل (Lock) - لا تفتح لوحة التحكم */}
        <button
          type="button"
          onClick={onToggleLock}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            isLocked 
              ? 'bg-amber-500/15 text-amber-600' 
              : 'text-neutral-600 hover:text-black hover:bg-black/[0.05] active:scale-95'
          }`}
          title={isLocked ? "إلغاء القفل (تعديل مباشر)" : "قفل العنصر (تعديل مباشر)"}
          aria-label="قفل"
        >
          {isLocked ? <Lock size={15} strokeWidth={2} /> : <Unlock size={15} strokeWidth={2} />}
        </button>

        {/* أيقونة إضافة (+) - تظهر فقط عندما لا يكون نصاً قيد التعديل */}
        {!isTextEditing && (
          <button
            type="button"
            onClick={() => onSelectTool('elements')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-[#0071e3] hover:bg-black/[0.05] active:scale-95 transition-all cursor-pointer"
            title="إضافة عنصر جديد (+) - فتح لوحة العناصر"
            aria-label="إضافة"
          >
            <Plus size={16} strokeWidth={2.2} />
          </button>
        )}

        {/* 13. أيقونة Wee AI */}
        {selectedElement && (
          <button
            type="button"
            onClick={() => onSelectTool('wee-ai')}
            className="h-7 sm:h-8 px-2 rounded-lg flex items-center gap-1 text-purple-600 hover:bg-purple-50 active:scale-95 transition-all font-medium text-xs cursor-pointer"
            title="مساعد Wee AI (فتح في لوحة التحكم)"
            aria-label="Wee AI"
          >
            <Sparkles size={14} className="text-purple-600" />
            <span className="text-[11px] font-semibold text-purple-700 hidden sm:inline">Wee AI</span>
          </button>
        )}

      </div>
    </div>
  );
};

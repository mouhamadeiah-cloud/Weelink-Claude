// Moved verbatim from RightDrawer.tsx (was an inline IIFE in the drawer body).
import React from 'react';
import { Check } from 'lucide-react';
import { CanvasElement, Slide, getGlowShadowStyle, getTextShadowParts } from '../../../types';
import { RightDrawerProps } from '../types';
import { elementDisplayName } from '../../../utils/elementLabels';

interface ShadowSectionProps {
  activeSlide: Slide;
  customColors: [string, string, string, string, string];
  onUpdateElementStyles: RightDrawerProps['onUpdateElementStyles'];
  onUpdateSlideGlow: RightDrawerProps['onUpdateSlideGlow'];
  selectedElement: RightDrawerProps['selectedElement'];
  setShadowTarget: React.Dispatch<React.SetStateAction<'element' | 'slide'>>;
  shadowTarget: 'element' | 'slide';
  styles: CanvasElement['styles'];
  // The one-page panel edits what is selected only: the element, or the slide when none is.
  fixedTarget?: boolean;
}

export const ShadowSection = ({
  activeSlide,
  customColors,
  onUpdateElementStyles,
  onUpdateSlideGlow,
  selectedElement,
  setShadowTarget,
  shadowTarget,
  styles,
  fixedTarget = false,
}: ShadowSectionProps) => {
  const isTargetElement = shadowTarget === 'element' && !!selectedElement;
  // A text's shadow can fall on its letters or on its frame; the letters are what people mean.
  const isTextElement = isTargetElement && ['heading', 'paragraph', 'button', 'badge'].includes(selectedElement!.type);
  const [shadowOn, setShadowOn] = React.useState<'letters' | 'frame'>('letters');
  const onLetters = isTextElement && shadowOn === 'letters';

  // Read values based on target (glowIntensity/glowColor/glowPosition maps to outer shadow/glow)
  const activeShadowIntensity = onLetters
    ? (styles.textShadowIntensity ?? 0)
    : isTargetElement 
    ? (styles.glowIntensity ?? 0) 
    : (activeSlide?.glowIntensity ?? 0);
  const activeShadowColor = onLetters
    ? (styles.textShadowColor || '#1d1d1f')
    : isTargetElement 
    ? (styles.glowColor || '#1d1d1f') 
    : (activeSlide?.glowColor || '#1d1d1f');
  const activeShadowPosition = onLetters
    ? (styles.textShadowPosition || 'center')
    : isTargetElement 
    ? (styles.glowPosition || 'center') 
    : (activeSlide?.glowPosition || 'center');

  // Update functions
  const updateShadowIntensity = (intensity: number) => {
    if (onLetters) {
      onUpdateElementStyles({ textShadowIntensity: intensity });
    } else if (isTargetElement) {
      onUpdateElementStyles({ glowIntensity: intensity });
    } else if (activeSlide) {
      onUpdateSlideGlow?.(activeSlide.id, { glowIntensity: intensity });
    }
  };

  const updateShadowColor = (color: string) => {
    if (onLetters) {
      onUpdateElementStyles({ textShadowColor: color });
    } else if (isTargetElement) {
      onUpdateElementStyles({ glowColor: color });
    } else if (activeSlide) {
      onUpdateSlideGlow?.(activeSlide.id, { glowColor: color });
    }
  };

  const updateShadowPosition = (pos: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => {
    if (onLetters) {
      onUpdateElementStyles({ textShadowPosition: pos });
    } else if (isTargetElement) {
      onUpdateElementStyles({ glowPosition: pos });
    } else if (activeSlide) {
      onUpdateSlideGlow?.(activeSlide.id, { glowPosition: pos });
    }
  };

  // 50 basic colors
  const BASIC_50_COLORS = [
    '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b',
    '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412',
    '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#854d0e',
    '#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d',
    '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59',
    '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75',
    '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af',
    '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8',
    '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d',
    '#ffffff', '#f3f4f6', '#e5e7eb', '#4b5563', '#111827'
  ];

  // 9 Directions
  const DIRECTION_CELLS = [
    { id: 'top-left', label: 'أعلى يسار', name: 'زاوية علوية يسار' },
    { id: 'top', label: 'أعلى', name: 'أعلى الوسط' },
    { id: 'top-right', label: 'أعلى يمين', name: 'زاوية علوية يمين' },
    { id: 'left', label: 'يسار', name: 'الوسط يسار' },
    { id: 'center', label: 'الوسط', name: 'من جميع الجهات' },
    { id: 'right', label: 'يمين', name: 'الوسط يمين' },
    { id: 'bottom-left', label: 'أسفل يسار', name: 'زاوية سفلية يسار' },
    { id: 'bottom', label: 'أسفل', name: 'أسفل الوسط' },
    { id: 'bottom-right', label: 'أسفل يمين', name: 'زاوية سفلية يمين' },
  ] as const;

  return (
    <div className="space-y-4 text-right" dir="rtl">
                  
      {/* Target Scope Switcher */}
      {selectedElement && !fixedTarget && (
        <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
          <button
            onClick={() => setShadowTarget('element')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              shadowTarget === 'element' 
                ? 'bg-white text-[#0071e3] shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            العنصر المختار
          </button>
          <button
            onClick={() => setShadowTarget('slide')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              shadowTarget === 'slide' 
                ? 'bg-white text-[#0071e3] shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            الشريحة الحالية
          </button>
        </div>
      )}

      {isTextElement && (
        <div role="radiogroup" aria-label="مكان الظل" className="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1 text-[12px] font-bold">
          {([['letters', 'حروف النص'], ['frame', 'إطار العنصر']] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={shadowOn === k}
              onClick={() => setShadowOn(k)}
              className={`h-8 rounded-lg transition-colors cursor-pointer ${shadowOn === k ? 'bg-white text-[#0071e3] shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="bg-[#0071e3]/5 border border-[#0071e3]/10 p-2.5 rounded-xl text-center">
        <span className="text-[11px] font-bold text-[#0071e3]">
          {onLetters
            ? `تعديل ظل حروف: ${elementDisplayName(selectedElement)}`
            : isTargetElement 
            ? `تعديل ظل العنصر: ${elementDisplayName(selectedElement)}` 
            : `تعديل ظل الشريحة: ${activeSlide?.name || 'الشريحة الحالية'}`}
        </span>
      </div>

      {/* أولاً: درجة الظلال الخارجي */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-neutral-700 font-bold">درجة وشدة الظل:</span>
          <span className="font-mono text-[#0071e3] font-bold">{activeShadowIntensity}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="50"
          value={activeShadowIntensity}
          onChange={(e) => updateShadowIntensity(Number(e.target.value))}
          className="w-full accent-[#0071e3] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
          <span>إيقاف (0px)</span>
          <span>متوسط (25px)</span>
          <span>شديد (50px)</span>
        </div>
      </div>

      {/* ثانياً: لون الظل */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-neutral-800 block">
          لون الظل الخارجي:
        </span>

        {/* أ. ألوان الصفحة الافتراضية */}
        <div className="space-y-1">
          <span className="text-[10px] text-neutral-400 font-semibold block">
            ألوان الصفحة الافتراضية:
          </span>
          <div className="flex gap-2 p-1.5 bg-neutral-50 rounded-xl border border-neutral-200/65">
            {customColors.map((hex, idx) => {
              const isSelected = activeShadowColor.toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={`shadow-palette-color-${idx}-${hex}`}
                  onClick={() => updateShadowColor(hex)}
                  className={`w-7 h-7 rounded-full border border-black/10 transition-all hover:scale-125 cursor-pointer shadow-3xs flex items-center justify-center ${
                    isSelected ? 'ring-2 ring-[#0071e3] scale-110 z-10' : ''
                  }`}
                  style={{ backgroundColor: hex }}
                  title={`لون الصفحة ${idx + 1}: ${hex}`}
                >
                  {isSelected && (
                    <Check 
                      size={12} 
                      className={['#ffffff', '#e5e5ea', '#f5f5f7'].includes(hex.toLowerCase()) ? 'text-black' : 'text-white'} 
                      strokeWidth={3} 
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ب. الخمسين لون الأساسية */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-neutral-400 font-semibold block">
              الخمسون لوناً الأساسية:
            </span>
            <span className="text-[9px] text-neutral-400 font-mono" dir="ltr">50 basic colors</span>
          </div>
          <div className="p-2 bg-neutral-50 rounded-2xl border border-neutral-200/70 max-h-40 overflow-y-auto pr-1">
            <div className="grid grid-cols-10 gap-1.5">
              {BASIC_50_COLORS.map((hex, idx) => {
                const isSelected = activeShadowColor.toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={`shadow-basic-color-${idx}-${hex}`}
                    onClick={() => updateShadowColor(hex)}
                    className={`w-5 h-5 rounded-md border border-black/10 transition-all hover:scale-125 cursor-pointer shadow-4xs flex items-center justify-center ${
                      isSelected ? 'ring-2 ring-[#0071e3] scale-110 z-10' : ''
                    }`}
                    style={{ backgroundColor: hex }}
                    title={hex}
                  >
                    {isSelected && (
                      <Check 
                        size={10} 
                        className={['#ffffff', '#f3f4f6', '#e5e7eb'].includes(hex.toLowerCase()) ? 'text-black' : 'text-white'} 
                        strokeWidth={3} 
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* منتقي لون حر مخصص */}
        <div className="flex items-center gap-1.5 bg-neutral-50 p-1.5 rounded-xl border border-neutral-200">
          <input
            type="color"
            value={activeShadowColor.startsWith('#') ? activeShadowColor : '#1d1d1f'}
            onChange={(e) => updateShadowColor(e.target.value)}
            className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent shrink-0 shadow-3xs"
          />
          <input
            type="text"
            value={activeShadowColor}
            onChange={(e) => updateShadowColor(e.target.value)}
            placeholder="اختر لوناً حراً"
            className="flex-1 text-[11px] px-2 py-1 bg-white rounded-md border border-neutral-200 font-mono text-left"
            dir="ltr"
          />
        </div>
      </div>

      {/* ثالثاً: مربعات خفيفة تبرز مربعات رمادية مطبق عليها الظلال من الخارج */}
      <div className="space-y-2 pt-1">
        <span className="text-xs font-bold text-neutral-800 block">
          توجيه اتجاه وزاوية الظل:
        </span>
        <p className="text-[10px] text-neutral-500 leading-tight">
          {onLetters
            ? 'انقر على المربع لتوجيه ظل الحروف في الاتجاه المرغوب:'
            : 'انقر على المربع لتوجيه الظل في الاتجاه المرغوب. تبرز المعاينات شكل الظل الخارجي المطبق على مربع رمادي افتراضي:'}
        </p>

        {/* 3x3 Grid of Direction Previews */}
        <div className="bg-neutral-100 p-3 rounded-2xl border border-neutral-200/80 flex justify-center items-center">
          <div className="grid grid-cols-3 gap-3.5 max-w-[240px] w-full">
            {DIRECTION_CELLS.map((cell) => {
              const isSelected = activeShadowPosition === cell.id;
              const previewIntensity = activeShadowIntensity > 0 ? Math.min(activeShadowIntensity, 16) : 10;
              const boxPreviewShadow = getGlowShadowStyle(previewIntensity, activeShadowColor, cell.id, false);
              const letterParts = getTextShadowParts(previewIntensity, activeShadowColor, cell.id);
              const letterPreview = letterParts ? `${letterParts.x}px ${letterParts.y}px ${Math.min(letterParts.blur, 8)}px ${letterParts.color}` : undefined;

              return (
                <button
                  key={`shadow-dir-${cell.id}`}
                  onClick={() => updateShadowPosition(cell.id)}
                  className={`relative aspect-square rounded-xl p-1 transition-all flex flex-col items-center justify-center cursor-pointer border-2 bg-white ${
                    isSelected
                      ? 'border-[#0071e3] bg-[#0071e3]/5 shadow-xs scale-105 z-10'
                      : 'border-transparent hover:border-neutral-300'
                  }`}
                  title={cell.name}
                >
                  <div 
                    className={`w-9 h-9 rounded-lg transition-all flex items-center justify-center ${onLetters ? 'bg-white' : 'bg-neutral-300 border border-neutral-300/40'}`}
                    style={onLetters ? undefined : { boxShadow: boxPreviewShadow }}
                  >
                    {onLetters && <span className="text-[22px] font-black leading-none text-neutral-700 pointer-events-none" style={{ textShadow: letterPreview }}>أ</span>}
                    {isSelected ? (
                      <span className="w-4 h-4 rounded-full bg-[#0071e3] text-white flex items-center justify-center font-bold shadow-4xs shrink-0 z-20">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    ) : onLetters ? null : (
                      <span className="text-[8.5px] font-bold text-neutral-500/80 pointer-events-none select-none z-10">
                        {cell.label}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};
